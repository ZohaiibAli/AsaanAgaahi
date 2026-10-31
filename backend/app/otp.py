"""OTP generation/verification for phone registration and login.

No SMS gateway is configured for this hackathon build (OTP_PROVIDER=mock), so instead of
texting the code we hash+store it like a real provider would, but also hand it back in the
API response and print it to the console — clearly labelled as a demo code. Swapping in a
real provider later only means replacing `_send` and setting OTP_PROVIDER=twilio; nothing
else in the app changes.
"""
import hashlib
import random
from datetime import datetime, timedelta, timezone

from app.config import settings
from app.db import otps


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


async def _send(phone: str, code: str) -> None:
    if settings.otp_provider == "mock":
        print(f"[OTP][MOCK] would SMS {phone}: your Practice Mode code is {code}")
    else:
        # Real providers (e.g. Twilio) would go here. Falling back to mock keeps the
        # demo working even if a gateway isn't configured yet.
        print(f"[OTP][{settings.otp_provider} not implemented, falling back to mock] {phone}: {code}")


async def generate_and_send_otp(phone: str, purpose: str) -> str:
    code = f"{random.randint(0, 999999):06d}"
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.otp_expire_seconds)
    # one live OTP per (phone, purpose) at a time
    await otps.delete_many({"phone": phone, "purpose": purpose})
    await otps.insert_one({
        "phone": phone,
        "purpose": purpose,
        "code_hash": _hash_code(code),
        "expires_at": expires_at,
        "verified": False,
        "attempts": 0,
    })
    await _send(phone, code)
    return code  # returned so the API can surface it in dev/demo mode


async def verify_otp(phone: str, purpose: str, code: str) -> bool:
    record = await otps.find_one({"phone": phone, "purpose": purpose})
    if not record:
        return False
    if record["attempts"] >= 5:
        return False
    await otps.update_one({"_id": record["_id"]}, {"$inc": {"attempts": 1}})
    if datetime.now(timezone.utc) > record["expires_at"].replace(tzinfo=timezone.utc):
        return False
    if record["code_hash"] != _hash_code(code):
        return False
    await otps.update_one({"_id": record["_id"]}, {"$set": {"verified": True}})
    return True


async def consume_verified_otp(phone: str, purpose: str) -> bool:
    """Checks the OTP was verified, then deletes it so it can't be replayed."""
    record = await otps.find_one({"phone": phone, "purpose": purpose, "verified": True})
    if not record:
        return False
    await otps.delete_one({"_id": record["_id"]})
    return True
