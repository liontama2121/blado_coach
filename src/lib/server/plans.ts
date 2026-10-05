/**
 * Workout + meal plan reads for the student app. Same rule as student.ts:
 * studentId always comes from the session.
 */
import { add, recipePortion, scale, sum, ZERO, type Macros, type Per100 } from "@/lib/nutrition";

// ---------------------------------------------------------------- workouts

export interface WorkoutItem {
  id: string;
  exercise_id: string;
  position: number;
  sets: number;
  reps: string;
  load_kg: number | null;
  rest_s: number | null;
  rir: number | null;
  notes: string | null;
  name: string;
  muscle_group: string;
  equipment: string;
  cue: string | null;
}
export interface WorkoutDay {
  id: string;
  weekday: number;
  title: string;
  location: "casa" | "gym";
  items: WorkoutItem[];
}
export interface WorkoutPlan {
  id: string;
  name: string;
  notes: string | null;
  days: WorkoutDay[];
}

export async function getWorkoutPlan(db: D1Database, studentId: string): Promise<WorkoutPlan | null> {
  const plan = await db
    .prepare(`SELECT id, name, notes FROM workout_plans WHERE student_id = ?1 AND status = 'publicado' ORDER BY starts_on DESC LIMIT 1`)
    .bind(studentId)
    .first<{ id: string; name: string; notes: string | null }>();
  if (!plan) return null;
  const [days, items] = await Promise.all([
    db.prepare(`SELECT id, weekday, title, location FROM workout_days WHERE plan_id = ?1 ORDER BY weekday`).bind(plan.id).all<Omit<WorkoutDay, "items">>(),
    db
      .prepare(
        `SELECT i.id, i.day_id, i.exercise_id, i.position, i.sets, i.reps, i.load_kg, i.rest_s, i.rir, i.notes, e.name, e.muscle_group, e.equipment, e.cue
           FROM workout_items i JOIN workout_days d ON d.id = i.day_id JOIN exercises e ON e.id = i.exercise_id
          WHERE d.plan_id = ?1 ORDER BY i.position`,
      )
      .bind(plan.id)
      .all<WorkoutItem & { day_id: string }>(),
  ]);
  return { ...plan, days: days.results.map((d) => ({ ...d, items: items.results.filter((i) => i.day_id === d.id) })) };
}

export async function getWorkoutLogs(db: D1Database, studentId: string, fromDate: string) {
  const r = await db
    .prepare(`SELECT day_id, done_on, status FROM workout_day_logs WHERE student_id = ?1 AND done_on >= ?2`)
    .bind(studentId, fromDate)
    .all<{ day_id: string; done_on: string; status: string }>();
  return r.results;
}

// ---------------------------------------------------------------- meals

export const SLOT_LABEL: Record<string, string> = {
  desayuno: "Desayuno",
  media_manana: "Media mañana",
  pre_entreno: "Pre-entreno",
  almuerzo: "Almuerzo",
  post_entreno: "Post-entreno",
  onces: "Onces",
  cena: "Cena",
};

export interface MealItem {
  id: string;
  name: string;
  grams: number;
  measure: string;
  isRecipe: boolean;
  preparation: string | null;
  macros: Macros;
}
export interface Meal {
  id: string;
  slot: string;
  day_type: "todos" | "entreno" | "descanso";
  items: MealItem[];
  macros: Macros;
}
export interface MealPlan {
  id: string;
  version: number;
  status: string;
  kind: "guia" | "plan";
  reviewer: { name: string; card: string | null } | null;
  meals: Meal[];
}

type FoodRow = Per100 & { id: string; name: string; household_measure: string; ref_grams: number; food_group: string; market_section: string };

export async function getMealPlan(db: D1Database, studentId: string): Promise<MealPlan | null> {
  const plan = await db
    .prepare(
      `SELECT p.id, p.version, p.status, p.kind, u.email AS reviewer_email
         FROM meal_plans p LEFT JOIN users u ON u.id = p.approved_by_nutritionist_id
        WHERE p.student_id = ?1 AND p.status IN ('publicado', 'aprobado') ORDER BY p.version DESC LIMIT 1`,
    )
    .bind(studentId)
    .first<{ id: string; version: number; status: string; kind: "guia" | "plan"; reviewer_email: string | null }>();
  if (!plan) return null;

  const [meals, items, ingredients] = await Promise.all([
    db.prepare(`SELECT id, slot, day_type FROM meal_plan_meals WHERE plan_id = ?1 ORDER BY position`).bind(plan.id).all<Omit<Meal, "items" | "macros">>(),
    db
      .prepare(
        `SELECT i.id, i.meal_id, i.grams, i.household_measure, i.recipe_id,
                COALESCE(f.name, r.name) AS name, r.preparation,
                f.kcal, f.protein_g, f.carbs_g, f.fat_g, f.fiber_g
           FROM meal_plan_items i JOIN meal_plan_meals m ON m.id = i.meal_id
      LEFT JOIN foods f ON f.id = i.food_id LEFT JOIN recipes r ON r.id = i.recipe_id
          WHERE m.plan_id = ?1`,
      )
      .bind(plan.id)
      .all<Per100 & { id: string; meal_id: string; grams: number; household_measure: string | null; recipe_id: string | null; name: string; preparation: string | null }>(),
    db
      .prepare(
        `SELECT ri.recipe_id, ri.grams, f.kcal, f.protein_g, f.carbs_g, f.fat_g, f.fiber_g
           FROM recipe_ingredients ri JOIN foods f ON f.id = ri.food_id
          WHERE ri.recipe_id IN (SELECT i.recipe_id FROM meal_plan_items i JOIN meal_plan_meals m ON m.id = i.meal_id WHERE m.plan_id = ?1)`,
      )
      .bind(plan.id)
      .all<Per100 & { recipe_id: string; grams: number }>(),
  ]);

  const byRecipe = new Map<string, { grams: number; per100: Per100 }[]>();
  for (const ing of ingredients.results) {
    const list = byRecipe.get(ing.recipe_id) ?? [];
    list.push({ grams: ing.grams, per100: ing });
    byRecipe.set(ing.recipe_id, list);
  }

  const toItem = (i: (typeof items.results)[number]): MealItem => ({
    id: i.id,
    name: i.name,
    grams: i.grams,
    measure: i.household_measure ?? `${i.grams} g`,
    isRecipe: Boolean(i.recipe_id),
    preparation: i.preparation,
    macros: i.recipe_id ? recipePortion(byRecipe.get(i.recipe_id) ?? [], i.grams) : scale(i, i.grams),
  });

  return {
    id: plan.id,
    version: plan.version,
    status: plan.status,
    kind: plan.kind,
    reviewer: plan.reviewer_email ? { name: plan.reviewer_email, card: null } : null,
    meals: meals.results.map((m) => {
      const its = items.results.filter((i) => i.meal_id === m.id).map(toItem);
      return { ...m, items: its, macros: sum(its.map((i) => i.macros)) };
    }),
  };
}

export const mealsFor = (plan: MealPlan, dayType: "entreno" | "descanso") => plan.meals.filter((m) => m.day_type === "todos" || m.day_type === dayType);
export const dayTotals = (meals: Meal[]) => meals.reduce((acc, m) => add(acc, m.macros), ZERO);

export async function getTargets(db: D1Database, studentId: string) {
  return db
    .prepare(`SELECT kcal, protein_g, fat_g, carbs_g, fiber_g, water_l FROM nutrition_targets WHERE student_id = ?1`)
    .bind(studentId)
    .first<{ kcal: number; protein_g: number; fat_g: number; carbs_g: number; fiber_g: number | null; water_l: number | null }>();
}

export async function getRestrictions(db: D1Database, studentId: string) {
  const r = await db
    .prepare(
      `SELECT r.type, r.severity, r.restriction_tag, r.note, a.label AS allergen_label, f.name AS food_name
         FROM dietary_restrictions r LEFT JOIN allergens a ON a.code = r.allergen LEFT JOIN foods f ON f.id = r.food_id
        WHERE r.student_id = ?1 ORDER BY CASE r.severity WHEN 'grave' THEN 0 ELSE 1 END`,
    )
    .bind(studentId)
    .all<{ type: string; severity: string | null; restriction_tag: string | null; note: string | null; allergen_label: string | null; food_name: string | null }>();
  return r.results;
}

export async function getMealLogs(db: D1Database, studentId: string, date: string) {
  const r = await db
    .prepare(`SELECT meal_id, status FROM meal_logs WHERE student_id = ?1 AND logged_on = ?2`)
    .bind(studentId, date)
    .all<{ meal_id: string; status: "cumpli" | "parcial" | "no" }>();
  return new Map(r.results.map((l) => [l.meal_id, l.status]));
}

// ---------------------------------------------------------------- shopping list

export interface ShoppingRow {
  section: string;
  name: string;
  grams: number;
  measure: string;
  refGrams: number;
}

/** Weekly grams per food (recipes expanded), counting training vs rest days. */
export async function getShoppingList(db: D1Database, studentId: string, trainingDays: number): Promise<ShoppingRow[]> {
  const plan = await db
    .prepare(`SELECT id FROM meal_plans WHERE student_id = ?1 AND status IN ('publicado','aprobado') ORDER BY version DESC LIMIT 1`)
    .bind(studentId)
    .first<{ id: string }>();
  if (!plan) return [];
  const rows = await db
    .prepare(
      `SELECT m.day_type, f.id, f.name, f.market_section, f.household_measure, f.ref_grams,
              CASE WHEN i.recipe_id IS NULL THEN i.grams
                   ELSE i.grams * ri.grams / (SELECT SUM(x.grams) FROM recipe_ingredients x WHERE x.recipe_id = i.recipe_id) END AS grams
         FROM meal_plan_items i
         JOIN meal_plan_meals m ON m.id = i.meal_id
    LEFT JOIN recipe_ingredients ri ON ri.recipe_id = i.recipe_id
         JOIN foods f ON f.id = COALESCE(i.food_id, ri.food_id)
        WHERE m.plan_id = ?1`,
    )
    .bind(plan.id)
    .all<{ day_type: string; id: string; name: string; market_section: string; household_measure: string; ref_grams: number; grams: number }>();
  const days = (t: string) => (t === "todos" ? 7 : t === "entreno" ? trainingDays : 7 - trainingDays);
  const acc = new Map<string, ShoppingRow>();
  for (const r of rows.results) {
    const cur = acc.get(r.id) ?? { section: r.market_section, name: r.name, grams: 0, measure: r.household_measure, refGrams: r.ref_grams };
    cur.grams += r.grams * days(r.day_type);
    acc.set(r.id, cur);
  }
  return [...acc.values()].sort((a, b) => a.section.localeCompare(b.section) || a.name.localeCompare(b.name));
}

export type { FoodRow };
