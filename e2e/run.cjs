const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const backend = path.resolve(process.env.HP_E2E_BACKEND || path.join(os.homedir(), 'source/repos/HockeyPlanner.Backend'));
const project = path.join(backend, 'tests/HockeyPlanner.Backend.E2EHost/HockeyPlanner.Backend.E2EHost.csproj');
if (!fs.existsSync(project)) throw new Error('HP-73 E2EHost is required in the paired backend checkout. Set HP_E2E_BACKEND.');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hp-e2e-'));
const ready = path.join(temp, 'ready.json');
const secrets = path.join(temp, 'secrets.jsonl');
const key = crypto.randomBytes(48).toString('hex');
fs.writeFileSync(secrets, JSON.stringify(key) + '\n', { mode: 0o600 });
const env = { ...process.env, HP_E2E_READY_FILE: ready, HP_E2E_SIGNING_KEY: key, HP_E2E_SECRETS: secrets };
const waitExit = child => new Promise(resolve => child.on('exit', code => resolve(code ?? 1)));
function run(command, args, overrides = {}) {
  return spawn(command, args, { cwd: root, env: { ...env, ...overrides }, stdio: ['pipe', 'inherit', 'inherit'], windowsHide: true });
}
let host, server;
async function main() {
  fs.rmSync(path.join(root, 'playwright-report', 'sanitized.ok'), { force: true });
  // Use the local daemon's API, not a workstation-specific Docker version in CI.
  const dockerApi = execFileSync('docker', ['version', '--format', '{{.Server.APIVersion}}'], { encoding: 'utf8', windowsHide: true }).trim();
  if (!/^\d+\.\d+$/.test(dockerApi)) throw new Error('A ready local Docker daemon is required');
  env.DOCKER_API_VERSION = dockerApi;
  if (process.env.HP_E2E_SKIP_BUILD !== '1') {
    const build = run(process.execPath, ['node_modules/react-scripts/bin/react-scripts.js', 'build'], { REACT_APP_API_BASE: '/api' });
    if (await waitExit(build)) throw new Error('Production build failed');
  }
  host = run('dotnet', ['run', '--project', project, '--no-launch-profile']);
  const hostExit = waitExit(host);
  const deadline = Date.now() + 180000;
  while (!fs.existsSync(ready)) {
    if (host.exitCode !== null || Date.now() > deadline) throw new Error('Isolated API failed to start');
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  const api = new URL(JSON.parse(fs.readFileSync(ready, 'utf8')).api);
  if (!['127.0.0.1', 'localhost'].includes(api.hostname) || api.protocol !== 'http:') throw new Error('Non-local API forbidden');
  const buildRoot = path.join(root, 'build');
  const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
  server = http.createServer((req, res) => {
    if (req.url.startsWith('/api/')) {
      const proxy = http.request(new URL(req.url, api), { method: req.method, headers: { ...req.headers, host: api.host } }, upstream => {
        res.writeHead(upstream.statusCode, upstream.headers); upstream.pipe(res);
      });
      proxy.on('error', () => { res.writeHead(502); res.end('Local test API unavailable'); });
      req.pipe(proxy); return;
    }
    const requested = path.resolve(buildRoot, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (requested !== buildRoot && !requested.startsWith(buildRoot + path.sep)) { res.writeHead(403); res.end(); return; }
    const file = fs.existsSync(requested) && fs.statSync(requested).isFile() ? requested : path.join(buildRoot, 'index.html');
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  env.HP_E2E_BASE_URL = `http://127.0.0.1:${server.address().port}`;
  const tests = run(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)]);
  const result = await waitExit(tests);
  host.stdin.end('\n');
  await hostExit;
  return result;
}
main().then(code => { process.exitCode = code; }).catch(error => {
  console.error(error.message); process.exitCode = 1;
}).finally(async () => {
  server?.closeAllConnections(); server?.close();
  if (host && host.exitCode === null) { host.stdin.end('\n'); await waitExit(host); }
  // Sanitize before any CI upload; never publish raw Playwright archives.
  const scrub = spawn(process.env.PYTHON || 'python', ['e2e/sanitize_artifacts.py', secrets, 'test-results', 'playwright-report'], { cwd: root, stdio: 'inherit', windowsHide: true });
  if (await waitExit(scrub)) process.exitCode = 1;
  else if (fs.existsSync(path.join(root, 'playwright-report')))
    fs.writeFileSync(path.join(root, 'playwright-report', 'sanitized.ok'), 'Ephemeral credentials removed before upload.\n');
  fs.rmSync(temp, { recursive: true, force: true });
});
