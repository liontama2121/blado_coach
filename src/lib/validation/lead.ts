import { z } from "zod";

const GOALS = ["perder_grasa", "ganar_musculo", "fuerza", "salud_general", "rendimiento", "rehabilitacion_post_alta"] as const;
const MODALITIES = ["casa", "gym", "online", "mixto"] as const;

/** Colombian numbers: 10-digit mobiles (3xx) or landlines, optional +57 prefix. */
const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s().-]/g, ""))
  .refine((v) => /^(\+?57)?\d{7,10}$/.test(v), "Escribe un teléfono válido, por ejemplo 310 482 1967.");

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre.").max(120, "El nombre es muy largo."),
  phone,
  goal: z.enum(GOALS, { error: "Elige tu objetivo." }),
  modality: z.enum(MODALITIES, { error: "Elige una modalidad." }),
  consent: z.literal("on", { error: "Necesitamos tu autorización para guardar tus datos." }),
  // Honeypot: real people never fill this hidden field.
  website: z.string().max(0).optional().default(""),
});

export type LeadInput = z.infer<typeof leadSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
