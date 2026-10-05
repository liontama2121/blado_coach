import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { z } from "zod";
import { fieldErrors } from "@/lib/validation/lead";

export const prerender = false;

const SLOTS = ["desayuno", "media_manana", "almuerzo", "onces", "cena", "pre_entreno", "post_entreno"] as const;
const saveSchema = z.object({
  op: z.literal("guardar"),
  student_id: z.string().min(1).max(64),
  kind: z.enum(["guia", "plan"]).default("guia"),
  change_reason: z.string().trim().max(200).optional(),
  meals: z
    .array(
      z.object({
        slot: z.enum(SLOTS),
        day_type: z.enum(["todos", "entreno", "descanso"]),
        items: z
          .array(
            z.object({
              kind: z.enum(["food", "recipe"]),
              id: z.string().min(1).max(64),
              grams: z.coerce.number().min(1, "Gramos mayores a 0.").max(2000),
              household_measure: z.string().trim().max(60).optional(),
            }),
          )
          .max(20),
      }),
    )
    .max(20),
});
const publishSchema = z.object({ op: z.literal("publicar"), student_id: z.string().min(1).max(64) });
const targetsSchema = z.object({
  op: z.literal("objetivos"),
  student_id: z.string().min(1).max(64),
  kcal: z.coerce.number().int().min(1000).max(6000),
  protein_g: z.coerce.number().int().min(20).max(400),
  fat_g: z.coerce.number().int().min(20).max(300),
  carbs_g: z.coerce.number().int().min(0).max(900),
  fiber_g: z.coerce.number().int().min(0).max(100).optional(),
  water_l: z.coerce.number().min(0).max(8).optional(),
  deficit_pct: z.coerce.number().min(-50).max(50).optional(),
  confirm_deficit: z.boolean().default(false),
});

const CONFLICT_MSG: Record<string, string> = {
  plan_con_conflictos_de_restricciones: "El plan tiene alimentos que este estudiante no puede comer. Revisa los marcados en rojo.",
  requiere_aprobacion_de_nutricionista: "Este estudiante tiene una condición que requiere nutricionista. El plan no se puede publicar sin su aprobación.",
  plan_publicado_no_editable: "Ese plan ya está publicado. Se edita creando una nueva versión.",
};
const dbError = (e: unknown) => {
  const msg = String((e as Error)?.message ?? e);
  const key = Object.keys(CONFLICT_MSG).find((k) => msg.includes(k));
  return Response.json({ ok: false, errors: { form: key ? CONFLICT_MSG[key] : "No se pudo guardar." } }, { status: key ? 409 : 500 });
};

/**
 * Coach meal-plan editing. One draft per student at a time:
 *  guardar   → replace the draft's meals (creates the draft as version N+1 if none)
 *  publicar  → archive the current published plan and publish the draft (DB triggers block unsafe plans)
 *  objetivos → save daily targets (deficits > 25 % need explicit confirmation)
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const coach = locals.user;
  if (coach?.role !== "coach") return Response.json({ ok: false, errors: { form: "No autorizado." } }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const db = env.DB;

  if ((body as { op?: string }).op === "objetivos") {
    const p = targetsSchema.safeParse(body);
    if (!p.success) return Response.json({ ok: false, errors: fieldErrors(p.error) }, { status: 422 });
    const t = p.data;
    if ((t.deficit_pct ?? 0) > 25 && !t.confirm_deficit)
      return Response.json({ ok: false, errors: { form: "Déficit mayor al 25 %: confirma explícitamente para guardarlo." } }, { status: 422 });
    await db
      .prepare(
        `INSERT INTO nutrition_targets (student_id, kcal, protein_g, fat_g, carbs_g, fiber_g, water_l, deficit_pct, deficit_confirmed_by, confirmed_at, updated_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)
         ON CONFLICT(student_id) DO UPDATE SET kcal=excluded.kcal, protein_g=excluded.protein_g, fat_g=excluded.fat_g, carbs_g=excluded.carbs_g,
           fiber_g=excluded.fiber_g, water_l=excluded.water_l, deficit_pct=excluded.deficit_pct, deficit_confirmed_by=excluded.deficit_confirmed_by,
           confirmed_at=excluded.confirmed_at, updated_at=excluded.updated_at`,
      )
      .bind(
        t.student_id, t.kcal, t.protein_g, t.fat_g, t.carbs_g, t.fiber_g ?? null, t.water_l ?? null, t.deficit_pct ?? null,
        (t.deficit_pct ?? 0) > 25 ? coach.id : null, (t.deficit_pct ?? 0) > 25 ? new Date().toISOString() : null, new Date().toISOString(),
      )
      .run();
    return Response.json({ ok: true });
  }

  if ((body as { op?: string }).op === "publicar") {
    const p = publishSchema.safeParse(body);
    if (!p.success) return Response.json({ ok: false, errors: { form: "Datos inválidos." } }, { status: 422 });
    const draft = await db.prepare(`SELECT id FROM meal_plans WHERE student_id = ?1 AND status = 'borrador' ORDER BY version DESC LIMIT 1`).bind(p.data.student_id).first<{ id: string }>();
    if (!draft) return Response.json({ ok: false, errors: { form: "No hay borrador para publicar." } }, { status: 409 });
    try {
      // One transaction: if the safety trigger aborts the publish, the previous plan is NOT archived.
      await db.batch([
        db.prepare(`UPDATE meal_plans SET status = 'archivado' WHERE student_id = ?1 AND status IN ('publicado','aprobado') AND id <> ?2`).bind(p.data.student_id, draft.id),
        db.prepare(`UPDATE meal_plans SET status = 'publicado' WHERE id = ?1`).bind(draft.id),
      ]);
    } catch (e) {
      return dbError(e);
    }
    return Response.json({ ok: true });
  }

  const p = saveSchema.safeParse(body);
  if (!p.success) return Response.json({ ok: false, errors: fieldErrors(p.error) }, { status: 422 });
  const d = p.data;
  const exists = await db.prepare(`SELECT 1 FROM students WHERE id = ?1`).bind(d.student_id).first();
  if (!exists) return Response.json({ ok: false, errors: { form: "Estudiante no encontrado." } }, { status: 404 });

  let draft = await db.prepare(`SELECT id FROM meal_plans WHERE student_id = ?1 AND status = 'borrador' ORDER BY version DESC LIMIT 1`).bind(d.student_id).first<{ id: string }>();
  if (!draft) {
    const v = await db.prepare(`SELECT COALESCE(MAX(version), 0) + 1 AS v FROM meal_plans WHERE student_id = ?1`).bind(d.student_id).first<{ v: number }>();
    draft = { id: crypto.randomUUID() };
    await db
      .prepare(`INSERT INTO meal_plans (id, student_id, version, status, kind, mode, change_reason, created_by) VALUES (?1, ?2, ?3, 'borrador', ?4, 'menu', ?5, ?6)`)
      .bind(draft.id, d.student_id, v?.v ?? 1, d.kind, d.change_reason || null, coach.id)
      .run();
  }
  const stmts = [
    db.prepare(`UPDATE meal_plans SET kind = ?2, change_reason = COALESCE(?3, change_reason) WHERE id = ?1`).bind(draft.id, d.kind, d.change_reason || null),
    db.prepare(`DELETE FROM meal_plan_meals WHERE plan_id = ?1`).bind(draft.id),
  ];
  d.meals.forEach((m, mi) => {
    const mealId = crypto.randomUUID();
    stmts.push(db.prepare(`INSERT INTO meal_plan_meals (id, plan_id, day_type, slot, position) VALUES (?1, ?2, ?3, ?4, ?5)`).bind(mealId, draft.id, m.day_type, m.slot, mi + 1));
    for (const it of m.items)
      stmts.push(
        db
          .prepare(`INSERT INTO meal_plan_items (id, meal_id, food_id, recipe_id, grams, household_measure) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`)
          .bind(crypto.randomUUID(), mealId, it.kind === "food" ? it.id : null, it.kind === "recipe" ? it.id : null, it.grams, it.household_measure || null),
      );
  });
  try {
    await db.batch(stmts);
  } catch (e) {
    return dbError(e);
  }
  const conflicts = await db
    .prepare(
      `SELECT DISTINCT c.reason, c.detail, COALESCE(f.name, r.name) AS name FROM meal_plan_conflicts c
         LEFT JOIN foods f ON f.id = c.food_id LEFT JOIN recipes r ON r.id = c.recipe_id WHERE c.plan_id = ?1`,
    )
    .bind(draft.id)
    .all<{ reason: string; detail: string; name: string }>();
  return Response.json({ ok: true, draftId: draft.id, conflicts: conflicts.results });
};
