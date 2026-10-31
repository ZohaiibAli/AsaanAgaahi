/**
 * Read-aloud for every screen. Urdu script text tries the ur-PK voice (and falls back
 * to the device default if that voice isn't installed); Roman Urdu/English text reads
 * fine with the default voice since it's Latin script either way.
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

  const speak = async (text: string, lang: Language) => {
    if (!text) return;
    await Speech.stop();
    const options: Speech.SpeechOptions = {
      rate: 0.95,
      onStart: () => setSpeaking(true),
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    };
    if (lang === "ur" && (await hasUrduVoice())) {
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
