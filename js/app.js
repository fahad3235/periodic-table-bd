// Periodic Table BD \u2014 DOM app.
(function () {
  var lang = localStorage.getItem('ptbd-lang') || 'en';
  var selected = 1; // Hydrogen by default
  var score = 0, streak = 0, currentQ = null;

  function t(key) { return I18N[lang][key]; }
  function catName(c) { return I18N[lang].cats[c]; }
  function stateName(s) { return I18N[lang].states[s]; }
  function num(n) { return lang === 'bn' ? toBnDigits(n) : String(n); }

  function applyLang() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.getElementById('search').placeholder = t('searchPlaceholder');
    document.getElementById('langBtn').textContent = t('langBtn');
    buildCatOptions();
    buildLegend();
    renderTable();
    renderDetail();
    renderQuizLabels();
    document.documentElement.lang = lang === 'bn' ? 'bn' : 'en';
    localStorage.setItem('ptbd-lang', lang);
  }

  function buildCatOptions() {
    var sel = document.getElementById('catFilter');
    var cur = sel.value || 'all';
    sel.innerHTML = '';
    var optAll = document.createElement('option');
    optAll.value = 'all'; optAll.textContent = t('allCats');
    sel.appendChild(optAll);
    CATEGORIES.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c; o.textContent = catName(c);
      sel.appendChild(o);
    });
    sel.value = CATEGORIES.indexOf(cur) !== -1 ? cur : 'all';
    var st = document.getElementById('stateFilter');
    var curSt = st.value || 'all';
    st.innerHTML = '';
    var oAll = document.createElement('option');
    oAll.value = 'all'; oAll.textContent = t('allStates');
    st.appendChild(oAll);
    STATES.forEach(function (s) {
      var o = document.createElement('option');
      o.value = s; o.textContent = stateName(s);
      st.appendChild(o);
    });
    st.value = STATES.indexOf(curSt) !== -1 ? curSt : 'all';
  }

  function buildLegend() {
    var legend = document.getElementById('legend');
    legend.innerHTML = '';
    CATEGORIES.forEach(function (c) {
      var chip = document.createElement('button');
      chip.className = 'chip cat-' + c;
      chip.textContent = catName(c);
      chip.title = catName(c);
      chip.addEventListener('click', function () {
        document.getElementById('catFilter').value = c;
        renderTable();
      });
      legend.appendChild(chip);
    });
  }

  function renderTable() {
    var q = document.getElementById('search').value;
    var cat = document.getElementById('catFilter').value;
    var state = document.getElementById('stateFilter').value;
    var visible = filterElements(ELEMENTS, q, cat, state);
    var visibleNums = {};
    visible.forEach(function (el) { visibleNums[el.num] = true; });
    var grid = document.getElementById('grid');
    grid.querySelectorAll('.cell').forEach(function (cell) {
      var n = +cell.getAttribute('data-num');
      cell.classList.toggle('dim', !visibleNums[n]);
      cell.classList.toggle('sel', n === selected);
    });
    document.getElementById('matchCount').textContent =
      t('showing') + ' ' + num(visible.length) + ' ' + t('of') + ' ' + num(118) + ' ' + t('elements');
    document.getElementById('noMatch').style.display = visible.length === 0 ? 'block' : 'none';
  }

  function buildGrid() {
    var grid = document.getElementById('grid');
    ELEMENTS.forEach(function (row) {
      var el = elToObj(row);
      var cell = document.createElement('button');
      cell.className = 'cell cat-' + el.cat;
      cell.setAttribute('data-num', el.num);
      cell.style.gridColumn = el.col;
      cell.style.gridRow = el.grow;
      cell.innerHTML = '<span class="cell-num">' + el.num + '</span><span class="cell-sym">' + el.sym + '</span>';
      cell.title = el.name;
      cell.setAttribute('aria-label', el.name);
      cell.addEventListener('click', function () { selected = el.num; renderTable(); renderDetail(); });
      grid.appendChild(cell);
    });
    // f-block range labels
    var la = document.createElement('div');
    la.className = 'range-label'; la.style.gridColumn = 3; la.style.gridRow = 8;
    la.textContent = '57\u201371';
    grid.appendChild(la);
    var ac = document.createElement('div');
    ac.className = 'range-label'; ac.style.gridColumn = 3; ac.style.gridRow = 9;
    ac.textContent = '89\u2013103';
    grid.appendChild(ac);
  }

  function renderDetail() {
    var el = getElement(ELEMENTS, selected);
    if (!el) return;
    document.getElementById('dSym').textContent = el.sym;
    document.getElementById('dSym').className = 'd-sym cat-' + el.cat;
    document.getElementById('dName').textContent = el.name;
    document.getElementById('dNum').textContent = num(el.num);
    document.getElementById('dMass').textContent = el.mass;
    document.getElementById('dGroup').textContent = el.group === 0 ? t('groupDash') : num(el.group);
    document.getElementById('dPeriod').textContent = num(el.period);
    document.getElementById('dBlock').textContent = el.block + '-block';
    document.getElementById('dCat').textContent = catName(el.cat);
    document.getElementById('dState').textContent = stateName(el.state);
  }

  function renderQuizLabels() {
    document.getElementById('qScore').textContent = t('quizScore') + ': ' + num(score);
    document.getElementById('qStreak').textContent = t('quizStreak') + ': ' + num(streak);
  }

  function newQuestion() {
    currentQ = quizQuestion(ELEMENTS);
    document.getElementById('qSymbol').textContent = currentQ.symbol;
    document.getElementById('qNumber').textContent = num(currentQ.number);
    document.getElementById('qFeedback').textContent = '';
    var box = document.getElementById('qOptions');
    box.innerHTML = '';
    currentQ.options.forEach(function (name) {
      var b = document.createElement('button');
      b.className = 'q-opt';
      b.textContent = name;
      b.addEventListener('click', function () {
        if (b.disabled) return;
        box.querySelectorAll('.q-opt').forEach(function (x) { x.disabled = true; });
        if (name === currentQ.answer) {
          score++; streak++;
          document.getElementById('qFeedback').textContent = t('quizCorrect');
          document.getElementById('qFeedback').className = 'q-feedback ok';
        } else {
          streak = 0;
          document.getElementById('qFeedback').textContent = t('quizWrong') + ' ' + currentQ.answer;
          document.getElementById('qFeedback').className = 'q-feedback bad';
        }
        renderQuizLabels();
      });
      box.appendChild(b);
    });
    renderQuizLabels();
  }

  document.getElementById('langBtn').addEventListener('click', function () {
    lang = lang === 'en' ? 'bn' : 'en';
    applyLang();
  });
  document.getElementById('search').addEventListener('input', renderTable);
  document.getElementById('catFilter').addEventListener('change', renderTable);
  document.getElementById('stateFilter').addEventListener('change', renderTable);
  document.getElementById('quizNew').addEventListener('click', newQuestion);

  buildGrid();
  applyLang();
  newQuestion();
})();
