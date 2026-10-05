import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import { SESSION_COOKIE, validateSession } from "@/lib/auth/session";

/**
 * Resolves the session on every server request and guards private areas.
 * - /app/*    → role "student"
 * - /coach/*  → role "coach" (nutritionist will join in a later phase)
 * - users with a temporary password are sent to /cambiar-clave first
 * API routes do their own role checks and answer 401/403 instead of redirecting.
 */
export const onRequest = defineMiddleware(async (ctx, next) => {
  if (ctx.isPrerendered) return next();

  const url = ctx.url;
  const path = url.pathname;
  const token = ctx.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await validateSession(env.DB, token) : null;
  ctx.locals.user = user;

  const needs = path.startsWith("/app") ? "student" : path.startsWith("/coach") ? "coach" : null;
  if (needs) {
    if (!user) return ctx.redirect(`/login?next=${encodeURIComponent(path)}`);
    if (user.mustChangePassword) return ctx.redirect("/cambiar-clave");
    if (user.role !== needs) return ctx.redirect(user.role === "student" ? "/app" : "/coach");
  }

  const res = await next();
  if (needs || path === "/login" || path === "/cambiar-clave") {
    res.headers.set("cache-control", "private, no-store");
    res.headers.set("x-robots-tag", "noindex, nofollow");
  }
  return res;
});
