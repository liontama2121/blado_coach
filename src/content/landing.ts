/**
 * Landing copy. Plain Spanish (Colombia), no em-dashes, no invented claims.
 * Anything that is a business fact the coach must confirm is marked TODO.
 */

export const modalities = [
  {
    id: "casa",
    icon: "house",
    title: "En casa",
    lead: "Voy a tu casa. Entrenas con lo que tienes y sin perder tiempo en traslados.",
    includes: [
      "Sesiones uno a uno en tu casa",
      "Rutina adaptada a tu equipo: mancuernas, bandas, barra o nada",
      "Plan para los días que entrenas por tu cuenta",
    ],
  },
  {
    id: "gym",
    icon: "barbell",
    title: "En gimnasio",
    lead: "Te acompaño en tu gimnasio. Técnica, cargas y progresión en cada serie.",
    includes: [
      "Sesiones uno a uno en tu gimnasio",
      "Progresión de cargas con registro de cada sesión",
      "Pruebas de fuerza con 1RM estimado",
    ],
  },
  {
    id: "online",
    icon: "phone",
    title: "Online",
    lead: "Tu plan y tu seguimiento desde la app, entrenes donde entrenes.",
    includes: [
      "Plan semanal en la app",
      "Check-in semanal en menos de un minuto",
      "Ajustes según tus datos de cada mes",
    ],
  },
] as const;

export const steps = [
  {
    title: "Valoración inicial",
    body: "Cuestionario de salud, medidas, composición corporal y pruebas físicas. Así sabemos de dónde partes.",
  },
  {
    title: "Plan personalizado",
    body: "Entrenamiento según tu objetivo, tus días disponibles y el equipo que tienes.",
  },
  {
    title: "Seguimiento mensual",
    body: "Cada 4 semanas repetimos medidas y tomas tus fotos de progreso, privadas.",
  },
  {
    title: "Ajustes",
    body: "Con tus números en la mano decidimos el siguiente paso del plan.",
  },
] as const;

export const faqs = [
  {
    q: "¿Necesito equipo para entrenar en casa?",
    a: "No. Arrancamos con tu peso corporal y lo que tengas. Si hace falta algo, te recomiendo opciones económicas.",
  },
  {
    q: "¿Qué incluye la valoración inicial?",
    a: "Un cuestionario de salud, medidas corporales, composición corporal y pruebas físicas sencillas. Con eso armamos tu plan.",
  },
  {
    q: "¿Quién ve mis fotos de progreso?",
    a: "Solo tú y tu coach. Se guardan en un espacio privado, sin ubicación ni datos de la cámara, y puedes borrarlas cuando quieras.",
  },
  {
    q: "¿Qué pasa si tengo una lesión o una condición médica?",
    a: "Antes de empezar llenas un cuestionario de salud. Si alguna respuesta lo indica, pedimos autorización médica antes de entrenar.",
  },
  {
    q: "¿Cómo agendo mis sesiones?",
    a: "Desde tu app pides el horario que te sirve, en casa o en el gimnasio, y el coach lo confirma.",
  },
  {
    q: "¿Puedo combinar casa y gimnasio?",
    a: "Sí. Puedes alternar según tu semana y el plan se ajusta a cada lugar.",
  },
] as const;

export const goalOptions = [
  { value: "perder_grasa", label: "Bajar grasa" },
  { value: "ganar_musculo", label: "Ganar músculo" },
  { value: "fuerza", label: "Ganar fuerza" },
  { value: "salud_general", label: "Mejorar mi salud" },
  { value: "rendimiento", label: "Rendimiento deportivo" },
  { value: "rehabilitacion_post_alta", label: "Volver a entrenar después de una lesión (con alta médica)" },
] as const;

export const modalityOptions = [
  { value: "casa", label: "En casa" },
  { value: "gym", label: "En gimnasio" },
  { value: "online", label: "Online" },
  { value: "mixto", label: "Casa y gimnasio" },
] as const;

/** Sample progress used on the landing. Fictitious, always labelled as such. */
export const sampleProgress = {
  months: ["Jun", "Jul", "Ago", "Sep"],
  weightKg: [71.4, 70.1, 69.3, 68.6],
  waistCm: [88.0, 86.1, 84.7, 83.8],
  heightCm: 170,
} as const;
