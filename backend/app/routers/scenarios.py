"""Serves the built-in scenario bank, plus any custom scenarios a Helper generated for
this family via the Family Scam Alert feature (see routers/alert.py)."""
from fastapi import APIRouter, Depends, HTTPException

from app.db import alerts
from app.scenarios_data import BUILT_IN_BY_ID, BUILT_IN_SCENARIOS
from app.security import get_current_user

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


def _strip_mongo_id(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = doc.pop("scenario_id", str(doc.get("_id")))
    doc.pop("_id", None)
    doc["is_custom"] = True
    return doc


@router.get("")
async def list_scenarios(user: dict = Depends(get_current_user)):
    result = list(BUILT_IN_SCENARIOS)
    code = user.get("family_code")
    if user["role"] == "helper":
        from app.db import families
        family = await families.find_one({"helper_id": str(user["_id"])})
        code = family["code"] if family else None
    if code:
        custom = await alerts.find({"family_code": code}).to_list(50)
        result += [_strip_mongo_id(c) for c in custom]
    return result


@router.get("/{scenario_id}")
async def get_scenario(scenario_id: str, user: dict = Depends(get_current_user)):
    if scenario_id in BUILT_IN_BY_ID:
        return BUILT_IN_BY_ID[scenario_id]
    custom = await alerts.find_one({"scenario_id": scenario_id})
    if custom:
        return _strip_mongo_id(custom)
    raise HTTPException(404, "Scenario not found")
