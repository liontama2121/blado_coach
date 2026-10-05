import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import {
  addDays,
  bogotaParts,
  buildWeek,
  coachStatus,
  localToUtcMs,
  nextFree,
  type AvailabilityBlock,
  type AvailabilityException,
  type BusySession,
} from "@/lib/schedule";

export const prerender = false;

/**
 * Public coach schedule for the next 7 days (today included).
 * PRIVACY: only free / busy and the block's location type leave the server.
 * No student ids, names, addresses or session notes are ever selected here.
 */
export const GET: APIRoute = async () => {
  const now = new Date();
  const { date: today } = bogotaParts(now);
  // Rolling window: today + the next 6 days, so the view is never all in the past.
  const weekStart = today;
  const weekEnd = addDays(weekStart, 7);

  const [availability, exceptions, sessions] = await Promise.all([
    env.DB.prepare(`SELECT weekday, start_minute, end_minute, location FROM availability WHERE active = 1`).all<AvailabilityBlock>(),
    env.DB.prepare(`SELECT date, start_minute, end_minute FROM availability_exceptions WHERE date >= ?1 AND date < ?2`)
      .bind(weekStart, weekEnd)
      .all<AvailabilityException>(),
    env.DB.prepare(
      `SELECT starts_at, ends_at, travel_before_min, travel_after_min
         FROM training_sessions
        WHERE status IN ('solicitada', 'confirmada')
          AND ends_at > ?1 AND starts_at < ?2`,
    )
      .bind(new Date(localToUtcMs(weekStart, 0) - 3 * 3600_000).toISOString(), new Date(localToUtcMs(weekEnd, 0) + 3 * 3600_000).toISOString())
      .all<BusySession>(),
  ]);

  const days = buildWeek({
    weekStart,
    availability: availability.results,
    exceptions: exceptions.results,
    sessions: sessions.results,
    now,
  });

  const body = {
    now: now.toISOString(),
    today,
    weekStart,
    status: coachStatus(days, now, { sessions: sessions.results }),
    nextFree: nextFree(days),
    days,
  };

  return Response.json(body, {
    headers: { "cache-control": "public, max-age=30, s-maxage=60" },
  });
};
