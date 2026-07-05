const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const versionFile = path.join(rootDir, "VERSION");
const versionPattern = /^\d+\.\d+\.\d+$/;

function readVersion() {
  const version = fs.readFileSync(versionFile, "utf8").trim();
  if (!versionPattern.test(version)) {
    throw new Error("VERSION must use x.y.z format, got: " + version);
  }
  return version;
}

function writeJson(filePath, updater) {
  if (!fs.existsSync(filePath)) return;

  const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
  updater(json);
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + "\n");
}

function syncPackageVersion(version) {
  writeJson(path.join(rootDir, "package.json"), function (pkg) {
    pkg.version = version;
  });

  writeJson(path.join(rootDir, "package-lock.json"), function (lock) {
    lock.version = version;
    if (lock.packages && lock.packages[""]) {
      lock.packages[""].version = version;
    }
  });
}

function syncEnvFile(filePath, version, createIfMissing) {
  if (!fs.existsSync(filePath)) {
    if (!createIfMissing) return;
    fs.writeFileSync(filePath, "REACT_APP_VERSION=" + version + "\n");
    return;
  }

  const original = fs.readFileSync(filePath, "utf8");
  const newline = original.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
  const lines = original.replace(/\r\n/g, "\n").split("\n");
  if (lines.length && lines[lines.length - 1] === "") {
    lines.pop();
  }

  var found = false;
  const nextLines = lines.map(function (line) {
    if (/^\s*REACT_APP_VERSION\s*=/.test(line)) {
      found = true;
      return "REACT_APP_VERSION=" + version;
    }
    return line;
  });

  if (!found) {
    nextLines.push("REACT_APP_VERSION=" + version);
  }

  fs.writeFileSync(filePath, nextLines.join(newline) + newline);
}

function main() {
  const version = readVersion();

  syncPackageVersion(version);
  syncEnvFile(path.join(rootDir, ".env.production"), version, true);
  syncEnvFile(path.join(rootDir, ".env"), version, false);

  console.log("Version synced: " + version);
}

main();
