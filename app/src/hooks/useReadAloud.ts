/**
 * Read-aloud for every screen. The app's own display toggle defaults to Roman Urdu,
 * but that's just a script choice for readers — the actual spoken language is always
 * Urdu, so the voice should always speak with an Urdu accent (ur-PK) rather than
 * falling back to the device's default English voice whenever the display happens to
 * be in Roman script. We always request ur-PK and let the OS fall back on its own if
 * that voice truly isn't installed.
 */
import { useEffect, useState } from "react";
import * as Speech from "expo-speech";
import { Language } from "../i18n";

let cachedHasUrduVoice: boolean | null = null;

async function hasUrduVoice(): Promise<boolean> {
  if (cachedHasUrduVoice !== null) return cachedHasUrduVoice;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    cachedHasUrduVoice = voices.some((v) => v.language?.toLowerCase().startsWith("ur"));
  } catch {
    cachedHasUrduVoice = false;
  }
  return cachedHasUrduVoice;
}

export function useReadAloud() {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const speak = async (text: string, _lang: Language) => {
    if (!text) return;
    await Speech.stop();
    const options: Speech.SpeechOptions = {
      rate: 0.9,
      pitch: 1.0,
      onStart: () => setSpeaking(true),
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    };
    if (await hasUrduVoice()) {
      options.language = "ur-PK";
    }
    Speech.speak(text, options);
  };

  const stop = () => {
    Speech.stop();
    setSpeaking(false);
  };

  return { speak, stop, speaking };
}
