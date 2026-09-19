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

/* ==========================================================================
   Phase 11: Sensor Status & Operational Thresholds
   ========================================================================== */
export const SENSOR_NODES_DATA = [
  {
    id: 'node-01',
    name: 'Node-01 (North Quadrant)',
    zone: 'Zone 1: North',
    status: 'ONLINE', // ONLINE, STALE, OFFLINE, ERROR, SIMULATED
    source: 'SIMULATED', // SIMULATED, PHYSICAL IoT
    battery: 98,
    voltage: '3.65 V',
    rssi: '-92 dBm',
    snr: '+9.2 dB',
    lastPingSecondsAgo: 2,
    packetLoss: '0.0%',
    calibrationStatus: 'Valid (Calibrated Sept 18)'
  },
  {
    id: 'node-02',
    name: 'Node-02 (East Sloped)',
    zone: 'Zone 2: East',
    status: 'SIMULATED',
    source: 'SIMULATED',
    battery: 96,
    voltage: '3.62 V',
    rssi: '-95 dBm',
    snr: '+8.8 dB',
    lastPingSecondsAgo: 1,
    packetLoss: '0.0%',
    calibrationStatus: 'Valid (Calibrated Sept 18)'
  },
  {
    id: 'node-03',
    name: 'Node-03 (Central Loam)',
    zone: 'Zone 3: Central',
    status: 'ONLINE',
    source: 'SIMULATED',
    battery: 95,
    voltage: '3.61 V',
    rssi: '-90 dBm',
    snr: '+9.5 dB',
    lastPingSecondsAgo: 4,
    packetLoss: '0.0%',
    calibrationStatus: 'Valid (Calibrated Sept 18)'
  },
  {
    id: 'node-04',
    name: 'Node-04 (South Border)',
    zone: 'Zone 4: South',
    status: 'ONLINE',
    source: 'SIMULATED',
    battery: 99,
    voltage: '3.67 V',
    rssi: '-91 dBm',
    snr: '+9.1 dB',
    lastPingSecondsAgo: 3,
    packetLoss: '0.0%',
    calibrationStatus: 'Valid (Calibrated Sept 18)'
  }
];

export const CROP_THRESHOLDS = {
  'boll_formation': {
    stageName: 'BT Cotton — Boll Formation (Day 75 – 115) [CURRENT]',
    parameters: [
      { name: 'Soil Moisture (15cm)', unit: '%', critMin: 20.0, warnMin: 28.0, optMin: 32.0, optMax: 42.0, warnMax: 46.0, note: 'Depletion < 28% causes boll shedding' },
      { name: 'Soil Temperature', unit: '°C', critMin: 15.0, warnMin: 20.0, optMin: 24.0, optMax: 30.0, warnMax: 34.0, note: 'Temperatures > 34°C induce stomatal closure' },
      { name: 'Available Nitrogen (N)', unit: 'kg/ha', critMin: 90, warnMin: 110, optMin: 120, optMax: 160, warnMax: 180, note: 'Critical for boll development' },
      { name: 'Soil Reaction (pH)', unit: 'pH', critMin: 5.8, warnMin: 6.2, optMin: 6.8, optMax: 8.0, warnMax: 8.4, note: 'Alkaline buffer' },
      { name: 'Electrical Cond. (EC)', unit: 'dS/m', critMin: 0.2, warnMin: 0.4, optMin: 0.6, optMax: 1.5, warnMax: 2.5, note: 'Salinity check' }
    ]
  },
  'vegetative': {
    stageName: 'BT Cotton — Vegetative Growth (Day 25 – 70)',
    parameters: [
      { name: 'Soil Moisture (15cm)', unit: '%', critMin: 18.0, warnMin: 24.0, optMin: 28.0, optMax: 38.0, warnMax: 42.0, note: 'Vegetative canopy establishment' },
      { name: 'Soil Temperature', unit: '°C', critMin: 16.0, warnMin: 22.0, optMin: 25.0, optMax: 32.0, warnMax: 36.0, note: 'Optimal root growth' },
      { name: 'Available Nitrogen (N)', unit: 'kg/ha', critMin: 110, warnMin: 130, optMin: 140, optMax: 180, warnMax: 200, note: 'High vegetative requirement' },
      { name: 'Soil Reaction (pH)', unit: 'pH', critMin: 5.8, warnMin: 6.2, optMin: 6.8, optMax: 8.0, warnMax: 8.4, note: 'Alkaline buffer' },
      { name: 'Electrical Cond. (EC)', unit: 'dS/m', critMin: 0.2, warnMin: 0.4, optMin: 0.6, optMax: 1.5, warnMax: 2.5, note: 'Salinity check' }
    ]
  }
};

export class SensorStatusManager {
  constructor(containerId = 'sensor-status-thresholds-container') {
    this.containerId = containerId;
    this.selectedCropStage = 'boll_formation';
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
  }

  getStatusBadge(status) {
    switch (status) {
      case 'ONLINE':
        return `<span class="badge badge-success status-pulse">● ONLINE</span>`;
      case 'STALE':
        return `<span class="badge badge-warning">⏳ STALE (&gt;60s)</span>`;
      case 'OFFLINE':
        return `<span class="badge badge-outline">○ OFFLINE</span>`;
      case 'ERROR':
        return `<span class="badge badge-danger">✕ ERROR</span>`;
      case 'SIMULATED':
      default:
        return `<span class="badge badge-primary">🧪 SIMULATED</span>`;
    }
  }

  getSourceBadge(source) {
    if (source === 'PHYSICAL IoT') {
      return `<span class="source-tag source-live">PHYSICAL IoT</span>`;
    }
    return `<span class="source-tag source-simulated">SIMULATED</span>`;
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const currentStage = CROP_THRESHOLDS[this.selectedCropStage] || CROP_THRESHOLDS.boll_formation;

    container.innerHTML = `
      <!-- Sensor Node Status Matrix Card (Section 17) -->
      <section class="card sensor-status-card">
        <div class="card-header">
          <div>
            <h2 class="card-title">📡 Hardware & Virtual Node Status Matrix</h2>
            <p class="card-subtitle">Formal operational statuses conforming to Section 17 (ONLINE / STALE / OFFLINE / ERROR / SIMULATED)</p>
          </div>
          <div class="status-tools">
            <button type="button" class="btn btn-sm btn-outline" id="btn-toggle-source">
              🔄 Switch Node-01 to PHYSICAL IoT
            </button>
            <button type="button" class="btn btn-sm btn-outline" id="btn-simulate-stale">
              ⚠️ Simulate Stale Node
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table node-status-table">
            <thead>
              <tr>
                <th>Node ID & Name</th>
                <th>Management Zone</th>
                <th>Status (Section 17)</th>
                <th>Source Type</th>
                <th>Battery Vitals</th>
                <th>LoRaWAN SNR / Signal</th>
                <th>Last Ping</th>
                <th>Calibration State</th>
              </tr>
            </thead>
            <tbody>
              ${SENSOR_NODES_DATA.map(node => `
                <tr class="${node.status === 'ERROR' ? 'row-danger' : node.status === 'STALE' ? 'row-warning' : ''}">
                  <td>
                    <strong>${node.id.toUpperCase()}</strong>
                    <div style="font-size: 11px; color: var(--color-text-secondary);">${node.name}</div>
                  </td>
                  <td>${node.zone}</td>
                  <td>${this.getStatusBadge(node.status)}</td>
                  <td>${this.getSourceBadge(node.source)}</td>
                  <td>
                    <div style="font-weight: 700;">${node.battery}%</div>
                    <div style="font-size: 10px; color: var(--color-text-muted);">${node.voltage}</div>
                  </td>
                  <td>
                    <div style="font-weight: 600;">${node.snr}</div>
                    <div style="font-size: 10px; color: var(--color-text-muted);">${node.rssi}</div>
                  </td>
                  <td>${node.lastPingSecondsAgo}s ago</td>
                  <td><span class="text-success" style="font-size: 11px; font-weight: 600;">✓ ${node.calibrationStatus}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <!-- Operational Thresholds Catalog Card (Section 17) -->
      <section class="card operational-thresholds-card" style="margin-top: var(--space-4);">
        <div class="card-header">
          <div>
            <h2 class="card-title">⚖️ Agronomic Operational Thresholds & Setpoints</h2>
            <p class="card-subtitle">Phenology-calibrated thresholds governing automated irrigation and advisory alerts</p>
          </div>
          <div class="stage-pills" id="threshold-stage-pills">
            <button type="button" class="pill-btn ${this.selectedCropStage === 'boll_formation' ? 'active' : ''}" data-stage="boll_formation">
              🌸 Boll Formation (Day 93)
            </button>
            <button type="button" class="pill-btn ${this.selectedCropStage === 'vegetative' ? 'active' : ''}" data-stage="vegetative">
              🌱 Vegetative Stage
            </button>
          </div>
        </div>

        <div class="threshold-stage-info-pill">
          <strong>Active Growth Model:</strong> ${currentStage.stageName}
        </div>

        <div class="table-responsive">
          <table class="data-table threshold-table">
            <thead>
              <tr>
                <th>Agricultural Parameter</th>
                <th>Critical Deficit</th>
                <th>Warning / Action Level</th>
                <th>Optimal Target Band</th>
                <th>Warning Excess</th>
                <th>Agronomic Rationale</th>
              </tr>
            </thead>
            <tbody>
              ${currentStage.parameters.map(p => `
                <tr>
                  <td><strong>${p.name}</strong></td>
                  <td><span class="val-badge danger">&lt; ${p.critMin} ${p.unit}</span></td>
                  <td><span class="val-badge warning">&lt; ${p.warnMin} ${p.unit}</span></td>
                  <td><span class="val-badge success">${p.optMin} – ${p.optMax} ${p.unit}</span></td>
                  <td><span class="val-badge warning">&gt; ${p.warnMax} ${p.unit}</span></td>
                  <td style="font-size: 11px; color: var(--color-text-secondary);">${p.note}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;

    this.bindActionEvents();
  }

  bindEvents() {
    // Dynamic event bindings
  }

  bindActionEvents() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Toggle PHYSICAL IoT vs SIMULATED on Node-01
    container.querySelector('#btn-toggle-source')?.addEventListener('click', () => {
      const node01 = SENSOR_NODES_DATA.find(n => n.id === 'node-01');
      if (node01) {
        node01.source = node01.source === 'SIMULATED' ? 'PHYSICAL IoT' : 'SIMULATED';
        this.render();
        appShell.showToast(`Switched Node-01 source to ${node01.source}`, 'info', 2500);
      }
    });

    // Simulate Stale Node
    container.querySelector('#btn-simulate-stale')?.addEventListener('click', () => {
      const node03 = SENSOR_NODES_DATA.find(n => n.id === 'node-03');
      if (node03) {
        node03.status = node03.status === 'STALE' ? 'ONLINE' : 'STALE';
        node03.lastPingSecondsAgo = node03.status === 'STALE' ? 142 : 4;
        this.render();
        appShell.showToast(`Simulated Node-03 status: ${node03.status}`, 'warning', 2500);
      }
    });

    // Switch Crop Stage
    container.querySelectorAll('#threshold-stage-pills [data-stage]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedCropStage = btn.getAttribute('data-stage');
        this.render();
        appShell.showToast(`Updated thresholds for ${btn.textContent.trim()}`, 'info', 2000);
      });
    });
  }
}

// Auto-initialize when sensor containers are present
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('virtual-sensor-center-container')) {
    window.virtualSensorCenter = new VirtualSensorCenter('virtual-sensor-center-container');
  }
  if (document.getElementById('sensor-status-thresholds-container')) {
    window.sensorStatusManager = new SensorStatusManager('sensor-status-thresholds-container');
  }
});

export default VirtualSensorCenter;

