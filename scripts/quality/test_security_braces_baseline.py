"""HP-88: retire on acceptance removal; toolchain drift requires reassessment.

This lockfile guard does not replace review of source/configuration input flows.
"""
import copy
import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]
FINGERPRINT = "c2b67c87bc6d5b365e1d5b82f38a87d6229f0e0a0f131f557b9c60b2da3c09d3"
VERSIONS = {
    "braces": "3.0.3", "chokidar": "3.6.0", "micromatch": "4.0.8",
    "react-scripts": "5.0.1", "webpack-dev-server": "4.15.2",
    "tailwindcss": "3.4.19", "fast-glob": "3.3.3",
    "react-dev-utils": "12.0.1", "fork-ts-checker-webpack-plugin": "6.5.3",
}
EDGES = {
    ("chokidar", "braces"): "~3.0.2",
    ("micromatch", "braces"): "^3.0.3",
    ("react-scripts", "webpack-dev-server"): "^4.6.0",
    ("react-scripts", "tailwindcss"): "^3.0.2",
    ("react-scripts", "react-dev-utils"): "^12.0.1",
    ("react-dev-utils", "fork-ts-checker-webpack-plugin"): "^6.5.0",
    ("fork-ts-checker-webpack-plugin", "chokidar"): "^3.4.2",
    ("webpack-dev-server", "chokidar"): "^3.5.3",
    ("tailwindcss", "chokidar"): "^3.6.0",
    ("tailwindcss", "micromatch"): "^4.0.8",
    ("tailwindcss", "fast-glob"): "^3.3.2",
    ("fast-glob", "micromatch"): "^4.0.8",
}
GROUPS = ("dependencies", "devDependencies", "optionalDependencies", "peerDependencies")
REASSESS = "Reassess HP-88 temporary acceptance when dependency/toolchain inputs change"


class BracesAcceptanceTests(unittest.TestCase):
    def check_acceptance(self, baseline, packages, manifest):
        accepted = [item for item in baseline["findings"]
                    if item["fingerprint"] == FINGERPRINT
                    and item["status"] == "accepted-existing"]
        if not accepted:
            return  # Removing the acceptance retires this guard, as in HP-87.
        self.assertEqual(len(accepted), 1, REASSESS)
        for name, version in VERSIONS.items():
            self.assertEqual(sorted(path for path in packages
                                    if path.endswith("node_modules/" + name)),
                             ["node_modules/" + name], REASSESS)
            self.assertEqual(packages["node_modules/" + name]["version"], version, REASSESS)
        for (parent, child), requirement in EDGES.items():
            self.assertEqual(packages["node_modules/" + parent].get("dependencies", {}).get(child),
                             requirement, REASSESS)
        self.assertEqual(sorted(path for path, package in packages.items()
                                if any("braces" in package.get(group, {})
                                       for group in ("dependencies", "optionalDependencies"))),
                         ["node_modules/chokidar", "node_modules/micromatch"], REASSESS)
        for group in GROUPS:
            for name in ("braces", "chokidar", "micromatch"):
                self.assertNotIn(name, manifest.get(group, {}), REASSESS)

    def test_accepted_finding_stays_in_the_triaged_toolchain(self):
        baseline = json.loads((ROOT / ".security/baseline.json").read_text(encoding="utf-8"))
        if not any(item["fingerprint"] == FINGERPRINT and item["status"] == "accepted-existing"
                   for item in baseline["findings"]):
            return
        packages = json.loads((ROOT / "package-lock.json").read_text(encoding="utf-8"))["packages"]
        manifest = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        self.check_acceptance(baseline, packages, manifest)

    def test_guard_retires_or_rejects_assessment_drift(self):
        # Isolated fixtures: mutations never write the real lockfile or baseline.
        baseline = {"findings": [{"fingerprint": FINGERPRINT, "status": "accepted-existing"}]}
        packages = {"node_modules/" + name: {"version": version, "dependencies": {}}
                    for name, version in VERSIONS.items()}
        for (parent, child), requirement in EDGES.items():
            packages["node_modules/" + parent]["dependencies"][child] = requirement
        self.check_acceptance(baseline, packages, {})
        unrelated = copy.deepcopy(packages)
        unrelated["node_modules/unrelated"] = {"version": "99.0.0"}
        self.check_acceptance(baseline, unrelated, {})
        # Unrelated baselines must never activate this guard.
        self.check_acceptance({"findings": [{"fingerprint": "other", "status": "accepted-existing"}]}, {}, {})
        self.check_acceptance({"findings": []}, {}, {})
        baseline["findings"][0]["status"] = "removed"
        self.check_acceptance(baseline, {}, {})
        baseline["findings"][0]["status"] = "accepted-existing"

        for name in VERSIONS:
            with self.subTest(version_drift=name):
                mutated = copy.deepcopy(packages)
                mutated["node_modules/" + name]["version"] = "99.0.0"
                with self.assertRaises(AssertionError):
                    self.check_acceptance(baseline, mutated, {})
        for parent in ("chokidar", "micromatch"):
            for change in (None, "*"):
                with self.subTest(edge=parent, change=change):
                    mutated = copy.deepcopy(packages)
                    dependencies = mutated["node_modules/" + parent]["dependencies"]
                    if change is None:
                        del dependencies["braces"]
                    else:
                        dependencies["braces"] = change
                    with self.assertRaises(AssertionError):
                        self.check_acceptance(baseline, mutated, {})
        for name in ("braces", "chokidar", "micromatch"):
            with self.subTest(duplicate=name):
                mutated = copy.deepcopy(packages)
                mutated["node_modules/unexpected/node_modules/" + name] = packages["node_modules/" + name]
                with self.assertRaises(AssertionError):
                    self.check_acceptance(baseline, mutated, {})
            for group in GROUPS:
                with self.subTest(direct=name, group=group):
                    with self.assertRaises(AssertionError):
                        self.check_acceptance(baseline, packages, {group: {name: "*"}})
        mutated = copy.deepcopy(packages)
        mutated["node_modules/unexpected"] = {"dependencies": {"braces": "^3.0.3"}}
        with self.assertRaises(AssertionError):
            self.check_acceptance(baseline, mutated, {})


if __name__ == "__main__":
    unittest.main()
