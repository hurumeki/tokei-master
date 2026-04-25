import "./style.css";
import { ClockTab } from "./components/ClockTab.ts";
import { ScheduleTab } from "./components/ScheduleTab.ts";
import { warmUpVoices } from "./lib/speech.ts";

warmUpVoices();

const app = document.getElementById("app")!;

const header = document.createElement("header");
header.className = "app-header";
header.innerHTML = `
  <h1 class="app-header__title">
    <span aria-hidden="true">🕒</span>
    <ruby>時計<rt>とけい</rt></ruby>マスター
  </h1>
`;

const tabs = document.createElement("nav");
tabs.className = "tabs";
const clockTabBtn = makeTabButton("clock", "🕒", "とけい");
const scheduleTabBtn = makeTabButton("schedule", "📋", "スケジュール");
tabs.append(clockTabBtn, scheduleTabBtn);

const main = document.createElement("main");
main.className = "app-main";

const clockTab = new ClockTab();
const scheduleTab = new ScheduleTab();
main.append(clockTab.el, scheduleTab.el);

app.append(header, tabs, main);

let active: "clock" | "schedule" = "clock";
function setTab(name: "clock" | "schedule"): void {
  active = name;
  clockTabBtn.setAttribute("aria-selected", String(name === "clock"));
  scheduleTabBtn.setAttribute("aria-selected", String(name === "schedule"));
  clockTab.el.classList.toggle("tab-panel--active", name === "clock");
  scheduleTab.el.classList.toggle("tab-panel--active", name === "schedule");
  if (name === "schedule") scheduleTab.refresh();
}
clockTabBtn.addEventListener("click", () => setTab("clock"));
scheduleTabBtn.addEventListener("click", () => setTab("schedule"));
clockTab.setOnScheduleAdded(() => {
  setTab("schedule");
});
setTab(active);

// Register service worker (PWA). Skip on dev (no sw.js served).
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swUrl).catch(() => {
      // ignore registration failures (e.g. running over file://)
    });
  });
}

function makeTabButton(
  name: string,
  icon: string,
  label: string,
): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "tab-btn";
  b.dataset.tab = name;
  b.innerHTML = `<span class="tab-btn__icon" aria-hidden="true">${icon}</span><span class="tab-btn__label">${label}</span>`;
  b.setAttribute("role", "tab");
  return b;
}
