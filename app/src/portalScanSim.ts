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
  {
    category: "mobile_wallet",
    categoryLabel: { roman_ur: "Mobile Wallet Screen", ur: "موبائل والیٹ اسکرین", en: "Mobile Wallet Screen" },
    screenSummary: {
      roman_ur: "Yeh aapke mobile wallet (jaise Easypaisa ya JazzCash) ka load/transfer screen hai.",
      ur: "یہ آپ کے موبائل والیٹ (جیسے ایزی پیسہ یا جاز کیش) کا لوڈ/ٹرانسفر اسکرین ہے۔",
      en: "This is the top-up/transfer screen of your mobile wallet (like Easypaisa or JazzCash).",
    },
    jargon: [
      { term: "Wallet PIN / MPIN", simple: { roman_ur: "Aapka khud ka secret code jo wallet kholne ke liye chahiye — sirf aap ko pata hona chahiye", ur: "آپ کا اپنا خفیہ کوڈ جو والیٹ کھولنے کے لیے چاہیے — صرف آپ کو پتا ہونا چاہیے", en: "Your own secret code to open the wallet — only you should know it" } },
      { term: "Load / Top-up", simple: { roman_ur: "Wallet mein paisay dalna", ur: "والیٹ میں پیسے ڈالنا", en: "Putting money into the wallet" } },
      { term: "Merchant", simple: { roman_ur: "Jis dukaan ya company ko paisay ja rahe hain", ur: "جس دکان یا کمپنی کو پیسے جا رہے ہیں", en: "The shop or company the money is going to" } },
      { term: "Cashback", simple: { roman_ur: "Thori raqam wapas milna, offer ke tor par", ur: "تھوڑی رقم واپس ملنا، آفر کے طور پر", en: "A small amount returned to you as a reward" } },
    ],
    steps: [
      { roman_ur: "Jis number ya merchant ko paisay bhej rahe hain, naam dobara check karein", ur: "جس نمبر یا مرچنٹ کو پیسے بھیج رہے ہیں، نام دوبارہ چیک کریں", en: "Re-check the name of the number or merchant you're sending to" },
      { roman_ur: "Raqam sahi daali hai, confirm karne se pehle dekh lein", ur: "رقم صحیح ڈالی ہے، کنفرم کرنے سے پہلے دیکھ لیں", en: "Check you entered the right amount before confirming" },
      { roman_ur: "Apna wallet PIN khud type karein, kisi ko batayein ya screen na dikhayein", ur: "اپنا والیٹ پن خود ٹائپ کریں، کسی کو بتائیں یا اسکرین نہ دکھائیں", en: "Type your wallet PIN yourself — don't say it out loud or show the screen" },
      { roman_ur: "Transaction poora hone ke baad confirmation SMS/receipt check kar lein", ur: "ٹرانزیکشن مکمل ہونے کے بعد تصدیقی ایس ایم ایس/رسید چیک کر لیں", en: "After the transaction, check the confirmation SMS or receipt" },
    ],
    securityTips: [
      { roman_ur: "Apna PIN kisi ko mat batayein, chahe woh khud ko company ka banda kahe", ur: "اپنا پن کسی کو مت بتائیں، چاہے وہ خود کو کمپنی کا بندہ کہے", en: "Never share your PIN with anyone, even someone claiming to be from the company" },
      { roman_ur: "Koi 'aapka wallet band ho jayega' kahay aur jaldi PIN maange to woh scam hai", ur: "کوئی 'آپ کا والیٹ بند ہو جائے گا' کہے اور جلدی پن مانگے تو وہ اسکیم ہے", en: "If someone warns \"your wallet will be blocked\" and rushes you for your PIN, it's a scam" },
      { roman_ur: "Faltu ya anjaan merchant codes mein paisay na bhejein jab tak poori tarah yaqeen na ho", ur: "فالتو یا انجان مرچنٹ کوڈز میں پیسے نہ بھیجیں جب تک پوری طرح یقین نہ ہو", en: "Don't send money to unfamiliar merchant codes unless you're fully sure" },
    ],
  },
  {
    category: "gov_portal",
    categoryLabel: { roman_ur: "Sarkari Portal Screen", ur: "سرکاری پورٹل اسکرین", en: "Government Portal Screen" },
    screenSummary: {
      roman_ur: "Yeh NADRA jesi sarkari website ka CNIC renewal/update form hai.",
      ur: "یہ نادرا جیسی سرکاری ویب سائٹ کا شناختی کارڈ کی تجدید/اپڈیٹ کا فارم ہے۔",
      en: "This is a CNIC renewal/update form on a government website like NADRA.",
    },
    jargon: [
      { term: "Application Tracking ID", simple: { roman_ur: "Aapki application ka number — isi se aage status check hota hai", ur: "آپ کی درخواست کا نمبر — اسی سے آگے حیثیت چیک ہوتی ہے", en: "The number used to check your application's status later" } },
      { term: "Biometric Verification", simple: { roman_ur: "Ungli ke nishan (fingerprint) se aapki tasdeeq", ur: "انگلی کے نشان (فنگر پرنٹ) سے آپ کی تصدیق", en: "Confirming it's you using your fingerprint" } },
      { term: "Fee Challan", simple: { roman_ur: "Sarkari fees jama karne ki slip", ur: "سرکاری فیس جمع کرنے کی رسید", en: "The slip used to pay the government fee" } },
      { term: "Token Number", simple: { roman_ur: "Office mein baari ka number", ur: "دفتر میں باری کا نمبر", en: "Your turn number at the office" } },
    ],
    steps: [
      { roman_ur: "Pehle check karein ke website ka address .gov.pk se khatam hota hai", ur: "پہلے چیک کریں کہ ویب سائٹ کا ایڈریس .gov.pk سے ختم ہوتا ہے", en: "First check the website address ends in .gov.pk" },
      { roman_ur: "Form mein apna CNIC number aur naam ghalti ke bina darj karein", ur: "فارم میں اپنا شناختی نمبر اور نام غلطی کے بغیر درج کریں", en: "Enter your CNIC number and name on the form without mistakes" },
      { roman_ur: "Fee Challan print karein aur sirf bank ya official counter par jama karayein", ur: "فیس چالان پرنٹ کریں اور صرف بینک یا آفیشل کاؤنٹر پر جمع کرائیں", en: "Print the fee challan and pay it only at a bank or official counter" },
      { roman_ur: "Application Tracking ID ko likh kar mehfooz jagah rakh lein", ur: "ایپلیکیشن ٹریکنگ آئی ڈی کو لکھ کر محفوظ جگہ رکھ لیں", en: "Write down the Application Tracking ID somewhere safe" },
    ],
    securityTips: [
      { roman_ur: "Sirf official .gov.pk website par apna CNIC number dalein, kisi aur jagah nahi", ur: "صرف آفیشل .gov.pk ویب سائٹ پر اپنا شناختی نمبر ڈالیں، کسی اور جگہ نہیں", en: "Only enter your CNIC number on the official .gov.pk site, nowhere else" },
      { roman_ur: "Jo website NADRA jesi lage magar naam thora alag ho, usay avoid karein", ur: "جو ویب سائٹ نادرا جیسی لگے مگر نام تھوڑا الگ ہو، اسے ایوائیڈ کریں", en: "Avoid lookalike websites that resemble NADRA but have a slightly different name" },
      { roman_ur: "Fee hamesha bank ya official counter par jama karayein, kisi shakhs ko cash na dein", ur: "فیس ہمیشہ بینک یا آفیشل کاؤنٹر پر جمع کرائیں، کسی شخص کو کیش نہ دیں", en: "Always pay the fee at a bank or official counter, never hand cash to a person" },
    ],
  },
];

export async function scanPortalScreen(): Promise<PortalScanResult> {
  await new Promise((resolve) => setTimeout(resolve, 1600 + Math.random() * 1200));
  return TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
}
