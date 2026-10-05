import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { tempPassword } from "@/lib/server/coach";
import { fieldErrors } from "@/lib/validation/lead";
import { createStudentSchema, datosSchema, medicionSchema, objetivoSchema, restriccionSchema, saludSchema } from "@/lib/validation/student";

export const prerender = false;

const TEXT_VERSION = "2026-10-v1";
const ok = (data: Record<string, unknown> = {}) => Response.json({ ok: true, ...data });
const bad = (status: number, errors: Record<string, string>) => Response.json({ ok: false, errors }, { status });

/**
 * Coach-only student management.
 *  POST {op:"crear", ...}                   create user + student + health + restrictions + 1st measurement + consents
 *  POST {op:"datos"|"objetivo"|"salud", id, data}  update a section
 *  POST {op:"estado", id, status}           activo | pausado | finalizado (soft delete keeps history)
 *  POST {op:"clave", id}                    reset to a new temporary password
 *  POST {op:"restriccion", id, data} / {op:"quitar_restriccion", id, restriction_id}
 *  POST {op:"medicion", id, data}
 *  POST {op:"eliminar", id, confirm}        hard delete (habeas data); confirm must equal the full name
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const coach = locals.user;
  if (coach?.role !== "coach") return bad(403, { form: "No autorizado." });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body.op !== "string") return bad(400, { form: "Petición inválida." });
  const db = env.DB;
  const now = new Date().toISOString();

  if (body.op === "crear") {
    const p = createStudentSchema.safeParse(body);
    if (!p.success) return bad(422, fieldErrors(p.error));
    const { datos, objetivo, salud, restricciones, medicion, consentimientos } = p.data;
    const exists = await db.prepare(`SELECT 1 FROM users WHERE email = ?1`).bind(datos.email).first();
    if (exists) return bad(409, { email: "Ya hay una cuenta con ese correo." });

    const userId = crypto.randomUUID();
    const studentId = crypto.randomUUID();
    const temp = tempPassword();
    const stmts = [
      db.prepare(`INSERT INTO users (id, email, password_hash, role, must_change_password) VALUES (?1, ?2, ?3, 'student', 1)`).bind(userId, datos.email, await hashPassword(temp)),
      db
        .prepare(
          `INSERT INTO students (id, user_id, full_name, birth_date, sex, phone, email, occupation, emergency_name, emergency_phone, start_date, modality, height_cm,
             gym_name, gym_address, goal_type, goal_text, goal_date, experience_level, days_per_week, minutes_per_session, home_equipment,
             sleep_hours, stress_level, water_liters, daily_steps, alcohol_frequency, smoker, meals_per_day)
           VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23,?24,?25,?26,?27,?28,?29)`,
        )
        .bind(
          studentId, userId, datos.full_name, datos.birth_date, datos.sex, datos.phone ?? null, datos.email, datos.occupation ?? null,
          datos.emergency_name ?? null, datos.emergency_phone ?? null, datos.start_date, datos.modality, datos.height_cm,
          datos.gym_name ?? null, datos.gym_address ?? null, objetivo.goal_type, objetivo.goal_text ?? null, objetivo.goal_date ?? null,
          objetivo.experience_level ?? null, objetivo.days_per_week ?? null, objetivo.minutes_per_session ?? null, JSON.stringify(objetivo.home_equipment),
          objetivo.sleep_hours ?? null, objetivo.stress_level ?? null, objetivo.water_liters ?? null, objetivo.daily_steps ?? null,
          objetivo.alcohol_frequency ?? null, objetivo.smoker ?? null, objetivo.meals_per_day ?? null,
        ),
      db
        .prepare(
          `INSERT INTO health_screening (student_id, parq_q1, parq_q2, parq_q3, parq_q4, parq_q5, parq_q6, parq_q7, injuries, surgeries, conditions, medications)
           VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)`,
        )
        .bind(studentId, ...salud.parq, salud.injuries ?? null, salud.surgeries ?? null, salud.conditions ?? null, salud.medications ?? null),
      ...restricciones.map((r) =>
        db
          .prepare(
            `INSERT INTO dietary_restrictions (id, student_id, type, allergen, restriction_tag, food_id, severity, requires_nutritionist, note) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)`,
          )
          .bind(crypto.randomUUID(), studentId, r.type, r.allergen ?? null, r.restriction_tag ?? null, r.food_id ?? null, r.severity ?? null, r.requires_nutritionist, r.note ?? null),
      ),
      ...(["datos_personales", "datos_salud", ...(consentimientos.fotos_progreso ? ["fotos_progreso"] : [])] as const).map((k) =>
        db.prepare(`INSERT INTO consents (id, student_id, kind, text_version, accepted_by_user_id) VALUES (?1, ?2, ?3, ?4, ?5)`).bind(crypto.randomUUID(), studentId, k, TEXT_VERSION, coach.id),
      ),
    ];
    if (medicion) stmts.push(insertMeasurement(db, studentId, medicion, coach.id));
    await db.batch(stmts);
    return ok({ id: studentId, email: datos.email, tempPassword: temp });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const student = await db.prepare(`SELECT id, user_id, full_name FROM students WHERE id = ?1`).bind(id).first<{ id: string; user_id: string | null; full_name: string }>();
  if (!student) return bad(404, { form: "Estudiante no encontrado." });

  switch (body.op) {
    case "datos": {
      const p = datosSchema.safeParse(body.data);
      if (!p.success) return bad(422, fieldErrors(p.error));
      const d = p.data;
      const clash = await db.prepare(`SELECT 1 FROM users WHERE email = ?1 AND id <> ?2`).bind(d.email, student.user_id ?? "").first();
      if (clash) return bad(409, { email: "Ese correo ya lo usa otra cuenta." });
      await db.batch([
        db
          .prepare(
            `UPDATE students SET full_name=?2, birth_date=?3, sex=?4, phone=?5, email=?6, occupation=?7, emergency_name=?8, emergency_phone=?9,
               start_date=?10, modality=?11, height_cm=?12, gym_name=?13, gym_address=?14, updated_at=?15 WHERE id=?1`,
          )
          .bind(id, d.full_name, d.birth_date, d.sex, d.phone ?? null, d.email, d.occupation ?? null, d.emergency_name ?? null, d.emergency_phone ?? null, d.start_date, d.modality, d.height_cm, d.gym_name ?? null, d.gym_address ?? null, now),
        db.prepare(`UPDATE users SET email = ?2 WHERE id = ?1`).bind(student.user_id ?? "", d.email),
      ]);
      return ok();
    }
    case "objetivo": {
      const p = objetivoSchema.safeParse(body.data);
      if (!p.success) return bad(422, fieldErrors(p.error));
      const o = p.data;
      await db
        .prepare(
          `UPDATE students SET goal_type=?2, goal_text=?3, goal_date=?4, experience_level=?5, days_per_week=?6, minutes_per_session=?7, home_equipment=?8,
             sleep_hours=?9, stress_level=?10, water_liters=?11, daily_steps=?12, alcohol_frequency=?13, smoker=?14, meals_per_day=?15, updated_at=?16 WHERE id=?1`,
        )
        .bind(id, o.goal_type, o.goal_text ?? null, o.goal_date ?? null, o.experience_level ?? null, o.days_per_week ?? null, o.minutes_per_session ?? null, JSON.stringify(o.home_equipment), o.sleep_hours ?? null, o.stress_level ?? null, o.water_liters ?? null, o.daily_steps ?? null, o.alcohol_frequency ?? null, o.smoker ?? null, o.meals_per_day ?? null, now)
        .run();
      return ok();
    }
    case "salud": {
      const p = saludSchema.safeParse(body.data);
      if (!p.success) return bad(422, fieldErrors(p.error));
      const s = p.data;
      await db
        .prepare(
          `INSERT INTO health_screening (student_id, parq_q1, parq_q2, parq_q3, parq_q4, parq_q5, parq_q6, parq_q7, injuries, surgeries, conditions, medications, updated_at)
           VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)
           ON CONFLICT(student_id) DO UPDATE SET parq_q1=excluded.parq_q1, parq_q2=excluded.parq_q2, parq_q3=excluded.parq_q3, parq_q4=excluded.parq_q4,
             parq_q5=excluded.parq_q5, parq_q6=excluded.parq_q6, parq_q7=excluded.parq_q7, injuries=excluded.injuries, surgeries=excluded.surgeries,
             conditions=excluded.conditions, medications=excluded.medications, updated_at=excluded.updated_at`,
        )
        .bind(id, ...s.parq, s.injuries ?? null, s.surgeries ?? null, s.conditions ?? null, s.medications ?? null, now)
        .run();
      return ok();
    }
    case "estado": {
      const st = z.enum(["activo", "pausado", "finalizado"]).safeParse(body.status);
      if (!st.success) return bad(422, { form: "Estado inválido." });
      await db.batch([
        db.prepare(`UPDATE students SET status = ?2, updated_at = ?3 WHERE id = ?1`).bind(id, st.data, now),
        // A finished student can no longer sign in.
        db.prepare(`UPDATE users SET disabled = ?2 WHERE id = ?1`).bind(student.user_id ?? "", st.data === "finalizado" ? 1 : 0),
        ...(st.data === "finalizado" ? [db.prepare(`DELETE FROM auth_sessions WHERE user_id = ?1`).bind(student.user_id ?? "")] : []),
      ]);
      return ok();
    }
    case "clave": {
      if (!student.user_id) return bad(409, { form: "Este estudiante no tiene cuenta." });
      const temp = tempPassword();
      await db.batch([
        db.prepare(`UPDATE users SET password_hash = ?2, must_change_password = 1 WHERE id = ?1`).bind(student.user_id, await hashPassword(temp)),
        db.prepare(`DELETE FROM auth_sessions WHERE user_id = ?1`).bind(student.user_id),
      ]);
      return ok({ tempPassword: temp });
    }
    case "restriccion": {
      const p = restriccionSchema.safeParse(body.data);
      if (!p.success) return bad(422, fieldErrors(p.error));
      const r = p.data;
      // The DB trigger re-validates published plans and unpublishes any that become unsafe.
      await db
        .prepare(`INSERT INTO dietary_restrictions (id, student_id, type, allergen, restriction_tag, food_id, severity, requires_nutritionist, note) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)`)
        .bind(crypto.randomUUID(), id, r.type, r.allergen ?? null, r.restriction_tag ?? null, r.food_id ?? null, r.severity ?? null, r.requires_nutritionist, r.note ?? null)
        .run();
      const unpublished = await db.prepare(`SELECT COUNT(*) AS n FROM meal_plans WHERE student_id = ?1 AND change_reason LIKE 'Revalidación%' AND status = 'borrador'`).bind(id).first<{ n: number }>();
      return ok({ planUnpublished: (unpublished?.n ?? 0) > 0 });
    }
    case "quitar_restriccion": {
      await db.prepare(`DELETE FROM dietary_restrictions WHERE id = ?1 AND student_id = ?2`).bind(String(body.restriction_id ?? ""), id).run();
      return ok();
    }
    case "medicion": {
      const p = medicionSchema.safeParse(body.data);
      if (!p.success) return bad(422, fieldErrors(p.error));
      await insertMeasurement(db, id, p.data, coach.id).run();
      return ok();
    }
    case "eliminar": {
      if (body.confirm !== student.full_name) return bad(422, { confirm: "Escribe el nombre completo exactamente para confirmar." });
      // TODO Fase 5: also delete the student's R2 objects (photos, medical files).
      await db.batch([
        db.prepare(`DELETE FROM students WHERE id = ?1`).bind(id),
        db.prepare(`DELETE FROM users WHERE id = ?1`).bind(student.user_id ?? ""),
      ]);
      return ok();
    }
  }
  return bad(400, { form: "Operación desconocida." });
};

function insertMeasurement(db: D1Database, studentId: string, m: z.infer<typeof medicionSchema>, by: string) {
  return db
    .prepare(
      `INSERT INTO measurements (id, student_id, measured_on, weight_kg, neck_cm, waist_cm, hip_cm, chest_cm, arm_relaxed_r_cm, thigh_r_cm, body_fat_pct, body_fat_method, resting_hr, coach_notes, created_by)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15)`,
    )
    .bind(
      crypto.randomUUID(), studentId, m.measured_on, m.weight_kg, m.neck_cm ?? null, m.waist_cm ?? null, m.hip_cm ?? null, m.chest_cm ?? null,
      m.arm_relaxed_r_cm ?? null, m.thigh_r_cm ?? null, m.body_fat_pct ?? null, m.body_fat_method ?? null, m.resting_hr ?? null, m.coach_notes ?? null, by,
    );
}
