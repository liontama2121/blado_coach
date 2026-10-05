-- Blado: initial schema (Cloudflare D1 / SQLite)
--
-- D1 has no row-level security. Access control lives in src/lib/server/access.ts:
-- every query for a student is scoped by the student_id taken from the session.
--
-- Conventions: ids are TEXT (crypto.randomUUID), dates are ISO TEXT
-- ('YYYY-MM-DD' for days, 'YYYY-MM-DDTHH:MM:SSZ' UTC for instants),
-- booleans are INTEGER 0/1. Ranges in CHECK mirror the Zod schemas.

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------ auth

CREATE TABLE users (
  id                    TEXT PRIMARY KEY,
  email                 TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash         TEXT NOT NULL,
  role                  TEXT NOT NULL CHECK (role IN ('coach', 'student')),
  must_change_password  INTEGER NOT NULL DEFAULT 1 CHECK (must_change_password IN (0, 1)),
  disabled              INTEGER NOT NULL DEFAULT 0 CHECK (disabled IN (0, 1)),
  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  last_login_at         TEXT
);

-- Stores SHA-256 of the session token, never the token itself.
CREATE TABLE auth_sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  user_agent  TEXT
);
CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id);

-- Login throttling per email / IP.
CREATE TABLE login_attempts (
  key           TEXT PRIMARY KEY,
  attempts      INTEGER NOT NULL DEFAULT 0,
  window_start  TEXT NOT NULL
);

-- ------------------------------------------------------------------ students

CREATE TABLE students (
  id                    TEXT PRIMARY KEY,
  user_id               TEXT UNIQUE REFERENCES users(id) ON DELETE SET NULL,

  -- personal data (age is computed from birth_date, never stored)
  full_name             TEXT NOT NULL CHECK (length(full_name) BETWEEN 2 AND 120),
  birth_date            TEXT NOT NULL,
  sex                   TEXT NOT NULL CHECK (sex IN ('M', 'F')),
  phone                 TEXT,
  email                 TEXT COLLATE NOCASE,
  occupation            TEXT,
  emergency_name        TEXT,
  emergency_phone       TEXT,
  start_date            TEXT NOT NULL,
  modality              TEXT NOT NULL CHECK (modality IN ('casa', 'gym', 'online', 'mixto')),
  status                TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'pausado', 'finalizado')),
  height_cm             REAL NOT NULL CHECK (height_cm BETWEEN 100 AND 250),

  -- goal
  goal_type             TEXT NOT NULL CHECK (goal_type IN ('perder_grasa', 'ganar_musculo', 'fuerza', 'salud_general', 'rendimiento', 'rehabilitacion_post_alta')),
  goal_text             TEXT,
  goal_date             TEXT,

  -- training context
  experience_level      TEXT CHECK (experience_level IN ('principiante', 'intermedio', 'avanzado')),
  days_per_week         INTEGER CHECK (days_per_week BETWEEN 1 AND 7),
  minutes_per_session   INTEGER CHECK (minutes_per_session BETWEEN 10 AND 240),
  home_equipment        TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(home_equipment)),
  home_equipment_other  TEXT,

  -- baseline habits
  sleep_hours           REAL CHECK (sleep_hours BETWEEN 0 AND 16),
  stress_level          INTEGER CHECK (stress_level BETWEEN 1 AND 10),
  water_liters          REAL CHECK (water_liters BETWEEN 0 AND 10),
  daily_steps           INTEGER CHECK (daily_steps BETWEEN 0 AND 60000),
  alcohol_frequency     TEXT CHECK (alcohol_frequency IN ('nunca', 'ocasional', 'semanal', 'diario')),
  smoker                INTEGER CHECK (smoker IN (0, 1)),
  meals_per_day         INTEGER CHECK (meals_per_day BETWEEN 1 AND 10),

  -- where sessions happen
  home_address          TEXT,
  home_address_notes    TEXT,
  gym_name              TEXT,
  gym_address           TEXT,

  created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX idx_students_status ON students(status);

-- Sensitive health data: coach + the student themself only.
CREATE TABLE health_screening (
  student_id                    TEXT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  parq_q1                       INTEGER NOT NULL DEFAULT 0 CHECK (parq_q1 IN (0, 1)),
  parq_q2                       INTEGER NOT NULL DEFAULT 0 CHECK (parq_q2 IN (0, 1)),
  parq_q3                       INTEGER NOT NULL DEFAULT 0 CHECK (parq_q3 IN (0, 1)),
  parq_q4                       INTEGER NOT NULL DEFAULT 0 CHECK (parq_q4 IN (0, 1)),
  parq_q5                       INTEGER NOT NULL DEFAULT 0 CHECK (parq_q5 IN (0, 1)),
  parq_q6                       INTEGER NOT NULL DEFAULT 0 CHECK (parq_q6 IN (0, 1)),
  parq_q7                       INTEGER NOT NULL DEFAULT 0 CHECK (parq_q7 IN (0, 1)),
  requires_medical_clearance    INTEGER GENERATED ALWAYS AS (
    (parq_q1 + parq_q2 + parq_q3 + parq_q4 + parq_q5 + parq_q6 + parq_q7) > 0
  ) STORED,
  injuries                      TEXT,
  surgeries                     TEXT,
  conditions                    TEXT,
  medications                   TEXT,
  medical_clearance_key         TEXT,  -- R2 object key, students/{id}/medical/...
  medical_clearance_uploaded_at TEXT,
  updated_at                    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- ------------------------------------------------------------------ tracking

CREATE TABLE measurements (
  id                TEXT PRIMARY KEY,
  student_id        TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  measured_on       TEXT NOT NULL,
  weight_kg         REAL NOT NULL CHECK (weight_kg BETWEEN 30 AND 300),

  neck_cm           REAL CHECK (neck_cm BETWEEN 20 AND 70),
  shoulders_cm      REAL CHECK (shoulders_cm BETWEEN 70 AND 180),
  chest_cm          REAL CHECK (chest_cm BETWEEN 50 AND 200),
  waist_cm          REAL CHECK (waist_cm BETWEEN 40 AND 220),
  hip_cm            REAL CHECK (hip_cm BETWEEN 50 AND 220),
  arm_relaxed_r_cm  REAL CHECK (arm_relaxed_r_cm BETWEEN 15 AND 70),
  arm_relaxed_l_cm  REAL CHECK (arm_relaxed_l_cm BETWEEN 15 AND 70),
  arm_flexed_r_cm   REAL CHECK (arm_flexed_r_cm BETWEEN 15 AND 75),
  arm_flexed_l_cm   REAL CHECK (arm_flexed_l_cm BETWEEN 15 AND 75),
  thigh_r_cm        REAL CHECK (thigh_r_cm BETWEEN 30 AND 110),
  thigh_l_cm        REAL CHECK (thigh_l_cm BETWEEN 30 AND 110),
  calf_r_cm         REAL CHECK (calf_r_cm BETWEEN 20 AND 70),
  calf_l_cm         REAL CHECK (calf_l_cm BETWEEN 20 AND 70),

  body_fat_pct      REAL CHECK (body_fat_pct BETWEEN 2 AND 70),
  body_fat_method   TEXT CHECK (body_fat_method IN ('bioimpedancia', 'pliegues_jp3', 'pliegues_jp7', 'formula_navy', 'otro')),

  sf_chest_mm       REAL CHECK (sf_chest_mm BETWEEN 2 AND 80),
  sf_abdomen_mm     REAL CHECK (sf_abdomen_mm BETWEEN 2 AND 80),
  sf_thigh_mm       REAL CHECK (sf_thigh_mm BETWEEN 2 AND 80),
  sf_triceps_mm     REAL CHECK (sf_triceps_mm BETWEEN 2 AND 80),
  sf_suprailiac_mm  REAL CHECK (sf_suprailiac_mm BETWEEN 2 AND 80),
  sf_subscapular_mm REAL CHECK (sf_subscapular_mm BETWEEN 2 AND 80),
  sf_midaxillary_mm REAL CHECK (sf_midaxillary_mm BETWEEN 2 AND 80),

  resting_hr        INTEGER CHECK (resting_hr BETWEEN 30 AND 220),
  bp_systolic       INTEGER CHECK (bp_systolic BETWEEN 70 AND 250),
  bp_diastolic      INTEGER CHECK (bp_diastolic BETWEEN 40 AND 150),

  coach_notes       TEXT,
  created_by        TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX idx_measurements_student_date ON measurements(student_id, measured_on);

CREATE TABLE fitness_tests (
  id                TEXT PRIMARY KEY,
  student_id        TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tested_on         TEXT NOT NULL,
  pushups           INTEGER CHECK (pushups BETWEEN 0 AND 300),
  pushup_type       TEXT CHECK (pushup_type IN ('rodillas', 'completas')),
  squats_1min       INTEGER CHECK (squats_1min BETWEEN 0 AND 150),
  plank_s           INTEGER CHECK (plank_s BETWEEN 0 AND 1800),
  wall_sit_s        INTEGER CHECK (wall_sit_s BETWEEN 0 AND 1800),
  burpees_1min      INTEGER CHECK (burpees_1min BETWEEN 0 AND 80),
  pullups           INTEGER CHECK (pullups BETWEEN 0 AND 100),
  sit_reach_cm      REAL CHECK (sit_reach_cm BETWEEN -40 AND 60),
  cardio_test       TEXT CHECK (cardio_test IN ('escalon_3min', 'cooper_12min', 'rockport_1milla')),
  step_test_hr      INTEGER CHECK (step_test_hr BETWEEN 40 AND 220),
  cooper_m          INTEGER CHECK (cooper_m BETWEEN 300 AND 5000),
  rockport_time_s   INTEGER CHECK (rockport_time_s BETWEEN 300 AND 2400),
  rockport_hr       INTEGER CHECK (rockport_hr BETWEEN 40 AND 220),
  mobility_notes    TEXT,
  created_by        TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX idx_fitness_tests_student_date ON fitness_tests(student_id, tested_on);

-- Gym lifts: load × reps; 1RM (Epley / Brzycki) is computed in src/lib/metrics.ts.
CREATE TABLE fitness_lifts (
  id        TEXT PRIMARY KEY,
  test_id   TEXT NOT NULL REFERENCES fitness_tests(id) ON DELETE CASCADE,
  exercise  TEXT NOT NULL CHECK (exercise IN ('sentadilla', 'press_banca', 'peso_muerto', 'remo', 'press_militar')),
  load_kg   REAL NOT NULL CHECK (load_kg BETWEEN 1 AND 500),
  reps      INTEGER NOT NULL CHECK (reps BETWEEN 1 AND 30),
  UNIQUE (test_id, exercise)
);

CREATE TABLE weekly_checkins (
  id                   TEXT PRIMARY KEY,
  student_id           TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  week_start           TEXT NOT NULL,  -- Monday of the week
  weight_kg            REAL CHECK (weight_kg BETWEEN 30 AND 300),
  sessions_done        INTEGER NOT NULL CHECK (sessions_done BETWEEN 0 AND 14),
  sessions_planned     INTEGER NOT NULL CHECK (sessions_planned BETWEEN 0 AND 14),
  nutrition_adherence  INTEGER NOT NULL CHECK (nutrition_adherence BETWEEN 1 AND 10),
  energy               INTEGER NOT NULL CHECK (energy BETWEEN 1 AND 10),
  sleep_quality        INTEGER NOT NULL CHECK (sleep_quality BETWEEN 1 AND 10),
  stress               INTEGER NOT NULL CHECK (stress BETWEEN 1 AND 10),
  hunger               INTEGER NOT NULL CHECK (hunger BETWEEN 1 AND 10),
  soreness             TEXT,
  comment              TEXT,
  created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (student_id, week_start)
);

CREATE TABLE workout_logs (
  id          TEXT PRIMARY KEY,
  student_id  TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  logged_on   TEXT NOT NULL,
  modality    TEXT NOT NULL CHECK (modality IN ('casa', 'gym', 'online')),
  exercise    TEXT NOT NULL,
  sets        INTEGER CHECK (sets BETWEEN 1 AND 20),
  reps        INTEGER CHECK (reps BETWEEN 1 AND 100),
  load_kg     REAL CHECK (load_kg BETWEEN 0 AND 500),
  rpe         REAL CHECK (rpe BETWEEN 1 AND 10),
  rir         INTEGER CHECK (rir BETWEEN 0 AND 10),
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX idx_workout_logs_student_date ON workout_logs(student_id, logged_on);

-- Files live in the private R2 bucket under students/{student_id}/photos/.
CREATE TABLE progress_photos (
  id            TEXT PRIMARY KEY,
  student_id    TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  period_month  TEXT NOT NULL CHECK (period_month GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]'),
  angle         TEXT NOT NULL CHECK (angle IN ('frontal', 'lateral', 'posterior')),
  r2_key        TEXT NOT NULL UNIQUE,
  weight_kg     REAL CHECK (weight_kg BETWEEN 30 AND 300),
  width         INTEGER,
  height        INTEGER,
  created_by    TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  UNIQUE (student_id, period_month, angle)
);

-- Ley 1581 de 2012. A consent is active while revoked_at IS NULL.
CREATE TABLE consents (
  id                    TEXT PRIMARY KEY,
  student_id            TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  kind                  TEXT NOT NULL CHECK (kind IN ('datos_personales', 'datos_salud', 'fotos_progreso', 'fotos_publicas')),
  text_version          TEXT NOT NULL,
  accepted_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  accepted_by_user_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  revoked_at            TEXT
);
CREATE INDEX idx_consents_student_kind ON consents(student_id, kind);

-- Never readable from /app/* routes.
CREATE TABLE coach_notes (
  id          TEXT PRIMARY KEY,
  student_id  TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX idx_coach_notes_student ON coach_notes(student_id);

-- ------------------------------------------------------------------ landing

CREATE TABLE leads (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 120),
  phone               TEXT NOT NULL CHECK (length(phone) BETWEEN 7 AND 20),
  goal                TEXT,
  preferred_modality  TEXT CHECK (preferred_modality IN ('casa', 'gym', 'online', 'mixto')),
  status              TEXT NOT NULL DEFAULT 'nuevo' CHECK (status IN ('nuevo', 'contactado', 'convertido', 'descartado')),
  source              TEXT,
  created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX idx_leads_created ON leads(created_at);

-- ------------------------------------------------------------------ schedule

-- Coach weekly availability. weekday: 0 = Sunday … 6 = Saturday (Bogotá local time).
-- Minutes from midnight, local time.
CREATE TABLE availability (
  id            TEXT PRIMARY KEY,
  weekday       INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_minute  INTEGER NOT NULL CHECK (start_minute BETWEEN 0 AND 1439),
  end_minute    INTEGER NOT NULL CHECK (end_minute BETWEEN 1 AND 1440),
  location      TEXT NOT NULL CHECK (location IN ('gym', 'casa', 'ambos')),
  active        INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  CHECK (end_minute > start_minute)
);

-- Blocked days or hours (holidays, travel). Null minutes = whole day blocked.
CREATE TABLE availability_exceptions (
  id            TEXT PRIMARY KEY,
  date          TEXT NOT NULL,
  start_minute  INTEGER CHECK (start_minute BETWEEN 0 AND 1439),
  end_minute    INTEGER CHECK (end_minute BETWEEN 1 AND 1440),
  reason        TEXT
);
CREATE INDEX idx_availability_exceptions_date ON availability_exceptions(date);

-- Sessions only happen at the gym or at the student's home.
-- Home sessions block travel time before/after (Bogotá traffic).
CREATE TABLE training_sessions (
  id                 TEXT PRIMARY KEY,
  student_id         TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  starts_at          TEXT NOT NULL,  -- UTC instant
  ends_at            TEXT NOT NULL,
  location           TEXT NOT NULL CHECK (location IN ('gym', 'casa')),
  travel_before_min  INTEGER NOT NULL DEFAULT 0 CHECK (travel_before_min BETWEEN 0 AND 180),
  travel_after_min   INTEGER NOT NULL DEFAULT 0 CHECK (travel_after_min BETWEEN 0 AND 180),
  status             TEXT NOT NULL DEFAULT 'solicitada' CHECK (status IN ('solicitada', 'confirmada', 'rechazada', 'cancelada', 'completada', 'no_asistio')),
  requested_by       TEXT REFERENCES users(id) ON DELETE SET NULL,
  note_student       TEXT,
  note_coach         TEXT,
  decided_at         TEXT,
  created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  CHECK (ends_at > starts_at)
);
CREATE INDEX idx_training_sessions_start ON training_sessions(starts_at);
CREATE INDEX idx_training_sessions_student ON training_sessions(student_id, starts_at);

-- ------------------------------------------------------------------ settings

CREATE TABLE settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);
INSERT INTO settings (key, value) VALUES
  ('travel_buffer_min', '30'),
  ('session_default_min', '60'),
  ('cancel_notice_hours', '12'),
  ('measurement_interval_days', '28'),
  ('fitness_test_interval_days', '49'),
  ('checkin_alert_days', '10');
