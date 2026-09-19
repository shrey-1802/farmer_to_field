/**
 * KrishiNirnay AI - Field Operations Dashboard Controller (Phase 5 / Phase 28)
 * Manages live telemetry polling, continuous operational loop progression,
 * KPI metrics, priority alert banners, demo mode banner, Render wake-up retry,
 * and farmer-first UX hierarchy.
 *
 * Phase 28 additions:
 * - Demo Mode banner (Section 42/48)
 * - Render wake-up retry button (Section 38)
 * - Dynamic autonomous loop step driven by getAgents() (Section 52)
 * - Integrated with centralized api.js and state.js (Section 33-34)
 */

import APP_CONFIG from './config.js';
import authManager from './auth.js';
import appShell from './ui.js';
import api from './api.js';
import appState from './state.js';

// Loop step labels (Section 52 — 7-stage continuous monitoring loop)
const LOOP_STEPS = ['Monitor', 'Analyze', 'Detect', 'Decide', 'Act', 'Verify', 'Reassess'];

class DashboardController {
  constructor() {
    this.pollTimer = null;
    this.loopAnimTimer = null;
    this.telemetryState = {
      zones: [
        { id: 'z1', name: 'Zone 1: North Cotton Acre', acres: 3.5, moisture: 41.2, temp: 27.4, valve: 'CLOSED', status: 'optimal' },
        { id: 'z2', name: 'Zone 2: East Sloped Cotton', acres: 2.8, moisture: 24.1, temp: 30.1, valve: 'SCHEDULED', status: 'stress' },
        { id: 'z3', name: 'Zone 3: Central Flat Loam', acres: 3.2, moisture: 38.5, temp: 28.0, valve: 'CLOSED', status: 'optimal' },
        { id: 'z4', name: 'Zone 4: South Border Tract', acres: 2.5, moisture: 36.3, temp: 28.5, valve: 'CLOSED', status: 'optimal' }
      ],
      weather: { temp: 31, condition: 'Clear Sky', humidity: 42, rainRisk: 10, et0: 4.8 },
      kpis: {
        totalFarms: 1, activeFields: 2, activeRisks: 1, pendingActions: 1,
        waterStress: 'Zone 2 High Deficit', waterSavedLiters: 184200, systemHealth: '100% Operational'
      },
      loopStep: 4 // 1: Monitor -> 7: Reassess
    };

    this.init();
  }

  init() {
    this.renderFarmerGreeting();
    this.renderKPIs();
    this.renderZoneCards();
    this.updateLoopVisualizer(this.telemetryState.loopStep);
    this.startLiveTelemetryPolling();
    this.setupDemoModeBanner();
    this.setupWakeUpRetry();
    this.setupQuickActionListeners();
    this.startDynamicLoopAnimation();

    window.addEventListener('farmchange', (e) => {
      this.handleFarmChange(e.detail.farmId);
    });

    appState.setActiveFarm(APP_CONFIG.DEFAULT_FARM_ID || 'farm-1');
  }

  // Demo Mode Banner (Section 42/48)
  setupDemoModeBanner() {
    const banner = document.getElementById('demo-mode-banner');
    if (!banner) return;
    if (APP_CONFIG.ENABLE_VIRTUAL_IOT || APP_CONFIG.ENABLE_MOCK_FALLBACK) {
      banner.style.display = 'flex';
    }
  }

  // Render Wake-Up Retry (Section 38)
  setupWakeUpRetry() {
    const retryBtn = document.getElementById('wakeup-retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        const banner = document.getElementById('render-wakeup-banner');
        if (banner) banner.style.display = 'none';
        this.startLiveTelemetryPolling();
        appShell.showToast('Retrying backend connection...', 'info');
      });
    }
  }

  // Farmer Greeting (Section 71.1)
  renderFarmerGreeting() {
    const session = authManager.getSession() || {};
    const farmerName = session.farmerName || 'Farmer';
    const hour = new Date().getHours();
    let timeGreeting = 'Good day';
    if (hour >= 4 && hour < 12) timeGreeting = 'Good morning';
    else if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
    else if (hour >= 17 && hour < 22) timeGreeting = 'Good evening';

    const greetingEl = document.getElementById('farmer-greeting-text');
    if (greetingEl) greetingEl.textContent = `${timeGreeting}, ${farmerName}`;
  }

  // KPIs (Section 11)
  renderKPIs() {
    const moistureEl = document.getElementById('val-soil-moisture');
    const actionsCountEl = document.getElementById('pending-actions-count');

    const avgMoisture = (
      this.telemetryState.zones.reduce((sum, z) => sum + z.moisture, 0) /
      this.telemetryState.zones.length
    ).toFixed(0);

    if (moistureEl) moistureEl.textContent = `${avgMoisture}%`;
    if (actionsCountEl) actionsCountEl.textContent = `${this.telemetryState.kpis.pendingActions} New`;

    appState.setPendingActionCount(this.telemetryState.kpis.pendingActions);
  }

  // Zone Cards
  renderZoneCards() {
    this.telemetryState.zones.forEach((zone, idx) => {
      const card = document.querySelectorAll('.zone-item-card')[idx];
      if (!card) return;

      const metaEl = card.querySelector('.zone-meta');
      const badgeEl = card.querySelector('.badge');
      const valveEl = card.querySelector('.valve-status');

      if (metaEl) {
        metaEl.textContent = `${zone.acres} Acres • Drip Line ${String.fromCharCode(65 + idx)} • Moisture (${zone.moisture.toFixed(1)}%)`;
      }

      if (badgeEl && valveEl) {
        if (zone.status === 'stress') {
          badgeEl.className = 'badge badge-danger';
          badgeEl.textContent = 'Water Stress';
          valveEl.className = 'valve-status valve-scheduled';
          valveEl.textContent = 'Action Proposed';
        } else {
          badgeEl.className = 'badge badge-success';
          badgeEl.textContent = 'Optimal';
          valveEl.className = 'valve-status valve-closed';
          valveEl.textContent = 'Valve Closed';
        }
      }
    });
  }

  // Autonomous Loop Visualizer (Section 52)
  updateLoopVisualizer(activeStep) {
    const steps = document.querySelectorAll('.loop-step');
    steps.forEach((step, idx) => {
      const stepIndex = idx + 1;
      step.classList.remove('completed', 'active', 'pending');
      if (stepIndex < activeStep) step.classList.add('completed');
      else if (stepIndex === activeStep) step.classList.add('active');
      else step.classList.add('pending');
    });

    const loopLabel = document.getElementById('loop-current-step-label');
    if (loopLabel) loopLabel.textContent = LOOP_STEPS[activeStep - 1] || '—';
  }

  // Section 52: Dynamic loop step driven by backend agent status
  startDynamicLoopAnimation() {
    if (this.loopAnimTimer) clearInterval(this.loopAnimTimer);

    this.loopAnimTimer = setInterval(async () => {
      try {
        const agents = await api.getAgents();
        const activeAgent = agents?.find(a => a.status === 'ACTIVE' || a.status === 'COMPUTING');
        if (activeAgent) {
          const phaseMap = {
            'MONITORING': 1, 'ANALYZING': 2, 'DETECTING': 3,
            'DECIDING': 4, 'ACTING': 5, 'VERIFYING': 6, 'REASSESSING': 7
          };
          const step = phaseMap[activeAgent.current_phase] || this.telemetryState.loopStep;
          this.telemetryState.loopStep = step;
          this.updateLoopVisualizer(step);
          return;
        }
      } catch {
        // no-op — fallback below
      }

      // Demo fallback: cycle 1->7->1 every 5s
      this.telemetryState.loopStep = (this.telemetryState.loopStep % 7) + 1;
      this.updateLoopVisualizer(this.telemetryState.loopStep);
    }, 5000);
  }

  // Live Telemetry Polling
  startLiveTelemetryPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);

    this.pollTimer = setInterval(async () => {
      try {
        const data = await api.getSensors(appState.activeFarmId);
        if (data?.zones) this.telemetryState.zones = data.zones;
      } catch {
        // Virtual IoT micro-fluctuation on Zone 2
        this.telemetryState.zones[1].moisture = +(
          24.0 + (Math.sin(Date.now() / 10000) * 0.4)
        ).toFixed(1);
      }

      this.renderKPIs();
      this.renderZoneCards();
    }, APP_CONFIG.SENSOR_POLL_INTERVAL_MS || 10000);
  }

  // Farm Switch
  handleFarmChange(farmId) {
    appState.setActiveFarm(farmId);
    if (farmId === 'farm-2') {
      this.telemetryState.zones.forEach(z => { z.status = 'optimal'; z.moisture = 39.0; });
      this.telemetryState.kpis.pendingActions = 0;
    } else {
      this.telemetryState.zones[1].status = 'stress';
      this.telemetryState.zones[1].moisture = 24.1;
      this.telemetryState.kpis.pendingActions = 1;
    }
    this.renderKPIs();
    this.renderZoneCards();
  }

  // Quick Action Buttons
  setupQuickActionListeners() {
    document.querySelectorAll('[data-quick-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.getAttribute('data-quick-action');
        switch (action) {
          case 'view-sensors': window.location.href = './field-details.html'; break;
          case 'check-weather': appShell.showToast('Current Weather: 31°C Clear Sky. Rain probability 10%.', 'info', 4000); break;
          case 'run-simulation': window.location.href = './simulation.html'; break;
          case 'review-actions': window.location.href = './action-plans.html'; break;
        }
      });
    });
  }
}

export const dashboardController = new DashboardController();
export default dashboardController;
