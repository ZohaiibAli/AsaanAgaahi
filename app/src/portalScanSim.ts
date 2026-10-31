/**
 * "Read a banking/wallet/government portal screenshot and explain it in plain
 * language" without real OCR — same honest stand-in approach as ocrSim.ts. Real OCR
 * would need either a native ML module (breaks Expo Go) or a cloud API (would mean
 * uploading a photo of someone's banking screen to a third party, which we never do).
 * Everything here runs on-device from a small built-in library of realistic templates.
 */
export type Trilingual = { roman_ur: string; ur: string; en: string };

export type PortalCategory = "bank_transfer" | "mobile_wallet" | "gov_portal";

export type JargonTerm = { term: string; simple: Trilingual };

export type PortalScanResult = {
  category: PortalCategory;
  categoryLabel: Trilingual;
  screenSummary: Trilingual;
  jargon: JargonTerm[];
  steps: Trilingual[];
  securityTips: Trilingual[];
};

const TEMPLATES: PortalScanResult[] = [
  {
    category: "bank_transfer",
    categoryLabel: { roman_ur: "Bank Transfer Screen", ur: "بینک ٹرانسفر اسکرین", en: "Bank Transfer Screen" },
    screenSummary: {
      roman_ur: "Yeh aapke mobile banking app ka 'paisay bhejna' wala screen hai — yahan se aap kisi doosre account mein paisay bhej sakte hain.",
      ur: "یہ آپ کے موبائل بینکنگ ایپ کا 'پیسے بھیجنا' والا اسکرین ہے — یہاں سے آپ کسی دوسرے اکاؤنٹ میں پیسے بھیج سکتے ہیں۔",
      en: "This is the \"send money\" screen in your mobile banking app — it lets you transfer money to another account.",
    },
    jargon: [
      { term: "Beneficiary", simple: { roman_ur: "Jisko aap paisay bhej rahe hain (receiver)", ur: "جسے آپ پیسے بھیج رہے ہیں (وصول کنندہ)", en: "The person you're sending money to" } },
      { term: "IBAN / Account Number", simple: { roman_ur: "Bank account ka poora unique number, jaise account ka apna CNIC number", ur: "بینک اکاؤنٹ کا مکمل منفرد نمبر، اکاؤنٹ کے اپنے شناختی نمبر کی طرح", en: "The full unique number that identifies a bank account" } },
      { term: "Transaction Reference", simple: { roman_ur: "Is payment ki rasid ka number, isay likh kar rakh lein", ur: "اس ادائیگی کی رسید کا نمبر، اسے لکھ کر رکھ لیں", en: "The receipt number for this payment — worth writing down" } },
      { term: "Confirm & Pay", simple: { roman_ur: "Yeh dabane se paisay waqai chale jayenge — pehle sab dobara check kar lein", ur: "یہ دبانے سے پیسے واقعی چلے جائیں گے — پہلے سب دوبارہ چیک کر لیں", en: "Pressing this actually sends the money — double-check everything first" } },
      { term: "OTP", simple: { roman_ur: "Ek baar wala code jo sirf aapke phone par SMS mein aata hai, kisi ko na dein", ur: "ایک بار والا کوڈ جو صرف آپ کے فون پر ایس ایم ایس میں آتا ہے، کسی کو نہ دیں", en: "A one-time code sent only to your phone — never share it with anyone" } },
    ],
    steps: [
      { roman_ur: "Beneficiary ka naam aur account number dobara ghor se check karein", ur: "وصول کنندہ کا نام اور اکاؤنٹ نمبر دوبارہ غور سے چیک کریں", en: "Carefully re-check the beneficiary's name and account number" },
      { roman_ur: "Raqam (amount) sahi hai ya nahi, ek dafa aur dekh lein", ur: "رقم (اماؤنٹ) صحیح ہے یا نہیں، ایک بار اور دیکھ لیں", en: "Check the amount is correct, one more time" },
      { roman_ur: "'Confirm & Pay' dabaane se pehle poori screen dhyan se parhein", ur: "'کنفرم اینڈ پے' دبانے سے پہلے پوری اسکرین غور سے پڑھیں", en: "Read the whole screen carefully before pressing \"Confirm & Pay\"" },
      { roman_ur: "Jo OTP SMS aaye, usay sirf app mein khud daalein — phone par kisi ko na batayein", ur: "جو او ٹی پی ایس ایم ایس آئے، اسے صرف ایپ میں خود ڈالیں — فون پر کسی کو نہ بتائیں", en: "Type the OTP into the app yourself — never read it out to anyone on a call" },
      { roman_ur: "Payment hone ke baad receipt ka screenshot zaroor rakh lein", ur: "ادائیگی ہونے کے بعد رسید کا اسکرین شاٹ ضرور رکھ لیں", en: "After the payment, keep a screenshot of the receipt" },
    ],
    securityTips: [
      { roman_ur: "Bank kabhi phone call ya SMS par OTP nahi maangta — koi maange to samajh jayein scam hai", ur: "بینک کبھی فون کال یا ایس ایم ایس پر او ٹی پی نہیں مانگتا — کوئی مانگے تو سمجھ جائیں اسکیم ہے", en: "A real bank never asks for your OTP over a call or SMS — if someone does, it's a scam" },
      { roman_ur: "Beneficiary ka naam jo app dikhae wahi dekh kar confirm karein, sirf number par bharosa na karein", ur: "وصول کنندہ کا نام جو ایپ دکھائے وہی دیکھ کر تصدیق کریں، صرف نمبر پر بھروسہ نہ کریں", en: "Confirm using the beneficiary name the app shows, not just the account number" },
      { roman_ur: "Koi app mein jaldi karne ka pressure daale ('abhi karo, offer khatam ho raha hai') to rukk jayein aur family se poochein", ur: "کوئی ایپ میں جلدی کرنے کا دباؤ ڈالے ('ابھی کرو، آفر ختم ہو رہا ہے') تو رک جائیں اور فیملی سے پوچھیں", en: "If anything pressures you to rush, stop and ask a family member first" },
      { roman_ur: "Banking app hamesha official app store se download karein, kisi link se nahi", ur: "بینکنگ ایپ ہمیشہ آفیشل ایپ اسٹور سے ڈاؤن لوڈ کریں، کسی لنک سے نہیں", en: "Only install your banking app from the official app store, never from a link" },
    ],
  },
];

export async function scanPortalScreen(): Promise<PortalScanResult> {
  await new Promise((resolve) => setTimeout(resolve, 1600 + Math.random() * 1200));
  return TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
}
