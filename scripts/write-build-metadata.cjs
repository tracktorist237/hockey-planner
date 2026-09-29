const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const commit = process.env.REACT_APP_COMMIT || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error('Full commit SHA required for build metadata');
const environment = process.env.REACT_APP_DEPLOY_ENV || 'Local';
if (!['Local', 'Staging', 'Production'].includes(environment)) throw new Error('Invalid build environment');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'build/asset-manifest.json'), 'utf8'));
const main = manifest.files['main.js'];
if (!/^\/static\/js\/main\.[a-zA-Z0-9_-]+\.js$/.test(main)) throw new Error('Unexpected main bundle path');
const data = {
  schemaVersion: 1, commit, environment,
  mainJs: { path: main, sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'build', main))).digest('hex') },
};
fs.writeFileSync(path.join(root, 'build/build-meta.json'), JSON.stringify(data) + '\n');
