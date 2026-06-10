# Incident Portal v2

A focused incident-investigation workspace. No dashboards, no trend analytics — just a
guided, end-to-end investigation using **ICAM**, **5 Whys** and **mini-HFAT**, finishing
in an exportable report.

This is the successor to [incident-portal](https://github.com/tomsobkow-wq/incident-portal)
(v1), which remains untouched and fully usable.

## The workflow

Nine steps, in the order an investigation actually runs:

1. **Incident details** — the facts as first reported
2. **Evidence** — referenced register (E1, E2…) of photos, documents, accounts, data
3. **Interviews** — structured cognitive-interview capture (rapport → free recall →
   open probing → clarify → close); one click adds an interview to the evidence log
4. **Timeline** — chronologically self-sorting sequence of events, each entry anchored
   to evidence
5. **5 Whys** — chained why→because editor; the root cause can be promoted straight
   into ICAM as an organisational factor
6. **ICAM analysis** — contributing factors along the causal chain
   (OF → TEC → ITA → AFD), each classified and evidence-linked
7. **mini-HFAT** — human-factors analysis per key action: error type, missed recovery,
   cognitive-stage breakdown, performance-shaping conditions
8. **Actions** — corrective actions with owner, due date, hierarchy-of-control level and
   links back to the factors they address (warns about unaddressed organisational factors)
9. **Report** — a compiled investigation report, exportable as **PDF** (print) and
   **Word (.docx)** — both work identically on PC and Mac

The left rail tracks completion of every step. Everything is editable, and everything
autosaves to the browser (localStorage) — no backend, no accounts.

## Run it

```bash
npm install
npm run dev       # local development
npm run build     # production build in dist/
npm run lint
```

Deployed automatically to GitHub Pages from `main` (see `.github/workflows/deploy.yml`).

## Stack

React 19 + Vite, plain JavaScript. Word export via [docx](https://docx.js.org/),
loaded on demand. Fonts: Fraunces, Archivo, IBM Plex Mono (self-hosted via Fontsource).

## Going back to v1

v1 lives in its own repository and local folder (`~/incident-portal`) and was not
modified. Clone or open it as before.
