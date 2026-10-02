"""HP-87: dependency-chain drift requires revisiting the temporary acceptance.

This guards the checked-in lockfile only, not developer environment variables
or every possible repository TLS configuration.
"""
import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]
FINGERPRINT = "e1609804566d78e9010889650705609099e53358449fe931969a1cc2dedace6f"


class NodeForgeAcceptanceTests(unittest.TestCase):
    def test_accepted_finding_stays_in_the_triaged_toolchain(self):
        baseline = json.loads((ROOT / ".security/baseline.json").read_text(encoding="utf-8"))
        accepted = [item for item in baseline["findings"]
                    if item["fingerprint"] == FINGERPRINT and item["status"] == "accepted-existing"]
        if not accepted:
            return  # Removing this temporary acceptance retires its guard.

        packages = json.loads((ROOT / "package-lock.json").read_text(encoding="utf-8"))["packages"]
        chain = [("react-scripts", "5.0.1"), ("webpack-dev-server", "4.15.2"),
                 ("selfsigned", "2.4.1"), ("node-forge", "1.3.3")]
        for name, version in chain:
            with self.subTest(package=name):
                self.assertEqual(sorted(path for path in packages
                                        if path.endswith("node_modules/" + name)),
                                 ["node_modules/" + name],
                                 "Reassess HP-87 acceptance if dependency resolution changes")
                self.assertEqual(packages["node_modules/" + name]["version"], version,
                                 "Reassess HP-87 acceptance when the toolchain changes")
        for (parent, _), (child, _) in zip(chain, chain[1:]):
            self.assertIn(child, packages["node_modules/" + parent]["dependencies"])

        manifest = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        for group in ("dependencies", "devDependencies", "optionalDependencies", "peerDependencies"):
            for name in ("webpack-dev-server", "selfsigned", "node-forge"):
                self.assertNotIn(name, manifest.get(group, {}),
                                 "Reassess HP-87 acceptance before adding a direct dependency")


if __name__ == "__main__":
    unittest.main()
