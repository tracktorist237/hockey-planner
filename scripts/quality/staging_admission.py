"""HP-95 fail-closed admission. Read-only GitHub token; no staging credentials.

Review links are procedural evidence, not proof of independent GitHub approval.
The human merger remains responsible for the linked exact-head review.
"""
from datetime import datetime
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
from urllib.request import HTTPRedirectHandler, Request, build_opener

REPOSITORY = 'tracktorist237/hockey-planner'
REPOSITORY_ID = 1146646574
OWNER = {'login': 'tracktorist237', 'id': 74918383, 'type': 'User'}
SWITCH = 'HP95_STAGING_AUTODEPLOY'
ENABLED = 'protected-develop-merged-pr-v1'
DEPLOY = '.github/workflows/deploy-staging-vps.yml'
VALIDATION = '.github/workflows/frontend-pr-checks.yml'
SECURITY = '.github/workflows/security-audit.yml'
QUALITY_JOBS = {'validation / Frontend quality gate'}
SECURITY_JOBS = {'Deterministic dependency audit', 'CodeQL'}


class Blocked(ValueError):
    pass


class Pending(Blocked):
    """Only an absent/unfinished post-merge security run may be polled."""


def require(condition):
    if not condition:
        raise Blocked('Admission evidence missing or inconsistent')


def sha(value):
    require(isinstance(value, str) and re.fullmatch('[0-9a-f]{40}', value) is not None)
    require(value != '0' * 40)
    return value


def canonical(repo):
    require(repo['full_name'] == REPOSITORY and repo['id'] == REPOSITORY_ID)


def owner(user):
    require(all(user.get(key) == value for key, value in OWNER.items()))


def timestamp(value):
    return datetime.fromisoformat(value.replace('Z', '+00:00'))


class GitHub:
    def __init__(self, token):
        require(bool(token))
        self.token = token

    def get(self, path):
        # Paths are constructed here, never taken from API URLs or event input.
        request = Request('https://api.github.com/repos/' + REPOSITORY + '/' + path,
                          headers={'Authorization': 'Bearer ' + self.token,
                                   'Accept': 'application/vnd.github+json',
                                   'X-GitHub-Api-Version': '2022-11-28'})
        # Repository moves/redirects need a reviewed policy change; never forward
        # the job token to a redirected endpoint.
        class NoRedirect(HTTPRedirectHandler):
            def redirect_request(self, *args, **kwargs):
                return None
        with build_opener(NoRedirect()).open(request, timeout=30) as response:
            return json.load(response)

    def collection(self, path, key=None):
        rows = []
        # Bounded pagination; incomplete evidence is never accepted.
        for page in range(1, 11):
            result = self.get(path + ('&' if '?' in path else '?') + f'per_page=100&page={page}')
            batch = result[key] if key else result
            require(isinstance(batch, list))
            rows.extend(batch)
            if len(batch) < 100:
                return rows
        raise Blocked('Evidence pagination limit')


def context(expected, env, event):
    sha(expected)
    require(env.get(SWITCH) == ENABLED)
    require(env.get('GITHUB_REPOSITORY') == REPOSITORY)
    require(env.get('GITHUB_EVENT_NAME') == 'push')
    require(env.get('GITHUB_REF') == 'refs/heads/develop')
    require(env.get('GITHUB_REF_PROTECTED') == 'true')
    require(env.get('GITHUB_SHA') == expected)
    require(env.get('GITHUB_ACTOR') == OWNER['login'])
    require(env.get('GITHUB_TRIGGERING_ACTOR') == OWNER['login'])
    require(env.get('GITHUB_WORKFLOW_REF') == REPOSITORY + '/' + DEPLOY + '@refs/heads/develop')
    require(env.get('GITHUB_WORKFLOW_SHA') == expected)
    require(event['ref'] == 'refs/heads/develop' and event['after'] == expected)
    sha(event['before'])
    require(all(event.get(flag) is False for flag in ('forced', 'deleted', 'created')))
    canonical(event['repository'])
    owner(event['sender'])


def current_branch(api, expected):
    branch = api.get('branches/develop')
    require(branch['protected'] is True and branch['commit']['sha'] == expected)
    checks = branch['protection']['required_status_checks']
    require(checks['enforcement_level'] == 'everyone')
    require({'context': 'validation / Frontend quality gate', 'app_id': 15368} in checks['checks'])


def review_record(body, head):
    records, fenced = [], False
    for line in (body or '').splitlines():
        if re.match(r'^\s*(`{3,}|~{3,})', line):
            fenced = not fenced
        elif not fenced and line.startswith('Independent-Review:'):
            records.append(line)
    require(len(records) == 1)
    match = re.fullmatch(r'Independent-Review: APPROVE ([0-9a-f]{40}) (https://[^\s<>]+)', records[0])
    require(match is not None and match[1] == head)


def merged_pr(api, expected, event):
    commit = api.get('commits/' + expected)
    require(commit['sha'] == expected)
    require(commit['commit']['verification']['verified'] is True)
    require(commit['commit']['verification']['reason'] == 'valid')
    require(commit['committer']['login'] == 'web-flow' and commit['committer']['id'] == 19864447)
    candidates = [pr for pr in api.collection('commits/' + expected + '/pulls')
                  if pr['merge_commit_sha'] == expected and pr['base']['ref'] == 'develop']
    require(len(candidates) == 1)
    number = candidates[0]['number']
    require(type(number) is int and number > 0)
    pr = api.get(f'pulls/{number}')
    require(pr['merged'] is True and pr['state'] == 'closed' and pr['draft'] is False)
    require(pr['merge_commit_sha'] == expected and pr['base']['ref'] == 'develop')
    canonical(pr['base']['repo'])
    canonical(pr['head']['repo'])
    owner(pr['merged_by'])
    head = sha(pr['head']['sha'])
    # Deliberately require GitHub's merge-commit method. A squash/rebase/direct
    # push cannot supply this exact ancestry from the authenticated merged PR.
    require([parent['sha'] for parent in commit['parents']] == [event['before'], head])
    require(pr['base']['sha'] == event['before'])
    # Existing separate-session review handoff, never a new human approval.
    # Exactly one record; stale/ambiguous/pending records fail closed.
    review_record(pr.get('body'), head)
    timestamp(pr['merged_at'])
    return pr


def run_identity(run, expected, path, event, branch):
    require(run['head_sha'] == expected and run['path'] == path)
    require(run['event'] == event and run['head_branch'] == branch)
    canonical(run['repository'])
    canonical(run['head_repository'])
    require(type(run['id']) is int and run['id'] > 0)
    require(type(run['run_attempt']) is int and run['run_attempt'] > 0)


def jobs_succeeded(api, run, expected, names, before=None):
    jobs = api.collection(f"actions/runs/{run['id']}/attempts/{run['run_attempt']}/jobs", 'jobs')
    for name in names:
        matches = [job for job in jobs if job['name'] == name]
        require(len(matches) == 1)
        job = matches[0]
        require(job['run_id'] == run['id'] and job['head_sha'] == expected)
        require(job['status'] == 'completed' and job['conclusion'] == 'success')
        if before is not None:
            require(timestamp(job['completed_at']) <= before)


def successful_run(api, expected, path, event, branch, names, before=None, wait=False):
    runs = api.collection(f'actions/workflows/{path.rsplit("/", 1)[1]}/runs?head_sha={expected}&event={event}',
                          'workflow_runs')
    if not runs:
        if wait:
            raise Pending('Waiting for security run')
        raise Blocked('Required workflow absent')
    # Never fall back to an older successful run/attempt after a newer failure.
    run = max(runs, key=lambda row: row['id'])
    run_identity(run, expected, path, event, branch)
    if run['status'] != 'completed':
        if wait:
            raise Pending('Waiting for security completion')
        raise Blocked('Required workflow incomplete')
    require(run['conclusion'] == 'success')
    if before is not None:
        require(timestamp(run['updated_at']) <= before)
    jobs_succeeded(api, run, expected, names, before)
    return run['id']


def verify(expected, env, event, api):
    context(expected, env, event)
    current_branch(api, expected)
    pr = merged_pr(api, expected, event)
    run_id, attempt = int(env['GITHUB_RUN_ID']), int(env['GITHUB_RUN_ATTEMPT'])
    run = api.get(f'actions/runs/{run_id}')
    run_identity(run, expected, DEPLOY, 'push', 'develop')
    require(run['id'] == run_id and run['run_attempt'] == attempt)
    require(run['status'] == 'in_progress')
    owner(run['actor'])
    owner(run['triggering_actor'])
    jobs_succeeded(api, run, expected, QUALITY_JOBS)
    # Independently reject pre-merge CI bypass, including missing PR security.
    merged_at = timestamp(pr['merged_at'])
    head, branch = pr['head']['sha'], pr['head']['ref']
    successful_run(api, head, VALIDATION, 'pull_request', branch, QUALITY_JOBS, merged_at)
    successful_run(api, head, SECURITY, 'pull_request', branch, SECURITY_JOBS, merged_at)
    security = successful_run(api, expected, SECURITY, 'push', 'develop', SECURITY_JOBS, wait=True)
    current_branch(api, expected)  # Recheck after the evidence reads/poll.
    return {'sourceSha': expected, 'reviewedHead': head, 'pullRequest': pr['number'],
            'validationRun': run_id, 'attempt': attempt, 'securityRun': security}


def admit(expected, *, wait_seconds=0):
    env = os.environ
    event = json.loads(Path(env['GITHUB_EVENT_PATH']).read_text(encoding='utf-8'))
    # Context/activation checks must happen before token use or network access.
    context(expected, env, event)
    require(subprocess.check_output(['git', 'rev-parse', 'HEAD'], timeout=10,
                                    stderr=subprocess.DEVNULL).decode().strip() == expected)
    api = GitHub(env.get('GH_TOKEN'))
    deadline = time.monotonic() + wait_seconds
    while True:
        try:
            return verify(expected, env, event, api)
        except Pending:
            if time.monotonic() >= deadline:
                raise Blocked('Security evidence not ready') from None
            time.sleep(min(60, max(0, deadline - time.monotonic())))


def main():
    try:
        require(len(sys.argv) == 2 and sys.argv[1] in ('--wait', '--check'))
        evidence = admit(os.environ['GITHUB_SHA'], wait_seconds=2400 if sys.argv[1] == '--wait' else 0)
        print(json.dumps(evidence, sort_keys=True))  # Public identities only.
    except Exception:
        print('BLOCKED: automatic staging admission not verified.', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
