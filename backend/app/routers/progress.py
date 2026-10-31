"""Records one practice round. Independence score rewards needing FEWER hints, not
getting the right answer — a learner who got there alone after a wrong guess still
beats one who got it right only because of hint 3."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.db import progress, users
from app.schemas import ProgressIn
from app.security import get_current_user
from app.ws_manager import manager

router = APIRouter(tags=["progress"])

HINT_SCORE = {0: 100, 1: 70, 2: 40, 3: 10}


def independence_score(hints_used: int) -> int:
    return HINT_SCORE.get(min(hints_used, 3), 10)


@router.post("/progress")
async def submit_progress(body: ProgressIn, user: dict = Depends(get_current_user)):
    if user["role"] != "learner":
        raise HTTPException(403, "Only a Learner account can submit progress")
    code = user.get("family_code")
    if not code:
        raise HTTPException(400, "Join a family with a pairing code first")

    score = independence_score(body.hints_used)
    doc = {
        "family_code": code,
        "learner_id": str(user["_id"]),
        "learner_name": user["name"],
        "scenario_id": body.scenario_id,
        "hints_used": body.hints_used,
        "wrong_taps": body.wrong_taps,
        "correct": body.correct,
        "confidence_before": body.confidence_before,
        "confidence_after": body.confidence_after,
        "teachback_ok": body.teachback_ok,
        "independence_score": score,
        "created_at": datetime.now(timezone.utc),
    }
    await progress.insert_one(doc)

    await manager.broadcast(code, {
        "type": "progress_update",
        "learner_id": str(user["_id"]),
        "learner_name": user["name"],
        "scenario_id": body.scenario_id,
        "independence_score": score,
        "correct": body.correct,
    })

    return {"independence_score": score}


@router.get("/progress/me")
async def my_progress(user: dict = Depends(get_current_user)):
    rows = await progress.find({"learner_id": str(user["_id"])}).sort("created_at", 1).to_list(500)
    for r in rows:
        r["_id"] = str(r["_id"])
    return rows
