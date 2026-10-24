// Periodic Table BD \u2014 pure logic (shared by app + node tests).
var CATEGORIES = ["alkali","alkaline","transition","post","metalloid","nonmetal","halogen","noble","lanthanide","actinide"];
var STATES = ["solid","liquid","gas"];

function elToObj(row) {
  return { num: row[0], sym: row[1], name: row[2], mass: row[3], group: row[4],
    period: row[5], block: row[6], cat: row[7], state: row[8], col: row[9], grow: row[10] };
}

function getElement(elements, num) {
  for (var i = 0; i < elements.length; i++) if (elements[i][0] === num) return elToObj(elements[i]);
  return null;
}

// Search matches name (substring, case-insensitive), symbol (exact-ish substring), or atomic number.
function matchesQuery(el, q) {
  q = (q || "").trim().toLowerCase();
  if (!q) return true;
  if (String(el.num) === q) return true;
  if (el.sym.toLowerCase().indexOf(q) !== -1) return true;
  if (el.name.toLowerCase().indexOf(q) !== -1) return true;
  return false;
}

function filterElements(elements, query, cat, state) {
  var out = [];
  for (var i = 0; i < elements.length; i++) {
    var el = elToObj(elements[i]);
    if (cat && cat !== "all" && el.cat !== cat) continue;
    if (state && state !== "all" && el.state !== state) continue;
    if (!matchesQuery(el, query)) continue;
    out.push(el);
  }
  return out;
}

// Quiz: pick an answer element + 3 distinct distractors, shuffled. rng defaults to Math.random; injectable for tests.
function quizQuestion(elements, rng) {
  rng = rng || Math.random;
  var answerIdx = Math.floor(rng() * elements.length);
  var answer = elToObj(elements[answerIdx]);
  var distractorIdx = [];
  var attempts = 0;
  while (distractorIdx.length < 3 && attempts < 1000) {
    attempts++;
    var j = Math.floor(rng() * elements.length);
    if (j !== answerIdx && distractorIdx.indexOf(j) === -1) distractorIdx.push(j);
  }
  // Degenerate-rng fallback: fill remaining slots deterministically.
  for (var f = 0; distractorIdx.length < 3 && f < elements.length; f++) {
    if (f !== answerIdx && distractorIdx.indexOf(f) === -1) distractorIdx.push(f);
  }
  var options = [answer.name];
  for (var k = 0; k < 3; k++) options.push(elToObj(elements[distractorIdx[k]]).name);
  // Fisher-Yates shuffle with injected rng.
  for (var s = options.length - 1; s > 0; s--) {
    var t = Math.floor(rng() * (s + 1));
    var tmp = options[s]; options[s] = options[t]; options[t] = tmp;
  }
  return { symbol: answer.sym, number: answer.num, answer: answer.name, options: options };
}

var BN_DIGITS = ["\u09e6","\u09e7","\u09e8","\u09e9","\u09ea","\u09eb","\u09ec","\u09ed","\u09ee","\u09ef"];
function toBnDigits(str) {
  return String(str).replace(/[0-9]/g, function (d) { return BN_DIGITS[+d]; });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CATEGORIES: CATEGORIES, STATES: STATES, elToObj: elToObj,
    getElement: getElement, matchesQuery: matchesQuery, filterElements: filterElements,
    quizQuestion: quizQuestion, toBnDigits: toBnDigits };
}
