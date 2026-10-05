/**
 * TESTIMONIOS REALES ÚNICAMENTE.
 *
 * Cómo agregar uno:
 * 1. Pide autorización escrita al estudiante (WhatsApp o correo) para publicar
 *    su nombre, su frase y, si aplica, su foto. Guarda esa autorización.
 * 2. Si incluye fotos de progreso, el estudiante debe tener activo el
 *    consentimiento "fotos_publicas" en la app (es distinto al de fotos privadas).
 * 3. Agrega un objeto a la lista. Máximo 3 líneas de texto por testimonio.
 *
 * Mientras la lista esté vacía, la sección no se muestra en el sitio.
 */

export interface Testimonial {
  name: string; // nombre y primer apellido, o como el estudiante autorice
  detail: string; // ej. "Entrena en casa desde 2026"
  quote: string; // máx. ~220 caracteres, sin inventar resultados
  authorizedOn: string; // fecha de la autorización, YYYY-MM-DD
}

export const testimonials: Testimonial[] = [];
