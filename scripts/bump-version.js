const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const versionFile = path.join(rootDir, "VERSION");
const versionPattern = /^(\d+)\.(\d+)\.(\d+)$/;

function fail(message) {
  console.error(message);
  process.exit(1);
}

const bumpType = process.argv[2];
if (["patch", "minor", "major"].indexOf(bumpType) === -1) {
  fail("Usage: node scripts/bump-version.js <patch|minor|major>");
}

const current = fs.readFileSync(versionFile, "utf8").trim();
const match = current.match(versionPattern);
if (!match) {
  fail("VERSION must use x.y.z format, got: " + current);
}

var major = Number(match[1]);
var minor = Number(match[2]);
var patch = Number(match[3]);

if (bumpType === "patch") {
  patch += 1;
} else if (bumpType === "minor") {
  minor += 1;
  patch = 0;
} else {
  major += 1;
  minor = 0;
  patch = 0;
}

const next = [major, minor, patch].join(".");
fs.writeFileSync(versionFile, next + "\n");

const syncResult = childProcess.spawnSync(process.execPath, [path.join("scripts", "version-sync.js")], {
  cwd: rootDir,
  stdio: "inherit",
});

if (syncResult.status !== 0) {
  process.exit(syncResult.status || 1);
}

console.log("Version bumped: " + current + " -> " + next);
