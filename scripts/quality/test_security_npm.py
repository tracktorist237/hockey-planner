"""Npm regression cases use the real lock-installed semver, not a fake comparator."""
import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import security_audit as audit

REPO = "test/repo"
URL_A = "https://github.com/advisories/GHSA-abcd-1234-abcd"
URL_B = "https://github.com/advisories/GHSA-abcd-5678-abcd"


def advisory(name, affected_range, level="low", url=URL_A):
    return {"name": name, "dependency": name, "range": affected_range, "severity": level, "url": url}


def document(entries):
    counts = dict.fromkeys(("info", "low", "moderate", "high", "critical"), 0)
    for value in entries.values():
        counts[value["severity"]] += 1
    counts["total"] = len(entries)
    return {"auditReportVersion": 2, "vulnerabilities": entries, "metadata": {"vulnerabilities": counts}}


def entry(name, via, nodes=None, level="high"):
    return {"name": name, "severity": level, "via": via, "nodes": nodes or ["node_modules/" + name]}


class NpmIdentityTests(unittest.TestCase):
    def setUp(self):
        self.nodes = ["node_modules/postcss", "node_modules/wrapper/node_modules/postcss"]
        self.lock = {"packages": {self.nodes[0]: {"version": "8.5.6"}, self.nodes[1]: {"version": "7.0.39"}}}

    def test_two_versions_only_affected_version_gets_advisory(self):
        data = document({"postcss": entry("postcss", [advisory("postcss", "<8.4.31")], self.nodes)})
        result = audit.npm_findings(data, self.lock, REPO)
        self.assertEqual([(x["package"], x["version"], x["severity"]) for x in result], [("postcss", "7.0.39", "low")])

    def test_non_overlapping_ranges_are_not_a_cartesian_product(self):
        data = document({"postcss": entry("postcss", [advisory("postcss", "<8.0.0"),
            advisory("postcss", ">=8.5.0 <8.6.0", "high", URL_B)], self.nodes)})
        result = audit.npm_findings(data, self.lock, REPO)
        self.assertEqual({(x["version"], x["reference"]) for x in result}, {("7.0.39", URL_A), ("8.5.6", URL_B)})

    def test_meta_chains_resolve_once_to_concrete_leaf_identity(self):
        data = document({"postcss": entry("postcss", [advisory("postcss", "<8.4.31", "moderate")], self.nodes),
            "wrapper": entry("wrapper", ["postcss"]), "app": entry("app", ["wrapper", "postcss"])})
        self.lock["packages"].update({"node_modules/wrapper": {"version": "20.0.0"}, "node_modules/app": {"version": "30.0.0"}})
        result = audit.npm_findings(data, self.lock, REPO)
        self.assertEqual(len(result), 1)
        self.assertEqual((result[0]["package"], result[0]["version"], result[0]["severity"]), ("postcss", "7.0.39", "medium"))
        # Adding another route to the leaf does not create a wrapper/leaf clone.
        data["vulnerabilities"]["wrapper"]["via"].append("app")
        self.assertEqual(result, audit.npm_findings(data, self.lock, REPO))

    def test_low_advisory_never_inherits_high_aggregate_severity(self):
        data = document({"postcss": entry("postcss", [advisory("postcss", "<8.0.0", "high", URL_B)], self.nodes)})
        first = audit.npm_findings(data, self.lock, REPO)
        baseline = {"schemaVersion": 1, "findings": [dict(first[0], status="accepted-existing",
            rationale="Test observation", firstSeen="2026-09-30")]}
        data["vulnerabilities"]["postcss"]["via"].append(advisory("postcss", "<8.0.0", "low"))
        result = audit.apply_baseline(audit.npm_findings(data, self.lock, REPO), baseline)
        self.assertEqual([(x["severity"], x["status"]) for x in result if x["reference"] == URL_A], [("low", "NEW")])
        self.assertFalse(audit.blocking(result))

    def test_order_and_duplicate_rows_do_not_change_output(self):
        data = document({"postcss": entry("postcss", [advisory("postcss", "<8.0.0"),
            advisory("postcss", "^8.5.0", "high", URL_B)], self.nodes), "wrapper": entry("wrapper", ["postcss"])})
        self.lock["packages"]["node_modules/wrapper"] = {"version": "1.0.0"}
        expected = audit.npm_findings(data, self.lock, REPO)
        data["vulnerabilities"] = dict(reversed(list(data["vulnerabilities"].items())))
        data["vulnerabilities"]["postcss"]["via"].reverse()
        data["vulnerabilities"]["postcss"]["via"] *= 2
        data["vulnerabilities"]["postcss"]["nodes"].reverse()
        self.lock["packages"] = dict(reversed(list(self.lock["packages"].items())))
        self.assertEqual(expected, audit.npm_findings(data, self.lock, REPO))

    def test_real_semver_syntax_prereleases_and_invalid_inputs(self):
        self.assertEqual(audit.semver_matches([
            ["1.2.3", "^1.2.0"], ["2.0.0", "^1.2.0"], ["1.3.0", "~1.2.0"],
            ["2.4.0", "1.0.0 - 2.4.0"], ["3.2.1", "1.x || >=3.0.0 <4"],
            ["2.0.0-beta.1", "<2.0.0"], ["1.0.0+build.42", "1.0.0"]]),
            [True, False, False, True, True, True, True])
        for pair in (["invalid", "*"], ["1.0.0", "not-a-range"], ["1.0.0", ""]):
            with self.assertRaises(audit.InvalidScan):
                audit.semver_matches([pair])

    def test_empty_clean_and_contradictory_totals_fail_closed(self):
        clean = document({})
        self.assertEqual(audit.npm_findings(clean, self.lock, REPO), [])
        invalid = []
        for fields in ({"high": 1}, {"total": 1}, {"low": -1}, {"high": True}, {"high": "0"}):
            changed = copy.deepcopy(clean)
            changed["metadata"]["vulnerabilities"].update(fields)
            invalid.append(changed)
        for metadata in (None, [], {"vulnerabilities": None}, {"vulnerabilities": {"total": 0}}):
            invalid.append(dict(clean, metadata=metadata))
        for changed in invalid:
            with self.assertRaises(audit.InvalidScan):
                audit.npm_findings(changed, self.lock, REPO)
        populated = document({"postcss": entry("postcss", [advisory("postcss", "<8")], self.nodes)})
        populated["metadata"]["vulnerabilities"].update(high=0, low=1)
        with self.assertRaises(audit.InvalidScan):
            audit.npm_findings(populated, self.lock, REPO)

    def test_missing_or_cyclic_meta_causes_and_mismatched_nodes_fail_closed(self):
        data = document({"postcss": entry("postcss", ["missing"], self.nodes)})
        with self.assertRaises(audit.InvalidScan):
            audit.npm_findings(data, self.lock, REPO)
        data["vulnerabilities"]["postcss"]["via"] = ["postcss"]
        with self.assertRaises(audit.InvalidScan):
            audit.npm_findings(data, self.lock, REPO)
        data["vulnerabilities"]["postcss"]["via"] = [advisory("postcss", "<8")]
        data["vulnerabilities"]["postcss"]["nodes"] = ["node_modules/wrong"]
        self.lock["packages"]["node_modules/wrong"] = {"version": "7.0.39"}
        with self.assertRaises(audit.InvalidScan):
            audit.npm_findings(data, self.lock, REPO)

    def test_contradictory_audit_cannot_exit_complete(self):
        bad = document({})
        bad["metadata"]["vulnerabilities"]["high"] = 1
        with tempfile.TemporaryDirectory() as folder:
            bp = Path(folder) / "baseline.json"
            bp.write_text(json.dumps({"schemaVersion": 1, "findings": []}))
            with patch.object(sys, "argv", ["audit", "--kind", "frontend", "--baseline", str(bp), "--output", folder]), \
                 patch.object(audit, "command", return_value=subprocess.CompletedProcess([], 0, json.dumps(bad), "")):
                self.assertEqual(audit.main(), 2)
            report = json.loads((Path(folder) / "findings.json").read_text())
            self.assertEqual(report["status"], "SCAN_ERROR")

    def test_quality_gate_installs_locked_semver_before_python_tests(self):
        import yaml
        root = Path(__file__).resolve().parents[2]
        steps = yaml.safe_load((root / ".github/workflows/validate.yml").read_text())["jobs"]["validate"]["steps"]
        install = next(i for i, s in enumerate(steps) if s.get("run") == "npm ci")
        tests = next(i for i, s in enumerate(steps) if 'unittest discover' in s.get("run", ""))
        self.assertLess(install, tests)


if __name__ == "__main__":
    unittest.main()
