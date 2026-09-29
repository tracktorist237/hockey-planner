"""Scrub ephemeral credentials from traces/reports before CI upload (stdlib only)."""
import base64
import io
import json
import pathlib
import re
import sys
import zipfile


def scrub_text(text, secrets):
    for secret in secrets:
        text = text.replace(secret, '[REDACTED]')
    return re.sub(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', '[REDACTED_JWT]', text)


def scrub_json(value, secrets):
    if isinstance(value, dict):
        return {key: scrub_json(item, secrets) for key, item in value.items()}
    if isinstance(value, list):
        return [scrub_json(item, secrets) for item in value]
    if isinstance(value, str):
        # Trace postData/response fields can contain another JSON-encoded document.
        if value.lstrip().startswith(('{', '[')):
            try:
                return json.dumps(scrub_json(json.loads(value), secrets), ensure_ascii=False)
            except ValueError:
                pass
        return scrub_text(value, secrets)
    return value


def sanitize(data, secrets):
    if data.startswith(b'PK\x03\x04'):
        output = io.BytesIO()
        with zipfile.ZipFile(io.BytesIO(data)) as source, zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as target:
            for item in source.infolist():
                target.writestr(item.filename, sanitize(source.read(item), secrets))
        return output.getvalue()
    try:
        text = data.decode('utf-8')
    except UnicodeDecodeError:
        return data
    # Playwright's HTML report embeds a base64 ZIP, in addition to standalone trace ZIPs.
    text = re.sub(r'(data:application/zip;base64,)([A-Za-z0-9+/=]+)',
                  lambda m: m[1] + base64.b64encode(sanitize(base64.b64decode(m[2]), secrets)).decode(), text)
    try:
        return json.dumps(scrub_json(json.loads(text), secrets), ensure_ascii=False).encode('utf-8')
    except ValueError:
        pass
    # Playwright trace streams are NDJSON, not one JSON document.
    lines = []
    for line in text.splitlines(keepends=True):
        try:
            lines.append(json.dumps(scrub_json(json.loads(line), secrets), ensure_ascii=False) + '\n')
        except ValueError:
            lines.append(scrub_text(line, secrets))
    return ''.join(lines).encode('utf-8')


if __name__ == '__main__':
    secrets = sorted({json.loads(line) for line in pathlib.Path(sys.argv[1]).read_text().splitlines() if line}, key=len, reverse=True)
    for directory in sys.argv[2:]:
        for file in pathlib.Path(directory).rglob('*'):
            if file.is_file():
                file.write_bytes(sanitize(file.read_bytes(), secrets))
