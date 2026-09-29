import copy
import json
import pathlib
import unittest
from compare_contract import verify


class ContractDriftTests(unittest.TestCase):
    def test_nested_casing_and_schema_drift_fail_even_if_parser_accepts_legacy(self):
        path = pathlib.Path(__file__).resolve().parents[2] / "src/api/__fixtures__/api-contract.generated.json"
        current = json.loads(path.read_text(encoding="utf-8"))
        verify(current, copy.deepcopy(current))
        for field in ("startTime", "durationMinutes", "status", "teamName"):
            changed = copy.deepcopy(current)
            conflict = changed["attendanceConflict"]["body"]["conflicts"][0]
            conflict[field[0].upper() + field[1:]] = conflict.pop(field)
            with self.assertRaises(AssertionError):
                verify(changed, current)
