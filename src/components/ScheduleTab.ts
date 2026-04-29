// Schedule tab: tile grid of saved times with long-press to select and tap to
// swap.

import { ClockFace } from "./ClockFace.ts";
import { readTimeJa } from "../lib/japanese.ts";
import { speechTextJa } from "../lib/japanese.ts";
import { speak } from "../lib/speech.ts";
import {
  loadSchedules,
  saveSchedules,
  type Schedule,
} from "../lib/storage.ts";

const LONG_PRESS_MS = 350;
const MOVE_THRESHOLD_PX = 10;

export class ScheduleTab {
  readonly el: HTMLElement;
  private grid: HTMLDivElement;
  private empty: HTMLDivElement;
  private selectedId: string | null = null;

  constructor() {
    this.el = document.createElement("section");
    this.el.className = "tab-panel tab-panel--schedule";

    const header = document.createElement("div");
    header.className = "schedule-header";
    header.innerHTML = `
      <h2>スケジュール</h2>
      <p class="schedule-header__hint">タップでよみあげ。ながおしでえらんで、もう1つをタップでいれかえ。</p>
    `;
    this.el.appendChild(header);

    this.grid = document.createElement("div");
    this.grid.className = "schedule-grid";
    this.el.appendChild(this.grid);

    this.empty = document.createElement("div");
    this.empty.className = "schedule-empty";
    this.empty.textContent =
      "まだスケジュールがありません。とけいタブから「スケジュールにほぞん」をおしてね。";
    this.el.appendChild(this.empty);
  }

  refresh(): void {
    const list = loadSchedules();
    if (this.selectedId && !list.some((s) => s.id === this.selectedId)) {
      this.selectedId = null;
    }
    this.grid.replaceChildren();
    if (list.length === 0) {
      this.empty.style.display = "";
      return;
    }
    this.empty.style.display = "none";
    for (const s of list) {
      this.grid.appendChild(this.renderTile(s));
    }
  }

  private renderTile(s: Schedule): HTMLElement {
    const tile = document.createElement("div");
    tile.className = "tile";
    if (this.selectedId === s.id) tile.classList.add("tile--selected");
    tile.dataset.id = s.id;

    const face = new ClockFace({ interactive: false });
    face.setTime(s.hour, s.minute);
    const faceWrap = document.createElement("div");
    faceWrap.className = "tile__face";
    faceWrap.appendChild(face.el);

    const t = readTimeJa(s.hour, s.minute);
    const time = document.createElement("div");
    time.className = "tile__time";
    time.innerHTML = `
      <ruby>${t.hourDigits}<rt>${stripUnit(t.hourKana, "じ")}</rt></ruby><ruby>時<rt>じ</rt></ruby>
      <ruby>${t.minuteDigits}<rt>${stripMinuteUnit(t.minuteKana)}</rt></ruby><ruby>分<rt>ふん</rt></ruby>
    `.trim();

    const text = document.createElement("div");
    text.className = "tile__text";
    text.textContent = s.text;

    const del = document.createElement("button");
    del.type = "button";
    del.className = "tile__delete";
    del.setAttribute("aria-label", "けす");
    del.innerHTML = "✕";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      const list = loadSchedules().filter((x) => x.id !== s.id);
      saveSchedules(list);
      if (this.selectedId === s.id) this.selectedId = null;
      this.refresh();
    });

    tile.append(faceWrap, time, text, del);
    this.attachLongPress(tile, s);
    return tile;
  }

  private attachLongPress(tile: HTMLElement, s: Schedule): void {
    let pressTimer: number | null = null;
    let longPressFired = false;
    let startX = 0;
    let startY = 0;

    const cancelTimer = () => {
      if (pressTimer !== null) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    tile.addEventListener("pointerdown", (e) => {
      longPressFired = false;
      startX = e.clientX;
      startY = e.clientY;
      cancelTimer();
      pressTimer = window.setTimeout(() => {
        pressTimer = null;
        longPressFired = true;
        this.handleLongPress(s);
      }, LONG_PRESS_MS);
    });

    tile.addEventListener("pointermove", (e) => {
      if (
        pressTimer !== null &&
        Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_THRESHOLD_PX
      ) {
        cancelTimer();
      }
    });

    tile.addEventListener("pointerup", cancelTimer);
    tile.addEventListener("pointercancel", cancelTimer);
    tile.addEventListener("pointerleave", cancelTimer);

    tile.addEventListener("click", () => {
      if (longPressFired) {
        longPressFired = false;
        return;
      }
      this.handleTap(s);
    });
  }

  private handleLongPress(s: Schedule): void {
    this.selectedId = this.selectedId === s.id ? null : s.id;
    this.updateSelectionUI();
  }

  private handleTap(s: Schedule): void {
    if (this.selectedId === null) {
      speak(speechTextJa(s.hour, s.minute), "ja");
      return;
    }
    if (this.selectedId === s.id) {
      this.selectedId = null;
      this.updateSelectionUI();
      return;
    }
    this.swap(this.selectedId, s.id);
  }

  private swap(idA: string, idB: string): void {
    const list = loadSchedules();
    const ai = list.findIndex((x) => x.id === idA);
    const bi = list.findIndex((x) => x.id === idB);
    if (ai < 0 || bi < 0) {
      this.selectedId = null;
      this.refresh();
      return;
    }
    [list[ai], list[bi]] = [list[bi], list[ai]];
    saveSchedules(list);
    this.selectedId = null;
    this.refresh();
  }

  private updateSelectionUI(): void {
    for (const tile of this.grid.querySelectorAll<HTMLElement>(".tile")) {
      tile.classList.toggle(
        "tile--selected",
        tile.dataset.id === this.selectedId,
      );
    }
  }
}

function stripUnit(kana: string, unit: string): string {
  return kana.endsWith(unit) ? kana.slice(0, -unit.length) : kana;
}
function stripMinuteUnit(kana: string): string {
  if (kana.endsWith("ぷん")) return kana.slice(0, -2);
  if (kana.endsWith("ふん")) return kana.slice(0, -2);
  return kana;
}
