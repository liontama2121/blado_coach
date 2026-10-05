/**
 * Student-scoped data access. EVERY function takes the studentId that the
 * middleware derived from the session (locals.user.studentId), never one from
 * the URL or the request body. That is the isolation guarantee D1 lacks (no RLS).
 */
import { addDays, bogotaParts, mondayOf } from "@/lib/schedule";

export interface StudentBasics {
  id: string;
  full_name: string;
  birth_date: string;
  sex: "M" | "F";
  height_cm: number;
  goal_type: string;
  goal_text: string | null;
  goal_date: string | null;
  start_date: string;
  modality: string;
  email: string | null;
  phone: string | null;
  home_address: string | null;
  gym_name: string | null;
}

export interface MeasurementRow {
  measured_on: string;
  weight_kg: number;
  waist_cm: number | null;
  hip_cm: number | null;
  neck_cm: number | null;
  body_fat_pct: number | null;
}

export interface SessionRow {
  id: string;
  starts_at: string;
  ends_at: string;
  location: "gym" | "casa";
  status: string;
}

export async function getStudent(db: D1Database, studentId: string) {
  return db
    .prepare(
      `SELECT id, full_name, birth_date, sex, height_cm, goal_type, goal_text, goal_date, start_date, modality,
              email, phone, home_address, gym_name
         FROM students WHERE id = ?1`,
    )
    .bind(studentId)
    .first<StudentBasics>();
}

export async function getMeasurements(db: D1Database, studentId: string) {
  const r = await db
    .prepare(
      `SELECT measured_on, weight_kg, waist_cm, hip_cm, neck_cm, body_fat_pct
         FROM measurements WHERE student_id = ?1 ORDER BY measured_on ASC`,
    )
    .bind(studentId)
    .all<MeasurementRow>();
  return r.results;
}

export async function getSessions(db: D1Database, studentId: string, fromIso: string) {
  const r = await db
    .prepare(
      `SELECT id, starts_at, ends_at, location, status
         FROM training_sessions
        WHERE student_id = ?1 AND ends_at >= ?2 AND status IN ('solicitada', 'confirmada')
        ORDER BY starts_at ASC LIMIT 20`,
    )
    .bind(studentId, fromIso)
    .all<SessionRow>();
  return r.results;
}

export async function getWeekCheckin(db: D1Database, studentId: string, now = new Date()) {
  const week = mondayOf(bogotaParts(now).date);
  const row = await db
    .prepare(`SELECT id, energy, sleep_quality, sessions_done, sessions_planned FROM weekly_checkins WHERE student_id = ?1 AND week_start = ?2`)
    .bind(studentId, week)
    .first<{ id: string; energy: number; sleep_quality: number; sessions_done: number; sessions_planned: number }>();
  return { week, done: Boolean(row), row };
}

export async function getRecentCheckins(db: D1Database, studentId: string, limit = 8) {
  const r = await db
    .prepare(
      `SELECT week_start, sessions_done, sessions_planned, nutrition_adherence, energy, sleep_quality
         FROM weekly_checkins WHERE student_id = ?1 ORDER BY week_start DESC LIMIT ?2`,
    )
    .bind(studentId, limit)
    .all<{ week_start: string; sessions_done: number; sessions_planned: number; nutrition_adherence: number; energy: number; sleep_quality: number }>();
  return r.results;
}

export async function getPhotoStatus(db: D1Database, studentId: string, now = new Date()) {
  const month = bogotaParts(now).date.slice(0, 7);
  const [consent, photos] = await Promise.all([
    db
      .prepare(`SELECT 1 AS ok FROM consents WHERE student_id = ?1 AND kind = 'fotos_progreso' AND revoked_at IS NULL LIMIT 1`)
      .bind(studentId)
      .first<{ ok: number }>(),
    db
      .prepare(`SELECT COUNT(*) AS n FROM progress_photos WHERE student_id = ?1 AND period_month = ?2`)
      .bind(studentId, month)
      .first<{ n: number }>(),
  ]);
  return { month, consent: Boolean(consent), count: photos?.n ?? 0 };
}

export async function getConsents(db: D1Database, studentId: string) {
  const r = await db
    .prepare(`SELECT kind, text_version, accepted_at, revoked_at FROM consents WHERE student_id = ?1 ORDER BY accepted_at DESC`)
    .bind(studentId)
    .all<{ kind: string; text_version: string; accepted_at: string; revoked_at: string | null }>();
  return r.results;
}

export function nextMeasurementDue(lastMeasuredOn: string | undefined, intervalDays = 28): string | null {
  return lastMeasuredOn ? addDays(lastMeasuredOn, intervalDays) : null;
}

export const GOAL_LABEL: Record<string, string> = {
  perder_grasa: "Bajar grasa",
  ganar_musculo: "Ganar músculo",
  fuerza: "Ganar fuerza",
  salud_general: "Mejorar mi salud",
  rendimiento: "Rendimiento deportivo",
  rehabilitacion_post_alta: "Volver a entrenar después de una lesión",
};
