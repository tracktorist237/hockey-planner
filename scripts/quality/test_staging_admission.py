"""Synthetic GitHub HTTP shapes; no credentials, network or deployment.

Policy mutations execute the real admission code, not a parallel eligibility model.
Linux lock/cancellation/publication and HP-75 fixtures remain separate real tests.
"""
import copy
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import staging_admission as admission

SOURCE, HEAD, BEFORE = 'a' * 40, 'b' * 40, 'c' * 40
NOW, EARLIER, LATER = '2026-11-01T12:00:00Z', '2026-11-01T11:00:00Z', '2026-11-01T13:00:00Z'
REPO = {'id': admission.REPOSITORY_ID, 'full_name': admission.REPOSITORY}
REVIEW = f'Independent-Review: APPROVE {HEAD} https://example.invalid/separate-review'


class FakeGitHub:
    def __init__(self):
        self.event = {'ref': 'refs/heads/develop', 'before': BEFORE, 'after': SOURCE,
                      'forced': False, 'deleted': False, 'created': False,
                      'repository': REPO.copy(), 'sender': admission.OWNER.copy()}
        self.env = {admission.SWITCH: admission.ENABLED, 'GITHUB_REPOSITORY': admission.REPOSITORY,
                    'GITHUB_EVENT_NAME': 'push', 'GITHUB_REF': 'refs/heads/develop',
                    'GITHUB_REF_PROTECTED': 'true', 'GITHUB_SHA': SOURCE,
                    'GITHUB_ACTOR': 'tracktorist237', 'GITHUB_TRIGGERING_ACTOR': 'tracktorist237',
                    'GITHUB_WORKFLOW_REF': admission.REPOSITORY + '/' + admission.DEPLOY + '@refs/heads/develop',
                    'GITHUB_WORKFLOW_SHA': SOURCE, 'GITHUB_RUN_ID': '10', 'GITHUB_RUN_ATTEMPT': '1'}
        self.pr = {'number': 95, 'merged': True, 'state': 'closed', 'draft': False,
                   'merge_commit_sha': SOURCE, 'merged_at': NOW, 'merged_by': admission.OWNER.copy(),
                   'body': REVIEW, 'head': {'sha': HEAD, 'ref': 'quality/hp-95', 'repo': REPO.copy()},
                   'base': {'sha': BEFORE, 'ref': 'develop', 'repo': REPO.copy()}}
        self.rows = {
            'branches/develop': {'protected': True, 'commit': {'sha': SOURCE}, 'protection': {
                'required_status_checks': {'enforcement_level': 'everyone', 'checks': [
                    {'context': 'validation / Frontend quality gate', 'app_id': 15368}]}}},
            'commits/' + SOURCE: {'sha': SOURCE, 'commit': {'verification': {'verified': True, 'reason': 'valid'}},
                'committer': {'login': 'web-flow', 'id': 19864447}, 'parents': [{'sha': BEFORE}, {'sha': HEAD}]},
            'commits/' + SOURCE + '/pulls': [self.pr], 'pulls/95': self.pr,
        }
        self.deploy = self.run(10, SOURCE, admission.DEPLOY, 'push', 'develop')
        self.deploy.update(status='in_progress', conclusion=None)
        self.rows['actions/runs/10'] = self.deploy
        self.add_jobs(self.deploy, admission.QUALITY_JOBS)
        self.pr_validation = self.add_run(20, HEAD, admission.VALIDATION, 'pull_request', 'quality/hp-95', admission.QUALITY_JOBS)
        self.pr_security = self.add_run(30, HEAD, admission.SECURITY, 'pull_request', 'quality/hp-95', admission.SECURITY_JOBS)
        self.security = self.add_run(40, SOURCE, admission.SECURITY, 'push', 'develop', admission.SECURITY_JOBS)
        self.native = {'id': 100, 'name': 'CodeQL', 'app': {'id': 57789, 'slug': 'github-advanced-security'},
                       'head_sha': HEAD, 'status': 'completed', 'conclusion': 'success',
                       'started_at': EARLIER, 'completed_at': EARLIER}
        self.rows[f'commits/{HEAD}/check-runs?check_name=CodeQL&filter=latest'] = [self.native]

    def run(self, number, expected, path, event, branch):
        return {'id': number, 'head_sha': expected, 'path': path, 'event': event, 'head_branch': branch,
                'repository': REPO.copy(), 'head_repository': REPO.copy(), 'run_attempt': 1,
                'status': 'completed', 'conclusion': 'success', 'updated_at': EARLIER,
                'actor': admission.OWNER.copy(), 'triggering_actor': admission.OWNER.copy()}

    def add_jobs(self, run, names):
        self.rows[f"actions/runs/{run['id']}/attempts/1/jobs"] = [
            {'name': name, 'run_id': run['id'], 'head_sha': run['head_sha'], 'status': 'completed',
             'conclusion': 'success', 'started_at': EARLIER, 'completed_at': EARLIER} for name in names]

    def add_run(self, number, expected, path, event, branch, names):
        run = self.run(number, expected, path, event, branch)
        self.rows[f'actions/workflows/{path.rsplit("/", 1)[1]}/runs?head_sha={expected}&event={event}'] = [run]
        self.add_jobs(run, names)
        return run

    def get(self, path):
        return self.rows[path]

    def collection(self, path, key=None):
        return self.rows[path]

    def verify(self):
        return admission.verify(SOURCE, self.env, self.event, self)


class AdmissionTests(unittest.TestCase):
    def test_protected_develop_human_merge_admits_exact_source(self):
        api = FakeGitHub()
        self.assertEqual(api.verify(), {'sourceSha': SOURCE, 'reviewedHead': HEAD, 'pullRequest': 95,
                                       'validationRun': 10, 'attempt': 1, 'securityRun': 40})
        api.pr['body'] = 'Review report\r\n' + REVIEW + '\r\n'
        self.assertEqual(api.verify()['reviewedHead'], HEAD)

    def test_activation_event_repository_and_branch_matrix(self):
        changes = {admission.SWITCH: (None, '', 'false', 'true', SOURCE),
                   'GITHUB_REPOSITORY': ('fork/hockey-planner', 'tracktorist237/HockeyPlanner.Backend'),
                   'GITHUB_EVENT_NAME': ('pull_request', 'pull_request_target', 'workflow_dispatch', 'workflow_run'),
                   'GITHUB_REF': ('refs/heads/master', 'refs/heads/quality/hp-95', 'refs/pull/95/merge'),
                   'GITHUB_REF_PROTECTED': ('false', None), 'GITHUB_SHA': (HEAD, SOURCE[:7]),
                   'GITHUB_WORKFLOW_SHA': (HEAD,), 'GITHUB_WORKFLOW_REF': ('another-workflow',),
                   'GITHUB_ACTOR': ('other-human', 'github-actions[bot]'),
                   'GITHUB_TRIGGERING_ACTOR': ('other-human',)}
        for key, values in changes.items():
            for value in values:
                api = FakeGitHub()
                api.env[key] = value
                with self.subTest(key=key, value=value), self.assertRaises(admission.Blocked):
                    api.verify()

    def test_direct_push_unrelated_pr_and_review_bypass(self):
        mutations = [
            lambda a: a.rows['commits/' + SOURCE + '/pulls'].clear(),
            lambda a: a.rows['commits/' + SOURCE + '/pulls'].append(copy.deepcopy(a.pr)),
            lambda a: a.pr.update(merged=False), lambda a: a.pr.update(draft=True),
            lambda a: a.pr.update(merge_commit_sha=HEAD), lambda a: a.pr.update(state='open'),
            lambda a: a.pr['base'].update(ref='master'),
            lambda a: a.pr['base']['repo'].update(id=1), lambda a: a.pr['head']['repo'].update(full_name='fork/repo'),
            lambda a: a.pr['head'].update(sha=BEFORE), lambda a: a.pr['base'].update(sha=HEAD),
            lambda a: a.pr['merged_by'].update(type='Bot'), lambda a: a.pr['merged_by'].update(id=1),
            lambda a: a.event['sender'].update(login='other-human'),
            lambda a: a.event.update(after=HEAD), lambda a: a.event.update(before='0' * 40),
            lambda a: a.event.update(forced=True), lambda a: a.event.update(deleted=True),
            lambda a: a.event.update(created=True), lambda a: a.event['repository'].update(id=1),
            lambda a: a.rows['commits/' + SOURCE]['commit']['verification'].update(verified=False),
            lambda a: a.rows['commits/' + SOURCE]['committer'].update(login='someone'),
            lambda a: a.rows['commits/' + SOURCE].update(parents=[{'sha': BEFORE}]),
            lambda a: a.rows['commits/' + SOURCE]['parents'].reverse(),
            lambda a: a.rows['branches/develop'].update(protected=False),
            lambda a: a.rows['branches/develop']['commit'].update(sha=HEAD),
            lambda a: a.rows['branches/develop']['protection']['required_status_checks'].update(enforcement_level='non_admins'),
            lambda a: a.rows['branches/develop']['protection']['required_status_checks']['checks'][0].update(app_id=1),
        ]
        for body in ('', REVIEW.replace(HEAD, BEFORE), REVIEW.replace('APPROVE', 'CHANGES REQUIRED'),
                     REVIEW.replace('https://', 'http://'), REVIEW + '\n' + REVIEW,
                     '```text\n' + REVIEW + '\n```', '~~~\n' + REVIEW + '\n~~~',
                     REVIEW + '\nIndependent-Review: pending'):
            mutations.append(lambda a, body=body: a.pr.update(body=body))
        for index, mutate in enumerate(mutations):
            api = FakeGitHub()
            mutate(api)
            with self.subTest(mutation=index), self.assertRaises(admission.Blocked):
                api.verify()

    def test_every_required_ci_job_rejects_absent_pending_skipped_cancelled_failed_and_wrong_sha(self):
        fixture = FakeGitHub()
        paths = [key for key in fixture.rows if '/attempts/' in key]
        for path in paths:
            for index in range(len(fixture.rows[path])):
                mutations = [lambda rows, i=index: rows.pop(i), lambda rows, i=index: rows.append(copy.deepcopy(rows[i]))]
                for state in ('queued', 'in_progress', 'skipped', 'cancelled', 'failure', 'neutral', 'timed_out', None):
                    mutations.append(lambda rows, state=state, i=index: rows[i].update(conclusion=state))
                mutations.extend([lambda rows, i=index: rows[i].update(status='in_progress'),
                                  lambda rows, i=index: rows[i].update(head_sha=BEFORE),
                                  lambda rows, i=index: rows[i].update(run_id=999)])
                for mutate in mutations:
                    api = FakeGitHub()
                    mutate(api.rows[path])
                    with self.subTest(path=path, index=index, mutation=mutate), self.assertRaises(admission.Blocked):
                        api.verify()

    def test_workflow_provenance_failures_and_stale_attempts(self):
        for name in ('pr_validation', 'pr_security', 'security'):
            for key, value in (('head_sha', BEFORE), ('event', 'workflow_dispatch'), ('head_branch', 'master'),
                               ('path', admission.DEPLOY), ('conclusion', 'failure'), ('conclusion', 'cancelled'),
                               ('conclusion', 'skipped'), ('status', 'in_progress'), ('run_attempt', 2)):
                api = FakeGitHub()
                getattr(api, name)[key] = value
                with self.subTest(run=name, key=key, value=value), self.assertRaises((admission.Blocked, KeyError)):
                    api.verify()
        for name in ('pr_validation', 'pr_security'):
            api = FakeGitHub()
            getattr(api, name)['updated_at'] = LATER
            with self.assertRaises(admission.Blocked):
                api.verify()
        api = FakeGitHub()
        api.deploy['run_attempt'] = 2
        with self.assertRaises(admission.Blocked):
            api.verify()

    def test_new_failure_never_reuses_old_success_and_missing_security_is_pending(self):
        for path in (key for key in FakeGitHub().rows if key.startswith('actions/workflows/')):
            api = FakeGitHub()
            failed = dict(api.rows[path][0], id=999, conclusion='failure')
            api.rows[path].append(failed)
            with self.assertRaises(admission.Blocked):
                api.verify()
            api.rows[path].clear()
            with self.assertRaises(admission.Blocked):
                api.verify()
        api = FakeGitHub()
        api.security['status'] = 'in_progress'
        with self.assertRaises(admission.Pending):
            api.verify()

    def test_branch_advancing_during_checks_is_rejected(self):
        api = FakeGitHub()
        original, reads = api.get, []
        def get(path):
            if path == 'branches/develop':
                reads.append(path)
                if len(reads) == 2:
                    api.rows[path]['commit']['sha'] = HEAD
            return original(path)
        api.get = get
        with self.assertRaises(admission.Blocked):
            api.verify()

    def test_native_codeql_alert_result_cannot_be_replaced_by_upload_success(self):
        for key, value in (('head_sha', SOURCE), ('status', 'in_progress'), ('conclusion', 'failure'),
                           ('conclusion', 'skipped'), ('conclusion', 'cancelled'), ('conclusion', None),
                           ('completed_at', LATER), ('started_at', '2026-10-01T12:00:00Z')):
            api = FakeGitHub()
            api.native[key] = value
            with self.subTest(key=key, value=value), self.assertRaises(admission.Blocked):
                api.verify()
        for app in ({'id': 15368, 'slug': 'github-actions'}, {'id': 57789, 'slug': 'impostor'}):
            api = FakeGitHub()
            api.native['app'] = app
            with self.assertRaises(admission.Blocked):
                api.verify()
        api = FakeGitHub()
        path = f'commits/{HEAD}/check-runs?check_name=CodeQL&filter=latest'
        api.rows[path].append(dict(api.native, id=101, conclusion='failure'))
        with self.assertRaises(admission.Blocked):
            api.verify()
        api.rows[path].clear()
        with self.assertRaises(admission.Blocked):
            api.verify()

    def test_disabled_context_never_uses_git_token_or_network(self):
        api = FakeGitHub()
        api.env[admission.SWITCH] = ''
        with tempfile.TemporaryDirectory() as folder:
            event = Path(folder) / 'event.json'
            event.write_text(json.dumps(api.event))
            with patch.dict(os.environ, {**api.env, 'GITHUB_EVENT_PATH': str(event)}, clear=True), \
                    patch.object(admission, 'GitHub') as github, patch.object(admission.subprocess, 'check_output') as git:
                with self.assertRaises(admission.Blocked):
                    admission.admit(SOURCE)
                github.assert_not_called()
                git.assert_not_called()

    def test_pagination_and_api_failure_are_fail_closed_and_sanitized(self):
        api = admission.GitHub('synthetic-token')
        with patch.object(api, 'get', side_effect=[{'jobs': [{}] * 100}, {'jobs': [{'id': 2}]}]):
            self.assertEqual(len(api.collection('jobs', 'jobs')), 101)
        with patch.object(api, 'get', return_value={'jobs': [{}] * 100}), self.assertRaises(admission.Blocked):
            api.collection('jobs', 'jobs')
        with patch.object(admission.sys, 'argv', ['admission', '--check']), \
                patch.dict(os.environ, {'GITHUB_SHA': SOURCE}), \
                patch.object(admission, 'admit', side_effect=RuntimeError('SECRET_HTTP_BODY')), \
                patch('builtins.print') as output:
            self.assertEqual(admission.main(), 1)
            self.assertNotIn('SECRET_HTTP_BODY', str(output.call_args_list))

    def test_checkout_mismatch_timeout_and_pending_retry(self):
        api = FakeGitHub()
        with tempfile.TemporaryDirectory() as folder:
            event = Path(folder) / 'event.json'
            event.write_text(json.dumps(api.event))
            with patch.dict(os.environ, {**api.env, 'GITHUB_EVENT_PATH': str(event)}, clear=True), \
                    patch.object(admission, 'GitHub', return_value=api), \
                    patch.object(admission.subprocess, 'check_output', return_value=(HEAD + '\n').encode()):
                with self.assertRaises(admission.Blocked):
                    admission.admit(SOURCE)
            with patch.dict(os.environ, {**api.env, 'GITHUB_EVENT_PATH': str(event)}, clear=True), \
                    patch.object(admission, 'GitHub', return_value=api), \
                    patch.object(admission.subprocess, 'check_output', return_value=(SOURCE + '\n').encode()), \
                    patch.object(admission, 'verify', side_effect=[admission.Pending(), {'sourceSha': SOURCE}]), \
                    patch.object(admission.time, 'sleep') as sleep:
                self.assertEqual(admission.admit(SOURCE, wait_seconds=120), {'sourceSha': SOURCE})
                sleep.assert_called_once()
            with patch.dict(os.environ, {**api.env, 'GITHUB_EVENT_PATH': str(event)}, clear=True), \
                    patch.object(admission, 'GitHub', return_value=api), \
                    patch.object(admission.subprocess, 'check_output', return_value=(SOURCE + '\n').encode()), \
                    patch.object(admission, 'verify', side_effect=admission.Pending()), \
                    patch.object(admission.time, 'sleep') as sleep:
                with self.assertRaises(admission.Blocked):
                    admission.admit(SOURCE)
                sleep.assert_not_called()

    def test_repeated_admission_never_forwards_connection_credentials_or_tokens_to_git(self):
        api = FakeGitHub()
        credentials = {name: 'SYNTHETIC_SECRET' for name in (
            'GH_TOKEN', 'GITHUB_TOKEN', 'VPS_HOST', 'VPS_USER', 'VPS_SSH_KEY',
            'STAGING_KNOWN_HOSTS', 'STAGING_DIAGNOSTIC_HOST', 'STAGING_DIAGNOSTIC_KEY',
            'SSH_AUTH_SOCK', 'SSH_AGENT_PID')}
        with tempfile.TemporaryDirectory() as folder:
            event = Path(folder) / 'event.json'
            event.write_text(json.dumps(api.event))
            with patch.dict(os.environ, {**api.env, **credentials, 'GITHUB_EVENT_PATH': str(event)}, clear=True), \
                    patch.object(admission, 'GitHub', return_value=api), \
                    patch.object(admission.subprocess, 'check_output', return_value=(SOURCE + '\n').encode()) as git:
                self.assertEqual(admission.admit(SOURCE)['sourceSha'], SOURCE)
                self.assertFalse(set(credentials) & set(git.call_args.kwargs['env']))


if __name__ == '__main__':
    unittest.main()
