/**
 * Food / recipe search already filtered by a student's restrictions.
 * Mirrors the rules of the SQL view meal_plan_conflicts (which stays the final authority at publish time).
 */
import { recipePortion, type Per100 } from "@/lib/nutrition";

/** SQL predicate: food f.id is SAFE for student ?1. */
const SAFE_FOOD = `
  NOT EXISTS (SELECT 1 FROM dietary_restrictions r JOIN food_allergens fa ON fa.allergen = r.allergen
               WHERE r.student_id = ?1 AND fa.food_id = f.id AND (fa.presence = 'contiene' OR (fa.presence = 'trazas' AND r.severity = 'grave')))
  AND NOT EXISTS (SELECT 1 FROM dietary_restrictions r JOIN restriction_tag_map m ON m.restriction_tag = r.restriction_tag
                    JOIN food_tags ft ON ft.tag = m.food_tag WHERE r.student_id = ?1 AND ft.food_id = f.id)
  AND NOT EXISTS (SELECT 1 FROM dietary_restrictions r JOIN food_allergens fa ON fa.allergen = 'gluten'
                   WHERE r.student_id = ?1 AND r.restriction_tag = 'celiaquia' AND fa.food_id = f.id)
  AND NOT EXISTS (SELECT 1 FROM dietary_restrictions r WHERE r.student_id = ?1 AND r.food_id = f.id)
  AND (f.allergens_reviewed = 1 OR NOT EXISTS (SELECT 1 FROM dietary_restrictions r WHERE r.student_id = ?1 AND r.type = 'alergia'))`;

export interface SearchResult extends Per100 {
  kind: "food" | "recipe";
  id: string;
  name: string;
  ref_grams: number;
  household_measure: string;
  group: string;
}

export async function searchSafe(db: D1Database, studentId: string, q: string, limit = 20): Promise<SearchResult[]> {
  const like = `%${q.trim().toLowerCase()}%`;
  const foods = await db
    .prepare(
      `SELECT 'food' AS kind, f.id, f.name, f.ref_grams, f.household_measure, f.food_group AS "group",
              f.kcal, f.protein_g, f.carbs_g, f.fat_g, f.fiber_g
         FROM foods f
        WHERE (lower(f.name) LIKE ?2 OR lower(COALESCE(f.aliases, '')) LIKE ?2) AND ${SAFE_FOOD}
        ORDER BY f.name LIMIT ?3`,
    )
    .bind(studentId, like, limit)
    .all<SearchResult>();
  const recipes = await db
    .prepare(
      `SELECT r.id, r.name FROM recipes r
        WHERE lower(r.name) LIKE ?2
          AND NOT EXISTS (SELECT 1 FROM recipe_ingredients ri JOIN foods f ON f.id = ri.food_id WHERE ri.recipe_id = r.id AND NOT (${SAFE_FOOD}))
        ORDER BY r.name LIMIT 10`,
    )
    .bind(studentId, like)
    .all<{ id: string; name: string }>();
  const recipeRows = await Promise.all(recipes.results.map((r) => recipeAsResult(db, r.id, r.name)));
  return [...recipeRows, ...foods.results];
}

/** A recipe expressed per 100 g of the finished dish, so the editor can treat it like a food. */
export async function recipeAsResult(db: D1Database, id: string, name: string): Promise<SearchResult> {
  const ing = await db
    .prepare(`SELECT ri.grams, f.kcal, f.protein_g, f.carbs_g, f.fat_g, f.fiber_g FROM recipe_ingredients ri JOIN foods f ON f.id = ri.food_id WHERE ri.recipe_id = ?1`)
    .bind(id)
    .all<Per100 & { grams: number }>();
  const total = ing.results.reduce((s, i) => s + i.grams, 0);
  const m = recipePortion(ing.results.map((i) => ({ grams: i.grams, per100: i })), 100);
  return { kind: "recipe", id, name, ref_grams: total || 100, household_measure: "1 porción", group: "receta", kcal: m.kcal, protein_g: m.protein, carbs_g: m.carbs, fat_g: m.fat, fiber_g: m.fiber };
}
