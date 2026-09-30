// Use the lock-installed npm semver implementation, never hand-roll ranges.
// Same advisory matching options as @npmcli/metavuln-calculator.
const fs = require('node:fs');
const semver = require('semver');
const options = { includePrerelease: true, loose: true };
try {
  const pairs = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (!Array.isArray(pairs)) throw new Error();
  const result = pairs.map(pair => {
    if (!Array.isArray(pair) || pair.length !== 2 ||
        typeof pair[0] !== 'string' || typeof pair[1] !== 'string' ||
        !pair[1].trim() || !semver.valid(pair[0], options) ||
        semver.validRange(pair[1], options) === null) throw new Error();
    return semver.satisfies(pair[0], pair[1], options);
  });
  process.stdout.write(JSON.stringify(result));
} catch {
  // No input, exception, package metadata or scanner prose in diagnostics.
  process.stderr.write('Invalid semver input\n');
  process.exitCode = 2;
}
