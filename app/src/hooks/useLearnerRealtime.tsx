/**
 * One shared WebSocket for every Learner screen. Lives above the (learner) stack so a
 * Helper's nudge can show up as a banner no matter which screen the learner is on, and
 * "Samajh nahi aaya" can be fired from any screen without opening a second connection.
 */
import React, { createContext, useContext, useState } from "react";
import { useAuth } from "./useAuth";
import { useFamilySocket, WsEvent } from "../ws";

type NeedHelpContext = { scenario_id?: string; scenario_title?: string; step?: string; hints_used?: number };
type Nudge = { message?: string; voice_id?: string };

type Value = {
  connected: boolean;
  sendNeedHelp: (ctx: NeedHelpContext) => void;
  nudge: Nudge | null;
  dismissNudge: () => void;
  latestAssignment: WsEvent | null;
  latestAlert: WsEvent | null;
};

const LearnerRealtimeContext = createContext<Value>({
  connected: false,
  sendNeedHelp: () => {},
  nudge: null,
  dismissNudge: () => {},
  latestAssignment: null,
  latestAlert: null,
});

export function LearnerRealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const [latestAssignment, setLatestAssignment] = useState<WsEvent | null>(null);
  const [latestAlert, setLatestAlert] = useState<WsEvent | null>(null);

  const { connected, send } = useFamilySocket(user?.family_code ?? null, "learner", user?.id ?? null, (event) => {
    if (event.type === "nudge" || event.type === "voice_hint") setNudge({ message: event.message, voice_id: event.voice_id });
    else if (event.type === "assignment") setLatestAssignment(event);
    else if (event.type === "alert_scenario") setLatestAlert(event);
  });

  const sendNeedHelp = (ctx: NeedHelpContext) => {
    send({ type: "need_help", learner_name: user?.name, ...ctx });
  };

  return (
    <LearnerRealtimeContext.Provider
      value={{ connected, sendNeedHelp, nudge, dismissNudge: () => setNudge(null), latestAssignment, latestAlert }}
    >
      {children}
    </LearnerRealtimeContext.Provider>
  );
}

export function useLearnerRealtime() {
  return useContext(LearnerRealtimeContext);
}
