// Periodic Table BD — headless-Chrome smoke test via raw CDP. Run: node tests/smoke.mjs
// Requires /opt/meta-chromium/chrome. Exits non-zero on any failed check.
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const INDEX = 'file://' + path.resolve(DIR, '..', 'index.html');
const PORT = 9334;
const chrome = spawn('/opt/meta-chromium/chrome', [
  '--headless=new', '--no-sandbox', '--disable-gpu',
  '--user-data-dir=/tmp/ptbd-smoke-profile',
  '--remote-debugging-port=' + PORT, 'about:blank',
], { stdio: 'ignore' });

let ws, msgId = 0;
const pending = new Map();
const consoleErrors = [];
function send(method, params = {}) {
  const id = ++msgId;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function ev(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  if (r.result?.subtype === 'error' || r.exceptionDetails) {
    throw new Error('evaluate failed: ' + expr + ' -> ' + JSON.stringify(r.exceptionDetails || r.result));
  }
  return r.result.value;
}
let checks = 0;
function check(name, cond) {
  checks++;
  if (!cond) throw new Error('CHECK FAILED: ' + name);
  console.log('ok - ' + name);
}
try {
  let targets;
  for (let i = 0; i < 50; i++) {
    try { targets = await (await fetch('http://127.0.0.1:' + PORT + '/json')).json(); break; }
    catch { await sleep(200); }
  }
  if (!targets) throw new Error('chrome debugging endpoint never came up');
  ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise((res) => { ws.onopen = res; });
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d.result ?? d); pending.delete(d.id); }
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') {
      consoleErrors.push(JSON.stringify(d.params.args));
    }
    if (d.method === 'Runtime.exceptionThrown') consoleErrors.push('exception');
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.navigate', { url: INDEX });
  for (let i = 0; i < 50; i++) {
    if (await ev("document.readyState === 'complete' && document.querySelectorAll('.cell').length === 118")) break;
    await sleep(200);
  }
  check('title is Periodic Table BD', await ev('document.title') === 'Periodic Table BD');
  check('grid renders 118 element cells', await ev("document.querySelectorAll('.cell').length") === 118);
  check('2 f-block range labels present', await ev("document.querySelectorAll('.range-label').length") === 2);
  check('10 legend chips present', await ev("document.querySelectorAll('#legend .chip').length") === 10);
  check('default detail is Hydrogen', await ev("document.getElementById('dName').textContent") === 'Hydrogen');
  check('clicking Fe shows Iron detail', await ev(
    "document.querySelector('[data-num=\"26\"]').click();" +
    "document.getElementById('dName').textContent === 'Iron' && document.getElementById('dMass').textContent === '55.845'"));
  check('search "gold" narrows to 1 visible + count text', await ev(
    "var s = document.getElementById('search'); s.value = 'gold'; s.dispatchEvent(new Event('input', {bubbles:true}));" +
    "document.querySelectorAll('.cell:not(.dim)').length === 1 && document.getElementById('matchCount').textContent.indexOf('1') !== -1"));
  check('category filter halogen leaves 6 visible', await ev(
    "var s = document.getElementById('search'); s.value = ''; s.dispatchEvent(new Event('input', {bubbles:true}));" +
    "document.getElementById('catFilter').value = 'halogen'; document.getElementById('catFilter').dispatchEvent(new Event('change', {bubbles:true}));" +
    "document.querySelectorAll('.cell:not(.dim)').length === 6"));
  check('no-match query shows empty state', await ev(
    "var s = document.getElementById('search'); s.value = 'zzzqqq'; s.dispatchEvent(new Event('input', {bubbles:true}));" +
    "document.getElementById('noMatch').style.display === 'block'"));
  check('clearing filters restores 118', await ev(
    "var s = document.getElementById('search'); s.value = ''; s.dispatchEvent(new Event('input', {bubbles:true}));" +
    "document.getElementById('catFilter').value = 'all'; document.getElementById('catFilter').dispatchEvent(new Event('change', {bubbles:true}));" +
    "document.querySelectorAll('.cell:not(.dim)').length === 118"));
  check('language toggle switches title to Bangla', await ev(
    "document.getElementById('langBtn').click();" +
    "document.querySelector('h1').textContent !== 'Periodic Table BD'"));
  check('Bengali digits render in match count', await ev(
    "document.getElementById('matchCount').textContent.indexOf('১১৮') !== -1"));
  check('language toggle back restores English title', await ev(
    "document.getElementById('langBtn').click();" +
    "document.querySelector('h1').textContent === 'Periodic Table BD'"));
  check('quiz renders 4 options + symbol', await ev(
    "document.querySelectorAll('.q-opt').length === 4 && document.getElementById('qSymbol').textContent.length >= 1"));
  check('quiz correct answer increments score', await ev(
    "var before = document.getElementById('qScore').textContent;" +
    "var won = false;" +
    "for (var i = 0; i < 12 && !won; i++) {" +
    "  document.getElementById('quizNew').click();" +
    "  document.querySelectorAll('.q-opt')[0].click();" +
    "  var fb = document.getElementById('qFeedback').textContent;" +
    "  if (fb.indexOf('Correct') !== -1) won = true;" +
    "}" +
    "won && document.getElementById('qScore').textContent !== before"));
  check('quiz new question regenerates 4 options', await ev(
    "document.getElementById('quizNew').click();" +
    "document.querySelectorAll('.q-opt').length === 4 && document.getElementById('qFeedback').textContent === ''"));
  await send('Page.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(300);
  check('390px: no horizontal overflow outside scroll container', await ev(
    "document.documentElement.scrollWidth <= 391"));
  check('no console errors or page exceptions', consoleErrors.length === 0);
  console.log('ALL ' + checks + ' SMOKE CHECKS PASSED');
} finally {
  try { ws?.close(); } catch {}
  chrome.kill('SIGKILL');
}
