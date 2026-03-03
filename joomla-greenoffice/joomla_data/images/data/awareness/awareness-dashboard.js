(function () {
  'use strict';

  var basePath = './';
  function el(id) { return document.getElementById(id); }

  function getSessionFromUrl() {
    var m = /[?&]session=([^&]+)/.exec(window.location.search || '');
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ').trim()) : '';
  }

  function setSessionInUrl(session) {
    var u = new URL(window.location.href);
    u.searchParams.set('session', session);
    window.history.replaceState({}, '', u.toString());
  }

  function baseUrl() {
    var p = window.location.pathname || '';
    return p.replace(/[^/]+$/, '') || './';
  }

  function safeSession(s) {
    return (s || '').replace(/[^\w\-]/g, '_');
  }

  function loadSessionsList(cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', basePath + 'awareness_sessions.json', true);
    xhr.onload = function () {
      if (xhr.status !== 200) { if (cb) cb([]); return; }
      try {
        var d = JSON.parse(xhr.responseText);
        if (cb) cb(d.sessions || []);
      } catch (e) { if (cb) cb([]); }
    };
    xhr.onerror = function () { if (cb) cb([]); };
    xhr.send();
  }

  var analyzeWebhookPath = '/n8n/webhook/awareness-analyze';

  function loadSummary(session, cb, noCache) {
    if (!session) { if (cb) cb(null); return; }
    var url = basePath + 'awareness_summary_' + safeSession(session) + '.json';
    if (noCache) url += '?t=' + Date.now();
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function () {
      if (xhr.status !== 200) {
        if (cb) cb(null);
        return;
      }
      try {
        var data = JSON.parse(xhr.responseText);
        if (cb) cb(data);
      } catch (e) { if (cb) cb(null); }
    };
    xhr.onerror = function () { if (cb) cb(null); };
    xhr.send();
  }

  function triggerAnalyze(session, cb) {
    if (!session) { if (cb) cb(); return; }
    var url = basePath + 'awareness-admin-api.php?action=analyze';
    fetch(url, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: session })
    }).then(function (res) { 
      return res.json();
    }).then(function (data) {
      if (cb) cb();
    }).catch(function () { 
      if (cb) cb(); 
    });
  }

  function toPct(x) {
    if (x == null || x !== x) return null;
    var n = typeof x === 'number' ? x : parseFloat(x);
    if (n >= -5 && n <= 5) return (n / 5) * 100;
    return n;
  }
  function formatPct(x) {
    var p = toPct(x);
    if (p == null) return '—';
    return (Math.round(p * 10) / 10) + '%';
  }

  function formatNum(x) {
    if (x == null || x !== x) return '—';
    var n = typeof x === 'number' ? x : parseFloat(x);
    return Number.isInteger(n) ? String(n) : (Math.round(n * 10) / 10);
  }

  function totalParticipants(kpis) {
    if (!kpis) return 0;
    var pre = (kpis.n_pre != null) ? kpis.n_pre : 0;
    var post = (kpis.n_post != null) ? kpis.n_post : 0;
    return pre + post;
  }

  function hasData(summary) {
    if (!summary || !summary.kpis) return false;
    var t = totalParticipants(summary.kpis);
    return t > 0;
  }

  function renderKpis(data) {
    var k = data && data.kpis ? data.kpis : {};
    var total = totalParticipants(k);
    var preMean = k.knowledge_pre_mean;
    var postMean = k.knowledge_post_mean;
    var lift = k.knowledge_lift;

    if (el('kpiTotal')) el('kpiTotal').textContent = formatNum(total);
    if (el('kpiPre')) el('kpiPre').textContent = preMean != null ? formatPct(preMean) : '—';
    if (el('kpiPost')) el('kpiPost').textContent = postMean != null ? formatPct(postMean) : '—';
    if (el('kpiImprovement')) {
      if (lift != null) {
        var s = formatPct(lift);
        el('kpiImprovement').textContent = (lift >= 0 ? '+' : '') + s;
      } else {
        el('kpiImprovement').textContent = '—';
      }
    }
  }

  function drawPrePostChart(preVal, postVal) {
    var canvas = el('chartPrePost');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var pad = 40;
    var pctPre = toPct(preVal);
    var pctPost = toPct(postVal);
    var v1 = pctPre != null ? pctPre : 0;
    var v2 = pctPost != null ? pctPost : 0;
    var maxVal = Math.max(v1, v2, 1);
    var barW = Math.min(120, (w - pad * 2 - 80) / 2);
    var barMaxH = h - pad * 2 - 24;
    var labels = ['ก่อนกิจกรรม', 'หลังกิจกรรม'];
    var values = [v1, v2];
    var colors = ['#7dd3c0', '#0d9488'];

    ctx.clearRect(0, 0, w, h);
    ctx.font = '14px system-ui, sans-serif';
    ctx.textBaseline = 'middle';

    var startX = pad + 40;
    var step = (w - pad * 2 - 80) / 2;
    labels.forEach(function (label, i) {
      var val = values[i];
      var barH = maxVal > 0 ? (val / maxVal) * barMaxH : 0;
      var x = startX + i * step + (step - barW) / 2;
      var yBar = h - pad - 20 - barH;
      ctx.fillStyle = colors[i] || '#0d9488';
      ctx.fillRect(x, yBar, barW, barH);
      ctx.fillStyle = '#1a1a2e';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + barW / 2, h - 8);
      ctx.fillText((Math.round(val * 10) / 10) + '%', x + barW / 2, yBar - 10);
    });
  }

  function updateHero(session, generatedAt) {
    if (el('heroSession')) el('heroSession').textContent = session || '—';
    if (el('heroUpdated')) {
      if (generatedAt) {
        el('heroUpdated').textContent = 'อัปเดตล่าสุด: ' + generatedAt.replace('Z', '').replace('T', ' ');
        el('heroUpdated').classList.remove('hidden');
      } else {
        el('heroUpdated').classList.add('hidden');
      }
    }
  }

  function setZeroStateLinks(session) {
    if (!session) return;
    var pre = el('linkPre');
    var post = el('linkPost');
    var base = baseUrl();
    var safe = encodeURIComponent(session);
    if (pre) { pre.href = base + 'awareness-form.html?session=' + safe + '&phase=pre'; }
    if (post) { post.href = base + 'awareness-form.html?session=' + safe + '&phase=post'; }
  }

  function initSessionDropdown(sessions, currentSession) {
    var sel = el('sessionSelect');
    if (!sel) return;
    sel.innerHTML = '';
    var opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = '— เลือกรอบกิจกรรม —';
    sel.appendChild(opt0);
    (sessions || []).forEach(function (s) {
      var opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      if (s === currentSession) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', function () {
      var s = sel.value;
      if (s) { setSessionInUrl(s); run(s); }
    });
  }

  function run(session) {
    session = session || getSessionFromUrl();
    setZeroStateLinks(session);
    loadSessionsList(function (sessions) {
      initSessionDropdown(sessions, session);
      if (!session) {
        el('zeroState').classList.remove('hidden');
        el('content').classList.add('hidden');
        if (el('heroSession')) el('heroSession').textContent = '—';
        if (el('zeroState')) {
          var actions = el('zeroState').querySelector('.zero-actions');
          if (actions) actions.classList.add('hidden');
        }
        return;
      }
      var zeroActions = el('zeroState') && el('zeroState').querySelector('.zero-actions');
      if (zeroActions) zeroActions.classList.remove('hidden');
      loadSummary(session, function (data) {
        updateHero(session, data && data.generated_at ? data.generated_at : null);
        if (!data || !hasData(data)) {
          el('zeroState').classList.remove('hidden');
          el('content').classList.add('hidden');
          return;
        }
        el('zeroState').classList.add('hidden');
        el('content').classList.remove('hidden');
        renderKpis(data);
        var k = data.kpis || {};
        drawPrePostChart(k.knowledge_pre_mean, k.knowledge_post_mean);
      });
    });
  }

  function doRefetch(scrollToResults, runAnalyzeFirst) {
    var session = el('sessionSelect') && el('sessionSelect').value ? el('sessionSelect').value : getSessionFromUrl();
    if (!session) return;
    var btnView = el('btnViewScores');
    var btnRef = el('btnRefetch');
    if (btnView) { btnView.disabled = true; btnView.textContent = runAnalyzeFirst ? 'กำลังประมวลผล...' : 'กำลังโหลด...'; }
    if (btnRef) { btnRef.disabled = true; btnRef.textContent = runAnalyzeFirst ? 'กำลังประมวลผล...' : 'กำลังโหลด...'; }
    function done(data) {
      if (btnView) { btnView.disabled = false; btnView.textContent = 'ดูผลคะแนน'; }
      if (btnRef) { btnRef.disabled = false; btnRef.textContent = 'อัปเดตข้อมูลล่าสุด'; }
      updateHero(session, data && data.generated_at ? data.generated_at : null);
      if (!data || !hasData(data)) {
        el('zeroState').classList.remove('hidden');
        el('content').classList.add('hidden');
        return;
      }
      el('zeroState').classList.add('hidden');
      el('content').classList.remove('hidden');
      renderKpis(data);
      var k = data.kpis || {};
      drawPrePostChart(k.knowledge_pre_mean, k.knowledge_post_mean);
      if (scrollToResults) {
        var content = el('content');
        if (content) content.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    if (runAnalyzeFirst) {
      triggerAnalyze(session, function () {
        setTimeout(function () {
          loadSummary(session, done, true);
        }, 4500);
      });
    } else {
      loadSummary(session, done, false);
    }
  }
  if (el('btnViewScores')) el('btnViewScores').addEventListener('click', function () { doRefetch(true, true); });
  if (el('btnRefetch')) el('btnRefetch').addEventListener('click', function () { doRefetch(false, false); });
  run();
})();
