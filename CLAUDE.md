# CLAUDE.md: Blado (coach personal)

Landing pública + plataforma privada (coach y estudiante) para seguimiento físico mensual.
Contexto de producto: `PRODUCT.md`. Dirección visual: `.impeccable/surfaces/` (contrato "Negro Lima").
`DESIGN.md` se genera al terminar la landing (flujo de Impeccable).

## Stack

| Pieza | Elección |
|---|---|
| Frontend | Astro 7 (`output: "server"`) + React islands + Tailwind v4 (`@tailwindcss/vite`), TS `strictest` |
| Runtime / deploy | Cloudflare Workers con assets estáticos (`@astrojs/cloudflare` 14; el adaptador ya no apunta a Pages) |
| Base de datos | **Cloudflare D1** (SQLite), binding `DB`, migraciones en `db/migrations/` |
| Archivos privados | **Cloudflare R2**, binding `PRIVATE_FILES`, bucket `blado-private` (nunca público) |
| Auth | Propia: contraseñas PBKDF2-SHA256 (WebCrypto) + sesiones en D1 (`auth_sessions`, se guarda SHA-256 del token) |
| Validación | Zod 4, mismos rangos que los CHECK del SQL |
| Gráficas | Chart.js |
| Tests | Vitest (`tests/`) |

No hay Supabase. Se descartó por decisión del usuario el 2026-10-04.

## Cómo correrlo

```bash
npm install
cp .dev.vars.example .dev.vars        # secretos locales
npm run db:migrate:local              # crea el esquema en D1 local (.wrangler/)
npm run db:seed:local                 # datos ficticios, clave demo: BladoDemo-2026
npm run dev                           # http://localhost:4321
npm test                              # métricas + auth
npm run check && npm run build
```

Primer deploy:
`npx wrangler d1 create blado-db` → pegar `database_id` en `wrangler.jsonc` →
`npx wrangler r2 bucket create blado-private` → `npx wrangler secret put FILE_URL_SECRET` →
`npm run db:migrate:remote` → `npm run build && npx wrangler deploy`.
Nunca correr `seed.sql` contra la base remota.

## Reglas de seguridad (no negociables)

D1 **no tiene RLS**. El aislamiento entre usuarios vive en el código:

1. El middleware (`src/middleware.ts`, Fase 3) resuelve sesión → `locals.user` (`id`, `role`, `studentId`).
2. `/coach/*` exige `role = coach`. `/app/*` exige `role = student`. `/api/*` valida rol por endpoint.
3. Toda consulta pasa por `src/lib/server/access.ts`. Para el estudiante, el `student_id` sale **siempre de la sesión**, nunca de la URL, el body ni la query.
4. `coach_notes` jamás se consulta desde rutas de estudiante.
5. Archivos R2 en `students/{studentId}/...`. Se sirven por `/api/files/:token` con un token HMAC (`FILE_URL_SECRET`) de unos 60 s, después de verificar el dueño o el rol coach.
6. Cada endpoint nuevo lleva un test de aislamiento: el estudiante A no puede leer ni escribir datos de B.
7. Fotos: EXIF eliminado en cliente (re-encode por canvas a WebP, máx. 1600 px). Sin consentimiento `fotos_progreso` activo, el módulo está bloqueado. Revocar el consentimiento borra los objetos de R2.
8. La service key no existe: los bindings (`DB`, `PRIVATE_FILES`) solo viven en el servidor.

## Convenciones

- Fechas: ISO en DB (`YYYY-MM-DD` para días, UTC `...Z` para instantes); en la UI, `dd/mm/aaaa` (`formatDate` en `src/config/site.ts`). Zona horaria del negocio: America/Bogota (UTC-5, sin horario de verano).
- Unidades métricas. Moneda COP (`formatCop`).
- `src/lib/metrics.ts`: funciones puras con tests. Devuelven `null` cuando el dato falta o es imposible (la UI muestra "sin dato").
- Lenguaje: la app **no diagnostica**. Los rangos de referencia son orientativos y llevan disclaimer.
- Placeholders del coach (nombre, fotos, precios, WhatsApp, redes): solo en `src/config/site.ts`, marcados `// TODO: REEMPLAZAR`.
- Testimonios: nunca inventados.
- Copy visible: sin em-dash (regla de Taste Skill).

## Diseño

- Skills de proyecto en `.claude/skills/`: `impeccable` y `design-taste-frontend`. Usarlas en todo el frontend.
- Diales de Taste: landing `DESIGN_VARIANCE 7 / MOTION_INTENSITY 6 / VISUAL_DENSITY 4`; panel `7 / 3 / 6`.
- Tokens en `src/styles/global.css` (`@theme`): fondo grafito `ink`, texto `bone`, acento `lime` (#C8FF1A) solo en acción, palabra clave y franja; panel sobre `paper`.
- Tipos: Sofia Sans Extra Condensed (display), Geist (texto), Geist Mono (datos).
- Al cerrar cada fase visual: `/impeccable audit` y `/impeccable polish`.

## Estructura

```
db/migrations/         SQL versionado (wrangler d1 migrations)
db/seed.sql            datos ficticios (solo local)
src/config/site.ts     datos del coach (placeholders)
src/lib/metrics.ts     fórmulas (IMC, ICA, Navy, JP3/JP7+Siri, Mifflin, Epley/Brzycki, deltas)
src/lib/auth/          contraseñas y sesiones
src/lib/server/        acceso a datos con control de rol (Fase 3+)
src/layouts/ src/pages/ src/components/
tests/                 Vitest
scripts/               utilidades Node (hash-password)
```

## Fases

0 skills ✅ · 1 stack ✅ · 2 landing · 3 auth/roles · 4 modelo y formularios · 5 fotos · 6 panel coach (+ agenda) · 7 app estudiante (+ agenda).
Cada fase cierra con build OK, tests OK y la lista de lo hecho y lo pendiente. Commit al cierre de cada fase.
