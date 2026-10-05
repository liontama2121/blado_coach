/**
 * Password hashing with WebCrypto PBKDF2-SHA256 (available in Workers and Node ≥ 20).
 * Format: pbkdf2$sha256$<iterations>$<salt b64url>$<hash b64url>
 * Workers caps PBKDF2 at 100 000 iterations.
 */

const ITERATIONS = 100_000;
const KEY_BYTES = 32;
const SALT_BYTES = 16;

const enc = new TextEncoder();

function toB64Url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromB64Url(s: string): Uint8Array {
  const b64 = s.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$sha256$${ITERATIONS}$${toB64Url(salt)}$${toB64Url(hash)}`;
}

/** Constant-time comparison so timing does not leak how many bytes matched. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") return false;
  const iterations = Number(parts[2]);
  if (!Number.isInteger(iterations) || iterations < 10_000 || iterations > ITERATIONS) return false;
  const salt = fromB64Url(parts[3]!);
  const expected = fromB64Url(parts[4]!);
  const actual = await derive(password, salt, iterations);
  return timingSafeEqual(actual, expected);
}

/** Minimum policy shown in the change-password form. */
export const PASSWORD_MIN_LENGTH = 10;
