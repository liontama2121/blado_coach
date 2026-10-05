import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { z } from "zod";
import { localToUtcMs } from "@/lib/schedule";
import { loadWeek } from "@/lib/server/agenda";

export const prerender = false;

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start: z.coerce.number().int().min(0).max(1439),
  location: z.enum(["gym", "casa"]),
  note: z.string().trim().max(300).optional(),
});

/** Student requests a session in a free slot. The coach approves it later. */
export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || user.role !== "student" || !user.studentId) return Response.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ ok: false, error: "Datos inválidos." }, { status: 422 });
  const { date, start, location, note } = parsed.data;

  // Re-check against the live agenda server-side: the slot must still be free and allow that location.
  const { days } = await loadWeek(env.DB);
  const slot = days.find((d) => d.date === date)?.slots.find((s) => s.start === start);
  if (!slot || slot.state !== "free") return Response.json({ ok: false, error: "Ese horario ya no está libre. Elige otro." }, { status: 409 });
  if (slot.location !== "ambos" && slot.location !== location)
    return Response.json({ ok: false, error: `Ese horario es solo ${slot.location === "gym" ? "en gimnasio" : "en casa"}.` }, { status: 409 });

  // studentId comes from the session, never from the body.
  const student = await env.DB.prepare(`SELECT home_address FROM students WHERE id = ?1`).bind(user.studentId).first<{ home_address: string | null }>();
  if (location === "casa" && !student?.home_address)
    return Response.json({ ok: false, error: "No tenemos tu dirección. Pídele al coach que la agregue." }, { status: 409 });

  const buffer = location === "casa" ? Number(env.TRAVEL_BUFFER_MIN ?? 30) || 30 : 0;
  const startsAt = new Date(localToUtcMs(date, start)).toISOString();
  const endsAt = new Date(localToUtcMs(date, slot.end)).toISOString();
  await env.DB.prepare(
    `INSERT INTO training_sessions (id, student_id, starts_at, ends_at, location, travel_before_min, travel_after_min, status, requested_by, note_student)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6, 'solicitada', ?7, ?8)`,
  )
    .bind(crypto.randomUUID(), user.studentId, startsAt, endsAt, location, buffer, user.id, note ?? null)
    .run();

  return Response.json({ ok: true });
};
