// Schedule persistence in localStorage.

const KEY = "tokei-master.schedules.v1";

export interface Schedule {
  id: string;
  hour: number; // 1..12
  minute: number; // 0..59
  text: string;
  createdAt: number;
}

export function loadSchedules(): Schedule[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (s): s is Schedule =>
        s &&
        typeof s.id === "string" &&
        typeof s.hour === "number" &&
        typeof s.minute === "number" &&
        typeof s.text === "string",
    );
  } catch {
    return [];
  }
}

export function saveSchedules(list: Schedule[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
