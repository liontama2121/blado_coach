import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";

describe("password", () => {
  it("verifies the right password and rejects a wrong one", async () => {
    const stored = await hashPassword("entrena-con-intencion");
    expect(stored.startsWith("pbkdf2$sha256$100000$")).toBe(true);
    expect(await verifyPassword("entrena-con-intencion", stored)).toBe(true);
    expect(await verifyPassword("entrena-con-intencion!", stored)).toBe(false);
  });
  it("uses a fresh salt each time", async () => {
    expect(await hashPassword("x".repeat(12))).not.toBe(await hashPassword("x".repeat(12)));
  });
  it("rejects malformed hashes", async () => {
    expect(await verifyPassword("a", "plain-text")).toBe(false);
    expect(await verifyPassword("a", "pbkdf2$sha256$999999999$AA$AA")).toBe(false);
  });
});
