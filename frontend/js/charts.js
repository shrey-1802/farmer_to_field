/**
 * KrishiNirnay AI - Sensor Telemetry Charts Controller (Phase 10)
 * Renders responsive time-series charts for:
 * Soil Moisture (with threshold bands), Temperature, Humidity, NPK, pH, EC, and Rainfall.
 * Supports time ranges: 1 Hour, 6 Hours, 24 Hours, 7 Days, 30 Days.
 * Computes and displays: Current, Minimum, Maximum, Average, Trend, Last Updated.
 */

import APP_CONFIG from './config.js';
import appShell from './ui.js';

// Pre-generated realistic agronomic time-series data streams
export const CHART_DATA_STORE = {
  // Soil Moisture (% Volumetric)
  soil_moisture: {
    name: 'Soil Moisture Telemetry',
    unit: '%',
    param: 'soil_moisture',
    thresholds: {
      wiltingPoint: 18.0,
      madThreshold: 28.0,
      fieldCapacity: 38.5
    },
    ranges: {
      '1h': {
        labels: ['60m ago', '50m ago', '40m ago', '30m ago', '20m ago', '10m ago', 'Just now'],
        'zone-1': [41.5, 41.4, 41.3, 41.3, 41.2, 41.2, 41.2],
        'zone-2': [24.8, 24.6, 24.5, 24.4, 24.3, 24.2, 24.1],
        'zone-3': [38.7, 38.6, 38.6, 38.5, 38.5, 38.5, 38.5],
        'zone-4': [36.5, 36.5, 36.4, 36.4, 36.3, 36.3, 36.3]
      },
      '6h': {
        labels: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00'],
        'zone-1': [42.0, 41.8, 41.6, 41.5, 41.4, 41.3, 41.2],
        'zone-2': [27.0, 26.5, 25.8, 25.2, 24.8, 24.4, 24.1],
        'zone-3': [39.2, 39.0, 38.9, 38.8, 38.7, 38.6, 38.5],
        'zone-4': [37.2, 37.0, 36.8, 36.6, 36.5, 36.4, 36.3]
      },
      '24h': {
        labels: ['12:00', '16:00', '20:00', '00:00', '04:00', '08:00', '12:00'],
        'zone-1': [43.2, 42.6, 42.2, 41.9, 41.6, 41.4, 41.2],
        'zone-2': [31.5, 29.8, 28.4, 27.2, 26.0, 25.0, 24.1],
        'zone-3': [40.4, 39.8, 39.4, 39.0, 38.8, 38.6, 38.5],
        'zone-4': [38.0, 37.6, 37.2, 36.9, 36.7, 36.5, 36.3]
      },
      '7d': {
        labels: ['Sept 13', 'Sept 14', 'Sept 15', 'Sept 16', 'Sept 17', 'Sept 18', 'Sept 19'],
        'zone-1': [44.5, 44.0, 43.2, 42.5, 42.0, 41.5, 41.2],
        'zone-2': [38.0, 35.2, 32.5, 29.8, 27.5, 25.4, 24.1],
        'zone-3': [42.0, 41.2, 40.5, 39.8, 39.2, 38.8, 38.5],
        'zone-4': [40.0, 39.2, 38.5, 37.8, 37.2, 36.8, 36.3]
      },
      '30d': {
        labels: ['Aug 21', 'Aug 26', 'Aug 31', 'Sept 05', 'Sept 10', 'Sept 15', 'Sept 19'],
        'zone-1': [45.0, 43.8, 44.2, 43.0, 42.5, 41.8, 41.2],
        'zone-2': [42.5, 39.0, 41.2, 36.5, 33.0, 28.5, 24.1],
        'zone-3': [44.0, 42.5, 43.0, 41.5, 40.2, 39.2, 38.5],
        'zone-4': [42.0, 40.8, 41.5, 39.5, 38.4, 37.2, 36.3]
      }
    }
  },

  // Temperature (°C)
  temperature: {
    name: 'Soil & Ambient Temperature',
    unit: '°C',
    param: 'temperature',
    ranges: {
      '1h': {
        labels: ['60m ago', '50m ago', '40m ago', '30m ago', '20m ago', '10m ago', 'Just now'],
        'zone-1': [27.0, 27.1, 27.2, 27.2, 27.3, 27.4, 27.4],
        'zone-2': [29.2, 29.4, 29.6, 29.8, 29.9, 30.0, 30.1],
        'zone-3': [27.6, 27.7, 27.8, 27.8, 27.9, 28.0, 28.0],
        'zone-4': [28.1, 28.2, 28.3, 28.3, 28.4, 28.5, 28.5]
      },
      '6h': {
        labels: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00'],
        'zone-1': [23.5, 24.2, 25.0, 25.8, 26.5, 27.0, 27.4],
        'zone-2': [24.0, 25.0, 26.2, 27.5, 28.8, 29.5, 30.1],
        'zone-3': [23.8, 24.5, 25.4, 26.2, 27.0, 27.5, 28.0],
        'zone-4': [24.0, 24.8, 25.6, 26.5, 27.4, 28.0, 28.5]
      },
      '24h': {
        labels: ['12:00', '16:00', '20:00', '00:00', '04:00', '08:00', '12:00'],
        'zone-1': [27.8, 28.2, 25.6, 23.8, 22.9, 25.2, 27.4],
        'zone-2': [30.5, 31.0, 27.4, 24.5, 23.4, 26.8, 30.1],
        'zone-3': [28.2, 28.6, 26.0, 24.0, 23.0, 25.5, 28.0],
        'zone-4': [28.6, 29.0, 26.4, 24.2, 23.2, 26.0, 28.5]
      },
      '7d': {
        labels: ['Sept 13', 'Sept 14', 'Sept 15', 'Sept 16', 'Sept 17', 'Sept 18', 'Sept 19'],
        'zone-1': [26.8, 27.2, 27.5, 27.0, 27.1, 27.3, 27.4],
        'zone-2': [28.5, 29.0, 29.8, 29.2, 29.5, 29.8, 30.1],
        'zone-3': [27.2, 27.6, 28.0, 27.5, 27.7, 27.9, 28.0],
        'zone-4': [27.8, 28.1, 28.5, 28.0, 28.2, 28.4, 28.5]
      },
      '30d': {
        labels: ['Aug 21', 'Aug 26', 'Aug 31', 'Sept 05', 'Sept 10', 'Sept 15', 'Sept 19'],
        'zone-1': [28.5, 28.0, 27.8, 27.2, 27.0, 27.2, 27.4],
        'zone-2': [31.2, 30.5, 30.0, 29.5, 29.2, 29.6, 30.1],
        'zone-3': [29.0, 28.4, 28.2, 27.8, 27.5, 27.8, 28.0],
        'zone-4': [29.5, 29.0, 28.8, 28.2, 28.0, 28.3, 28.5]
      }
    }
  },

  // Relative Humidity (%)
  humidity: {
    name: 'Relative Ambient Humidity',
    unit: '%',
    param: 'humidity',
    ranges: {
      '1h': {
        labels: ['60m ago', '50m ago', '40m ago', '30m ago', '20m ago', '10m ago', 'Just now'],
        'zone-1': [55, 55, 54, 54, 54, 54, 54],
        'zone-2': [50, 49, 49, 48, 48, 48, 48],
        'zone-3': [56, 56, 55, 55, 55, 55, 55],
        'zone-4': [54, 54, 53, 53, 53, 53, 53]
      },
      '6h': {
        labels: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00'],
        'zone-1': [78, 72, 66, 62, 58, 55, 54],
        'zone-2': [74, 68, 62, 56, 52, 49, 48],
        'zone-3': [79, 74, 68, 63, 59, 56, 55],
        'zone-4': [76, 70, 65, 60, 56, 54, 53]
      },
      '24h': {
        labels: ['12:00', '16:00', '20:00', '00:00', '04:00', '08:00', '12:00'],
        'zone-1': [52, 48, 64, 75, 82, 68, 54],
        'zone-2': [46, 42, 58, 70, 78, 62, 48],
        'zone-3': [53, 49, 66, 76, 84, 70, 55],
        'zone-4': [51, 47, 63, 73, 80, 66, 53]
      },
      '7d': {
        labels: ['Sept 13', 'Sept 14', 'Sept 15', 'Sept 16', 'Sept 17', 'Sept 18', 'Sept 19'],
        'zone-1': [58, 56, 55, 54, 53, 54, 54],
        'zone-2': [52, 50, 49, 48, 47, 48, 48],
        'zone-3': [60, 58, 57, 55, 54, 55, 55],
        'zone-4': [56, 54, 53, 52, 52, 53, 53]
      },
      '30d': {
        labels: ['Aug 21', 'Aug 26', 'Aug 31', 'Sept 05', 'Sept 10', 'Sept 15', 'Sept 19'],
        'zone-1': [65, 62, 58, 60, 56, 55, 54],
        'zone-2': [58, 55, 52, 54, 50, 49, 48],
        'zone-3': [67, 64, 60, 62, 58, 56, 55],
        'zone-4': [63, 60, 56, 58, 54, 53, 53]
      }
    }
  },

  // Soil NPK (Nitrogen / Phosphorus / Potassium)
  npk: {
    name: 'NPK Nutrient Dynamic Curves',
    unit: 'kg/ha',
    param: 'npk',
    ranges: {
      '1h': {
        labels: ['60m', '45m', '30m', '15m', 'Now'],
        'zone-1': [140, 140, 140, 140, 140],
        'zone-2': [135, 135, 135, 135, 135],
        'zone-3': [145, 145, 145, 145, 145],
        'zone-4': [130, 130, 130, 130, 130]
      },
      '6h': {
        labels: ['06:00', '08:00', '10:00', '12:00'],
        'zone-1': [140, 140, 140, 140],
        'zone-2': [136, 135, 135, 135],
        'zone-3': [145, 145, 145, 145],
        'zone-4': [130, 130, 130, 130]
      },
      '24h': {
        labels: ['Day -1', 'Evening', 'Night', 'Morning', 'Today'],
        'zone-1': [142, 141, 141, 140, 140],
        'zone-2': [138, 137, 136, 135, 135],
        'zone-3': [147, 146, 146, 145, 145],
        'zone-4': [132, 131, 131, 130, 130]
      },
      '7d': {
        labels: ['Sept 13', 'Sept 14', 'Sept 15', 'Sept 16', 'Sept 17', 'Sept 18', 'Sept 19'],
        'zone-1': [148, 146, 144, 143, 142, 141, 140],
        'zone-2': [144, 142, 140, 138, 137, 136, 135],
        'zone-3': [152, 150, 148, 147, 146, 145, 145],
        'zone-4': [136, 134, 133, 132, 131, 130, 130]
      },
      '30d': {
        labels: ['Aug 21', 'Aug 26', 'Aug 31', 'Sept 05', 'Sept 10', 'Sept 15', 'Sept 19'],
        'zone-1': [160, 156, 152, 148, 144, 142, 140],
        'zone-2': [155, 150, 146, 142, 138, 136, 135],
        'zone-3': [165, 160, 156, 152, 148, 146, 145],
        'zone-4': [145, 142, 139, 136, 133, 131, 130]
      }
    }
  },

  // Soil pH & EC
  ph_ec: {
    name: 'Soil pH & Electrical Conductivity',
    unit: 'pH / dS/m',
    param: 'ph_ec',
    ranges: {
      '1h': {
        labels: ['60m', '40m', '20m', 'Now'],
        'zone-1': [7.8, 7.8, 7.8, 7.8],
        'zone-2': [8.0, 8.0, 8.0, 8.0],
        'zone-3': [7.6, 7.6, 7.6, 7.6],
        'zone-4': [7.7, 7.7, 7.7, 7.7]
      },
      '6h': {
        labels: ['06:00', '08:00', '10:00', '12:00'],
        'zone-1': [7.8, 7.8, 7.8, 7.8],
        'zone-2': [7.9, 8.0, 8.0, 8.0],
        'zone-3': [7.6, 7.6, 7.6, 7.6],
        'zone-4': [7.7, 7.7, 7.7, 7.7]
      },
      '24h': {
        labels: ['Yesterday', 'Evening', 'Midnight', 'Morning', 'Now'],
        'zone-1': [7.8, 7.8, 7.8, 7.8, 7.8],
        'zone-2': [7.9, 7.9, 8.0, 8.0, 8.0],
        'zone-3': [7.6, 7.6, 7.6, 7.6, 7.6],
        'zone-4': [7.7, 7.7, 7.7, 7.7, 7.7]
      },
      '7d': {
        labels: ['Sept 13', 'Sept 14', 'Sept 15', 'Sept 16', 'Sept 17', 'Sept 18', 'Sept 19'],
        'zone-1': [7.7, 7.7, 7.8, 7.8, 7.8, 7.8, 7.8],
        'zone-2': [7.8, 7.8, 7.9, 7.9, 8.0, 8.0, 8.0],
        'zone-3': [7.5, 7.5, 7.6, 7.6, 7.6, 7.6, 7.6],
        'zone-4': [7.6, 7.6, 7.7, 7.7, 7.7, 7.7, 7.7]
      },
      '30d': {
        labels: ['Aug 21', 'Aug 26', 'Aug 31', 'Sept 05', 'Sept 10', 'Sept 15', 'Sept 19'],
        'zone-1': [7.6, 7.7, 7.7, 7.7, 7.8, 7.8, 7.8],
        'zone-2': [7.7, 7.8, 7.8, 7.9, 7.9, 8.0, 8.0],
        'zone-3': [7.5, 7.5, 7.5, 7.6, 7.6, 7.6, 7.6],
        'zone-4': [7.5, 7.6, 7.6, 7.6, 7.7, 7.7, 7.7]
      }
    }
  },

  // Rainfall (Precipitation mm)
  rainfall: {
    name: 'Hourly & Daily Precipitation',
    unit: 'mm',
    param: 'rainfall',
    isBarChart: true,
    ranges: {
      '1h': {
        labels: ['60m', '50m', '40m', '30m', '20m', '10m', 'Now'],
        'zone-1': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        'zone-2': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        'zone-3': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        'zone-4': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
      },
      '6h': {
        labels: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00'],
        'zone-1': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        'zone-2': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        'zone-3': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        'zone-4': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
      },
      '24h': {
        labels: ['12:00', '16:00', '20:00', '00:00', '04:00', '08:00', '12:00'],
        'zone-1': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        'zone-2': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        'zone-3': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
        'zone-4': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
      },
      '7d': {
        labels: ['Sept 13', 'Sept 14', 'Sept 15', 'Sept 16', 'Sept 17', 'Sept 18', 'Sept 19'],
        'zone-1': [0.0, 14.5, 2.0, 0.0, 0.0, 0.0, 0.0],
        'zone-2': [0.0, 11.2, 1.5, 0.0, 0.0, 0.0, 0.0],
        'zone-3': [0.0, 15.0, 2.2, 0.0, 0.0, 0.0, 0.0],
        'zone-4': [0.0, 13.8, 1.8, 0.0, 0.0, 0.0, 0.0]
      },
      '30d': {
        labels: ['Aug 21', 'Aug 26', 'Aug 31', 'Sept 05', 'Sept 10', 'Sept 15', 'Sept 19'],
        'zone-1': [0.0, 28.5, 5.2, 0.0, 0.0, 16.5, 0.0],
        'zone-2': [0.0, 22.0, 3.8, 0.0, 0.0, 12.7, 0.0],
        'zone-3': [0.0, 30.0, 6.0, 0.0, 0.0, 17.2, 0.0],
        'zone-4': [0.0, 26.5, 4.5, 0.0, 0.0, 15.6, 0.0]
      }
    }
  }
};

export class TelemetryChartViewer {
  constructor(containerId = 'telemetry-chart-viewer-container') {
    this.containerId = containerId;
    this.selectedParam = 'soil_moisture';
    this.selectedRange = '24h';
    this.selectedZoneId = 'zone-2';
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
  }

  computeStats(series) {
    if (!series || !series.length) {
      return { current: 0, min: 0, max: 0, avg: 0, trend: '→ Steady' };
    }
    const current = series[series.length - 1];
    const min = Math.min(...series);
    const max = Math.max(...series);
    const avg = Number((series.reduce((a, b) => a + b, 0) / series.length).toFixed(1));

    const first = series[0];
    const diff = current - first;
    let trend = '→ Steady';
    if (diff < -0.5) trend = `↓ Decreasing (${diff.toFixed(1)})`;
    else if (diff > 0.5) trend = `↑ Rising (+${diff.toFixed(1)})`;

    return { current, min, max, avg, trend };
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const paramConfig = CHART_DATA_STORE[this.selectedParam] || CHART_DATA_STORE.soil_moisture;
    const rangeData = paramConfig.ranges[this.selectedRange];
    const labels = rangeData.labels;
    const series = rangeData[this.selectedZoneId] || rangeData['zone-1'];
    const stats = this.computeStats(series);

    container.innerHTML = `
      <section class="card chart-analytics-card">
        <!-- Chart Controls Header -->
        <div class="chart-controls-header">
          <div class="chart-title-wrap">
            <h2 class="card-title">📈 Interactive Sensor Telemetry Charts</h2>
            <p class="card-subtitle">Real-time historical series, operational thresholds, and statistical trends</p>
          </div>
          <div class="chart-source-indicator">
            <span class="source-tag source-simulated">SIMULATED — Virtual IoT</span>
          </div>
        </div>

        <!-- Parameter & Zone Selection Bar -->
        <div class="chart-filter-bar">
          <div class="filter-group">
            <label class="filter-label">Parameter:</label>
            <div class="filter-pills" id="chart-param-pills">
              <button type="button" class="pill-btn ${this.selectedParam === 'soil_moisture' ? 'active' : ''}" data-param="soil_moisture">💧 Soil Moisture</button>
              <button type="button" class="pill-btn ${this.selectedParam === 'temperature' ? 'active' : ''}" data-param="temperature">🌡️ Temperature</button>
              <button type="button" class="pill-btn ${this.selectedParam === 'humidity' ? 'active' : ''}" data-param="humidity">☁️ Humidity</button>
              <button type="button" class="pill-btn ${this.selectedParam === 'npk' ? 'active' : ''}" data-param="npk">🌿 NPK Dynamics</button>
              <button type="button" class="pill-btn ${this.selectedParam === 'ph_ec' ? 'active' : ''}" data-param="ph_ec">🧪 pH & EC</button>
              <button type="button" class="pill-btn ${this.selectedParam === 'rainfall' ? 'active' : ''}" data-param="rainfall">🌧️ Rainfall</button>
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label">Time Window:</label>
            <div class="filter-pills" id="chart-range-pills">
              <button type="button" class="pill-btn ${this.selectedRange === '1h' ? 'active' : ''}" data-range="1h">1 Hour</button>
              <button type="button" class="pill-btn ${this.selectedRange === '6h' ? 'active' : ''}" data-range="6h">6 Hours</button>
              <button type="button" class="pill-btn ${this.selectedRange === '24h' ? 'active' : ''}" data-range="24h">24 Hours</button>
              <button type="button" class="pill-btn ${this.selectedRange === '7d' ? 'active' : ''}" data-range="7d">7 Days</button>
              <button type="button" class="pill-btn ${this.selectedRange === '30d' ? 'active' : ''}" data-range="30d">30 Days</button>
            </div>
          </div>

          <div class="filter-group">
            <label class="filter-label">Zone:</label>
            <div class="filter-pills" id="chart-zone-pills">
              <button type="button" class="pill-btn ${this.selectedZoneId === 'zone-1' ? 'active' : ''}" data-zone="zone-1">Zone 1 (North)</button>
              <button type="button" class="pill-btn ${this.selectedZoneId === 'zone-2' ? 'active pill-stress' : 'pill-stress'}" data-zone="zone-2">Zone 2 (East Stress) ⚠️</button>
              <button type="button" class="pill-btn ${this.selectedZoneId === 'zone-3' ? 'active' : ''}" data-zone="zone-3">Zone 3 (Central)</button>
              <button type="button" class="pill-btn ${this.selectedZoneId === 'zone-4' ? 'active' : ''}" data-zone="zone-4">Zone 4 (South)</button>
            </div>
          </div>
        </div>

        <!-- KPI Statistics Strip (Current, Min, Max, Avg, Trend, Last Updated) -->
        <div class="chart-stats-strip">
          <div class="stat-box">
            <span class="stat-label">Current Reading</span>
            <div class="stat-val-row">
              <span class="stat-num ${this.selectedParam === 'soil_moisture' && stats.current < 28 ? 'text-danger' : 'text-primary'}">${stats.current}</span>
              <span class="stat-unit">${paramConfig.unit}</span>
            </div>
            <span class="stat-sub">Live synchronized</span>
          </div>

          <div class="stat-box">
            <span class="stat-label">Minimum</span>
            <div class="stat-val-row">
              <span class="stat-num">${stats.min}</span>
              <span class="stat-unit">${paramConfig.unit}</span>
            </div>
            <span class="stat-sub">Lowest in window</span>
          </div>

          <div class="stat-box">
            <span class="stat-label">Maximum</span>
            <div class="stat-val-row">
              <span class="stat-num">${stats.max}</span>
              <span class="stat-unit">${paramConfig.unit}</span>
            </div>
            <span class="stat-sub">Peak in window</span>
          </div>

          <div class="stat-box">
            <span class="stat-label">Average</span>
            <div class="stat-val-row">
              <span class="stat-num">${stats.avg}</span>
              <span class="stat-unit">${paramConfig.unit}</span>
            </div>
            <span class="stat-sub">Mean telemetry</span>
          </div>

          <div class="stat-box">
            <span class="stat-label">Observed Trend</span>
            <div class="stat-trend-val">${stats.trend}</div>
            <span class="stat-sub">Directional vector</span>
          </div>

          <div class="stat-box">
            <span class="stat-label">Last Updated</span>
            <div class="stat-time-val">12 seconds ago</div>
            <span class="stat-sub">Heartbeat pulse</span>
          </div>
        </div>

        <!-- SVG Vector Chart Viewport -->
        <div class="chart-canvas-container" id="chart-viewport-box">
          ${this.renderSvgChart(paramConfig, labels, series)}
        </div>

        ${paramConfig.thresholds ? `
          <!-- Agronomic Threshold Reference Legend -->
          <div class="chart-threshold-legend">
            <span class="thresh-item thresh-fc"><span class="thresh-dot"></span> Field Capacity: 38.5% (Full Saturation)</span>
            <span class="thresh-item thresh-mad"><span class="thresh-dot"></span> MAD Threshold: 28.0% (Action Required)</span>
            <span class="thresh-item thresh-pwp"><span class="thresh-dot"></span> Wilting Point: 18.0% (Severe Loss)</span>
          </div>
        ` : ''}
      </section>
    `;

    this.bindPillEvents();
  }

  renderSvgChart(paramConfig, labels, series) {
    const width = 800;
    const height = 300;
    const padding = { top: 30, right: 30, bottom: 40, left: 60 };

    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    // Determine scale limits
    let minVal = Math.min(...series);
    let maxVal = Math.max(...series);

    if (paramConfig.thresholds) {
      minVal = Math.min(minVal, paramConfig.thresholds.wiltingPoint - 3);
      maxVal = Math.max(maxVal, paramConfig.thresholds.fieldCapacity + 3);
    } else {
      const buffer = (maxVal - minVal) * 0.15 || 5;
      minVal = Math.max(0, minVal - buffer);
      maxVal = maxVal + buffer;
    }

    const scaleY = (val) => {
      const ratio = (val - minVal) / (maxVal - minVal || 1);
      return padding.top + plotH - (ratio * plotH);
    };

    const scaleX = (idx) => {
      const step = plotW / (series.length - 1 || 1);
      return padding.left + (idx * step);
    };

    // Construct curve path
    const points = series.map((val, idx) => ({ x: scaleX(idx), y: scaleY(val), val, label: labels[idx] }));
    const pathD = points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x},${padding.top + plotH} L ${points[0].x},${padding.top + plotH} Z`;

    // Operational threshold lines for Soil Moisture
    let thresholdLines = '';
    if (paramConfig.thresholds) {
      const fcY = scaleY(paramConfig.thresholds.fieldCapacity);
      const madY = scaleY(paramConfig.thresholds.madThreshold);
      const pwpY = scaleY(paramConfig.thresholds.wiltingPoint);

      thresholdLines = `
        <!-- Field Capacity -->
        <line x1="${padding.left}" y1="${fcY}" x2="${width - padding.right}" y2="${fcY}" stroke="#16A34A" stroke-width="1.5" stroke-dasharray="6,4"/>
        <text x="${width - padding.right - 5}" y="${fcY - 5}" text-anchor="end" font-size="10" font-weight="700" fill="#16A34A">Field Capacity (38.5%)</text>

        <!-- MAD Stress Limit -->
        <line x1="${padding.left}" y1="${madY}" x2="${width - padding.right}" y2="${madY}" stroke="#D97706" stroke-width="1.5" stroke-dasharray="6,4"/>
        <text x="${width - padding.right - 5}" y="${madY - 5}" text-anchor="end" font-size="10" font-weight="700" fill="#D97706">Stress Threshold (28%)</text>

        <!-- Wilting Point -->
        <line x1="${padding.left}" y1="${pwpY}" x2="${width - padding.right}" y2="${pwpY}" stroke="#DC2626" stroke-width="1.5" stroke-dasharray="4,4"/>
        <text x="${width - padding.right - 5}" y="${pwpY - 5}" text-anchor="end" font-size="10" font-weight="700" fill="#DC2626">Wilting Point (18%)</text>
      `;
    }

    return `
      <svg viewBox="0 0 ${width} ${height}" class="chart-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#16A34A" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#16A34A" stop-opacity="0.0"/>
          </linearGradient>
          <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#DC2626" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#DC2626" stop-opacity="0.0"/>
          </linearGradient>
        </defs>

        <!-- Grid Lines & Y-Axis Labels -->
        ${[0, 0.25, 0.5, 0.75, 1.0].map(ratio => {
          const yVal = minVal + (maxVal - minVal) * ratio;
          const y = padding.top + plotH - (ratio * plotH);
          return `
            <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="var(--color-border)" stroke-width="0.75" stroke-dasharray="2,2"/>
            <text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="var(--color-text-muted)">${yVal.toFixed(0)}${paramConfig.unit}</text>
          `;
        }).join('')}

        <!-- X-Axis Labels -->
        ${points.map(p => `
          <text x="${p.x}" y="${height - 12}" text-anchor="middle" font-size="10" fill="var(--color-text-secondary)">${p.label}</text>
          <line x1="${p.x}" y1="${padding.top + plotH}" x2="${p.x}" y2="${padding.top + plotH + 5}" stroke="var(--color-border)" stroke-width="1"/>
        `).join('')}

        <!-- Threshold lines -->
        ${thresholdLines}

        <!-- Shaded Area Under Curve -->
        <path d="${areaD}" fill="${this.selectedZoneId === 'zone-2' && this.selectedParam === 'soil_moisture' ? 'url(#stressGradient)' : 'url(#chartGradient)'}" />

        <!-- Line Curve -->
        <path d="${pathD}" fill="none" stroke="${this.selectedZoneId === 'zone-2' && this.selectedParam === 'soil_moisture' ? '#DC2626' : '#16A34A'}" stroke-width="3" stroke-linecap="round"/>

        <!-- Interactive Point Circles -->
        ${points.map(p => `
          <g class="chart-point-marker" transform="translate(${p.x}, ${p.y})">
            <circle r="6" fill="${this.selectedZoneId === 'zone-2' && this.selectedParam === 'soil_moisture' ? '#DC2626' : '#16A34A'}" stroke="#FFFFFF" stroke-width="2"/>
            <text x="0" y="-10" text-anchor="middle" font-size="10" font-weight="700" fill="var(--color-text-primary)">${p.val}</text>
          </g>
        `).join('')}
      </svg>
    `;
  }

  bindEvents() {
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

  bindPillEvents() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Parameter selection
    container.querySelectorAll('#chart-param-pills [data-param]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedParam = btn.getAttribute('data-param');
        this.render();
      });
    });

    // Time window range selection
    container.querySelectorAll('#chart-range-pills [data-range]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedRange = btn.getAttribute('data-range');
        this.render();
        appShell.showToast(`Switched time range to ${btn.textContent}`, 'info', 1500);
      });
    });

    // Zone selection
    container.querySelectorAll('#chart-zone-pills [data-zone]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedZoneId = btn.getAttribute('data-zone');
        this.render();
      });
    });
  }
}

// Auto-initialize when container is present
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('telemetry-chart-viewer-container')) {
    window.telemetryChartViewer = new TelemetryChartViewer('telemetry-chart-viewer-container');
  }
});

export default TelemetryChartViewer;
