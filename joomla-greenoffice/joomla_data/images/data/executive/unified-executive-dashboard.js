/**
 * Unified Executive Dashboard JavaScript
 * Green Office Dashboard System
 * Version: 1.1
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        dataUrl: 'unified-summary.json',
        baseUrl: '/greenoffice'  // Joomla subpath
    };

    // DOM Elements
    const elements = {
        kpiGrid: document.getElementById('kpiGrid'),
        findingsGrid: document.getElementById('findingsGrid'),
        actionsList: document.getElementById('actionsList'),
        statusBanner: document.getElementById('statusBanner'),
        overallIcon: document.getElementById('overallIcon'),
        overallText: document.getElementById('overallText'),
        passedCount: document.getElementById('passedCount'),
        warningCount: document.getElementById('warningCount'),
        criticalCount: document.getElementById('criticalCount'),
        updateTime: document.getElementById('updateTime'),
        lastUpdate: document.getElementById('lastUpdate'),
        greenScoreCard: document.getElementById('greenScoreCard'),
        greenScoreValue: document.getElementById('greenScoreValue'),
        greenScoreRating: document.getElementById('greenScoreRating'),
        lastUpdatedDisplay: document.getElementById('lastUpdatedDisplay')
    };

    // Status mappings
    const STATUS_MAP = {
        good: { class: 'status-good', bannerClass: 'good' },
        warning: { class: 'status-warning', bannerClass: 'warning' },
        critical: { class: 'status-critical', bannerClass: 'critical' }
    };

    // Score mappings for Green Score calculation
    const SCORE_MAP = {
        good: 100,
        warning: 65,
        critical: 30
    };

    // Rating labels
    const RATING_LABELS = {
        excellent: 'ดีมาก',
        good: 'น่าพอใจ',
        warning: 'เฝ้าระวัง',
        critical: 'ต้องเร่งปรับปรุง'
    };

    // Impact level mapping
    const IMPACT_MAP = {
        water: { level: 'high', label: 'ผลกระทบสูง' },
        energy: { level: 'high', label: 'ผลกระทบสูง' },
        ghg: { level: 'high', label: 'ผลกระทบสูง' },
        paper: { level: 'medium', label: 'ผลกระทบปานกลาง' },
        waste: { level: 'low', label: 'ผลกระทบต่ำ' },
        fuel: { level: 'low', label: 'ผลกระทบต่ำ' }
    };

    // Trend icons
    const TREND_ICONS = {
        up: '📈',
        down: '📉',
        neutral: '➡️',
        stable: '➡️'
    };

    /**
     * Fetch and load dashboard data
     */
    async function loadDashboardData() {
        try {
            const response = await fetch(CONFIG.dataUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showError('ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบการเชื่อมต่อ');
            return null;
        }
    }

    /**
     * Show error message
     */
    function showError(message) {
        const container = document.querySelector('.dashboard-container');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.cssText = `
                background: #fed7d7;
                color: #c53030;
                padding: 1rem;
                border-radius: 8px;
                margin: 1rem 0;
                text-align: center;
            `;
            errorDiv.textContent = message;
            container.insertBefore(errorDiv, container.firstChild);
        }
    }

    /**
     * Format date for Thai locale
     */
    function formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }

    /**
     * Calculate Green Score from KPI statuses
     * Formula: average of status scores, rounded to integer
     * good = 100, warning = 65, critical = 30
     */
    function calculateGreenScore(kpis) {
        if (!kpis || kpis.length === 0) return 0;
        
        const totalScore = kpis.reduce((sum, kpi) => {
            const statusLevel = kpi.status.level;
            const score = SCORE_MAP[statusLevel] || 50;
            return sum + score;
        }, 0);
        
        return Math.round(totalScore / kpis.length);
    }

    /**
     * Get rating label and class based on score
     */
    function getScoreRating(score) {
        if (score >= 85) {
            return { label: RATING_LABELS.excellent, class: 'rating-excellent', scoreClass: 'score-excellent' };
        } else if (score >= 70) {
            return { label: RATING_LABELS.good, class: 'rating-good', scoreClass: 'score-good' };
        } else if (score >= 50) {
            return { label: RATING_LABELS.warning, class: 'rating-warning', scoreClass: 'score-warning' };
        } else {
            return { label: RATING_LABELS.critical, class: 'rating-critical', scoreClass: 'score-critical' };
        }
    }

    /**
     * Render Green Score card
     */
    function renderGreenScore(kpis, metadata) {
        const score = calculateGreenScore(kpis);
        const rating = getScoreRating(score);
        
        elements.greenScoreValue.textContent = score;
        elements.greenScoreRating.textContent = rating.label;
        
        // Add both rating class and score color band class to card
        elements.greenScoreCard.className = 'green-score-card ' + rating.scoreClass + ' ' + rating.class;
        
        // Update last updated display
        const updatedAt = metadata && metadata.updated_at ? metadata.updated_at : null;
        if (updatedAt) {
            const formattedDate = formatDate(updatedAt);
            elements.lastUpdatedDisplay.textContent = `อัปเดตล่าสุด: ${formattedDate}`;
        } else {
            elements.lastUpdatedDisplay.textContent = 'อัปเดตล่าสุด: ไม่ระบุวันที่';
        }
        
        console.log('Green Score calculated:', score, 'Rating:', rating.label);
    }

    /**
     * Render overall status banner
     */
    function renderStatusBanner(summary) {
        const statusConfig = STATUS_MAP[summary.overallStatus] || STATUS_MAP.warning;
        
        elements.statusBanner.className = `status-banner ${statusConfig.bannerClass}`;
        elements.overallIcon.textContent = summary.critical > 0 ? '⚠️' : (summary.warning > 0 ? '🟡' : '✅');
        elements.overallText.textContent = summary.overallMessage;
    }

    /**
     * Render summary counts
     */
    function renderSummaryCounts(summary) {
        elements.passedCount.textContent = summary.passed;
        elements.warningCount.textContent = summary.warning;
        elements.criticalCount.textContent = summary.critical;
    }

    /**
     * Create KPI card HTML
     */
    function createKpiCard(kpi) {
        const statusConfig = STATUS_MAP[kpi.status.level];
        const trendIcon = TREND_ICONS[kpi.metric.trend] || TREND_ICONS.neutral;
        
        const card = document.createElement('div');
        card.className = `kpi-card ${statusConfig.class}`;
        card.setAttribute('data-kpi-id', kpi.id);
        
        // Get impact level for this KPI
        const impact = IMPACT_MAP[kpi.id] || { level: 'medium', label: 'ผลกระทบปานกลาง' };
        
        // Build details HTML
        let detailsHtml = '';
        if (kpi.detail) {
            for (const [key, value] of Object.entries(kpi.detail)) {
                const label = formatDetailLabel(key);
                detailsHtml += `
                    <div class="detail-item">
                        <span class="detail-label">${label}</span>
                        <span class="detail-value">${value}</span>
                    </div>
                `;
            }
        }

        // Metric value class
        let metricClass = 'metric-value';
        if (kpi.metric.trend === 'up') metricClass += ' up';
        else if (kpi.metric.trend === 'down') metricClass += ' down';
        else metricClass += ' neutral';

        // Build trend indicator
        let trendIndicator = '';
        if (kpi.metric.trend === 'up') {
            trendIndicator = '<span class="trend-indicator trend-up">↑ เพิ่มขึ้น</span>';
        } else if (kpi.metric.trend === 'down') {
            trendIndicator = '<span class="trend-indicator trend-down">↓ ลดลง</span>';
        } else {
            trendIndicator = '<span class="trend-indicator trend-stable">→ ทรงตัว</span>';
        }

        card.innerHTML = `
            <span class="impact-badge impact-${impact.level}">${impact.label}</span>
            <div class="kpi-header">
                <div class="kpi-title-group">
                    <span class="kpi-category">หมวด ${kpi.category}</span>
                    <h3 class="kpi-title">${kpi.title}</h3>
                </div>
                <div class="kpi-status">
                    <span>${kpi.status.icon}</span>
                    <span>${kpi.status.text}</span>
                </div>
            </div>
            <div class="kpi-body">
                <div class="kpi-metric">
                    <span class="metric-label">${kpi.metric.label}</span>
                    <div>
                        <span class="${metricClass}">${kpi.metric.value}</span>
                        ${trendIndicator}
                    </div>
                </div>
                <div class="kpi-details">
                    ${detailsHtml}
                </div>
            </div>
            <div class="kpi-footer">
                <p class="kpi-summary">${kpi.summary}</p>
                <a href="${kpi.dashboardUrl}" class="kpi-action-btn" target="_blank">
                    📊 ดูรายละเอียด
                </a>
            </div>
        `;

        // Add click handler for card (optional - keep for accessibility)
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('kpi-action-btn')) {
                window.open(kpi.dashboardUrl, '_blank');
            }
        });

        return card;
    }

    /**
     * Format detail label to Thai
     */
    function formatDetailLabel(key) {
        const labels = {
            totalVolume: 'ปริมาณรวม',
            target: 'เป้าหมาย',
            actual: 'ผลลัพธ์',
            totalKwh: 'ไฟฟ้ารวม',
            totalCost: 'ค่าใช้จ่าย',
            kwhPerPerson: 'kWh/คน',
            totalLiter: 'น้ำมันรวม',
            savings: 'ประหยัด',
            totalReams: 'กระดาษรวม',
            perPerson: 'รีม/คน/ปี',
            treeEquiv: 'เทียบเท่าต้นไม้',
            diversionRate: 'Diversion Rate',
            hazardousRatio: 'Hazardous Ratio',
            totalKg: 'ขยะรวม',
            totalGhg: 'GHG รวม',
            scope2: 'Scope 2',
            scope1: 'Scope 1',
            scope3: 'Scope 3'
        };
        return labels[key] || key;
    }

    /**
     * Render KPI cards
     */
    function renderKpiCards(kpis) {
        // Sort by priority
        const sortedKpis = [...kpis].sort((a, b) => a.priority - b.priority);
        
        elements.kpiGrid.innerHTML = '';
        sortedKpis.forEach(kpi => {
            const card = createKpiCard(kpi);
            elements.kpiGrid.appendChild(card);
        });
    }

    /**
     * Create finding card HTML
     */
    function createFindingCard(finding) {
        const card = document.createElement('div');
        card.className = 'finding-card';
        card.innerHTML = `
            <div class="finding-icon">${finding.icon}</div>
            <div class="finding-content">
                <h3>${finding.title}</h3>
                <p>${finding.description}</p>
            </div>
        `;
        return card;
    }

    /**
     * Render findings
     */
    function renderFindings(findings) {
        elements.findingsGrid.innerHTML = '';
        findings.forEach(finding => {
            const card = createFindingCard(finding);
            elements.findingsGrid.appendChild(card);
        });
    }

    /**
     * Create action card HTML
     */
    function createActionCard(action) {
        const card = document.createElement('div');
        card.className = 'action-card';
        card.innerHTML = `
            <div class="action-priority">${action.priority}</div>
            <div class="action-icon">${action.icon}</div>
            <div class="action-content">
                <h3>${action.title}</h3>
                <p>${action.description}</p>
                <span class="action-impact">📌 ${action.impact}</span>
            </div>
        `;
        return card;
    }

    /**
     * Render priority actions
     */
    function renderActions(actions) {
        elements.actionsList.innerHTML = '';
        actions.forEach(action => {
            const card = createActionCard(action);
            elements.actionsList.appendChild(card);
        });
    }

    /**
     * Update timestamp displays
     */
    function updateTimestamps(data) {
        const now = new Date();
        const formattedNow = now.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        elements.updateTime.textContent = `อัปเดตล่าสุด: ${formattedNow}`;
        elements.lastUpdate.textContent = formatDate(data.generated) || formattedNow;
    }

    /**
     * Initialize dashboard
     */
    async function initDashboard() {
        console.log('Initializing Unified Executive Dashboard...');
        
        const data = await loadDashboardData();
        if (!data) return;

        console.log('Dashboard data loaded:', data);

        // Render all sections
        renderGreenScore(data.kpis, data.metadata);
        renderStatusBanner(data.summary);
        renderSummaryCounts(data.summary);
        renderKpiCards(data.kpis);
        renderFindings(data.keyFindings);
        renderActions(data.priorityActions);
        updateTimestamps(data);

        console.log('Dashboard initialized successfully');
    }

    /**
     * Initialize modal functionality
     */
    function initModal() {
        const helpBtn = document.getElementById('helpBtn');
        const modal = document.getElementById('guideModal');
        const closeBtn = document.getElementById('modalClose');
        
        if (!helpBtn || !modal || !closeBtn) {
            console.warn('Modal elements not found');
            return;
        }
        
        // Open modal
        helpBtn.addEventListener('click', function() {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        // Close modal with button
        closeBtn.addEventListener('click', function() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        // Close modal on overlay click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Close modal on ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        console.log('Modal initialized');
    }

    /**
     * Refresh dashboard data (optional)
     */
    async function refreshDashboard() {
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.textContent = 'กำลังโหลด...';
        }

        await initDashboard();

        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.textContent = '🔄 รีเฟรช';
        }
    }

    // Export for potential external use
    window.unifiedDashboard = {
        init: initDashboard,
        refresh: refreshDashboard,
        load: loadDashboardData
    };

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initDashboard();
            initModal();
        });
    } else {
        initDashboard();
        initModal();
    }

})();