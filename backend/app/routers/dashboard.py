"""Everything the Helper dashboard needs in one call: per-learner trends, a live
activity feed, and outstanding 'Samajh nahi aaya' requests."""
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.db import families, help_requests, progress, users
from app.security import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/{code}")
async def dashboard(code: str, user: dict = Depends(get_current_user)):
    family = await families.find_one({"code": code})
    if not family or family["helper_id"] != str(user["_id"]):
        raise HTTPException(403, "Not your family dashboard")

    learners = await users.find({"_id": {"$in": [ObjectId(i) for i in family["learner_ids"]]}}).to_list(100)

    per_learner = []
    activity: list[dict] = []
    for learner in learners:
        lid = str(learner["_id"])
        rows = await progress.find({"learner_id": lid}).sort("created_at", 1).to_list(500)
        for r in rows:
            r["_id"] = str(r["_id"])
            activity.append({"type": "progress", "learner_name": learner["name"], **r})

        per_learner.append({
            "learner_id": lid,
            "name": learner["name"],
            "scenarios_completed": len(rows),
            "independence_trend": [r["independence_score"] for r in rows],
            "confidence_before_trend": [r["confidence_before"] for r in rows],
            "confidence_after_trend": [r["confidence_after"] for r in rows],
            "latest_independence_score": rows[-1]["independence_score"] if rows else None,
        })

    help_rows = await help_requests.find({"family_code": code}).sort("created_at", -1).to_list(50)
    for h in help_rows:
        h["_id"] = str(h["_id"])
        activity.append({"type": "need_help", **h})

    activity.sort(key=lambda a: a.get("created_at"), reverse=True)

    return {
        "code": code,
        "learners": per_learner,
        "help_requests": help_rows,
        "activity_feed": activity[:40],
    }
