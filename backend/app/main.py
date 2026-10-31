"""FastAPI entrypoint. Run with: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
(from inside backend/, with the venv active)."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import ensure_indexes
from app.routers import alert, assign, auth, dashboard, explain, pairing, progress, scenarios, teachback, voice, ws

app = FastAPI(title="Practice Mode API")

# A mobile app on the same WiFi network, not a browser, so we keep CORS permissive —
# there's no cookie-based auth to protect, only a Bearer token the client sends itself.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await ensure_indexes()


@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(pairing.router)
app.include_router(scenarios.router)
app.include_router(progress.router)
app.include_router(teachback.router)
app.include_router(explain.router)
app.include_router(alert.router)
app.include_router(assign.router)
app.include_router(voice.router)
app.include_router(dashboard.router)
app.include_router(ws.router)
