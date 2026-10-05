import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, createSession, safeNext, type Role } from "@/lib/auth/session";
import { hashKey, hit } from "@/lib/server/rate-limit";
import { fieldErrors } from "@/lib/validation/lead";
import { loginSchema } from "@/lib/validation/auth";

export const prerender = false;

const GENERIC = "Correo o contraseña incorrectos.";

// Constant-ish work when the user does not exist, so timing does not reveal valid emails.
const DUMMY_HASH = "pbkdf2$sha256$100000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export const POST: APIRoute = async ({ request, cookies, url }) => {
  const json = (request.headers.get("accept") ?? "").includes("application/json");
  const fail = (status: number, errors: Record<string, string>) =>
    json ? Response.json({ ok: false, errors }, { status }) : new Response(null, { status: 303, headers: { location: `/login?error=1` } });

  let raw: Record<string, unknown>;
  try {
    raw = (request.headers.get("content-type") ?? "").includes("application/json")
      ? ((await request.json()) as Record<string, unknown>)
      : Object.fromEntries(await request.formData());
  } catch {
    return fail(400, { form: "No pudimos leer el formulario." });
  }

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return fail(422, fieldErrors(parsed.error));
  const { email, password, next } = parsed.data;

  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  const [okEmail, okIp] = await Promise.all([
    hit(env.DB, `login:${await hashKey(email)}`, 8, 900),
    hit(env.DB, `login-ip:${await hashKey(ip)}`, 30, 900),
  ]);
  if (!okEmail || !okIp) return fail(429, { form: "Demasiados intentos. Espera 15 minutos y vuelve a intentarlo." });

  const user = await env.DB.prepare(`SELECT id, password_hash, role, disabled FROM users WHERE email = ?1`)
    .bind(email)
    .first<{ id: string; password_hash: string; role: Role; disabled: number }>();

  const valid = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid || user.disabled) return fail(401, { form: GENERIC });

  const ttl = Number(env.SESSION_TTL_DAYS ?? 14) || 14;
  const { token, expires } = await createSession(env.DB, user.id, ttl, request.headers.get("user-agent"));
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "lax",
    path: "/",
    expires,
  });

  const redirect = safeNext(next, user.role);
  return json ? Response.json({ ok: true, redirect }) : new Response(null, { status: 303, headers: { location: redirect } });
};
