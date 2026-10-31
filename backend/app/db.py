"""MongoDB connection (Motor, async). All app state lives here — no in-memory dicts,
so progress and pairing survive a backend restart during the demo."""
from motor.motor_asyncio import AsyncIOMotorClient

from app.config import settings

client = AsyncIOMotorClient(settings.mongo_uri)
db = client[settings.db_name]

users = db["users"]
otps = db["otps"]
families = db["families"]
progress = db["progress"]
assignments = db["assignments"]
alerts = db["alerts"]          # custom scenarios a Helper generated from a real message
voice_notes = db["voice_notes"]  # metadata only; audio bytes live on disk under backend/data/voice
help_requests = db["help_requests"]  # "Samajh nahi aaya" taps, so the dashboard keeps a history


async def ensure_indexes() -> None:
    """Called once on startup. Unique indexes double as a cheap integrity check."""
    await users.create_index("phone", unique=True)
    await families.create_index("code", unique=True)
    await otps.create_index("expires_at", expireAfterSeconds=0)  # Mongo TTL auto-cleanup
