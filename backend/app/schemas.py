"""All request bodies in one place so every router's validation rules are easy to find."""
from typing import Literal, Optional

from pydantic import BaseModel, Field

Role = Literal["helper", "learner"]
Language = Literal["roman_ur", "ur", "en"]


# ---------- auth ----------
class RegisterIn(BaseModel):
    name: str
    country_code: str  # e.g. "+92"
    phone: str
    password: str = Field(min_length=4)
    role: Role
    language: Optional[Language] = "roman_ur"


class OtpVerifyIn(BaseModel):
    country_code: str
    phone: str
    code: str


class ResendOtpIn(BaseModel):
    country_code: str
    phone: str


class LoginIn(BaseModel):
    country_code: str
    phone: str
    password: str


# ---------- pairing ----------
class PairJoinIn(BaseModel):
    code: str


# ---------- progress ----------
class ProgressIn(BaseModel):
    scenario_id: str
    hints_used: int = 0
    wrong_taps: int = 0
    correct: bool
    confidence_before: int = Field(ge=1, le=5)
    confidence_after: int = Field(ge=1, le=5)
    teachback_ok: Optional[bool] = None


# ---------- teachback / explain ----------
class TeachbackIn(BaseModel):
    scenario_id: str
    answer_text: str


class ExplainIn(BaseModel):
    message_text: str


# ---------- helper actions ----------
class AlertCreateIn(BaseModel):
    text: str
    note: Optional[str] = None


class AssignIn(BaseModel):
    learner_id: str
    scenario_id: str


class NudgeIn(BaseModel):
    learner_id: str
    message: str
