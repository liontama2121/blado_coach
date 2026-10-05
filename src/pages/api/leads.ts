import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { fieldErrors, leadSchema } from "@/lib/validation/lead";
import { hashKey, hit } from "@/lib/server/rate-limit";

export const prerender = false;

const wantsJson = (req: Request) => (req.headers.get("accept") ?? "").includes("application/json");

function reply(req: Request, status: number, body: Record<string, unknown>, redirectTo: string) {
  if (wantsJson(req)) return Response.json(body, { status });
  // No-JS fallback: plain form POST gets a redirect.
  return new Response(null, { status: 303, headers: { location: redirectTo } });
}

export const POST: APIRoute = async ({ request }) => {
  let raw: Record<string, unknown>;
  try {
    const ct = request.headers.get("content-type") ?? "";
    raw = ct.includes("application/json")
      ? ((await request.json()) as Record<string, unknown>)
      : Object.fromEntries(await request.formData());
  } catch {
    return reply(request, 400, { ok: false, errors: { form: "No pudimos leer el formulario. Intenta de nuevo." } }, "/#contacto");
  }

  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    // A filled honeypot is a bot: answer like a success and store nothing.
    if (errors.website) return reply(request, 200, { ok: true }, "/gracias");
    return reply(request, 422, { ok: false, errors }, "/#contacto");
  }

  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  const allowed = await hit(env.DB, `lead:${await hashKey(ip)}`, 5, 3600);
  if (!allowed) {
    return reply(
      request,
      429,
      { ok: false, errors: { form: "Recibimos varios mensajes desde tu conexión. Escríbenos por WhatsApp o intenta en una hora." } },
      "/#contacto",
    );
  }

  const lead = parsed.data;
  await env.DB.prepare(
    `INSERT INTO leads (id, name, phone, goal, preferred_modality, source) VALUES (?1, ?2, ?3, ?4, ?5, 'landing')`,
  )
    .bind(crypto.randomUUID(), lead.name, lead.phone, lead.goal, lead.modality)
    .run();

  return reply(request, 201, { ok: true }, "/gracias");
};
