/**
 * Fixed-window rate limit backed by D1 (`rate_limits` table).
 * Returns true when the request is allowed.
 */
export async function hit(db: D1Database, key: string, limit: number, windowSeconds: number, now = new Date()): Promise<boolean> {
  const windowStart = new Date(now.getTime() - windowSeconds * 1000).toISOString();
  const nowIso = now.toISOString();
  // Reset the window when it expired, otherwise increment. One statement, no race between read and write.
  const row = await db
    .prepare(
      `INSERT INTO rate_limits (key, hits, window_start) VALUES (?1, 1, ?2)
       ON CONFLICT(key) DO UPDATE SET
         hits = CASE WHEN window_start < ?3 THEN 1 ELSE hits + 1 END,
         window_start = CASE WHEN window_start < ?3 THEN ?2 ELSE window_start END
       RETURNING hits`,
    )
    .bind(key, nowIso, windowStart)
    .first<{ hits: number }>();
  return (row?.hits ?? 1) <= limit;
}

/** Hash an IP so raw addresses are never stored. */
export async function hashKey(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}
