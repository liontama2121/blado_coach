import { addDays, bogotaParts, buildWeek, type AvailabilityBlock, type AvailabilityException, type BusySession, type Day } from "@/lib/schedule";

/** Next 7 days of the coach's agenda (free / busy only). Shared by the public API and the student app. */
export async function loadWeek(db: D1Database, now = new Date()): Promise<{ today: string; days: Day[] }> {
  const today = bogotaParts(now).date;
  const end = addDays(today, 7);
  const [availability, exceptions, sessions] = await Promise.all([
    db.prepare(`SELECT weekday, start_minute, end_minute, location FROM availability WHERE active = 1`).all<AvailabilityBlock>(),
    db
      .prepare(`SELECT date, start_minute, end_minute FROM availability_exceptions WHERE date >= ?1 AND date < ?2`)
      .bind(today, end)
      .all<AvailabilityException>(),
    db
      .prepare(
        `SELECT starts_at, ends_at, travel_before_min, travel_after_min FROM training_sessions
          WHERE status IN ('solicitada','confirmada') AND ends_at > ?1`,
      )
      .bind(new Date(now.getTime() - 6 * 3600_000).toISOString())
      .all<BusySession>(),
  ]);
  return {
    today,
    days: buildWeek({ weekStart: today, availability: availability.results, exceptions: exceptions.results, sessions: sessions.results, now }),
  };
}
