// Renders the current time as kanji/digit characters with ruby furigana.

import { readTimeJa } from "../lib/japanese.ts";

export class TimeReadout {
  readonly el: HTMLDivElement;

  constructor() {
    this.el = document.createElement("div");
    this.el.className = "time-readout";
  }

  update(hour: number, minute: number): void {
    const t = readTimeJa(hour, minute);
    // Ruby keeps the digits visible while showing kana above. The 時/分 kanji
    // also gets furigana so first-graders can read every character.
    this.el.innerHTML = `
      <ruby class="time-readout__num">${t.hourDigits}<rt>${kanaForDigits(t.hourKana)}</rt></ruby><ruby class="time-readout__unit">時<rt>じ</rt></ruby>
      <ruby class="time-readout__num">${t.minuteDigits}<rt>${kanaForDigits(t.minuteKana)}</rt></ruby><ruby class="time-readout__unit">分<rt>ふん</rt></ruby>
    `.trim();
  }
}

// The kana already contains the unit (じ / ふん etc.). We split it so that the
// numeric ruby shows just the number reading and the unit ruby shows its own
// reading. This keeps each ruby pair short and aligned with the character.
function kanaForDigits(full: string): string {
  // Strip trailing じ / ふん / ぷん so the reading sits over the digits.
  return full
    .replace(/(じ)$/, "")
    .replace(/(ぷん|ふん)$/, "");
}
