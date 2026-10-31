/**
 * "Read text from a screenshot" without real OCR. True on-device text recognition needs
 * either a native ML module (breaks Expo Go, needs a custom dev client) or a cloud OCR
 * API (needs network + a key, which this app deliberately avoids so it can run fully
 * offline). This simulates the scan instead: it waits like a real read would, then hands
 * back one of a few realistic scam-SMS templates for the Helper to review and edit —
 * landing in the exact same text field the manual paste flow already uses.
 */
const SAMPLE_SCAM_TEXTS = [
  "UBL Alert: Aapke account mein Rs. 45,000 ka suspicious transaction hua hai. Cancel karne ke liye apna card number aur CVV is number par bhejein: 0345-1122334.",
  "SasteMobile.pk: Mubarak ho! Aap ne free Redmi Note 13 jeeta hai. Delivery charges Rs. 350 is account mein bhejein: 0312-9988771. Offer sirf aaj ke liye hai!",
  // Website/ad-style screenshot — a scam shopping/offer page, not an SMS.
  "MegaSaleToday.shop — Sirf 2 ghante baaki! iPhone 15 sirf Rs. 4,999 mein order karein. Stock khatam hone se pehle 'Order Now' par click karein aur apni delivery details aur advance payment screen par darj karein.",
  "Facebook Ad: Pakistan Govt Relief Program — har ghar ko Rs. 50,000 mil raha hai. Apply karne ke liye apna CNIC number aur mobile wallet PIN is form mein darj karein. Limited slots available!",
];

export async function scanScreenshotText(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1400 + Math.random() * 1000));
  return SAMPLE_SCAM_TEXTS[Math.floor(Math.random() * SAMPLE_SCAM_TEXTS.length)];
}
