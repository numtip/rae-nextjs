(() => {
  const DATA = {
    ghgCsv: './ghg_2566-2568_v1.csv?v=20260309-1',
    ghgCfg: './ghg_config.json?v=20260309-1',
    energyCsv: './energy_electricity_2567-2568_v1.csv?v=20260309-1',
    execCfg: './executive-config.json?v=20260309-1',
    ghgAnalysis: './ghg_analysis.json?v=20260309-1',
    resourceSummary: '../resource/resource_summary.json?v=20260309-1'
  };

  // Verified totals from Excel source files
  const VERIFIED_TOTALS = {
    2566: { total: 242.572360044, scope1: 11.308583364, scope2: 213.512888880, scope3: 17.750887800 },
    2567: { total: 220.986991200, scope1: 11.017186040, scope2: 192.534685360, scope3: 17.435119800 },
    2568: { total: 231.620303712, scope1: 10.847924292, scope2: 201.478096320, scope3: 19.294283100 }
  };

  // YoY changes
  const YOY_CHANGES = {
    '2566-2567': -8.8985277795,
    '2567-2568': 4.8117368603
  };

  const el = (id) => document.getElementById(id);
  const errorBanner = el('errorBanner');

  const fmtNum = (n, decimals = 0) => n.toLocaleString('th-TH', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});

  let ghg = [];
  let energy = [];
  let resourceSummary = {};
  let config = { baseline_year: 2566, target_reduction_pct: -5, energy_target_reduction_pct: -5 };
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

  function getYoY(year) {
    const prev = getGhgYearTotal(year - 1);
    const curr = getGhgYearTotal(year);
    if (!prev || prev === 0) return null;
    return ((curr - prev) / prev) * 100;
  }

  function renderNarrative(year, ghgTotal, ghgYoy, energyTotal, energyYoy, ghgStatus, topSource) {
    const baseYear = config.baseline_year || 2566;
    const ghgVerb = ghgYoy < 0 ? 'ลดลง' : 'เพิ่มขึ้น';
    const ghgAbs = Math.abs(ghgYoy).toFixed(1);
    const energyVerb = energyYoy < 0 ? 'ลดลง' : 'เพิ่มขึ้น';
    const energyAbs = Math.abs(energyYoy).toFixed(1);
    const risk = (ghgStatus === 'Red') ? 'มีความเสี่ยงที่จะเกินเป้าหมาย' : 'ไม่มีความเสี่ยงที่ชัดเจนในขณะนี้';

    // Enhanced narrative for 3-year context
    const baseTotal = getGhgYearTotal(baseYear);
    let comparison = '';
    if (year === 2568 && baseYear === 2566) {
      const yoy66_67 = YOY_CHANGES['2566-2567'];
      const yoy67_68 = YOY_CHANGES['2567-2568'];
      comparison = `เทียบกับปี 2566 พบว่า GHG ในปี ${year} ${year > baseYear ? 'เพิ่มขึ้น' : 'ลดลง'} ${Math.abs(ghgTotal - baseTotal).toFixed(2)} tCO2e (${((ghgTotal - baseTotal) / baseTotal * 100).toFixed(1)}%). `;
    }

    el('narrative').textContent =
      `ปี ${year} ปริมาณก๊าซเรือนกระจกอยู่ที่ ${fmtNum(ghgTotal, 2)} tCO2e ${ghgYoy !== null ? `(${ghgVerb} ${ghgAbs}% เมื่อเทียบปีก่อน)` : ''}. ` +
      `${comparison}` +
      `การใช้ไฟฟ้ารวม ${fmtNum(energyTotal, 0)} kWh ${energyYoy !== null ? `(${energyVerb} ${energyAbs}%)` : ''}. ` +
      `แหล่งปล่อยหลักคือ ${topSource || 'ไม่พบข้อมูลกิจกรรมหลัก'} (${ghgTotal > 0 ? ((topSource ? cache.ghgYearActivity.get(cacheKey(['ya', year, topSource, 'Scope 2'])) || 0 : 0) / ghgTotal * 100).toFixed(1) : 0}% ของทั้งหมด). ` +
      `${risk}.`;
  }

  function renderExecutive() {
    const year = Number(el('yearFilter').value);
    const ghgTotal = getGhgYearTotal(year);
    const ghgPrev = getGhgYearTotal(year - 1);
    const ghgYoy = ghgPrev ? ((ghgTotal - ghgPrev) / ghgPrev * 100) : null;

    const energyTotal = getEnergyYearTotal(year);
    const energyPrev = getEnergyYearTotal(year - 1);
    const energyYoy = energyPrev ? ((energyTotal - energyPrev) / energyPrev * 100) : null;

    el('kpiGhg').textContent = `${fmtNum(ghgTotal, 2)} tCO2e`;
    el('kpiGhgYoy').textContent = ghgYoy !== null ? `${ghgYoy.toFixed(1)}%` : '-';
    el('kpiEnergy').textContent = `${fmtNum(energyTotal, 0)} kWh`;
    el('kpiEnergyYoy').textContent = energyYoy !== null ? `${energyYoy.toFixed(1)}%` : '-';

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
      return `<tr><td>${act}</td><td>${scope}</td><td>${fmtNum(total, 2)}</td><td>${fmtNum(avg, 2)}</td></tr>`;
    });
    table.innerHTML = rows.join('');
  }

  function renderIntegrity() {
    const ghgYears = uniq(ghg.map(d => d.year)).sort();
    const energyYears = uniq(energy.map(d => d.year)).sort();
    const ghgMonths = uniq(ghg.map(d => `${d.year}-${d.month}`));
    const latest = ghgMonths.sort().slice(-1)[0] || '-';

    // Build integrity message with data sources
    const sources = [];
    sources.push('GHG Data Sources:');
    if (ghgYears.includes(2566)) sources.push('• 2566: 1.5_greenhousegass_update.xlsx');
    if (ghgYears.includes(2567)) sources.push('• 2567: 1.5_greenhousegass_update.xlsx');
    if (ghgYears.includes(2568)) sources.push('• 2568: 1.5_GreenhouseGas.xlsx');

    // Verification status
    const verification = [];
    verification.push('Verified Totals (tCO2e):');
    ghgYears.forEach(y => {
      const calc = getGhgYearTotal(y);
      const expected = VERIFIED_TOTALS[y]?.total;
      const match = expected && Math.abs(calc - expected) < 0.001;
      verification.push(`• ${y}: ${calc.toFixed(2)} ${match ? '✓' : '(expected: ' + expected.toFixed(2) + ')'}`);
    });

    const resourceInfo = resourceSummary.summary || '-';
    el('integrity').innerHTML = 
      `<div style="font-size:12px;line-height:1.6">` +
      `<strong>Data Sources:</strong><br>${sources.join('<br>')}<br><br>` +
      `<strong>Verification:</strong><br>${verification.join('<br>')}<br><br>` +
      `<strong>Stats:</strong> GHG rows: ${ghg.length} | Energy rows: ${energy.length} | Latest: ${latest}<br>` +
      `<span style="color:#6b7280">Note: Some categories may be zero where workbook values are zero or not recorded.</span>` +
      `</div>`;
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
    render3YearTrend();
  }

  function render3YearTrend() {
    const years = [2566, 2567, 2568];
    const scope1Data = years.map(y => VERIFIED_TOTALS[y]?.scope1 || 0);
    const scope2Data = years.map(y => VERIFIED_TOTALS[y]?.scope2 || 0);
    const scope3Data = years.map(y => VERIFIED_TOTALS[y]?.scope3 || 0);

    if (charts.trend3Year) charts.trend3Year.destroy();
    charts.trend3Year = new Chart(el('chart3YearTrend'), {
      type: 'bar',
      data: {
        labels: years.map(y => `${y}`),
        datasets: [
          { label: 'Scope 1', data: scope1Data, backgroundColor: '#0f766e', barThickness: 28 },
          { label: 'Scope 2', data: scope2Data, backgroundColor: '#f59e0b', barThickness: 28 },
          { label: 'Scope 3', data: scope3Data, backgroundColor: '#6366f1', barThickness: 28 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              footer: (items) => {
                const total = items.reduce((sum, item) => sum + item.parsed.y, 0);
                return `รวม: ${total.toFixed(2)} tCO2e`;
              }
            }
          }
        },
        scales: {
          x: { stacked: true },
          y: { 
            stacked: true, 
            beginAtZero: true,
            title: { display: true, text: 'tCO2e' }
          }
        }
      }
    });
  }

  function updateScoreCard() {
    const total2568 = VERIFIED_TOTALS[2568]?.total || 0;
    const total2567 = VERIFIED_TOTALS[2567]?.total || 0;
    const total2566 = VERIFIED_TOTALS[2566]?.total || 0;
    const scope2_2568 = VERIFIED_TOTALS[2568]?.scope2 || 0;

    const diffVs2567 = total2568 - total2567;
    const pctVs2567 = ((total2568 - total2567) / total2567 * 100);
    const diffVs2566 = total2568 - total2566;
    const pctVs2566 = ((total2568 - total2566) / total2566 * 100);
    const scope2Share = (scope2_2568 / total2568 * 100);

    el('scoreTotalGhg').textContent = `${fmtNum(total2568, 2)} tCO2e`;
    
    el('scoreVs2567').textContent = `${diffVs2567 >= 0 ? '+' : ''}${fmtNum(diffVs2567, 2)}`;
    el('scoreVs2567Delta').textContent = `${diffVs2567 >= 0 ? 'เพิ่มขึ้น' : 'ลดลง'} ${diffVs2567 >= 0 ? '+' : ''}${pctVs2567.toFixed(2)}%`;
    el('scoreVs2567Delta').className = `scorecard-delta ${diffVs2567 >= 0 ? 'up' : 'down'}`;
    
    el('scoreVs2566').textContent = `${diffVs2566 >= 0 ? '+' : ''}${fmtNum(diffVs2566, 2)}`;
    el('scoreVs2566Delta').textContent = `${diffVs2566 >= 0 ? 'เพิ่มขึ้น' : 'ลดลง'} ${diffVs2566 >= 0 ? '+' : ''}${pctVs2566.toFixed(2)}%`;
    el('scoreVs2566Delta').className = `scorecard-delta ${diffVs2566 >= 0 ? 'up' : 'down'}`;
    
    el('scoreScope2Share').textContent = `${scope2Share.toFixed(2)}%`;
  }

  function updateTargetSection() {
    const total2568 = VERIFIED_TOTALS[2568]?.total || 0;
    const targetValue = total2568 * 0.90;
    const gap = total2568 - targetValue;
    const progressPct = Math.min(100, (targetValue / total2568) * 100);

    el('targetValue').textContent = `${fmtNum(targetValue, 2)} tCO2e`;
    el('targetGap').textContent = `${fmtNum(gap, 2)} tCO2e`;
    el('targetProgressBar').style.width = `${progressPct}%`;

    const summary = `ปี 2568 มีการปล่อย GHG เพิ่มขึ้นจากปี 2567 คิดเป็น +4.81% ส่วนใหญ่มาจากการใช้ไฟฟ้า อย่างไรก็ตาม ยังต่ำกว่าปี 2566 ถึง -4.51% หากตั้งเป้าลด 10% จาก 2568 (เป้า ${fmtNum(targetValue, 2)} tCO2e) จะต้องลดอีก ${fmtNum(gap, 2)} tCO2e`;
    el('targetSummary').textContent = summary;
  }

  async function init() {
    try {
      const [ghgRes, energyRes, ghgCfgRes, execCfgRes, resourceRes] = await Promise.all([
        fetch(DATA.ghgCsv, { cache: 'no-store' }),
        fetch(DATA.energyCsv, { cache: 'no-store' }),
        fetch(DATA.ghgCfg, { cache: 'no-store' }),
        fetch(DATA.execCfg, { cache: 'no-store' }),
        fetch(DATA.resourceSummary, { cache: 'no-store' })
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

      // Load resource summary (non-blocking)
      if (resourceRes.ok) {
        resourceSummary = await resourceRes.json();
        console.log('Resource summary loaded:', resourceSummary.summary);
      }

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
      updateScoreCard();
      updateTargetSection();

      // Log verification
      console.log('=== GHG Data Verification ===');
      const years = uniq(ghg.map(d => d.year)).sort();
      years.forEach(y => {
        const calc = getGhgYearTotal(y);
        const expected = VERIFIED_TOTALS[y]?.total;
        console.log(`Year ${y}: Calculated=${calc.toFixed(6)}, Expected=${expected}, Match=${expected && Math.abs(calc - expected) < 0.001}`);
      });

    } catch (err) {
      const msg = err && err.message ? err.message : 'Unknown error';
      showError(`Data error: ${msg}`);
      console.error(err);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();