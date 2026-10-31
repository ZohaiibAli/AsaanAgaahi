/**
 * One family-room WebSocket connection with auto-reconnect (capped exponential backoff).
 * Used by both the Learner ("need_help") and Helper ("nudge") sides.
 */
import { useEffect, useRef, useState } from "react";
import { WS_URL, getToken } from "./api";

export type WsEvent = { type: string; [key: string]: any };

export function useFamilySocket(code: string | null, role: "helper" | "learner", id: string | null, onEvent: (e: WsEvent) => void) {
  const socketRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const closedByUsRef = useRef(false);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!code || !id) return;
    closedByUsRef.current = false;

    let timer: ReturnType<typeof setTimeout>;

    const connect = async () => {
      const token = await getToken();
      if (!token || closedByUsRef.current) return;
      const url = `${WS_URL}/ws/${code}?role=${role}&id=${id}&token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        attemptRef.current = 0;
        setConnected(true);
      };
      ws.onmessage = (msg) => {
        try {
          onEventRef.current(JSON.parse(msg.data));
        } catch {
          // ignore malformed frames
        }
      };
      ws.onclose = () => {
        setConnected(false);
        if (closedByUsRef.current) return;
        const delay = Math.min(1000 * 2 ** attemptRef.current, 8000);
        attemptRef.current += 1;
        timer = setTimeout(connect, delay);
      };
      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      closedByUsRef.current = true;
      clearTimeout(timer);
      socketRef.current?.close();
    };
  }, [code, role, id]);

  const send = (event: WsEvent) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(event));
    }
  };

  return { connected, send };
}
