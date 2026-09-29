"""Export a data-minimized Playwright trace, never raw response bodies/headers/DOM."""
import json
import pathlib
import re
import shutil
import sys
import urllib.parse
import zipfile


def safe_url(value):
    try:
        parsed = urllib.parse.urlsplit(value)
        path = parsed.path
        if path not in ('/login', '/api/health', '/api/version', '/build-meta.json') and not re.fullmatch(r'/static/[A-Za-z0-9_./-]+', path):
            return '[URL withheld]'
        return path  # No query, credentials, fragments or hostname.
    except (ValueError, TypeError):
        return '[URL withheld]'


def safe_record(row):
    kind = row.get('type')
    if kind == 'resource-snapshot':
        snapshot = row.get('snapshot', {})
        return {'type': kind, 'snapshot': {
            **{k: snapshot[k] for k in ('_monotonicTime', 'startedDateTime', 'time') if k in snapshot},
            'request': {'method': 'GET', 'url': safe_url(snapshot.get('request', {}).get('url')), 'headers': [], 'cookies': []},
            'response': {'status': snapshot.get('response', {}).get('status', 0), 'headers': [], 'cookies': [],
                         'content': {'size': 0, 'mimeType': 'text/plain'}},
        }}
    if kind in ('before', 'after', 'context-options'):
        allowed = ('type', 'callId', 'startTime', 'endTime', 'wallTime', 'monotonicTime', 'version',
                   'browserName', 'platform', 'sdkLanguage', 'pageId', 'class', 'method', 'parentId')
        result = {k: row[k] for k in allowed if k in row}
        if kind == 'before':
            result['params'] = {'url': safe_url(row.get('params', {}).get('url'))} if 'url' in row.get('params', {}) else {}
        if row.get('error'):
            result['error'] = {'message': 'Smoke assertion failed; sensitive details withheld'}
        return result
    return None  # Console/pageerror messages, snapshots, stack sources and payloads are intentionally withheld.


def clean_trace(source, target):
    with zipfile.ZipFile(source) as raw, zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as out:
        for entry in raw.infolist():
            if not entry.filename.endswith(('.trace', '.network')):
                continue
            rows = [safe_record(json.loads(line)) for line in raw.read(entry).decode().splitlines() if line]
            out.writestr(entry.filename, '\n'.join(json.dumps(row) for row in rows if row))


if __name__ == '__main__':
    source, target = map(pathlib.Path, sys.argv[1:])
    for old in target.glob('trace-*.zip'):
        old.unlink()
    for old in target.glob('failure-*.png'):
        old.unlink()
    for i, file in enumerate(source.rglob('trace.zip')):
        clean_trace(file, target / f'trace-{i}.zip')
    for i, file in enumerate(source.rglob('failure.png')):
        shutil.copyfile(file, target / f'failure-{i}.png')
