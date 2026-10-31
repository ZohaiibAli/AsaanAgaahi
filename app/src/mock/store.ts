/**
 * A fully offline "fake backend" for Practice Mode, used when EXPO_PUBLIC_MOCK=true
 * (see api.ts). Mirrors every real endpoint's request/response shape exactly, so no
 * screen needs to know whether it's talking to the real FastAPI backend or this.
 *
 * State lives in memory (seeded with a realistic demo family + history on first boot)
 * and is persisted to device storage after every mutation, so it survives app restarts
 * like a real backend would, without actually needing one running anywhere.
 */
import { storageGet, storageSet } from "../storage";
import scenariosJson from "./scenarios.json";

// ---------- small helpers ----------

function hexId(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  const base = Math.abs(h).toString(16).padStart(8, "0");
  return (base + base + base).slice(0, 24);
}

function delay(minMs = 350, maxMs = 850): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isoAgo(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

const HOUR = 3600_000;
const DAY = 24 * HOUR;

function canonicalPhone(countryCode: string, phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  const code = countryCode?.startsWith("+") ? countryCode : `+${countryCode}`;
  return `${code}${digits}`;
}

class ApiError extends Error {}

// ---------- types (loose — api.ts owns the real shapes) ----------

type MockUser = {
  id: string;
  name: string;
  phone: string;
  country_code: string;
  password: string;
  role: "helper" | "learner";
  language: "roman_ur" | "ur" | "en";
  family_code: string | null;
};

type MockFamily = {
  code: string;
  helper_id: string;
  helper_name: string;
  learner_ids: string[];
};

type MockProgress = {
  _id: string;
  family_code: string;
  learner_id: string;
  learner_name: string;
  scenario_id: string;
  hints_used: number;
  wrong_taps: number;
  correct: boolean;
  confidence_before: number;
  confidence_after: number;
  teachback_ok: boolean | null;
  independence_score: number;
  created_at: string;
};

type MockHelpRequest = {
  _id: string;
  family_code: string;
  learner_id: string;
  learner_name: string;
  scenario_id?: string;
  scenario_title?: string;
  step?: string;
  hints_used?: number;
  created_at: string;
};

type MockAssignment = {
  family_code: string;
  learner_id: string;
  scenario_id: string;
  created_at: string;
  done: boolean;
};

type MockAlert = {
  scenario_id: string;
  family_code: string;
  created_by: string;
  title: { roman_ur: string; ur: string; en: string };
  channel: string;
  sender: string;
  is_scam: boolean;
  segments: any[];
  hints: any[];
  consequence: { roman_ur: string; ur: string; en: string };
  red_flags: string[];
  note?: string;
  original_text: string;
  created_at: string;
};

type MockVoiceNote = {
  voice_id: string;
  family_code: string;
  scenario_id?: string;
  local_uri: string;
  uploaded_by: string;
  created_at: string;
};

type State = {
  users: MockUser[];
  families: MockFamily[];
  progress: MockProgress[];
  helpRequests: MockHelpRequest[];
  assignments: MockAssignment[];
  alerts: MockAlert[];
  voiceNotes: MockVoiceNote[];
};

// ---------- seed data ----------

const BUILT_IN_SCENARIOS: any[] = (scenariosJson as any[]).map((s) => ({ ...s, is_custom: false }));
const BUILT_IN_BY_ID: Record<string, any> = Object.fromEntries(BUILT_IN_SCENARIOS.map((s) => [s.id, s]));

function seedState(): State {
  const helperId = hexId("seed-helper-hassan");
  const learnerId = hexId("seed-learner-khalida");
  const familyCode = "7XQ2KD";

  const users: MockUser[] = [
    {
      id: helperId,
      name: "Hassan Ali",
      phone: canonicalPhone("+92", "03362082384"),
      country_code: "+92",
      password: "123456",
      role: "helper",
      language: "roman_ur",
      family_code: familyCode,
    },
    {
      id: learnerId,
      name: "Khalida Begum",
      phone: canonicalPhone("+92", "03362082383"),
      country_code: "+92",
      password: "123456",
      role: "learner",
      language: "roman_ur",
      family_code: familyCode,
    },
  ];

  const families: MockFamily[] = [
    { code: familyCode, helper_id: helperId, helper_name: "Hassan Ali", learner_ids: [learnerId] },
  ];

  const roundSeed: Array<[string, number, number, number, number]> = [
    // scenario_id, hints_used, confidence_before, confidence_after, days_ago(*DAY, else hours below)
    ["easypaisa_prize", 3, 2, 3, 6],
    ["account_blocked", 2, 3, 3, 4],
    ["bisp_payment", 1, 3, 4, 2],
    ["otp_caller", 0, 4, 5, 1],
  ];
  const HINT_SCORE: Record<number, number> = { 0: 100, 1: 70, 2: 40, 3: 10 };

  const progress: MockProgress[] = roundSeed.map(([scenarioId, hints, confBefore, confAfter, daysAgo], i) => ({
    _id: hexId(`progress-${i}`),
    family_code: familyCode,
    learner_id: learnerId,
    learner_name: "Khalida Begum",
    scenario_id: scenarioId,
    hints_used: hints,
    wrong_taps: 0,
    correct: true,
    confidence_before: confBefore,
    confidence_after: confAfter,
    teachback_ok: true,
    independence_score: HINT_SCORE[hints],
    created_at: isoAgo(daysAgo * DAY),
  }));
  // most recent round a few hours ago, with a perfect score to end on a strong note
  progress.push({
    _id: hexId("progress-recent"),
    family_code: familyCode,
    learner_id: learnerId,
    learner_name: "Khalida Begum",
    scenario_id: "legit_bank_alert",
    hints_used: 0,
    wrong_taps: 0,
    correct: true,
    confidence_before: 4,
    confidence_after: 5,
    teachback_ok: true,
    independence_score: 100,
    created_at: isoAgo(5 * HOUR),
  });

  const helpRequests: MockHelpRequest[] = [
    {
      _id: hexId("help-1"),
      family_code: familyCode,
      learner_id: learnerId,
      learner_name: "Khalida Begum",
      scenario_id: "fbr_tax_notice",
      scenario_title: "Fake FBR Tax Notice",
      step: "read",
      hints_used: 1,
      created_at: isoAgo(3 * DAY),
    },
    {
      _id: hexId("help-2"),
      family_code: familyCode,
      learner_id: learnerId,
      learner_name: "Khalida Begum",
      scenario_id: "fake_delivery",
      scenario_title: "Fake Courier Fee",
      step: "read",
      hints_used: 2,
      created_at: isoAgo(20 * HOUR),
    },
  ];

  const assignments: MockAssignment[] = [
    {
      family_code: familyCode,
      learner_id: learnerId,
      scenario_id: "fake_delivery",
      created_at: isoAgo(1 * DAY),
      done: false,
    },
  ];

  const alerts: MockAlert[] = [
    {
      scenario_id: "alert_ptcl_demo",
      family_code: familyCode,
      created_by: helperId,
      title: { roman_ur: "Jhooti PTCL Bill Payment", ur: "جھوٹی پی ٹی سی ایل بل ادائیگی", en: "Fake PTCL Bill Payment" },
      channel: "sms",
      sender: "Unknown Number",
      is_scam: true,
      segments: [
        {
          text: "URGENT: Your PTCL bill payment failed. Click http://ptcl-bill-pay.xyz/pay within 2 hours or your connection will be disconnected permanently.",
          is_red_flag: true,
          why: {
            roman_ur: "Ajeeb '.xyz' link aur jaldi ka dabao — dono scam ki nishani hain.",
            ur: "عجیب '.xyz' لنک اور جلدی کا دباؤ — دونوں اسکیم کی نشانی ہیں۔",
            en: "An odd '.xyz' link plus urgency pressure — both are classic scam signs.",
          },
        },
        {
          text: "Reply with your CNIC and account PIN to confirm.",
          is_red_flag: true,
          why: {
            roman_ur: "Koi bhi asli company kabhi PIN ya CNIC SMS se nahi mangti.",
            ur: "کوئی بھی اصلی کمپنی کبھی پن یا شناختی کارڈ ایس ایم ایس سے نہیں مانگتی۔",
            en: "No real company ever asks for your PIN or CNIC over SMS.",
          },
        },
      ],
      hints: [
        { roman_ur: "Kya aap ne PTCL bill khud app/website par check kiya?", ur: "کیا آپ نے پی ٹی سی ایل بل خود ایپ/ویب سائٹ پر چیک کیا؟", en: "Have you checked your PTCL bill directly in the app or website?" },
        { roman_ur: "Link ka address ghor se parhein — '.xyz' kabhi official nahi hota.", ur: "لنک کا ایڈریس غور سے پڑھیں — '.xyz' کبھی آفیشل نہیں ہوتا۔", en: "Look closely at the link — '.xyz' is never an official domain." },
        { roman_ur: "PIN aur CNIC maangna hi is message ko scam saabit karta hai.", ur: "پن اور شناختی کارڈ مانگنا ہی اس میسج کو اسکیم ثابت کرتا ہے۔", en: "Asking for your PIN and CNIC is what proves this message is a scam." },
      ],
      consequence: {
        roman_ur: "Apni PIN aur CNIC dene se account se paisay nikal sakte thay. Yahan mehfooz hain, dobara koshish karein!",
        ur: "اپنی پن اور شناختی کارڈ دینے سے اکاؤنٹ سے پیسے نکل سکتے تھے۔ یہاں محفوظ ہیں، دوبارہ کوشش کریں!",
        en: "Sharing your PIN and CNIC could have let someone drain your account. You're safe here — try again!",
      },
      red_flags: ["suspicious '.xyz' link", "urgency to act within 2 hours", "asks for PIN and CNIC over SMS"],
      original_text: "URGENT: Your PTCL bill payment failed. Click http://ptcl-bill-pay.xyz/pay within 2 hours or your connection will be disconnected permanently. Reply with your CNIC and account PIN to confirm.",
      created_at: isoAgo(2 * DAY),
    },
  ];

  return { users, families, progress, helpRequests, assignments, alerts, voiceNotes: [] };
}

// ---------- persistence ----------

type Role = "helper" | "learner";
type MockSub = { role: Role; onEvent: (e: any) => void };
const bus = new Map<string, Set<MockSub>>();

// On web, a BroadcastChannel also mirrors every event across browser tabs/windows —
// so a Helper tab and a Learner tab (e.g. two windows side by side for a demo
// recording) see each other's live events exactly like a real WebSocket broadcast
// would. Native (Expo Go on a phone) has no BroadcastChannel global, so there it
// stays same-process only, which still covers switching roles within one app session.
const channel: { postMessage(msg: unknown): void; addEventListener(type: "message", cb: (e: any) => void): void } | null =
  typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("practice_mode_mock_bus") : null;

function deliverLocal(familyCode: string, role: Role, event: Record<string, any>) {
  bus.get(familyCode)?.forEach((sub) => {
    if (sub.role === role) sub.onEvent(event);
  });
}

/** Delivers an event live to every currently-mounted socket of `role` in this family —
 * the same-process (and, on web, cross-tab) stand-in for the real backend's per-role
 * WebSocket broadcast. */
export function mockPublish(familyCode: string, role: Role, event: Record<string, any>) {
  deliverLocal(familyCode, role, event);
  channel?.postMessage({ familyCode, role, event });
}

channel?.addEventListener("message", (e: any) => {
  const { familyCode, role, event } = e.data as { familyCode: string; role: Role; event: Record<string, any> };
  deliverLocal(familyCode, role, event);
});

export function mockSubscribe(familyCode: string, role: Role, onEvent: (e: any) => void): () => void {
  const sub: MockSub = { role, onEvent };
  if (!bus.has(familyCode)) bus.set(familyCode, new Set());
  bus.get(familyCode)!.add(sub);
  return () => bus.get(familyCode)?.delete(sub);
}

const STORAGE_KEY = "practice_mode_mock_state_v1";
let state: State = seedState();
let hydrated = false;

(async () => {
  try {
    const raw = await storageGet(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      // merge, never lose the seed's built-in scenario content
      state = parsed;
    }
  } catch {
    // keep the fresh seed on any parse/storage failure
  } finally {
    hydrated = true;
  }
})();

function persist() {
  storageSet(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
}

// ---------- auth / session ----------

const TOKEN_PREFIX = "mock_";
const pendingRegistrations = new Map<string, { name: string; password: string; role: "helper" | "learner"; language: string }>();

function publicUser(u: MockUser) {
  return {
    id: u.id,
    name: u.name,
    phone: u.phone,
    country_code: u.country_code,
    role: u.role,
    language: u.language,
    family_code: u.family_code,
  };
}

function userFromToken(token: string | null): MockUser {
  const id = token?.startsWith(TOKEN_PREFIX) ? token.slice(TOKEN_PREFIX.length) : "";
  const user = state.users.find((u) => u.id === id);
  if (!user) throw new ApiError("Session expired. Please log in again.");
  return user;
}

async function register(body: { name: string; country_code: string; phone: string; password: string; role: "helper" | "learner"; language: string }) {
  await delay();
  const phone = canonicalPhone(body.country_code, body.phone);
  pendingRegistrations.set(phone, { name: body.name.trim(), password: body.password, role: body.role, language: body.language || "roman_ur" });
  return { message: "OTP sent", dev_otp: null };
}

async function resendOtp(_body: { country_code: string; phone: string }) {
  await delay(150, 300);
  return { dev_otp: null };
}

async function verifyOtp(body: { country_code: string; phone: string; code: string }) {
  await delay();
  if (!/^\d{6}$/.test(body.code)) throw new ApiError("That code is incorrect or expired. Please try again.");
  const phone = canonicalPhone(body.country_code, body.phone);
  const pending = pendingRegistrations.get(phone);
  let user = state.users.find((u) => u.phone === phone);
  if (!user) {
    if (!pending) throw new ApiError("That code is incorrect or expired. Please try again.");
    user = {
      id: hexId(phone + Date.now()),
      name: pending.name,
      phone,
      country_code: body.country_code,
      password: pending.password,
      role: pending.role,
      language: pending.language as any,
      family_code: null,
    };
    state.users.push(user);
  }
  pendingRegistrations.delete(phone);
  persist();
  return { token: TOKEN_PREFIX + user.id, user: publicUser(user) };
}

async function login(body: { country_code: string; phone: string; password: string }) {
  await delay();
  const phone = canonicalPhone(body.country_code, body.phone);
  const user = state.users.find((u) => u.phone === phone);
  if (!user || user.password !== body.password) throw new ApiError("Phone number or password is incorrect");
  return { token: TOKEN_PREFIX + user.id, user: publicUser(user) };
}

async function me(token: string | null) {
  await delay(100, 250);
  return publicUser(userFromToken(token));
}

// ---------- pairing ----------

function newFamilyCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  } while (state.families.some((f) => f.code === code));
  return code;
}

async function pairCreate(token: string | null) {
  await delay();
  const user = userFromToken(token);
  if (user.role !== "helper") throw new ApiError("Only a Helper account can create a family code");
  let family = state.families.find((f) => f.helper_id === user.id);
  if (!family) {
    family = { code: newFamilyCode(), helper_id: user.id, helper_name: user.name, learner_ids: [] };
    state.families.push(family);
    persist();
  }
  return { code: family.code };
}

async function pairJoin(token: string | null, code: string) {
  await delay();
  const user = userFromToken(token);
  if (user.role !== "learner") throw new ApiError("Only a Learner account can join with a family code");
  const family = state.families.find((f) => f.code === code.toUpperCase());
  if (!family) throw new ApiError("That family code wasn't found. Please check it with your helper.");
  if (!family.learner_ids.includes(user.id)) family.learner_ids.push(user.id);
  user.family_code = family.code;
  persist();
  return { code: family.code, helper_name: family.helper_name };
}

async function pairMe(token: string | null) {
  await delay(150, 300);
  const user = userFromToken(token);
  if (user.role === "helper") {
    const family = state.families.find((f) => f.helper_id === user.id);
    if (!family) return { paired: false };
    const learners = state.users.filter((u) => family.learner_ids.includes(u.id));
    return { paired: true, code: family.code, learners: learners.map((l) => ({ id: l.id, name: l.name })) };
  }
  if (!user.family_code) return { paired: false };
  const family = state.families.find((f) => f.code === user.family_code);
  return { paired: true, code: user.family_code, helper_name: family?.helper_name ?? null };
}

// ---------- scenarios ----------

function stripAlert(a: MockAlert) {
  return { id: a.scenario_id, title: a.title, channel: a.channel, sender: a.sender, is_scam: a.is_scam, segments: a.segments, hints: a.hints, consequence: a.consequence, red_flags: a.red_flags, is_custom: true };
}

async function listScenarios(token: string | null) {
  await delay();
  const user = userFromToken(token);
  let code = user.family_code;
  if (user.role === "helper") {
    const family = state.families.find((f) => f.helper_id === user.id);
    code = family?.code ?? null;
  }
  const custom = code ? state.alerts.filter((a) => a.family_code === code).map(stripAlert) : [];
  return [...BUILT_IN_SCENARIOS, ...custom];
}

async function getScenario(_token: string | null, id: string) {
  await delay(150, 350);
  if (BUILT_IN_BY_ID[id]) return BUILT_IN_BY_ID[id];
  const custom = state.alerts.find((a) => a.scenario_id === id);
  if (custom) return stripAlert(custom);
  throw new ApiError("Scenario not found");
}

function scenarioRedFlags(scenarioId: string): string[] {
  if (BUILT_IN_BY_ID[scenarioId]) return BUILT_IN_BY_ID[scenarioId].red_flags ?? [];
  const custom = state.alerts.find((a) => a.scenario_id === scenarioId);
  return custom?.red_flags ?? [];
}

// ---------- progress ----------

const HINT_SCORE: Record<number, number> = { 0: 100, 1: 70, 2: 40, 3: 10 };

async function submitProgress(token: string | null, body: any) {
  await delay();
  const user = userFromToken(token);
  if (user.role !== "learner") throw new ApiError("Only a Learner account can submit progress");
  if (!user.family_code) throw new ApiError("Join a family with a pairing code first");
  const score = HINT_SCORE[Math.min(body.hints_used, 3)] ?? 10;
  state.progress.push({
    _id: hexId(`progress-${Date.now()}`),
    family_code: user.family_code,
    learner_id: user.id,
    learner_name: user.name,
    scenario_id: body.scenario_id,
    hints_used: body.hints_used,
    wrong_taps: body.wrong_taps,
    correct: body.correct,
    confidence_before: body.confidence_before,
    confidence_after: body.confidence_after,
    teachback_ok: body.teachback_ok,
    independence_score: score,
    created_at: new Date().toISOString(),
  });
  persist();
  return { independence_score: score };
}

async function myProgress(token: string | null) {
  await delay(200, 400);
  const user = userFromToken(token);
  return state.progress
    .filter((p) => p.learner_id === user.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

// ---------- teachback / explain (ported keyword-fallback logic, matches backend) ----------

const FEEDBACK = {
  good: { roman_ur: "Shabash! Aap ne sahi wajah pehchan li.", ur: "شاباش! آپ نے صحیح وجہ پہچان لی۔", en: "Well done! You spotted the real reason." },
  partial: { roman_ur: "Achi koshish! Ek aur cheez bhi dekhein, chalein saath mein dekhte hain.", ur: "اچھی کوشش! ایک اور چیز بھی دیکھیں، چلیں ساتھ میں دیکھتے ہیں۔", en: "Good try! There's one more thing to notice — let's look together." },
  none: { roman_ur: "Koi baat nahi, yeh mushkil ho sakta hai. Chalein hint ke saath dobara dekhte hain.", ur: "کوئی بات نہیں، یہ مشکل ہو سکتا ہے۔ چلیں ہنٹ کے ساتھ دوبارہ دیکھتے ہیں۔", en: "No worries, this one's tricky. Let's look at it again with a hint." },
};

async function teachback(token: string | null, body: { scenario_id: string; answer_text: string }) {
  await delay(500, 1100);
  const user = userFromToken(token);
  const redFlags = scenarioRedFlags(body.scenario_id);
  const text = body.answer_text.toLowerCase();
  const caught: string[] = [];
  const missed: string[] = [];
  for (const flag of redFlags) {
    const words = (flag.toLowerCase().match(/[a-z]{4,}/g) || []);
    if (words.some((w) => text.includes(w))) caught.push(flag);
    else missed.push(flag);
  }
  const understood = caught.length >= Math.max(1, Math.floor(redFlags.length / 2));
  const bucket = missed.length === 0 ? FEEDBACK.good : caught.length ? FEEDBACK.partial : FEEDBACK.none;
  return { understood, caught, missed, feedback: (bucket as any)[user.language] ?? bucket.en };
}

const KEYWORD_RULES: Array<[RegExp, { roman_ur: string; ur: string; en: string }, string]> = [
  [/otp|one.?time.?code|code bata/i, { roman_ur: "Yeh OTP ya security code maang raha hai — yeh kabhi kisi ko nahi dena chahiye.", ur: "یہ او ٹی پی یا سیکیورٹی کوڈ مانگ رہا ہے — یہ کبھی کسی کو نہیں دینا چاہیے۔", en: "It's asking for an OTP or security code — never share that with anyone." }, "otp_caller"],
  [/jeet|winner|lucky draw|inaam|prize|mubarak/i, { roman_ur: "Ek anokha inaam ka dawa kar raha hai jo aap ne kabhi apply nahi kiya.", ur: "ایک انوکھا انعام کا دعویٰ کر رہا ہے جو آپ نے کبھی اپلائی نہیں کیا۔", en: "It claims an unexpected prize you never entered for." }, "easypaisa_prize"],
  [/block|suspend|verify|cnic|pin/i, { roman_ur: "Account band hone ki dhamki de kar jaldi mein faisla karwana chah raha hai.", ur: "اکاؤنٹ بند ہونے کی دھمکی دے کر جلدی میں فیصلہ کروانا چاہ رہا ہے۔", en: "It threatens to block your account to rush you into a decision." }, "account_blocked"],
  [/fbr|tax|baqaya/i, { roman_ur: "FBR tax ke naam par dhamki de raha hai, asal FBR aise SMS link nahi bhejta.", ur: "ایف بی آر ٹیکس کے نام پر دھمکی دے رہا ہے، اصل ایف بی آر ایسے ایس ایم ایس لنک نہیں بھیجتا۔", en: "It threatens tax trouble in FBR's name — the real FBR doesn't send SMS links like this." }, "fbr_tax_notice"],
  [/bisp|kafaalat|benazir/i, { roman_ur: "BISP payment ka jhoota dawa kar raha hai, asal BISP SMS link nahi bhejta.", ur: "بی آئی ایس پی پیمنٹ کا جھوٹا دعویٰ کر رہا ہے، اصل بی آئی ایس پی ایس ایم ایس لنک نہیں بھیجتا۔", en: "It falsely claims a BISP payment — the real BISP doesn't send SMS links." }, "bisp_payment"],
  [/parcel|courier|customs|delivery|tcs|leopard/i, { roman_ur: "Parcel/customs fee ka jhoota dawa ho sakta hai, khaas kar agar kuch order nahi kiya.", ur: "پارسل/کسٹمز فیس کا جھوٹا دعویٰ ہو سکتا ہے، خاص کر اگر کچھ آرڈر نہیں کیا۔", en: "It may be a fake parcel/customs fee claim, especially if you didn't order anything." }, "fake_delivery"],
  [/http|www\.|\.xyz|\.info|bit\.ly|tinyurl|link/i, { roman_ur: "Ek anjaan link shamil hai — official companies aise ajeeb links istemal nahi kartein.", ur: "ایک انجان لنک شامل ہے — آفیشل کمپنیاں ایسے عجیب لنکس استعمال نہیں کرتیں۔", en: "It includes an unfamiliar link — official companies don't use odd links like this." }, "fake_delivery"],
  [/turant|jaldi|abhi|urgent|immediately|24 hour|2 ghante/i, { roman_ur: "Bohat jaldi faisla karwaya ja raha hai — yeh dabao dalne ka tareeqa hai.", ur: "بہت جلدی فیصلہ کروایا جا رہا ہے — یہ دباؤ ڈالنے کا طریقہ ہے۔", en: "It's pushing you to decide very fast — a classic pressure tactic." }, "account_blocked"],
];

const WHAT_TO_DO = { roman_ur: "Is link par click na karein. Apne bank ya company ko unke official number par khud call karein, sirf unhi logon se poochain jin par aap bharosa karte hain.", ur: "اس لنک پر کلک نہ کریں۔ اپنے بینک یا کمپنی کو ان کے آفیشل نمبر پر خود کال کریں، صرف انہی لوگوں سے پوچھیں جن پر آپ بھروسہ کرتے ہیں۔", en: "Don't click the link. Call your bank or the company directly on their official number, or ask someone you trust." };
const WHAT_TO_DO_SAFE = { roman_ur: "Koi khaas red flag nazar nahi aaya, lekin agar kuch anjaan ho to hamesha official number par confirm karein.", ur: "کوئی خاص ریڈ فلیگ نظر نہیں آیا، لیکن اگر کچھ انجان ہو تو ہمیشہ آفیشل نمبر پر کنفرم کریں۔", en: "No major red flags spotted, but when in doubt, always confirm through an official number." };

async function explain(token: string | null, body: { message_text: string }) {
  await delay(500, 1100);
  const user = userFromToken(token);
  const lang = user.language;
  const flags: string[] = [];
  let suggestion: string | null = null;
  for (const [pattern, explanation, scenario] of KEYWORD_RULES) {
    if (pattern.test(body.message_text)) {
      flags.push((explanation as any)[lang] ?? explanation.en);
      suggestion = suggestion || scenario;
    }
  }
  const verdict = flags.length >= 2 ? "likely_scam" : flags.length === 1 ? "not_sure" : "looks_safe";
  const whatToDo = flags.length ? WHAT_TO_DO : WHAT_TO_DO_SAFE;
  return { verdict, red_flags: flags, what_to_do: (whatToDo as any)[lang] ?? whatToDo.en, practice_suggestion: suggestion };
}

// ---------- helper actions ----------

async function createAlert(token: string | null, body: { text: string; note?: string }) {
  await delay(600, 1200);
  const user = userFromToken(token);
  if (user.role !== "helper") throw new ApiError("Only a Helper account can send a family alert");
  const family = state.families.find((f) => f.helper_id === user.id);
  if (!family) throw new ApiError("Create a family pairing code first");

  const lowered = body.text.toLowerCase();
  const why: Record<string, string[]> = { roman_ur: [], ur: [], en: [] };
  const redFlags: string[] = [];
  for (const [pattern, explanation] of KEYWORD_RULES) {
    if (pattern.test(lowered)) {
      (Object.keys(why) as Array<keyof typeof why>).forEach((lang) => why[lang].push((explanation as any)[lang]));
      redFlags.push(explanation.en);
    }
  }
  const fallbackWhy = redFlags.length
    ? { roman_ur: why.roman_ur.join(" "), ur: why.ur.join(" "), en: why.en.join(" ") }
    : { roman_ur: "Yeh message ajeeb lag raha hai, ghor se check karein.", ur: "یہ میسج عجیب لگ رہا ہے، غور سے چیک کریں۔", en: "This message looks unusual — check it carefully." };
  const finalRedFlags = redFlags.length ? redFlags : ["unfamiliar sender or request"];

  const scenarioId = `alert_${hexId(body.text + Date.now()).slice(0, 8)}`;
  const alert: MockAlert = {
    scenario_id: scenarioId,
    family_code: family.code,
    created_by: user.id,
    title: { roman_ur: "Family Alert Practice", ur: "فیملی الرٹ پریکٹس", en: "Family Alert Practice" },
    channel: "sms",
    sender: "Shared by your family",
    is_scam: true,
    segments: [{ text: body.text, is_red_flag: true, why: fallbackWhy }],
    hints: [
      { roman_ur: "Ghor se parhein, kuch ajeeb maanga ja raha hai.", ur: "غور سے پڑھیں، کچھ عجیب مانگا جا رہا ہے۔", en: "Read closely — something unusual is being asked." },
      { roman_ur: "Kya is mein koi link, OTP, ya jaldi ka dabao hai?", ur: "کیا اس میں کوئی لنک، او ٹی پی، یا جلدی کا دباؤ ہے؟", en: "Does it include a link, an OTP request, or urgency?" },
      { roman_ur: finalRedFlags[0], ur: finalRedFlags[0], en: finalRedFlags[0] },
    ],
    consequence: {
      roman_ur: "Agar is par amal karte to nuqsaan ho sakta tha. Yahan mehfooz hain, dobara koshish karein!",
      ur: "اگر اس پر عمل کرتے تو نقصان ہو سکتا تھا۔ یہاں محفوظ ہیں، دوبارہ کوشش کریں!",
      en: "Acting on this could have caused real harm. You're safe here — try again!",
    },
    red_flags: finalRedFlags,
    note: body.note,
    original_text: body.text,
    created_at: new Date().toISOString(),
  };
  state.alerts.push(alert);
  persist();
  mockPublish(family.code, "learner", { type: "alert_scenario", scenario_id: scenarioId, title: alert.title, message: "Ek naya practice round aaya hai" });
  return stripAlert(alert);
}

async function assignScenario(token: string | null, body: { learner_id: string; scenario_id: string }) {
  await delay();
  const user = userFromToken(token);
  if (user.role !== "helper") throw new ApiError("Only a Helper account can assign a scenario");
  const family = state.families.find((f) => f.helper_id === user.id);
  if (!family || !family.learner_ids.includes(body.learner_id)) throw new ApiError("That learner isn't in your family");
  state.assignments.push({ family_code: family.code, learner_id: body.learner_id, scenario_id: body.scenario_id, created_at: new Date().toISOString(), done: false });
  persist();
  const title = BUILT_IN_BY_ID[body.scenario_id]?.title ?? { roman_ur: body.scenario_id, ur: body.scenario_id, en: body.scenario_id };
  mockPublish(family.code, "learner", { type: "assignment", learner_id: body.learner_id, scenario_id: body.scenario_id, title });
  return { ok: true };
}

async function myAssignments(token: string | null) {
  await delay(150, 300);
  const user = userFromToken(token);
  return state.assignments.filter((a) => a.learner_id === user.id && !a.done);
}

// ---------- voice ----------

async function uploadVoice(token: string | null, code: string, fileUri: string, scenarioId?: string) {
  await delay(400, 800);
  const user = userFromToken(token);
  if (user.role !== "helper") throw new ApiError("Only a Helper account can record a family voice hint");
  const voiceId = hexId(fileUri + Date.now()).slice(0, 12);
  state.voiceNotes.push({ voice_id: voiceId, family_code: code, scenario_id: scenarioId, local_uri: fileUri, uploaded_by: user.name, created_at: new Date().toISOString() });
  persist();
  mockPublish(code, "learner", { type: "voice_hint", voice_id: voiceId, scenario_id: scenarioId });
  return { voice_id: voiceId };
}

async function listVoice(_token: string | null, code: string) {
  await delay(150, 300);
  return state.voiceNotes.filter((v) => v.family_code === code).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function voiceUrl(code: string, voiceId: string): string {
  const note = state.voiceNotes.find((v) => v.family_code === code && v.voice_id === voiceId);
  return note?.local_uri ?? "";
}

// ---------- dashboard ----------

async function dashboard(token: string | null, code: string) {
  await delay(300, 600);
  const user = userFromToken(token);
  const family = state.families.find((f) => f.code === code);
  if (!family || family.helper_id !== user.id) throw new ApiError("Not your family dashboard");

  const learners = state.users.filter((u) => family.learner_ids.includes(u.id));
  const perLearner: any[] = [];
  const activity: any[] = [];

  for (const learner of learners) {
    const rows = state.progress.filter((p) => p.learner_id === learner.id).sort((a, b) => a.created_at.localeCompare(b.created_at));
    for (const r of rows) activity.push({ type: "progress", ...r });
    perLearner.push({
      learner_id: learner.id,
      name: learner.name,
      scenarios_completed: rows.length,
      independence_trend: rows.map((r) => r.independence_score),
      confidence_before_trend: rows.map((r) => r.confidence_before),
      confidence_after_trend: rows.map((r) => r.confidence_after),
      latest_independence_score: rows.length ? rows[rows.length - 1].independence_score : null,
    });
  }

  const helpRows = state.helpRequests.filter((h) => h.family_code === code).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 50);
  for (const h of helpRows) activity.push({ type: "need_help", ...h });
  activity.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  return { code, learners: perLearner, help_requests: helpRows, activity_feed: activity.slice(0, 40) };
}

// ---------- exported surface ----------

export const mockApi = {
  register,
  resendOtp,
  verifyOtp,
  login,
  me,
  pairCreate,
  pairJoin,
  pairMe,
  listScenarios,
  getScenario,
  submitProgress,
  myProgress,
  teachback,
  explain,
  createAlert,
  assignScenario,
  myAssignments,
  uploadVoice,
  listVoice,
  voiceUrl,
  dashboard,
};

/** For the WS mock layer: persists a need_help entry (so it survives a dashboard
 * reload/re-focus) and publishes it live to any mounted Helper socket. */
export function mockRecordNeedHelp(familyCode: string, learnerId: string, learnerName: string, data: Record<string, any>) {
  const doc = {
    _id: hexId(`help-${Date.now()}`),
    family_code: familyCode,
    learner_id: learnerId,
    learner_name: learnerName,
    scenario_id: data.scenario_id,
    scenario_title: data.scenario_title,
    step: data.step,
    hints_used: data.hints_used,
    created_at: new Date().toISOString(),
  };
  state.helpRequests.unshift(doc);
  persist();
  mockPublish(familyCode, "helper", { type: "need_help", ...doc });
}

/** For the WS mock layer: a Helper's nudge reply, relayed live to Learner sockets. */
export function mockSendNudge(familyCode: string, message?: string, voiceId?: string) {
  mockPublish(familyCode, "learner", { type: "nudge", message, voice_id: voiceId });
}

export function mockCredentials() {
  return {
    helper: { phone: "03362082384", country_code: "+92", password: "123456", name: "Hassan Ali" },
    learner: { phone: "03362082383", country_code: "+92", password: "123456", name: "Khalida Begum" },
    family_code: "7XQ2KD",
  };
}
