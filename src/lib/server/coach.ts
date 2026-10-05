/**
 * Coach-only queries. Every API route that uses these must check locals.user.role === "coach" first.
 */
import { addDays, bogotaParts } from "@/lib/schedule";

export interface StudentListRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  modality: string;
  status: string;
  goal_type: string;
  start_date: string;
  last_measure: string | null;
  last_checkin: string | null;
  parq: number | null;
  clearance: string | null;
  severe_allergy: number;
  has_workout: number;
  has_meals: number;
}

export async function listStudents(db: D1Database) {
  const r = await db
    .prepare(
      `SELECT s.id, s.full_name, s.email, s.phone, s.modality, s.status, s.goal_type, s.start_date,
              (SELECT MAX(measured_on) FROM measurements m WHERE m.student_id = s.id) AS last_measure,
              (SELECT MAX(week_start) FROM weekly_checkins c WHERE c.student_id = s.id) AS last_checkin,
              h.requires_medical_clearance AS parq, h.medical_clearance_key AS clearance,
              (SELECT COUNT(*) FROM dietary_restrictions d WHERE d.student_id = s.id AND d.type = 'alergia' AND d.severity = 'grave') AS severe_allergy,
              (SELECT COUNT(*) FROM workout_plans w WHERE w.student_id = s.id AND w.status = 'publicado') AS has_workout,
              (SELECT COUNT(*) FROM meal_plans p WHERE p.student_id = s.id AND p.status IN ('publicado','aprobado')) AS has_meals
         FROM students s LEFT JOIN health_screening h ON h.student_id = s.id
        ORDER BY s.status = 'activo' DESC, s.full_name`,
    )
    .all<StudentListRow>();
  return r.results;
}

export function alertsFor(s: StudentListRow, today = bogotaParts(new Date()).date): string[] {
  if (s.status !== "activo") return [];
  const a: string[] = [];
  if (!s.last_checkin || s.last_checkin < addDays(today, -10)) a.push("Sin check-in en 10+ días");
  if (!s.last_measure || addDays(s.last_measure, 28) <= today) a.push("Medición vencida");
  if (s.parq && !s.clearance) a.push("PAR-Q con sí, sin autorización");
  if (!s.has_workout) a.push("Sin rutina");
  if (!s.has_meals) a.push("Sin plan de alimentación");
  return a;
}

export const MODALITY_LABEL: Record<string, string> = { casa: "En casa", gym: "Gimnasio", online: "Online", mixto: "Mixto" };
export const STATUS_LABEL: Record<string, string> = { activo: "Activo", pausado: "Pausado", finalizado: "Finalizado" };

/** Temporary password the coach hands to a new student (must be changed on first login). */
export function tempPassword(): string {
  const words = ["Pesa", "Barra", "Serie", "Fuerza", "Ritmo", "Meta", "Sprint", "Core"];
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const w = words[bytes[0]! % words.length];
  const n = ((bytes[1]! << 16) | (bytes[2]! << 8) | bytes[3]!) % 100000;
  return `${w}-${String(n).padStart(5, "0")}`;
}
