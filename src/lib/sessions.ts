/**
 * Session proposals: pure rules, unit-tested.
 * "gym" = in person; "casa" = virtual over Google Meet.
 */
import { localToUtcMs } from "./schedule";

export const OPEN_MINUTE = 5 * 60; // 05:00 Bogotá
export const CLOSE_MINUTE = 22 * 60; // 22:00 Bogotá
export const MIN_NOTICE_MS = 2 * 3600_000;
export const DURATIONS = [30, 45, 60, 90] as const;

export type Location = "gym" | "casa";
export const LOCATION_LABEL: Record<Location, string> = { gym: "En el gimnasio (presencial)", casa: "En casa (virtual por Google Meet)" };

export interface Interval {
  starts_at: string;
  ends_at: string;
}

export function parseTime(hhmm: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export type ProposalError = "hora_invalida" | "fuera_de_horario" | "muy_pronto" | "duracion_invalida" | "choque";

export const PROPOSAL_ERROR: Record<ProposalError, string> = {
  hora_invalida: "Escribe una hora válida.",
  fuera_de_horario: "Las sesiones van entre las 5:00 a. m. y las 10:00 p. m.",
  muy_pronto: "Propón con al menos 2 horas de anticipación.",
  duracion_invalida: "Elige una duración de 30, 45, 60 o 90 minutos.",
  choque: "El coach ya tiene una sesión confirmada a esa hora. Prueba otra.",
};

/** Validates a proposed slot and returns its UTC interval. */
export function checkProposal(
  input: { date: string; time: string; minutes: number },
  busy: readonly Interval[],
  now: Date,
): { ok: true; starts_at: string; ends_at: string } | { ok: false; error: ProposalError } {
  const start = parseTime(input.time);
  if (start === null || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { ok: false, error: "hora_invalida" };
  if (!(DURATIONS as readonly number[]).includes(input.minutes)) return { ok: false, error: "duracion_invalida" };
  const end = start + input.minutes;
  if (start < OPEN_MINUTE || end > CLOSE_MINUTE) return { ok: false, error: "fuera_de_horario" };
  const s = localToUtcMs(input.date, start);
  const e = localToUtcMs(input.date, end);
  if (s - now.getTime() < MIN_NOTICE_MS) return { ok: false, error: "muy_pronto" };
  if (busy.some((b) => Date.parse(b.starts_at) < e && Date.parse(b.ends_at) > s)) return { ok: false, error: "choque" };
  return { ok: true, starts_at: new Date(s).toISOString(), ends_at: new Date(e).toISOString() };
}

/** Google Meet links look like https://meet.google.com/abc-defg-hij */
export function isMeetUrl(url: string): boolean {
  return /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(\?.*)?$/.test(url.trim());
}

/** Pre-filled Google Calendar "new event" link; the coach adds Meet with one click there. */
export function calendarTemplateUrl(p: { title: string; startsAt: string; endsAt: string; details?: string; guest?: string | null }): string {
  const f = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const q = new URLSearchParams({ action: "TEMPLATE", text: p.title, dates: `${f(p.startsAt)}/${f(p.endsAt)}`, details: p.details ?? "" });
  if (p.guest) q.set("add", p.guest);
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
