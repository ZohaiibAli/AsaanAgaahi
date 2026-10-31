"""Loads the built-in scenario bank from scenarios.json once at import time."""
import json
from pathlib import Path

SCENARIOS_PATH = Path(__file__).resolve().parent.parent / "scenarios.json"

with open(SCENARIOS_PATH, "r", encoding="utf-8") as f:
    BUILT_IN_SCENARIOS: list[dict] = json.load(f)

BUILT_IN_BY_ID = {s["id"]: s for s in BUILT_IN_SCENARIOS}
