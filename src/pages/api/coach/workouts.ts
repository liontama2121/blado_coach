import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { z } from "zod";
import { bogotaParts } from "@/lib/schedule";
import { fieldErrors } from "@/lib/validation/lead";

export const prerender = false;

const item = z.object({
  exercise_id: z.string().min(1).max(64),
  sets: z.coerce.number().int().min(1, "Series de 1 a 10.").max(10, "Series de 1 a 10."),
  reps: z.string().trim().min(1, "Escribe las repeticiones.").max(30),
  load_kg: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().min(0).max(500).optional()),
  rest_s: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().min(0).max(600).optional()),
  rir: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().min(0).max(6).optional()),
  notes: z.string().trim().max(200).optional(),
});
const schema = z.object({
  student_id: z.string().min(1).max(64),
  name: z.string().trim().min(2, "Ponle un nombre a la rutina.").max(80),
  notes: z.string().trim().max(400).optional(),
  days: z
    .array(
      z.object({
        weekday: z.coerce.number().int().min(0).max(6),
        title: z.string().trim().min(2, "Ponle título al día.").max(60),
        location: z.enum(["casa", "gym"]),
        items: z.array(item).min(1, "Cada día necesita al menos un ejercicio.").max(20),
      }),
    )
    .min(1, "Agrega al menos un día de entreno.")
    .max(7)
    .refine((d) => new Set(d.map((x) => x.weekday)).size === d.length, "Hay días repetidos."),
});

/** Coach publishes a routine: a new plan replaces (archives) the previous published one. */
export const POST: APIRoute = async ({ request, locals }) => {
  if (locals.user?.role !== "coach") return Response.json({ ok: false, errors: { form: "No autorizado." } }, { status: 403 });
  const p = schema.safeParse(await request.json().catch(() => ({})));
  if (!p.success) return Response.json({ ok: false, errors: fieldErrors(p.error) }, { status: 422 });
  const d = p.data;
  const db = env.DB;
  const exists = await db.prepare(`SELECT 1 FROM students WHERE id = ?1`).bind(d.student_id).first();
  if (!exists) return Response.json({ ok: false, errors: { form: "Estudiante no encontrado." } }, { status: 404 });

  const planId = crypto.randomUUID();
  const stmts = [
    db.prepare(`UPDATE workout_plans SET status = 'archivado' WHERE student_id = ?1 AND status = 'publicado'`).bind(d.student_id),
    db
      .prepare(`INSERT INTO workout_plans (id, student_id, name, status, starts_on, notes) VALUES (?1, ?2, ?3, 'publicado', ?4, ?5)`)
      .bind(planId, d.student_id, d.name, bogotaParts(new Date()).date, d.notes || null),
  ];
  for (const day of d.days) {
    const dayId = crypto.randomUUID();
    stmts.push(db.prepare(`INSERT INTO workout_days (id, plan_id, weekday, title, location) VALUES (?1, ?2, ?3, ?4, ?5)`).bind(dayId, planId, day.weekday, day.title, day.location));
    day.items.forEach((it, i) =>
      stmts.push(
        db
          .prepare(`INSERT INTO workout_items (id, day_id, exercise_id, position, sets, reps, load_kg, rest_s, rir, notes) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)`)
          .bind(crypto.randomUUID(), dayId, it.exercise_id, i + 1, it.sets, it.reps, it.load_kg ?? null, it.rest_s ?? null, it.rir ?? null, it.notes || null),
      ),
    );
  }
  await db.batch(stmts);
  return Response.json({ ok: true, id: planId });
};
