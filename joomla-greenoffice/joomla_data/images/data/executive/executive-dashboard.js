(() => {
  const DATA = {
    ghgCsv: './ghg_2567-2568_v1.csv?v=1',
    ghgCfg: './ghg_config.json?v=1',
    energyCsv: './energy_electricity_2567-2568_v1.csv?v=1',
    execCfg: './executive-config.json?v=1'
  };

  const el = (id) => document.getElementById(id);
  const errorBanner = el('errorBanner');

  let ghg = [];
  let energy = [];
  let config = { baseline_year: 2567, target_reduction_pct: -5, energy_target_reduction_pct: -5 };
  let mode = 'monthly';
  let charts = {};

  const cache = {
    ghgYearTotals: new Map(),
    ghgYearMonth: new Map(),
    ghgYearScope: new Map(),
    ghgYearActivity: new Map(),
    energyYearTotals: new Map(),
    energyYearMonth: new Map()
  };

  function showError(message) {
    if (!errorBanner) return;
    errorBanner.textContent = message;
    errorBanner.style.display = 'block';
  }

  function parseCSV(text) {
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    const rows = [];
    let cur = '';
    let inQ = false;
    let row = [];
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const n = text[i + 1];
      if (c === '"') {
        if (inQ && n === '"') { cur += '"'; i++; }
        else { inQ = !inQ; }
        continue;
      }
      if (c === ',' && !inQ) { row.push(cur); cur = ''; continue; }
      if ((c === '\n' || c === '\r') && !inQ) {
        if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
        cur = ''; row = [];
        if (c === '\r' && n === '\n') i++;
        continue;
      }
      cur += c;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }

  function toNum(v) {
    if (v == null) return null;
    const s = (v + '').trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function hydrate(rows) {
    if (!rows.length) return [];
    const header = rows[0];
    return rows.slice(1).map(r => {
      const obj = {};
      header.forEach((h, i) => obj[h] = r[i]);
      obj.year = toNum(obj.year);
      obj.month = toNum(obj.month);
      obj.emission_tco2e = toNum(obj.emission_tco2e);
      obj.value = toNum(obj.value || obj.kwh || obj.energy_kwh || obj.amount);
      return obj;
    }).filter(d => d.year && d.month);
  }

  function uniq(arr) {
    return [...new Set(arr)].filter(v => v != null && v !== '');
  }

  function sum(arr) {
    return arr.reduce((t, v) => t + (v || 0), 0);
  }

  function cacheKey(parts) {
    return parts.join('|');
  }

  function buildCache() {
    ghg.forEach(d => {
      const keyYear = cacheKey(['y', d.year]);
      cache.ghgYearTotals.set(keyYear, (cache.ghgYearTotals.get(keyYear) || 0) + (d.emission_tco2e || 0));

      const keyYM = cacheKey(['ym', d.year, d.month]);
      cache.ghgYearMonth.set(keyYM, (cache.ghgYearMonth.get(keyYM) || 0) + (d.emission_tco2e || 0));

      const keyYS = cacheKey(['ys', d.year, d.scope]);
      cache.ghgYearScope.set(keyYS, (cache.ghgYearScope.get(keyYS) || 0) + (d.emission_tco2e || 0));

      const keyYA = cacheKey(['ya', d.year, d.activity_name, d.scope]);
      cache.ghgYearActivity.set(keyYA, (cache.ghgYearActivity.get(keyYA) || 0) + (d.emission_tco2e || 0));
    });

    energy.forEach(d => {
      const keyYear = cacheKey(['y', d.year]);
      cache.energyYearTotals.set(keyYear, (cache.energyYearTotals.get(keyYear) || 0) + (d.value || 0));

      const keyYM = cacheKey(['ym', d.year, d.month]);
      cache.energyYearMonth.set(keyYM, (cache.energyYearMonth.get(keyYM) || 0) + (d.value || 0));
    });
  }

  function getGhgYearTotal(year) {
    return cache.ghgYearTotals.get(cacheKey(['y', year])) || 0;
  }

  function getEnergyYearTotal(year) {
    return cache.energyYearTotals.get(cacheKey(['y', year])) || 0;
  }

  function getMonthlySeries(map, year) {
    const months = [1,2,3,4,5,6,7,8,9,10,11,12];
    return months.map(m => map.get(cacheKey(['ym', year, m])) || 0);
  }

  function aggQuarterly(monthVals) {
    return [
      sum(monthVals.slice(0,3)),
      sum(monthVals.slice(3,6)),
      sum(monthVals.slice(6,9)),
      sum(monthVals.slice(9,12))
    ];
  }

  function aggYTD(monthVals) {
    let run = 0;
    return monthVals.map(v => { run += v; return run; });
  }

  function setTraffic(dotId, statusId, current, target) {
    let status = '-';
    let color = '#9ca3af';
    if (target != null) {
      if (current <= target) { status = 'Green'; color = '#10b981'; }
      else if (current < target * 1.10) { status = 'Amber'; color = '#f59e0b'; }
      else { status = 'Red'; color = '#ef4444'; }
    }
    el(statusId).textContent = status;
    el(dotId).style.background = color;
    return status;
  }

  function populateYearFilter() {
    const years = uniq([...ghg.map(d => d.year), ...energy.map(d => d.year)]).sort();
    const sel = el('yearFilter');
    sel.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
    sel.addEventListener('change', renderAll);

    const selGhg = el('ghgYearFilter');
    selGhg.innerHTML = ['<option value="">All</option>', ...years.map(y => `<option value="${y}">${y}</option>`)].join('');
    selGhg.addEventListener('change', renderGhgDrilldown);
  }

  function populateGhgFilters() {
    const scopes = uniq(ghg.map(d => d.scope)).sort();
    const acts = uniq(ghg.map(d => d.activity_name)).sort();
    el('ghgScopeFilter').innerHTML = ['<option value="">All</option>', ...scopes.map(s => `<option value="${s}">${s}</option>`)].join('');
    el('ghgActivityFilter').innerHTML = ['<option value="">All</option>', ...acts.map(a => `<option value="${a}">${a}</option>`)].join('');
    el('ghgScopeFilter').addEventListener('change', renderGhgDrilldown);
    el('ghgActivityFilter').addEventListener('change', renderGhgDrilldown);
  }

  function renderNarrative(year, ghgTotal, ghgYoy, energyTotal, energyYoy, ghgStatus, topSource) {
    const baseYear = config.baseline_year;
    const ghgVerb = ghgYoy < 0 ? 'ลดลง' : 'เพิ่มขึ้น';
    const ghgAbs = Math.abs(ghgYoy).toFixed(1);
    const energyVerb = energyYoy < 0 ? 'ลดลง' : 'เพิ่มขึ้น';
    const energyAbs = Math.abs(energyYoy).toFixed(1);
    const risk = (ghgStatus === 'Red') ? 'มีความเสี่ยงที่จะเกินเป้าหมาย' : 'ไม่มีความเสี่ยงที่ชัดเจนในขณะนี้';

    el('narrative').textContent =
      `ปี ${year} ปริมาณก๊าซเรือนกระจกอยู่ที่ ${ghgTotal.toFixed(2)} tCO2e ${ghgVerb} ${ghgAbs}% เมื่อเทียบกับปี ${baseYear} และ ${ghgStatus} เป้าหมายที่กำหนดไว้. ` +
      `การใช้ไฟฟ้ารวม ${energyTotal.toFixed(0)} kWh ${energyVerb} ${energyAbs}% เทียบกับปีก่อน. ` +
      `แหล่งปล่อยหลักคือ ${topSource || 'ไม่พบข้อมูลกิจกรรมหลัก'} และ ${risk}.`;
  }

  function renderExecutive() {
    const year = Number(el('yearFilter').value);
    const ghgTotal = getGhgYearTotal(year);
    const ghgPrev = getGhgYearTotal(year - 1);
    const ghgYoy = ghgPrev ? ((ghgTotal - ghgPrev) / ghgPrev * 100) : 0;

    const energyTotal = getEnergyYearTotal(year);
    const energyPrev = getEnergyYearTotal(year - 1);
    const energyYoy = energyPrev ? ((energyTotal - energyPrev) / energyPrev * 100) : 0;

    el('kpiGhg').textContent = `${ghgTotal.toFixed(2)} tCO2e`;
    el('kpiGhgYoy').textContent = `${ghgYoy.toFixed(1)}%`;
    el('kpiEnergy').textContent = `${energyTotal.toFixed(0)} kWh`;
    el('kpiEnergyYoy').textContent = `${energyYoy.toFixed(1)}%`;

    const baseGhg = getGhgYearTotal(config.baseline_year);
    const ghgTarget = baseGhg * (1 + (config.target_reduction_pct || 0) / 100);
    const energyTarget = energyPrev ? energyPrev * (1 + (config.energy_target_reduction_pct || 0) / 100) : null;

    const ghgStatus = setTraffic('dotGhg', 'statusGhg', ghgTotal, ghgTarget);
    setTraffic('dotEnergy', 'statusEnergy', energyTotal, energyTarget);

    let ghgMonthVals = getMonthlySeries(cache.ghgYearMonth, year);
    let energyMonthVals = getMonthlySeries(cache.energyYearMonth, year);

    let labels = [1,2,3,4,5,6,7,8,9,10,11,12].map(m => `M${m}`);
    if (mode === 'quarterly') {
      labels = ['Q1','Q2','Q3','Q4'];
      ghgMonthVals = aggQuarterly(ghgMonthVals);
      energyMonthVals = aggQuarterly(energyMonthVals);
    }
    if (mode === 'ytd') {
      ghgMonthVals = aggYTD(ghgMonthVals);
      energyMonthVals = aggYTD(energyMonthVals);
    }

    if (charts.ghgTrend) charts.ghgTrend.destroy();
    charts.ghgTrend = new Chart(el('chartGhgTrend'), {
      type: 'line',
      data: { labels, datasets: [{ label: `${year}`, data: ghgMonthVals, borderColor: '#0f766e', backgroundColor: 'rgba(15,118,110,.1)', fill: true, tension: 0.3 }] },
      options: { scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
    });

    if (charts.energyTrend) charts.energyTrend.destroy();
    charts.energyTrend = new Chart(el('chartEnergyTrend'), {
      type: 'line',
      data: { labels, datasets: [{ label: `${year}`, data: energyMonthVals, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,.1)', fill: true, tension: 0.3 }] },
      options: { scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
    });

    const scopes = uniq(ghg.map(d => d.scope)).sort();
    const scopeVals = scopes.map(s => cache.ghgYearScope.get(cacheKey(['ys', year, s])) || 0);
    if (charts.scopeExec) charts.scopeExec.destroy();
    charts.scopeExec = new Chart(el('chartScopeExec'), {
      type: 'doughnut',
      data: { labels: scopes, datasets: [{ data: scopeVals, backgroundColor: ['#0f766e','#f59e0b','#6366f1','#ef4444'] }] },
      options: { plugins: { legend: { position: 'bottom' } } }
    });

    if (charts.roadmapExec) charts.roadmapExec.destroy();
    charts.roadmapExec = new Chart(el('chartRoadmapExec'), {
      type: 'bar',
      data: { labels: ['Baseline','Current','Target'], datasets: [{ data: [baseGhg || 0, ghgTotal || 0, ghgTarget || 0], backgroundColor: ['#9ca3af','#0f766e','#10b981'] }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });

    const topMap = {};
    ghg.filter(d => d.year === year).forEach(d => { const k = d.activity_name; topMap[k] = (topMap[k] || 0) + (d.emission_tco2e || 0); });
    const topSource = Object.entries(topMap).sort((a,b) => b[1] - a[1])[0]?.[0];

    renderNarrative(year, ghgTotal, ghgYoy, energyTotal, energyYoy, ghgStatus, topSource);
  }

  function renderGhgDrilldown() {
    const yearVal = el('ghgYearFilter').value;
    const scopeVal = el('ghgScopeFilter').value;
    const actVal = el('ghgActivityFilter').value;

    const filtered = ghg.filter(d => (!yearVal || d.year == yearVal) && (!scopeVal || d.scope == scopeVal) && (!actVal || d.activity_name == actVal));

    const years = uniq(filtered.map(d => d.year)).sort();
    const year = years.length ? years[years.length - 1] : null;
    if (!year) return;

    const scopes = uniq(filtered.map(d => d.scope)).sort();
    const scopeVals = scopes.map(s => sum(filtered.filter(d => d.year === year && d.scope === s).map(d => d.emission_tco2e || 0)));

    if (charts.scopeDrill) charts.scopeDrill.destroy();
    charts.scopeDrill = new Chart(el('chartScopeDrill'), {
      type: 'doughnut',
      data: { labels: scopes, datasets: [{ data: scopeVals, backgroundColor: ['#0f766e','#f59e0b','#6366f1','#ef4444'] }] },
      options: { plugins: { legend: { position: 'bottom' } } }
    });

    let monthVals = [1,2,3,4,5,6,7,8,9,10,11,12].map(m => sum(filtered.filter(d => d.year === year && d.month === m).map(d => d.emission_tco2e || 0)));
    let labels = [1,2,3,4,5,6,7,8,9,10,11,12].map(m => `M${m}`);
    if (mode === 'quarterly') { labels = ['Q1','Q2','Q3','Q4']; monthVals = aggQuarterly(monthVals); }
    if (mode === 'ytd') { monthVals = aggYTD(monthVals); }

    if (charts.trendDrill) charts.trendDrill.destroy();
    charts.trendDrill = new Chart(el('chartTrendDrill'), {
      type: 'line',
      data: { labels, datasets: [{ label: `${year}`, data: monthVals, borderColor: '#0f766e', backgroundColor: 'rgba(15,118,110,.1)', fill: true, tension: 0.3 }] },
      options: { scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
    });

    const actMap = {};
    filtered.filter(d => d.year === year).forEach(d => { const k = d.activity_name; actMap[k] = (actMap[k] || 0) + (d.emission_tco2e || 0); });
    const topItems = Object.entries(actMap).sort((a,b) => b[1] - a[1]).slice(0,5);

    if (charts.topDrill) charts.topDrill.destroy();
    charts.topDrill = new Chart(el('chartTopDrill'), {
      type: 'bar',
      data: { labels: topItems.map(i => i[0]), datasets: [{ data: topItems.map(i => i[1]), backgroundColor: '#6366f1' }] },
      options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
    });

    const baseGhg = getGhgYearTotal(config.baseline_year);
    const currentTotal = sum(filtered.filter(d => d.year === year).map(d => d.emission_tco2e || 0));
    const target = baseGhg * (1 + (config.target_reduction_pct || 0) / 100);
    if (charts.roadmapDrill) charts.roadmapDrill.destroy();
    charts.roadmapDrill = new Chart(el('chartRoadmapDrill'), {
      type: 'bar',
      data: { labels: ['Baseline','Current','Target'], datasets: [{ data: [baseGhg || 0, currentTotal || 0, target || 0], backgroundColor: ['#9ca3af','#0f766e','#10b981'] }] },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });

    const table = el('ghgTableBody');
    const rows = Object.entries(actMap).sort((a,b) => b[1] - a[1]).slice(0,10).map(([act, total]) => {
      const scope = (filtered.find(d => d.activity_name === act) || {}).scope || '-';
      const avg = total / 12;
      return `<tr><td>${act}</td><td>${scope}</td><td>${total.toFixed(2)}</td><td>${avg.toFixed(2)}</td></tr>`;
    });
    table.innerHTML = rows.join('');
  }

  function renderIntegrity() {
    const ghgYears = uniq(ghg.map(d => d.year)).sort();
    const energyYears = uniq(energy.map(d => d.year)).sort();
    const ghgMonths = uniq(ghg.map(d => `${d.year}-${d.month}`));
    const latest = ghgMonths.sort().slice(-1)[0] || '-';
    el('integrity').textContent = `GHG rows: ${ghg.length} | Energy rows: ${energy.length} | Months: ${ghgMonths.length} | Latest period: ${latest} | Sources: GHG + Energy CSV`;
  }

  function initToggle() {
    el('modeToggle').addEventListener('click', (e) => {
      if (!e.target.dataset.mode) return;
      mode = e.target.dataset.mode;
      document.querySelectorAll('.btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
      renderAll();
    });
  }

  function initHelpModal() {
    const openBtn = el('helpOpen');
    const modal = el('helpModal');
    const closeBtn = el('helpClose');
    const overlay = el('helpOverlay');

    function open() {
      modal.setAttribute('aria-hidden', 'false');
      modal.classList.add('open');
      openBtn.focus();
    }

    function close() {
      modal.setAttribute('aria-hidden', 'true');
      modal.classList.remove('open');
      openBtn.focus();
    }

    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) close();
    });
  }

  function renderAll() {
    renderExecutive();
    renderGhgDrilldown();
  }

  async function init() {
    try {
      const [ghgRes, energyRes, ghgCfgRes, execCfgRes] = await Promise.all([
        fetch(DATA.ghgCsv, { cache: 'no-store' }),
        fetch(DATA.energyCsv, { cache: 'no-store' }),
        fetch(DATA.ghgCfg, { cache: 'no-store' }),
        fetch(DATA.execCfg, { cache: 'no-store' })
      ]);

      if (!ghgRes.ok) throw new Error(`GHG fetch failed: ${ghgRes.status}`);
      if (!energyRes.ok) throw new Error(`Energy fetch failed: ${energyRes.status}`);
      if (!ghgCfgRes.ok) throw new Error(`GHG config fetch failed: ${ghgCfgRes.status}`);
      if (!execCfgRes.ok) throw new Error(`Exec config fetch failed: ${execCfgRes.status}`);

      const [ghgText, energyText, ghgCfg, execCfg] = await Promise.all([
        ghgRes.text(),
        energyRes.text(),
        ghgCfgRes.json(),
        execCfgRes.json()
      ]);

      ghg = hydrate(parseCSV(ghgText));
      energy = hydrate(parseCSV(energyText));
      if (!ghg.length) throw new Error('GHG CSV parse produced zero rows');
      if (!energy.length) throw new Error('Energy CSV parse produced zero rows');

      config = { ...config, ...ghgCfg, ...execCfg };

      buildCache();
      populateYearFilter();
      populateGhgFilters();
      initToggle();
      initHelpModal();
      renderAll();
      renderIntegrity();
    } catch (err) {
      const msg = err && err.message ? err.message : 'Unknown error';
      showError(`Data error: ${msg}`);
      console.error(err);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
