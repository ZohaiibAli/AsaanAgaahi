"""Family pairing: a Helper gets a 6-character code, a Learner joins with it.
This is what links one or more Learner accounts to the Helper watching over them."""
import random
import string
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.db import families, users
from app.schemas import PairJoinIn
from app.security import get_current_user

router = APIRouter(prefix="/pair", tags=["pairing"])


def _new_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(random.choices(alphabet, k=6))


@router.post("/create")
async def create_family(user: dict = Depends(get_current_user)):
    if user["role"] != "helper":
        raise HTTPException(403, "Only a Helper account can create a family code")

    existing = await families.find_one({"helper_id": str(user["_id"])})
    if existing:
        return {"code": existing["code"]}

    code = _new_code()
    while await families.find_one({"code": code}):
        code = _new_code()

    await families.insert_one({
        "code": code,
        "helper_id": str(user["_id"]),
        "helper_name": user["name"],
        "learner_ids": [],
        "created_at": datetime.now(timezone.utc),
    })
    return {"code": code}


@router.post("/join")
async def join_family(body: PairJoinIn, user: dict = Depends(get_current_user)):
    if user["role"] != "learner":
        raise HTTPException(403, "Only a Learner account can join with a family code")

    family = await families.find_one({"code": body.code.upper()})
    if not family:
        raise HTTPException(404, "That family code wasn't found. Please check it with your helper.")

    learner_id = str(user["_id"])
    if learner_id not in family["learner_ids"]:
        await families.update_one({"_id": family["_id"]}, {"$addToSet": {"learner_ids": learner_id}})
    await users.update_one({"_id": user["_id"]}, {"$set": {"family_code": family["code"]}})

    return {"code": family["code"], "helper_name": family["helper_name"]}


@router.get("/me")
async def my_family(user: dict = Depends(get_current_user)):
    if user["role"] == "helper":
        family = await families.find_one({"helper_id": str(user["_id"])})
        if not family:
            return {"paired": False}
        learners = await users.find({"_id": {"$in": [ObjectId(i) for i in family["learner_ids"]]}}).to_list(100)
        return {
            "paired": True,
            "code": family["code"],
            "learners": [{"id": str(l["_id"]), "name": l["name"]} for l in learners],
        }

    if not user.get("family_code"):
        return {"paired": False}
    family = await families.find_one({"code": user["family_code"]})
    return {"paired": True, "code": user["family_code"], "helper_name": family["helper_name"] if family else None}
