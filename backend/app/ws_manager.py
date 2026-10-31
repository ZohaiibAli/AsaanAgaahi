"""Keeps live WebSocket connections per family code, grouped by role, and broadcasts
typed JSON events to them. Connections themselves can't live in Mongo — only the events
they carry get persisted (by the routers that call broadcast)."""
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        # {family_code: {"helper": [sockets], "learner": [sockets]}}
        self._rooms: dict[str, dict[str, list[WebSocket]]] = {}

    def _room(self, code: str) -> dict[str, list[WebSocket]]:
        return self._rooms.setdefault(code, {"helper": [], "learner": []})

    async def connect(self, code: str, role: str, ws: WebSocket) -> None:
        await ws.accept()
        self._room(code)[role].append(ws)

    def disconnect(self, code: str, role: str, ws: WebSocket) -> None:
        sockets = self._room(code)[role]
        if ws in sockets:
            sockets.remove(ws)

    async def send_to_role(self, code: str, role: str, event: dict) -> None:
        for ws in list(self._room(code)[role]):
            try:
                await ws.send_json(event)
            except Exception as exc:
                print(f"[ws] send_to_role failed, dropping socket: {exc!r}")
                self.disconnect(code, role, ws)

    async def broadcast(self, code: str, event: dict) -> None:
        await self.send_to_role(code, "helper", event)
        await self.send_to_role(code, "learner", event)


manager = ConnectionManager()
