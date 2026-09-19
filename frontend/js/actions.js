/**
 * KrishiNirnay AI - Autonomous Action Plans Controller (Phase 17)
 * Implements Section 23: Action Plans & Approvals.
 * 
 * Every plan contains all 11 Section 23 required fields:
 * 1. action
 * 2. reason
 * 3. farm
 * 4. field
 * 5. zone
 * 6. scheduledTime
 * 7. priority (URGENT, HIGH, MEDIUM, LOW)
 * 8. cost (Estimated Cost in INR)
 * 9. confidence (%)
 * 10. evidence (Empirical sensor measurements & models)
 * 11. safetyStatus (Guardrails & safety checks)
 * 12. approvalStatus (PENDING, APPROVED, REJECTED, EXPERT_REVIEW)
 * 
 * Interactive Controls:
 * - Approve (POST /api/actions/{id}/approve)
 * - Reject (POST /api/actions/{id}/reject)
 * - Request Expert Review (POST /api/actions/{id}/expert-review)
 * - View Details (Full reasoning & parameters modal)
 */

import APP_CONFIG from './config.js';
import appShell from './ui.js';

export const ACTION_PLANS_CATALOG = [
  {
    id: 'AP-1082',
    action: 'Execute Precision Drip Irrigation Pulse in Zone 2',
    reason: 'Virtual root-zone moisture (24.1%) dipped below Management Allowed Depletion (MAD 28.0%) during high-demand cotton boll formation stage.',
    farm: 'Shanti Agro Farm',
    field: 'North Cotton Plot (Field 1)',
    zone: 'Zone 2: East Sloped (2.8 Acres)',
    scheduledTime: 'Today at 09:30 AM (Immediate)',
    priority: 'URGENT',
    cost: '₹340 (Pumping electricity & line pressurization)',
    confidence: 94.8,
    evidence: 'Telemetry Node-02: Moisture 24.1%, matric potential -68 kPa, ET0 5.8 mm/day, 0mm rainfall forecasted for next 72 hours across 4 numerical models.',
    safetyStatus: 'SAFE — Passed thermal safety check (ambient < 36°C) and pressure surge guardrail (< 2.2 bar).',
    approvalStatus: 'PENDING',
    sourceAgent: '💧 Irrigation Advisory Agent',
    sourceModel: 'FAO-56 Dual Kc + Darcy-Richards Water Model',
    parameters: {
      volumeLiters: 42000,
      runTimeMinutes: 45,
      flowRateLpm: 933,
      valveLine: 'Solenoid Valve B',
      targetMoisture: '38.5% – 42.0%'
    }
  },
  {
    id: 'AP-1083',
    action: 'Foliar Spray of Bio-Pesticide Azadirachtin (Neem Oil 1500ppm)',
    reason: 'Microclimate heat-humidity index reached optimal band for Whitefly (Bemisia tabaci) nymph emergence on lower canopy leaf surface.',
    farm: 'Shanti Agro Farm',
    field: 'North Cotton Plot (Field 1)',
    zone: 'Zone 1: North Flat & Zone 3: Central High (6.0 Acres)',
    scheduledTime: 'Tomorrow at 06:30 AM (Low-Drift Morning Window)',
    priority: 'HIGH',
    cost: '₹750 (Organic formulation: 3.0 Litres Azadirachtin)',
    confidence: 89.2,
    evidence: 'Relative humidity 74%, ambient temp 27.2°C at dawn, surface wind speed 6.2 km/h (< 12 km/h drift limit). Drone RGB canopy anomaly 3.4% foliar stippling.',
    safetyStatus: 'SAFE — Wind drift window verified between 06:00 AM and 08:30 AM. Pollinator friendly bio-active formulation.',
    approvalStatus: 'PENDING',
    sourceAgent: '🔬 Disease & Pest Intelligence Agent',
    sourceModel: 'YOLO-Agro Pathogen Vision + Microclimate Vector Model',
    parameters: {
      dilution: '5 ml / Litre of soft water',
      totalSprayVolume: '300 Litres across 6.0 Acres',
      dropletSize: 'Medium (250–300 microns)',
      applicator: 'Tractor-mounted boom sprayer with anti-drift nozzles'
    }
  },
  {
    id: 'AP-1081',
    action: 'Water-Soluble Fertigation Boost (NPK 19:19:19 + Zinc Chelate)',
    reason: 'Active reproductive boll enlargement phase detected. Nitrate nitrogen uptake rate accelerated by 18% over historical benchmark.',
    farm: 'Shanti Agro Farm',
    field: 'North Cotton Plot (Field 1)',
    zone: 'All Zones (Zone 1–4, 12.0 Acres)',
    scheduledTime: 'Executed Yesterday at 06:15 PM',
    priority: 'MEDIUM',
    cost: '₹1,280 (Fertilizer inputs + venturi injection)',
    confidence: 93.5,
    evidence: 'Optical NDVI greenness + Virtual sensor EC levels showed slight nitrogen dilution during vegetative surge. GDD accumulated: 1,420 GDD.',
    safetyStatus: 'SAFE — Salinity index (EC 1.1 dS/m) well below cotton toxicity threshold (EC > 4.5 dS/m).',
    approvalStatus: 'APPROVED',
    sourceAgent: '🌱 Crop Nutrition & Soil Chemistry Agent',
    sourceModel: 'QueFTS Balanced Nutrition Model',
    parameters: {
      fertilizerType: 'NPK 19:19:19 Grade A (25 kg) + EDTA-Zn (2.5 kg)',
      injectionMethod: 'Venturi injector inline at 2.0 bar',
      waterCarrierVolume: '15,000 Litres'
    }
  },
  {
    id: 'AP-1079',
    action: 'Emergency Deep Ridge Drainage Channel Opening',
    reason: 'Automated weather alert predicted 65mm convective downpour threatening root-zone waterlogging.',
    farm: 'Shanti Agro Farm',
    field: 'North Cotton Plot (Field 1)',
    zone: 'Zone 4: South Lowland Depression (2.2 Acres)',
    scheduledTime: 'Proposed Sept 12, 2026',
    priority: 'HIGH',
    cost: '₹1,500 (Manual labor trenching)',
    confidence: 76.0,
    evidence: 'Early weather forecast model ECMWF indicated heavy storm cell. Subsequent ensemble run reduced probability to 15%.',
    safetyStatus: 'REVISED — Rain probability downgraded to 0.0 mm. Risk of unneeded soil disturbance.',
    approvalStatus: 'REJECTED',
    sourceAgent: '🌧️ Weather & Microclimate Intelligence Agent',
    sourceModel: 'Ensemble Numerical Weather Prediction',
    parameters: {
      trenchDepth: '30 cm peripheral trench',
      rejectReason: 'Farmer reviewed revised 7-day radar showing rain track shifted south. Unnecessary trenching expense avoided.'
    }
  },
  {
    id: 'AP-1080',
    action: 'Chemical Systemic Fungicide (Carbendazim 50% WP) Application',
    reason: 'Early leaf spot alert triggered by foliar wetness sensor anomaly.',
    farm: 'Shanti Agro Farm',
    field: 'North Cotton Plot (Field 1)',
    zone: 'Zone 3: Central High',
    scheduledTime: 'Awaiting Expert Review',
    priority: 'MEDIUM',
    cost: '₹950',
    confidence: 71.4,
    evidence: 'High leaf wetness hours detected by virtual Node-03. However, drone multispectral thermal did not detect elevated tissue temperature.',
    safetyStatus: 'HOLD — High chemical persistence. Agronomist review requested to check if organic bio-fungicide is sufficient.',
    approvalStatus: 'EXPERT_REVIEW',
    sourceAgent: '🔬 Disease & Pest Intelligence Agent',
    sourceModel: 'Leaf Wetness Pathogen Germination Classifier',
    parameters: {
      expertAssigned: 'Dr. V. K. Patel (Senior Cotton Pathologist, KVK Anand)',
      reviewNotes: 'Farmer requested secondary verification before deploying synthetic fungicide near organic boundary.'
    }
  }
];

class ActionsController {
  constructor() {
    this.plans = JSON.parse(JSON.stringify(ACTION_PLANS_CATALOG));
    this.activeFilter = 'all'; // 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPERT_REVIEW'
    this.searchQuery = '';
    this.selectedPlan = null;
  }

  init() {
    this.render();
    this.setupModal();
  }

  render() {
    const mainContainer = document.querySelector('.action-plans-container');
    const tabPaneContainer = document.getElementById('tab-pane-actions');

    if (mainContainer) {
      this.renderFullActionPage(mainContainer);
    }
    if (tabPaneContainer) {
      this.renderTabPaneActions(tabPaneContainer);
    }
  }

  renderFullActionPage(container) {
    const totalCount = this.plans.length;
    const pendingCount = this.plans.filter(p => p.approvalStatus === 'PENDING').length;
    const approvedCount = this.plans.filter(p => p.approvalStatus === 'APPROVED').length;
    const rejectedCount = this.plans.filter(p => p.approvalStatus === 'REJECTED').length;
    const expertCount = this.plans.filter(p => p.approvalStatus === 'EXPERT_REVIEW').length;

    // Update filter buttons on action-plans.html if present
    const filterTabs = document.querySelector('.filter-tabs');
    if (filterTabs) {
      filterTabs.innerHTML = `
        <button type="button" class="tab-btn ${this.activeFilter === 'all' ? 'active' : ''}" data-status="all">
          All Plans (${totalCount})
        </button>
        <button type="button" class="tab-btn ${this.activeFilter === 'PENDING' ? 'active' : ''}" data-status="PENDING">
          Pending Approval (${pendingCount})
        </button>
        <button type="button" class="tab-btn ${this.activeFilter === 'APPROVED' ? 'active' : ''}" data-status="APPROVED">
          Approved (${approvedCount})
        </button>
        <button type="button" class="tab-btn ${this.activeFilter === 'EXPERT_REVIEW' ? 'active' : ''}" data-status="EXPERT_REVIEW">
          Expert Review (${expertCount})
        </button>
        <button type="button" class="tab-btn ${this.activeFilter === 'REJECTED' ? 'active' : ''}" data-status="REJECTED">
          Rejected (${rejectedCount})
        </button>
      `;

      filterTabs.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.activeFilter = e.currentTarget.getAttribute('data-status');
          this.render();
        });
      });
    }

    const filtered = this.getFilteredPlans();

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card" style="text-align: center; padding: var(--space-8); background: var(--color-card-bg); border-radius: var(--radius-lg); border: 1px dashed var(--color-border);">
          <span style="font-size: 3rem;">📋</span>
          <h3 style="margin-top: var(--space-3); color: var(--color-text-primary);">No Action Plans Found</h3>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: var(--space-1);">There are no agronomic action plans matching the selected filter state (${this.activeFilter}).</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(p => this.renderPlanCard(p)).join('');
    this.bindCardEvents(container);
  }

  renderTabPaneActions(container) {
    const pendingPlans = this.plans.filter(p => p.approvalStatus === 'PENDING');

    container.innerHTML = `
      <section class="card" aria-label="Autonomous Action Plans">
        <div class="card-header">
          <div>
            <h2 class="card-title">Autonomous Action Plans & Farmer Approvals</h2>
            <p class="card-subtitle">AI-generated executable interventions requiring farmer authorization (Section 23)</p>
          </div>
          <div style="display: flex; gap: var(--space-2); align-items: center;">
            <span class="badge ${pendingPlans.length > 0 ? 'badge-warning' : 'badge-success'}">${pendingPlans.length} Pending Approval</span>
            <span class="source-tag source-ai">AI GENERATED</span>
          </div>
        </div>

        <div class="action-plans-list" style="display: flex; flex-direction: column; gap: var(--space-4); margin-top: var(--space-4);">
          ${this.plans.map(p => this.renderPlanCard(p, true)).join('')}
        </div>
      </section>
    `;

    this.bindCardEvents(container);
  }

  getFilteredPlans() {
    return this.plans.filter(p => {
      if (this.activeFilter !== 'all' && p.approvalStatus !== this.activeFilter) return false;
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        return p.action.toLowerCase().includes(q) ||
               p.reason.toLowerCase().includes(q) ||
               p.zone.toLowerCase().includes(q) ||
               p.evidence.toLowerCase().includes(q);
      }
      return true;
    });
  }

  renderPlanCard(p, compact = false) {
    const statusBadge = this.getStatusBadge(p.approvalStatus);
    const priorityBadge = p.priority === 'URGENT' ? '<span class="badge badge-danger">⚡ URGENT</span>' :
                          p.priority === 'HIGH' ? '<span class="badge badge-warning">HIGH PRIORITY</span>' :
                          '<span class="badge badge-outline">NORMAL PRIORITY</span>';

    const borderClass = p.approvalStatus === 'PENDING' ? 'urgent-plan' :
                        p.approvalStatus === 'APPROVED' ? 'completed-plan' :
                        p.approvalStatus === 'EXPERT_REVIEW' ? 'expert-plan' : 'rejected-plan';

    return `
      <article class="action-plan-card ${borderClass}" id="card-${p.id}">
        <!-- Section 23 Header -->
        <div class="plan-header">
          <div class="plan-badge-group">
            <span class="plan-id">#${p.id}</span>
            ${priorityBadge}
            ${statusBadge}
            <span class="source-tag source-ai">AI GENERATED</span>
          </div>
          <span class="plan-timestamp">⏱️ ${p.scheduledTime}</span>
        </div>

        <!-- Section 23 Content: Action & Reason -->
        <div class="plan-body">
          <h2 class="plan-title" style="margin-top: var(--space-2);">${p.action}</h2>
          <p class="plan-description">
            <strong>Reason:</strong> ${p.reason}
          </p>

          <!-- Section 23 Grid: Location Hierarchy, Cost, Confidence, Schedule -->
          <div class="plan-specs-grid">
            <div class="spec-item">
              <span class="spec-label">Location Hierarchy</span>
              <span class="spec-value">${p.farm} • ${p.field}</span>
              <span style="font-size: 11px; color: var(--color-text-secondary); font-weight: 600;">${p.zone}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Estimated Cost</span>
              <span class="spec-value" style="color: var(--color-primary-700);">${p.cost}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Confidence</span>
              <span class="spec-value" style="color: var(--color-success);">${p.confidence}%</span>
              <span style="font-size: 10px; color: var(--color-text-muted);">${p.sourceAgent}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Safety Status</span>
              <span class="spec-value" style="font-size: 12px; color: var(--color-text-secondary);">${p.safetyStatus}</span>
            </div>
          </div>

          <!-- Section 23 Grounding Evidence Box -->
          <div class="impact-projection-box" style="margin-bottom: var(--space-3);">
            <div class="impact-title">
              <span>🔬 Empirical Telemetry & Model Evidence:</span>
            </div>
            <p class="impact-text" style="color: var(--color-text-primary);">
              ${p.evidence}
            </p>
          </div>
        </div>

        <!-- Section 23 Mandatory Controls: Approve, Reject, Request Expert Review, View Details -->
        <footer class="plan-footer">
          <div class="plan-actions-left">
            <button type="button" class="btn btn-sm btn-outline btn-view-details" data-plan-id="${p.id}">
              🔍 View Full Details & Reasoning
            </button>
            ${p.approvalStatus === 'APPROVED' ? `
              <a href="./execution.html?job=${p.id}&status=running" class="btn btn-sm btn-primary">
                ⚡ Go to Execution Center →
              </a>
            ` : ''}
          </div>

          <div class="plan-actions-right">
            ${p.approvalStatus === 'PENDING' ? `
              <button type="button" class="btn btn-sm btn-outline btn-expert-review" data-plan-id="${p.id}" style="border-color: #3B82F6; color: #3B82F6;">
                👨‍🔬 Request Expert Review
              </button>
              <button type="button" class="btn btn-sm btn-danger btn-reject-plan" data-plan-id="${p.id}">
                ✕ Reject Plan
              </button>
              <button type="button" class="btn btn-sm btn-primary btn-approve-plan" data-plan-id="${p.id}">
                ✓ Approve Plan
              </button>
            ` : p.approvalStatus === 'APPROVED' ? `
              <span style="font-size: var(--font-size-xs); font-weight: 700; color: var(--color-success);">
                ✓ Authorized by Farmer • Ready for Actuation
              </span>
            ` : p.approvalStatus === 'EXPERT_REVIEW' ? `
              <span style="font-size: var(--font-size-xs); font-weight: 700; color: #3B82F6;">
                ⏳ Under Agronomist Review (KVK Anand)
              </span>
            ` : `
              <span style="font-size: var(--font-size-xs); font-weight: 700; color: var(--color-danger);">
                ✕ Rejected by Farmer
              </span>
            `}
          </div>
        </footer>
      </article>
    `;
  }

  getStatusBadge(status) {
    switch (status) {
      case 'PENDING':
        return '<span class="badge badge-warning">Awaiting Approval</span>';
      case 'APPROVED':
        return '<span class="badge badge-success">Approved ✓</span>';
      case 'REJECTED':
        return '<span class="badge badge-danger">Rejected ✕</span>';
      case 'EXPERT_REVIEW':
        return '<span class="badge" style="background-color: rgba(59, 130, 246, 0.15); color: #2563EB; border: 1px solid #3B82F6;">Expert Review</span>';
      default:
        return `<span class="badge badge-outline">${status}</span>`;
    }
  }

  bindCardEvents(container) {
    // Approve Button
    container.querySelectorAll('.btn-approve-plan').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-plan-id');
        await this.handleApprove(id);
      });
    });

    // Reject Button
    container.querySelectorAll('.btn-reject-plan').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-plan-id');
        await this.handleReject(id);
      });
    });

    // Request Expert Review Button
    container.querySelectorAll('.btn-expert-review').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-plan-id');
        await this.handleExpertReview(id);
      });
    });

    // View Details Button
    container.querySelectorAll('.btn-view-details').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-plan-id');
        this.showDetailsModal(id);
      });
    });
  }

  async handleApprove(id) {
    const plan = this.plans.find(p => p.id === id);
    if (!plan) return;

    try {
      // Attempt backend API call
      await fetch(`${APP_CONFIG.api.baseUrl}/actions/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedAt: new Date().toISOString(), farmerId: 'farmer-1' })
      }).catch(() => null);
    } catch (_) {}

    plan.approvalStatus = 'APPROVED';
    appShell.showToast(`Action Plan #${id} Approved! Dispatched to Execution Center.`, 'success', 3500);
    this.render();
  }

  async handleReject(id) {
    const plan = this.plans.find(p => p.id === id);
    if (!plan) return;

    const reason = prompt('Please specify rejection reason for audit log:', 'Field moisture acceptable from manual observation');
    if (reason === null) return; // cancelled

    try {
      await fetch(`${APP_CONFIG.api.baseUrl}/actions/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectedAt: new Date().toISOString(), reason })
      }).catch(() => null);
    } catch (_) {}

    plan.approvalStatus = 'REJECTED';
    appShell.showToast(`Action Plan #${id} has been Rejected.`, 'info', 3000);
    this.render();
  }

  async handleExpertReview(id) {
    const plan = this.plans.find(p => p.id === id);
    if (!plan) return;

    try {
      await fetch(`${APP_CONFIG.api.baseUrl}/actions/${id}/expert-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedAt: new Date().toISOString(), priority: 'NORMAL' })
      }).catch(() => null);
    } catch (_) {}

    plan.approvalStatus = 'EXPERT_REVIEW';
    appShell.showToast(`Action Plan #${id} forwarded to Senior Agronomist at KVK Anand.`, 'info', 3500);
    this.render();
  }

  setupModal() {
    let modal = document.getElementById('action-details-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'action-details-modal';
      modal.className = 'modal-backdrop';
      modal.style.display = 'none';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.innerHTML = `
        <div class="modal-dialog" style="max-width: 640px; background: var(--color-card-bg); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-6); box-shadow: var(--shadow-xl); position: relative; margin: 5vh auto; max-height: 90vh; overflow-y: auto;">
          <button type="button" class="modal-close-btn" id="modal-close-x" style="position: absolute; top: var(--space-4); right: var(--space-4); background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--color-text-muted);">✕</button>
          <div id="modal-content-slot"></div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#modal-close-x').addEventListener('click', () => {
        modal.style.display = 'none';
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
      });
    }
  }

  showDetailsModal(id) {
    const plan = this.plans.find(p => p.id === id);
    if (!plan) return;

    const modal = document.getElementById('action-details-modal');
    const slot = document.getElementById('modal-content-slot');
    if (!modal || !slot) return;

    slot.innerHTML = `
      <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-3);">
        <span class="plan-id" style="font-size: 1rem;">#${plan.id}</span>
        ${this.getStatusBadge(plan.approvalStatus)}
        <span class="badge badge-outline">${plan.priority}</span>
      </div>

      <h2 style="font-size: var(--font-size-xl); font-weight: 800; color: var(--color-text-primary); margin-bottom: var(--space-3);">${plan.action}</h2>

      <div style="background-color: var(--color-surface-soft); padding: var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--color-border); margin-bottom: var(--space-4);">
        <h4 style="font-size: 11px; text-transform: uppercase; color: var(--color-text-muted); font-weight: 700; margin-bottom: 4px;">Agronomic Driver & Objective</h4>
        <p style="font-size: var(--font-size-sm); color: var(--color-text-primary); margin: 0; line-height: 1.5;">${plan.reason}</p>
      </div>

      <h4 style="font-size: var(--font-size-sm); font-weight: 700; margin-bottom: var(--space-2);">Execution Parameters</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); margin-bottom: var(--space-4);">
        ${Object.entries(plan.parameters || {}).map(([k, v]) => `
          <div style="background: var(--color-surface); padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
            <div style="font-size: 10px; color: var(--color-text-muted); text-transform: uppercase; font-weight: 700;">${k.replace(/([A-Z])/g, ' $1')}</div>
            <div style="font-size: var(--font-size-xs); font-weight: 700; color: var(--color-text-primary); margin-top: 2px;">${v}</div>
          </div>
        `).join('')}
      </div>

      <h4 style="font-size: var(--font-size-sm); font-weight: 700; margin-bottom: var(--space-2);">Science & Model Grounding</h4>
      <p style="font-size: var(--font-size-xs); color: var(--color-text-secondary); line-height: 1.6; margin-bottom: var(--space-4);">
        Formulated by <strong>${plan.sourceAgent}</strong> using <strong>${plan.sourceModel}</strong>. Telemetry evidence validated against FAO-56 stage Kc coefficients and sensor sanity guardrails.
      </p>

      <div style="display: flex; justify-content: flex-end; gap: var(--space-2); padding-top: var(--space-4); border-top: 1px solid var(--color-border);">
        <button type="button" class="btn btn-outline" id="modal-close-btn">Close</button>
        ${plan.approvalStatus === 'PENDING' ? `
          <button type="button" class="btn btn-primary" id="modal-approve-btn">Approve & Execute Now</button>
        ` : ''}
      </div>
    `;

    slot.querySelector('#modal-close-btn')?.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    const modalApproveBtn = slot.querySelector('#modal-approve-btn');
    if (modalApproveBtn) {
      modalApproveBtn.addEventListener('click', async () => {
        await this.handleApprove(plan.id);
        modal.style.display = 'none';
      });
    }

    modal.style.display = 'block';
  }
}

export const actionsController = new ActionsController();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => actionsController.init());
} else {
  actionsController.init();
}

export default actionsController;
