import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { hashPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, deleteUserSessions, homeFor } from "@/lib/auth/session";
import { fieldErrors } from "@/lib/validation/lead";
import { newPasswordSchema } from "@/lib/validation/auth";

export const prerender = false;

/** Set a new password (required after the coach creates the account with a temporary one). */
export const POST: APIRoute = async ({ request, locals, cookies }) => {
  const user = locals.user;
  if (!user) return Response.json({ ok: false, errors: { form: "Tu sesión terminó. Vuelve a iniciar sesión." } }, { status: 401 });

  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, errors: { form: "No pudimos leer el formulario." } }, { status: 400 });
  }
  const parsed = newPasswordSchema.safeParse(raw);
  if (!parsed.success) return Response.json({ ok: false, errors: fieldErrors(parsed.error) }, { status: 422 });

  await env.DB.prepare(`UPDATE users SET password_hash = ?2, must_change_password = 0 WHERE id = ?1`)
    .bind(user.id, await hashPassword(parsed.data.password))
    .run();
  // Sign out every other device that used the old password.
  await deleteUserSessions(env.DB, user.id, cookies.get(SESSION_COOKIE)?.value);
  return Response.json({ ok: true, redirect: homeFor(user.role) });
};
