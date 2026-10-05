import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { z } from "zod";
import { PROPOSAL_ERROR, checkProposal } from "@/lib/sessions";

export const prerender = false;

const propose = z.object({
  action: z.literal("proponer"),
  date: z.string(),
  time: z.string(),
  minutes: z.coerce.number().int(),
  location: z.enum(["gym", "casa"]),
  note: z.string().trim().max(300).optional(),
});
const respond = z.object({
  action: z.enum(["aceptar_cambio", "rechazar_cambio", "cancelar"]),
  id: z.string().min(1).max(64),
});
const schema = z.union([propose, respond]);

const busyIntervals = async (excludeId?: string) =>
  (
    await env.DB.prepare(`SELECT starts_at, ends_at FROM training_sessions WHERE status = 'confirmada' AND ends_at > ?1 AND id <> ?2`)
      .bind(new Date().toISOString(), excludeId ?? "")
      .all<{ starts_at: string; ends_at: string }>()
  ).results;

/**
 * Student side of session scheduling. studentId always from the session.
 * - proponer: any day/time inside opening hours, gym (in person) or casa (Google Meet)
 * - aceptar_cambio / rechazar_cambio: answer the coach's counter-proposal
 * - cancelar: cancel an upcoming session
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || user.role !== "student" || !user.studentId) return Response.json({ ok: false, error: "No autorizado." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ ok: false, error: "Datos inválidos." }, { status: 422 });
  const d = parsed.data;

  if (d.action === "proponer") {
    const r = checkProposal({ date: d.date, time: d.time, minutes: d.minutes }, await busyIntervals(), new Date());
    if (!r.ok) return Response.json({ ok: false, error: PROPOSAL_ERROR[r.error] }, { status: 409 });
    await env.DB.prepare(
      `INSERT INTO training_sessions (id, student_id, starts_at, ends_at, location, status, requested_by, note_student)
       VALUES (?1, ?2, ?3, ?4, ?5, 'solicitada', ?6, ?7)`,
    )
      .bind(crypto.randomUUID(), user.studentId, r.starts_at, r.ends_at, d.location, user.id, d.note || null)
      .run();
    return Response.json({ ok: true });
  }

  const s = await env.DB.prepare(
    `SELECT id, status, counter_starts_at, counter_ends_at FROM training_sessions WHERE id = ?1 AND student_id = ?2`,
  )
    .bind(d.id, user.studentId)
    .first<{ id: string; status: string; counter_starts_at: string | null; counter_ends_at: string | null }>();
  if (!s) return Response.json({ ok: false, error: "No encontrado." }, { status: 404 });

  if (d.action === "cancelar") {
    if (!["solicitada", "confirmada"].includes(s.status)) return Response.json({ ok: false, error: "Esta sesión ya no se puede cancelar." }, { status: 409 });
    await env.DB.prepare(`UPDATE training_sessions SET status = 'cancelada', decided_at = ?2 WHERE id = ?1`).bind(s.id, new Date().toISOString()).run();
    return Response.json({ ok: true });
  }

  if (!s.counter_starts_at || !s.counter_ends_at || s.status !== "solicitada")
    return Response.json({ ok: false, error: "No hay un cambio pendiente." }, { status: 409 });

  if (d.action === "rechazar_cambio") {
    await env.DB.prepare(
      `UPDATE training_sessions SET status = 'rechazada', counter_starts_at = NULL, counter_ends_at = NULL, decided_at = ?2 WHERE id = ?1`,
    )
      .bind(s.id, new Date().toISOString())
      .run();
    return Response.json({ ok: true });
  }

  // aceptar_cambio: the new time must still be free.
  const clash = (await busyIntervals(s.id)).some((b) => b.starts_at < s.counter_ends_at! && b.ends_at > s.counter_starts_at!);
  if (clash) return Response.json({ ok: false, error: "Ese horario ya se ocupó. Pídele otro al coach." }, { status: 409 });
  await env.DB.prepare(
    `UPDATE training_sessions SET starts_at = counter_starts_at, ends_at = counter_ends_at,
            counter_starts_at = NULL, counter_ends_at = NULL, status = 'confirmada', decided_at = ?2 WHERE id = ?1`,
  )
    .bind(s.id, new Date().toISOString())
    .run();
  return Response.json({ ok: true });
};
