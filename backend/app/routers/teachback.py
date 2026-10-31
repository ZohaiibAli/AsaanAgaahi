"""'In your own words, why?' — checks whether the learner's explanation actually names
the real red flags, using the LLM when available and a keyword fallback when it isn't."""
import json
import re

from fastapi import APIRouter, Depends, HTTPException

from app.db import alerts
from app.llm import generate
from app.scenarios_data import BUILT_IN_BY_ID
from app.schemas import TeachbackIn
from app.security import get_current_user

router = APIRouter(tags=["teachback"])

FEEDBACK_GOOD = {
    "roman_ur": "Shabash! Aap ne sahi wajah pehchan li.",
    "ur": "شاباش! آپ نے صحیح وجہ پہچان لی۔",
    "en": "Well done! You spotted the real reason.",
}
FEEDBACK_PARTIAL = {
    "roman_ur": "Achi koshish! Ek aur cheez bhi dekhein, chalein saath mein dekhte hain.",
    "ur": "اچھی کوشش! ایک اور چیز بھی دیکھیں، چلیں ساتھ میں دیکھتے ہیں۔",
    "en": "Good try! There's one more thing to notice — let's look together.",
}
FEEDBACK_NONE = {
    "roman_ur": "Koi baat nahi, yeh mushkil ho sakta hai. Chalein hint ke saath dobara dekhte hain.",
    "ur": "کوئی بات نہیں، یہ مشکل ہو سکتا ہے۔ چلیں ہنٹ کے ساتھ دوبارہ دیکھتے ہیں۔",
    "en": "No worries, this one's tricky. Let's look at it again with a hint.",
}


async def _get_scenario(scenario_id: str) -> dict | None:
    if scenario_id in BUILT_IN_BY_ID:
        return BUILT_IN_BY_ID[scenario_id]
    return await alerts.find_one({"scenario_id": scenario_id})


def _keyword_fallback(red_flags: list[str], answer_text: str, lang: str) -> dict:
    text = answer_text.lower()
    caught, missed = [], []
    for flag in red_flags:
        # crude but reliable: any significant word (4+ letters) from the flag appearing in the answer counts as a hit
        words = [w for w in re.findall(r"[a-zA-Z]{4,}", flag.lower())]
        if any(w in text for w in words):
            caught.append(flag)
        else:
            missed.append(flag)
    understood = len(caught) >= max(1, len(red_flags) // 2)
    feedback = FEEDBACK_GOOD if not missed else (FEEDBACK_PARTIAL if caught else FEEDBACK_NONE)
    return {"understood": understood, "caught": caught, "missed": missed, "feedback": feedback[lang]}


@router.post("/teachback")
async def teachback(body: TeachbackIn, user: dict = Depends(get_current_user)):
    scenario = await _get_scenario(body.scenario_id)
    if not scenario:
        raise HTTPException(404, "Scenario not found")
    red_flags = scenario.get("red_flags", [])
    lang = user.get("language", "roman_ur")

    if red_flags:
        prompt = (
            "You are a kind, patient tutor helping an elderly first-time smartphone user in Pakistan "
            "understand why a message was a scam. Never make them feel foolish.\n"
            f"The real red flags in this scenario are: {json.dumps(red_flags)}\n"
            f"The learner's explanation (may be in Roman Urdu, Urdu script, or English): \"{body.answer_text}\"\n"
            f"Reply with STRICT JSON only, no markdown, no extra text, in this exact shape:\n"
            '{"understood": true|false, "caught": ["..."], "missed": ["..."], "feedback": "one short, encouraging '
            f'sentence written in {lang} (roman_ur = Roman Urdu, ur = Urdu script, en = English)"}}'
        )
        raw = await generate(prompt)
        if raw:
            try:
                match = re.search(r"\{.*\}", raw, re.DOTALL)
                parsed = json.loads(match.group(0) if match else raw)
                return {
                    "understood": bool(parsed.get("understood")),
                    "caught": parsed.get("caught", []),
                    "missed": parsed.get("missed", []),
                    "feedback": parsed.get("feedback", FEEDBACK_PARTIAL[lang]),
                }
            except Exception:
                pass  # fall through to keyword fallback

    return _keyword_fallback(red_flags, body.answer_text, lang)
