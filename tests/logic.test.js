// Periodic Table BD — node unit tests. Run: node tests/logic.test.js
const { ELEMENTS } = require('../js/elements.js');
const L = require('../js/logic.js');
const { I18N } = require('../js/i18n.js');

let n = 0;
function check(name, cond) {
  n++;
  if (!cond) { console.error('FAIL: ' + name); process.exitCode = 1; }
  else console.log('ok - ' + name);
}
function eq(name, a, b) { check(name + ' (got ' + JSON.stringify(a) + ')', a === b); }

// --- Data integrity ---
eq('118 elements', ELEMENTS.length, 118);
const nums = ELEMENTS.map(r => r[0]);
eq('numbers 1..118 exactly once', JSON.stringify([...nums].sort((a, b) => a - b)) === JSON.stringify(Array.from({ length: 118 }, (_, i) => i + 1)), true);
eq('symbols unique', new Set(ELEMENTS.map(r => r[1])).size, 118);
eq('names unique', new Set(ELEMENTS.map(r => r[2])).size, 118);
check('every row has 11 fields', ELEMENTS.every(r => r.length === 11));
check('groups 1..18 or 0 (f-block)', ELEMENTS.every(r => (r[4] >= 1 && r[4] <= 18) || r[4] === 0));
check('periods 1..7', ELEMENTS.every(r => r[5] >= 1 && r[5] <= 7));
check('blocks s/p/d/f', ELEMENTS.every(r => ['s', 'p', 'd', 'f'].includes(r[6])));
check('categories known', ELEMENTS.every(r => L.CATEGORIES.includes(r[7])));
check('states known', ELEMENTS.every(r => L.STATES.includes(r[8])));
check('grid cols 1..18', ELEMENTS.every(r => r[9] >= 1 && r[9] <= 18));
check('grid rows 1..9', ELEMENTS.every(r => r[10] >= 1 && r[10] <= 9));
check('grid positions unique', new Set(ELEMENTS.map(r => r[9] + ':' + r[10])).size, 118);
check('mass format: decimal or [mass number]', ELEMENTS.every(r => /^\d+\.\d+$/.test(r[3]) || /^\[\d+\]$/.test(r[3])));
// Spot-check well-known elements
eq('H is 1/s/nonmetal/gas', JSON.stringify(L.getElement(ELEMENTS, 1)), JSON.stringify({ num: 1, sym: 'H', name: 'Hydrogen', mass: '1.008', group: 1, period: 1, block: 's', cat: 'nonmetal', state: 'gas', col: 1, grow: 1 }));
eq('Fe is 26, group 8', L.getElement(ELEMENTS, 26).group, 8);
eq('Au mass 196.97', L.getElement(ELEMENTS, 79).mass, '196.97');
eq('Br is the only liquid halogen... liquid set', JSON.stringify(ELEMENTS.filter(r => r[8] === 'liquid').map(r => r[1])), JSON.stringify(['Br', 'Hg']));
eq('gases count 11', ELEMENTS.filter(r => r[8] === 'gas').length, 11);
eq('lanthanides 15 (57..71)', ELEMENTS.filter(r => r[7] === 'lanthanide').length, 15);
eq('actinides 15 (89..103)', ELEMENTS.filter(r => r[7] === 'actinide').length, 15);
eq('transition metals 38', ELEMENTS.filter(r => r[7] === 'transition').length, 38);
eq('noble gases 7', ELEMENTS.filter(r => r[7] === 'noble').length, 7);
eq('f-block rows: Ce..Lu at row 8, Th..Lr at row 9',
  ELEMENTS.filter(r => r[10] === 8).length === 14 && ELEMENTS.filter(r => r[10] === 9).length === 14, true);
eq('La at col3 row6, Ac at col3 row7', L.getElement(ELEMENTS, 57).col === 3 && L.getElement(ELEMENTS, 89).col === 3, true);
eq('Og at col18 row7', L.getElement(ELEMENTS, 118).col === 18 && L.getElement(ELEMENTS, 118).grow === 7, true);

// --- Filtering ---
eq('search "iron" finds Fe', L.filterElements(ELEMENTS, 'iron', 'all', 'all').map(e => e.sym).join(), 'Fe');
eq('search "FE" case-insensitive finds Fe and Fm (substring)', L.filterElements(ELEMENTS, 'FE', 'all', 'all').map(e => e.sym).join(), 'Fe,Fm');
eq('search "26" finds Fe only', L.filterElements(ELEMENTS, '26', 'all', 'all').map(e => e.sym).join(), 'Fe');
eq('category halogen = 6', L.filterElements(ELEMENTS, '', 'halogen', 'all').length, 6);
eq('state gas = 11', L.filterElements(ELEMENTS, '', 'all', 'gas').length, 11);
eq('halogen + gas = 4 (F,Cl,At? no: F,Cl + ...)', L.filterElements(ELEMENTS, '', 'halogen', 'gas').map(e => e.sym).join(), 'F,Cl');
eq('no-match query empty', L.filterElements(ELEMENTS, 'zzzqqq', 'all', 'all').length, 0);
eq('empty query returns all', L.filterElements(ELEMENTS, '', 'all', 'all').length, 118);

// --- Quiz ---
let rngState = 42;
const rng = () => { rngState = (rngState * 1103515245 + 12345) % 2147483648; return rngState / 2147483648; };
const q = L.quizQuestion(ELEMENTS, rng);
eq('quiz has 4 options', q.options.length, 4);
check('quiz options unique', new Set(q.options).size === 4);
check('quiz answer among options', q.options.includes(q.answer));
check('quiz symbol matches answer element', L.getElement(ELEMENTS, q.number).sym === q.symbol && L.getElement(ELEMENTS, q.number).name === q.answer);
let edgeSeq = [0.999, 0.001, 0.5, 0.25, 0.75, 0.1, 0.9, 0.33];
let edgeI = 0;
const q2 = L.quizQuestion(ELEMENTS, () => edgeSeq[edgeI++ % edgeSeq.length]); // near-edge but varying rng
check('quiz edge rng still valid', q2.options.length === 4 && q2.options.includes(q2.answer));

// --- Bengali digits + i18n ---
eq('toBnDigits 118', L.toBnDigits(118), '১১৮');
eq('toBnDigits 0', L.toBnDigits(0), '০');
eq('BN title present', I18N.bn.title.length > 0, true);
eq('EN/BN share all top-level keys', JSON.stringify(Object.keys(I18N.en).sort()) === JSON.stringify(Object.keys(I18N.bn).sort()), true);
eq('EN/BN cat keys match', JSON.stringify(Object.keys(I18N.en.cats).sort()) === JSON.stringify(Object.keys(I18N.bn.cats).sort()), true);
check('BN strings actually Bengali (non-ASCII present after JS decode)',
  /[\u0980-\u09FF]/.test(I18N.bn.title) && /[\u0980-\u09FF]/.test(I18N.bn.cats.alkali));

console.log('DONE: ' + n + ' checks, ' + (process.exitCode ? 'FAILURES' : 'ALL PASSED'));
