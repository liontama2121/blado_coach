import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Escribe un correo válido.")),
  password: z.string().min(1, "Escribe tu contraseña.").max(200),
  next: z.string().max(200).optional(),
});

export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `Usa al menos ${PASSWORD_MIN_LENGTH} caracteres.`)
      .max(200)
      .refine((v) => /[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(v) && /\d/.test(v), "Combina letras y números."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Las contraseñas no coinciden." });
