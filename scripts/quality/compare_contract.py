"""Compare generated HTTP contract copies; no normalization of keys or values."""
import json
import pathlib
import sys


def verify(backend, frontend):
    assert backend == frontend, "Backend HTTP contract differs: regenerate and review BOTH consumer and producer."


if __name__ == "__main__":
    verify(*(json.loads(pathlib.Path(path).read_text(encoding="utf-8")) for path in sys.argv[1:]))
    print("Backend -> frontend HTTP contract matches")
