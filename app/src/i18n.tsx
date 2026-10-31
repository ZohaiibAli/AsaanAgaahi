/**
 * Static UI text in three languages. Scenario content (segments, hints, etc.) carries
 * its own three-language object from the backend — this file is only for chrome: button
 * labels, headers, form fields. Default language is Roman Urdu, per the spec.
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { storageGet, storageSet } from "./storage";

export type Language = "roman_ur" | "ur" | "en";

const STRINGS = {
  app_name: { roman_ur: "AsaanAgaahi", ur: "آسان آگاہی", en: "AsaanAgaahi" },
  welcome_title: { roman_ur: "AsaanAgaahi mein khush aamdeed", ur: "آسان آگاہی میں خوش آمدید", en: "Welcome to AsaanAgaahi" },
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
  demo_otp_notice: { roman_ur: "Aapka verification code", ur: "آپ کا تصدیقی کوڈ", en: "Your verification code" },
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
  tab_link_message: { roman_ur: "Website Link", ur: "ویب سائٹ لنک", en: "Website Link" },
  link_placeholder: { roman_ur: "Website ka link yahan paste karein (jaise https://...)", ur: "ویب سائٹ کا لنک یہاں پیسٹ کریں (جیسے https://...)", en: "Paste the website link here (e.g. https://...)" },
  check_link: { roman_ur: "Link Check Karein", ur: "لنک چیک کریں", en: "Check This Link" },
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
  tab_type_message: { roman_ur: "Likh Kar", ur: "لکھ کر", en: "Type It" },
  tab_screenshot_message: { roman_ur: "Screenshot Se", ur: "اسکرین شاٹ سے", en: "From Screenshot" },
  alert_text_label: { roman_ur: "Message paste karein", ur: "میسج پیسٹ کریں", en: "Paste the message" },
  pick_screenshot: { roman_ur: "Screenshot Chunein", ur: "اسکرین شاٹ چنیں", en: "Choose a Screenshot" },
  alert_pick_screenshot_hint: {
    roman_ur: "Scam message ka screenshot chunein — system khud parh kar practice round bana dega, aapko kuch likhna nahi hoga.",
    ur: "اسکیم میسج کا اسکرین شاٹ چنیں — سسٹم خود پڑھ کر پریکٹس راؤنڈ بنا دے گا، آپ کو کچھ لکھنا نہیں ہوگا۔",
    en: "Pick a screenshot of the scam message — the system reads it and builds the practice round itself, no typing needed.",
  },
  paste_pick_screenshot_hint: {
    roman_ur: "Jo message check karwana hai uska screenshot chunein — system khud parh kar check kar dega, aapko kuch likhna nahi hoga.",
    ur: "جو میسج چیک کروانا ہے اس کا اسکرین شاٹ چنیں — سسٹم خود پڑھ کر چیک کر دے گا، آپ کو کچھ لکھنا نہیں ہوگا۔",
    en: "Pick a screenshot of the message you want checked — the system reads it and checks it for you, no typing needed.",
  },
  scanning_screenshot: { roman_ur: "Screenshot parha ja raha hai...", ur: "اسکرین شاٹ پڑھا جا رہا ہے...", en: "Reading the screenshot..." },
  scan_done: { roman_ur: "System ne parh liya", ur: "سسٹم نے پڑھ لیا", en: "The system read it" },
  extracted_label: { roman_ur: "Nikala gaya message", ur: "نکالا گیا پیغام", en: "Extracted message" },
  pick_another: { roman_ur: "Dobara Screenshot Chunein", ur: "دوبارہ اسکرین شاٹ چنیں", en: "Choose a Different Screenshot" },
  alert_note_label: { roman_ur: "Note (ikhtiyari)", ur: "نوٹ (اختیاری)", en: "Note (optional)" },
  alert_send: { roman_ur: "Practice Round Bhejein", ur: "پریکٹس راؤنڈ بھیجیں", en: "Send as Practice Round" },

  voice_title: { roman_ur: "Family Voice Hint", ur: "فیملی وائس ہنٹ", en: "Family Voice Hint" },
  record: { roman_ur: "Record Karein", ur: "ریکارڈ کریں", en: "Record" },
  stop: { roman_ur: "Rokein", ur: "روکیں", en: "Stop" },
  play: { roman_ur: "Sunein", ur: "سنیں", en: "Play" },
  upload: { roman_ur: "Bhejein", ur: "بھیجیں", en: "Send" },
  message_from_family: { roman_ur: "Aapke Family Ki Taraf Se Paigham", ur: "آپ کی فیملی کی طرف سے پیغام", en: "Message from your family" },

  from_a_real_message: { roman_ur: "Family se bheja gaya scam message", ur: "فیملی سے بھیجا گیا اسکیم میسج", en: "Scam message shared by your family" },

  home_translate: { roman_ur: "Banking/Portal Screen Samjhayein", ur: "بینکنگ/پورٹل اسکرین سمجھیں", en: "Explain a Banking/Portal Screen" },
  translate_title: { roman_ur: "Screen Samjhao", ur: "اسکرین سمجھاؤ", en: "Screen Translator" },
  translate_intro: {
    roman_ur: "Apne banking app, mobile wallet ya sarkari portal ka screenshot chunein. System mushkil alfaz ko aasaan zabaan mein samjhayega aur bata dega kaam mehfooz tareeqe se kaise karna hai.",
    ur: "اپنے بینکنگ ایپ، موبائل والیٹ یا سرکاری پورٹل کا اسکرین شاٹ چنیں۔ سسٹم مشکل الفاظ کو آسان زبان میں سمجھائے گا اور بتائے گا کام محفوظ طریقے سے کیسے کرنا ہے۔",
    en: "Pick a screenshot of your banking app, mobile wallet, or a government portal. The system explains the hard words in plain language and walks you through doing it safely.",
  },
  translate_pick_screenshot_hint: {
    roman_ur: "Jis app ya website ki screen samajhni hai uska screenshot chunein — system khud parh kar aasaan zabaan mein samjha dega.",
    ur: "جس ایپ یا ویب سائٹ کی اسکرین سمجھنی ہے اس کا اسکرین شاٹ چنیں — سسٹم خود پڑھ کر آسان زبان میں سمجھا دے گا۔",
    en: "Pick a screenshot of the app or website screen you want explained — the system reads it and explains it in plain language.",
  },
  translate_privacy_note: {
    roman_ur: "Yeh screenshot sirf aapke apne phone par dekha jata hai — kahin bhi upload ya bheja nahi jata.",
    ur: "یہ اسکرین شاٹ صرف آپ کے اپنے فون پر دیکھا جاتا ہے — کہیں بھی اپلوڈ یا بھیجا نہیں جاتا۔",
    en: "This screenshot is only viewed on your own phone — it is never uploaded or sent anywhere.",
  },
  translate_category_label: { roman_ur: "Yeh Screen Kis Qisam Ki Hai", ur: "یہ اسکرین کس قسم کی ہے", en: "Type of screen" },
  translate_summary_label: { roman_ur: "Yeh Screen Kya Hai", ur: "یہ اسکرین کیا ہے", en: "What this screen is" },
  translate_jargon_heading: { roman_ur: "Mushkil Alfaz Ki Aasaan Wazahat", ur: "مشکل الفاظ کی آسان وضاحت", en: "Hard words, explained simply" },
  translate_steps_heading: { roman_ur: "Yeh Kaam Mehfooz Tareeqe Se Kaise Karein", ur: "یہ کام محفوظ طریقے سے کیسے کریں", en: "How to do this safely" },
  translate_security_heading: { roman_ur: "Hifazati Baatein", ur: "حفاظتی باتیں", en: "Security tips" },

  how_to_use: { roman_ur: "Istemal Kaise Karein", ur: "استعمال کیسے کریں", en: "How to Use" },
  how_to_use_intro: {
    roman_ur: "AsaanAgaahi aapko scam pehchanna sikhati hai, practice ke zariye — bilkul mehfooz tareeqe se, asli nuqsan ke bina. Neeche har feature ka tareeqa dekh lein.",
    ur: "آسان آگاہی آپ کو اسکیم پہچاننا سکھاتی ہے، پریکٹس کے ذریعے — بالکل محفوظ طریقے سے، اصل نقصان کے بغیر۔ نیچے ہر فیچر کا طریقہ دیکھ لیں۔",
    en: "AsaanAgaahi teaches you to spot scams through practice — completely safely, with no real risk. Here's how each part of the app works.",
  },
  how_to_use_practice_title: { roman_ur: "1. Practice Shuru Karein", ur: "1۔ پریکٹس شروع کریں", en: "1. Start Practice" },
  how_to_use_practice_desc: {
    roman_ur: "Nakli scam messages par practice karein. Message parhein, jo hissa ajeeb lage usay dabayein, phir faisla karein 'Scam Hai' ya 'Theek Lagta Hai'. Hint bhi le sakte hain.",
    ur: "نقلی اسکیم پیغامات پر پریکٹس کریں۔ پیغام پڑھیں، جو حصہ عجیب لگے اسے دبائیں، پھر فیصلہ کریں 'اسکیم ہے' یا 'ٹھیک لگتا ہے'۔ ہنٹ بھی لے سکتے ہیں۔",
    en: "Practice on simulated scam messages. Read the message, tap the parts that look suspicious, then decide \"It's a Scam\" or \"Looks Safe\". You can also ask for hints.",
  },
  how_to_use_paste_title: { roman_ur: "2. Koi Message Check Karayein", ur: "2۔ کوئی میسج چیک کرائیں", en: "2. Check a Message" },
  how_to_use_paste_desc: {
    roman_ur: "Koi bhi asli message, link ya screenshot check karayein — teen tareeqe hain: likh kar, screenshot se, ya website link paste karke. System turant bata dega kya khatra hai.",
    ur: "کوئی بھی اصل پیغام، لنک یا اسکرین شاٹ چیک کرائیں — تین طریقے ہیں: لکھ کر، اسکرین شاٹ سے، یا ویب سائٹ لنک پیسٹ کر کے۔ سسٹم فوراً بتا دے گا کیا خطرہ ہے۔",
    en: "Check any real message, link, or screenshot — three ways: by typing, from a screenshot, or by pasting a website link. The system tells you right away what the risk is.",
  },
  how_to_use_translate_title: { roman_ur: "3. Banking/Portal Screen Samjhayein", ur: "3۔ بینکنگ/پورٹل اسکرین سمجھیں", en: "3. Explain a Banking/Portal Screen" },
  how_to_use_translate_desc: {
    roman_ur: "Apne banking app ya sarkari website ka screenshot dein — system mushkil alfaz (jaise 'Beneficiary', 'OTP') aasaan zabaan mein samjhayega aur mehfooz tareeqa batayega.",
    ur: "اپنے بینکنگ ایپ یا سرکاری ویب سائٹ کا اسکرین شاٹ دیں — سسٹم مشکل الفاظ (جیسے 'بینیفیشری'، 'او ٹی پی') آسان زبان میں سمجھائے گا اور محفوظ طریقہ بتائے گا۔",
    en: "Give a screenshot of your banking app or a government website — the system explains hard words (like \"Beneficiary\", \"OTP\") in plain language and shows you the safe way to do it.",
  },
  how_to_use_progress_title: { roman_ur: "4. Meri Progress", ur: "4۔ میری پیشرفت", en: "4. My Progress" },
  how_to_use_progress_desc: {
    roman_ur: "Dekhein aap kitna seekh chuke hain — kam hints, zyada sahi faisle, yeh sab yahan dikhta hai.",
    ur: "دیکھیں آپ کتنا سیکھ چکے ہیں — کم ہنٹس، زیادہ صحیح فیصلے، یہ سب یہاں دکھتا ہے۔",
    en: "See how much you've learned — fewer hints needed, more correct decisions, all tracked here.",
  },
  how_to_use_help_title: { roman_ur: "5. Samajh Nahi Aaya", ur: "5۔ سمجھ نہیں آیا", en: "5. I Don't Understand" },
  how_to_use_help_desc: {
    roman_ur: "Kahin bhi atak jayein to yeh button dabayein — aapki family turant madad ke liye pata chal jayegi.",
    ur: "کہیں بھی اٹک جائیں تو یہ بٹن دبائیں — آپ کی فیملی فوراً مدد کے لیے پتا چل جائے گی۔",
    en: "Stuck on anything? Tap this button — your family is notified right away to help you.",
  },
  how_to_use_lang_title: { roman_ur: "6. Zaban Aur Theme", ur: "6۔ زبان اور تھیم", en: "6. Language & Theme" },
  how_to_use_lang_desc: {
    roman_ur: "Upar se Roman Urdu, Urdu ya English mein switch karein, aur chand/dhoop ke icon se dark ya light mode badlein.",
    ur: "اوپر سے رومن اردو، اردو یا انگریزی میں سوئچ کریں، اور چاند/دھوپ کے آئیکن سے ڈارک یا لائٹ موڈ بدلیں۔",
    en: "Switch between Roman Urdu, Urdu, or English at the top, and toggle dark/light mode with the moon/sun icon.",
  },
  got_it: { roman_ur: "Samajh Gaya/Gayi", ur: "سمجھ گیا/گئی", en: "Got It" },
  close: { roman_ur: "Band Karein", ur: "بند کریں", en: "Close" },
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
