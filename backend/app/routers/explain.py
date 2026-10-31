"""'Paste a real message' — the learner drops in something suspicious they actually
received and gets a plain-language read on it, never 'click here to check'."""
import json
import re

from fastapi import APIRouter, Depends

from app.llm import generate
from app.schemas import ExplainIn
from app.security import get_current_user

router = APIRouter(tags=["explain"])

# keyword -> (red flag explanation, suggested practice scenario)
KEYWORD_RULES: list[tuple[str, dict, str]] = [
    (r"otp|one.?time.?code|code bata", {
        "roman_ur": "Yeh OTP ya security code maang raha hai — yeh kabhi kisi ko nahi dena chahiye.",
        "ur": "یہ او ٹی پی یا سیکیورٹی کوڈ مانگ رہا ہے — یہ کبھی کسی کو نہیں دینا چاہیے۔",
        "en": "It's asking for an OTP or security code — never share that with anyone.",
    }, "otp_caller"),
    (r"jeet|winner|lucky draw|inaam|prize|mubarak", {
        "roman_ur": "Ek anokha inaam ka dawa kar raha hai jo aap ne kabhi apply nahi kiya.",
        "ur": "ایک انوکھا انعام کا دعویٰ کر رہا ہے جو آپ نے کبھی اپلائی نہیں کیا۔",
        "en": "It claims an unexpected prize you never entered for.",
    }, "easypaisa_prize"),
    (r"block|suspend|verify|cnic|pin", {
        "roman_ur": "Account band hone ki dhamki de kar jaldi mein faisla karwana chah raha hai.",
        "ur": "اکاؤنٹ بند ہونے کی دھمکی دے کر جلدی میں فیصلہ کروانا چاہ رہا ہے۔",
        "en": "It threatens to block your account to rush you into a decision.",
    }, "account_blocked"),
    (r"fbr|tax|baqaya", {
        "roman_ur": "FBR tax ke naam par dhamki de raha hai, asal FBR aise SMS link nahi bhejta.",
        "ur": "ایف بی آر ٹیکس کے نام پر دھمکی دے رہا ہے، اصل ایف بی آر ایسے ایس ایم ایس لنک نہیں بھیجتا۔",
        "en": "It threatens tax trouble in FBR's name — the real FBR doesn't send SMS links like this.",
    }, "fbr_tax_notice"),
    (r"bisp|kafaalat|benazir", {
        "roman_ur": "BISP payment ka jhoota dawa kar raha hai, asal BISP SMS link nahi bhejta.",
        "ur": "بی آئی ایس پی پیمنٹ کا جھوٹا دعویٰ کر رہا ہے، اصل بی آئی ایس پی ایس ایم ایس لنک نہیں بھیجتا۔",
        "en": "It falsely claims a BISP payment — the real BISP doesn't send SMS links.",
    }, "bisp_payment"),
    (r"parcel|courier|customs|delivery|tcs|leopard", {
        "roman_ur": "Parcel/customs fee ka jhoota dawa ho sakta hai, khaas kar agar kuch order nahi kiya.",
        "ur": "پارسل/کسٹمز فیس کا جھوٹا دعویٰ ہو سکتا ہے، خاص کر اگر کچھ آرڈر نہیں کیا۔",
        "en": "It may be a fake parcel/customs fee claim, especially if you didn't order anything.",
    }, "fake_delivery"),
    (r"http|www\.|\.xyz|\.info|bit\.ly|tinyurl|link", {
        "roman_ur": "Ek anjaan link shamil hai — official companies aise ajeeb links istemal nahi kartein.",
        "ur": "ایک انجان لنک شامل ہے — آفیشل کمپنیاں ایسے عجیب لنکس استعمال نہیں کرتیں۔",
        "en": "It includes an unfamiliar link — official companies don't use odd links like this.",
    }, "fake_delivery"),
    (r"turant|jaldi|abhi|urgent|immediately|24 hour|2 ghante", {
        "roman_ur": "Bohat jaldi faisla karwaya ja raha hai — yeh dabao dalne ka tareeqa hai.",
        "ur": "بہت جلدی فیصلہ کروایا جا رہا ہے — یہ دباؤ ڈالنے کا طریقہ ہے۔",
        "en": "It's pushing you to decide very fast — a classic pressure tactic.",
    }, "account_blocked"),
]

WHAT_TO_DO = {
    "roman_ur": "Is link par click na karein. Apne bank ya company ko unke official number par khud call karein, sirf unhi logon se poochain jin par aap bharosa karte hain.",
    "ur": "اس لنک پر کلک نہ کریں۔ اپنے بینک یا کمپنی کو ان کے آفیشل نمبر پر خود کال کریں، صرف انہی لوگوں سے پوچھیں جن پر آپ بھروسہ کرتے ہیں۔",
    "en": "Don't click the link. Call your bank or the company directly on their official number, or ask someone you trust.",
}
WHAT_TO_DO_SAFE = {
    "roman_ur": "Koi khaas red flag nazar nahi aaya, lekin agar kuch anjaan ho to hamesha official number par confirm karein.",
    "ur": "کوئی خاص ریڈ فلیگ نظر نہیں آیا، لیکن اگر کچھ انجان ہو تو ہمیشہ آفیشل نمبر پر کنفرم کریں۔",
    "en": "No major red flags spotted, but when in doubt, always confirm through an official number.",
}


def _keyword_fallback(text: str, lang: str) -> dict:
    lowered = text.lower()
    flags, suggestion = [], None
    for pattern, explanation, scenario in KEYWORD_RULES:
        if re.search(pattern, lowered):
            flags.append(explanation[lang])
            suggestion = suggestion or scenario

    if len(flags) >= 2:
        verdict = "likely_scam"
    elif len(flags) == 1:
        verdict = "not_sure"
    else:
        verdict = "looks_safe"

    return {
        "verdict": verdict,
        "red_flags": flags,
        "what_to_do": (WHAT_TO_DO if flags else WHAT_TO_DO_SAFE)[lang],
        "practice_suggestion": suggestion,
    }


@router.post("/explain")
async def explain(body: ExplainIn, user: dict = Depends(get_current_user)):
    lang = user.get("language", "roman_ur")
    fallback = _keyword_fallback(body.message_text, lang)

    prompt = (
        "You help an elderly, non-technical user in Pakistan understand if a message they received is a scam. "
        "Use short, plain, non-technical language. Never say 'click here' or suggest opening any link.\n"
        f"Message: \"{body.message_text}\"\n"
        f"Reply with STRICT JSON only, no markdown, in this exact shape, with all text written in "
        f"{lang} (roman_ur = Roman Urdu, ur = Urdu script, en = English):\n"
        '{"verdict": "likely_scam"|"looks_safe"|"not_sure", "red_flags": ["short phrase", ...], '
        '"what_to_do": "one short sentence, never telling them to click a link", '
        '"practice_suggestion": "one short sentence suggesting they try a related practice round"}'
    )
    raw = await generate(prompt)
    if raw:
        try:
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            parsed = json.loads(match.group(0) if match else raw)
            return {
                "verdict": parsed.get("verdict", fallback["verdict"]),
                "red_flags": parsed.get("red_flags", fallback["red_flags"]),
                "what_to_do": parsed.get("what_to_do", fallback["what_to_do"]),
                "practice_suggestion": parsed.get("practice_suggestion") or fallback["practice_suggestion"],
            }
        except Exception:
            pass

    return fallback
