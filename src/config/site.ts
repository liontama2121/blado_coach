/**
 * Datos del coach y de la marca. ÚNICO lugar para editarlos.
 *
 * Todo lo marcado `// TODO: REEMPLAZAR` es un placeholder. No publiques el
 * sitio hasta reemplazarlos con datos reales y autorizados por el coach.
 */

export const site = {
  brand: "Blado",
  url: "https://blado.coach", // también en astro.config.mjs
  locale: "es-CO",
  currency: "COP",
  city: "Bogotá",
  country: "CO",

  coach: {
    name: "Nombre del Coach", // TODO: REEMPLAZAR
    role: "Entrenador personal",
    bio: "Historia corta del coach: cómo empezó, a quién entrena y cómo trabaja.", // TODO: REEMPLAZAR
    certifications: [
      // TODO: REEMPLAZAR con certificaciones reales (nombre + entidad + año)
      "Certificación de ejemplo 1",
      "Certificación de ejemplo 2",
    ],
    photo: null as string | null, // TODO: REEMPLAZAR, ruta en /public/img/coach.webp
  },

  contact: {
    whatsapp: "573506185226", // +57 350 618 5226
    whatsappMessage: "Hola, quiero agendar mi valoración con Blado.",
    email: "hola@blado.example.com", // TODO: REEMPLAZAR
    serviceArea: "Bogotá y alrededores", // TODO: REEMPLAZAR si aplica
  },

  social: {
    instagram: "https://instagram.com/", // TODO: REEMPLAZAR
    tiktok: "https://tiktok.com/", // TODO: REEMPLAZAR
    youtube: null as string | null,
  },

  /** Planes y precios en COP. TODO: REEMPLAZAR todos los valores. */
  plans: [
    { id: "casa", name: "En casa", priceCop: 0, period: "mes", sessionsPerWeek: 3, placeholder: true },
    { id: "gym", name: "En gimnasio", priceCop: 0, period: "mes", sessionsPerWeek: 3, placeholder: true },
    { id: "online", name: "Online", priceCop: 0, period: "mes", sessionsPerWeek: 0, placeholder: true },
  ],

  footer: "Hecho con amor por JuanCode",
} as const;

export function whatsappUrl(message: string = site.contact.whatsappMessage): string {
  return `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function formatCop(value: number): string {
  return new Intl.NumberFormat(site.locale, { style: "currency", currency: site.currency, maximumFractionDigits: 0 }).format(value);
}

/** dd/mm/aaaa from an ISO date (`YYYY-MM-DD`) without timezone shifts. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}
