import base64
import importlib.util
import io
import json
import pathlib
import unittest
import zipfile

spec = importlib.util.spec_from_file_location('sanitize_artifacts', pathlib.Path(__file__).resolve().parents[2] / 'e2e/sanitize_artifacts.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class BrowserArtifactTests(unittest.TestCase):
    def test_escaped_tokens_and_nested_trace_json_are_removed(self):
        response = r'{"refreshToken":"abc\u002Bdef\u003D"}'
        trace = json.dumps({'postData': {'text': response}}) + '\n' + response
        cleaned = module.sanitize(trace.encode(), ['abc+def=']).decode()
        rows = [json.loads(line) for line in cleaned.splitlines()]
        self.assertEqual(json.loads(rows[0]['postData']['text'])['refreshToken'], '[REDACTED]')
        self.assertEqual(rows[1]['refreshToken'], '[REDACTED]')

    def test_trace_headers_response_and_action_secrets_are_removed(self):
        archive = io.BytesIO()
        with zipfile.ZipFile(archive, 'w') as output:
            output.writestr('trace.network', '{"Authorization":"Bearer test-access-token"}')
            output.writestr('resources/auth.json', '{"refreshToken":"test-refresh-token"}')
            output.writestr('trace.trace', '{"value":"test-password"}')
            output.writestr('resources/screenshot.png', b'\x89PNG\xff')
        cleaned = module.sanitize(archive.getvalue(), ['test-access-token', 'test-refresh-token', 'test-password'])
        with zipfile.ZipFile(io.BytesIO(cleaned)) as result:
            for name in ('trace.network', 'resources/auth.json', 'trace.trace'):
                self.assertIn(b'[REDACTED]', result.read(name))
            self.assertEqual(result.read('resources/screenshot.png'), b'\x89PNG\xff')

    def test_embedded_html_report_archive_is_also_scrubbed(self):
        archive = io.BytesIO()
        with zipfile.ZipFile(archive, 'w') as output:
            output.writestr('report.json', '{"error":"test-password"}')
        html = b'const report = "data:application/zip;base64,' + base64.b64encode(archive.getvalue()) + b'";'
        cleaned = module.sanitize(html, ['test-password'])
        encoded = cleaned.split(b'base64,')[1].split(b'"')[0]
        with zipfile.ZipFile(io.BytesIO(base64.b64decode(encoded))) as result:
            self.assertNotIn(b'test-password', result.read('report.json'))


if __name__ == '__main__':
    unittest.main()
