# JABSZ Studio — Portfolio (Premium Redesign)

Ultra-premium redesign of the Jabsz Studio portfolio. All content — branding,
services, projects, pricing, testimonials, contact details and social links —
is carried over 1:1 from the original site (jabsz-studio.lovable.app); only the
design, layout and motion system are new.

## Stack

- **Next.js 15** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS 4**
- **Framer Motion** — reveals, staggered cards, page micro-interactions
- **GSAP + ScrollTrigger** — scroll animation engine hooks
- **Lenis** — buttery smooth scrolling + smooth anchor navigation
- Self-hosted fonts (Bebas Neue display / Inter body), lazy-loaded images,
  JSON-LD structured data, reduced-motion support

## Getting started

```bash
npm install     # also tries to restore the 3D avatar (see below)
npm run dev     # http://localhost:3000
npm run build   # production build
```

## The 3D avatar

The hero uses the exact 3D avatar from the original site, expected at
`public/images/avatar.png`. `npm install` (or `npm run fetch-avatar`) downloads
it automatically from the original site. If your network blocks that domain,
save the portrait image manually as `public/images/avatar.png` — everything
else works either way (the hero falls back to a styled monogram).

## Structure

```
app/            layout (SEO, fonts, JSON-LD) + single-page composition
components/     one component per section + motion/UI primitives
lib/data.ts     ALL site content in one place — edit copy here
scripts/        fetch-avatar.mjs (restores the original avatar asset)
```
