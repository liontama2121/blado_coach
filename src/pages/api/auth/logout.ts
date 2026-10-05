import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { SESSION_COOKIE, deleteSession } from "@/lib/auth/session";

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  await deleteSession(env.DB, cookies.get(SESSION_COOKIE)?.value);
  cookies.delete(SESSION_COOKIE, { path: "/" });
  return new Response(null, { status: 303, headers: { location: "/login?salida=1" } });
};
