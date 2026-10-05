import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { z } from "zod";
import { bogotaParts } from "@/lib/schedule";

export const prerender = false;

const schema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("workout"), id: z.string().min(1).max(64), status: z.enum(["hecho", "parcial"]) }),
  z.object({ kind: z.literal("meal"), id: z.string().min(1).max(64), status: z.enum(["cumpli", "parcial", "no"]) }),
]);

/**
 * Student marks today's workout or a meal. Ownership is checked in SQL:
 * the day/meal must belong to a published plan of the student in the session.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || user.role !== "student" || !user.studentId) return Response.json({ ok: false }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ ok: false, error: "Datos inválidos." }, { status: 422 });
  const today = bogotaParts(new Date()).date;
  const d = parsed.data;

  if (d.kind === "workout") {
    const own = await env.DB.prepare(
      `SELECT 1 AS ok FROM workout_days wd JOIN workout_plans p ON p.id = wd.plan_id
        WHERE wd.id = ?1 AND p.student_id = ?2 AND p.status = 'publicado'`,
    )
      .bind(d.id, user.studentId)
      .first();
    if (!own) return Response.json({ ok: false, error: "No encontrado." }, { status: 404 });
    await env.DB.prepare(
      `INSERT INTO workout_day_logs (id, student_id, day_id, done_on, status) VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(student_id, day_id, done_on) DO UPDATE SET status = excluded.status`,
    )
      .bind(crypto.randomUUID(), user.studentId, d.id, today, d.status)
      .run();
  } else {
    const own = await env.DB.prepare(
      `SELECT 1 AS ok FROM meal_plan_meals m JOIN meal_plans p ON p.id = m.plan_id
        WHERE m.id = ?1 AND p.student_id = ?2 AND p.status IN ('publicado','aprobado')`,
    )
      .bind(d.id, user.studentId)
      .first();
    if (!own) return Response.json({ ok: false, error: "No encontrado." }, { status: 404 });
    await env.DB.prepare(
      `INSERT INTO meal_logs (id, student_id, meal_id, logged_on, status) VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(student_id, meal_id, logged_on) DO UPDATE SET status = excluded.status`,
    )
      .bind(crypto.randomUUID(), user.studentId, d.id, today, d.status)
      .run();
  }
  return Response.json({ ok: true });
};
