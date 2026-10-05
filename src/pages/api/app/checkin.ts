import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { bogotaParts, mondayOf } from "@/lib/schedule";
import { checkinSchema } from "@/lib/validation/checkin";
import { fieldErrors } from "@/lib/validation/lead";

export const prerender = false;

/** Weekly check-in. One per student per week (upsert). studentId comes from the session only. */
export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || user.role !== "student" || !user.studentId) return Response.json({ ok: false, errors: { form: "No autorizado." } }, { status: 401 });

  const parsed = checkinSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ ok: false, errors: fieldErrors(parsed.error) }, { status: 422 });
  const d = parsed.data;
  const week = mondayOf(bogotaParts(new Date()).date);

  await env.DB.prepare(
    `INSERT INTO weekly_checkins (id, student_id, week_start, weight_kg, sessions_done, sessions_planned, nutrition_adherence, energy, sleep_quality, stress, hunger, soreness, comment)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
     ON CONFLICT(student_id, week_start) DO UPDATE SET
       weight_kg = excluded.weight_kg, sessions_done = excluded.sessions_done, sessions_planned = excluded.sessions_planned,
       nutrition_adherence = excluded.nutrition_adherence, energy = excluded.energy, sleep_quality = excluded.sleep_quality,
       stress = excluded.stress, hunger = excluded.hunger, soreness = excluded.soreness, comment = excluded.comment`,
  )
    .bind(
      crypto.randomUUID(),
      user.studentId,
      week,
      d.weight_kg,
      d.sessions_done,
      d.sessions_planned,
      d.nutrition_adherence,
      d.energy,
      d.sleep_quality,
      d.stress,
      d.hunger,
      d.soreness || null,
      d.comment || null,
    )
    .run();
  return Response.json({ ok: true });
};
