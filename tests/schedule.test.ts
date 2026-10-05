import { describe, expect, it } from "vitest";
import {
  addDays,
  bogotaParts,
  buildWeek,
  coachStatus,
  localToUtcMs,
  mondayOf,
  nextFree,
  type AvailabilityBlock,
} from "../src/lib/schedule";

// Monday 6-10 (ambos), Wednesday 17-19 (gym)
const availability: AvailabilityBlock[] = [
  { weekday: 1, start_minute: 360, end_minute: 600, location: "ambos" },
  { weekday: 3, start_minute: 1020, end_minute: 1140, location: "gym" },
];
const WEEK = "2026-10-05"; // a Monday

describe("time helpers", () => {
  it("converts to Bogotá local time (UTC-5)", () => {
    expect(bogotaParts(new Date("2026-10-05T11:30:00Z"))).toEqual({ date: "2026-10-05", weekday: 1, minute: 390 });
    // 02:00 UTC on Tuesday is still Monday 21:00 in Bogotá
    expect(bogotaParts(new Date("2026-10-06T02:00:00Z")).date).toBe("2026-10-05");
  });
  it("mondayOf and addDays", () => {
    expect(mondayOf("2026-10-08")).toBe("2026-10-05");
    expect(mondayOf("2026-10-11")).toBe("2026-10-05"); // Sunday belongs to the week that started Monday
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("localToUtcMs", () => {
    expect(new Date(localToUtcMs("2026-10-05", 360)).toISOString()).toBe("2026-10-05T11:00:00.000Z");
  });
});

describe("buildWeek", () => {
  const before = new Date("2026-10-04T12:00:00Z"); // Sunday, week not started

  it("creates hourly slots only inside availability", () => {
    const days = buildWeek({ weekStart: WEEK, availability, exceptions: [], sessions: [], now: before });
    expect(days).toHaveLength(7);
    expect(days[0]!.slots.map((s) => s.start)).toEqual([360, 420, 480, 540]);
    expect(days[1]!.slots).toEqual([]);
    expect(days[2]!.slots.map((s) => s.start)).toEqual([1020, 1080]);
    expect(days[0]!.slots.every((s) => s.state === "free")).toBe(true);
  });

  it("marks a session and its travel buffer as busy", () => {
    // Home session Monday 07:00-08:00 local with 30 min travel each side → blocks 06-07 (tail), 07-08, 08-09 (head)
    const days = buildWeek({
      weekStart: WEEK,
      availability,
      exceptions: [],
      sessions: [{ starts_at: "2026-10-05T12:00:00Z", ends_at: "2026-10-05T13:00:00Z", travel_before_min: 30, travel_after_min: 30 }],
      now: before,
    });
    expect(days[0]!.slots.map((s) => s.state)).toEqual(["busy", "busy", "busy", "free"]);
  });

  it("gym session without travel only blocks its own slot", () => {
    const days = buildWeek({
      weekStart: WEEK,
      availability,
      exceptions: [],
      sessions: [{ starts_at: "2026-10-05T12:00:00Z", ends_at: "2026-10-05T13:00:00Z", travel_before_min: 0, travel_after_min: 0 }],
      now: before,
    });
    expect(days[0]!.slots.map((s) => s.state)).toEqual(["free", "busy", "free", "free"]);
  });

  it("applies whole-day and partial exceptions", () => {
    const days = buildWeek({
      weekStart: WEEK,
      availability,
      exceptions: [
        { date: "2026-10-05", start_minute: 480, end_minute: 600 },
        { date: "2026-10-07", start_minute: null, end_minute: null },
      ],
      sessions: [],
      now: before,
    });
    expect(days[0]!.slots.map((s) => s.state)).toEqual(["free", "free", "busy", "busy"]);
    expect(days[2]!.slots.every((s) => s.state === "busy")).toBe(true);
  });

  it("marks ended slots as past", () => {
    const now = new Date("2026-10-05T13:30:00Z"); // Monday 08:30 local
    const days = buildWeek({ weekStart: WEEK, availability, exceptions: [], sessions: [], now });
    expect(days[0]!.slots.map((s) => s.state)).toEqual(["past", "past", "free", "free"]);
  });
});

describe("status and next free", () => {
  it("reports disponible, ocupado and fuera de horario", () => {
    const session = { starts_at: "2026-10-05T12:00:00Z", ends_at: "2026-10-05T13:00:00Z", travel_before_min: 0, travel_after_min: 0 };
    const at = (iso: string) => {
      const now = new Date(iso);
      const days = buildWeek({ weekStart: WEEK, availability, exceptions: [], sessions: [session], now });
      return coachStatus(days, now, { sessions: [session] });
    };
    expect(at("2026-10-05T11:15:00Z")).toBe("disponible"); // 06:15 local
    expect(at("2026-10-05T12:15:00Z")).toBe("ocupado"); // in session
    expect(at("2026-10-05T20:00:00Z")).toBe("fuera_de_horario"); // 15:00 local
  });
  it("finds the next free slot", () => {
    const now = new Date("2026-10-05T14:30:00Z"); // Monday 09:30, last Monday slot (09-10) is current, not past
    const days = buildWeek({ weekStart: WEEK, availability, exceptions: [], sessions: [], now });
    expect(nextFree(days)).toEqual({ date: "2026-10-05", slot: { start: 540, end: 600, state: "free", location: "ambos" } });
  });
});
