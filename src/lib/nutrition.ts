/**
 * Nutrition math: pure functions, unit-tested. Values are per 100 g in the DB.
 * Guidance only; plans made by the coach are presented as "Guía de alimentación".
 */
import { bmrMifflin, estimatedTdee, type ActivityLevel, type Sex } from "./metrics";

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

export interface Per100 {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export function scale(per100: Per100, grams: number): Macros {
  const f = grams / 100;
  return { kcal: per100.kcal * f, protein: per100.protein_g * f, carbs: per100.carbs_g * f, fat: per100.fat_g * f, fiber: per100.fiber_g * f };
}

export function add(a: Macros, b: Macros): Macros {
  return { kcal: a.kcal + b.kcal, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat, fiber: a.fiber + b.fiber };
}

export const sum = (list: Macros[]) => list.reduce(add, ZERO);

/**
 * Macros of `grams` of a recipe: ingredients are scaled to the portion
 * (recipe total weight = sum of ingredient grams).
 */
export function recipePortion(ingredients: { grams: number; per100: Per100 }[], grams: number): Macros {
  const total = ingredients.reduce((s, i) => s + i.grams, 0);
  if (total <= 0) return ZERO;
  const k = grams / total;
  return sum(ingredients.map((i) => scale(i.per100, i.grams * k)));
}

export type Goal = "perder_grasa" | "ganar_musculo" | "mantener";

export interface TargetInput {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
  activity: ActivityLevel;
  goal: Goal;
  /** % below maintenance for fat loss (15-25 default range) or above for muscle gain (5-15). */
  adjustPct?: number;
  proteinPerKg?: number;
  fatPerKg?: number;
  floorKcal?: number;
}

export interface Targets {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  maintenance: number;
  adjustPct: number;
  needsConfirmation: boolean; // deficit > 25 % or below the floor
}

/**
 * Suggested targets (editable by the coach):
 * Mifflin-St Jeor × activity → maintenance; goal adjustment; protein 1.4-2.0 g/kg
 * (up to 2.3-3.1 in a deficit), fat >= 0.6-0.8 g/kg, rest carbs; fiber 14 g / 1000 kcal.
 */
export function suggestTargets(i: TargetInput): Targets | null {
  const bmr = bmrMifflin(i.sex, i.weightKg, i.heightCm, i.age);
  const maintenance = estimatedTdee(bmr, i.activity);
  if (bmr === null || maintenance === null) return null;
  const adjustPct = i.adjustPct ?? (i.goal === "perder_grasa" ? 20 : i.goal === "ganar_musculo" ? 10 : 0);
  const signed = i.goal === "perder_grasa" ? -adjustPct : i.goal === "ganar_musculo" ? adjustPct : 0;
  const floor = i.floorKcal ?? (i.sex === "F" ? 1200 : 1500);
  let kcal = Math.round((maintenance * (1 + signed / 100)) / 10) * 10;
  const needsConfirmation = (i.goal === "perder_grasa" && adjustPct > 25) || kcal < floor;
  kcal = Math.max(kcal, floor);
  const proteinPerKg = i.proteinPerKg ?? (i.goal === "perder_grasa" ? 2.0 : 1.8);
  const protein = Math.round(i.weightKg * proteinPerKg);
  const fat = Math.round(i.weightKg * (i.fatPerKg ?? 0.8));
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, fat, carbs, fiber: Math.round((kcal / 1000) * 14), maintenance: Math.round(maintenance), adjustPct, needsConfirmation };
}

/** 0..1+ progress of a value against its target (for progress bars). */
export const ratio = (value: number, target: number) => (target > 0 ? value / target : 0);
