# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro + React islands + Tailwind v4, TypeScript strict. Database: **Cloudflare D1** (SQLite), replacing Supabase by user decision (2026-10-04). Authorization is enforced in server code because D1 has no RLS. Private file storage (progress photos, medical authorizations): Cloudflare R2, confirmed. Auth: self-hosted sessions in D1, confirmed. The user requires strict role isolation: a student never sees another student's data. Chart.js for charts. Deploy on Cloudflare.

## Users

- **Prospects (landing):** adults in Bogotá, Colombia, who want to lose fat, build muscle, or improve their health. Many train at home with little equipment. They arrive from WhatsApp, Instagram, or a referral and decide whether to book an initial assessment.
- **Students (app):** active clients who fill in a weekly check-in in under a minute (mostly on a phone), upload their monthly progress photos, and look at their own progress.
- **Coach (admin panel):** one personal trainer who runs assessments, records measurements and fitness tests, reviews check-ins, watches alerts, and exports progress reports.

## Product Purpose

Blado is a personal-training brand that works at home, in the gym, and online. The product has two parts: a public landing page that turns visitors into assessment bookings or WhatsApp leads, and a private platform where the coach tracks each student month by month (measurements, body composition, fitness tests, check-ins, progress photos). Success means more booked assessments, and students who can see their own progress and keep training.

## Positioning

What sets Blado apart, as confirmed by the user:
1. **Data-driven follow-up:** measurements, body-fat %, fitness tests, and monthly photos, all in the brand's own app.
2. **Visible results:** a side-by-side and before/after comparison of the student's own photos and numbers.
3. **Close relationship:** one-on-one coaching with a weekly check-in.

## Operating Context

- A 4-week cycle: measurements are taken in the morning, fasted, on the same weekday each time. Fitness tests happen every 6–8 weeks. Check-ins are weekly.
- Training happens at home (dumbbells, bands, pull-up bar, kettlebell), in the gym, or online.
- WhatsApp is the main contact channel in Colombia.
- Spanish (Colombia), COP, metric units, dates as dd/mm/aaaa.

## Capabilities and Constraints

- **Scheduling (confirmed 2026-10-04):** sessions happen in the **gym** or **at home** only; online is app-based follow-up with no scheduled sessions. The coach publishes availability, the student requests a slot, and the coach approves or rejects it. Home sessions use the address stored on the student's file, and the system blocks travel time between home sessions (Bogotá traffic). A student sees only their own sessions; the coach sees the whole calendar.
- Two roles, coach and student. There is no public sign-up; only the coach creates students.
- Health data is sensitive (Ley 1581 de 2012, habeas data). Progress-photo consent is separate, explicit, and revocable.
- Progress photos stay private: signed URLs, EXIF stripped, never public and never indexed.
- The app never diagnoses. Reference ranges are shown as general guidance, with a short disclaimer.
- Coach data (name, photos, prices, WhatsApp, social links) are placeholders in `src/config/site.ts`.

## Brand Commitments

- Name: **Blado** (the brand; the coach's real name is a placeholder).
- The user pinned a **very gym visual style**: tall, condensed lettering and fluorescent lime green.
- Intensity: "gym intense, no cliché." High energy, but no stock photos of bodybuilders and no aggressive or shaming language.
- Tone: professional, close, and motivating.
- Footer: "Hecho con amor por JuanCode".

## Evidence on Hand

None yet. There are no real testimonials, no coach photos, no prices, and no certifications. Never fabricate them: use labelled placeholders and an empty testimonials component with instructions.

## Product Principles

1. Progress gets measured, not promised: every claim of change comes from the student's own data.
2. Training should fit the student's life (home, gym, or online), not the other way around.
3. Health and photo privacy outrank any marketing use.
4. Motivate without shaming: no body-shaming copy and no diagnostic language.

## Accessibility & Inclusion

WCAG AA contrast, labelled form fields, and keyboard navigation. Mobile-first everywhere, especially the student app.
