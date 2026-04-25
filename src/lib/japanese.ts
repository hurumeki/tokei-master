// Japanese readings for time. Targets first-graders learning to read clocks.

const HOUR_READINGS: Record<number, string> = {
  1: "いち",
  2: "に",
  3: "さん",
  4: "よ",
  5: "ご",
  6: "ろく",
  7: "しち",
  8: "はち",
  9: "く",
  10: "じゅう",
  11: "じゅういち",
  12: "じゅうに",
};

// 1..19. 0 is handled separately.
const MINUTE_READINGS_1_19: Record<number, string> = {
  1: "いっぷん",
  2: "にふん",
  3: "さんぷん",
  4: "よんぷん",
  5: "ごふん",
  6: "ろっぷん",
  7: "ななふん",
  8: "はっぷん",
  9: "きゅうふん",
  10: "じっぷん",
  11: "じゅういっぷん",
  12: "じゅうにふん",
  13: "じゅうさんぷん",
  14: "じゅうよんぷん",
  15: "じゅうごふん",
  16: "じゅうろっぷん",
  17: "じゅうななふん",
  18: "じゅうはっぷん",
  19: "じゅうきゅうふん",
};

// Tens-only readings (20, 30, 40, 50) -- use じっぷん style per spec.
const TENS_ONLY: Record<number, string> = {
  2: "にじっぷん",
  3: "さんじっぷん",
  4: "よんじっぷん",
  5: "ごじっぷん",
};

// Tens prefix used when ones digit is non-zero (e.g. 21分 = にじゅう + いっぷん).
const TENS_PREFIX: Record<number, string> = {
  2: "にじゅう",
  3: "さんじゅう",
  4: "よんじゅう",
  5: "ごじゅう",
};

export function readHourKana(hour: number): string {
  const h = ((hour - 1 + 12) % 12) + 1; // normalize 0/24 -> 12
  return HOUR_READINGS[h] + "じ";
}

export function readMinuteKana(minute: number): string {
  if (minute === 0) return "ぜろふん";
  if (minute < 20) return MINUTE_READINGS_1_19[minute];
  const tens = Math.floor(minute / 10);
  const ones = minute % 10;
  if (ones === 0) return TENS_ONLY[tens];
  return TENS_PREFIX[tens] + MINUTE_READINGS_1_19[ones];
}

export interface TimeText {
  hourDigits: string; // e.g. "12"
  hourKana: string; // e.g. "じゅうにじ"
  minuteDigits: string; // e.g. "05"
  minuteKana: string; // e.g. "ごふん"
}

export function readTimeJa(hour: number, minute: number): TimeText {
  const h = ((hour - 1 + 12) % 12) + 1;
  return {
    hourDigits: String(h),
    hourKana: readHourKana(h),
    minuteDigits: String(minute).padStart(2, "0"),
    minuteKana: readMinuteKana(minute),
  };
}

// Speech-friendly form. Adds a small pause between hour and minute.
export function speechTextJa(hour: number, minute: number): string {
  const t = readTimeJa(hour, minute);
  return `${t.hourKana}、 ${t.minuteKana}`;
}
