// Interactive analog clock rendered as inline SVG.
//
// Behavior:
// - Long (minute) hand drag: snaps to 1-minute steps, drives the hour hand
//   continuously based on minute. Crossing 0 forward/backward changes the hour.
// - Short (hour) hand drag: snaps to whole hours and resets minute to 0.
// - During minute drag the hour numerals are replaced by 5,10,...,55,0 labels.
//
// Coordinate system: SVG viewBox is 0..400 with center at 200,200.
// Angle is measured clockwise from 12 o'clock (north).

const VB = 400;
const CX = 200;
const CY = 200;
const R_FACE = 184;

export interface ClockState {
  hour: number; // 1..12 (display hour)
  minute: number; // 0..59
}

type DragKind = "minute" | "hour" | null;

export class ClockFace {
  readonly el: SVGSVGElement;
  private state: ClockState = { hour: 10, minute: 10 };
  private hourHand!: SVGLineElement;
  private minuteHand!: SVGLineElement;
  private hourHandHit!: SVGLineElement;
  private minuteHandHit!: SVGLineElement;
  private numbersGroup!: SVGGElement;
  private hourNumbers!: SVGTextElement[];
  private minuteNumbers!: SVGTextElement[];
  private dragging: DragKind = null;
  private lastMinuteAngle = 0; // radians, last raw minute angle while dragging
  private onChange: (s: ClockState) => void = () => {};
  // True minute including continuous turns; lets the hour increment when the
  // minute hand sweeps past 0 forward or backward during a single drag.
  private accumulatedMinute = 0;
  private dragStartHour = 0;

  constructor(opts: { interactive?: boolean } = {}) {
    const interactive = opts.interactive ?? true;
    this.el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.el.setAttribute("viewBox", `0 0 ${VB} ${VB}`);
    this.el.classList.add("clock-face");
    if (!interactive) this.el.classList.add("clock-face--static");
    this.build(interactive);
    this.render();
  }

  setOnChange(cb: (s: ClockState) => void): void {
    this.onChange = cb;
  }

  setTime(hour: number, minute: number): void {
    this.state = {
      hour: ((hour - 1 + 12) % 12) + 1,
      minute: ((minute % 60) + 60) % 60,
    };
    this.render();
  }

  getTime(): ClockState {
    return { ...this.state };
  }

  private build(interactive: boolean): void {
    const svgNS = "http://www.w3.org/2000/svg";

    // Outer face circle
    const face = document.createElementNS(svgNS, "circle");
    face.setAttribute("cx", String(CX));
    face.setAttribute("cy", String(CY));
    face.setAttribute("r", String(R_FACE));
    face.setAttribute("class", "clock-face__bg");
    this.el.appendChild(face);

    // Minute tick marks (60 ticks; emphasized every 5)
    const ticks = document.createElementNS(svgNS, "g");
    ticks.setAttribute("class", "clock-face__ticks");
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const isHour = i % 5 === 0;
      const inner = isHour ? R_FACE - 18 : R_FACE - 8;
      const outer = R_FACE - 2;
      const x1 = CX + Math.cos(angle) * inner;
      const y1 = CY + Math.sin(angle) * inner;
      const x2 = CX + Math.cos(angle) * outer;
      const y2 = CY + Math.sin(angle) * outer;
      const tick = document.createElementNS(svgNS, "line");
      tick.setAttribute("x1", String(x1));
      tick.setAttribute("y1", String(y1));
      tick.setAttribute("x2", String(x2));
      tick.setAttribute("y2", String(y2));
      tick.setAttribute(
        "class",
        isHour ? "clock-face__tick clock-face__tick--hour" : "clock-face__tick",
      );
      ticks.appendChild(tick);
    }
    this.el.appendChild(ticks);

    // Numbers group: contains hour numerals (1..12) and minute numerals (5..55,0)
    this.numbersGroup = document.createElementNS(svgNS, "g");
    this.hourNumbers = [];
    this.minuteNumbers = [];
    const numberRadius = R_FACE - 38;
    for (let h = 1; h <= 12; h++) {
      const angle = (h / 12) * Math.PI * 2 - Math.PI / 2;
      const x = CX + Math.cos(angle) * numberRadius;
      const y = CY + Math.sin(angle) * numberRadius;
      const tHour = document.createElementNS(svgNS, "text");
      tHour.setAttribute("x", String(x));
      tHour.setAttribute("y", String(y));
      tHour.setAttribute("class", "clock-face__num clock-face__num--hour");
      tHour.textContent = String(h);
      this.numbersGroup.appendChild(tHour);
      this.hourNumbers.push(tHour);

      const minuteValue = (h * 5) % 60; // 5,10,...,55,0
      const tMin = document.createElementNS(svgNS, "text");
      tMin.setAttribute("x", String(x));
      tMin.setAttribute("y", String(y));
      tMin.setAttribute("class", "clock-face__num clock-face__num--minute");
      tMin.textContent = String(minuteValue);
      this.numbersGroup.appendChild(tMin);
      this.minuteNumbers.push(tMin);
    }
    this.el.appendChild(this.numbersGroup);

    // Hour hand (short, thick)
    this.hourHand = document.createElementNS(svgNS, "line");
    this.hourHand.setAttribute("class", "clock-hand clock-hand--hour");
    this.hourHand.setAttribute("x1", String(CX));
    this.hourHand.setAttribute("y1", String(CY));
    this.el.appendChild(this.hourHand);

    // Minute hand (long, thinner)
    this.minuteHand = document.createElementNS(svgNS, "line");
    this.minuteHand.setAttribute("class", "clock-hand clock-hand--minute");
    this.minuteHand.setAttribute("x1", String(CX));
    this.minuteHand.setAttribute("y1", String(CY));
    this.el.appendChild(this.minuteHand);

    // Wider invisible hit-targets sit on top of the visible hands so children
    // can grab them comfortably.
    this.hourHandHit = document.createElementNS(svgNS, "line");
    this.hourHandHit.setAttribute("class", "clock-hand-hit");
    this.hourHandHit.setAttribute("x1", String(CX));
    this.hourHandHit.setAttribute("y1", String(CY));
    this.minuteHandHit = document.createElementNS(svgNS, "line");
    this.minuteHandHit.setAttribute("class", "clock-hand-hit");
    this.minuteHandHit.setAttribute("x1", String(CX));
    this.minuteHandHit.setAttribute("y1", String(CY));

    // Center cap
    const cap = document.createElementNS(svgNS, "circle");
    cap.setAttribute("cx", String(CX));
    cap.setAttribute("cy", String(CY));
    cap.setAttribute("r", "10");
    cap.setAttribute("class", "clock-cap");

    if (interactive) {
      // Hit targets stack above the visible hands; minute hit goes last so it
      // wins over the hour hand near the center.
      this.el.appendChild(this.hourHandHit);
      this.el.appendChild(this.minuteHandHit);
      this.el.appendChild(cap);
      this.attachDrag();
    } else {
      this.el.appendChild(cap);
    }
  }

  private attachDrag(): void {
    const start = (kind: DragKind, e: PointerEvent) => {
      this.dragging = kind;
      this.el.classList.add("clock-face--dragging");
      if (kind === "minute") {
        this.el.classList.add("clock-face--minute-drag");
        this.lastMinuteAngle = this.pointerAngle(e);
        this.accumulatedMinute = this.state.minute;
        this.dragStartHour = this.state.hour;
      }
      (e.target as Element).setPointerCapture?.(e.pointerId);
      e.preventDefault();
    };

    this.minuteHandHit.addEventListener("pointerdown", (e) => start("minute", e));
    this.hourHandHit.addEventListener("pointerdown", (e) => start("hour", e));

    this.el.addEventListener("pointermove", (e) => {
      if (!this.dragging) return;
      e.preventDefault();
      if (this.dragging === "minute") this.handleMinuteDrag(e);
      else this.handleHourDrag(e);
    });
    const end = () => {
      if (!this.dragging) return;
      this.dragging = null;
      this.el.classList.remove("clock-face--dragging");
      this.el.classList.remove("clock-face--minute-drag");
    };
    this.el.addEventListener("pointerup", end);
    this.el.addEventListener("pointercancel", end);
    this.el.addEventListener("pointerleave", end);
  }

  // Returns angle in radians from center, measured clockwise from 12 o'clock,
  // wrapped into [0, 2π).
  private pointerAngle(e: PointerEvent): number {
    const rect = this.el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * VB - CX;
    const y = ((e.clientY - rect.top) / rect.height) * VB - CY;
    let a = Math.atan2(y, x) + Math.PI / 2;
    if (a < 0) a += Math.PI * 2;
    return a;
  }

  private handleMinuteDrag(e: PointerEvent): void {
    const angle = this.pointerAngle(e);
    // Compute shortest-path delta in (-π, π].
    let delta = angle - this.lastMinuteAngle;
    if (delta > Math.PI) delta -= Math.PI * 2;
    else if (delta < -Math.PI) delta += Math.PI * 2;
    this.lastMinuteAngle = angle;

    const minuteDelta = (delta / (Math.PI * 2)) * 60;
    this.accumulatedMinute += minuteDelta;
    const snapped = Math.round(this.accumulatedMinute);
    const totalMinutes = this.dragStartHour * 60 + snapped;
    // Wrap into 12-hour cycle.
    const wrapped = ((totalMinutes % (12 * 60)) + 12 * 60) % (12 * 60);
    const newHour = Math.floor(wrapped / 60);
    const newMinute = wrapped % 60;
    const displayHour = newHour === 0 ? 12 : newHour;
    if (displayHour !== this.state.hour || newMinute !== this.state.minute) {
      this.state = { hour: displayHour, minute: newMinute };
      this.render();
      this.onChange(this.state);
    }
  }

  private handleHourDrag(e: PointerEvent): void {
    const angle = this.pointerAngle(e);
    // Snap to nearest hour. 12 sits at angle 0.
    const hour = Math.round((angle / (Math.PI * 2)) * 12);
    const display = hour === 0 || hour === 12 ? 12 : hour;
    if (display !== this.state.hour || this.state.minute !== 0) {
      this.state = { hour: display, minute: 0 };
      this.render();
      this.onChange(this.state);
    }
  }

  private render(): void {
    const minute = this.state.minute;
    const hour = this.state.hour;

    // Minute hand angle: 6 deg per minute.
    const minuteAngle = (minute / 60) * Math.PI * 2 - Math.PI / 2;
    const mLen = R_FACE - 30;
    const mx = CX + Math.cos(minuteAngle) * mLen;
    const my = CY + Math.sin(minuteAngle) * mLen;
    this.minuteHand.setAttribute("x2", String(mx));
    this.minuteHand.setAttribute("y2", String(my));
    this.minuteHandHit.setAttribute("x2", String(mx));
    this.minuteHandHit.setAttribute("y2", String(my));

    // Hour hand: hour + minute/60 fraction.
    const h12 = hour % 12;
    const hourFrac = h12 + minute / 60;
    const hourAngle = (hourFrac / 12) * Math.PI * 2 - Math.PI / 2;
    const hLen = R_FACE - 80;
    const hx = CX + Math.cos(hourAngle) * hLen;
    const hy = CY + Math.sin(hourAngle) * hLen;
    this.hourHand.setAttribute("x2", String(hx));
    this.hourHand.setAttribute("y2", String(hy));
    this.hourHandHit.setAttribute("x2", String(hx));
    this.hourHandHit.setAttribute("y2", String(hy));
  }
}
