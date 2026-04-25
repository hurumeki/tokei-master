// Thin wrapper around Web Speech API.

export type Lang = "ja" | "en";

function pickVoice(lang: Lang): SpeechSynthesisVoice | undefined {
  const target = lang === "ja" ? "ja" : "en";
  const voices = speechSynthesis.getVoices();
  return voices.find((v) => v.lang.toLowerCase().startsWith(target));
}

export function speak(text: string, lang: Lang): void {
  if (typeof speechSynthesis === "undefined") return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "ja" ? "ja-JP" : "en-US";
  u.rate = lang === "ja" ? 0.9 : 0.85;
  u.pitch = 1;
  const voice = pickVoice(lang);
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

// Some browsers populate voices asynchronously. Warm them up.
export function warmUpVoices(): void {
  if (typeof speechSynthesis === "undefined") return;
  speechSynthesis.getVoices();
  speechSynthesis.addEventListener?.("voiceschanged", () => {
    /* no-op; getVoices() will return the populated list next time */
  });
}
