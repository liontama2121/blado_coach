/**
 * Coach Bladimir: state catalog and default phrases (Spanish, Colombia).
 *
 * Rules for every phrase:
 * - Talk about effort, consistency and achievements. NEVER about the student's body or weight.
 * - `noNumbersSafe: false` phrases mention weight/calories and are skipped in "modo sin números".
 * - The coach will be able to override these from the panel (table `mascot_phrases`, later phase).
 */

export const MASCOT_STATES = [
  "idle",
  "wave",
  "flex",
  "selfie",
  "point",
  "celebrate",
  "think",
  "water",
  "cook",
  "cheer",
  "sad-soft",
  "sleep",
  "lift",
] as const;

export type MascotState = (typeof MASCOT_STATES)[number];

export interface Phrase {
  text: string;
  noNumbersSafe?: boolean; // default true
}

export const STATE_LABEL: Record<MascotState, string> = {
  idle: "Bladimir atento",
  wave: "Bladimir saludando",
  flex: "Bladimir sacando bíceps",
  selfie: "Bladimir tomándose una selfie",
  point: "Bladimir señalando",
  celebrate: "Bladimir celebrando",
  think: "Bladimir pensando",
  water: "Bladimir tomando agua",
  cook: "Bladimir con una olla",
  cheer: "Bladimir aplaudiendo",
  "sad-soft": "Bladimir animándote con calma",
  sleep: "Bladimir descansando",
  lift: "Bladimir levantando una mancuerna",
};

export const PHRASES: Record<MascotState, Phrase[]> = {
  idle: [
    { text: "Aquí estoy cuando me necesites." },
    { text: "Paso a paso, parcero." },
    { text: "Hoy también cuenta." },
    { text: "La constancia le gana al afán." },
    { text: "¿Qué hacemos hoy?" },
    { text: "Un día a la vez." },
    { text: "Lo importante es no soltar." },
    { text: "Vamos bien, sigamos." },
    { text: "Tu plan te está esperando." },
    { text: "Respira, que esto es un proceso." },
  ],
  wave: [
    { text: "¡Hola! Soy Bladimir, tu coach." },
    { text: "¡Qué más pues! Bienvenido/a." },
    { text: "¡Buenas! Qué bueno verte por acá." },
    { text: "¡Hola, parcero/a! ¿Arrancamos?" },
    { text: "¡Llegaste! Ya empezó lo bueno." },
    { text: "¡Hola! Te muestro cómo trabajamos." },
    { text: "Bienvenido/a al equipo." },
    { text: "¡Ey! Qué alegría tenerte aquí." },
    { text: "¡Hola! Hoy es buen día para empezar." },
    { text: "¡Saludos! Vamos con toda." },
  ],
  flex: [
    { text: "¡Eso es fuerza de verdad!" },
    { text: "¡Nuevo récord! Esto se celebra." },
    { text: "Esa técnica está quedando fina." },
    { text: "El esfuerzo se está notando en tus números." },
    { text: "¡Más fuerte que la semana pasada!" },
    { text: "Así se entrena, con cabeza y con ganas." },
    { text: "¡Qué nivel, parcero/a!" },
    { text: "Ese progreso es tuyo." },
    { text: "Disciplina convertida en fuerza." },
    { text: "¡Vamos por el siguiente!" },
  ],
  selfie: [
    { text: "Toca la foto del mes. Misma luz, mismo lugar." },
    { text: "Frontal, lateral y espalda. Solo tú y yo las vemos." },
    { text: "Fotos privadas: son para medir, no para juzgar." },
    { text: "¿Hacemos el registro del mes?" },
    { text: "Ropa ajustada, buena luz y listo." },
    { text: "Las fotos cuentan lo que la báscula no." },
    { text: "Un minuto y quedan tus fotos del mes." },
    { text: "Cámara a la altura de la cadera, sin filtros." },
    { text: "Recuerda: puedes borrarlas cuando quieras." },
    { text: "Mes nuevo, registro nuevo." },
  ],
  point: [
    { text: "Toca un horario libre y me escribes." },
    { text: "Tu check-in de la semana está pendiente." },
    { text: "Mira aquí, esto es lo de hoy." },
    { text: "Empieza por acá, es rapidito." },
    { text: "Aquí ves tu plan de la semana." },
    { text: "Este es tu siguiente paso." },
    { text: "Llena esto y yo ajusto tu plan." },
    { text: "Por aquí agendas tu sesión." },
    { text: "Revisa esto antes de entrenar." },
    { text: "Te dejo esto listo, solo confirma." },
  ],
  celebrate: [
    { text: "¡Un mes completo! Eso no lo hace cualquiera." },
    { text: "¡Lo lograste! Esto se celebra." },
    { text: "¡Meta cumplida, parcero/a!" },
    { text: "Constancia pura. ¡Felicitaciones!" },
    { text: "¡Qué mes tan bueno el que hiciste!" },
    { text: "¡Plan completado! Vamos por más." },
    { text: "Un día malo no borra un mes bueno." },
    { text: "¡Hito desbloqueado!" },
    { text: "¡Eso es trabajo de verdad!" },
    { text: "Míralo: tú hiciste esto." },
  ],
  think: [
    { text: "Déjame revisar..." },
    { text: "Cargando tu información..." },
    { text: "Guardando, un segundo..." },
    { text: "Pensando en tu próximo paso..." },
    { text: "Organizando tu semana..." },
    { text: "Un momento, ya casi." },
    { text: "Revisando tus datos..." },
    { text: "Ajustando detalles..." },
    { text: "Ya te muestro." },
    { text: "Haciendo cuentas..." },
  ],
  water: [
    { text: "¿Ya tomaste agua? Un vaso y seguimos." },
    { text: "Hidrátate, que el cuerpo lo agradece." },
    { text: "Agua antes, durante y después." },
    { text: "Recordatorio amigable: agua." },
    { text: "Un sorbo ahora, por favor." },
    { text: "Termo cerca, siempre." },
    { text: "La hidratación también es entrenamiento." },
    { text: "¿Vamos por otro vaso?" },
    { text: "Toma agua y me cuentas." },
    { text: "Agua primero, excusas después." },
  ],
  cook: [
    { text: "Tu plan de comidas nuevo está listo." },
    { text: "Comida colombiana, rica y a tu medida." },
    { text: "Revisa la lista de mercado de la semana." },
    { text: "Hoy toca preparar algo bueno." },
    { text: "Si no consigues algo, pídeme un cambio." },
    { text: "Cocinar en casa también es entrenar." },
    { text: "Tu plato de hoy ya está en el plan." },
    { text: "Arepa sí, con plan." },
    { text: "Planear la comida es media batalla." },
    { text: "Marca tus comidas cuando las cumplas." },
  ],
  cheer: [
    { text: "¡Check-in enviado! Gracias por contarme." },
    { text: "¡Comida cumplida! Eso es." },
    { text: "¡Bien hecho!" },
    { text: "¡Así se hace, parcero/a!" },
    { text: "¡Otro día más en la cuenta!" },
    { text: "¡Qué constancia!" },
    { text: "¡Vamos que vamos!" },
    { text: "¡Me encanta ver esto!" },
    { text: "¡Sumaste otro punto!" },
    { text: "¡Eso, sin pausa!" },
  ],
  "sad-soft": [
    { text: "Se cortó la racha. Volvamos mañana." },
    { text: "Un día malo no borra un mes bueno." },
    { text: "Tranquilo/a, lo retomamos juntos." },
    { text: "Pasa. Lo importante es volver." },
    { text: "Hoy descansa, mañana seguimos." },
    { text: "No pasa nada, aquí estoy." },
    { text: "Arrancamos de nuevo cuando quieras." },
    { text: "Un tropiezo no es el final." },
    { text: "Lo que cuenta es el promedio, no un día." },
    { text: "¿Qué te ayudaría esta semana? Cuéntame." },
  ],
  sleep: [
    { text: "Modo descanso. Recuperar también es entrenar." },
    { text: "El músculo crece mientras descansas." },
    { text: "Dormir bien es parte del plan." },
    { text: "Zzz... hoy toca recuperar." },
    { text: "Descanso activo: camina, estira, respira." },
    { text: "Te espero cuando vuelvas." },
    { text: "Día libre bien merecido." },
    { text: "Recarga energías." },
    { text: "El descanso no es flojera, es estrategia." },
    { text: "Nos vemos en la próxima sesión." },
  ],
  lift: [
    { text: "Aún no hay entreno aquí. Ya lo armamos." },
    { text: "Tu plan de entreno viene en camino." },
    { text: "Mientras tanto, a moverse un poquito." },
    { text: "Una repetición a la vez." },
    { text: "Aquí aparecerán tus sesiones." },
    { text: "En casa o en el gym, yo voy." },
    { text: "Cargas que suben, constancia que se nota." },
    { text: "Técnica primero, carga después." },
    { text: "Series, repeticiones y ganas." },
    { text: "Vamos sumando." },
  ],
};

/** Random phrase for a state, skipping number-related ones in "modo sin números". */
export function pickPhrase(state: MascotState, opts: { noNumbers?: boolean; seed?: number } = {}): string {
  const list = PHRASES[state].filter((p) => !opts.noNumbers || p.noNumbersSafe !== false);
  const i = opts.seed !== undefined ? Math.abs(opts.seed) % list.length : Math.floor(Math.random() * list.length);
  return list[i]?.text ?? "";
}
