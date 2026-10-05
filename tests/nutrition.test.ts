import { describe, expect, it } from "vitest";
import { recipePortion, scale, suggestTargets, sum } from "../src/lib/nutrition";

const arroz = { kcal: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3, fiber_g: 0.4 };
const pollo = { kcal: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, fiber_g: 0 };

describe("nutrition", () => {
  it("scales per-100 g values", () => {
    const m = scale(arroz, 150);
    expect(m.kcal).toBeCloseTo(195, 5);
    expect(m.carbs).toBeCloseTo(42, 5);
  });
  it("sums macros", () => {
    expect(sum([scale(arroz, 100), scale(pollo, 100)]).protein).toBeCloseTo(33.7, 5);
  });
  it("recipe portion scales every ingredient to the portion weight", () => {
    const r = recipePortion([{ grams: 100, per100: arroz }, { grams: 100, per100: pollo }], 100);
    expect(r.kcal).toBeCloseTo(147.5, 5); // half of each
  });
  it("suggests a 20 % deficit with high protein for fat loss", () => {
    const t = suggestTargets({ sex: "F", weightKg: 69.3, heightCm: 163, age: 35, activity: "moderado", goal: "perder_grasa" })!;
    expect(t.maintenance).toBe(2132);
    expect(t.kcal).toBe(1710);
    expect(t.protein).toBe(139);
    expect(t.fat).toBe(55);
    expect(t.needsConfirmation).toBe(false);
  });
  it("flags deficits over 25 % and never goes under the floor", () => {
    const t = suggestTargets({ sex: "F", weightKg: 50, heightCm: 155, age: 30, activity: "sedentario", goal: "perder_grasa", adjustPct: 40 })!;
    expect(t.needsConfirmation).toBe(true);
    expect(t.kcal).toBeGreaterThanOrEqual(1200);
  });
  it("surplus for muscle gain", () => {
    const t = suggestTargets({ sex: "M", weightKg: 77.6, heightCm: 178, age: 38, activity: "activo", goal: "ganar_musculo" })!;
    expect(t.kcal).toBeGreaterThan(t.maintenance);
  });
});
