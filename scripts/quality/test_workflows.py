"""Trigger/dependency/secret contracts; production and PR isolation stay intact."""
import copy
from pathlib import Path
import unittest
from unittest.mock import patch
import yaml

ROOT = Path(__file__).resolve().parents[2]
GUARD = "github.event_name == 'push' && github.ref == 'refs/heads/develop' && github.repository == 'tracktorist237/hockey-planner'"
ACTIVE = GUARD + " && vars.HP95_STAGING_AUTODEPLOY == 'protected-develop-merged-pr-v1'"
READS = {'contents': 'read', 'actions': 'read', 'pull-requests': 'read'}


def load(name):
    return yaml.safe_load((ROOT / '.github/workflows' / name).read_text(encoding='utf-8'))


def verify(staging, validation):
    assert staging.get('on', staging.get(True)) == {'push': {'branches': ['develop']}}
    assert staging['permissions'] == {'contents': 'read'}
    assert staging['concurrency'] == {'group': 'frontend-staging', 'cancel-in-progress': False}
    assert set(staging['jobs']) == {'validation', 'admission', 'deploy', 'smoke'}
    assert staging['jobs']['validation'] == {'uses': './.github/workflows/validate.yml'}
    admission, deploy, smoke = [staging['jobs'][key] for key in ('admission', 'deploy', 'smoke')]
    assert admission['needs'] == 'validation' and admission['if'] == ACTIVE
    assert 'environment' not in admission and 'secrets.' not in str(admission)
    assert admission['permissions'] == deploy['permissions'] == READS
    assert admission['steps'][-1]['run'] == 'python scripts/quality/staging_admission.py --wait'
    assert deploy['needs'] == ['validation', 'admission'] and deploy['if'] == ACTIVE
    assert deploy['environment'] == smoke['environment'] == 'staging-smoke'
    assert smoke['needs'] == 'deploy' and smoke['if'] == GUARD
    assert 'HP93_APPROVED_HEAD' not in str(staging)
    for job in (admission, deploy, smoke):
        assert not job.get('continue-on-error', False)
        for step in job['steps']:
            if not step.get('uses', '').startswith('actions/upload-artifact'):
                assert 'if' not in step and not step.get('continue-on-error', False)
        checkout = next(step for step in job['steps'] if step.get('uses', '').startswith('actions/checkout'))
        assert checkout['with'] == {'ref': '${{ github.sha }}', 'persist-credentials': False}
    # Repeat before secret binding and again inside the transport, with no receipt bypass.
    steps = deploy['steps']
    gate, command = steps[-2:]
    assert gate['run'] == 'python scripts/quality/staging_admission.py --check'
    assert gate['env'] == admission['steps'][-1]['env'] == {
        'GH_TOKEN': '${{ github.token }}', 'HP95_STAGING_AUTODEPLOY': '${{ vars.HP95_STAGING_AUTODEPLOY }}'}
    assert command['run'] == 'python scripts/quality/deploy_frontend_ssh.py --expected-sha "$EXPECTED_SHA"'
    assert command['env'] == {**gate['env'], 'EXPECTED_SHA': '${{ github.sha }}',
        **{key: '${{ secrets.' + key + ' }}' for key in ('VPS_HOST', 'VPS_USER', 'VPS_SSH_KEY', 'STAGING_KNOWN_HOSTS')}}
    assert 'secrets.' not in str({key: value for key, value in deploy.items() if key != 'steps'})
    assert all('secrets.' not in str(step) for step in steps[:-1])
    assert all('ssh-action' not in step.get('uses', '') for step in steps)
    command = next(step for step in smoke['steps'] if 'smoke.py' in step.get('run', ''))
    assert '--kind frontend --expected "$EXPECTED_SHA"' in command['run']
    assert command['env']['EXPECTED_SHA'] == '${{ github.sha }}'
    assert command['env']['STAGING_DIAGNOSTIC_KEY'] == '${{ secrets.STAGING_DIAGNOSTIC_KEY }}'
    backend = next(step for step in smoke['steps'] if step.get('with', {}).get('repository'))
    assert backend['with']['ref'] == '662df5e4c03902df821385c50c424072a985c0a5'
    for step in smoke['steps']:
        if step.get('uses', '').startswith('actions/upload-artifact'):
            assert step['with']['path'] in ('staging-smoke/summary.json', 'staging-smoke/browser/')
            assert 'hashFiles' in step['if'] and step['with']['retention-days'] == 7
    job = validation['jobs']['validate']
    assert not job.get('continue-on-error', False)
    assert job['steps'][0]['with'] == {'ref': '${{ github.sha }}', 'fetch-depth': 0, 'persist-credentials': False}
    backend_checkout = next(step for step in job['steps'] if step.get('with', {}).get('repository'))
    assert backend_checkout['with']['fetch-depth'] == 0, 'HP-75 historical migration fixture needs complete history'
    commands = []
    for step in job['steps']:
        if 'run' in step:
            assert not step.get('continue-on-error', False) and 'if' not in step
            assert '|| true' not in step['run']
            commands.append(step['run'])
    joined = '\n'.join(commands)
    for required in ('git diff --check', 'npm ci', 'npm test -- --watchAll=false', 'npm run build',
                     'npm run e2e:ci', 'playwright install --with-deps chromium webkit',
                     'node scripts/staging/test-local.cjs', 'test_staging_smoke.py'):
        assert required in joined
    pr = load('frontend-pr-checks.yml')
    assert pr['jobs']['validation'] == {'uses': './.github/workflows/validate.yml'}
    assert pr['permissions'] == validation['permissions'] == {'contents': 'read'}
    for workflow in (pr, validation):
        assert 'pull_request_target' not in workflow.get('on', workflow.get(True, {}))
        assert 'VPS_' not in str(workflow) and 'STAGING_KNOWN_HOSTS' not in str(workflow)
        for job in workflow['jobs'].values():
            assert 'environment' not in job and 'secrets' not in job and 'secrets.' not in str(job)


class WorkflowGateTests(unittest.TestCase):
    def test_workflows_parse_and_deploy_is_gated(self):
        for path in (ROOT / '.github/workflows').glob('*.yml'):
            self.assertIsInstance(yaml.safe_load(path.read_text(encoding='utf-8')), dict)
        verify(load('deploy-staging-vps.yml'), load('validate.yml'))

    def test_gate_and_secret_order_mutations_are_detected(self):
        original, validation = load('deploy-staging-vps.yml'), load('validate.yml')
        mutations = (
            lambda w: w['concurrency'].update({'cancel-in-progress': True}),
            lambda w: w['jobs']['admission'].update(environment='staging-smoke'),
            lambda w: w['jobs']['admission'].update(needs=[]),
            lambda w: w['jobs']['admission'].update({'if': 'always()'}),
            lambda w: w['jobs']['deploy'].update(needs='validation'),
            lambda w: w['jobs']['deploy'].update({'if': 'always()'}),
            lambda w: w['jobs']['deploy'].pop('environment'),
            lambda w: w['jobs']['deploy'].update(environment='unprotected'),
            lambda w: w['jobs']['deploy'].update({'continue-on-error': True}),
            lambda w: w['jobs']['deploy'].update(env={'PIN': '${{ secrets.STAGING_KNOWN_HOSTS }}'}),
            lambda w: w['jobs']['deploy']['steps'][0].update(env={'PIN': '${{ secrets.STAGING_KNOWN_HOSTS }}'}),
            lambda w: w['jobs']['deploy']['steps'][-2].update({'if': 'always()'}),
            lambda w: w['jobs']['deploy']['steps'][-2]['env'].update(HP95_STAGING_AUTODEPLOY='${{ github.sha }}'),
            lambda w: w['jobs']['deploy']['steps'].insert(0, w['jobs']['deploy']['steps'].pop()),
            lambda w: w['jobs']['deploy']['steps'][0]['with'].update(ref='develop'),
            lambda w: w['jobs']['smoke'].update(needs='validation'),
            lambda w: w['jobs']['smoke'].update({'if': 'always()'}),
            lambda w: w['jobs']['smoke'].update({'continue-on-error': True}),
            lambda w: next(s for s in w['jobs']['smoke']['steps'] if 'smoke.py' in s.get('run', ''))['env'].update(EXPECTED_SHA='develop'),
        )
        for index, mutate in enumerate(mutations):
            with self.subTest(mutation=index):
                changed = copy.deepcopy(original)
                mutate(changed)
                with self.assertRaises((AssertionError, KeyError)):
                    verify(changed, validation)

    def test_pr_ci_cannot_acquire_environment_or_secrets(self):
        staging, validation = load('deploy-staging-vps.yml'), load('validate.yml')
        for which in ('pr', 'validation'):
            changed = copy.deepcopy(validation if which == 'validation' else load('frontend-pr-checks.yml'))
            next(iter(changed['jobs'].values()))['environment'] = 'staging-smoke'
            with self.subTest(which=which), self.assertRaises(AssertionError):
                if which == 'validation':
                    verify(staging, changed)
                else:
                    with patch(__name__ + '.load', return_value=changed):
                        verify(staging, validation)
        changed = copy.deepcopy(validation)
        next(s for s in changed['jobs']['validate']['steps'] if 'run' in s)['continue-on-error'] = True
        with self.assertRaises(AssertionError):
            verify(staging, changed)


if __name__ == '__main__':
    unittest.main()
