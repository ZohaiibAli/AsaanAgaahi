/**
 * One family-room realtime connection. Used by both the Learner ("need_help") and
 * Helper ("nudge") sides. In EXPO_PUBLIC_MOCK=true mode it never opens a real socket —
 * it subscribes to the in-process mock event bus instead, so realtime features still
 * work live (even across two mounted screens) with zero backend involved.
 */
import { useEffect, useRef, useState } from "react";
import { MOCK, WS_URL, getToken } from "./api";
import { mockRecordNeedHelp, mockSendNudge, mockSubscribe } from "./mock/store";

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

    if (MOCK) {
      const unsubscribe = mockSubscribe(code, role, (e) => onEventRef.current(e));
      setConnected(true);
      return () => {
        setConnected(false);
        unsubscribe();
      };
    }

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
    if (MOCK) {
      if (!code) return;
      if (event.type === "need_help") mockRecordNeedHelp(code, id ?? "", event.learner_name ?? "", event);
      else if (event.type === "nudge") mockSendNudge(code, event.message, event.voice_id);
      return;
    }
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(event));
    }
  };

  return { connected, send };
}
