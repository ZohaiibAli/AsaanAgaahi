/**
 * Thin REST client. Every call attaches the stored JWT (if any) and throws a plain
 * Error with the backend's own message so screens can show it directly.
 *
 * When EXPO_PUBLIC_MOCK=true, every exported function below is served by the fully
 * offline mock backend in ./mock/store instead of a real fetch — same shapes, same
 * delays, so no screen needs to know which one it's talking to.
 */
import { Platform } from "react-native";
import { mockApi } from "./mock/store";
import { storageDelete, storageGet, storageSet } from "./storage";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
export const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? "ws://localhost:8000";
export const MOCK = process.env.EXPO_PUBLIC_MOCK === "true";

const TOKEN_KEY = "practice_mode_token";

export async function getToken(): Promise<string | null> {
  return storageGet(TOKEN_KEY);
}
export async function setToken(token: string): Promise<void> {
  await storageSet(TOKEN_KEY, token);
}
export async function clearToken(): Promise<void> {
  await storageDelete(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    // no connection to the backend (WiFi down, backend not running, wrong IP in .env, ...)
    throw new Error("Connection nahi ho saka. Apna WiFi aur backend check karein.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Something went wrong. Please try again.");
  }
  return data as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });

// ---------- types ----------
export type Role = "helper" | "learner";
export type Language = "roman_ur" | "ur" | "en";
export type Tri = { roman_ur: string; ur: string; en: string };

export type User = {
  id: string;
  name: string;
  phone: string;
  country_code: string;
  role: Role;
  language: Language;
  family_code: string | null;
};

export type Segment = { text: string; is_red_flag: boolean; why: Tri };
export type Scenario = {
  id: string;
  title: Tri;
  channel: "sms" | "whatsapp" | "call";
  sender: string;
  is_scam: boolean;
  segments: Segment[];
  hints: Tri[];
  consequence: Tri;
  red_flags: string[];
  is_custom?: boolean;
};

// ---------- auth ----------
export const register = (body: { name: string; country_code: string; phone: string; password: string; role: Role; language: Language }) =>
  MOCK ? mockApi.register(body) : post<{ message: string; dev_otp: string | null }>("/auth/register", body);

export const resendOtp = (body: { country_code: string; phone: string }) =>
  MOCK ? mockApi.resendOtp(body) : post<{ dev_otp: string | null }>("/auth/resend-otp", body);

export const verifyOtp = (body: { country_code: string; phone: string; code: string }) =>
  MOCK ? mockApi.verifyOtp(body) : post<{ token: string; user: User }>("/auth/verify-otp", body);

export const login = (body: { country_code: string; phone: string; password: string }) =>
  MOCK ? mockApi.login(body) : post<{ token: string; user: User }>("/auth/login", body);

export const me = async () => (MOCK ? mockApi.me(await getToken()) : get<User>("/auth/me"));

// ---------- pairing ----------
export const pairCreate = async () => (MOCK ? mockApi.pairCreate(await getToken()) : post<{ code: string }>("/pair/create"));
export const pairJoin = async (code: string) =>
  MOCK ? mockApi.pairJoin(await getToken(), code) : post<{ code: string; helper_name: string }>("/pair/join", { code });
export const pairMe = async () =>
  MOCK
    ? mockApi.pairMe(await getToken())
    : get<{ paired: boolean; code?: string; helper_name?: string; learners?: { id: string; name: string }[] }>("/pair/me");

// ---------- scenarios ----------
export const listScenarios = async () => (MOCK ? mockApi.listScenarios(await getToken()) : get<Scenario[]>("/scenarios"));
export const getScenario = async (id: string) =>
  MOCK ? mockApi.getScenario(await getToken(), id) : get<Scenario>(`/scenarios/${id}`);

// ---------- progress ----------
export const submitProgress = async (body: {
  scenario_id: string;
  hints_used: number;
  wrong_taps: number;
  correct: boolean;
  confidence_before: number;
  confidence_after: number;
  teachback_ok: boolean | null;
}) => (MOCK ? mockApi.submitProgress(await getToken(), body) : post<{ independence_score: number }>("/progress", body));

export const myProgress = async () => (MOCK ? mockApi.myProgress(await getToken()) : get<any[]>("/progress/me"));

// ---------- teachback / explain ----------
export const teachback = async (body: { scenario_id: string; answer_text: string }) =>
  MOCK
    ? mockApi.teachback(await getToken(), body)
    : post<{ understood: boolean; caught: string[]; missed: string[]; feedback: string }>("/teachback", body);

export const explain = async (body: { message_text: string }) =>
  MOCK
    ? mockApi.explain(await getToken(), body)
    : post<{ verdict: string; red_flags: string[]; what_to_do: string; practice_suggestion: string | null }>("/explain", body);

// ---------- helper actions ----------
export const createAlert = async (body: { text: string; note?: string }) =>
  MOCK ? mockApi.createAlert(await getToken(), body) : post<Scenario>("/alert/create", body);
export const assignScenario = async (body: { learner_id: string; scenario_id: string }) =>
  MOCK ? mockApi.assignScenario(await getToken(), body) : post<{ ok: boolean }>("/assign", body);
export const myAssignments = async () => (MOCK ? mockApi.myAssignments(await getToken()) : get<any[]>("/assign/me"));

// ---------- voice ----------
export async function uploadVoice(code: string, fileUri: string, scenarioId?: string) {
  if (MOCK) return mockApi.uploadVoice(await getToken(), code, fileUri, scenarioId);
  const form = new FormData();
  if (Platform.OS === "web") {
    // recorder.uri is a blob: URL on web — the RN {uri,name,type} shape below only
    // works through React Native's native networking layer, not the browser's.
    const blob = await (await fetch(fileUri)).blob();
    form.append("file", new File([blob], "note.m4a", { type: blob.type || "audio/m4a" }));
  } else {
    form.append("file", { uri: fileUri, name: "note.m4a", type: "audio/m4a" } as any);
  }
  if (scenarioId) form.append("scenario_id", scenarioId);
  return request<{ voice_id: string }>(`/voice/${code}`, { method: "POST", body: form });
}
export const listVoice = async (code: string) => (MOCK ? mockApi.listVoice(await getToken(), code) : get<any[]>(`/voice/${code}/list`));
export const voiceUrl = (code: string, voiceId: string) =>
  MOCK ? mockApi.voiceUrl(code, voiceId) : `${API_URL}/voice/${code}/${voiceId}`;

// ---------- dashboard ----------
export const dashboard = async (code: string) => (MOCK ? mockApi.dashboard(await getToken(), code) : get<any>(`/dashboard/${code}`));
