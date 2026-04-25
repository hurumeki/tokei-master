// English speech text for clock time.

const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
];
const TEENS = [
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty"];

function spellHour(hour: number): string {
  const h = ((hour - 1 + 12) % 12) + 1;
  if (h < 10) return ONES[h];
  if (h < 20) return TEENS[h - 10];
  return ""; // unreachable for 1..12
}

function spellMinuteTwoDigits(minute: number): string {
  // Used for "X oh Y" / "X Y" forms. Handles 1..59.
  if (minute < 10) return `oh ${ONES[minute]}`;
  if (minute < 20) return TEENS[minute - 10];
  const tens = Math.floor(minute / 10);
  const ones = minute % 10;
  if (ones === 0) return TENS[tens];
  return `${TENS[tens]} ${ONES[ones]}`;
}

export function speechTextEn(hour: number, minute: number): string {
  const h = spellHour(hour);
  if (minute === 0) return `${h} o'clock`;
  return `${h} ${spellMinuteTwoDigits(minute)}`;
}
