/**
 * expo-secure-store has no web implementation and throws there. Native (Expo Go on a
 * phone, the actual target) keeps using real SecureStore; web falls back to
 * localStorage, just so the app doesn't crash if someone opens it in a browser.
 */
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.setItem(key, value);
    } catch {}
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function storageDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.removeItem(key);
    } catch {}
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
