"""HP-87: keep every locked node-forge resolution patched, without acceptance.

1.4.1 fixes the security issues in <=1.4.0; 1.4.2 also restores PEM Buffer
compatibility. This offline guard uses the installed real npm semver engine.
The live dependency audit remains responsible for newly published advisories.
"""
import copy
import json
from pathlib import Path
import unittest

import security_audit as audit


ROOT = Path(__file__).resolve().parents[2]
SAFE_RANGE = ">=1.4.2 <2.0.0"
HISTORICAL_FINGERPRINTS = (
    "8f2f06e989ebd1113e41db3e7d2967f6b3acc14e5fc4557a0645d729d026b179",
    "97b4b27aa46630b6e0e937a8fa7a8a5dc37475407cea4db50a7408b16210a481",
    "b736eecbd2b82c74051d147829ce3820214b786837beeb3b50583d5389c947ee",
    "dada59002c0c5a945b9d81404ab797df88fa3491d7edf4ad38ede232ab762e13",
    "e1609804566d78e9010889650705609099e53358449fe931969a1cc2dedace6f",
)


class NodeForgeSecurityTests(unittest.TestCase):
    def check_resolution(self, baseline, packages, manifest):
        self.assertFalse([item for item in baseline["findings"]
                          if item.get("package") == "node-forge"
                          or item["fingerprint"] in HISTORICAL_FINGERPRINTS],
                         "Do not restore obsolete node-forge baseline exceptions")
        versions = [package["version"] for path, package in packages.items()
                    if path.endswith("node_modules/node-forge")]
        self.assertTrue(all(audit.semver_matches([[version, SAFE_RANGE] for version in versions])),
                        "Every node-forge copy, including nested copies, must be patched")
        for group in ("dependencies", "devDependencies", "optionalDependencies", "peerDependencies"):
            self.assertNotIn("node-forge", manifest.get(group, {}),
                             "Keep the compatible transitive resolution; no direct dependency needed")

    def test_locked_node_forge_is_patched_without_baseline_acceptance(self):
        baseline = json.loads((ROOT / ".security/baseline.json").read_text(encoding="utf-8"))
        packages = json.loads((ROOT / "package-lock.json").read_text(encoding="utf-8"))["packages"]
        manifest = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        self.check_resolution(baseline, packages, manifest)

    def test_vulnerable_or_nested_regression_is_detected_even_without_acceptance(self):
        baseline = {"findings": []}
        packages = {"node_modules/node-forge": {"version": "1.4.2"}}
        self.check_resolution(baseline, packages, {})
        # Entire removal of this transitive dependency is safe too.
        self.check_resolution(baseline, {}, {})
        for version in ("0.10.0", "1.3.3", "1.4.0", "1.4.1", "1.4.2-beta.1"):
            for path in ("node_modules/node-forge", "node_modules/other/node_modules/node-forge"):
                with self.subTest(version=version, path=path):
                    changed = copy.deepcopy(packages)
                    changed[path] = {"version": version}
                    with self.assertRaises(AssertionError):
                        self.check_resolution(baseline, changed, {})

    def test_stale_acceptances_and_direct_dependency_are_rejected(self):
        packages = {"node_modules/node-forge": {"version": "1.4.2"}}
        for fingerprint in HISTORICAL_FINGERPRINTS:
            with self.subTest(fingerprint=fingerprint):
                with self.assertRaises(AssertionError):
                    self.check_resolution({"findings": [{"fingerprint": fingerprint,
                                           "status": "accepted-existing"}]}, packages, {})
        with self.assertRaises(AssertionError):
            self.check_resolution({"findings": [{"fingerprint": "new", "package": "node-forge",
                                   "status": "accepted-existing"}]}, packages, {})
        for group in ("dependencies", "devDependencies", "optionalDependencies", "peerDependencies"):
            with self.subTest(group=group), self.assertRaises(AssertionError):
                self.check_resolution({"findings": []}, packages, {group: {"node-forge": "^1.4.2"}})


if __name__ == "__main__":
    unittest.main()
