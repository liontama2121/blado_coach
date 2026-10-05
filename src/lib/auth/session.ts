/**
 * Session handling backed by D1 (`auth_sessions`).
 * The cookie carries a random token; the DB only stores SHA-256(token),
 * so a leaked database cannot be replayed as cookies.
 */

export const SESSION_COOKIE = "blado_session";

export type Role = "coach" | "student" | "nutritionist";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
  /** students.id for role=student, else null. Always derived server-side. */
  studentId: string | null;
  studentName: string | null;
}

const enc = new TextEncoder();

function toB64Url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export async function sha256(value: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(value));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function newToken(): string {
  return toB64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function createSession(db: D1Database, userId: string, ttlDays: number, userAgent?: string | null): Promise<{ token: string; expires: Date }> {
  const token = newToken();
  const expires = new Date(Date.now() + ttlDays * 86_400_000);
  await db
    .prepare(`INSERT INTO auth_sessions (id, user_id, expires_at, user_agent) VALUES (?1, ?2, ?3, ?4)`)
    .bind(await sha256(token), userId, expires.toISOString(), userAgent?.slice(0, 200) ?? null)
    .run();
  await db.prepare(`UPDATE users SET last_login_at = ?2 WHERE id = ?1`).bind(userId, new Date().toISOString()).run();
  return { token, expires };
}

export async function validateSession(db: D1Database, token: string | undefined): Promise<SessionUser | null> {
  if (!token || token.length < 20) return null;
  const row = await db
    .prepare(
      `SELECT u.id, u.email, u.role, u.must_change_password, u.disabled, s.expires_at,
              st.id AS student_id, st.full_name AS student_name
         FROM auth_sessions s
         JOIN users u ON u.id = s.user_id
    LEFT JOIN students st ON st.user_id = u.id
        WHERE s.id = ?1`,
    )
    .bind(await sha256(token))
    .first<{
      id: string;
      email: string;
      role: Role;
      must_change_password: number;
      disabled: number;
      expires_at: string;
      student_id: string | null;
      student_name: string | null;
    }>();
  if (!row || row.disabled || Date.parse(row.expires_at) <= Date.now()) return null;
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    mustChangePassword: row.must_change_password === 1,
    studentId: row.role === "student" ? row.student_id : null,
    studentName: row.student_name,
  };
}

export async function deleteSession(db: D1Database, token: string | undefined): Promise<void> {
  if (!token) return;
  await db.prepare(`DELETE FROM auth_sessions WHERE id = ?1`).bind(await sha256(token)).run();
}

export async function deleteUserSessions(db: D1Database, userId: string, exceptToken?: string): Promise<void> {
  if (exceptToken) {
    await db.prepare(`DELETE FROM auth_sessions WHERE user_id = ?1 AND id <> ?2`).bind(userId, await sha256(exceptToken)).run();
  } else {
    await db.prepare(`DELETE FROM auth_sessions WHERE user_id = ?1`).bind(userId).run();
  }
}

export function homeFor(role: Role): string {
  return role === "student" ? "/app" : "/coach";
}

/** Only allow same-site relative redirects after login. */
export function safeNext(next: string | null | undefined, role: Role): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return homeFor(role);
  if (role === "student" && !next.startsWith("/app")) return "/app";
  if (role !== "student" && next.startsWith("/app")) return "/coach";
  return next;
}
