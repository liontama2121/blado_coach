-- DEV ONLY. Training + nutrition demo data.
-- Food values are APPROXIMATE (per 100 g), marked source='seed_aproximado'.
-- Replace them with the official ICBF TCAC values via scripts/import-tcac.ts.

-- ================================================================ FOODS
INSERT INTO foods (id, name, aliases, food_group, ref_grams, household_measure, kcal, protein_g, carbs_g, fiber_g, fat_g, source, allergens_reviewed, market_section) VALUES
-- cereales, raíces, tubérculos y plátanos
('f-arepa', 'Arepa de maíz blanco', 'arepa', 'cereales_tuberculos_platanos', 80, '1 arepa mediana', 219, 4.6, 46, 3.6, 1.5, 'seed_aproximado', 1, 'panaderia'),
('f-arroz', 'Arroz blanco cocido', NULL, 'cereales_tuberculos_platanos', 150, '1 taza', 130, 2.7, 28, 0.4, 0.3, 'seed_aproximado', 1, 'granos'),
('f-arroz-int', 'Arroz integral cocido', NULL, 'cereales_tuberculos_platanos', 150, '1 taza', 112, 2.3, 24, 1.8, 0.8, 'seed_aproximado', 1, 'granos'),
('f-papa-criolla', 'Papa criolla cocida', 'papa amarilla', 'cereales_tuberculos_platanos', 120, '5 papitas', 90, 2, 20, 1.8, 0.1, 'seed_aproximado', 1, 'fruver'),
('f-papa', 'Papa pastusa cocida', 'papa', 'cereales_tuberculos_platanos', 150, '1 papa mediana', 86, 1.9, 20, 1.8, 0.1, 'seed_aproximado', 1, 'fruver'),
('f-yuca', 'Yuca cocida', NULL, 'cereales_tuberculos_platanos', 120, '1 trozo mediano', 152, 1.4, 36, 1.8, 0.3, 'seed_aproximado', 1, 'fruver'),
('f-platano-mad', 'Plátano maduro cocido', 'maduro', 'cereales_tuberculos_platanos', 120, '1/2 plátano', 122, 1.3, 32, 2.3, 0.4, 'seed_aproximado', 1, 'fruver'),
('f-platano-ver', 'Plátano verde cocido', 'patacón sin freír', 'cereales_tuberculos_platanos', 120, '1/2 plátano', 116, 1, 31, 2.3, 0.2, 'seed_aproximado', 1, 'fruver'),
('f-avena', 'Avena en hojuelas', 'avena', 'cereales_tuberculos_platanos', 40, '4 cucharadas', 379, 13, 68, 10, 6.5, 'seed_aproximado', 1, 'granos'),
('f-pan-int', 'Pan integral', NULL, 'cereales_tuberculos_platanos', 50, '2 tajadas', 247, 13, 41, 7, 3.4, 'seed_aproximado', 1, 'panaderia'),
('f-pasta', 'Pasta cocida', 'espaguetis', 'cereales_tuberculos_platanos', 140, '1 taza', 158, 5.8, 31, 1.8, 0.9, 'seed_aproximado', 1, 'granos'),
('f-mazorca', 'Mazorca cocida', 'maíz tierno', 'cereales_tuberculos_platanos', 100, '1/2 mazorca', 96, 3.4, 21, 2.4, 1.5, 'seed_aproximado', 1, 'fruver'),
('f-quinua', 'Quinua cocida', NULL, 'cereales_tuberculos_platanos', 140, '3/4 taza', 120, 4.4, 21, 2.8, 1.9, 'seed_aproximado', 1, 'granos'),
('f-arracacha', 'Arracacha cocida', NULL, 'cereales_tuberculos_platanos', 100, '1 trozo', 100, 1, 24, 2, 0.2, 'seed_aproximado', 1, 'fruver'),
-- frutas y verduras
('f-banano', 'Banano', NULL, 'frutas_verduras', 100, '1 banano pequeño', 89, 1.1, 23, 2.6, 0.3, 'seed_aproximado', 1, 'fruver'),
('f-guayaba', 'Guayaba', NULL, 'frutas_verduras', 100, '1 guayaba mediana', 68, 2.6, 14, 5.4, 1, 'seed_aproximado', 1, 'fruver'),
('f-mango', 'Mango', NULL, 'frutas_verduras', 150, '1 taza picado', 60, 0.8, 15, 1.6, 0.4, 'seed_aproximado', 1, 'fruver'),
('f-papaya', 'Papaya', NULL, 'frutas_verduras', 150, '1 taza picada', 43, 0.5, 11, 1.7, 0.3, 'seed_aproximado', 1, 'fruver'),
('f-pina', 'Piña', NULL, 'frutas_verduras', 150, '1 taza picada', 50, 0.5, 13, 1.4, 0.1, 'seed_aproximado', 1, 'fruver'),
('f-fresa', 'Fresas', NULL, 'frutas_verduras', 150, '1 taza', 32, 0.7, 7.7, 2, 0.3, 'seed_aproximado', 1, 'fruver'),
('f-mandarina', 'Mandarina', NULL, 'frutas_verduras', 100, '1 mandarina', 53, 0.8, 13, 1.8, 0.3, 'seed_aproximado', 1, 'fruver'),
('f-manzana', 'Manzana', NULL, 'frutas_verduras', 130, '1 manzana', 52, 0.3, 14, 2.4, 0.2, 'seed_aproximado', 1, 'fruver'),
('f-maracuya', 'Maracuyá (pulpa)', NULL, 'frutas_verduras', 100, '2 maracuyás', 97, 2.2, 23, 10, 0.7, 'seed_aproximado', 1, 'fruver'),
('f-lulo', 'Lulo', NULL, 'frutas_verduras', 100, '2 lulos', 25, 0.6, 6, 1.1, 0.1, 'seed_aproximado', 1, 'fruver'),
('f-uchuva', 'Uchuvas', NULL, 'frutas_verduras', 100, '1 taza', 53, 1.9, 11, 4.9, 0.7, 'seed_aproximado', 1, 'fruver'),
('f-mora', 'Mora', NULL, 'frutas_verduras', 100, '1 taza', 43, 1.4, 10, 5.3, 0.5, 'seed_aproximado', 1, 'fruver'),
('f-tomate', 'Tomate', NULL, 'frutas_verduras', 100, '1 tomate', 18, 0.9, 3.9, 1.2, 0.2, 'seed_aproximado', 1, 'fruver'),
('f-cebolla', 'Cebolla cabezona', NULL, 'frutas_verduras', 50, '1/2 cebolla', 40, 1.1, 9.3, 1.7, 0.1, 'seed_aproximado', 1, 'fruver'),
('f-zanahoria', 'Zanahoria', NULL, 'frutas_verduras', 80, '1 zanahoria', 41, 0.9, 10, 2.8, 0.2, 'seed_aproximado', 1, 'fruver'),
('f-brocoli', 'Brócoli', NULL, 'frutas_verduras', 100, '1 taza', 34, 2.8, 7, 2.6, 0.4, 'seed_aproximado', 1, 'fruver'),
('f-espinaca', 'Espinaca', NULL, 'frutas_verduras', 60, '2 tazas crudas', 23, 2.9, 3.6, 2.2, 0.4, 'seed_aproximado', 1, 'fruver'),
('f-lechuga', 'Lechuga', NULL, 'frutas_verduras', 50, '1 taza', 15, 1.4, 2.9, 1.3, 0.2, 'seed_aproximado', 1, 'fruver'),
('f-pepino', 'Pepino', NULL, 'frutas_verduras', 100, '1/2 pepino', 15, 0.7, 3.6, 0.5, 0.1, 'seed_aproximado', 1, 'fruver'),
('f-habichuela', 'Habichuela', NULL, 'frutas_verduras', 80, '1 taza', 31, 1.8, 7, 2.7, 0.2, 'seed_aproximado', 1, 'fruver'),
('f-ahuyama', 'Ahuyama', NULL, 'frutas_verduras', 100, '1 trozo', 26, 1, 6.5, 0.5, 0.1, 'seed_aproximado', 1, 'fruver'),
-- leche y derivados
('f-leche', 'Leche entera', NULL, 'leche_derivados', 200, '1 vaso', 61, 3.2, 4.8, 0, 3.3, 'seed_aproximado', 1, 'lacteos'),
('f-leche-desl', 'Leche deslactosada descremada', NULL, 'leche_derivados', 200, '1 vaso', 35, 3.4, 5, 0, 0.2, 'seed_aproximado', 1, 'lacteos'),
('f-yogur', 'Yogur natural', NULL, 'leche_derivados', 150, '1 vaso pequeño', 61, 3.5, 4.7, 0, 3.3, 'seed_aproximado', 1, 'lacteos'),
('f-kumis', 'Kumis', NULL, 'leche_derivados', 200, '1 vaso', 70, 3, 9, 0, 2.5, 'seed_aproximado', 1, 'lacteos'),
('f-queso-camp', 'Queso campesino', NULL, 'leche_derivados', 40, '1 tajada', 280, 18, 3, 0, 22, 'seed_aproximado', 1, 'lacteos'),
('f-queso-cost', 'Queso costeño', NULL, 'leche_derivados', 30, '1 trozo', 340, 20, 2, 0, 28, 'seed_aproximado', 1, 'lacteos'),
('f-cuajada', 'Cuajada', NULL, 'leche_derivados', 50, '1 tajada', 180, 12, 3, 0, 13, 'seed_aproximado', 1, 'lacteos'),
-- carnes, huevos, leguminosas, frutos secos y semillas
('f-huevo', 'Huevo', NULL, 'carnes_huevos_leguminosas', 50, '1 huevo', 143, 12.6, 0.7, 0, 9.5, 'seed_aproximado', 1, 'carnes'),
('f-pollo', 'Pechuga de pollo cocida', 'pollo', 'carnes_huevos_leguminosas', 100, '1 porción (palma)', 165, 31, 0, 0, 3.6, 'seed_aproximado', 1, 'carnes'),
('f-res', 'Carne de res magra cocida', 'carne', 'carnes_huevos_leguminosas', 100, '1 porción (palma)', 217, 26, 0, 0, 12, 'seed_aproximado', 1, 'carnes'),
('f-cerdo', 'Lomo de cerdo cocido', 'cerdo', 'carnes_huevos_leguminosas', 100, '1 porción (palma)', 242, 27, 0, 0, 14, 'seed_aproximado', 1, 'carnes'),
('f-tilapia', 'Tilapia cocida', 'mojarra', 'carnes_huevos_leguminosas', 120, '1 filete', 128, 26, 0, 0, 2.7, 'seed_aproximado', 1, 'carnes'),
('f-atun', 'Atún en agua', NULL, 'carnes_huevos_leguminosas', 80, '1/2 lata', 116, 26, 0, 0, 1, 'seed_aproximado', 1, 'despensa'),
('f-sardina', 'Sardinas en salsa de tomate', NULL, 'carnes_huevos_leguminosas', 90, '1/2 lata', 185, 21, 1, 0, 10, 'seed_aproximado', 1, 'despensa'),
('f-frijol', 'Fríjol cargamanto cocido', 'fríjoles', 'carnes_huevos_leguminosas', 150, '3/4 taza', 127, 8.7, 23, 8, 0.5, 'seed_aproximado', 1, 'granos'),
('f-lenteja', 'Lentejas cocidas', NULL, 'carnes_huevos_leguminosas', 150, '3/4 taza', 116, 9, 20, 8, 0.4, 'seed_aproximado', 1, 'granos'),
('f-garbanzo', 'Garbanzos cocidos', NULL, 'carnes_huevos_leguminosas', 150, '3/4 taza', 164, 8.9, 27, 7.6, 2.6, 'seed_aproximado', 1, 'granos'),
('f-arveja', 'Arveja seca cocida', NULL, 'carnes_huevos_leguminosas', 150, '3/4 taza', 118, 8.3, 21, 8.3, 0.4, 'seed_aproximado', 1, 'granos'),
('f-mani', 'Maní tostado', NULL, 'carnes_huevos_leguminosas', 30, '1 puñado', 585, 24, 21, 8, 49, 'seed_aproximado', 1, 'despensa'),
('f-almendra', 'Almendras', NULL, 'carnes_huevos_leguminosas', 30, '1 puñado', 579, 21, 22, 12, 50, 'seed_aproximado', 1, 'despensa'),
('f-mant-mani', 'Mantequilla de maní', NULL, 'carnes_huevos_leguminosas', 32, '2 cucharadas', 588, 25, 20, 6, 50, 'seed_aproximado', 1, 'despensa'),
('f-whey', 'Proteína de suero (whey)', 'proteína en polvo', 'carnes_huevos_leguminosas', 30, '1 scoop', 380, 78, 8, 0, 5, 'seed_aproximado', 1, 'despensa'),
('f-tofu', 'Tofu', NULL, 'carnes_huevos_leguminosas', 100, '1 bloque pequeño', 76, 8, 1.9, 0.3, 4.8, 'seed_aproximado', 1, 'despensa'),
-- grasas
('f-aguacate', 'Aguacate', NULL, 'grasas', 50, '1/4 aguacate', 160, 2, 8.5, 6.7, 14.7, 'seed_aproximado', 1, 'fruver'),
('f-aceite-oliva', 'Aceite de oliva', NULL, 'grasas', 5, '1 cucharadita', 884, 0, 0, 0, 100, 'seed_aproximado', 1, 'despensa'),
('f-aceite', 'Aceite vegetal', NULL, 'grasas', 5, '1 cucharadita', 884, 0, 0, 0, 100, 'seed_aproximado', 1, 'despensa'),
('f-mantequilla', 'Mantequilla', NULL, 'grasas', 5, '1 cucharadita', 717, 0.9, 0.1, 0, 81, 'seed_aproximado', 1, 'lacteos'),
-- azúcares
('f-panela', 'Panela', NULL, 'azucares', 10, '1 cucharada', 380, 0.4, 95, 0, 0.1, 'seed_aproximado', 1, 'despensa'),
('f-miel', 'Miel de abejas', NULL, 'azucares', 10, '1 cucharada', 304, 0.3, 82, 0.2, 0, 'seed_aproximado', 1, 'despensa'),
('f-bocadillo', 'Bocadillo de guayaba', NULL, 'azucares', 30, '1 bocadillo', 300, 0.5, 75, 2, 0.1, 'seed_aproximado', 1, 'despensa');

INSERT INTO food_allergens (food_id, allergen, presence) VALUES
('f-avena', 'gluten', 'trazas'),
('f-pan-int', 'gluten', 'contiene'), ('f-pan-int', 'sesamo', 'trazas'),
('f-pasta', 'gluten', 'contiene'), ('f-pasta', 'huevo', 'trazas'),
('f-leche', 'leche', 'contiene'), ('f-leche-desl', 'leche', 'contiene'), ('f-yogur', 'leche', 'contiene'), ('f-kumis', 'leche', 'contiene'),
('f-queso-camp', 'leche', 'contiene'), ('f-queso-cost', 'leche', 'contiene'), ('f-cuajada', 'leche', 'contiene'), ('f-mantequilla', 'leche', 'contiene'),
('f-whey', 'leche', 'contiene'), ('f-whey', 'soya', 'trazas'),
('f-huevo', 'huevo', 'contiene'),
('f-tilapia', 'pescado', 'contiene'), ('f-atun', 'pescado', 'contiene'), ('f-sardina', 'pescado', 'contiene'),
('f-mani', 'mani', 'contiene'), ('f-mant-mani', 'mani', 'contiene'),
('f-almendra', 'frutos_secos', 'contiene'), ('f-almendra', 'mani', 'trazas'),
('f-tofu', 'soya', 'contiene');

INSERT INTO food_tags (food_id, tag) VALUES
('f-avena', 'avena_no_certificada'),
('f-leche', 'animal'), ('f-leche', 'lacteo'), ('f-leche', 'lactosa'),
('f-leche-desl', 'animal'), ('f-leche-desl', 'lacteo'),
('f-yogur', 'animal'), ('f-yogur', 'lacteo'), ('f-yogur', 'lactosa'),
('f-kumis', 'animal'), ('f-kumis', 'lacteo'), ('f-kumis', 'lactosa'),
('f-queso-camp', 'animal'), ('f-queso-camp', 'lacteo'), ('f-queso-camp', 'lactosa'),
('f-queso-cost', 'animal'), ('f-queso-cost', 'lacteo'), ('f-queso-cost', 'lactosa'),
('f-cuajada', 'animal'), ('f-cuajada', 'lacteo'), ('f-cuajada', 'lactosa'),
('f-mantequilla', 'animal'), ('f-mantequilla', 'lacteo'),
('f-whey', 'animal'), ('f-whey', 'lacteo'), ('f-whey', 'lactosa'),
('f-huevo', 'animal'), ('f-huevo', 'huevo'),
('f-pollo', 'animal'), ('f-pollo', 'carne'),
('f-res', 'animal'), ('f-res', 'carne'), ('f-res', 'res'),
('f-cerdo', 'animal'), ('f-cerdo', 'carne'), ('f-cerdo', 'cerdo'),
('f-tilapia', 'animal'), ('f-tilapia', 'pescado'),
('f-atun', 'animal'), ('f-atun', 'pescado'),
('f-sardina', 'animal'), ('f-sardina', 'pescado'),
('f-miel', 'miel');

-- ================================================================ RECIPES (allergens/macros inherited from ingredients)
INSERT INTO recipes (id, name, preparation, minutes, cost_level) VALUES
('r-ensalada', 'Ensalada fresca', 'Pica lechuga, tomate y pepino. Agrega una cucharadita de aceite de oliva, limón y sal al gusto.', 10, 'bajo'),
('r-hogao', 'Hogao casero', 'Sofríe cebolla y tomate picados en una cucharadita de aceite a fuego medio por 10 minutos.', 15, 'bajo'),
('r-batido', 'Batido de banano y avena (deslactosado)', 'Licúa leche deslactosada, banano y avena. Sin azúcar añadida.', 5, 'bajo'),
('r-ajiaco', 'Ajiaco ligero', 'Cocina pollo, papa criolla, papa pastusa y mazorca en agua con guascas. Sirve sin crema.', 60, 'medio');
INSERT INTO recipe_ingredients (recipe_id, food_id, grams) VALUES
('r-ensalada', 'f-lechuga', 60), ('r-ensalada', 'f-tomate', 60), ('r-ensalada', 'f-pepino', 40), ('r-ensalada', 'f-aceite-oliva', 5),
('r-hogao', 'f-tomate', 50), ('r-hogao', 'f-cebolla', 20), ('r-hogao', 'f-aceite', 3),
('r-batido', 'f-leche-desl', 200), ('r-batido', 'f-banano', 100), ('r-batido', 'f-avena', 30),
('r-ajiaco', 'f-pollo', 100), ('r-ajiaco', 'f-papa-criolla', 80), ('r-ajiaco', 'f-papa', 80), ('r-ajiaco', 'f-mazorca', 60);

-- ================================================================ RESTRICTIONS + TARGETS
INSERT INTO dietary_restrictions (id, student_id, type, restriction_tag, food_id, severity, note) VALUES
('dr-mv-1', 's-mariana', 'intolerancia', 'sin_lactosa', NULL, NULL, 'Le cae mal la leche; deslactosada sí'),
('dr-mv-2', 's-mariana', 'no_le_gusta', NULL, 'f-tilapia', NULL, 'No le gusta el pescado blanco');
INSERT INTO dietary_restrictions (id, student_id, type, allergen, severity, note) VALUES
('dr-ar-1', 's-andres', 'alergia', 'mani', 'grave', 'Alergia al maní confirmada. Evitar también trazas.');

INSERT INTO nutrition_targets (student_id, kcal, protein_g, fat_g, carbs_g, fiber_g, water_l, deficit_pct) VALUES
('s-mariana', 1700, 125, 55, 176, 25, 2.3, 20),
('s-andres', 3200, 155, 70, 487, 35, 3.2, NULL);

-- ================================================================ MEAL PLANS (created as drafts, published below so triggers validate them)
INSERT INTO meal_plans (id, student_id, version, kind, mode, change_reason, created_by) VALUES
('mp-mv-1', 's-mariana', 1, 'guia', 'menu', 'Plan inicial', 'u-coach-demo'),
('mp-ar-1', 's-andres', 1, 'guia', 'menu', 'Plan inicial', 'u-coach-demo');

INSERT INTO meal_plan_meals (id, plan_id, day_type, slot, position) VALUES
('mm-mv-1', 'mp-mv-1', 'todos', 'desayuno', 1),
('mm-mv-2', 'mp-mv-1', 'todos', 'media_manana', 2),
('mm-mv-pre', 'mp-mv-1', 'entreno', 'pre_entreno', 3),
('mm-mv-3', 'mp-mv-1', 'todos', 'almuerzo', 4),
('mm-mv-4', 'mp-mv-1', 'todos', 'onces', 5),
('mm-mv-5', 'mp-mv-1', 'todos', 'cena', 6),
('mm-ar-1', 'mp-ar-1', 'todos', 'desayuno', 1),
('mm-ar-2', 'mp-ar-1', 'todos', 'media_manana', 2),
('mm-ar-3', 'mp-ar-1', 'todos', 'almuerzo', 3),
('mm-ar-post', 'mp-ar-1', 'entreno', 'post_entreno', 4),
('mm-ar-4', 'mp-ar-1', 'descanso', 'onces', 5),
('mm-ar-5', 'mp-ar-1', 'todos', 'cena', 6);

INSERT INTO meal_plan_items (id, meal_id, food_id, recipe_id, grams, household_measure) VALUES
('mi-1', 'mm-mv-1', 'f-arepa', NULL, 80, '1 arepa mediana'),
('mi-2', 'mm-mv-1', 'f-huevo', NULL, 100, '2 huevos'),
('mi-3', 'mm-mv-1', NULL, 'r-hogao', 60, '3 cucharadas'),
('mi-4', 'mm-mv-2', 'f-guayaba', NULL, 100, '1 guayaba mediana'),
('mi-5', 'mm-mv-2', 'f-almendra', NULL, 15, '10 almendras'),
('mi-6', 'mm-mv-pre', 'f-banano', NULL, 100, '1 banano pequeño'),
('mi-7', 'mm-mv-3', 'f-arroz-int', NULL, 120, '3/4 taza'),
('mi-8', 'mm-mv-3', 'f-lenteja', NULL, 150, '3/4 taza'),
('mi-9', 'mm-mv-3', 'f-pollo', NULL, 120, '1 porción grande'),
('mi-10', 'mm-mv-3', NULL, 'r-ensalada', 165, '1 plato'),
('mi-11', 'mm-mv-3', 'f-aguacate', NULL, 50, '1/4 aguacate'),
('mi-12', 'mm-mv-4', NULL, 'r-batido', 330, '1 vaso grande'),
('mi-13', 'mm-mv-5', 'f-atun', NULL, 80, '1/2 lata'),
('mi-14', 'mm-mv-5', 'f-papa-criolla', NULL, 120, '5 papitas'),
('mi-15', 'mm-mv-5', 'f-brocoli', NULL, 100, '1 taza'),
('mi-20', 'mm-ar-1', 'f-avena', NULL, 60, '6 cucharadas'),
('mi-21', 'mm-ar-1', 'f-leche', NULL, 250, '1 vaso grande'),
('mi-22', 'mm-ar-1', 'f-banano', NULL, 120, '1 banano'),
('mi-23', 'mm-ar-1', 'f-huevo', NULL, 150, '3 huevos'),
('mi-24', 'mm-ar-2', 'f-pan-int', NULL, 50, '2 tajadas'),
('mi-25', 'mm-ar-2', 'f-queso-camp', NULL, 40, '1 tajada'),
('mi-26', 'mm-ar-2', 'f-mandarina', NULL, 100, '1 mandarina'),
('mi-27', 'mm-ar-3', 'f-arroz', NULL, 200, '1 1/3 tazas'),
('mi-28', 'mm-ar-3', 'f-frijol', NULL, 150, '3/4 taza'),
('mi-29', 'mm-ar-3', 'f-res', NULL, 150, '1 porción grande'),
('mi-30', 'mm-ar-3', NULL, 'r-ensalada', 165, '1 plato'),
('mi-31', 'mm-ar-3', 'f-platano-mad', NULL, 120, '1/2 plátano'),
('mi-32', 'mm-ar-3', 'f-aguacate', NULL, 50, '1/4 aguacate'),
('mi-33', 'mm-ar-post', 'f-whey', NULL, 30, '1 scoop'),
('mi-34', 'mm-ar-post', 'f-leche', NULL, 250, '1 vaso grande'),
('mi-35', 'mm-ar-post', 'f-mango', NULL, 150, '1 taza'),
('mi-36', 'mm-ar-4', 'f-yogur', NULL, 150, '1 vaso'),
('mi-37', 'mm-ar-4', 'f-fresa', NULL, 150, '1 taza'),
('mi-38', 'mm-ar-5', 'f-pasta', NULL, 200, '1 1/2 tazas'),
('mi-39', 'mm-ar-5', 'f-pollo', NULL, 150, '1 porción grande'),
('mi-40', 'mm-ar-5', 'f-brocoli', NULL, 100, '1 taza'),
('mi-41', 'mm-ar-5', 'f-aceite-oliva', NULL, 10, '2 cucharaditas');

-- Publishing runs the safety triggers (would abort if a plan had a conflict).
UPDATE meal_plans SET status = 'publicado' WHERE id IN ('mp-mv-1', 'mp-ar-1');

-- ================================================================ EXERCISES
INSERT INTO exercises (id, name, muscle_group, equipment, modality, cue) VALUES
('ex-sentadilla-pc', 'Sentadilla con peso corporal', 'Piernas', 'ninguno', 'ambos', 'Pecho arriba, rodillas en línea con los pies.'),
('ex-goblet', 'Sentadilla goblet con mancuerna', 'Piernas', 'mancuerna', 'ambos', 'Mancuerna pegada al pecho, baja controlado.'),
('ex-zancada', 'Zancadas alternas', 'Piernas', 'ninguno', 'ambos', 'Paso largo, rodilla de atrás casi al piso.'),
('ex-puente', 'Puente de glúteo', 'Glúteos', 'ninguno', 'ambos', 'Aprieta glúteos arriba 1 segundo.'),
('ex-rdl-manc', 'Peso muerto rumano con mancuernas', 'Isquiotibiales', 'mancuernas', 'ambos', 'Cadera atrás, espalda neutra.'),
('ex-flexion', 'Flexiones de pecho', 'Pecho', 'ninguno', 'ambos', 'Cuerpo en bloque, codos a 45 grados.'),
('ex-flexion-inc', 'Flexiones inclinadas', 'Pecho', 'ninguno', 'casa', 'Manos en una silla firme o el sofá.'),
('ex-remo-manc', 'Remo con mancuerna a una mano', 'Espalda', 'mancuerna', 'ambos', 'Lleva el codo hacia la cadera.'),
('ex-remo-banda', 'Remo con banda elástica', 'Espalda', 'banda', 'casa', 'Junta escápulas al final.'),
('ex-press-manc', 'Press militar con mancuernas', 'Hombros', 'mancuernas', 'ambos', 'Abdomen firme, no arquees la espalda.'),
('ex-curl-banda', 'Curl de bíceps con banda', 'Bíceps', 'banda', 'casa', 'Codos quietos a los lados.'),
('ex-fondos-silla', 'Fondos en silla', 'Tríceps', 'silla', 'casa', 'Hombros lejos de las orejas.'),
('ex-plancha', 'Plancha', 'Core', 'ninguno', 'ambos', 'Línea recta de cabeza a talones.'),
('ex-plancha-lat', 'Plancha lateral', 'Core', 'ninguno', 'ambos', 'Cadera arriba, no la dejes caer.'),
('ex-mountain', 'Escaladores', 'Cardio', 'ninguno', 'ambos', 'Ritmo constante, cadera baja.'),
('ex-burpee', 'Burpees', 'Cardio', 'ninguno', 'ambos', 'Aterriza suave.'),
('ex-deadbug', 'Dead bug', 'Core', 'ninguno', 'ambos', 'Zona lumbar pegada al piso.'),
('ex-sentadilla-barra', 'Sentadilla con barra', 'Piernas', 'barra', 'gym', 'Barra sobre trapecios, profundidad controlada.'),
('ex-banca', 'Press de banca', 'Pecho', 'barra', 'gym', 'Escápulas juntas, pies firmes.'),
('ex-peso-muerto', 'Peso muerto', 'Cadena posterior', 'barra', 'gym', 'Barra pegada a las piernas, espalda neutra.'),
('ex-remo-barra', 'Remo con barra', 'Espalda', 'barra', 'gym', 'Torso a 45 grados, tira hacia el ombligo.'),
('ex-jalon', 'Jalón al pecho', 'Espalda', 'polea', 'gym', 'Lleva la barra a la clavícula.'),
('ex-press-barra', 'Press militar con barra', 'Hombros', 'barra', 'gym', 'Glúteos y abdomen apretados.'),
('ex-prensa', 'Prensa de piernas', 'Piernas', 'máquina', 'gym', 'No bloquees las rodillas arriba.'),
('ex-femoral', 'Curl femoral', 'Isquiotibiales', 'máquina', 'gym', 'Baja lento, 3 segundos.'),
('ex-laterales', 'Elevaciones laterales', 'Hombros', 'mancuernas', 'gym', 'Codos ligeramente flexionados.'),
('ex-dominadas', 'Dominadas asistidas', 'Espalda', 'máquina', 'gym', 'Pecho hacia la barra.');

-- ================================================================ WORKOUT PLANS
INSERT INTO workout_plans (id, student_id, name, status, starts_on, notes) VALUES
('wp-mv-1', 's-mariana', 'Casa: fuerza y resistencia', 'publicado', '2026-08-03', 'Calienta 5 minutos antes. Si algo duele, para y me cuentas.'),
('wp-ar-1', 's-andres', 'Gym: torso y pierna', 'publicado', '2026-08-03', 'Registra la carga de cada serie. Subimos cuando llegues al tope de repeticiones.');

INSERT INTO workout_days (id, plan_id, weekday, title, location) VALUES
('wd-mv-1', 'wp-mv-1', 1, 'Pierna y glúteo', 'casa'),
('wd-mv-3', 'wp-mv-1', 3, 'Torso y core', 'casa'),
('wd-mv-5', 'wp-mv-1', 5, 'Cuerpo completo + cardio', 'casa'),
('wd-ar-1', 'wp-ar-1', 1, 'Torso A', 'gym'),
('wd-ar-2', 'wp-ar-1', 2, 'Pierna A', 'gym'),
('wd-ar-4', 'wp-ar-1', 4, 'Torso B', 'gym'),
('wd-ar-5', 'wp-ar-1', 5, 'Pierna B', 'gym');

INSERT INTO workout_items (id, day_id, exercise_id, position, sets, reps, load_kg, rest_s, rir, notes) VALUES
('wi-1', 'wd-mv-1', 'ex-goblet', 1, 4, '10-12', 8, 75, 2, NULL),
('wi-2', 'wd-mv-1', 'ex-zancada', 2, 3, '10 por pierna', NULL, 60, 2, NULL),
('wi-3', 'wd-mv-1', 'ex-rdl-manc', 3, 3, '12', 8, 75, 2, NULL),
('wi-4', 'wd-mv-1', 'ex-puente', 4, 3, '15', NULL, 45, 1, 'Pausa arriba'),
('wi-5', 'wd-mv-1', 'ex-plancha', 5, 3, '30 s', NULL, 30, NULL, NULL),
('wi-6', 'wd-mv-3', 'ex-flexion-inc', 1, 4, '8-10', NULL, 75, 2, NULL),
('wi-7', 'wd-mv-3', 'ex-remo-manc', 2, 4, '10-12', 8, 60, 2, NULL),
('wi-8', 'wd-mv-3', 'ex-press-manc', 3, 3, '10', 5, 60, 2, NULL),
('wi-9', 'wd-mv-3', 'ex-curl-banda', 4, 3, '12-15', NULL, 45, 1, NULL),
('wi-10', 'wd-mv-3', 'ex-deadbug', 5, 3, '10 por lado', NULL, 30, NULL, NULL),
('wi-11', 'wd-mv-5', 'ex-sentadilla-pc', 1, 3, '15', NULL, 45, 2, NULL),
('wi-12', 'wd-mv-5', 'ex-remo-banda', 2, 3, '15', NULL, 45, 2, NULL),
('wi-13', 'wd-mv-5', 'ex-mountain', 3, 4, '30 s', NULL, 30, NULL, NULL),
('wi-14', 'wd-mv-5', 'ex-burpee', 4, 3, '8', NULL, 45, NULL, 'Sin salto si molesta el tobillo'),
('wi-15', 'wd-mv-5', 'ex-plancha-lat', 5, 2, '20 s por lado', NULL, 30, NULL, NULL),
('wi-20', 'wd-ar-1', 'ex-banca', 1, 4, '6-8', 62.5, 120, 2, NULL),
('wi-21', 'wd-ar-1', 'ex-remo-barra', 2, 4, '8-10', 55, 90, 2, NULL),
('wi-22', 'wd-ar-1', 'ex-press-barra', 3, 3, '8', 35, 90, 2, NULL),
('wi-23', 'wd-ar-1', 'ex-laterales', 4, 3, '12-15', 8, 60, 1, NULL),
('wi-24', 'wd-ar-2', 'ex-sentadilla-barra', 1, 4, '6-8', 80, 150, 2, NULL),
('wi-25', 'wd-ar-2', 'ex-prensa', 2, 3, '10-12', 140, 90, 2, NULL),
('wi-26', 'wd-ar-2', 'ex-femoral', 3, 3, '12', 35, 60, 1, NULL),
('wi-27', 'wd-ar-2', 'ex-plancha', 4, 3, '45 s', NULL, 45, NULL, NULL),
('wi-28', 'wd-ar-4', 'ex-jalon', 1, 4, '8-10', 50, 90, 2, NULL),
('wi-29', 'wd-ar-4', 'ex-press-manc', 2, 4, '8-10', 20, 90, 2, NULL),
('wi-30', 'wd-ar-4', 'ex-dominadas', 3, 3, '6-8', NULL, 90, 2, NULL),
('wi-31', 'wd-ar-4', 'ex-flexion', 4, 3, 'Al fallo -2', NULL, 60, 2, NULL),
('wi-32', 'wd-ar-5', 'ex-peso-muerto', 1, 4, '5', 100, 180, 2, NULL),
('wi-33', 'wd-ar-5', 'ex-goblet', 2, 3, '12', 24, 90, 2, NULL),
('wi-34', 'wd-ar-5', 'ex-zancada', 3, 3, '10 por pierna', NULL, 60, 2, NULL),
('wi-35', 'wd-ar-5', 'ex-deadbug', 4, 3, '12 por lado', NULL, 30, NULL, NULL);
