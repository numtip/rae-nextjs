(function () {
    'use strict';
    var ANALYSIS_URL = '/greenoffice/images/data/energy/energy_analysis.json';
    function setText(sel, text) {
        var el = document.querySelector(sel);
        if (el) el.textContent = text || '';
    }
    function load() {
        fetch(ANALYSIS_URL, { cache: 'no-store' })
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
            .then(function (data) {
                if (data.dataset_version) setText('[data-dataset-version]', data.dataset_version);
                if (data.csv_sha256) setText('[data-csv-sha256-8]', '(SHA256: ' + (data.csv_sha256 + '').substring(0, 8) + ')');
                if (data.summary) setText('[data-summary]', data.summary);
            })
            .catch(function (err) { setText('[data-summary]', 'ไม่สามารถโหลดได้: ' + (err && err.message ? err.message : '')); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
    else load();
})();
