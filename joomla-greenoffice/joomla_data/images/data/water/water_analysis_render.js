/**
 * Water analysis block renderer.
 * Fetches water_analysis.json (no-store) and binds to data-* attributes.
 * CSP-safe: no inline script; load this as external script.
 */
(function () {
    'use strict';

    var ANALYSIS_URL = '/greenoffice/images/data/water/water_analysis.json';

    function byAttr(name) {
        return document.querySelectorAll('[' + name + ']');
    }

    function setText(selector, text) {
        var el = document.querySelector(selector);
        if (el) el.textContent = text || '';
    }

    function setList(selector, items) {
        var el = document.querySelector(selector);
        if (!el) return;
        el.innerHTML = '';
        if (Array.isArray(items)) {
            items.forEach(function (item) {
                var li = document.createElement('li');
                li.textContent = item;
                el.appendChild(li);
            });
        }
    }

    function render(data) {
        var section = document.getElementById('water-analysis');
        if (section) {
            var errEl = section.querySelector('.water-analysis-error');
            if (errEl) errEl.textContent = '';
        }
        setText('[data-wbase]', data.baseline_m3_ytd_fmt);
        setText('[data-wcurr]', data.current_m3_ytd_fmt);
        setText('[data-wpct]', data.delta_pct_fmt + '%');
        setText('[data-wstatus]', data.status_label || '');
        setText('[data-wsummary]', data.summary || '');
        setList('[data-wfacts]', data.facts);
        setList('[data-wcauses]', data.causes);
        setList('[data-wactions]', data.actions);
        if (data.dataset_version) setText('[data-dataset-version]', data.dataset_version);
        if (data.csv_sha256) setText('[data-csv-sha256-8]', '(SHA256: ' + (data.csv_sha256 + '').substring(0, 8) + ')');
    }

    function showError(msg) {
        var s = 'ไม่สามารถโหลดการวิเคราะห์ได้: ' + (msg || 'Unknown error');
        setText('[data-wsummary]', s);
        setText('[data-wstatus]', '');
        var section = document.getElementById('water-analysis');
        if (section) {
            var errEl = section.querySelector('.water-analysis-error');
            if (!errEl) {
                errEl = document.createElement('p');
                errEl.className = 'water-analysis-error';
                errEl.setAttribute('role', 'alert');
                section.insertBefore(errEl, section.querySelector('[data-wsummary]'));
            }
            errEl.textContent = '⚠ ' + s;
            errEl.style.color = '#c62828';
        }
    }

    function load() {
        fetch(ANALYSIS_URL, { cache: 'no-store' })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + (res.statusText || ''));
                return res.json();
            })
            .then(render)
            .catch(function (err) {
                showError(err && err.message ? err.message : String(err));
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', load);
    } else {
        load();
    }
})();
