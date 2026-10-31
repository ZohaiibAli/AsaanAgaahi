"""The realtime channel. One socket per (family code, role). Two inbound event types
matter here: a Learner's 'need_help' tap (persisted + relayed to the Helper) and a
Helper's 'nudge' reply (relayed straight back to the Learner, no persistence needed —
the progress/alert endpoints already persist their own history)."""
from datetime import datetime, timezone

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.db import help_requests
from app.security import decode_access_token
from app.ws_manager import manager

router = APIRouter()


@router.websocket("/ws/{code}")
async def ws_endpoint(websocket: WebSocket, code: str, role: str = Query(...), id: str = Query(...), token: str = Query(...)):
    try:
        decode_access_token(token)
    except Exception:
        await websocket.close(code=4401)
        return
    if role not in ("helper", "learner"):
        await websocket.close(code=4400)
        return

    await manager.connect(code, role, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type")

            if event_type == "need_help" and role == "learner":
                doc = {
                    "family_code": code,
                    "learner_id": id,
                    "learner_name": data.get("learner_name", ""),
                    "scenario_id": data.get("scenario_id"),
                    "scenario_title": data.get("scenario_title"),
                    "step": data.get("step"),
                    "hints_used": data.get("hints_used", 0),
                    "created_at": datetime.now(timezone.utc),
                }
                await help_requests.insert_one(doc)
                await manager.send_to_role(code, "helper", {
                    "type": "need_help",
                    "family_code": doc["family_code"],
                    "learner_id": doc["learner_id"],
                    "learner_name": doc["learner_name"],
                    "scenario_id": doc["scenario_id"],
                    "scenario_title": doc["scenario_title"],
                    "step": doc["step"],
                    "hints_used": doc["hints_used"],
                    "created_at": doc["created_at"].isoformat(),
                })

            elif event_type == "nudge" and role == "helper":
                await manager.send_to_role(code, "learner", {
                    "type": "nudge",
                    "message": data.get("message"),
                    "voice_id": data.get("voice_id"),
                })

    except WebSocketDisconnect:
        manager.disconnect(code, role, websocket)
