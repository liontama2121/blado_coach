import { z } from "zod";

const opt = <T extends z.ZodTypeAny>(s: T) =>
  z.preprocess((v) => (v === "" || v === null ? undefined : v), s.optional());
const optNum = (min: number, max: number, msg: string) => opt(z.coerce.number().min(min, msg).max(max, msg));
const optInt = (min: number, max: number, msg: string) => opt(z.coerce.number().int().min(min, msg).max(max, msg));
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida.");

export const GOALS = ["perder_grasa", "ganar_musculo", "fuerza", "salud_general", "rendimiento", "rehabilitacion_post_alta"] as const;
export const EQUIPMENT = ["mancuernas", "bandas", "barra_dominadas", "kettlebell", "banco", "ninguno", "otro"] as const;

export const datosSchema = z.object({
  full_name: z.string().trim().min(2, "Escribe el nombre completo.").max(120),
  birth_date: date,
  sex: z.enum(["M", "F"], { error: "Elige el sexo biológico." }),
  phone: opt(z.string().trim().max(20)),
  email: z.string().trim().toLowerCase().pipe(z.email("Escribe un correo válido.")),
  occupation: opt(z.string().trim().max(80)),
  emergency_name: opt(z.string().trim().max(80)),
  emergency_phone: opt(z.string().trim().max(20)),
  start_date: date,
  modality: z.enum(["casa", "gym", "online", "mixto"]),
  height_cm: z.coerce.number().min(100, "Talla entre 100 y 250 cm.").max(250, "Talla entre 100 y 250 cm."),
  gym_name: opt(z.string().trim().max(120)),
  gym_address: opt(z.string().trim().max(200)),
});

export const objetivoSchema = z.object({
  goal_type: z.enum(GOALS),
  goal_text: opt(z.string().trim().max(200)),
  goal_date: opt(date),
  experience_level: opt(z.enum(["principiante", "intermedio", "avanzado"])),
  days_per_week: optInt(1, 7, "Días entre 1 y 7."),
  minutes_per_session: optInt(10, 240, "Minutos entre 10 y 240."),
  home_equipment: z.array(z.enum(EQUIPMENT)).default([]),
  sleep_hours: optNum(0, 16, "Horas de sueño entre 0 y 16."),
  stress_level: optInt(1, 10, "Estrés de 1 a 10."),
  water_liters: optNum(0, 10, "Agua entre 0 y 10 L."),
  daily_steps: optInt(0, 60000, "Pasos entre 0 y 60.000."),
  alcohol_frequency: opt(z.enum(["nunca", "ocasional", "semanal", "diario"])),
  smoker: opt(z.coerce.number().int().min(0).max(1)),
  meals_per_day: optInt(1, 10, "Comidas entre 1 y 10."),
});

export const saludSchema = z.object({
  parq: z.array(z.coerce.number().int().min(0).max(1)).length(7),
  injuries: opt(z.string().trim().max(500)),
  surgeries: opt(z.string().trim().max(500)),
  conditions: opt(z.string().trim().max(500)),
  medications: opt(z.string().trim().max(500)),
});

export const restriccionSchema = z
  .object({
    type: z.enum(["alergia", "intolerancia", "condicion", "preferencia", "no_le_gusta"]),
    allergen: opt(z.string().max(30)),
    restriction_tag: opt(z.string().max(30)),
    food_id: opt(z.string().max(64)),
    severity: opt(z.enum(["leve", "moderada", "grave"])),
    requires_nutritionist: z.coerce.number().int().min(0).max(1).default(0),
    note: opt(z.string().trim().max(200)),
  })
  .refine((r) => r.type !== "alergia" || (r.allergen && r.severity), { message: "Alergia: elige el alérgeno y la severidad.", path: ["allergen"] })
  .refine((r) => r.allergen || r.restriction_tag || r.food_id, { message: "Elige qué se restringe.", path: ["type"] });

export const medicionSchema = z.object({
  measured_on: date,
  weight_kg: z.coerce.number().min(30, "Peso entre 30 y 300 kg.").max(300, "Peso entre 30 y 300 kg."),
  neck_cm: optNum(20, 70, "Cuello entre 20 y 70 cm."),
  waist_cm: optNum(40, 220, "Cintura entre 40 y 220 cm."),
  hip_cm: optNum(50, 220, "Cadera entre 50 y 220 cm."),
  chest_cm: optNum(50, 200, "Pecho entre 50 y 200 cm."),
  arm_relaxed_r_cm: optNum(15, 70, "Brazo entre 15 y 70 cm."),
  thigh_r_cm: optNum(30, 110, "Muslo entre 30 y 110 cm."),
  body_fat_pct: optNum(2, 70, "% grasa entre 2 y 70."),
  body_fat_method: opt(z.enum(["bioimpedancia", "pliegues_jp3", "pliegues_jp7", "formula_navy", "otro"])),
  resting_hr: optInt(30, 220, "FC entre 30 y 220."),
  coach_notes: opt(z.string().trim().max(500)),
});

export const createStudentSchema = z.object({
  datos: datosSchema,
  objetivo: objetivoSchema,
  salud: saludSchema,
  restricciones: z.array(restriccionSchema).max(20).default([]),
  medicion: medicionSchema.optional(),
  consentimientos: z.object({
    datos_personales: z.literal(true, { error: "Se necesita la autorización de datos personales." }),
    datos_salud: z.literal(true, { error: "Se necesita la autorización de datos de salud." }),
    fotos_progreso: z.boolean().default(false),
  }),
});

export type CreateStudent = z.infer<typeof createStudentSchema>;

/** PAR-Q+ general questions (7), shown in the wizard and the health tab. */
export const PARQ = [
  "¿Algún médico le ha dicho que tiene una condición del corazón o presión arterial alta?",
  "¿Siente dolor en el pecho en reposo, en sus actividades diarias o al hacer actividad física?",
  "¿Ha perdido el equilibrio por mareo o ha perdido el conocimiento en los últimos 12 meses?",
  "¿Le han diagnosticado otra condición médica crónica?",
  "¿Toma medicamentos recetados para una condición médica crónica?",
  "¿Tiene un problema de huesos, articulaciones o músculos que pueda empeorar con más actividad física?",
  "¿Algún médico le ha dicho que solo debe hacer actividad física con supervisión médica?",
];
