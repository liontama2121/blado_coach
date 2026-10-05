import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { searchSafe } from "../src/lib/server/foods";
import { asD1, freshDb } from "./helpers/db";

// Real migrations + real seeds: Andrés has a SEVERE peanut allergy, Mariana is lactose intolerant and dislikes tilapia.
const db = freshDb();
beforeAll(() => {
  for (const f of ["seed.sql", "seed-plans.sql"]) db.exec(readFileSync(join(import.meta.dirname, "../db", f), "utf8"));
});
const names = async (student: string, q: string) => (await searchSafe(asD1(db), student, q, 200)).map((r) => r.name);

describe("buscador de alimentos filtrado por restricciones", () => {
  it("alergia grave al maní: sin maní, sin mantequilla de maní y sin almendras (trazas)", async () => {
    const all = await names("s-andres", "");
    expect(all).not.toContain("Maní tostado");
    expect(all).not.toContain("Mantequilla de maní");
    expect(all).not.toContain("Almendras");
    expect(all).toContain("Arroz blanco cocido");
  });
  it("intolerancia a la lactosa: sin leche entera ni yogur, pero sí deslactosada", async () => {
    const all = await names("s-mariana", "");
    expect(all).not.toContain("Leche entera");
    expect(all).not.toContain("Yogur natural");
    expect(all).toContain("Leche deslactosada descremada");
  });
  it("no le gusta: tilapia no aparece", async () => {
    expect(await names("s-mariana", "tilapia")).toEqual([]);
  });
  it("las recetas con un ingrediente prohibido tampoco aparecen", async () => {
    db.exec(`INSERT INTO recipes (id, name) VALUES ('r-test', 'Salsa de maní casera'); INSERT INTO recipe_ingredients (recipe_id, food_id, grams) VALUES ('r-test', 'f-mani', 30);`);
    expect(await names("s-andres", "salsa")).not.toContain("Salsa de maní casera");
    expect(await names("s-mariana", "salsa")).toContain("Salsa de maní casera");
  });
  it("busca por alias", async () => {
    expect(await names("s-mariana", "mojarra")).toEqual([]); // tilapia alias, disliked
    expect(await names("s-andres", "mojarra")).toEqual(["Tilapia cocida"]);
  });
});
