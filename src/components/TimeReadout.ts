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
    const hourSplit = splitKana(t.hourKana, ["じ"]);
    const minuteSplit = splitKana(t.minuteKana, ["ぷん", "ふん"]);
    this.el.innerHTML = `
      <ruby class="time-readout__num">${t.hourDigits}<rt>${hourSplit.digits}</rt></ruby><ruby class="time-readout__unit">時<rt>${hourSplit.unit}</rt></ruby>
      <ruby class="time-readout__num">${t.minuteDigits}<rt>${minuteSplit.digits}</rt></ruby><ruby class="time-readout__unit">分<rt>${minuteSplit.unit}</rt></ruby>
    `.trim();
  }
}

// Splits the full kana into the digit-portion and the unit-portion (じ / ふん / ぷん)
// so each ruby pair sits over the right character. The unit varies (e.g. 1分→ぷん,
// 2分→ふん) based on the ones digit, so we take it from the actual kana rather
// than hard-coding it.
function splitKana(full: string, units: string[]): { digits: string; unit: string } {
  for (const u of units) {
    if (full.endsWith(u)) {
      return { digits: full.slice(0, -u.length), unit: u };
    }
  }
  return { digits: full, unit: units[0] };
}
