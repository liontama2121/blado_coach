---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: []
---

# Landing — Blado

Scope: the public landing (`/`). Visitor mode: Persuade. Audience: adults in Bogotá who want to lose fat, build muscle or improve their health; many train at home. Action: book an assessment or message on WhatsApp. Proof: data-driven follow-up shown with clearly labelled sample data, plus the coach's **live schedule** (free or busy only). Never invent testimonials, prices or certifications.

## Direction contract

THESIS: Cinta Kinesio. The whole page is taped like an athlete. Lime kinesiology strips, laid diagonally, hold up only what matters (the headline, the CTA, the free slots and the key data), the way tape supports a muscle. This replaces the earlier Negro Lima build. It refuses the category default: a bodybuilder photo, a neon glow and three service cards.

OWN-WORLD: Matte graphite #0D0E0D ground. Lime #C8FF1A tape strips with a subtle woven texture and cut, rounded ends. Off-white #EDEFEA for text. Red #FF4D2E is spent once, on today's seal and the now line. Display: Sofia Sans Extra Condensed 900 caps. Body: Geist. Data: Geist Mono. Radius 0 on everything except the tape ends. Raises: the next free slot pulses lime before it starts (algorave); the coach status types itself letter by letter (terminal); one charged empty zone per section that the tape crosses, never filler (ikebana); one active mark at a time, today sealed in red (akari).

STORY: The visitor learns that Blado trains them at home or in the gym, with follow-up online. They see the coach's real week, live, and believe there is space for them. Then they book an assessment.

FIRST VIEWPORT: The nav is a single line. BLADO in giant condensed caps fills the left two thirds, crossed by two lime strips in an X. One strip carries "Agenda tu valoración" (the CTA lives on the tape) and a WhatsApp ghost button sits beside it. On the right, a live status card shows the Bogotá time, the coach status typing itself, and "Próximo horario libre" as a strip. The subtext is one line.

FORM: Cinta Kinesio, grounded candidate #5, seed key bf6b7188 (re-roll 1, bolder register). Build path: code-led. Signature interaction: tape strips "apply" (scaleX from the pinned end) as sections enter, and the live week calendar shows free slots as strips stuck on each day, with the now line in red.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Calendar (public)
- Data: `GET /api/agenda/semana` → availability blocks minus confirmed or requested sessions, as free or busy only. No names, addresses or locations of others. Cached for about 60 s.
- Time zone: America/Bogota. The current week runs Monday to Saturday. The now line refreshes every minute; the status refreshes every 30 s.

## Open decisions
- Coach photos are placeholders until real photos arrive.
- The panel (coach and student) uses a quieter version of the same tape system on a light ground (Operate mode).
