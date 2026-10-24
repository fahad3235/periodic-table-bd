# TEST RESULTS — Periodic Table BD

Run date: 2026-10-24 (factory 16:00 slot). All tests re-run from scratch on the final build.

## Node unit tests — 45/45 passed

`node tests/logic.test.js`

- Data integrity: 118 elements, numbers 1–118 exactly once, unique symbols/names, 11 fields per row, groups 1–18 or 0 (f-block), periods 1–7, blocks s/p/d/f, known categories/states, grid cols 1–18, rows 1–9, 118 unique grid positions, mass format decimal or `[n]`.
- Spot checks: H (1/s/nonmetal/gas), Fe group 8, Au mass 196.97, liquids exactly [Br, Hg], gases 11, lanthanides 15, actinides 15, transition metals 38, noble gases 7, f-block rows 14+14, La col3/row6, Ac col3/row7, Og col18/row7.
- Filtering: "iron" → Fe; "FE" → Fe,Fm (substring semantics); "26" → Fe; halogen 6; gas 11; halogen+gas F,Cl; no-match 0; empty query 118.
- Quiz: 4 unique options, answer included, symbol/number consistent with answer; edge-rng valid.
- i18n: Bengali digits 118 → ১১৮; EN/BN key sets match; BN strings decode to real Bengali script.

Repairs during testing (2):
1. Quiz distractor loop could hang on a degenerate constant rng (found by a test that itself hung) — added a 1000-attempt cap plus a deterministic fallback fill in `js/logic.js`. Production uses Math.random, so this was test-only, but the guard is real.
2. One test expectation corrected: "FE" substring-matches both Fe and Fm (app behaviour correct, test wrong). No app-logic change.

## Headless-Chrome smoke tests — 18/18 passed

`node tests/smoke.mjs` (raw CDP, /opt/meta-chromium/chrome, file://)

Title, 118 cells, 2 f-block range labels, 10 legend chips, default Hydrogen detail, Fe click → Iron + mass 55.845, search "gold" → 1 visible, halogen filter → 6 visible, no-match empty state, filters cleared → 118, EN→BN title switch, Bengali digits (১১৮) in match count, BN→EN restore, quiz 4 options, correct-answer score increment (looped fresh questions until a correct first-option hit), new-question regeneration, 390px no horizontal overflow, 0 console errors / page exceptions.

## Source hygiene

All shipped sources verified pure ASCII (`grep -P '[^\x00-\x7F]'` zero matches): Bengali lives in `js/i18n.js` as `\uXXXX` escapes and in `index.html` as numeric character references, so the push transport cannot corrupt it. Zero network requests by design (static files only).
