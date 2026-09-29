const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const privateDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hp-staging-browser-'));
const output = path.resolve(process.env.HP_SMOKE_OUTPUT || 'staging-smoke/browser');
fs.mkdirSync(output, { recursive: true });
fs.rmSync(path.join(output, 'sanitized.ok'), { force: true });
fs.rmSync(path.join(output, 'result.json'), { force: true });
try {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) =>
    /^(PATH|HOME|USERPROFILE|SYSTEMROOT|TEMP|TMP|CI|LOCALAPPDATA|PLAYWRIGHT_BROWSERS_PATH|HP_STAGING_URL|HP_SMOKE_LOCAL_FIXTURE)$/i.test(key)));
  const result = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--config=playwright.staging.config.ts'], {
    env: { ...env, HP_SMOKE_PRIVATE: privateDir, HP_SMOKE_OUTPUT: output }, stdio: 'pipe', timeout: 45000,
  });
  const clean = spawnSync(process.env.PYTHON || 'python', ['scripts/staging/sanitize_browser.py', privateDir, output], { stdio: 'pipe', timeout: 10000 });
  if (clean.status !== 0 || result.error || !fs.existsSync(path.join(output, 'result.json'))) {
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify({ passed: false, code: 'browser_infra' }));
    process.exitCode = 1;
  } else {
    fs.writeFileSync(path.join(output, 'sanitized.ok'), 'Allowlisted diagnostics only.\n');
    process.exitCode = result.status || 0;
  }
} finally {
  // Only the private directory created by this invocation is removed.
  fs.rmSync(privateDir, { recursive: true, force: true });
}
