/**
 * Body-composition and performance metrics.
 *
 * Pure functions only: no I/O, no Date.now(). Every function returns `null`
 * when an input is missing or outside the range where the formula makes sense,
 * so the UI can show "sin dato" instead of a misleading number.
 *
 * Units: kg, cm, mm (skinfolds), years. These values are guidance for the
 * coach, never a diagnosis.
 */

export type Sex = "M" | "F";

type Num = number | null | undefined;

const isPos = (n: Num): n is number => typeof n === "number" && Number.isFinite(n) && n > 0;

export function round(value: number, decimals = 1): number {
  const f = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * f) / f;
}

/** Age in whole years on `on` (ISO date strings `YYYY-MM-DD`). */
export function ageOn(birthDate: string, on: string): number | null {
  const b = parseIsoDate(birthDate);
  const d = parseIsoDate(on);
  // ISO dates compare correctly as strings.
  if (!b || !d || on < birthDate) return null;
  let age = d.y - b.y;
  if (d.m < b.m || (d.m === b.m && d.d < b.d)) age -= 1;
  return age;
}

function parseIsoDate(s: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

// ---------------------------------------------------------------- indices

/** IMC = peso / talla². Does not tell muscle from fat. */
export function bmi(weightKg: Num, heightCm: Num): number | null {
  if (!isPos(weightKg) || !isPos(heightCm)) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/** Índice cintura-cadera (ICC). */
export function waistHipRatio(waistCm: Num, hipCm: Num): number | null {
  if (!isPos(waistCm) || !isPos(hipCm)) return null;
  return waistCm / hipCm;
}

/** Índice cintura-altura (ICA). General reference: < 0.5. */
export function waistHeightRatio(waistCm: Num, heightCm: Num): number | null {
  if (!isPos(waistCm) || !isPos(heightCm)) return null;
  return waistCm / heightCm;
}

export const WAIST_HEIGHT_REFERENCE = 0.5;

// ---------------------------------------------------------------- body fat

/**
 * % grasa, US Navy formula (metric version, cm).
 * Men: neck + waist. Women: neck + waist + hip.
 */
export function bodyFatNavy(input: {
  sex: Sex;
  heightCm: Num;
  neckCm: Num;
  waistCm: Num;
  hipCm?: Num;
}): number | null {
  const { sex, heightCm, neckCm, waistCm, hipCm } = input;
  if (!isPos(heightCm) || !isPos(neckCm) || !isPos(waistCm)) return null;
  let density: number;
  if (sex === "M") {
    const diff = waistCm - neckCm;
    if (diff <= 0) return null;
    density = 1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(heightCm);
  } else {
    if (!isPos(hipCm)) return null;
    const diff = waistCm + hipCm - neckCm;
    if (diff <= 0) return null;
    density = 1.29579 - 0.35004 * Math.log10(diff) + 0.221 * Math.log10(heightCm);
  }
  return clampFat(495 / density - 450);
}

/** Siri equation: body density → % fat. */
export function siri(bodyDensity: Num): number | null {
  if (!isPos(bodyDensity)) return null;
  return 495 / bodyDensity - 450;
}

export interface Skinfolds {
  chest?: Num;
  abdomen?: Num;
  thigh?: Num;
  triceps?: Num;
  suprailiac?: Num;
  subscapular?: Num;
  midaxillary?: Num;
}

/**
 * Jackson-Pollock 3 skinfolds + Siri.
 * Men: chest, abdomen, thigh. Women: triceps, suprailiac, thigh.
 */
export function bodyFatJP3(sex: Sex, age: Num, sf: Skinfolds): number | null {
  if (!isPos(age)) return null;
  const sites = sex === "M" ? [sf.chest, sf.abdomen, sf.thigh] : [sf.triceps, sf.suprailiac, sf.thigh];
  if (!sites.every(isPos)) return null;
  const s = (sites as number[]).reduce((a, b) => a + b, 0);
  const bd =
    sex === "M"
      ? 1.10938 - 0.0008267 * s + 0.0000016 * s * s - 0.0002574 * age
      : 1.0994921 - 0.0009929 * s + 0.0000023 * s * s - 0.0001392 * age;
  const pct = siri(bd);
  return pct === null ? null : clampFat(pct);
}

/** Jackson-Pollock 7 skinfolds + Siri. */
export function bodyFatJP7(sex: Sex, age: Num, sf: Skinfolds): number | null {
  if (!isPos(age)) return null;
  const sites = [sf.chest, sf.abdomen, sf.thigh, sf.triceps, sf.subscapular, sf.suprailiac, sf.midaxillary];
  if (!sites.every(isPos)) return null;
  const s = (sites as number[]).reduce((a, b) => a + b, 0);
  const bd =
    sex === "M"
      ? 1.112 - 0.00043499 * s + 0.00000055 * s * s - 0.00028826 * age
      : 1.097 - 0.00046971 * s + 0.00000056 * s * s - 0.00012828 * age;
  const pct = siri(bd);
  return pct === null ? null : clampFat(pct);
}

/** Values outside 2–70 % come from a typing error, not from a body. */
function clampFat(pct: number): number | null {
  return Number.isFinite(pct) && pct >= 2 && pct <= 70 ? pct : null;
}

export function fatMassKg(weightKg: Num, bodyFatPct: Num): number | null {
  if (!isPos(weightKg) || !isPos(bodyFatPct)) return null;
  return (weightKg * bodyFatPct) / 100;
}

export function leanMassKg(weightKg: Num, bodyFatPct: Num): number | null {
  const fat = fatMassKg(weightKg, bodyFatPct);
  return fat === null || !isPos(weightKg) ? null : weightKg - fat;
}

// ---------------------------------------------------------------- energy

/** TMB, Mifflin-St Jeor (kcal/día). */
export function bmrMifflin(sex: Sex, weightKg: Num, heightCm: Num, age: Num): number | null {
  if (!isPos(weightKg) || !isPos(heightCm) || !isPos(age)) return null;
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "M" ? 5 : -161);
}

export const ACTIVITY_FACTORS = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  muy_activo: 1.9,
} as const;

export type ActivityLevel = keyof typeof ACTIVITY_FACTORS;

/** Gasto energético estimado = TMB × factor de actividad. */
export function estimatedTdee(bmr: Num, level: ActivityLevel): number | null {
  if (!isPos(bmr)) return null;
  return bmr * ACTIVITY_FACTORS[level];
}

// ---------------------------------------------------------------- strength

/** 1RM estimado, fórmula de Epley. */
export function oneRmEpley(loadKg: Num, reps: Num): number | null {
  if (!isPos(loadKg) || !isPos(reps) || !Number.isInteger(reps)) return null;
  if (reps === 1) return loadKg;
  return loadKg * (1 + reps / 30);
}

/** 1RM estimado, fórmula de Brzycki (válida hasta ~10 reps; nunca ≥ 37). */
export function oneRmBrzycki(loadKg: Num, reps: Num): number | null {
  if (!isPos(loadKg) || !isPos(reps) || !Number.isInteger(reps) || reps >= 37) return null;
  return (loadKg * 36) / (37 - reps);
}

// ---------------------------------------------------------------- deltas

export interface Delta {
  /** current − reference, in the metric's own unit. */
  abs: number;
  /** Relative change in %, or null when the reference is 0. */
  pct: number | null;
}

export function delta(current: Num, reference: Num): Delta | null {
  if (typeof current !== "number" || typeof reference !== "number") return null;
  if (!Number.isFinite(current) || !Number.isFinite(reference)) return null;
  const abs = current - reference;
  return { abs, pct: reference === 0 ? null : (abs / reference) * 100 };
}

export type Trend = "bajando" | "estable" | "subiendo" | "sin_dato";

/**
 * Names the direction of a change. `tolerance` is the absolute change
 * considered noise (e.g. 0.3 kg for weight, 0.5 cm for a circumference).
 */
export function trend(d: Delta | null, tolerance: number): Trend {
  if (!d) return "sin_dato";
  if (Math.abs(d.abs) <= tolerance) return "estable";
  return d.abs < 0 ? "bajando" : "subiendo";
}

/**
 * Deltas of one metric vs. the previous and the first record.
 * `series` must be ordered by date ascending; null values are skipped.
 */
export function seriesDeltas(series: readonly Num[]): {
  current: number | null;
  vsPrevious: Delta | null;
  vsFirst: Delta | null;
} {
  const values = series.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const current = values.at(-1) ?? null;
  if (values.length < 2 || current === null) return { current, vsPrevious: null, vsFirst: null };
  return {
    current,
    vsPrevious: delta(current, values.at(-2)),
    vsFirst: delta(current, values[0]),
  };
}

// ---------------------------------------------------------------- method pick

export type BodyFatMethod = "bioimpedancia" | "pliegues_jp3" | "pliegues_jp7" | "formula_navy" | "otro";

/**
 * Best available % fat for a measurement: a manually entered value
 * (bioimpedance or other device) wins, then JP7, JP3, and Navy as fallback.
 */
export function bestBodyFat(input: {
  sex: Sex;
  age: Num;
  heightCm: Num;
  manualPct?: Num;
  manualMethod?: BodyFatMethod | null;
  neckCm?: Num;
  waistCm?: Num;
  hipCm?: Num;
  skinfolds?: Skinfolds;
}): { pct: number; method: BodyFatMethod } | null {
  if (isPos(input.manualPct) && input.manualMethod) {
    return { pct: input.manualPct, method: input.manualMethod };
  }
  const sf = input.skinfolds ?? {};
  const jp7 = bodyFatJP7(input.sex, input.age, sf);
  if (jp7 !== null) return { pct: jp7, method: "pliegues_jp7" };
  const jp3 = bodyFatJP3(input.sex, input.age, sf);
  if (jp3 !== null) return { pct: jp3, method: "pliegues_jp3" };
  const navy = bodyFatNavy({
    sex: input.sex,
    heightCm: input.heightCm,
    neckCm: input.neckCm,
    waistCm: input.waistCm,
    hipCm: input.hipCm,
  });
  return navy === null ? null : { pct: navy, method: "formula_navy" };
}
