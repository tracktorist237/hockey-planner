"""Static gate contract plus failure-state simulation; never contacts a VPS.

GitHub needs semantics: failed/cancelled/skipped dependencies skip downstream jobs
unless an overriding condition is present. Lock that exact configuration here.
"""
import copy
import pathlib
import unittest
import yaml

ROOT = pathlib.Path(__file__).resolve().parents[2]


def load(name):
    return yaml.safe_load((ROOT / ".github/workflows" / name).read_text(encoding="utf-8"))


def verify(staging, validation):
    deploy = staging["jobs"]["deploy"]
    assert deploy["needs"] == "validation", "Deploy must depend on validation"
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
    assert steps[0]['env']['EXPECTED_SHA'] == '${{ github.sha }}'
    command = next(step for step in steps if 'deploy_frontend_ssh.py' in step.get('run', ''))
    assert command['env']['HP93_APPROVED_HEAD'] == '${{ vars.HP93_APPROVED_HEAD }}'
    assert command['env']['STAGING_KNOWN_HOSTS'] == '${{ secrets.STAGING_KNOWN_HOSTS }}'
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


class WorkflowGateTests(unittest.TestCase):
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
