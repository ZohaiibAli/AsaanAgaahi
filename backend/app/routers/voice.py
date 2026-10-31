"""Family Voice Hint — the Helper records a short voice note (expo-audio) and it shows
up as 'Message from your family' on the Learner's hint screen. Metadata lives in Mongo,
the audio bytes sit on disk under backend/data/voice/<family_code>/<id>.<ext>."""
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.db import families, voice_notes
from app.security import get_current_user
from app.ws_manager import manager

router = APIRouter(prefix="/voice", tags=["voice"])

VOICE_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "voice"


def _family_of(user: dict) -> str | None:
    return user.get("family_code")


@router.post("/{code}")
async def upload_voice(
    code: str,
    file: UploadFile,
    scenario_id: str | None = Form(None),
    user: dict = Depends(get_current_user),
):
    if user["role"] != "helper":
        raise HTTPException(403, "Only a Helper account can record a family voice hint")
    family = await families.find_one({"helper_id": str(user["_id"]), "code": code})
    if not family:
        raise HTTPException(404, "That isn't your family code")

    voice_id = uuid.uuid4().hex[:12]
    ext = Path(file.filename or "note.m4a").suffix or ".m4a"
    folder = VOICE_DIR / code
    folder.mkdir(parents=True, exist_ok=True)
    dest = folder / f"{voice_id}{ext}"
    dest.write_bytes(await file.read())

    await voice_notes.insert_one({
        "voice_id": voice_id,
        "family_code": code,
        "scenario_id": scenario_id,
        "filename": dest.name,
        "content_type": file.content_type or "audio/m4a",
        "uploaded_by": user["name"],
        "created_at": datetime.now(timezone.utc),
    })

    await manager.send_to_role(code, "learner", {
        "type": "voice_hint",
        "voice_id": voice_id,
        "scenario_id": scenario_id,
    })
    return {"voice_id": voice_id}


@router.get("/{code}/list")
async def list_voice(code: str, user: dict = Depends(get_current_user)):
    if _family_of(user) != code and user["role"] != "helper":
        raise HTTPException(403, "Not part of this family")
    rows = await voice_notes.find({"family_code": code}).sort("created_at", -1).to_list(50)
    for r in rows:
        r["_id"] = str(r["_id"])
    return rows


@router.get("/{code}/{voice_id}")
async def download_voice(code: str, voice_id: str):
    # No auth dependency here: expo-audio's player loads this URL directly and can't
    # attach an Authorization header. The random family code + voice id pair is the
    # only guard, which is an acceptable tradeoff for a local hackathon demo.
    note = await voice_notes.find_one({"family_code": code, "voice_id": voice_id})
    if not note:
        raise HTTPException(404, "Voice note not found")
    path = VOICE_DIR / code / note["filename"]
    if not path.exists():
        raise HTTPException(404, "Voice file missing on server")
    return FileResponse(path, media_type=note["content_type"])
