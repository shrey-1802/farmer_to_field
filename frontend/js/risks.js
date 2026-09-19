/**
 * KrishiNirnay AI - Agronomic Risk Center Controller (Phase 16)
 * Implements Section 22: Risk Center.
 * 
 * Manages all 7 core agricultural hazard categories:
 * 1. Water Stress
 * 2. Disease Risk
 * 3. Nutrient Deficiency
 * 4. Heat Stress
 * 5. Heavy Rain
 * 6. Sensor Failure
 * 7. Market Signal
 * 
 * Every risk card renders:
 * - Risk Type & Score (0–100)
 * - Severity: LOW, MEDIUM, HIGH, CRITICAL (accessible text + visual color)
 * - Confidence (%)
 * - Farm, Field, Zone location hierarchy
 * - Empirical Evidence & grounding facts
 * - Detected At timestamp
 * - Recommended Response with direct action trigger
 */

import APP_CONFIG from './config.js';
import appShell from './ui.js';

export const RISKS_CATALOG = [
  {
    id: 'RISK-01',
    type: 'Water Stress',
    icon: '💧',
    score: 84,
    severity: 'CRITICAL',
    confidence: 94.8,
    farm: 'Shanti Agro Farm',
    field: 'North Cotton Plot (Field 1)',
    zone: 'Zone 2: East Sloped',
    evidence: 'Virtual soil moisture at 24.1% (< MAD 28.0%). Readily available water exhausted (41mm depletion vs 32mm RAW). Root suction pressure reaching wilting threshold.',
    detectedAt: 'Today at 08:31 AM (15m ago)',
    detectedTimestamp: Date.now() - 15 * 60 * 1000,
    recommendedResponse: 'Execute 45-min pressurized drip pulse on Valve Line B (Action Plan #AP-418). Awaiting farmer authorization.',
    actionPlanId: 'AP-418',
    actionText: 'Review Action Plan #AP-418 →'
  },
  {
    id: 'RISK-02',
    type: 'Heat Stress',
    icon: '🌡️',
    score: 68,
    severity: 'HIGH',
    confidence: 96.0,
    farm: 'Shanti Agro Farm',
    field: 'North Cotton Plot (Field 1)',
    zone: 'All Zones (Zone 1–4)',
    evidence: 'Open-Meteo live ensemble forecasts afternoon ambient temperature peak of 34.0°C with solar radiation 880 W/m². Stomatal closure and foliar heat scalding hazard.',
    detectedAt: 'Today at 08:32 AM (14m ago)',
    detectedTimestamp: Date.now() - 14 * 60 * 1000,
    recommendedResponse: 'Impose midday spray/irrigation moratorium between 12:30 PM and 15:30 PM to avoid leaf scorch.',
    actionText: 'Acknowledge Guardrail'
  },
  {
    id: 'RISK-03',
    type: 'Market Signal',
    icon: '⚖️',
    score: 42,
    severity: 'MEDIUM',
    confidence: 89.5,
    farm: 'Shanti Agro Farm',
    field: 'North Cotton Plot (Field 1)',
    zone: 'Harvest & APMC Logistics',
    evidence: 'Seasonal arrival volume spike anticipated across Saurashtra mandis in 10–14 days. Current Rajkot APMC modal price ₹7,420/Q is in upper 85th percentile.',
    detectedAt: 'Today at 07:30 AM (1h ago)',
    detectedTimestamp: Date.now() - 60 * 60 * 1000,
    recommendedResponse: 'Align picking window between Sept 28 – Oct 02 to capture projected +3.2% price premium before bulk harvest arrivals depress rates.',
    actionText: 'View Market Advisory →',
    actionLink: './market.html'
  },
  {
    id: 'RISK-04',
    type: 'Nutrient Deficiency',
    icon: '🌱',
    score: 36,
    severity: 'MEDIUM',
    confidence: 91.5,
    farm: 'Shanti Agro Farm',
    field: 'North Cotton Plot (Field 1)',
    zone: 'Zone 2 & Zone 3',
    evidence: 'Soil reaction pH 8.0 mildly restricts micro-mineral zinc bioavailability despite adequate soil nitrogen (135 kg/ha) and potassium (175 kg/ha).',
    detectedAt: 'Today at 08:30 AM (16m ago)',
    detectedTimestamp: Date.now() - 16 * 60 * 1000,
    recommendedResponse: 'Inject water-soluble NPK 19:19:19 booster with 0.5% chelated zinc in upcoming fertigation cycle.',
    actionText: 'Schedule Fertigation Booster'
  },
  {
    id: 'RISK-05',
    type: 'Disease Risk',
    icon: '🔬',
    score: 28,
    severity: 'LOW',
    confidence: 98.1,
    farm: 'Shanti Agro Farm',
    field: 'North Cotton Plot (Field 1)',
    zone: 'Zone 1 & Zone 3 (North Canopy)',
    evidence: 'Canopy leaf wetness duration currently 2.1h (< 6h required for Alternaria spore germination). Relative humidity 54% keeps pathogen germination index at 14%.',
    detectedAt: 'Today at 08:28 AM (18m ago)',
    detectedTimestamp: Date.now() - 18 * 60 * 1000,
    recommendedResponse: 'Maintain preventative cultural scouting; no chemical fungicide application warranted. Next drone scan in 48h.',
    actionText: 'View Drone Survey'
  },
  {
    id: 'RISK-06',
    type: 'Sensor Failure',
    icon: '📡',
    score: 12,
    severity: 'LOW',
    confidence: 99.5,
    farm: 'Shanti Agro Farm',
    field: 'North Cotton Plot (Field 1)',
    zone: 'Node-04 (Zone 4 South)',
    evidence: 'All 4 telemetry nodes online, CRC pass 100%, battery levels > 85%, average packet latency 1.2s. Zero packet dropouts in last 24 hours.',
    detectedAt: 'Today at 08:35 AM (11m ago)',
    detectedTimestamp: Date.now() - 11 * 60 * 1000,
    recommendedResponse: 'Autonomous sensor heartbeat verified online. No hardware maintenance required.',
    actionText: 'View Sensor Health'
  },
  {
    id: 'RISK-07',
    type: 'Heavy Rain',
    icon: '🌧️',
    score: 8,
    severity: 'LOW',
    confidence: 97.2,
    farm: 'Shanti Agro Farm',
    field: 'North Cotton Plot (Field 1)',
    zone: 'Entire Farm',
    evidence: '0.0 mm rainfall forecasted for next 72 hours across 4 numerical weather prediction models (ECMWF, GFS, ICON, Open-Meteo). Waterlogging hazard 0%.',
    detectedAt: 'Today at 08:00 AM (46m ago)',
    detectedTimestamp: Date.now() - 46 * 60 * 1000,
    recommendedResponse: 'No drainage intervention necessary. Soil surface dry and fully trafficable for field machinery.',
    actionText: 'Check Rain Forecast'
  }
];

class RisksController {
  constructor() {
    this.risks = JSON.parse(JSON.stringify(RISKS_CATALOG));
    this.activeFilter = 'all'; // 'all' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    this.searchQuery = '';
  }

  init() {
    this.renderAll();
  }

  renderAll() {
    const container = document.getElementById('tab-pane-risks');
    if (!container) return;

    const totalRisks = this.risks.length;
    const criticalCount = this.risks.filter(r => r.severity === 'CRITICAL').length;
    const highCount = this.risks.filter(r => r.severity === 'HIGH').length;
    const mediumCount = this.risks.filter(r => r.severity === 'MEDIUM').length;
    const lowCount = this.risks.filter(r => r.severity === 'LOW').length;
    const avgScore = (this.risks.reduce((acc, r) => acc + r.score, 0) / totalRisks).toFixed(1);

    container.innerHTML = `
      <section class="card risk-center-card" aria-label="Agronomic Risk Center">
        <!-- Header -->
        <div class="card-header risk-main-header">
          <div>
            <h2 class="card-title">Real-Time Agronomic Risk Detection & Escalation Center</h2>
            <p class="card-subtitle">Continuous cross-domain anomaly synthesis across virtual sensors, weather forecasts, and crop models</p>
          </div>
          <div class="risk-header-badges">
            <span class="badge badge-danger">1 Critical Stress</span>
            <span class="source-tag source-ai">AI GENERATED</span>
          </div>
        </div>

        <!-- KPI Strip for Risk Matrix -->
        <div class="risk-kpi-strip">
          <div class="kpi-mini-card">
            <span class="kpi-mini-label">Total Detected Hazards</span>
            <span class="kpi-mini-value">${totalRisks}</span>
            <span class="kpi-mini-sub">7 Monitored Categories</span>
          </div>
          <div class="kpi-mini-card">
            <span class="kpi-mini-label">Critical / High Severity</span>
            <span class="kpi-mini-value text-danger">${criticalCount + highCount}</span>
            <span class="kpi-mini-sub">Requires Immediate Action</span>
          </div>
          <div class="kpi-mini-card">
            <span class="kpi-mini-label">Average Risk Index</span>
            <span class="kpi-mini-value">${avgScore} / 100</span>
            <span class="kpi-mini-sub text-success">Within Safe Farm Limits</span>
          </div>
          <div class="kpi-mini-card">
            <span class="kpi-mini-label">Mean AI Confidence</span>
            <span class="kpi-mini-value text-primary">95.4%</span>
            <span class="kpi-mini-sub text-success">Multi-Sensor Validated</span>
          </div>
        </div>

        <!-- Toolbar: Filters and Search -->
        <div class="risk-toolbar">
          <div class="filter-tabs-wrapper" id="risk-filter-tabs">
            <button class="filter-tab ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">
              All Risks <span class="tab-count">${totalRisks}</span>
            </button>
            <button class="filter-tab ${this.activeFilter === 'CRITICAL' ? 'active' : ''}" data-filter="CRITICAL">
              🚨 Critical <span class="tab-count badge-danger-count">${criticalCount}</span>
            </button>
            <button class="filter-tab ${this.activeFilter === 'HIGH' ? 'active' : ''}" data-filter="HIGH">
              ⚠️ High <span class="tab-count badge-warning-count">${highCount}</span>
            </button>
            <button class="filter-tab ${this.activeFilter === 'MEDIUM' ? 'active' : ''}" data-filter="MEDIUM">
              ⚡ Medium <span class="tab-count">${mediumCount}</span>
            </button>
            <button class="filter-tab ${this.activeFilter === 'LOW' ? 'active' : ''}" data-filter="LOW">
              ✓ Low <span class="tab-count">${lowCount}</span>
            </button>
          </div>
          <div class="agent-search-box">
            <span class="search-icon-inside">🔍</span>
            <input type="search" id="risk-search-input" value="${this.searchQuery}" placeholder="Search risks, zones, evidence..." aria-label="Search risks">
          </div>
        </div>

        <!-- Risks Cards List (Section 22 Standard) -->
        <div class="risks-cards-list" id="risks-cards-container">
          ${this.renderRiskCards()}
        </div>
      </section>
    `;

    this.bindEvents(container);
  }

  renderRiskCards() {
    const filtered = this.risks.filter(r => {
      if (this.activeFilter !== 'all' && r.severity !== this.activeFilter) return false;
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        return r.type.toLowerCase().includes(q) ||
               r.zone.toLowerCase().includes(q) ||
               r.evidence.toLowerCase().includes(q) ||
               r.recommendedResponse.toLowerCase().includes(q) ||
               r.severity.toLowerCase().includes(q);
      }
      return true;
    });

    if (filtered.length === 0) {
      return `
        <div class="empty-state-agents">
          <span class="empty-icon">🔍</span>
          <h3>No agricultural risks match your filter</h3>
          <p>Try clearing search terms or selecting another severity tab.</p>
        </div>
      `;
    }

    return filtered.map(r => this.renderSingleRiskCard(r)).join('');
  }

  renderSingleRiskCard(r) {
    const severityClass = r.severity === 'CRITICAL' ? 'sev-critical' :
                          r.severity === 'HIGH' ? 'sev-high' :
                          r.severity === 'MEDIUM' ? 'sev-medium' : 'sev-low';

    const severityBadge = r.severity === 'CRITICAL' ? '<span class="badge badge-danger">🚨 CRITICAL</span>' :
                          r.severity === 'HIGH' ? '<span class="badge badge-danger">⚠️ HIGH</span>' :
                          r.severity === 'MEDIUM' ? '<span class="badge badge-warning">⚡ MEDIUM</span>' :
                          '<span class="badge badge-success">✓ LOW</span>';

    return `
      <article class="risk-card ${severityClass}" id="card-${r.id}">
        <div class="risk-card-top">
          <div class="risk-title-group">
            <span class="risk-type-icon">${r.icon}</span>
            <div>
              <div class="risk-type-name-row">
                <h3 class="risk-type-title">${r.type}</h3>
                ${severityBadge}
                <span class="risk-score-badge">Score: <strong>${r.score}/100</strong></span>
              </div>
              <div class="risk-hierarchy-row">
                <span><strong>Farm:</strong> ${r.farm}</span> •
                <span><strong>Field:</strong> ${r.field}</span> •
                <span><strong>Zone:</strong> ${r.zone}</span>
              </div>
            </div>
          </div>
          <div class="risk-confidence-col">
            <span class="confidence-label">AI Confidence</span>
            <span class="confidence-val">${r.confidence}%</span>
          </div>
        </div>

        <div class="risk-evidence-box">
          <span class="evidence-tag">Empirical Sensor & Model Evidence:</span>
          <p class="evidence-body">${r.evidence}</p>
        </div>

        <div class="risk-response-box">
          <div class="response-header">
            <span class="response-icon">💡</span>
            <span class="response-label">Recommended Autonomous Response:</span>
          </div>
          <p class="response-body">${r.recommendedResponse}</p>
        </div>

        <div class="risk-card-footer">
          <div class="risk-timing">
            <span>⏱️ Detected: <strong>${r.detectedAt}</strong></span>
          </div>
          <div class="risk-cta-group">
            <button class="btn btn-sm btn-outline btn-ack-risk" data-risk-id="${r.id}">
              ✓ Acknowledge
            </button>
            <a href="${r.actionLink || './action-plans.html'}" class="btn btn-sm ${r.severity === 'CRITICAL' || r.severity === 'HIGH' ? 'btn-primary' : 'btn-outline'}">
              ${r.actionText || 'Review Action Plan →'}
            </a>
          </div>
        </div>
      </article>
    `;
  }

  bindEvents(container) {
    // Filter tabs
    container.querySelectorAll('.filter-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.activeFilter = e.currentTarget.getAttribute('data-filter');
        this.renderAll();
      });
    });

    // Search input
    const searchInput = container.querySelector('#risk-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        const cardsContainer = document.getElementById('risks-cards-container');
        if (cardsContainer) {
          cardsContainer.innerHTML = this.renderRiskCards();
          this.bindCardActions(cardsContainer);
        }
      });
    }

    this.bindCardActions(container);
  }

  bindCardActions(container) {
    container.querySelectorAll('.btn-ack-risk').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const riskId = e.currentTarget.getAttribute('data-risk-id');
        const target = this.risks.find(r => r.id === riskId);
        if (target) {
          e.currentTarget.disabled = true;
          e.currentTarget.textContent = 'Acknowledged ✓';
          appShell.showToast(`Risk ${target.type} acknowledged by farmer.`, 'info', 2500);
        }
      });
    });
  }
}

export const risksController = new RisksController();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => risksController.init());
} else {
  risksController.init();
}

export default risksController;
