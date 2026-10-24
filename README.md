# Periodic Table BD

An offline, bilingual (English / বাংলা) interactive periodic table of all 118 elements — explore, search, filter, and quiz yourself. 100% static, zero network requests, no data leaves your device.

## Features

1. **Full 118-element grid** — standard 18-column layout with the lanthanide and actinide rows shown below the main table, colour-coded by category.
2. **Search & filters** — search by name, symbol, or atomic number; filter by category (10 categories) and by state at STP (solid / liquid / gas); legend chips jump straight to a category.
3. **Element detail panel** — click any element for atomic number, symbol, name, atomic mass, group, period, block, category, and state.
4. **"Name that element" quiz** — a symbol is shown with four name options; score and streak tracking, new-question button.
5. **Bilingual UI** — EN ⇄ বাংলা toggle persisted in localStorage; atomic numbers render in Bengali digits in বাংলা mode.

## Data notes

- Masses are standard atomic weights. Bracketed values (e.g. `[98]` for Technetium) are the mass number of the most stable isotope, used where no stable isotope exists.
- Element names are in English; category names, states, and all UI chrome are translated to Bengali.
- States are at standard temperature and pressure (Br and Hg are the only liquids; 11 gases).
- This is an educational demo, not a reference database: verify values against IUPAC/standard references before citing them.

## Stack

Vanilla HTML + CSS + JavaScript. No build step, no dependencies, no framework.

## Run locally

Open `index.html` in any modern browser, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Tests

```bash
node tests/logic.test.js   # data integrity + filtering + quiz + i18n
node tests/smoke.mjs       # headless-Chrome (CDP) UI smoke tests; requires /opt/meta-chromium/chrome
```

See `TEST_RESULTS.md` for the verified results of this release.

## Project structure

```
index.html          — page shell (all UI text via data-i18n keys)
css/style.css       — layout, category colours, responsive rules
js/elements.js      — 118-element dataset (number, symbol, name, mass, group, period, block, category, state, grid position)
js/logic.js         — pure functions: filtering, quiz generation, Bengali digits
js/i18n.js          — EN/বাংলা strings (shipped as pure-ASCII \uXXXX escapes)
js/app.js           — DOM wiring: grid render, detail panel, quiz, language toggle
tests/logic.test.js — node unit tests
tests/smoke.mjs     — headless-Chrome smoke tests
```

## Limitations

- No electron configurations, densities, or melting/boiling points (kept out to avoid unverified data).
- Element names are English-only; Bengali transliterations of all 118 names are not included.
- Quiz distractors are random, not same-category, so some rounds are easy.
- Synthetic-element states are shown as solid (predicted values, not measured).

## Status

Built by the MUSE Project Factory (slot run). See `TEST_RESULTS.md` for verified test results.
