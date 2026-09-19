/**
 * KrishiNirnay AI - Map Interface & Spatial Visualization Controller (Phase 8)
 * Manages farm boundaries, field boundaries, management zones, virtual IoT sensor markers,
 * real-time risk markers, active task locations, and dynamic overlay layers (NDVI, Moisture).
 */

import APP_CONFIG from './config.js';
import appShell from './ui.js';
import { HIERARCHY_DATA } from './fields.js';

export const MAP_CONFIG = {
  center: { lat: 22.3039, lng: 70.8022 }, // Rajkot, Gujarat
  farmName: 'Shanti Agro Farm',
  fieldName: 'North Cotton Plot',
  totalAcres: 12.0,
  layers: {
    boundaries: true,
    zones: true,
    sensors: true,
    risks: true,
    tasks: true,
    weather: true,
    ndvi: false,
    moisture: false
  },
  sensorNodes: [
    {
      id: 'node-01',
      name: 'Node-01 (Zone 1)',
      zoneId: 'zone-1',
      x: 220,
      y: 150,
      coords: [22.3045, 70.8015],
      type: 'Virtual IoT Multi-Depth',
      status: 'Optimal',
      battery: '98%',
      snr: '+9.2 dB',
      moisture: 41.2,
      temp: 27.4,
      leafWetness: 0,
      source: 'SIMULATED — Virtual IoT'
    },
    {
      id: 'node-02',
      name: 'Node-02 (Zone 2)',
      zoneId: 'zone-2',
      x: 540,
      y: 140,
      coords: [22.3048, 70.8030],
      type: 'Virtual IoT Multi-Depth',
      status: 'Alert: Water Stress',
      battery: '96%',
      snr: '+8.8 dB',
      moisture: 24.1,
      temp: 30.1,
      leafWetness: 0,
      source: 'SIMULATED — Virtual IoT'
    },
    {
      id: 'node-03',
      name: 'Node-03 (Zone 3)',
      zoneId: 'zone-3',
      x: 210,
      y: 300,
      coords: [22.3032, 70.8016],
      type: 'Virtual IoT Multi-Depth',
      status: 'Optimal',
      battery: '95%',
      snr: '+9.5 dB',
      moisture: 38.5,
      temp: 28.0,
      leafWetness: 0,
      source: 'SIMULATED — Virtual IoT'
    },
    {
      id: 'node-04',
      name: 'Node-04 (Zone 4)',
      zoneId: 'zone-4',
      x: 530,
      y: 290,
      coords: [22.3030, 70.8032],
      type: 'Virtual IoT Multi-Depth',
      status: 'Optimal',
      battery: '99%',
      snr: '+9.1 dB',
      moisture: 36.3,
      temp: 28.5,
      leafWetness: 0,
      source: 'SIMULATED — Virtual IoT'
    }
  ],
  riskMarkers: [
    {
      id: 'risk-01',
      title: 'High: Root Zone Moisture Stress',
      zoneId: 'zone-2',
      x: 580,
      y: 100,
      level: 'high',
      metric: '24.1% Moisture (< 28% MAD)',
      icon: '🚨'
    },
    {
      id: 'risk-02',
      title: 'Medium: Sucking Pest Pressure',
      zoneId: 'zone-1',
      x: 290,
      y: 90,
      level: 'medium',
      metric: 'Favorable Heat/Humidity Index',
      icon: '⚠️'
    }
  ],
  taskMarkers: [
    {
      id: 'task-01',
      title: 'Drip Actuation: Valve B (45 min run)',
      zoneId: 'zone-2',
      x: 480,
      y: 180,
      type: 'valve',
      status: 'SCHEDULED',
      icon: '🚰'
    }
  ]
};

export class MapController {
  constructor(containerId = 'field-map-container') {
    this.container = document.getElementById(containerId);
    this.activeLayer = 'default';
    this.activeZoneId = 'zone-2';
    this.popup = null;
    this.init();
  }

  init() {
    if (!this.container) return;
    this.renderMapInterface();
    this.bindMapEvents();
  }

  /**
   * Render Interactive Map DOM, Controls & SVG Layers
   */
  renderMapInterface() {
    this.container.innerHTML = `
      <!-- Map Layer Toolbar -->
      <div class="map-toolbar" aria-label="Map Layers">
        <div class="map-toolbar-group">
          <span class="map-toolbar-label">Layers:</span>
          <button type="button" class="map-chip active" data-layer="zones">Zones</button>
          <button type="button" class="map-chip active" data-layer="sensors">📡 Virtual Sensors</button>
          <button type="button" class="map-chip active" data-layer="risks">⚠️ Risks</button>
          <button type="button" class="map-chip active" data-layer="tasks">⚡ Tasks</button>
          <button type="button" class="map-chip" data-layer="ndvi">NDVI Biomass</button>
          <button type="button" class="map-chip" data-layer="moisture">Moisture Heatmap</button>
        </div>
        <div class="map-toolbar-group">
          <button type="button" class="map-chip btn-reset-view" title="Reset View">🔄 Reset</button>
        </div>
      </div>

      <!-- Interactive SVG Canvas -->
      <div class="map-viewport">
        <svg viewBox="0 0 800 380" class="field-svg-canvas" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-border)" stroke-width="0.5"/>
            </pattern>

            <!-- NDVI Gradients -->
            <radialGradient id="ndvi-zone2-stress" cx="70%" cy="35%" r="40%">
              <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.6"/>
              <stop offset="60%" stop-color="#84CC16" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#16A34A" stop-opacity="0.15"/>
            </radialGradient>

            <!-- Moisture Gradient Overlay -->
            <radialGradient id="moisture-zone2-dry" cx="70%" cy="35%" r="40%">
              <stop offset="0%" stop-color="#DC2626" stop-opacity="0.5"/>
              <stop offset="70%" stop-color="#3B82F6" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="#1D4ED8" stop-opacity="0.1"/>
            </radialGradient>
          </defs>

          <!-- Base Grid -->
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />

          <!-- LAYER: Farm & Field Boundaries -->
          <g id="layer-boundaries" class="map-layer">
            <!-- Farm Outer Boundary Line -->
            <polygon points="40,25 760,18 730,360 70,368" fill="none" stroke="#D97706" stroke-width="2" stroke-dasharray="8,4" opacity="0.6"/>
            <text x="50" y="20" font-size="10" font-weight="700" fill="#D97706">Farm Boundary (Shanti Agro • 12 Ac)</text>

            <!-- Field Outer Boundary Polygon -->
            <polygon points="60,40 740,30 710,340 90,350" fill="none" stroke="var(--color-primary-600)" stroke-width="2.5"/>
          </g>

          <!-- LAYER: Management Zones -->
          <g id="layer-zones" class="map-layer">
            <!-- Zone 1 -->
            <polygon id="poly-zone-1" class="map-zone-poly" data-zone-id="zone-1"
              points="65,45 390,40 380,180 80,190"
              fill="rgba(34, 197, 94, 0.16)" stroke="var(--color-primary-500)" stroke-width="1.5"/>
            <text x="170" y="105" class="zone-poly-title">Zone 1: North (3.5 Ac)</text>
            <text x="170" y="125" class="zone-poly-sub">Optimal • 41.2% Moisture</text>

            <!-- Zone 2 (Stress Zone) -->
            <polygon id="poly-zone-2" class="map-zone-poly zone-stress-poly" data-zone-id="zone-2"
              points="390,40 735,35 715,175 380,180"
              fill="rgba(217, 119, 6, 0.22)" stroke="var(--color-warning)" stroke-width="2.5"/>
            <text x="490" y="105" class="zone-poly-title" fill="var(--color-warning)">Zone 2: East (2.8 Ac) ⚠️</text>
            <text x="490" y="125" class="zone-poly-sub" fill="var(--color-danger)">Water Stress • 24.1%</text>

            <!-- Zone 3 -->
            <polygon id="poly-zone-3" class="map-zone-poly" data-zone-id="zone-3"
              points="80,190 380,180 370,335 95,345"
              fill="rgba(34, 197, 94, 0.16)" stroke="var(--color-primary-500)" stroke-width="1.5"/>
            <text x="170" y="255" class="zone-poly-title">Zone 3: Central (2.5 Ac)</text>
            <text x="170" y="275" class="zone-poly-sub">Optimal • 38.5% Moisture</text>

            <!-- Zone 4 -->
            <polygon id="poly-zone-4" class="map-zone-poly" data-zone-id="zone-4"
              points="380,180 715,175 700,335 370,335"
              fill="rgba(34, 197, 94, 0.16)" stroke="var(--color-primary-500)" stroke-width="1.5"/>
            <text x="490" y="255" class="zone-poly-title">Zone 4: South (3.2 Ac)</text>
            <text x="490" y="275" class="zone-poly-sub">Optimal • 36.3% Moisture</text>
          </g>

          <!-- LAYER: NDVI Biomass Heatmap Overlay (Hidden by default) -->
          <g id="layer-ndvi" class="map-layer" style="display: none;">
            <polygon points="65,45 735,35 700,335 95,345" fill="url(#ndvi-zone2-stress)"/>
          </g>

          <!-- LAYER: Moisture Heatmap Overlay (Hidden by default) -->
          <g id="layer-moisture" class="map-layer" style="display: none;">
            <polygon points="65,45 735,35 700,335 95,345" fill="url(#moisture-zone2-dry)"/>
          </g>

          <!-- LAYER: Active Tasks / Solenoid Valve Markers -->
          <g id="layer-tasks" class="map-layer">
            <g class="map-task-node" data-task-id="task-01" transform="translate(480, 175)">
              <circle r="12" fill="#0284C7" stroke="#FFFFFF" stroke-width="2"/>
              <text x="-6" y="4" font-size="11">🚰</text>
              <rect x="18" y="-12" width="130" height="24" rx="4" fill="var(--color-surface)" stroke="var(--color-border)"/>
              <text x="24" y="4" font-size="10" font-weight="700" fill="var(--color-text-primary)">Valve B (Drip Run)</text>
            </g>
          </g>

          <!-- LAYER: Virtual IoT Sensor Nodes -->
          <g id="layer-sensors" class="map-layer">
            ${MAP_CONFIG.sensorNodes.map(node => `
              <g class="map-sensor-marker ${node.status.includes('Alert') ? 'marker-alert' : ''}"
                 data-sensor-id="${node.id}"
                 transform="translate(${node.x}, ${node.y})">
                <circle class="sensor-pulse-ring" r="16" fill="none"
                        stroke="${node.status.includes('Alert') ? '#DC2626' : '#16A34A'}"
                        stroke-width="1.5" opacity="0.6"/>
                <circle class="sensor-dot" r="9"
                        fill="${node.status.includes('Alert') ? '#DC2626' : '#16A34A'}"
                        stroke="#FFFFFF" stroke-width="2"/>
                <text x="14" y="4" class="sensor-marker-label">${node.name.split(' ')[0]}</text>
              </g>
            `).join('')}
          </g>

          <!-- LAYER: Risk Markers -->
          <g id="layer-risks" class="map-layer">
            ${MAP_CONFIG.riskMarkers.map(risk => `
              <g class="map-risk-marker marker-${risk.level}"
                 data-risk-id="${risk.id}"
                 transform="translate(${risk.x}, ${risk.y})">
                <circle r="12" fill="${risk.level === 'high' ? '#DC2626' : '#F59E0B'}" stroke="#FFFFFF" stroke-width="2"/>
                <text x="-6" y="4" font-size="11">${risk.icon}</text>
              </g>
            `).join('')}
          </g>

          <!-- LAYER: Weather Context (Wind Vector & Microclimate) -->
          <g id="layer-weather" class="map-layer">
            <g transform="translate(710, 60)">
              <circle r="16" fill="var(--color-surface)" stroke="var(--color-border)" stroke-width="1.5"/>
              <!-- Compass Wind Arrow pointing NW -->
              <path d="M 0,-8 L 4,6 L 0,3 L -4,6 Z" fill="#0284C7" transform="rotate(-45)"/>
              <text x="-25" y="28" font-size="9" font-weight="700" fill="var(--color-text-secondary)">14 km/h NW</text>
            </g>
          </g>
        </svg>
      </div>

      <!-- Interactive Map Floating Popup Tooltip -->
      <div id="map-interactive-popup" class="map-floating-popup" style="display: none;"></div>

      <!-- Map Legend Bar -->
      <div class="map-legend-bar" aria-label="Map Legend">
        <div class="legend-item"><span class="legend-swatch swatch-optimal"></span> Optimal Moisture (35–45%)</div>
        <div class="legend-item"><span class="legend-swatch swatch-stress"></span> Moisture Deficit / Stress (&lt; 28%)</div>
        <div class="legend-item"><span class="legend-icon">📡</span> Virtual IoT Node (<span class="source-tag source-simulated" style="padding: 1px 4px; font-size: 9px;">SIMULATED</span>)</div>
        <div class="legend-item"><span class="legend-icon">🚨</span> High Risk Hotspot</div>
        <div class="legend-item"><span class="legend-icon">🚰</span> Drip Valve Actuator</div>
      </div>
    `;
  }

  /**
   * Bind all interactive events for layers, markers, and tooltips
   */
  bindMapEvents() {
    this.popup = document.getElementById('map-interactive-popup');

    // Layer Chip Toggles
    this.container.querySelectorAll('.map-chip[data-layer]').forEach(chip => {
      chip.addEventListener('click', () => {
        const layer = chip.getAttribute('data-layer');
        const isActive = chip.classList.toggle('active');
        this.toggleLayer(layer, isActive);
      });
    });

    // Reset View Button
    this.container.querySelector('.btn-reset-view')?.addEventListener('click', () => {
      this.resetLayerDefaults();
      appShell.showToast('Map view reset to default layers', 'info', 2000);
    });

    // Zone Polygon Hover & Clicks
    this.container.querySelectorAll('.map-zone-poly').forEach(poly => {
      const zoneId = poly.getAttribute('data-zone-id');

      poly.addEventListener('mouseenter', (e) => {
        poly.style.strokeWidth = '4';
        this.showZoneTooltip(zoneId, e);
      });

      poly.addEventListener('mousemove', (e) => {
        this.positionPopup(e);
      });

      poly.addEventListener('mouseleave', () => {
        if (zoneId !== this.activeZoneId) {
          poly.style.strokeWidth = zoneId === 'zone-2' ? '2.5' : '1.5';
        }
        this.hidePopup();
      });

      poly.addEventListener('click', () => {
        this.selectZone(zoneId);
      });
    });

    // Sensor Marker Hover & Clicks
    this.container.querySelectorAll('.map-sensor-marker').forEach(marker => {
      const sensorId = marker.getAttribute('data-sensor-id');
      const sensor = MAP_CONFIG.sensorNodes.find(s => s.id === sensorId);

      marker.addEventListener('mouseenter', (e) => {
        if (sensor) this.showSensorTooltip(sensor, e);
      });

      marker.addEventListener('mousemove', (e) => {
        this.positionPopup(e);
      });

      marker.addEventListener('mouseleave', () => {
        this.hidePopup();
      });

      marker.addEventListener('click', () => {
        if (sensor) {
          this.selectZone(sensor.zoneId);
          appShell.showToast(`Selected ${sensor.name} (${sensor.status})`, 'info', 2500);
        }
      });
    });

    // Risk Marker Hover
    this.container.querySelectorAll('.map-risk-marker').forEach(marker => {
      const riskId = marker.getAttribute('data-risk-id');
      const risk = MAP_CONFIG.riskMarkers.find(r => r.id === riskId);

      marker.addEventListener('mouseenter', (e) => {
        if (risk) this.showRiskTooltip(risk, e);
      });

      marker.addEventListener('mousemove', (e) => {
        this.positionPopup(e);
      });

      marker.addEventListener('mouseleave', () => {
        this.hidePopup();
      });
    });

    // Listen for global hierarchy changes from fields.js
    window.addEventListener('hierarchychange', (e) => {
      if (e.detail?.zone?.id) {
        this.highlightZonePolygon(e.detail.zone.id);
      }
    });
  }

  /**
   * Toggle Layer Visibility
   */
  toggleLayer(layerName, isVisible) {
    MAP_CONFIG.layers[layerName] = isVisible;
    const layerGroup = document.getElementById(`layer-${layerName}`);

    if (layerGroup) {
      layerGroup.style.display = isVisible ? 'inline' : 'none';
      appShell.showToast(`${isVisible ? 'Enabled' : 'Hidden'} ${layerName} layer`, 'info', 1500);
    }
  }

  resetLayerDefaults() {
    this.container.querySelectorAll('.map-chip[data-layer]').forEach(chip => {
      const layer = chip.getAttribute('data-layer');
      const defaultState = layer !== 'ndvi' && layer !== 'moisture';
      chip.classList.toggle('active', defaultState);
      const group = document.getElementById(`layer-${layer}`);
      if (group) group.style.display = defaultState ? 'inline' : 'none';
    });
  }

  /**
   * Select and Highlight a Management Zone
   */
  selectZone(zoneId) {
    this.activeZoneId = zoneId;
    this.highlightZonePolygon(zoneId);

    // Dispatch global hierarchy change so tabs update
    window.dispatchEvent(new CustomEvent('mapzoneselect', { detail: { zoneId } }));
    appShell.showToast(`Selected ${zoneId.toUpperCase()} from map`, 'info', 2000);
  }

  highlightZonePolygon(zoneId) {
    this.activeZoneId = zoneId;
    this.container.querySelectorAll('.map-zone-poly').forEach(poly => {
      if (poly.getAttribute('data-zone-id') === zoneId) {
        poly.style.strokeWidth = '4.5';
        poly.style.stroke = '#2563EB';
      } else {
        const isStress = poly.classList.contains('zone-stress-poly');
        poly.style.strokeWidth = isStress ? '2.5' : '1.5';
        poly.style.stroke = isStress ? 'var(--color-warning)' : 'var(--color-primary-500)';
      }
    });
  }

  /**
   * Show Tooltips for Zones, Sensors, and Risks
   */
  showZoneTooltip(zoneId, e) {
    if (!this.popup) return;
    const farmData = HIERARCHY_DATA['farm-1']?.fields[0]?.zones.find(z => z.id === zoneId);
    if (!farmData) return;

    this.popup.innerHTML = `
      <div class="popup-title">${farmData.name}</div>
      <div class="popup-meta">Area: ${farmData.acres} Acres • Status: <strong>${farmData.health.toUpperCase()}</strong></div>
      <div class="popup-stat-row">
        <span>Soil Moisture: <strong>${farmData.sensors.moisture}%</strong></span>
        <span>Soil Temp: <strong>${farmData.sensors.temp}°C</strong></span>
      </div>
      <div class="popup-hint">Click to inspect management zone</div>
    `;
    this.popup.style.display = 'block';
    this.positionPopup(e);
  }

  showSensorTooltip(sensor, e) {
    if (!this.popup) return;
    this.popup.innerHTML = `
      <div class="popup-title">📡 ${sensor.name}</div>
      <div class="popup-badge"><span class="source-tag source-simulated">${sensor.source}</span></div>
      <div class="popup-stat-row">
        <span>Moisture: <strong>${sensor.moisture}%</strong></span>
        <span>Temp: <strong>${sensor.temp}°C</strong></span>
      </div>
      <div class="popup-meta">Battery: ${sensor.battery} • Signal: ${sensor.snr}</div>
      <div class="popup-status ${sensor.status.includes('Alert') ? 'text-danger' : 'text-success'}">${sensor.status}</div>
    `;
    this.popup.style.display = 'block';
    this.positionPopup(e);
  }

  showRiskTooltip(risk, e) {
    if (!this.popup) return;
    this.popup.innerHTML = `
      <div class="popup-title">${risk.icon} ${risk.title}</div>
      <div class="popup-meta">Target: <strong>${risk.zoneId.toUpperCase()}</strong></div>
      <div class="popup-desc">${risk.metric}</div>
      <div class="popup-hint">Open Risks tab for intervention details</div>
    `;
    this.popup.style.display = 'block';
    this.positionPopup(e);
  }

  positionPopup(e) {
    if (!this.popup) return;
    const rect = this.container.getBoundingClientRect();
    const x = e.clientX - rect.left + 15;
    const y = e.clientY - rect.top + 15;
    this.popup.style.left = `${x}px`;
    this.popup.style.top = `${y}px`;
  }

  hidePopup() {
    if (this.popup) this.popup.style.display = 'none';
  }
}

// Auto-initialize when map container is available
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('field-map-container')) {
    window.fieldMapController = new MapController('field-map-container');
  }
});

export default MapController;
