-- DEV ONLY. Fictitious data, no real people, no photos.
-- All demo accounts use the password: BladoDemo-2026  (students must change it on first login)
-- Never run this against the production database.

INSERT INTO users (id, email, password_hash, role, must_change_password) VALUES
  ('u-coach-demo',  'coach@blado.test',    'pbkdf2$sha256$100000$MOU8O3oiNFuXEHKrIWDj6Q$L3KhpYvn40qmWtr-gQZSPDrlKQ7_BQoqFi28RffsE5I', 'coach',   0),
  ('u-student-mv',  'mariana@blado.test',  'pbkdf2$sha256$100000$fL_6btp4EZFHwsD7jk1_Ng$DVnbhmXUIKcW0uoL1_DPkLM6b3IO7jMgBryqg51KKOU', 'student', 1),
  ('u-student-ar',  'andres@blado.test',   'pbkdf2$sha256$100000$fL_6btp4EZFHwsD7jk1_Ng$DVnbhmXUIKcW0uoL1_DPkLM6b3IO7jMgBryqg51KKOU', 'student', 1);

INSERT INTO students (
  id, user_id, full_name, birth_date, sex, phone, email, occupation,
  emergency_name, emergency_phone, start_date, modality, status, height_cm,
  goal_type, goal_text, goal_date, experience_level, days_per_week, minutes_per_session,
  home_equipment, sleep_hours, stress_level, water_liters, daily_steps,
  alcohol_frequency, smoker, meals_per_day, home_address, home_address_notes, gym_name, gym_address
) VALUES
  ('s-mariana', 'u-student-mv', 'Mariana Villamizar Ortega', '1991-03-22', 'F', '+57 310 482 1967', 'mariana@blado.test', 'Contadora',
   'Julián Villamizar', '+57 315 220 4418', '2026-06-08', 'casa', 'activo', 163,
   'perder_grasa', 'Bajar 6 cm de cintura', '2026-12-15', 'principiante', 3, 50,
   '["mancuernas","bandas"]', 6.5, 7, 1.5, 6200,
   'ocasional', 0, 4, 'Cra. 15 #93-47, apto 502 (dirección ficticia)', 'Portería pide cédula', NULL, NULL),
  ('s-andres', 'u-student-ar', 'Andrés Rincón Calderón', '1987-11-04', 'M', '+57 301 739 0852', 'andres@blado.test', 'Ingeniero de sistemas',
   'Paula Calderón', '+57 312 604 7731', '2026-07-06', 'mixto', 'activo', 178,
   'ganar_musculo', 'Subir 3 kg de masa magra', '2027-01-31', 'intermedio', 4, 60,
   '["barra_dominadas","kettlebell"]', 7, 5, 2.2, 8900,
   'semanal', 0, 4, 'Cl. 127 #52-20 (dirección ficticia)', NULL, 'Gimnasio de ejemplo Usaquén', 'Cl. 120 #7-10 (ficticia)');

INSERT INTO health_screening (student_id, parq_q1, parq_q2, parq_q3, parq_q4, parq_q5, parq_q6, parq_q7, injuries, medications) VALUES
  ('s-mariana', 0, 0, 0, 0, 0, 0, 0, 'Esguince de tobillo derecho (2019), recuperado', NULL),
  ('s-andres',  0, 0, 0, 1, 0, 0, 0, 'Molestia lumbar ocasional', 'Ninguno');

INSERT INTO consents (id, student_id, kind, text_version, accepted_by_user_id) VALUES
  ('c-mv-1', 's-mariana', 'datos_personales', '2026-10-v1', 'u-student-mv'),
  ('c-mv-2', 's-mariana', 'datos_salud',      '2026-10-v1', 'u-student-mv'),
  ('c-ar-1', 's-andres',  'datos_personales', '2026-10-v1', 'u-student-ar'),
  ('c-ar-2', 's-andres',  'datos_salud',      '2026-10-v1', 'u-student-ar');

INSERT INTO measurements (id, student_id, measured_on, weight_kg, neck_cm, waist_cm, hip_cm, arm_relaxed_r_cm, thigh_r_cm, body_fat_pct, body_fat_method, resting_hr, bp_systolic, bp_diastolic, created_by) VALUES
  ('m-mv-1', 's-mariana', '2026-06-08', 71.4, 33.5, 88.0, 104.5, 30.2, 60.1, NULL, NULL, 74, 118, 76, 'u-coach-demo'),
  ('m-mv-2', 's-mariana', '2026-07-06', 70.1, 33.2, 86.1, 103.6, 30.0, 59.4, NULL, NULL, 72, 116, 75, 'u-coach-demo'),
  ('m-mv-3', 's-mariana', '2026-08-03', 69.3, 33.0, 84.7, 102.9, 29.8, 58.8, NULL, NULL, 71, 115, 74, 'u-coach-demo'),
  ('m-ar-1', 's-andres',  '2026-07-06', 76.8, 38.4, 84.2, 97.0,  32.5, 56.3, 17.9, 'bioimpedancia', 66, 124, 80, 'u-coach-demo'),
  ('m-ar-2', 's-andres',  '2026-08-03', 77.6, 38.6, 84.0, 97.3,  33.1, 57.0, 17.4, 'bioimpedancia', 64, 122, 79, 'u-coach-demo');

INSERT INTO fitness_tests (id, student_id, tested_on, pushups, pushup_type, squats_1min, plank_s, wall_sit_s, burpees_1min, sit_reach_cm, cardio_test, step_test_hr, created_by) VALUES
  ('ft-mv-1', 's-mariana', '2026-06-08', 9, 'rodillas', 28, 45, 50, 11, 4, 'escalon_3min', 142, 'u-coach-demo'),
  ('ft-mv-2', 's-mariana', '2026-07-27', 14, 'rodillas', 34, 70, 75, 14, 7, 'escalon_3min', 134, 'u-coach-demo'),
  ('ft-ar-1', 's-andres',  '2026-07-06', 31, 'completas', 44, 120, 95, 19, 1, 'cooper_12min', NULL, 'u-coach-demo');

INSERT INTO fitness_lifts (id, test_id, exercise, load_kg, reps) VALUES
  ('fl-ar-1', 'ft-ar-1', 'sentadilla', 80, 6),
  ('fl-ar-2', 'ft-ar-1', 'press_banca', 62.5, 5),
  ('fl-ar-3', 'ft-ar-1', 'peso_muerto', 100, 5);

INSERT INTO weekly_checkins (id, student_id, week_start, weight_kg, sessions_done, sessions_planned, nutrition_adherence, energy, sleep_quality, stress, hunger, soreness, comment) VALUES
  ('wc-mv-1', 's-mariana', '2026-07-27', 69.8, 3, 3, 7, 7, 6, 6, 5, NULL, 'Buena semana'),
  ('wc-mv-2', 's-mariana', '2026-08-03', 69.3, 2, 3, 6, 6, 6, 7, 6, 'Cuádriceps cargados', 'Semana de cierre en el trabajo'),
  ('wc-ar-1', 's-andres',  '2026-08-03', 77.6, 4, 4, 8, 8, 7, 4, 7, NULL, NULL);

INSERT INTO availability (id, weekday, start_minute, end_minute, location) VALUES
  ('av-1', 1, 360, 600, 'ambos'),   -- lunes 6:00–10:00
  ('av-2', 1, 1020, 1260, 'gym'),   -- lunes 17:00–21:00
  ('av-3', 3, 360, 600, 'ambos'),
  ('av-4', 3, 1020, 1260, 'gym'),
  ('av-5', 5, 360, 600, 'casa'),
  ('av-6', 6, 480, 720, 'gym');     -- sábado 8:00–12:00

-- Bogotá is UTC-5: 06:00 local = 11:00Z.
INSERT INTO training_sessions (id, student_id, starts_at, ends_at, location, travel_before_min, travel_after_min, status, requested_by) VALUES
  ('ts-mv-1', 's-mariana', '2026-10-05T11:00:00.000Z', '2026-10-05T11:50:00.000Z', 'casa', 30, 30, 'confirmada', 'u-student-mv'),
  ('ts-ar-1', 's-andres',  '2026-10-05T22:00:00.000Z', '2026-10-05T23:00:00.000Z', 'gym',  0,  0,  'solicitada', 'u-student-ar');

INSERT INTO coach_notes (id, student_id, body) VALUES
  ('cn-ar-1', 's-andres', 'PAR-Q con un sí (pregunta 4). Pedir autorización médica antes de subir cargas en peso muerto.');

INSERT INTO leads (id, name, phone, goal, preferred_modality, source) VALUES
  ('l-1', 'Lead de ejemplo', '+57 300 000 0000', 'Bajar grasa', 'casa', 'landing');
