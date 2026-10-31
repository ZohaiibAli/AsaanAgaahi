/**
 * "Read text from a screenshot" without real OCR. True on-device text recognition needs
 * either a native ML module (breaks Expo Go, needs a custom dev client) or a cloud OCR
 * API (needs network + a key, which this app deliberately avoids so it can run fully
 * offline). This simulates the scan instead: it waits like a real read would, then hands
 * back one of a few realistic scam-SMS templates for the Helper to review and edit —
 * landing in the exact same text field the manual paste flow already uses.
 */
const SAMPLE_SCAM_TEXTS = [
  "SasteMobile.pk: Mubarak ho! Aap ne free Redmi Note 13 jeeta hai. Delivery charges Rs. 350 is account mein bhejein: 0312-9988771. Offer sirf aaj ke liye hai!",
  "NADRA Update: Aapka CNIC verification expire ho gaya hai. Turant update karein warna account block ho jayega: nadra-verify.cf/update",
  "UBL Alert: Aapke account mein Rs. 45,000 ka suspicious transaction hua hai. Cancel karne ke liye apna card number aur CVV is number par bhejein: 0345-1122334.",
  "Telenor Lucky Customer: Aap ne Rs. 100,000 ka inaam jeeta hai! Claim karne ke liye apna mobile account ka PIN is number par SMS karein.",
];

export async function scanScreenshotText(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1400 + Math.random() * 1000));
  return SAMPLE_SCAM_TEXTS[Math.floor(Math.random() * SAMPLE_SCAM_TEXTS.length)];
}
