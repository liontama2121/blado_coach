import { describe, expect, it } from "vitest";
import { calendarTemplateUrl, checkProposal, isMeetUrl, parseTime } from "../src/lib/sessions";

const now = new Date("2026-10-05T12:00:00Z"); // Monday 07:00 Bogotá

describe("session proposals", () => {
  it("parses HH:MM", () => {
    expect(parseTime("06:30")).toBe(390);
    expect(parseTime("24:00")).toBeNull();
    expect(parseTime("7:00")).toBeNull();
  });
  it("accepts a valid proposal and returns UTC times", () => {
    const r = checkProposal({ date: "2026-10-06", time: "18:00", minutes: 60 }, [], now);
    expect(r).toEqual({ ok: true, starts_at: "2026-10-06T23:00:00.000Z", ends_at: "2026-10-07T00:00:00.000Z" });
  });
  it("rejects out of hours, too soon and bad durations", () => {
    expect(checkProposal({ date: "2026-10-06", time: "04:30", minutes: 60 }, [], now)).toEqual({ ok: false, error: "fuera_de_horario" });
    expect(checkProposal({ date: "2026-10-06", time: "21:30", minutes: 60 }, [], now)).toEqual({ ok: false, error: "fuera_de_horario" });
    expect(checkProposal({ date: "2026-10-05", time: "08:00", minutes: 60 }, [], now)).toEqual({ ok: false, error: "muy_pronto" });
    expect(checkProposal({ date: "2026-10-06", time: "08:00", minutes: 50 }, [], now)).toEqual({ ok: false, error: "duracion_invalida" });
  });
  it("rejects overlap with a confirmed session", () => {
    const busy = [{ starts_at: "2026-10-06T23:30:00.000Z", ends_at: "2026-10-07T00:30:00.000Z" }];
    expect(checkProposal({ date: "2026-10-06", time: "18:00", minutes: 60 }, busy, now)).toEqual({ ok: false, error: "choque" });
    expect(checkProposal({ date: "2026-10-06", time: "16:00", minutes: 60 }, busy, now).ok).toBe(true);
  });
  it("validates Google Meet links", () => {
    expect(isMeetUrl("https://meet.google.com/abc-defg-hij")).toBe(true);
    expect(isMeetUrl("http://meet.google.com/abc-defg-hij")).toBe(false);
    expect(isMeetUrl("https://evil.com/meet.google.com/abc-defg-hij")).toBe(false);
  });
  it("builds a Google Calendar template link", () => {
    const u = calendarTemplateUrl({ title: "Blado", startsAt: "2026-10-06T23:00:00.000Z", endsAt: "2026-10-07T00:00:00.000Z", guest: "a@b.co" });
    expect(u).toContain("dates=20261006T230000Z%2F20261007T000000Z");
    expect(u).toContain("add=a%40b.co");
  });
});
