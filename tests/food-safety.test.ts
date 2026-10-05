import { beforeEach, describe, expect, it } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { freshDb } from "./helpers/db";

let db: DatabaseSync;
let n = 0;
const id = (p: string) => `${p}-${++n}`;

function student(name = "Estudiante") {
  const sid = id("s");
  db.prepare(
    `INSERT INTO students (id, full_name, birth_date, sex, start_date, modality, height_cm, goal_type)
     VALUES (?, ?, '1990-01-01', 'F', '2026-01-01', 'casa', 165, 'salud_general')`,
  ).run(sid, name);
  return sid;
}

function food(name: string, opts: { allergens?: [string, "contiene" | "trazas"][]; tags?: string[]; reviewed?: boolean } = {}) {
  const fid = id("f");
  db.prepare(
    `INSERT INTO foods (id, name, food_group, ref_grams, household_measure, kcal, protein_g, carbs_g, fat_g, source, allergens_reviewed)
     VALUES (?, ?, 'carnes_huevos_leguminosas', 100, '1 porción', 100, 10, 10, 5, 'seed_aproximado', ?)`,
  ).run(fid, name, opts.reviewed === false ? 0 : 1);
  for (const [a, p] of opts.allergens ?? []) db.prepare(`INSERT INTO food_allergens (food_id, allergen, presence) VALUES (?, ?, ?)`).run(fid, a, p);
  for (const t of opts.tags ?? []) db.prepare(`INSERT INTO food_tags (food_id, tag) VALUES (?, ?)`).run(fid, t);
  return fid;
}

function recipe(...ingredients: string[]) {
  const rid = id("r");
  db.prepare(`INSERT INTO recipes (id, name) VALUES (?, 'Receta')`).run(rid);
  for (const f of ingredients) db.prepare(`INSERT INTO recipe_ingredients (recipe_id, food_id, grams) VALUES (?, ?, 50)`).run(rid, f);
  return rid;
}

function plan(sid: string, items: { food?: string; recipe?: string }[]) {
  const pid = id("p");
  const mid = id("m");
  db.prepare(`INSERT INTO meal_plans (id, student_id, version) VALUES (?, ?, ?)`).run(pid, sid, n);
  db.prepare(`INSERT INTO meal_plan_meals (id, plan_id, slot, position) VALUES (?, ?, 'almuerzo', 1)`).run(mid, pid);
  for (const it of items)
    db.prepare(`INSERT INTO meal_plan_items (id, meal_id, food_id, recipe_id, grams) VALUES (?, ?, ?, ?, 100)`).run(id("i"), mid, it.food ?? null, it.recipe ?? null);
  return pid;
}

const publish = (pid: string) => () => db.prepare(`UPDATE meal_plans SET status = 'publicado' WHERE id = ?`).run(pid);
const restrict = (sid: string, cols: Record<string, string | number>) => {
  const keys = Object.keys(cols);
  db.prepare(`INSERT INTO dietary_restrictions (id, student_id, ${keys.join(", ")}) VALUES (?, ?, ${keys.map(() => "?").join(", ")})`).run(id("dr"), sid, ...Object.values(cols));
};

beforeEach(() => {
  db = freshDb();
});

describe("seguridad de alergias y restricciones (en la base de datos)", () => {
  it("receta con maní bloqueada para alérgico al maní", () => {
    const s = student();
    restrict(s, { type: "alergia", allergen: "mani", severity: "moderada" });
    const salsa = recipe(food("Salsa de maní", { allergens: [["mani", "contiene"]] }), food("Arroz"));
    const p = plan(s, [{ recipe: salsa }]);
    expect(publish(p)).toThrow(/plan_con_conflictos/);
    const c = db.prepare(`SELECT reason, detail FROM meal_plan_conflicts WHERE plan_id = ?`).all(p);
    expect(c).toEqual([{ reason: "alergia", detail: "mani" }]);
  });

  it("trazas bloqueadas solo en severidad grave", () => {
    const granola = food("Granola", { allergens: [["mani", "trazas"]] });
    const leve = student("Leve");
    restrict(leve, { type: "alergia", allergen: "mani", severity: "leve" });
    expect(publish(plan(leve, [{ food: granola }]))).not.toThrow();

    const grave = student("Grave");
    restrict(grave, { type: "alergia", allergen: "mani", severity: "grave" });
    expect(publish(plan(grave, [{ food: granola }]))).toThrow(/plan_con_conflictos/);
  });

  it("vegano no recibe lácteos, huevo ni miel", () => {
    const s = student();
    restrict(s, { type: "preferencia", restriction_tag: "vegano" });
    for (const f of [
      food("Kumis", { tags: ["animal", "lacteo"], allergens: [["leche", "contiene"]] }),
      food("Huevo", { tags: ["animal", "huevo"], allergens: [["huevo", "contiene"]] }),
      food("Miel", { tags: ["miel"] }),
    ]) {
      expect(publish(plan(s, [{ food: f }]))).toThrow(/plan_con_conflictos/);
    }
    expect(publish(plan(s, [{ food: food("Lentejas") }]))).not.toThrow();
  });

  it("celíaco no recibe avena no certificada (ni gluten)", () => {
    const s = student();
    restrict(s, { type: "condicion", restriction_tag: "celiaquia", requires_nutritionist: 1 });
    const avena = food("Avena en hojuelas", { tags: ["avena_no_certificada"] });
    const p = plan(s, [{ food: avena }]);
    const reasons = db.prepare(`SELECT detail FROM meal_plan_conflicts WHERE plan_id = ?`).all(p);
    expect(reasons).toContainEqual({ detail: "celiaquia" });
    const pan = plan(s, [{ food: food("Pan", { allergens: [["gluten", "contiene"]] }) }]);
    expect(db.prepare(`SELECT COUNT(*) AS c FROM meal_plan_conflicts WHERE plan_id = ?`).get(pan)).toEqual({ c: 1 });
  });

  it("condición que requiere nutricionista: no se publica sin aprobación", () => {
    const s = student();
    restrict(s, { type: "condicion", restriction_tag: "celiaquia", requires_nutritionist: 1 });
    const p = plan(s, [{ food: food("Arroz") }]);
    expect(publish(p)).toThrow(/requiere_aprobacion_de_nutricionista/);
    expect(() => db.prepare(`UPDATE meal_plans SET status = 'aprobado' WHERE id = ?`).run(p)).toThrow(/aprobacion_sin_nutricionista/);
  });

  it("alergia: alimentos con alérgenos sin revisar no entran", () => {
    const s = student();
    restrict(s, { type: "alergia", allergen: "soya", severity: "leve" });
    expect(publish(plan(s, [{ food: food("Producto nuevo", { reviewed: false }) }]))).toThrow(/plan_con_conflictos/);
  });

  it("un plan publicado queda congelado", () => {
    const s = student();
    const p = plan(s, [{ food: food("Arroz") }]);
    publish(p)();
    const meal = db.prepare(`SELECT id FROM meal_plan_meals WHERE plan_id = ?`).get(p) as { id: string };
    expect(() => db.prepare(`INSERT INTO meal_plan_items (id, meal_id, food_id, grams) VALUES ('x', ?, ?, 10)`).run(meal.id, food("Papa"))).toThrow(/no_editable/);
  });

  it("nueva alergia despublica los planes que quedan inseguros", () => {
    const s = student();
    const p = plan(s, [{ food: food("Tilapia", { allergens: [["pescado", "contiene"]], tags: ["animal", "pescado"] }) }]);
    publish(p)();
    restrict(s, { type: "alergia", allergen: "pescado", severity: "grave" });
    expect(db.prepare(`SELECT status FROM meal_plans WHERE id = ?`).get(p)).toEqual({ status: "borrador" });
  });
});
