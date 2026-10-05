import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { searchSafe } from "@/lib/server/foods";

export const prerender = false;

/** GET /api/coach/foods?student=ID&q=arroz → foods and recipes that are SAFE for that student. */
export const GET: APIRoute = async ({ url, locals }) => {
  if (locals.user?.role !== "coach") return new Response(null, { status: 403 });
  const student = url.searchParams.get("student") ?? "";
  const q = (url.searchParams.get("q") ?? "").slice(0, 60);
  if (!student) return Response.json({ results: [] });
  return Response.json({ results: await searchSafe(env.DB, student, q) });
};
