-- Training plans + nutrition (foods, allergens, restrictions, meal plans) with DB-level allergy safety.
--
-- SAFETY (non negotiable): a meal plan cannot leave 'borrador' while the view
-- meal_plan_conflicts has rows for it. Enforced by triggers, so even a buggy
-- endpoint cannot publish a plan with an allergen the student must avoid.

-- ================================================================ TRAINING

CREATE TABLE exercises (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  muscle_group  TEXT NOT NULL,
  equipment     TEXT NOT NULL DEFAULT 'ninguno',
  modality      TEXT NOT NULL CHECK (modality IN ('casa', 'gym', 'ambos')),
  cue           TEXT
);

CREATE TABLE workout_plans (
  id          TEXT PRIMARY KEY,
  student_id  TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'borrador' CHECK (status IN ('borrador', 'publicado', 'archivado')),
  starts_on   TEXT NOT NULL,
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX idx_workout_plans_student ON workout_plans(student_id, status);

CREATE TABLE workout_days (
  id        TEXT PRIMARY KEY,
  plan_id   TEXT NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  weekday   INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  title     TEXT NOT NULL,
  location  TEXT NOT NULL CHECK (location IN ('casa', 'gym')),
  UNIQUE (plan_id, weekday)
);

CREATE TABLE workout_items (
  id           TEXT PRIMARY KEY,
  day_id       TEXT NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  exercise_id  TEXT NOT NULL REFERENCES exercises(id),
  position     INTEGER NOT NULL,
  sets         INTEGER NOT NULL CHECK (sets BETWEEN 1 AND 10),
  reps         TEXT NOT NULL,           -- "10-12", "30 s", "AMRAP"
  load_kg      REAL CHECK (load_kg BETWEEN 0 AND 500),
  rest_s       INTEGER CHECK (rest_s BETWEEN 0 AND 600),
  rir          INTEGER CHECK (rir BETWEEN 0 AND 6),
  notes        TEXT
);

CREATE TABLE workout_day_logs (
  id          TEXT PRIMARY KEY,
  student_id  TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  day_id      TEXT NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  done_on     TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('hecho', 'parcial')),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (student_id, day_id, done_on)
);

-- ================================================================ FOODS

-- Groups from the Guías Alimentarias Basadas en Alimentos para Colombia (GABA).
CREATE TABLE foods (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  aliases             TEXT,
  food_group          TEXT NOT NULL CHECK (food_group IN ('cereales_tuberculos_platanos', 'frutas_verduras', 'leche_derivados', 'carnes_huevos_leguminosas', 'grasas', 'azucares')),
  ref_grams           REAL NOT NULL CHECK (ref_grams > 0),
  household_measure   TEXT NOT NULL,          -- for ref_grams, e.g. "1 arepa mediana"
  kcal                REAL NOT NULL,          -- all nutrients per 100 g
  protein_g           REAL NOT NULL,
  carbs_g             REAL NOT NULL,
  fiber_g             REAL NOT NULL DEFAULT 0,
  fat_g               REAL NOT NULL,
  sat_fat_g           REAL,
  sodium_mg           REAL,
  sugars_g            REAL,
  source              TEXT NOT NULL CHECK (source IN ('tcac', 'seed_aproximado', 'coach')),
  allergens_reviewed  INTEGER NOT NULL DEFAULT 0 CHECK (allergens_reviewed IN (0, 1)),
  market_section      TEXT NOT NULL DEFAULT 'despensa' CHECK (market_section IN ('fruver', 'carnes', 'lacteos', 'granos', 'panaderia', 'despensa')),
  created_by          TEXT REFERENCES users(id) ON DELETE SET NULL
);

-- Allergen catalog: Colombian mandatory labelling list extended with the EU list.
CREATE TABLE allergens (
  code   TEXT PRIMARY KEY,
  label  TEXT NOT NULL
);
INSERT INTO allergens (code, label) VALUES
  ('gluten', 'Cereales con gluten'), ('crustaceos', 'Crustáceos'), ('moluscos', 'Moluscos'), ('huevo', 'Huevo'),
  ('pescado', 'Pescado'), ('mani', 'Maní'), ('soya', 'Soya'), ('leche', 'Leche'), ('frutos_secos', 'Frutos secos de árbol'),
  ('sesamo', 'Sésamo / ajonjolí'), ('sulfitos', 'Sulfitos'), ('mostaza', 'Mostaza'), ('apio', 'Apio'), ('altramuces', 'Altramuces');

CREATE TABLE food_allergens (
  food_id   TEXT NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  allergen  TEXT NOT NULL REFERENCES allergens(code),
  presence  TEXT NOT NULL DEFAULT 'contiene' CHECK (presence IN ('contiene', 'trazas')),
  PRIMARY KEY (food_id, allergen)
);

-- Tags drive lifestyle / intolerance filters: animal, carne, cerdo, res, pescado, mariscos, lacteo, huevo, miel, picante, avena_no_certificada.
CREATE TABLE food_tags (
  food_id  TEXT NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  tag      TEXT NOT NULL,
  PRIMARY KEY (food_id, tag)
);

CREATE TABLE recipes (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  preparation   TEXT,
  minutes       INTEGER,
  cost_level    TEXT CHECK (cost_level IN ('bajo', 'medio', 'alto')),
  created_by    TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE recipe_ingredients (
  recipe_id  TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  food_id    TEXT NOT NULL REFERENCES foods(id),
  grams      REAL NOT NULL CHECK (grams > 0),
  PRIMARY KEY (recipe_id, food_id)
);

-- Recipe allergens/tags are INHERITED from ingredients; there is no column to write them by hand.
CREATE VIEW recipe_allergens AS
  SELECT ri.recipe_id, fa.allergen,
         CASE WHEN SUM(fa.presence = 'contiene') > 0 THEN 'contiene' ELSE 'trazas' END AS presence
    FROM recipe_ingredients ri JOIN food_allergens fa ON fa.food_id = ri.food_id
   GROUP BY ri.recipe_id, fa.allergen;

CREATE VIEW recipe_tags AS
  SELECT DISTINCT ri.recipe_id, ft.tag FROM recipe_ingredients ri JOIN food_tags ft ON ft.food_id = ri.food_id;

-- ================================================================ RESTRICTIONS

CREATE TABLE dietary_restrictions (
  id                     TEXT PRIMARY KEY,
  student_id             TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type                   TEXT NOT NULL CHECK (type IN ('alergia', 'intolerancia', 'condicion', 'preferencia', 'no_le_gusta')),
  allergen               TEXT REFERENCES allergens(code),
  restriction_tag        TEXT,                -- e.g. vegano, vegetariano, sin_lacteos, sin_cerdo
  food_id                TEXT REFERENCES foods(id),   -- for 'no_le_gusta' or mapped 'otro'
  severity               TEXT CHECK (severity IN ('leve', 'moderada', 'grave')),
  requires_nutritionist  INTEGER NOT NULL DEFAULT 0 CHECK (requires_nutritionist IN (0, 1)),
  note                   TEXT,
  created_at             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  CHECK (type <> 'alergia' OR (allergen IS NOT NULL AND severity IS NOT NULL)),
  CHECK (allergen IS NOT NULL OR restriction_tag IS NOT NULL OR food_id IS NOT NULL)
);
CREATE INDEX idx_dietary_restrictions_student ON dietary_restrictions(student_id);

-- Which food tags each lifestyle/intolerance restriction excludes.
CREATE TABLE restriction_tag_map (
  restriction_tag  TEXT NOT NULL,
  food_tag         TEXT NOT NULL,
  PRIMARY KEY (restriction_tag, food_tag)
);
INSERT INTO restriction_tag_map (restriction_tag, food_tag) VALUES
  ('vegano', 'animal'), ('vegano', 'miel'),
  ('vegetariano', 'carne'), ('vegetariano', 'pescado'), ('vegetariano', 'mariscos'),
  ('pescetariano', 'carne'),
  ('sin_cerdo', 'cerdo'), ('sin_res', 'res'),
  ('sin_lacteos', 'lacteo'), ('sin_lactosa', 'lactosa'), ('sin_picante', 'picante'),
  ('celiaquia', 'gluten'), ('celiaquia', 'avena_no_certificada');

-- ================================================================ NUTRITION PLANS

CREATE TABLE nutrition_targets (
  student_id            TEXT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  kcal                  INTEGER NOT NULL CHECK (kcal BETWEEN 1000 AND 6000),
  protein_g             INTEGER NOT NULL,
  fat_g                 INTEGER NOT NULL,
  carbs_g               INTEGER NOT NULL,
  fiber_g               INTEGER,
  water_l               REAL,
  deficit_pct           REAL,
  deficit_confirmed_by  TEXT REFERENCES users(id),
  confirmed_at          TEXT,
  updated_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  CHECK (deficit_pct IS NULL OR deficit_pct <= 25 OR deficit_confirmed_by IS NOT NULL)
);

CREATE TABLE meal_plans (
  id                          TEXT PRIMARY KEY,
  student_id                  TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  version                     INTEGER NOT NULL DEFAULT 1,
  status                      TEXT NOT NULL DEFAULT 'borrador' CHECK (status IN ('borrador', 'publicado', 'aprobado', 'archivado')),
  kind                        TEXT NOT NULL DEFAULT 'guia' CHECK (kind IN ('guia', 'plan')),
  mode                        TEXT NOT NULL DEFAULT 'menu' CHECK (mode IN ('menu', 'intercambios')),
  approved_by_nutritionist_id TEXT REFERENCES users(id),
  change_reason               TEXT,
  created_by                  TEXT REFERENCES users(id),
  created_at                  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (student_id, version)
);

CREATE TABLE meal_plan_meals (
  id        TEXT PRIMARY KEY,
  plan_id   TEXT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_type  TEXT NOT NULL DEFAULT 'todos' CHECK (day_type IN ('todos', 'entreno', 'descanso')),
  slot      TEXT NOT NULL CHECK (slot IN ('desayuno', 'media_manana', 'almuerzo', 'onces', 'cena', 'pre_entreno', 'post_entreno')),
  position  INTEGER NOT NULL
);

CREATE TABLE meal_plan_items (
  id                 TEXT PRIMARY KEY,
  meal_id            TEXT NOT NULL REFERENCES meal_plan_meals(id) ON DELETE CASCADE,
  food_id            TEXT REFERENCES foods(id),
  recipe_id          TEXT REFERENCES recipes(id),
  grams              REAL NOT NULL CHECK (grams > 0),
  household_measure  TEXT,
  CHECK ((food_id IS NULL) <> (recipe_id IS NULL))
);

CREATE TABLE meal_logs (
  id          TEXT PRIMARY KEY,
  student_id  TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  meal_id     TEXT NOT NULL REFERENCES meal_plan_meals(id) ON DELETE CASCADE,
  logged_on   TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('cumpli', 'parcial', 'no')),
  photo_key   TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (student_id, meal_id, logged_on)
);

-- Every (plan, food) used, directly or through a recipe.
CREATE VIEW meal_plan_foods AS
  SELECT m.plan_id, i.id AS item_id, i.food_id, NULL AS recipe_id
    FROM meal_plan_items i JOIN meal_plan_meals m ON m.id = i.meal_id WHERE i.food_id IS NOT NULL
  UNION ALL
  SELECT m.plan_id, i.id, ri.food_id, i.recipe_id
    FROM meal_plan_items i JOIN meal_plan_meals m ON m.id = i.meal_id JOIN recipe_ingredients ri ON ri.recipe_id = i.recipe_id;

-- The deterministic safety check. One row = one reason the plan is unsafe for its student.
CREATE VIEW meal_plan_conflicts AS
  -- allergens: 'contiene' always blocks; 'trazas' blocks only for severe allergies
  SELECT p.id AS plan_id, pf.item_id, pf.food_id, pf.recipe_id, 'alergia' AS reason, r.allergen AS detail
    FROM meal_plans p
    JOIN meal_plan_foods pf ON pf.plan_id = p.id
    JOIN dietary_restrictions r ON r.student_id = p.student_id AND r.allergen IS NOT NULL
    JOIN food_allergens fa ON fa.food_id = pf.food_id AND fa.allergen = r.allergen
   WHERE fa.presence = 'contiene' OR (fa.presence = 'trazas' AND r.severity = 'grave')
  UNION ALL
  -- lifestyle / intolerance / condition tags
  SELECT p.id, pf.item_id, pf.food_id, pf.recipe_id, r.type, r.restriction_tag
    FROM meal_plans p
    JOIN meal_plan_foods pf ON pf.plan_id = p.id
    JOIN dietary_restrictions r ON r.student_id = p.student_id AND r.restriction_tag IS NOT NULL
    JOIN restriction_tag_map m ON m.restriction_tag = r.restriction_tag
    JOIN food_tags ft ON ft.food_id = pf.food_id AND ft.tag = m.food_tag
  UNION ALL
  -- celiac-style restrictions also block foods carrying the gluten allergen
  SELECT p.id, pf.item_id, pf.food_id, pf.recipe_id, r.type, r.restriction_tag
    FROM meal_plans p
    JOIN meal_plan_foods pf ON pf.plan_id = p.id
    JOIN dietary_restrictions r ON r.student_id = p.student_id AND r.restriction_tag = 'celiaquia'
    JOIN food_allergens fa ON fa.food_id = pf.food_id AND fa.allergen = 'gluten'
  UNION ALL
  -- foods the student dislikes or that the coach mapped from 'otro'
  SELECT p.id, pf.item_id, pf.food_id, pf.recipe_id, r.type, 'alimento'
    FROM meal_plans p
    JOIN meal_plan_foods pf ON pf.plan_id = p.id
    JOIN dietary_restrictions r ON r.student_id = p.student_id AND r.food_id = pf.food_id
  UNION ALL
  -- students with any allergy cannot receive foods whose allergens were never reviewed
  SELECT p.id, pf.item_id, pf.food_id, pf.recipe_id, 'sin_revisar', 'alergenos_sin_revisar'
    FROM meal_plans p
    JOIN meal_plan_foods pf ON pf.plan_id = p.id
    JOIN foods f ON f.id = pf.food_id AND f.allergens_reviewed = 0
   WHERE EXISTS (SELECT 1 FROM dietary_restrictions r WHERE r.student_id = p.student_id AND r.type = 'alergia');

-- Publishing guards.
CREATE TRIGGER meal_plans_block_unsafe_publish
BEFORE UPDATE OF status ON meal_plans
WHEN NEW.status IN ('publicado', 'aprobado')
 AND EXISTS (SELECT 1 FROM meal_plan_conflicts c WHERE c.plan_id = NEW.id)
BEGIN
  SELECT RAISE(ABORT, 'plan_con_conflictos_de_restricciones');
END;

CREATE TRIGGER meal_plans_require_nutritionist
BEFORE UPDATE OF status ON meal_plans
WHEN NEW.status = 'publicado'
 AND EXISTS (SELECT 1 FROM dietary_restrictions r WHERE r.student_id = NEW.student_id AND r.requires_nutritionist = 1)
BEGIN
  SELECT RAISE(ABORT, 'requiere_aprobacion_de_nutricionista');
END;

CREATE TRIGGER meal_plans_approval_needs_nutritionist
BEFORE UPDATE OF status ON meal_plans
WHEN NEW.status = 'aprobado' AND NEW.approved_by_nutritionist_id IS NULL
BEGIN
  SELECT RAISE(ABORT, 'aprobacion_sin_nutricionista');
END;

-- A published plan is frozen: changes require a new version.
CREATE TRIGGER meal_plan_items_frozen_insert
BEFORE INSERT ON meal_plan_items
WHEN (SELECT p.status FROM meal_plans p JOIN meal_plan_meals m ON m.plan_id = p.id WHERE m.id = NEW.meal_id) <> 'borrador'
BEGIN
  SELECT RAISE(ABORT, 'plan_publicado_no_editable');
END;

CREATE TRIGGER meal_plan_items_frozen_update
BEFORE UPDATE ON meal_plan_items
WHEN (SELECT p.status FROM meal_plans p JOIN meal_plan_meals m ON m.plan_id = p.id WHERE m.id = NEW.meal_id) <> 'borrador'
BEGIN
  SELECT RAISE(ABORT, 'plan_publicado_no_editable');
END;

-- New restrictions on a student re-check active plans: a now-unsafe plan goes back to draft
-- and an alert is raised for the coach (alerts table arrives with the coach panel phase; until then the plan simply unpublishes).
CREATE TRIGGER dietary_restrictions_revalidate
AFTER INSERT ON dietary_restrictions
BEGIN
  UPDATE meal_plans SET status = 'borrador', change_reason = 'Revalidación: nueva restricción del estudiante'
   WHERE student_id = NEW.student_id AND status IN ('publicado', 'aprobado')
     AND EXISTS (SELECT 1 FROM meal_plan_conflicts c WHERE c.plan_id = meal_plans.id);
END;
