import importlib.util
import json
import pathlib
import tempfile
import unittest
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('sanitize', ROOT / 'scripts/staging/sanitize_browser.py')
sanitize = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sanitize)


class StagingArtifactTests(unittest.TestCase):
    def test_trace_drops_credentials_payload_dom_console_stack_and_response_headers(self):
        secret = 'SECRET_DO_NOT_EXPORT'
        rows = [
            {'type': 'resource-snapshot', 'snapshot': {
                'request': {'url': f'https://user:{secret}@example/api/version?token={secret}', 'headers': [{'name': 'Authorization', 'value': secret}], 'cookies': [secret], 'postData': secret},
                'response': {'status': 503, 'headers': [{'name': 'Set-Cookie', 'value': secret}], 'content': {'text': secret, '_sha1': secret}}}},
            {'type': 'before', 'callId': 'call@1', 'method': 'goto', 'params': {'url': f'https://example/login?code={secret}', 'headers': secret}, 'stack': secret},
            {'type': 'after', 'callId': 'call@1', 'error': {'message': secret}, 'result': secret},
            {'type': 'console', 'text': secret}, {'type': 'frame-snapshot', 'snapshot': secret},
        ]
        with tempfile.TemporaryDirectory() as directory:
            source, target = pathlib.Path(directory) / 'raw.zip', pathlib.Path(directory) / 'safe.zip'
            with zipfile.ZipFile(source, 'w') as archive:
                archive.writestr('test.trace', '\n'.join(json.dumps(row) for row in rows))
                archive.writestr('resources/payload', secret)
            sanitize.clean_trace(source, target)
            with zipfile.ZipFile(target) as archive:
                self.assertEqual(archive.namelist(), ['test.trace'])
                data = archive.read('test.trace').decode()
                self.assertNotIn(secret, data)
                parsed = [json.loads(line) for line in data.splitlines()]
                self.assertEqual(len(parsed), 3)
                self.assertEqual(parsed[0]['snapshot']['response']['status'], 503)
                self.assertEqual(parsed[0]['snapshot']['request']['url'], '/api/version')
                self.assertEqual(parsed[1]['params'], {'url': '/login'})

    def test_unknown_and_credential_urls_withheld(self):
        self.assertEqual(sanitize.safe_url('https://example/users/private@example.com'), '[URL withheld]')
        self.assertEqual(sanitize.safe_url(None), '[URL withheld]')
        self.assertEqual(sanitize.safe_url('https://example/static/js/main.123.js?token=secret#secret'), '/static/js/main.123.js')


if __name__ == '__main__':
    unittest.main()
