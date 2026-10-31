/**
 * Static UI text in three languages. Scenario content (segments, hints, etc.) carries
 * its own three-language object from the backend — this file is only for chrome: button
 * labels, headers, form fields. Default language is Roman Urdu, per the spec.
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { storageGet, storageSet } from "./storage";

export type Language = "roman_ur" | "ur" | "en";

const STRINGS = {
  app_name: { roman_ur: "Practice Mode", ur: "پریکٹس موڈ", en: "Practice Mode" },
  welcome_title: { roman_ur: "Practice Mode mein khush aamdeed", ur: "پریکٹس موڈ میں خوش آمدید", en: "Welcome to Practice Mode" },
  welcome_subtitle: { roman_ur: "Scam pehchanna seekhein, mehfooz tareeqe se", ur: "اسکیم پہچاننا سیکھیں، محفوظ طریقے سے", en: "Learn to spot scams, safely" },
  im_learning: { roman_ur: "Main seekh raha/rahi hoon", ur: "میں سیکھ رہا/رہی ہوں", en: "I'm learning" },
  im_helping: { roman_ur: "Main madad kar raha/rahi hoon", ur: "میں مدد کر رہا/رہی ہوں", en: "I'm helping" },
  already_have_account: { roman_ur: "Pehle se account hai? Login karein", ur: "پہلے سے اکاؤنٹ ہے؟ لاگ ان کریں", en: "Already have an account? Log in" },
  need_account: { roman_ur: "Account nahi hai? Register karein", ur: "اکاؤنٹ نہیں ہے؟ رجسٹر کریں", en: "Don't have an account? Register" },

  name: { roman_ur: "Naam", ur: "نام", en: "Name" },
  phone_number: { roman_ur: "Mobile Number", ur: "موبائل نمبر", en: "Mobile Number" },
  country: { roman_ur: "Mulk", ur: "ملک", en: "Country" },
  password: { roman_ur: "Password", ur: "پاس ورڈ", en: "Password" },
  register: { roman_ur: "Register Karein", ur: "رجسٹر کریں", en: "Register" },
  login: { roman_ur: "Login Karein", ur: "لاگ ان کریں", en: "Log In" },
  logout: { roman_ur: "Logout", ur: "لاگ آؤٹ", en: "Log Out" },

  enter_otp_title: { roman_ur: "Code Darj Karein", ur: "کوڈ درج کریں", en: "Enter the Code" },
  enter_otp_subtitle: { roman_ur: "Aapke number par 6-digit code bheja gaya hai", ur: "آپ کے نمبر پر 6 ہندسوں کا کوڈ بھیجا گیا ہے", en: "A 6-digit code was sent to your number" },
  demo_otp_notice: { roman_ur: "Demo mode: asal SMS nahi bheja gaya, yeh raha aapka code", ur: "ڈیمو موڈ: اصل ایس ایم ایس نہیں بھیجا گیا، یہ رہا آپ کا کوڈ", en: "Demo mode: no real SMS was sent, here's your code" },
  verify: { roman_ur: "Verify Karein", ur: "تصدیق کریں", en: "Verify" },
  resend_code: { roman_ur: "Dobara code bhejein", ur: "دوبارہ کوڈ بھیجیں", en: "Resend code" },

  continue_: { roman_ur: "Aage Barhein", ur: "آگے بڑھیں", en: "Continue" },
  back: { roman_ur: "Peeche", ur: "پیچھے", en: "Back" },
  submit: { roman_ur: "Jama Karein", ur: "جمع کریں", en: "Submit" },
  try_again: { roman_ur: "Dobara Koshish Karein", ur: "دوبارہ کوشش کریں", en: "Try Again" },
  listen: { roman_ur: "Sunein", ur: "سنیں", en: "Listen" },

  pairing_create_title: { roman_ur: "Family Code Banayein", ur: "فیملی کوڈ بنائیں", en: "Create a Family Code" },
  pairing_create_subtitle: { roman_ur: "Yeh code apne family member ko dein", ur: "یہ کوڈ اپنے فیملی ممبر کو دیں", en: "Share this code with your family member" },
  pairing_join_title: { roman_ur: "Family Code Darj Karein", ur: "فیملی کوڈ درج کریں", en: "Enter the Family Code" },
  pairing_join_subtitle: { roman_ur: "Apne helper se code lein", ur: "اپنے مددگار سے کوڈ لیں", en: "Get this code from your helper" },
  join: { roman_ur: "Shamil Hon", ur: "شامل ہوں", en: "Join" },
  paired_with: { roman_ur: "Aap jurey hue hain", ur: "آپ جڑے ہوئے ہیں", en: "You're paired with" },

  home_practice: { roman_ur: "Practice Shuru Karein", ur: "پریکٹس شروع کریں", en: "Start Practice" },
  home_paste: { roman_ur: "Koi Message Check Karayein", ur: "کوئی میسج چیک کرائیں", en: "Check a Message" },
  home_progress: { roman_ur: "Meri Progress", ur: "میری پیشرفت", en: "My Progress" },
  simulated_label: { roman_ur: "PRACTICE — nakli paigham", ur: "پریکٹس — نقلی پیغام", en: "PRACTICE — simulated message" },
  tap_suspicious: { roman_ur: "Jo hissa ajeeb lagay usay dabayein, phir faisla karein", ur: "جو حصہ عجیب لگے اسے دبائیں، پھر فیصلہ کریں", en: "Tap the parts that look suspicious, then decide" },
  mark_scam: { roman_ur: "Scam Hai", ur: "اسکیم ہے", en: "It's a Scam" },
  mark_safe: { roman_ur: "Theek Lagta Hai", ur: "ٹھیک لگتا ہے", en: "Looks Safe" },
  need_hint: { roman_ur: "Hint Chahiye", ur: "ہنٹ چاہیے", en: "I need a hint" },
  need_help_button: { roman_ur: "Samajh Nahi Aaya", ur: "سمجھ نہیں آیا", en: "I don't understand" },
  help_sent: { roman_ur: "Aapke helper ko bata diya gaya hai", ur: "آپ کے مددگار کو بتا دیا گیا ہے", en: "Your helper has been notified" },

  correct_title: { roman_ur: "Shabash!", ur: "شاباش!", en: "Well done!" },
  oops_title: { roman_ur: "Koi Baat Nahi", ur: "کوئی بات نہیں", en: "Oops, that's okay" },
  oops_subtitle: { roman_ur: "Chalein saath mein dekhte hain", ur: "چلیں ساتھ میں دیکھتے ہیں", en: "Let's look together" },

  teachback_prompt: { roman_ur: "Apne alfaaz mein batayein, kyun?", ur: "اپنے الفاظ میں بتائیں، کیوں؟", en: "In your own words, why?" },
  confidence_before: { roman_ur: "Aap kitne confident hain is baare mein?", ur: "آپ کتنے پراعتماد ہیں اس بارے میں؟", en: "How confident do you feel about this?" },
  confidence_after: { roman_ur: "Ab aap kitne confident hain?", ur: "اب آپ کتنے پراعتماد ہیں؟", en: "How confident do you feel now?" },

  paste_title: { roman_ur: "Koi Message Paste Karein", ur: "کوئی میسج پیسٹ کریں", en: "Paste a Message" },
  paste_placeholder: { roman_ur: "Yahan message paste ya type karein...", ur: "یہاں میسج پیسٹ یا ٹائپ کریں...", en: "Paste or type the message here..." },
  check_message: { roman_ur: "Check Karein", ur: "چیک کریں", en: "Check It" },
  verdict_likely_scam: { roman_ur: "Yeh Scam Lagta Hai", ur: "یہ اسکیم لگتا ہے", en: "This Looks Like a Scam" },
  verdict_looks_safe: { roman_ur: "Yeh Theek Lagta Hai", ur: "یہ ٹھیک لگتا ہے", en: "This Looks Safe" },
  verdict_not_sure: { roman_ur: "Yakeen Nahi — Ehtiyaat Karein", ur: "یقین نہیں — احتیاط کریں", en: "Not Sure — Be Careful" },

  progress_title: { roman_ur: "Meri Pragati", ur: "میری ترقی", en: "My Progress" },
  independence_score: { roman_ur: "Khud-Mukhtaari Score", ur: "خود مختاری اسکور", en: "Independence Score" },
  progress_empty: { roman_ur: "Abhi tak koi practice nahi hui. Chalein shuru karein!", ur: "ابھی تک کوئی پریکٹس نہیں ہوئی۔ چلیں شروع کریں!", en: "No practice rounds yet. Let's get started!" },
  network_error: { roman_ur: "Connection nahi ho saka. Dobara koshish karein.", ur: "کنکشن نہیں ہو سکا۔ دوبارہ کوشش کریں۔", en: "Couldn't connect. Please try again." },

  dashboard_title: { roman_ur: "Family Dashboard", ur: "فیملی ڈیش بورڈ", en: "Family Dashboard" },
  assign_scenario: { roman_ur: "Agla Practice Bhejein", ur: "اگلا پریکٹس بھیجیں", en: "Assign Next Scenario" },
  send_alert: { roman_ur: "Family Alert Bhejein", ur: "فیملی الرٹ بھیجیں", en: "Send Family Alert" },
  record_voice: { roman_ur: "Voice Message Record Karein", ur: "وائس میسج ریکارڈ کریں", en: "Record a Voice Message" },

  alert_title: { roman_ur: "Asli Scam Message Share Karein", ur: "اصلی اسکیم میسج شیئر کریں", en: "Share a Real Scam Message" },
  alert_text_label: { roman_ur: "Message paste karein", ur: "میسج پیسٹ کریں", en: "Paste the message" },
  alert_note_label: { roman_ur: "Note (ikhtiyari)", ur: "نوٹ (اختیاری)", en: "Note (optional)" },
  alert_send: { roman_ur: "Practice Round Bhejein", ur: "پریکٹس راؤنڈ بھیجیں", en: "Send as Practice Round" },

  voice_title: { roman_ur: "Family Voice Hint", ur: "فیملی وائس ہنٹ", en: "Family Voice Hint" },
  record: { roman_ur: "Record Karein", ur: "ریکارڈ کریں", en: "Record" },
  stop: { roman_ur: "Rokein", ur: "روکیں", en: "Stop" },
  play: { roman_ur: "Sunein", ur: "سنیں", en: "Play" },
  upload: { roman_ur: "Bhejein", ur: "بھیجیں", en: "Send" },
  message_from_family: { roman_ur: "Aapke Family Ki Taraf Se Paigham", ur: "آپ کی فیملی کی طرف سے پیغام", en: "Message from your family" },

  from_a_real_message: { roman_ur: "Family se bheja gaya scam message", ur: "فیملی سے بھیجا گیا اسکیم میسج", en: "Scam message shared by your family" },
} as const;

type Key = keyof typeof STRINGS;

type I18nContextValue = { lang: Language; setLang: (l: Language) => void; t: (key: Key) => string };

const I18nContext = createContext<I18nContextValue>({
  lang: "roman_ur",
  setLang: () => {},
  t: (key) => STRINGS[key].roman_ur,
});

const STORAGE_KEY = "practice_mode_language";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("roman_ur");

  useEffect(() => {
    storageGet(STORAGE_KEY).then((saved) => {
      if (saved === "roman_ur" || saved === "ur" || saved === "en") setLangState(saved);
    });
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    storageSet(STORAGE_KEY, l).catch(() => {});
  };

  const t = (key: Key) => STRINGS[key][lang];

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

/** Helper for rendering a {roman_ur, ur, en} object that comes from the backend (scenario content). */
export function pickLang(obj: { roman_ur: string; ur: string; en: string } | undefined, lang: Language): string {
  if (!obj) return "";
  return obj[lang] ?? obj.roman_ur;
}
