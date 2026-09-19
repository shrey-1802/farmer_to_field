/**
 * KrishiNirnay AI - Virtual Sensor Center Controller (Phase 9)
 * Manages virtual IoT telemetry for all 10 agricultural parameters:
 * Soil Moisture, Soil Temperature, Nitrogen, Phosphorus, Potassium, pH, EC,
 * Air Temperature, Humidity, Rainfall.
 * Strictly adheres to Section 2 & 15: Prominently labels "SIMULATED — Virtual IoT".
 */

import APP_CONFIG from './config.js';
import appShell from './ui.js';

export const SENSOR_CATALOG = [
  {
    id: 'soil_moisture',
    name: 'Soil Moisture (15cm)',
    category: 'soil',
    icon: '💧',
    unit: '%',
    optimalRange: '35% – 45%',
    values: {
      'zone-1': { val: 41.2, status: 'Normal', statusClass: 'badge-success', trend: 'steady', trendText: '→ Steady', quality: '100% Valid (CRC Pass)' },
      'zone-2': { val: 24.1, status: 'Alert: Water Stress', statusClass: 'badge-danger', trend: 'down', trendText: '↓ Decreasing (-1.4%/hr)', quality: '100% Valid (CRC Pass)' },
      'zone-3': { val: 38.5, status: 'Normal', statusClass: 'badge-success', trend: 'steady', trendText: '→ Steady', quality: '100% Valid (CRC Pass)' },
      'zone-4': { val: 36.3, status: 'Normal', statusClass: 'badge-success', trend: 'down', trendText: '↓ Decreasing (-0.4%/hr)', quality: '100% Valid (CRC Pass)' }
    }
  },
  {
    id: 'soil_temp',
    name: 'Soil Temperature',
    category: 'soil',
    icon: '🌡️',
    unit: '°C',
    optimalRange: '24°C – 30°C',
    values: {
      'zone-1': { val: 27.4, status: 'Optimal', statusClass: 'badge-success', trend: 'up', trendText: '↑ Warming (+0.3°C/hr)', quality: '100% Valid' },
      'zone-2': { val: 30.1, status: 'Elevated', statusClass: 'badge-warning', trend: 'up', trendText: '↑ Warming (+0.8°C/hr)', quality: '100% Valid' },
      'zone-3': { val: 28.0, status: 'Optimal', statusClass: 'badge-success', trend: 'steady', trendText: '→ Stable', quality: '100% Valid' },
      'zone-4': { val: 28.5, status: 'Optimal', statusClass: 'badge-success', trend: 'up', trendText: '↑ Warming (+0.2°C/hr)', quality: '100% Valid' }
    }
  },
  {
    id: 'nitrogen',
    name: 'Available Nitrogen (N)',
    category: 'nutrients',
    icon: '🌱',
    unit: 'kg/ha',
    optimalRange: '120 – 160 kg/ha',
    values: {
      'zone-1': { val: 140, status: 'Adequate', statusClass: 'badge-success', trend: 'steady', trendText: '→ Stable', quality: '99.5% High Conf.' },
      'zone-2': { val: 135, status: 'Adequate', statusClass: 'badge-success', trend: 'down', trendText: '↓ Slow uptake', quality: '99.5% High Conf.' },
      'zone-3': { val: 145, status: 'Adequate', statusClass: 'badge-success', trend: 'steady', trendText: '→ Stable', quality: '99.5% High Conf.' },
      'zone-4': { val: 130, status: 'Adequate', statusClass: 'badge-success', trend: 'steady', trendText: '→ Stable', quality: '99.5% High Conf.' }
    }
  },
  {
    id: 'phosphorus',
    name: 'Available Phosphorus (P₂O₅)',
    category: 'nutrients',
    icon: '🌾',
    unit: 'kg/ha',
    optimalRange: '28 – 45 kg/ha',
    values: {
      'zone-1': { val: 35, status: 'Optimal', statusClass: 'badge-success', trend: 'steady', trendText: '→ Steady', quality: '100% Valid' },
      'zone-2': { val: 30, status: 'Normal', statusClass: 'badge-success', trend: 'steady', trendText: '→ Steady', quality: '100% Valid' },
      'zone-3': { val: 40, status: 'Optimal', statusClass: 'badge-success', trend: 'steady', trendText: '→ Steady', quality: '100% Valid' },
      'zone-4': { val: 38, status: 'Optimal', statusClass: 'badge-success', trend: 'steady', trendText: '→ Steady', quality: '100% Valid' }
    }
  },
  {
    id: 'potassium',
    name: 'Available Potassium (K₂O)',
    category: 'nutrients',
    icon: '🍃',
    unit: 'kg/ha',
    optimalRange: '> 150 kg/ha',
    values: {
      'zone-1': { val: 180, status: 'High', statusClass: 'badge-success', trend: 'steady', trendText: '→ Steady', quality: '100% Valid' },
      'zone-2': { val: 175, status: 'High', statusClass: 'badge-success', trend: 'steady', trendText: '→ Steady', quality: '100% Valid' },
      'zone-3': { val: 190, status: 'High', statusClass: 'badge-success', trend: 'steady', trendText: '→ Steady', quality: '100% Valid' },
      'zone-4': { val: 170, status: 'High', statusClass: 'badge-success', trend: 'steady', trendText: '→ Steady', quality: '100% Valid' }
    }
  },
  {
    id: 'ph',
    name: 'Soil Reaction (pH)',
    category: 'nutrients',
    icon: '🧪',
    unit: 'pH',
    optimalRange: '6.5 – 8.2 pH',
    values: {
      'zone-1': { val: 7.8, status: 'Slightly Alkaline', statusClass: 'badge-success', trend: 'steady', trendText: '→ Stable (7.8)', quality: 'Calibrated' },
      'zone-2': { val: 8.0, status: 'Moderately Alkaline', statusClass: 'badge-warning', trend: 'up', trendText: '↑ Slight +0.1', quality: 'Calibrated' },
      'zone-3': { val: 7.6, status: 'Normal', statusClass: 'badge-success', trend: 'steady', trendText: '→ Stable (7.6)', quality: 'Calibrated' },
      'zone-4': { val: 7.7, status: 'Normal', statusClass: 'badge-success', trend: 'steady', trendText: '→ Stable (7.7)', quality: 'Calibrated' }
    }
  },
  {
    id: 'ec',
    name: 'Electrical Cond. (EC)',
    category: 'nutrients',
    icon: '⚡',
    unit: 'dS/m',
    optimalRange: '< 2.0 dS/m',
    values: {
      'zone-1': { val: 0.85, status: 'Non-Saline', statusClass: 'badge-success', trend: 'steady', trendText: '→ Steady', quality: '100% Valid' },
      'zone-2': { val: 0.92, status: 'Non-Saline', statusClass: 'badge-success', trend: 'up', trendText: '↑ +0.02 dS/m', quality: '100% Valid' },
      'zone-3': { val: 0.80, status: 'Non-Saline', statusClass: 'badge-success', trend: 'steady', trendText: '→ Steady', quality: '100% Valid' },
      'zone-4': { val: 0.82, status: 'Non-Saline', statusClass: 'badge-success', trend: 'steady', trendText: '→ Steady', quality: '100% Valid' }
    }
  },
  {
    id: 'air_temp',
    name: 'Air Ambient Temperature',
    category: 'weather',
    icon: '☀️',
    unit: '°C',
    optimalRange: '20°C – 35°C',
    values: {
      'zone-1': { val: 31.4, status: 'Normal', statusClass: 'badge-success', trend: 'up', trendText: '↑ Peak Heat Curve', quality: 'Live Streamed' },
      'zone-2': { val: 32.2, status: 'Hot', statusClass: 'badge-warning', trend: 'up', trendText: '↑ Sloped Microclimate', quality: 'Live Streamed' },
      'zone-3': { val: 31.3, status: 'Normal', statusClass: 'badge-success', trend: 'up', trendText: '↑ Steady rise', quality: 'Live Streamed' },
      'zone-4': { val: 31.5, status: 'Normal', statusClass: 'badge-success', trend: 'up', trendText: '↑ Peak Heat Curve', quality: 'Live Streamed' }
    }
  },
  {
    id: 'humidity',
    name: 'Relative Ambient Humidity',
    category: 'weather',
    icon: '☁️',
    unit: '%',
    optimalRange: '45% – 70%',
    values: {
      'zone-1': { val: 54, status: 'Normal', statusClass: 'badge-success', trend: 'down', trendText: '↓ Dropping midday', quality: 'Live Streamed' },
      'zone-2': { val: 48, status: 'Dry Microclimate', statusClass: 'badge-warning', trend: 'down', trendText: '↓ Rapid drying', quality: 'Live Streamed' },
      'zone-3': { val: 55, status: 'Normal', statusClass: 'badge-success', trend: 'down', trendText: '↓ Dropping midday', quality: 'Live Streamed' },
      'zone-4': { val: 53, status: 'Normal', statusClass: 'badge-success', trend: 'down', trendText: '↓ Dropping midday', quality: 'Live Streamed' }
    }
  },
  {
    id: 'rainfall',
    name: 'Precipitation / Rain Rate',
    category: 'weather',
    icon: '🌧️',
    unit: 'mm',
    optimalRange: 'Seasonal Rain',
    values: {
      'zone-1': { val: 0.0, status: 'Dry (No Rain)', statusClass: 'badge-outline', trend: 'steady', trendText: '→ 0.0 mm/hr', quality: 'Tipping Bucket' },
      'zone-2': { val: 0.0, status: 'Dry (No Rain)', statusClass: 'badge-outline', trend: 'steady', trendText: '→ 0.0 mm/hr', quality: 'Tipping Bucket' },
      'zone-3': { val: 0.0, status: 'Dry (No Rain)', statusClass: 'badge-outline', trend: 'steady', trendText: '→ 0.0 mm/hr', quality: 'Tipping Bucket' },
      'zone-4': { val: 0.0, status: 'Dry (No Rain)', statusClass: 'badge-outline', trend: 'steady', trendText: '→ 0.0 mm/hr', quality: 'Tipping Bucket' }
    }
  }
];

export class VirtualSensorCenter {
  constructor(containerId = 'virtual-sensor-center-container') {
    this.containerId = containerId;
    this.selectedZoneId = 'zone-2'; // Default to active zone
    this.selectedCategory = 'all';
    this.lastUpdateTime = new Date();
    this.heartbeatCounter = 8;
    this.timerId = null;
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    this.startLiveHeartbeat();
  }

  getZoneDisplayName(zoneId) {
    const names = {
      'zone-1': 'Zone 1: North (Node-01)',
      'zone-2': 'Zone 2: East Sloped (Node-02)',
      'zone-3': 'Zone 3: Central (Node-03)',
      'zone-4': 'Zone 4: South (Node-04)'
    };
    return names[zoneId] || zoneId;
  }

  render() {
    const targetEl = document.getElementById(this.containerId);
    if (!targetEl) return;

    const filteredSensors = SENSOR_CATALOG.filter(sensor => {
      if (this.selectedCategory === 'all') return true;
      return sensor.category === this.selectedCategory;
    });

    targetEl.innerHTML = `
      <!-- Telemetry Stream Vitals Banner -->
      <div class="card sensor-vitals-banner">
        <div class="stream-vitals-info">
          <div class="stream-status-pill">
            <span class="pulse-indicator"></span>
            <strong>Virtual IoT Stream:</strong> ACTIVE
          </div>
          <div class="stream-stat-item">
            <span class="v-label">Nodes:</span>
            <span class="v-val">4 Deployed • 4 Synchronized</span>
          </div>
          <div class="stream-stat-item">
            <span class="v-label">Avg Ping:</span>
            <span class="v-val">1.2s (LoRaWAN +9dB)</span>
          </div>
          <div class="stream-stat-item">
            <span class="v-label">Data Source:</span>
            <span class="source-tag source-simulated">SIMULATED — Virtual IoT</span>
          </div>
        </div>
        <div class="stream-vitals-actions">
          <button type="button" class="btn btn-sm btn-outline" id="btn-simulate-pulse">
            ⚡ Pulse Telemetry
          </button>
        </div>
      </div>

      <!-- Filter Controls Strip -->
      <div class="sensor-filter-strip">
        <div class="filter-group">
          <label class="filter-label">Filter Zone:</label>
          <div class="filter-pills" id="sensor-zone-filters">
            <button type="button" class="pill-btn ${this.selectedZoneId === 'zone-1' ? 'active' : ''}" data-zone="zone-1">Zone 1: North</button>
            <button type="button" class="pill-btn ${this.selectedZoneId === 'zone-2' ? 'active pill-stress' : 'pill-stress'}" data-zone="zone-2">Zone 2: East (Stress) ⚠️</button>
            <button type="button" class="pill-btn ${this.selectedZoneId === 'zone-3' ? 'active' : ''}" data-zone="zone-3">Zone 3: Central</button>
            <button type="button" class="pill-btn ${this.selectedZoneId === 'zone-4' ? 'active' : ''}" data-zone="zone-4">Zone 4: South</button>
          </div>
        </div>

        <div class="filter-group">
          <label class="filter-label">Category:</label>
          <div class="filter-pills" id="sensor-category-filters">
            <button type="button" class="pill-btn ${this.selectedCategory === 'all' ? 'active' : ''}" data-cat="all">All (10)</button>
            <button type="button" class="pill-btn ${this.selectedCategory === 'soil' ? 'active' : ''}" data-cat="soil">Moisture & Temp (2)</button>
            <button type="button" class="pill-btn ${this.selectedCategory === 'nutrients' ? 'active' : ''}" data-cat="nutrients">NPK & Soil (5)</button>
            <button type="button" class="pill-btn ${this.selectedCategory === 'weather' ? 'active' : ''}" data-cat="weather">Atmospheric (3)</button>
          </div>
        </div>
      </div>

      <!-- 10 Supported Sensor Cards Grid (Section 15) -->
      <div class="virtual-sensor-cards-grid">
        ${filteredSensors.map(sensor => {
          const reading = sensor.values[this.selectedZoneId] || sensor.values['zone-1'];
          const isStress = reading.status.includes('Alert') || reading.status.includes('Stress');

          return `
            <div class="card virtual-sensor-card ${isStress ? 'card-stress-border' : ''}">
              <div class="sensor-card-top">
                <div class="sensor-name-group">
                  <span class="sensor-icon-bubble">${sensor.icon}</span>
                  <div>
                    <h3 class="sensor-title">${sensor.name}</h3>
                    <span class="sensor-zone-subtitle">Field #1 / ${this.getZoneDisplayName(this.selectedZoneId)}</span>
                  </div>
                </div>
                <span class="badge ${reading.statusClass}">${reading.status}</span>
              </div>

              <div class="sensor-card-body">
                <div class="sensor-val-row">
                  <span class="sensor-reading-num">${reading.val}</span>
                  <span class="sensor-reading-unit">${sensor.unit}</span>
                </div>
                <div class="sensor-trend-badge trend-${reading.trend}">
                  <span>${reading.trendText}</span>
                </div>
              </div>

              <div class="sensor-card-meta-list">
                <div class="sensor-meta-line">
                  <span class="meta-label">Target Benchmark:</span>
                  <span class="meta-val">${sensor.optimalRange}</span>
                </div>
                <div class="sensor-meta-line">
                  <span class="meta-label">Data Source:</span>
                  <span class="source-tag source-simulated">SIMULATED — Virtual IoT</span>
                </div>
                <div class="sensor-meta-line">
                  <span class="meta-label">Last Updated:</span>
                  <span class="sensor-update-ticker">Just now (stream heartbeat)</span>
                </div>
                <div class="sensor-meta-line">
                  <span class="meta-label">Data Quality:</span>
                  <span class="text-success" style="font-weight: 600; font-size: 11px;">✓ ${reading.quality}</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.bindDynamicCardEvents();
  }

  bindEvents() {
    // Listen for global hierarchy changes (e.g. from breadcrumbs or map)
    window.addEventListener('hierarchychange', (e) => {
      if (e.detail?.zone?.id) {
        this.selectedZoneId = e.detail.zone.id;
        this.render();
      }
    });

    window.addEventListener('mapzoneselect', (e) => {
      if (e.detail?.zoneId) {
        this.selectedZoneId = e.detail.zoneId;
        this.render();
      }
    });
  }

  bindDynamicCardEvents() {
    const targetEl = document.getElementById(this.containerId);
    if (!targetEl) return;

    // Zone Filter Buttons
    targetEl.querySelectorAll('#sensor-zone-filters [data-zone]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedZoneId = btn.getAttribute('data-zone');
        this.render();
        appShell.showToast(`Switched telemetry to ${this.getZoneDisplayName(this.selectedZoneId)}`, 'info', 1500);
      });
    });

    // Category Filter Buttons
    targetEl.querySelectorAll('#sensor-category-filters [data-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedCategory = btn.getAttribute('data-cat');
        this.render();
      });
    });

    // Pulse Telemetry Simulation Button
    targetEl.querySelector('#btn-simulate-pulse')?.addEventListener('click', () => {
      this.triggerMicroFluctuation();
      appShell.showToast('Synthesized micro-fluctuation heartbeat pulse', 'success', 2000);
    });
  }

  /**
   * Simulate realistic micro-fluctuation across virtual IoT stream
   */
  triggerMicroFluctuation() {
    SENSOR_CATALOG.forEach(sensor => {
      const reading = sensor.values[this.selectedZoneId];
      if (reading && typeof reading.val === 'number' && sensor.id !== 'ph') {
        const delta = (Math.random() * 0.4 - 0.2);
        reading.val = Number((reading.val + delta).toFixed(1));
      }
    });
    this.lastUpdateTime = new Date();
    this.render();
  }

  startLiveHeartbeat() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.triggerMicroFluctuation();
    }, 12000); // Pulse every 12s
  }
}

// Auto-initialize when sensor container is present
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('virtual-sensor-center-container')) {
    window.virtualSensorCenter = new VirtualSensorCenter('virtual-sensor-center-container');
  }
});

export default VirtualSensorCenter;
