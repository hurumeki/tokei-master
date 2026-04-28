// Schedule tab: tile grid of saved times with drag-to-reorder and delete.

import { ClockFace } from "./ClockFace.ts";
import { readTimeJa } from "../lib/japanese.ts";
import { speechTextJa } from "../lib/japanese.ts";
import { speak } from "../lib/speech.ts";
import {
  loadSchedules,
  saveSchedules,
  type Schedule,
} from "../lib/storage.ts";

export class ScheduleTab {
  readonly el: HTMLElement;
  private grid: HTMLDivElement;
  private empty: HTMLDivElement;

  constructor() {
    this.el = document.createElement("section");
    this.el.className = "tab-panel tab-panel--schedule";

    const header = document.createElement("div");
    header.className = "schedule-header";
    header.innerHTML = `
      <h2>スケジュール</h2>
      <p class="schedule-header__hint">タイルをタップでよみあげ、ながおしでならびかえ。</p>
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
    tile.dataset.id = s.id;
    tile.draggable = true;

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
      this.refresh();
    });

    tile.append(faceWrap, time, text, del);

    // Tap → speak (Japanese). Ignore if a drag was just performed.
    tile.addEventListener("click", () => {
      if (tile.dataset.justDragged === "1") {
        delete tile.dataset.justDragged;
        return;
      }
      speak(speechTextJa(s.hour, s.minute), "ja");
    });

    this.attachDnd(tile);
    return tile;
  }

  private attachDnd(tile: HTMLElement): void {
    tile.addEventListener("dragstart", (e) => {
      tile.classList.add("tile--dragging");
      e.dataTransfer?.setData("text/plain", tile.dataset.id ?? "");
      e.dataTransfer!.effectAllowed = "move";
    });
    tile.addEventListener("dragend", () => {
      tile.classList.remove("tile--dragging");
      tile.dataset.justDragged = "1";
      // Persist new order.
      const ids = Array.from(this.grid.querySelectorAll<HTMLElement>(".tile"))
        .map((t) => t.dataset.id!)
        .filter(Boolean);
      const list = loadSchedules();
      const byId = new Map(list.map((s) => [s.id, s]));
      const reordered: Schedule[] = ids
        .map((id) => byId.get(id))
        .filter((s): s is Schedule => !!s);
      saveSchedules(reordered);
    });
    tile.addEventListener("dragover", (e) => {
      e.preventDefault();
      const dragging = this.grid.querySelector<HTMLElement>(".tile--dragging");
      if (!dragging || dragging === tile) return;
      if (shouldInsertAfter(tile, dragging, e.clientX, e.clientY)) {
        tile.after(dragging);
      } else {
        tile.before(dragging);
      }
    });

    // Touch fallback: long-press starts a manual reorder. The native dragstart
    // already covers most desktop browsers; mobile browsers vary, so we add a
    // pointer-based drag for touch devices that don't fire dragstart.
    // touch-action:none on .tile (CSS) prevents pointercancel from scroll.
    let pressTimer: number | null = null;
    let dragging = false;
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    tile.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "touch") return;
      if (pointerId !== null) return; // ignore additional touch points
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      pressTimer = window.setTimeout(() => {
        dragging = true;
        tile.classList.add("tile--dragging");
        tile.setPointerCapture(e.pointerId);
      }, 350);
    });
    tile.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pointerId) return;
      if (!dragging) {
        // Cancel long-press if finger moved more than 10px (user is scrolling).
        if (
          pressTimer !== null &&
          Math.hypot(e.clientX - startX, e.clientY - startY) > 10
        ) {
          clearTimeout(pressTimer);
          pressTimer = null;
          pointerId = null;
        }
        return;
      }
      const target = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest<HTMLElement>(".tile");
      if (!target || target === tile) return;
      if (shouldInsertAfter(target, tile, e.clientX, e.clientY)) {
        target.after(tile);
      } else {
        target.before(tile);
      }
    });
    const endTouch = (e: PointerEvent) => {
      if (pressTimer != null) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      if (dragging && e.pointerId === pointerId) {
        dragging = false;
        tile.classList.remove("tile--dragging");
        tile.dataset.justDragged = "1";
        const ids = Array.from(
          this.grid.querySelectorAll<HTMLElement>(".tile"),
        )
          .map((t) => t.dataset.id!)
          .filter(Boolean);
        const list = loadSchedules();
        const byId = new Map(list.map((s) => [s.id, s]));
        const reordered: Schedule[] = ids
          .map((id) => byId.get(id))
          .filter((s): s is Schedule => !!s);
        saveSchedules(reordered);
      }
      pointerId = null;
    };
    tile.addEventListener("pointerup", endTouch);
    tile.addEventListener("pointercancel", endTouch);
  }
}

// Grid layout: choose X axis when target shares a row with the dragged tile,
// otherwise Y axis. Y-only would never swap horizontally adjacent tiles.
function shouldInsertAfter(
  target: HTMLElement,
  dragging: HTMLElement,
  clientX: number,
  clientY: number,
): boolean {
  const rect = target.getBoundingClientRect();
  const dragRect = dragging.getBoundingClientRect();
  const sameRow =
    Math.abs(rect.top - dragRect.top) <
    Math.min(rect.height, dragRect.height) / 2;
  return sameRow
    ? clientX > rect.left + rect.width / 2
    : clientY > rect.top + rect.height / 2;
}

function stripUnit(kana: string, unit: string): string {
  return kana.endsWith(unit) ? kana.slice(0, -unit.length) : kana;
}
function stripMinuteUnit(kana: string): string {
  if (kana.endsWith("ぷん")) return kana.slice(0, -2);
  if (kana.endsWith("ふん")) return kana.slice(0, -2);
  return kana;
}
