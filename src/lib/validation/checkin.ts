import { z } from "zod";

const scale = z.coerce.number().int().min(1, "Elige de 1 a 10.").max(10, "Elige de 1 a 10.");

export const checkinSchema = z
  .object({
    weight_kg: z
      .union([z.literal(""), z.coerce.number().min(30, "Revisa el peso (30 a 300 kg).").max(300, "Revisa el peso (30 a 300 kg).")])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    sessions_done: z.coerce.number().int().min(0).max(14),
    sessions_planned: z.coerce.number().int().min(0).max(14),
    nutrition_adherence: scale,
    energy: scale,
    sleep_quality: scale,
    stress: scale,
    hunger: scale,
    soreness: z.string().trim().max(300).optional().default(""),
    comment: z.string().trim().max(500).optional().default(""),
  })
  .refine((d) => d.sessions_done <= Math.max(d.sessions_planned, d.sessions_done), { path: ["sessions_done"] });
