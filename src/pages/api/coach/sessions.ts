import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { z } from "zod";
import { PROPOSAL_ERROR, checkProposal, isMeetUrl } from "@/lib/sessions";

export const prerender = false;

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("confirmar"), id: z.string().min(1).max(64), meet_url: z.string().trim().max(200).optional() }),
  z.object({ action: z.literal("rechazar"), id: z.string().min(1).max(64), note: z.string().trim().max(300).optional() }),
  z.object({ action: z.literal("cancelar"), id: z.string().min(1).max(64) }),
  z.object({ action: z.literal("completada"), id: z.string().min(1).max(64) }),
  z.object({ action: z.literal("no_asistio"), id: z.string().min(1).max(64) }),
  z.object({
    action: z.literal("proponer"),
    id: z.string().min(1).max(64),
    date: z.string(),
    time: z.string(),
    minutes: z.coerce.number().int(),
    note: z.string().trim().max(300).optional(),
    meet_url: z.string().trim().max(200).optional(),
  }),
]);

/** Coach side: confirm (Meet link required for virtual sessions), reject, counter-propose, close out. */
export const POST: APIRoute = async ({ request, locals }) => {
  if (locals.user?.role !== "coach") return Response.json({ ok: false, error: "No autorizado." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ ok: false, error: "Datos inválidos." }, { status: 422 });
  const d = parsed.data;
  const now = new Date().toISOString();

  const s = await env.DB.prepare(`SELECT id, status, location, starts_at, ends_at FROM training_sessions WHERE id = ?1`)
    .bind(d.id)
    .first<{ id: string; status: string; location: "gym" | "casa"; starts_at: string; ends_at: string }>();
  if (!s) return Response.json({ ok: false, error: "Sesión no encontrada." }, { status: 404 });

  const meet = "meet_url" in d && d.meet_url ? d.meet_url : null;
  if (meet && !isMeetUrl(meet)) return Response.json({ ok: false, error: "Pega un enlace de Google Meet válido (https://meet.google.com/...)." }, { status: 422 });

  switch (d.action) {
    case "confirmar": {
      if (s.status !== "solicitada") return Response.json({ ok: false, error: "Esta sesión ya fue respondida." }, { status: 409 });
      if (s.location === "casa" && !meet) return Response.json({ ok: false, error: "Las sesiones en casa son virtuales: agrega el enlace de Meet." }, { status: 422 });
      const clash = await env.DB.prepare(
        `SELECT 1 FROM training_sessions WHERE status = 'confirmada' AND id <> ?1 AND julianday(starts_at) < julianday(?3) AND julianday(ends_at) > julianday(?2) LIMIT 1`,
      )
        .bind(s.id, s.starts_at, s.ends_at)
        .first();
      if (clash) return Response.json({ ok: false, error: "Ya tienes otra sesión confirmada a esa hora." }, { status: 409 });
      await env.DB.prepare(`UPDATE training_sessions SET status = 'confirmada', meet_url = ?2, decided_at = ?3, counter_starts_at = NULL, counter_ends_at = NULL WHERE id = ?1`)
        .bind(s.id, meet, now)
        .run();
      break;
    }
    case "rechazar":
      await env.DB.prepare(`UPDATE training_sessions SET status = 'rechazada', note_coach = ?2, decided_at = ?3 WHERE id = ?1 AND status = 'solicitada'`)
        .bind(s.id, d.note || null, now)
        .run();
      break;
    case "cancelar":
      await env.DB.prepare(`UPDATE training_sessions SET status = 'cancelada', decided_at = ?2 WHERE id = ?1 AND status IN ('solicitada','confirmada')`)
        .bind(s.id, now)
        .run();
      break;
    case "completada":
    case "no_asistio":
      await env.DB.prepare(`UPDATE training_sessions SET status = ?2 WHERE id = ?1 AND status = 'confirmada'`).bind(s.id, d.action).run();
      break;
    case "proponer": {
      const busy = (
        await env.DB.prepare(`SELECT starts_at, ends_at FROM training_sessions WHERE status = 'confirmada' AND id <> ?1 AND ends_at > ?2`)
          .bind(s.id, now)
          .all<{ starts_at: string; ends_at: string }>()
      ).results;
      const r = checkProposal({ date: d.date, time: d.time, minutes: d.minutes }, busy, new Date());
      if (!r.ok) return Response.json({ ok: false, error: PROPOSAL_ERROR[r.error] }, { status: 409 });
      await env.DB.prepare(
        `UPDATE training_sessions SET counter_starts_at = ?2, counter_ends_at = ?3, counter_note = ?4, meet_url = COALESCE(?5, meet_url) WHERE id = ?1 AND status = 'solicitada'`,
      )
        .bind(s.id, r.starts_at, r.ends_at, d.note || null, meet)
        .run();
      break;
    }
  }
  return Response.json({ ok: true });
};
