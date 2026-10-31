"""Family Scam Alert — a Helper pastes a real scam message they (or someone in the
family) received, and it becomes a brand-new practice round pushed straight to the
paired Learner(s). The LLM writes the tappable segments; if it's unavailable, a simple
template (reusing the same keyword rules as /explain) keeps the feature working."""
import uuid
import json
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.db import alerts, families
from app.llm import generate
from app.routers.explain import KEYWORD_RULES
from app.schemas import AlertCreateIn
from app.security import get_current_user
from app.ws_manager import manager

router = APIRouter(prefix="/alert", tags=["alert"])


def _template_scenario(scenario_id: str, text: str) -> dict:
    lowered = text.lower()
    why = {"roman_ur": [], "ur": [], "en": []}
    red_flags: list[str] = []
    for pattern, explanation, _scenario in KEYWORD_RULES:
        if re.search(pattern, lowered):
            for lang in why:
                why[lang].append(explanation[lang])
            red_flags.append(explanation["en"])

    if not red_flags:
        why = {
            "roman_ur": ["Yeh message ajeeb lag raha hai, ghor se check karein."],
            "ur": ["یہ میسج عجیب لگ رہا ہے، غور سے چیک کریں۔"],
            "en": ["This message looks unusual — check it carefully."],
        }
        red_flags = ["unfamiliar sender or request"]

    join_why = {lang: " ".join(parts) for lang, parts in why.items()}
    return {
        "scenario_id": scenario_id,
        "title": {
            "roman_ur": "Family Alert Practice",
            "ur": "فیملی الرٹ پریکٹس",
            "en": "Family Alert Practice",
        },
        "channel": "sms",
        "sender": "Shared by your family",
        "is_scam": True,
        "segments": [{"text": text, "is_red_flag": True, "why": join_why}],
        "hints": [
            {"roman_ur": "Ghor se parhein, kuch ajeeb maanga ja raha hai.",
             "ur": "غور سے پڑھیں، کچھ عجیب مانگا جا رہا ہے۔",
             "en": "Read closely — something unusual is being asked."},
            {"roman_ur": "Kya is mein koi link, OTP, ya jaldi ka dabao hai?",
             "ur": "کیا اس میں کوئی لنک، او ٹی پی، یا جلدی کا دباؤ ہے؟",
             "en": "Does it include a link, an OTP request, or urgency?"},
            {"roman_ur": red_flags[0], "ur": red_flags[0], "en": red_flags[0]},
        ],
        "consequence": {
            "roman_ur": "Agar is par amal karte to nuqsaan ho sakta tha. Yahan mehfooz hain, dobara koshish karein!",
            "ur": "اگر اس پر عمل کرتے تو نقصان ہو سکتا تھا۔ یہاں محفوظ ہیں، دوبارہ کوشش کریں!",
            "en": "Acting on this could have caused real harm. You're safe here — try again!",
        },
        "red_flags": red_flags,
    }


async def _llm_scenario(scenario_id: str, text: str, note: str | None) -> dict | None:
    prompt = (
        "A family member in Pakistan received this real suspicious message. Turn it into a practice "
        "scenario for an elderly, non-technical learner, written for an app that teaches scam-spotting "
        "without ever making them feel foolish.\n"
        f"Message: \"{text}\"\n"
        f"Helper's note (context, may be empty): \"{note or ''}\"\n"
        "Reply with STRICT JSON only, no markdown, in exactly this shape (every text field present in "
        "three languages: roman_ur = Roman Urdu, ur = Urdu script, en = English):\n"
        "{\"title\": {\"roman_ur\":\"\",\"ur\":\"\",\"en\":\"\"}, \"sender\": \"short label\", "
        "\"segments\": [{\"text\": \"a short excerpt of the message\", \"is_red_flag\": true|false, "
        "\"why\": {\"roman_ur\":\"\",\"ur\":\"\",\"en\":\"\"}}], "
        "\"hints\": [{\"roman_ur\":\"\",\"ur\":\"\",\"en\":\"\"} x3, gentle to specific], "
        "\"consequence\": {\"roman_ur\":\"\",\"ur\":\"\",\"en\":\"\"}, \"red_flags\": [\"short phrase\", ...]}"
    )
    raw = await generate(prompt)
    if not raw:
        return None
    try:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        parsed = json.loads(match.group(0) if match else raw)
        parsed["scenario_id"] = scenario_id
        parsed["channel"] = "sms"
        parsed["is_scam"] = True
        parsed.setdefault("sender", "Shared by your family")
        return parsed
    except Exception:
        return None


@router.post("/create")
async def create_alert(body: AlertCreateIn, user: dict = Depends(get_current_user)):
    if user["role"] != "helper":
        raise HTTPException(403, "Only a Helper account can send a family alert")
    family = await families.find_one({"helper_id": str(user["_id"])})
    if not family:
        raise HTTPException(400, "Create a family pairing code first")

    scenario_id = f"alert_{uuid.uuid4().hex[:8]}"
    scenario = await _llm_scenario(scenario_id, body.text, body.note) or _template_scenario(scenario_id, body.text)

    doc = {
        **scenario,
        "family_code": family["code"],
        "created_by": str(user["_id"]),
        "note": body.note,
        "original_text": body.text,
        "created_at": datetime.now(timezone.utc),
    }
    await alerts.insert_one(doc)

    await manager.send_to_role(family["code"], "learner", {
        "type": "alert_scenario",
        "scenario_id": scenario_id,
        "title": scenario["title"],
        "message": "Ek naya practice round aaya hai",
    })

    doc.pop("_id", None)
    return doc
