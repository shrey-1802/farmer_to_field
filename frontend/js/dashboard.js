/**
 * KrishiNirnay AI - Field Operations Dashboard Controller (Phase 5)
 * Manages live telemetry polling, continuous operational loop progression,
 * KPI metrics, priority alert banners, and farmer-first UX hierarchy.
 */

import APP_CONFIG from './config.js';
import authManager from './auth.js';
import appShell from './ui.js';

class DashboardController {
  constructor() {
    this.pollTimer = null;
    this.telemetryState = {
      zones: [
        { id: 'z1', name: 'Zone 1: North Cotton Acre', acres: 3.5, moisture: 41.2, temp: 27.4, valve: 'CLOSED', status: 'optimal' },
        { id: 'z2', name: 'Zone 2: East Sloped Cotton', acres: 2.8, moisture: 24.1, temp: 30.1, valve: 'SCHEDULED', status: 'stress' },
        { id: 'z3', name: 'Zone 3: Central Flat Loam', acres: 3.2, moisture: 38.5, temp: 28.0, valve: 'CLOSED', status: 'optimal' },
        { id: 'z4', name: 'Zone 4: South Border Tract', acres: 2.5, moisture: 36.3, temp: 28.5, valve: 'CLOSED', status: 'optimal' }
      ],
      weather: { temp: 31, condition: 'Clear Sky', humidity: 42, rainRisk: 10, et0: 4.8 },
      kpis: {
        totalFarms: 1,
        activeFields: 2,
        activeRisks: 1,
        pendingActions: 1,
        waterStress: 'Zone 2 High Deficit',
        waterSavedLiters: 184200,
        systemHealth: '100% Operational'
      },
      loopStep: 4 // 1: Monitor, 2: Analyze, 3: Detect, 4: Decide, 5: Act, 6: Verify, 7: Reassess
    };

    this.init();
  }

  init() {
    this.renderFarmerGreeting();
    this.renderKPIs();
    this.renderZoneCards();
    this.updateLoopVisualizer();
    this.startLiveTelemetryPolling();
    this.setupQuickActionListeners();

    // Listen to farm change from header dropdown
    window.addEventListener('farmchange', (e) => {
      this.handleFarmChange(e.detail.farmId);
    });
  }

  /**
   * Section 71.1: Farmer Greeting
   */
  renderFarmerGreeting() {
    const session = authManager.getSession() || {};
    const farmerName = session.farmerName || 'Farmer';
    
    // Determine greeting from local hour
    const hour = new Date().getHours();
    let timeGreeting = 'Good day';
    if (hour >= 4 && hour < 12) timeGreeting = 'Good morning';
    else if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
    else if (hour >= 17 && hour < 22) timeGreeting = 'Good evening';

    const greetingEl = document.getElementById('farmer-greeting-text');
    if (greetingEl) {
      greetingEl.textContent = `${timeGreeting}, ${farmerName}`;
    }
  }

  /**
   * Render KPIs & Core Indicators (Section 11)
   */
  renderKPIs() {
    const moistureEl = document.getElementById('val-soil-moisture');
    const actionsCountEl = document.getElementById('pending-actions-count');

    // Calculate average moisture across zones
    const avgMoisture = (
      this.telemetryState.zones.reduce((sum, z) => sum + z.moisture, 0) /
      this.telemetryState.zones.length
    ).toFixed(0);

    if (moistureEl) {
      moistureEl.textContent = `${avgMoisture}%`;
    }

    if (actionsCountEl) {
      actionsCountEl.textContent = `${this.telemetryState.kpis.pendingActions} New`;
    }
  }

  /**
   * Render Active Zone Health Cards
   */
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

  /**
   * Update Operational Continuous Loop (Section 1)
   */
  updateLoopVisualizer() {
    const steps = document.querySelectorAll('.loop-step');
    steps.forEach((step, idx) => {
      const stepIndex = idx + 1;
      step.classList.remove('completed', 'active', 'pending');

      if (stepIndex < this.telemetryState.loopStep) {
        step.classList.add('completed');
      } else if (stepIndex === this.telemetryState.loopStep) {
        step.classList.add('active');
      } else {
        step.classList.add('pending');
      }
    });
  }

  /**
   * Live Telemetry Poller (Polls backend or simulates Virtual IoT stream every 10s)
   */
  startLiveTelemetryPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);

    this.pollTimer = setInterval(async () => {
      try {
        if (APP_CONFIG.ENV === 'production' && !APP_CONFIG.ENABLE_MOCK_FALLBACK) {
          const res = await fetch(`${APP_CONFIG.API_BASE_URL}/sensors/readings`);
          if (res.ok) {
            const data = await res.json();
            if (data.zones) this.telemetryState.zones = data.zones;
          }
        } else {
          // Virtual IoT Simulation Engine: Add realistic micro-fluctuations
          this.telemetryState.zones[1].moisture = +(
            24.0 + (Math.sin(Date.now() / 10000) * 0.4)
          ).toFixed(1);
        }

        this.renderKPIs();
        this.renderZoneCards();
      } catch (err) {
        console.warn('Telemetry poll warning:', err);
      }
    }, APP_CONFIG.SENSOR_POLL_INTERVAL_MS || 10000);
  }

  /**
   * Handle Farm Dropdown Switch
   */
  handleFarmChange(farmId) {
    if (farmId === 'farm-2') {
      this.telemetryState.zones.forEach(z => {
        z.status = 'optimal';
        z.moisture = 39.0;
      });
      this.telemetryState.kpis.pendingActions = 0;
    } else {
      this.telemetryState.zones[1].status = 'stress';
      this.telemetryState.zones[1].moisture = 24.1;
      this.telemetryState.kpis.pendingActions = 1;
    }

    this.renderKPIs();
    this.renderZoneCards();
  }

  /**
   * Setup Interactive Buttons
   */
  setupQuickActionListeners() {
    // Quick action clicks
    document.querySelectorAll('[data-quick-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.getAttribute('data-quick-action');
        switch (action) {
          case 'view-sensors':
            window.location.href = './field-details.html';
            break;
          case 'check-weather':
            appShell.showToast('Current Weather: 31°C Clear Sky. Rain probability 10%.', 'info', 4000);
            break;
          case 'run-simulation':
            window.location.href = './simulation.html';
            break;
          case 'review-actions':
            window.location.href = './action-plans.html';
            break;
        }
      });
    });
  }
}

export const dashboardController = new DashboardController();
export default dashboardController;
