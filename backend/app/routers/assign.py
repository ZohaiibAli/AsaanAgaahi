"""Helper picks the next scenario for a specific Learner; it shows up on their home
screen and over the WebSocket as a live nudge if they're online right now."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.db import assignments, families
from app.scenarios_data import BUILT_IN_BY_ID
from app.schemas import AssignIn
from app.security import get_current_user
from app.ws_manager import manager

router = APIRouter(tags=["assign"])


@router.post("/assign")
async def assign_scenario(body: AssignIn, user: dict = Depends(get_current_user)):
    if user["role"] != "helper":
        raise HTTPException(403, "Only a Helper account can assign a scenario")
    family = await families.find_one({"helper_id": str(user["_id"])})
    if not family or body.learner_id not in family["learner_ids"]:
        raise HTTPException(404, "That learner isn't in your family")

    await assignments.insert_one({
        "family_code": family["code"],
        "learner_id": body.learner_id,
        "scenario_id": body.scenario_id,
        "created_at": datetime.now(timezone.utc),
        "done": False,
    })

    title = BUILT_IN_BY_ID.get(body.scenario_id, {}).get("title", {"en": body.scenario_id})
    await manager.send_to_role(family["code"], "learner", {
        "type": "assignment",
        "learner_id": body.learner_id,
        "scenario_id": body.scenario_id,
        "title": title,
    })
    return {"ok": True}


@router.get("/assign/me")
async def my_assignments(user: dict = Depends(get_current_user)):
    if user["role"] != "learner":
        raise HTTPException(403, "Only a Learner account has assignments")
    rows = await assignments.find({"learner_id": str(user["_id"]), "done": False}).sort("created_at", -1).to_list(20)
    for r in rows:
        r["_id"] = str(r["_id"])
    return rows
