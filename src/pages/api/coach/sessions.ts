import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { z } from "zod";

export const prerender = false;

const schema = z.object({ id: z.string().min(1).max(64), action: z.enum(["confirmar", "rechazar"]) });

/** Coach approves or rejects a requested session. */
export const POST: APIRoute = async ({ request, locals }) => {
  if (locals.user?.role !== "coach") return new Response(null, { status: 403 });
  const parsed = schema.safeParse(Object.fromEntries(await request.formData()));
  if (!parsed.success) return new Response(null, { status: 422 });
  const status = parsed.data.action === "confirmar" ? "confirmada" : "rechazada";
  await env.DB.prepare(`UPDATE training_sessions SET status = ?2, decided_at = ?3 WHERE id = ?1 AND status = 'solicitada'`)
    .bind(parsed.data.id, status, new Date().toISOString())
    .run();
  return new Response(null, { status: 303, headers: { location: "/coach" } });
};
