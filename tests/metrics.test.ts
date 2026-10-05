import { describe, expect, it } from "vitest";
import {
  ageOn,
  bestBodyFat,
  bmi,
  bmrMifflin,
  bodyFatJP3,
  bodyFatJP7,
  bodyFatNavy,
  delta,
  estimatedTdee,
  fatMassKg,
  leanMassKg,
  oneRmBrzycki,
  oneRmEpley,
  round,
  seriesDeltas,
  siri,
  trend,
  waistHeightRatio,
  waistHipRatio,
} from "../src/lib/metrics";

describe("ageOn", () => {
  it("counts whole years and respects the birthday", () => {
    expect(ageOn("1990-06-15", "2026-06-14")).toBe(35);
    expect(ageOn("1990-06-15", "2026-06-15")).toBe(36);
  });
  it("rejects invalid or future dates", () => {
    expect(ageOn("1990-13-01", "2026-01-01")).toBeNull();
    expect(ageOn("2030-01-01", "2026-01-01")).toBeNull();
  });
});

describe("indices", () => {
  it("IMC", () => {
    expect(round(bmi(70, 175)!, 2)).toBe(22.86);
    expect(bmi(null, 175)).toBeNull();
    expect(bmi(70, 0)).toBeNull();
  });
  it("ICC e ICA", () => {
    expect(round(waistHipRatio(80, 100)!, 2)).toBe(0.8);
    expect(round(waistHeightRatio(85, 170)!, 2)).toBe(0.5);
    expect(waistHeightRatio(undefined, 170)).toBeNull();
  });
});

describe("% grasa", () => {
  it("Navy hombre coincide con la versión imperial (70 in, cuello 15 in, cintura 34 in ≈ 17.5 %)", () => {
    const pct = bodyFatNavy({ sex: "M", heightCm: 177.8, neckCm: 38.1, waistCm: 86.36 });
    expect(pct).not.toBeNull();
    expect(Math.abs(pct! - 17.5)).toBeLessThan(0.6);
  });
  it("Navy mujer requiere cadera", () => {
    expect(bodyFatNavy({ sex: "F", heightCm: 165, neckCm: 32, waistCm: 72 })).toBeNull();
    const pct = bodyFatNavy({ sex: "F", heightCm: 165, neckCm: 32, waistCm: 72, hipCm: 98 });
    expect(pct).toBeGreaterThan(20);
    expect(pct).toBeLessThan(35);
  });
  it("Navy descarta medidas imposibles", () => {
    expect(bodyFatNavy({ sex: "M", heightCm: 180, neckCm: 50, waistCm: 40 })).toBeNull();
  });
  it("Siri", () => {
    expect(round(siri(1.05)!, 2)).toBe(21.43);
  });
  it("JP3 hombre (suma 60 mm, 30 años ≈ 17.95 %)", () => {
    const pct = bodyFatJP3("M", 30, { chest: 15, abdomen: 25, thigh: 20 });
    expect(round(pct!, 2)).toBe(17.95);
  });
  it("JP3 mujer usa tríceps, suprailíaco y muslo", () => {
    expect(bodyFatJP3("F", 30, { chest: 15, abdomen: 25, thigh: 20 })).toBeNull();
    const pct = bodyFatJP3("F", 30, { triceps: 18, suprailiac: 15, thigh: 25 });
    expect(pct).toBeGreaterThan(18);
    expect(pct).toBeLessThan(30);
  });
  it("JP7 necesita los 7 pliegues", () => {
    const six = { chest: 10, abdomen: 20, thigh: 15, triceps: 10, subscapular: 12, suprailiac: 14 };
    expect(bodyFatJP7("M", 35, six)).toBeNull();
    const pct = bodyFatJP7("M", 35, { ...six, midaxillary: 11 });
    expect(pct).toBeGreaterThan(10);
    expect(pct).toBeLessThan(20);
  });
  it("masa grasa y magra", () => {
    expect(fatMassKg(80, 25)).toBe(20);
    expect(leanMassKg(80, 25)).toBe(60);
    expect(leanMassKg(80, null)).toBeNull();
  });
  it("bestBodyFat prefiere valor manual, luego JP7, JP3 y Navy", () => {
    const base = { sex: "M" as const, age: 30, heightCm: 177.8, neckCm: 38.1, waistCm: 86.36 };
    expect(bestBodyFat({ ...base, manualPct: 19, manualMethod: "bioimpedancia" })).toEqual({
      pct: 19,
      method: "bioimpedancia",
    });
    expect(bestBodyFat({ ...base, skinfolds: { chest: 15, abdomen: 25, thigh: 20 } })?.method).toBe("pliegues_jp3");
    expect(bestBodyFat(base)?.method).toBe("formula_navy");
    expect(bestBodyFat({ sex: "M", age: 30, heightCm: 180 })).toBeNull();
  });
});

describe("energía", () => {
  it("Mifflin-St Jeor", () => {
    expect(bmrMifflin("M", 80, 180, 30)).toBe(1780);
    expect(bmrMifflin("F", 60, 165, 25)).toBe(1345.25);
  });
  it("gasto estimado", () => {
    expect(estimatedTdee(1780, "moderado")).toBeCloseTo(2759, 0);
    expect(estimatedTdee(null, "moderado")).toBeNull();
  });
});

describe("1RM", () => {
  it("Epley", () => {
    expect(round(oneRmEpley(100, 5)!, 2)).toBe(116.67);
    expect(oneRmEpley(100, 1)).toBe(100);
    expect(oneRmEpley(100, 2.5)).toBeNull();
  });
  it("Brzycki", () => {
    expect(oneRmBrzycki(100, 5)).toBe(112.5);
    expect(oneRmBrzycki(100, 37)).toBeNull();
  });
});

describe("deltas y tendencia", () => {
  it("delta absoluto y porcentual", () => {
    expect(delta(76, 80)).toEqual({ abs: -4, pct: -5 });
    expect(delta(5, 0)).toEqual({ abs: 5, pct: null });
    expect(delta(null, 80)).toBeNull();
  });
  it("seriesDeltas ignora huecos", () => {
    const r = seriesDeltas([90, null, 88, 86.5]);
    expect(r.current).toBe(86.5);
    expect(r.vsPrevious?.abs).toBe(-1.5);
    expect(r.vsFirst?.abs).toBe(-3.5);
    expect(seriesDeltas([90]).vsFirst).toBeNull();
  });
  it("trend nombra el estado", () => {
    expect(trend(delta(79.8, 80), 0.3)).toBe("estable");
    expect(trend(delta(78, 80), 0.3)).toBe("bajando");
    expect(trend(delta(82, 80), 0.3)).toBe("subiendo");
    expect(trend(null, 0.3)).toBe("sin_dato");
  });
});

import { ema } from "../src/lib/metrics";
describe("ema (tendencia de peso)", () => {
  it("smooths spikes and starts at the first value", () => {
    const t = ema([80, 82, 80, 80], 0.5);
    expect(t[0]).toBe(80);
    expect(t[1]).toBe(81);
    expect(t[2]).toBe(80.5);
    expect(ema([], 0.3)).toEqual([]);
  });
});
