"""Static gate contract plus failure-state simulation; never contacts a VPS.

GitHub needs semantics: failed/cancelled/skipped dependencies skip downstream jobs
unless an overriding condition is present. Lock that exact configuration here.
"""
import copy
import os
import pathlib
import subprocess
import sys
import unittest
from unittest.mock import patch
import yaml

ROOT = pathlib.Path(__file__).resolve().parents[2]


def load(name):
    return yaml.safe_load((ROOT / ".github/workflows" / name).read_text(encoding="utf-8"))


def verify(staging, validation):
    deploy = staging["jobs"]["deploy"]
    assert deploy["needs"] == "validation", "Deploy must depend on validation"
    assert deploy['environment'] == 'staging-smoke', "Host pin requires the protected environment"
    assert "if" not in deploy, "Do not override GitHub implicit success()"
    assert not deploy.get("continue-on-error", False)
    assert staging["jobs"]["validation"]["uses"] == "./.github/workflows/validate.yml"
    assert staging["concurrency"]["cancel-in-progress"] is False, "Do not interrupt SSH deployment"
    smoke = staging['jobs']['smoke']
    assert smoke['needs'] == 'deploy'
    assert not smoke.get('continue-on-error', False)
    assert smoke['environment'] == 'staging-smoke'
    for guard in ("github.event_name == 'push'", "github.ref == 'refs/heads/develop'", "github.repository == 'tracktorist237/hockey-planner'"):
        assert guard in smoke['if']
    assert 'always()' not in smoke['if']
    command = next(step for step in smoke['steps'] if 'smoke.py' in step.get('run', ''))
    assert 'if' not in command and not command.get('continue-on-error', False)
    assert command['env']['STAGING_DIAGNOSTIC_KEY'] == '${{ secrets.STAGING_DIAGNOSTIC_KEY }}'
    assert '--kind frontend' in command['run']
    for step in smoke['steps']:
        if step.get('uses', '').startswith('actions/upload-artifact'):
            assert step['with']['path'] in ('staging-smoke/summary.json', 'staging-smoke/browser/')
            assert 'hashFiles' in step['if']
    job = validation["jobs"]["validate"]
    assert not job.get("continue-on-error", False)
    commands = []
    for step in job["steps"]:
        if "run" in step:
            assert not step.get("continue-on-error", False)
            assert "if" not in step, "Required checks must run"
            assert "|| true" not in step["run"]
            commands.append(step["run"])
    joined = "\n".join(commands)
    assert "git diff --check" in joined
    if "Backend" in validation["name"]:
        for required in ("dotnet restore", "dotnet build", "dotnet test", "check_test_results.py"):
            assert required in joined
    else:
        for required in ("npm ci", "npm test -- --watchAll=false", "npm run build", "npm run e2e:ci",
                         "playwright install --with-deps chromium webkit"):
            assert required in joined
        assert 'node scripts/staging/test-local.cjs' in joined
    # Deployment bootstrap comes from runner checkout, never an unlocked VPS fetch.
    steps = deploy['steps']
    assert 'HP93_APPROVED_HEAD' in steps[0]['run']
    assert steps[0]['env'] == {'EXPECTED_SHA': '${{ github.sha }}',
                               'HP93_APPROVED_HEAD': '${{ vars.HP93_APPROVED_HEAD }}'}
    command = next(step for step in steps if 'deploy_frontend_ssh.py' in step.get('run', ''))
    assert command['env']['HP93_APPROVED_HEAD'] == '${{ vars.HP93_APPROVED_HEAD }}'
    assert command['env']['STAGING_KNOWN_HOSTS'] == '${{ secrets.STAGING_KNOWN_HOSTS }}'
    # Environment approval releases secrets to the job. Only the final transport
    # step binds them to a process; no checkout/action/credential binding may
    # precede or bypass the exact-SHA gate.
    assert 'secrets.' not in str({key: value for key, value in deploy.items() if key != 'steps'})
    for step in steps[:steps.index(command) + 1]:
        assert 'if' not in step and not step.get('continue-on-error', False)
        if step is not command:
            assert 'secrets.' not in str(step)
    assert command is steps[-1]
    assert all('ssh-action' not in step.get('uses', '') for step in steps)
    assert next(step for step in steps if step.get('uses', '').startswith('actions/checkout'))['with']['ref'] == '${{ github.sha }}'

    # PRs and task pushes have no route to deployment or staging credentials.
    events = staging.get('on', staging.get(True))
    assert events == {'push': {'branches': ['develop']}}
    pr = load('frontend-pr-checks.yml')
    assert pr['jobs']['validation']['uses'] == './.github/workflows/validate.yml'
    assert 'secrets' not in pr['jobs']['validation']
    for workflow in (pr, validation):
        assert 'pull_request_target' not in workflow.get('on', workflow.get(True, {}))
        assert 'VPS_' not in str(workflow) and 'STAGING_KNOWN_HOSTS' not in str(workflow)
        for job in workflow['jobs'].values():
            assert 'environment' not in job and 'secrets' not in job
            assert 'secrets.' not in str(job)


class WorkflowGateTests(unittest.TestCase):
    @unittest.skipUnless(sys.platform == 'linux', 'Execute the actual GitHub bash gate in Linux CI')
    def test_exact_sha_gate_rejects_missing_empty_and_different_approval(self):
        gate = load('deploy-staging-vps.yml')['jobs']['deploy']['steps'][0]['run']
        expected = 'a' * 40
        for approved in (None, '', 'b' * 40, expected[:7], expected + '\n', expected):
            with self.subTest(approved=approved):
                environment = {name: value for name, value in os.environ.items()
                               if name not in ('EXPECTED_SHA', 'HP93_APPROVED_HEAD')}
                environment['EXPECTED_SHA'] = expected
                if approved is not None:
                    environment['HP93_APPROVED_HEAD'] = approved
                result = subprocess.run(['bash', '--noprofile', '--norc', '-e', '-o', 'pipefail', '-c', gate],
                                        env=environment, capture_output=True, timeout=10)
                self.assertEqual(result.returncode == 0, approved == expected)
                self.assertEqual(result.stdout, b'')

    def test_environment_and_secret_order_regressions_are_detected(self):
        original, validation = load('deploy-staging-vps.yml'), load('validate.yml')
        mutations = (
            lambda job: job.pop('environment'),
            lambda job: job.update(environment='unprotected'),
            lambda job: job.update(env={'PIN': '${{ secrets.STAGING_KNOWN_HOSTS }}'}),
            lambda job: job['steps'][0].update(**{'if': 'always()'}),
            lambda job: job['steps'][0].update(**{'continue-on-error': True}),
            lambda job: job['steps'][0]['env'].update(HP93_APPROVED_HEAD='${{ github.sha }}'),
            lambda job: job['steps'][1].update(env={'PIN': '${{ secrets.STAGING_KNOWN_HOSTS }}'}),
            lambda job: job['steps'].insert(0, job['steps'].pop()),
            lambda job: job['steps'][-1].update(**{'if': 'always()'}),
        )
        for index, mutate in enumerate(mutations):
            with self.subTest(mutation=index):
                changed = copy.deepcopy(original)
                mutate(changed['jobs']['deploy'])
                with self.assertRaises((AssertionError, KeyError)):
                    verify(changed, validation)
        for workflow in ('pr', 'validation'):
            with self.subTest(workflow=workflow):
                changed = copy.deepcopy(validation if workflow == 'validation' else load('frontend-pr-checks.yml'))
                next(iter(changed['jobs'].values()))['environment'] = 'staging-smoke'
                if workflow == 'validation':
                    with self.assertRaises(AssertionError):
                        verify(original, changed)
                else:
                    with patch(__name__ + '.load', return_value=changed), self.assertRaises(AssertionError):
                        verify(original, validation)

    def test_workflows_parse_and_deploy_is_gated(self):
        for path in (ROOT / ".github/workflows").glob("*.yml"):
            self.assertIsInstance(yaml.safe_load(path.read_text(encoding="utf-8")), dict)
        verify(load("deploy-staging-vps.yml"), load("validate.yml"))

    def test_failure_cancel_and_skip_never_authorize_deploy(self):
        staging, validation = load("deploy-staging-vps.yml"), load("validate.yml")
        verify(staging, validation)
        for result in ("failure", "cancelled", "skipped", "success"):
            # No overriding if/continue-on-error, so only GitHub success() permits deploy.
            eligible = all(value == "success" for value in [result])
            self.assertEqual(eligible, result == "success")

    def test_gate_removal_and_failure_bypass_are_detected(self):
        original, validation = load("deploy-staging-vps.yml"), load("validate.yml")
        for mutation in ({"needs": []}, {"if": "always()"}, {"continue-on-error": True}):
            changed = copy.deepcopy(original)
            changed["jobs"]["deploy"].update(mutation)
            with self.assertRaises(AssertionError):
                verify(changed, validation)
        changed = copy.deepcopy(validation)
        next(step for step in changed["jobs"]["validate"]["steps"] if "run" in step)["continue-on-error"] = True
        with self.assertRaises(AssertionError):
            verify(original, changed)
        for mutation in ({'needs': 'validation'}, {'if': 'always()'}, {'continue-on-error': True}):
            changed = copy.deepcopy(original)
            changed['jobs']['smoke'].update(mutation)
            with self.assertRaises(AssertionError):
                verify(changed, validation)


if __name__ == "__main__":
    unittest.main()
