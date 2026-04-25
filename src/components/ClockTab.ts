// Clock tab: large interactive clock plus controls.

import { ClockFace, type ClockState } from "./ClockFace.ts";
import { TimeReadout } from "./TimeReadout.ts";
import { speechTextJa } from "../lib/japanese.ts";
import { speechTextEn } from "../lib/english.ts";
import { speak } from "../lib/speech.ts";
import { saveSchedules, loadSchedules, newId } from "../lib/storage.ts";

export class ClockTab {
  readonly el: HTMLElement;
  private clock: ClockFace;
  private readout: TimeReadout;
  private scheduleForm: HTMLFormElement;
  private scheduleInput: HTMLInputElement;
  private onScheduleAdded: () => void = () => {};

  constructor() {
    this.el = document.createElement("section");
    this.el.className = "tab-panel tab-panel--clock";

    this.clock = new ClockFace({ interactive: true });
    this.readout = new TimeReadout();

    const initial = new Date();
    const h = ((initial.getHours() - 1 + 12) % 12) + 1;
    const m = initial.getMinutes();
    this.clock.setTime(h, m);
    this.readout.update(h, m);

    this.clock.setOnChange((s) => this.handleChange(s));

    const clockWrap = document.createElement("div");
    clockWrap.className = "clock-wrap";
    clockWrap.appendChild(this.clock.el);

    const controls = document.createElement("div");
    controls.className = "controls";

    const speakJa = makeButton({
      icon: "🔊",
      label: "にほんごでよむ",
      sub: "JP",
      cls: "btn btn--primary",
    });
    speakJa.addEventListener("click", () => {
      const { hour, minute } = this.clock.getTime();
      speak(speechTextJa(hour, minute), "ja");
    });

    const speakEn = makeButton({
      icon: "🔊",
      label: "Read in English",
      sub: "EN",
      cls: "btn btn--primary",
    });
    speakEn.addEventListener("click", () => {
      const { hour, minute } = this.clock.getTime();
      speak(speechTextEn(hour, minute), "en");
    });

    const nowBtn = makeButton({
      icon: "⏱",
      label: "いまのじかん",
      cls: "btn",
    });
    nowBtn.addEventListener("click", () => {
      const d = new Date();
      const nh = ((d.getHours() - 1 + 12) % 12) + 1;
      this.clock.setTime(nh, d.getMinutes());
      this.handleChange(this.clock.getTime());
    });

    const saveBtn = makeButton({
      icon: "💾",
      label: "スケジュールにほぞん",
      cls: "btn btn--accent",
    });
    saveBtn.addEventListener("click", () => {
      this.scheduleForm.classList.toggle("schedule-form--open");
      if (this.scheduleForm.classList.contains("schedule-form--open")) {
        this.scheduleInput.focus();
      }
    });

    controls.append(speakJa, speakEn, nowBtn, saveBtn);

    // Inline schedule form, shown when the user taps "save".
    this.scheduleForm = document.createElement("form");
    this.scheduleForm.className = "schedule-form";
    this.scheduleInput = document.createElement("input");
    this.scheduleInput.type = "text";
    this.scheduleInput.placeholder = "なにをするじかん？（例：あさごはん）";
    this.scheduleInput.maxLength = 40;
    this.scheduleInput.required = true;
    const formSubmit = makeButton({
      icon: "✓",
      label: "ほぞん",
      cls: "btn btn--accent",
    });
    formSubmit.type = "submit";
    const formCancel = makeButton({ icon: "✕", label: "やめる", cls: "btn" });
    formCancel.type = "button";
    formCancel.addEventListener("click", () => {
      this.scheduleForm.classList.remove("schedule-form--open");
      this.scheduleInput.value = "";
    });
    this.scheduleForm.append(this.scheduleInput, formSubmit, formCancel);
    this.scheduleForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = this.scheduleInput.value.trim();
      if (!text) return;
      const { hour, minute } = this.clock.getTime();
      const list = loadSchedules();
      list.push({ id: newId(), hour, minute, text, createdAt: Date.now() });
      saveSchedules(list);
      this.scheduleInput.value = "";
      this.scheduleForm.classList.remove("schedule-form--open");
      this.onScheduleAdded();
    });

    this.el.append(clockWrap, this.readout.el, controls, this.scheduleForm);
  }

  setOnScheduleAdded(cb: () => void): void {
    this.onScheduleAdded = cb;
  }

  private handleChange(s: ClockState): void {
    this.readout.update(s.hour, s.minute);
  }
}

function makeButton(opts: {
  icon: string;
  label: string;
  sub?: string;
  cls: string;
}): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.className = opts.cls;
  b.innerHTML = `
    <span class="btn__icon" aria-hidden="true">${opts.icon}</span>
    <span class="btn__label">${opts.label}</span>
    ${opts.sub ? `<span class="btn__sub">${opts.sub}</span>` : ""}
  `;
  b.setAttribute("aria-label", opts.label);
  return b;
}
