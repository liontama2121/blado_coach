/**
 * Coach schedule: pure functions, no I/O.
 *
 * Business time zone is America/Bogota, fixed UTC-5 (Colombia has no DST).
 * Availability is stored as local minutes from midnight; sessions as UTC instants.
 * The public view only ever exposes free / busy, never who or where.
 */

export const BOGOTA_OFFSET_MIN = -5 * 60;

export interface AvailabilityBlock {
  weekday: number; // 0 = Sunday … 6 = Saturday
  start_minute: number;
  end_minute: number;
  location: "gym" | "casa" | "ambos";
}

export interface AvailabilityException {
  date: string; // YYYY-MM-DD local
  start_minute: number | null;
  end_minute: number | null;
}

export interface BusySession {
  starts_at: string; // UTC ISO
  ends_at: string;
  travel_before_min: number;
  travel_after_min: number;
}

export type SlotState = "free" | "busy" | "past";

export interface Slot {
  start: number; // local minutes
  end: number;
  state: SlotState;
  location: AvailabilityBlock["location"];
}

export interface Day {
  date: string;
  weekday: number;
  slots: Slot[];
}

// ---------------------------------------------------------------- time helpers

/** Local Bogotá date and minute-of-day for an instant. */
export function bogotaParts(instant: Date): { date: string; weekday: number; minute: number } {
  const local = new Date(instant.getTime() + BOGOTA_OFFSET_MIN * 60_000);
  return {
    date: local.toISOString().slice(0, 10),
    weekday: local.getUTCDay(),
    minute: local.getUTCHours() * 60 + local.getUTCMinutes(),
  };
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** Monday of the week containing `date`. */
export function mondayOf(date: string): string {
  return addDays(date, -((weekdayOf(date) + 6) % 7));
}

/** UTC instant (ms) for a local Bogotá date + minute of day. */
export function localToUtcMs(date: string, minute: number): number {
  return Date.parse(`${date}T00:00:00Z`) + (minute - BOGOTA_OFFSET_MIN) * 60_000;
}

export function formatMinute(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// ---------------------------------------------------------------- week

export function buildWeek(input: {
  weekStart: string; // Monday
  availability: readonly AvailabilityBlock[];
  exceptions: readonly AvailabilityException[];
  sessions: readonly BusySession[];
  now: Date;
  slotMinutes?: number;
  days?: number;
}): Day[] {
  const slotMin = input.slotMinutes ?? 60;
  const nowMs = input.now.getTime();
  const busy = input.sessions.map((s) => ({
    from: Date.parse(s.starts_at) - s.travel_before_min * 60_000,
    to: Date.parse(s.ends_at) + s.travel_after_min * 60_000,
  }));

  return Array.from({ length: input.days ?? 7 }, (_, i) => {
    const date = addDays(input.weekStart, i);
    const weekday = weekdayOf(date);
    const dayExceptions = input.exceptions.filter((e) => e.date === date);
    const blocks = input.availability
      .filter((b) => b.weekday === weekday)
      .sort((a, b) => a.start_minute - b.start_minute);

    const slots: Slot[] = [];
    for (const b of blocks) {
      for (let start = b.start_minute; start + slotMin <= b.end_minute; start += slotMin) {
        const end = start + slotMin;
        const fromMs = localToUtcMs(date, start);
        const toMs = localToUtcMs(date, end);
        const blocked = dayExceptions.some(
          (e) => e.start_minute === null || e.end_minute === null || (e.start_minute < end && e.end_minute > start),
        );
        const taken = busy.some((s) => s.from < toMs && s.to > fromMs);
        const state: SlotState = toMs <= nowMs ? "past" : blocked || taken ? "busy" : "free";
        slots.push({ start, end, state, location: b.location });
      }
    }
    return { date, weekday, slots };
  });
}

export type CoachStatus = "disponible" | "ocupado" | "fuera_de_horario";

/** What the coach is doing right now, in public terms. */
export function coachStatus(days: readonly Day[], now: Date, input?: { sessions: readonly BusySession[] }): CoachStatus {
  const { date, minute } = bogotaParts(now);
  const nowMs = now.getTime();
  if (input?.sessions.some((s) => Date.parse(s.starts_at) <= nowMs && Date.parse(s.ends_at) > nowMs)) return "ocupado";
  const today = days.find((d) => d.date === date);
  const slot = today?.slots.find((s) => s.start <= minute && s.end > minute);
  if (!slot) return "fuera_de_horario";
  // The current slot is "past" by end time only when it already ended; inside it, look at availability.
  return slot.state === "busy" ? "ocupado" : "disponible";
}

/** First free slot from now on, or null. */
export function nextFree(days: readonly Day[]): { date: string; slot: Slot } | null {
  for (const d of days) {
    const slot = d.slots.find((s) => s.state === "free");
    if (slot) return { date: d.date, slot };
  }
  return null;
}
