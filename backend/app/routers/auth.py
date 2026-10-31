"""Phone + password accounts for both roles, with OTP confirmation on registration.

Flow: POST /auth/register -> OTP is generated and "sent" (mocked, see app/otp.py) ->
POST /auth/verify-otp confirms it and logs the user in (returns a JWT) ->
POST /auth/login is the normal returning-user path (phone + password, no OTP).
"""
import re

from fastapi import APIRouter, Depends, HTTPException

from app.config import settings
from app.db import users
from app.otp import consume_verified_otp, generate_and_send_otp, verify_otp
from app.schemas import (
    LoginIn,
    OtpVerifyIn,
    RegisterIn,
    ResendOtpIn,
)
from app.security import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _canonical_phone(country_code: str, phone: str) -> str:
    digits = re.sub(r"\D", "", phone)
    code = country_code if country_code.startswith("+") else f"+{country_code}"
    return f"{code}{digits}"


def _public_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "phone": user["phone"],
        "country_code": user["country_code"],
        "role": user["role"],
        "language": user.get("language", "roman_ur"),
        "family_code": user.get("family_code"),
    }


@router.post("/register")
async def register(body: RegisterIn):
    phone = _canonical_phone(body.country_code, body.phone)
    existing = await users.find_one({"phone": phone})
    if existing and existing.get("otp_verified"):
        raise HTTPException(409, "This phone number is already registered. Try logging in.")

    doc = {
        "phone": phone,
        "country_code": body.country_code,
        "name": body.name.strip(),
        "password_hash": hash_password(body.password),
        "role": body.role,
        "language": body.language or "roman_ur",
        "otp_verified": False,
        "family_code": None,
    }
    if existing:
        await users.update_one({"_id": existing["_id"]}, {"$set": doc})
    else:
        await users.insert_one(doc)

    code = await generate_and_send_otp(phone, "register")
    return {
        "message": "OTP sent" if settings.otp_provider != "mock" else "OTP generated (demo mode, no SMS gateway configured)",
        "dev_otp": code if settings.otp_provider == "mock" else None,
    }


@router.post("/resend-otp")
async def resend_otp(body: ResendOtpIn):
    phone = _canonical_phone(body.country_code, body.phone)
    if not await users.find_one({"phone": phone}):
        raise HTTPException(404, "No registration in progress for this number")
    code = await generate_and_send_otp(phone, "register")
    return {"dev_otp": code if settings.otp_provider == "mock" else None}


@router.post("/verify-otp")
async def verify_otp_route(body: OtpVerifyIn):
    phone = _canonical_phone(body.country_code, body.phone)
    if not await verify_otp(phone, "register", body.code):
        raise HTTPException(400, "That code is incorrect or expired. Please try again.")
    await consume_verified_otp(phone, "register")
    await users.update_one({"phone": phone}, {"$set": {"otp_verified": True}})
    user = await users.find_one({"phone": phone})
    token = create_access_token(str(user["_id"]))
    return {"token": token, "user": _public_user(user)}


@router.post("/login")
async def login(body: LoginIn):
    phone = _canonical_phone(body.country_code, body.phone)
    user = await users.find_one({"phone": phone})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Phone number or password is incorrect")
    if not user.get("otp_verified"):
        raise HTTPException(403, "Please verify your phone number first")
    token = create_access_token(str(user["_id"]))
    return {"token": token, "user": _public_user(user)}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return _public_user(user)
