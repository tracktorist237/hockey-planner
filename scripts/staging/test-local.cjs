// Exercise the real browser gate against disposable local HTTP fixtures, never staging.
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');

(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hp-smoke-proof-'));
  let mode = 'healthy';
  const server = http.createServer((req, res) => {
    assert.equal(req.method, 'GET');
    if (req.url === '/api/health') { res.end(mode === 'unhealthy' ? 'Unhealthy' : 'Healthy'); return; }
    if (req.url === '/api/version') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ environment: 'Staging', commit: 'a'.repeat(40) })); return; }
    if (mode === 'production-build') {
      const build = path.resolve('build');
      const file = path.resolve(build, '.' + new URL(req.url, 'http://localhost').pathname);
      if (file.startsWith(build + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile()) {
        const mime = { '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
        res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
        res.end(fs.readFileSync(file));
      } else {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(fs.readFileSync(path.join(build, 'index.html')));
      }
      return;
    }
    if (req.url === '/static/js/main.fixture.js') {
      res.setHeader('Content-Type', 'application/javascript');
      res.end(mode === 'runtime' ? 'throw new Error("injected failure")' : 'document.documentElement.dataset.booted="true"'); return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!doctype html><html lang="ru"><body>${mode === 'boundary' ? '<h1>Не удалось открыть приложение</h1>' :
      '<form><input placeholder="Email"><input placeholder="Пароль" type="password"><span aria-label="Сервер доступен">OK</span></form>'}
      <script src="/static/js/main.fixture.js"></script></body></html>`);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const scenarios = ['healthy', 'boundary', 'runtime', 'unhealthy'];
    if (process.argv.includes('--production-build')) scenarios.push('production-build');
    for (const scenario of scenarios) {
      mode = scenario;
      const output = path.join(root, scenario);
      const code = await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, ['scripts/staging/run-browser.cjs'], {
          env: { ...process.env, HP_SMOKE_LOCAL_FIXTURE: '1', HP_STAGING_URL: `http://127.0.0.1:${server.address().port}`, HP_SMOKE_OUTPUT: output },
          stdio: 'pipe',
        });
        child.stderr.on('data', data => process.stderr.write(data));
        child.on('error', reject); child.on('close', resolve);
      });
      const success = ['healthy', 'production-build'].includes(scenario);
      assert.equal(code, success ? 0 : 1, scenario);
      const result = JSON.parse(fs.readFileSync(path.join(output, 'result.json'), 'utf8'));
      assert.equal(result.passed, success, scenario);
      assert.ok(fs.existsSync(path.join(output, 'sanitized.ok')));
      if (!success) {
        assert.equal(result.code, 'browser_assertion');
        assert.ok(fs.readdirSync(output).some(name => name.endsWith('.zip')), 'retained sanitized trace');
        assert.ok(fs.readdirSync(output).some(name => name.endsWith('.png')), 'safe failure screenshot');
      }
      console.log(`HP-75 browser failure proof: ${scenario} PASS`);
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(root, { recursive: true, force: true });
  }
})().catch(error => { console.error('HP-75 local browser failure proof FAILED:', error.message); process.exitCode = 1; });
