/**
 * KrishiNirnay AI - Accessible Sensor Telemetry & Chart Visualization Engine
 * Section 45 (Phase 39) & Section 16 (Phase 10) Compliance
 * Pure Vanilla ES6+ Canvas & Accessible HTML5 Data Table
 * Strict Zero-Framework Architecture
 */

(function () {
  'use strict';

  // Configured telemetry metrics with units and reference ranges
  const METRIC_CONFIGS = {
    soil_moisture: {
      id: 'soil_moisture',
      label: 'Soil Moisture',
      unit: '%',
      color: '#16A34A',
      rgba: '22, 163, 74',
      yMin: 0,
      yMax: 100,
      optimal: [40, 70],
      source: 'SIMULATED — Virtual IoT'
    },
    temperature: {
      id: 'temperature',
      label: 'Soil Temperature',
      unit: '°C',
      color: '#EA580C',
      rgba: '234, 88, 12',
      yMin: 10,
      yMax: 45,
      optimal: [20, 32],
      source: 'SIMULATED — Virtual IoT'
    },
    humidity: {
      id: 'humidity',
      label: 'Relative Humidity',
      unit: '%',
      color: '#2563EB',
      rgba: '37, 99, 235',
      yMin: 20,
      yMax: 100,
      optimal: [55, 80],
      source: 'SIMULATED — Virtual IoT'
    },
    rainfall: {
      id: 'rainfall',
      label: 'Precipitation',
      unit: 'mm',
      color: '#0284C7',
      rgba: '2, 132, 199',
      yMin: 0,
      yMax: 60,
      optimal: [0, 30],
      source: 'SIMULATED — Virtual IoT'
    },
    npk: {
      id: 'npk',
      label: 'Nitrogen (N)',
      unit: 'mg/kg',
      color: '#7C3AED',
      rgba: '124, 58, 237',
      yMin: 50,
      yMax: 250,
      optimal: [120, 180],
      source: 'SIMULATED — Virtual IoT'
    }
  };

  /**
   * KrishiChart Class
   */
  class KrishiChart {
    /**
     * @param {object} options
     * @param {HTMLElement|string} options.container Container element or selector
     * @param {string} [options.metric='soil_moisture']
     * @param {string} [options.range='24h'] ('1h'|'6h'|'24h'|'7d'|'30d')
     * @param {Array<object>} [options.data] Optional explicit data points [{ time: string, value: number }]
     */
    constructor(options = {}) {
      this.container = typeof options.container === 'string'
        ? document.querySelector(options.container)
        : options.container;

      if (!this.container) {
        throw new Error('[KrishiChart] Valid container element required.');
      }

      this.metricKey = options.metric || 'soil_moisture';
      this.rangeKey = options.range || '24h';
      this.data = options.data || this._generateSampleData(this.metricKey, this.rangeKey);
      this.activeHoverIndex = null;
      this.isTableVisible = false;

      this._initDOM();
      this._bindEvents();
      this.render();
    }

    /**
     * Build the chart card layout
     */
    _initDOM() {
      this.container.innerHTML = `
        <div class="telemetry-chart-container">
          <!-- Header with Title, Source Badge, and Controls -->
          <div class="chart-header">
            <div class="chart-title-group">
              <span class="chart-title" id="chart-main-title">
                <span id="metric-icon">🌱</span>
                <span id="metric-title-text">${METRIC_CONFIGS[this.metricKey].label}</span>
              </span>
              <span class="badge-virtual-iot" title="Core Virtual IoT Feature — Section 45 Standard">
                SIMULATED — Virtual IoT
              </span>
            </div>

            <!-- Time Range Controls -->
            <div class="segmented-control" role="group" aria-label="Select Telemetry Time Range">
              <button type="button" class="segmented-btn ${this.rangeKey === '1h' ? 'active' : ''}" data-range="1h">1H</button>
              <button type="button" class="segmented-btn ${this.rangeKey === '6h' ? 'active' : ''}" data-range="6h">6H</button>
              <button type="button" class="segmented-btn ${this.rangeKey === '24h' ? 'active' : ''}" data-range="24h">24H</button>
              <button type="button" class="segmented-btn ${this.rangeKey === '7d' ? 'active' : ''}" data-range="7d">7D</button>
              <button type="button" class="segmented-btn ${this.rangeKey === '30d' ? 'active' : ''}" data-range="30d">30D</button>
            </div>
          </div>

          <!-- Metric Selector Bar -->
          <div class="chart-selectors-bar">
            <div class="segmented-control" role="group" aria-label="Select Sensor Metric">
              <button type="button" class="segmented-btn ${this.metricKey === 'soil_moisture' ? 'active' : ''}" data-metric="soil_moisture">💧 Soil Moisture</button>
              <button type="button" class="segmented-btn ${this.metricKey === 'temperature' ? 'active' : ''}" data-metric="temperature">🌡️ Temp</button>
              <button type="button" class="segmented-btn ${this.metricKey === 'humidity' ? 'active' : ''}" data-metric="humidity">💨 Humidity</button>
              <button type="button" class="segmented-btn ${this.metricKey === 'rainfall' ? 'active' : ''}" data-metric="rainfall">🌧️ Rainfall</button>
              <button type="button" class="segmented-btn ${this.metricKey === 'npk' ? 'active' : ''}" data-metric="npk">🌿 NPK (N)</button>
            </div>

            <div style="font-size: var(--font-size-xs); color: var(--color-text-muted);">
              <span id="chart-last-updated">Last update: Just now</span>
            </div>
          </div>

          <!-- Section 16 Statistics Row -->
          <div class="chart-stats-grid">
            <div class="stat-pill">
              <span class="stat-pill-label">Current Reading</span>
              <div class="stat-pill-value">
                <span id="stat-current">--</span>
                <span class="stat-pill-unit" id="stat-current-unit"></span>
              </div>
            </div>
            <div class="stat-pill">
              <span class="stat-pill-label">Minimum</span>
              <div class="stat-pill-value">
                <span id="stat-min">--</span>
                <span class="stat-pill-unit" id="stat-min-unit"></span>
              </div>
            </div>
            <div class="stat-pill">
              <span class="stat-pill-label">Maximum</span>
              <div class="stat-pill-value">
                <span id="stat-max">--</span>
                <span class="stat-pill-unit" id="stat-max-unit"></span>
              </div>
            </div>
            <div class="stat-pill">
              <span class="stat-pill-label">Average</span>
              <div class="stat-pill-value">
                <span id="stat-avg">--</span>
                <span class="stat-pill-unit" id="stat-avg-unit"></span>
              </div>
            </div>
            <div class="stat-pill">
              <span class="stat-pill-label">24h Trend</span>
              <div class="stat-pill-value" style="font-size: var(--font-size-base);">
                <span id="stat-trend">--</span>
              </div>
            </div>
          </div>

          <!-- Canvas Responsive Chart Area -->
          <div class="chart-canvas-wrapper" id="canvas-wrapper">
            <canvas class="chart-canvas" role="img" tabindex="0" aria-label="Sensor Telemetry Chart"></canvas>
            <div class="chart-tooltip" id="chart-tooltip"></div>
          </div>

          <!-- Section 45 Accessibility Fallback Table (Screen Reader Accessible) -->
          <div class="chart-a11y-section">
            <button type="button" class="chart-a11y-toggle-btn" id="a11y-toggle-btn">
              <span>♿</span> <span id="a11y-btn-text">Show Accessible Data Table</span>
            </button>
            <div id="a11y-table-container" style="display: none; overflow-x: auto;"></div>
          </div>
        </div>
      `;

      this.canvas = this.container.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.wrapper = this.container.querySelector('#canvas-wrapper');
      this.tooltip = this.container.querySelector('#chart-tooltip');
      this.a11yContainer = this.container.querySelector('#a11y-table-container');
    }

    /**
     * Bind UI interaction events
     */
    _bindEvents() {
      // Metric buttons
      this.container.querySelectorAll('[data-metric]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const m = e.currentTarget.getAttribute('data-metric');
          this.setMetric(m);
        });
      });

      // Range buttons
      this.container.querySelectorAll('[data-range]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const r = e.currentTarget.getAttribute('data-range');
          this.setRange(r);
        });
      });

      // Accessible table toggle
      const a11yBtn = this.container.querySelector('#a11y-toggle-btn');
      if (a11yBtn) {
        a11yBtn.addEventListener('click', () => {
          this.isTableVisible = !this.isTableVisible;
          this.a11yContainer.style.display = this.isTableVisible ? 'block' : 'none';
          this.container.querySelector('#a11y-btn-text').textContent = this.isTableVisible
            ? 'Hide Accessible Data Table'
            : 'Show Accessible Data Table';
        });
      }

      // Resize observer
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => {
          this.render();
        });
        ro.observe(this.wrapper);
      } else {
        window.addEventListener('resize', () => this.render());
      }

      // Canvas hover / touch tooltip
      this.canvas.addEventListener('mousemove', (e) => this._handlePointer(e));
      this.canvas.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches[0]) {
          this._handlePointer(e.touches[0]);
        }
      }, { passive: true });

      this.canvas.addEventListener('mouseleave', () => this._hideTooltip());
      this.canvas.addEventListener('touchend', () => this._hideTooltip());

      // Dark theme observer
      const observer = new MutationObserver(() => this.render());
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-high-contrast'] });
    }

    /**
     * Switch metric
     * @param {string} metricKey
     */
    setMetric(metricKey) {
      if (!METRIC_CONFIGS[metricKey]) return;
      this.metricKey = metricKey;
      this.data = this._generateSampleData(this.metricKey, this.rangeKey);

      // Update active states
      this.container.querySelectorAll('[data-metric]').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-metric') === metricKey);
      });

      const cfg = METRIC_CONFIGS[metricKey];
      this.container.querySelector('#metric-title-text').textContent = cfg.label;

      const icons = {
        soil_moisture: '💧',
        temperature: '🌡️',
        humidity: '💨',
        rainfall: '🌧️',
        npk: '🌿'
      };
      this.container.querySelector('#metric-icon').textContent = icons[metricKey] || '📊';

      this.render();
      if (window.Toast) {
        Toast.info('Metric Changed', `Viewing ${cfg.label} (${cfg.unit})`);
      }
    }

    /**
     * Switch time range
     * @param {string} rangeKey
     */
    setRange(rangeKey) {
      this.rangeKey = rangeKey;
      this.data = this._generateSampleData(this.metricKey, this.rangeKey);

      this.container.querySelectorAll('[data-range]').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-range') === rangeKey);
      });

      this.render();
      if (window.Toast) {
        Toast.info('Time Range Changed', `Viewing telemetry for past ${rangeKey.toUpperCase()}`);
      }
    }

    /**
     * Set external telemetry data (e.g. from backend API)
     * @param {Array<{ time: string, value: number }>} dataPoints
     */
    setData(dataPoints) {
      if (Array.isArray(dataPoints) && dataPoints.length > 0) {
        this.data = dataPoints;
        this.render();
      }
    }

    /**
     * Render the chart canvas and statistics
     */
    render() {
      const cfg = METRIC_CONFIGS[this.metricKey];
      const data = this.data;
      if (!data || data.length === 0) return;

      // Update statistics row
      this._updateStats(data, cfg);

      // Handle Retina DPI
      const rect = this.wrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width || 600;
      const height = rect.height || 260;

      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;
      this.ctx.resetTransform?.();
      this.ctx.scale(dpr, dpr);

      const ctx = this.ctx;
      ctx.clearRect(0, 0, width, height);

      // Chart plotting margins
      const padLeft = 45;
      const padRight = 20;
      const padTop = 24;
      const padBottom = 32;

      const plotWidth = width - padLeft - padRight;
      const plotHeight = height - padTop - padBottom;

      // Color themes
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const isHighContrast = document.documentElement.getAttribute('data-high-contrast') === 'true';

      const gridColor = isHighContrast ? '#000000' : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)');
      const textColor = isHighContrast ? '#000000' : (isDark ? '#B7D1BE' : '#52705C');

      // Value scaling
      const values = data.map(d => d.value);
      const dataMin = Math.min(...values);
      const dataMax = Math.max(...values);
      const yMin = Math.floor(Math.min(cfg.yMin, dataMin));
      const yMax = Math.ceil(Math.max(cfg.yMax, dataMax));
      const yRange = yMax - yMin || 1;

      // 1. Draw Optimal Zone Band (if within range)
      if (cfg.optimal && cfg.optimal.length === 2) {
        const [optMin, optMax] = cfg.optimal;
        const optTopY = padTop + plotHeight - ((optMax - yMin) / yRange) * plotHeight;
        const optBottomY = padTop + plotHeight - ((optMin - yMin) / yRange) * plotHeight;
        const bandHeight = optBottomY - optTopY;

        ctx.fillStyle = isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.09)';
        ctx.fillRect(padLeft, optTopY, plotWidth, bandHeight);

        // Optimal label
        ctx.font = '10px sans-serif';
        ctx.fillStyle = isDark ? '#4ADE80' : '#15803D';
        ctx.textAlign = 'right';
        ctx.fillText(`Optimal (${optMin}-${optMax}${cfg.unit})`, width - padRight - 4, optTopY + 12);
      }

      // 2. Draw Y-Axis Grid Lines & Unit Labels
      const yTicks = 4;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = textColor;

      for (let i = 0; i <= yTicks; i++) {
        const tickVal = Math.round(yMin + (yRange / yTicks) * i);
        const y = padTop + plotHeight - (i / yTicks) * plotHeight;

        // Grid line
        ctx.beginPath();
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = isHighContrast ? 1.5 : 1;
        ctx.setLineDash(isHighContrast ? [] : [4, 4]);
        ctx.moveTo(padLeft, y);
        ctx.lineTo(width - padRight, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Unit label (e.g. "45%")
        ctx.fillText(`${tickVal}${cfg.unit}`, padLeft - 6, y);
      }

      // 3. Compute Coordinates for Data Points
      const points = data.map((d, index) => {
        const x = padLeft + (index / (data.length - 1)) * plotWidth;
        const y = padTop + plotHeight - ((d.value - yMin) / yRange) * plotHeight;
        return { x, y, data: d };
      });

      // 4. Draw Gradient Fill Under Curve
      const fillGradient = ctx.createLinearGradient(0, padTop, 0, padTop + plotHeight);
      fillGradient.addColorStop(0, `rgba(${cfg.rgba}, ${isDark ? 0.35 : 0.25})`);
      fillGradient.addColorStop(1, `rgba(${cfg.rgba}, 0.0)`);

      ctx.beginPath();
      ctx.moveTo(points[0].x, padTop + plotHeight);
      ctx.lineTo(points[0].x, points[0].y);

      // Smooth curve interpolation
      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.lineTo(points[points.length - 1].x, padTop + plotHeight);
      ctx.closePath();
      ctx.fillStyle = fillGradient;
      ctx.fill();

      // 5. Draw Curve Stroke Line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.strokeStyle = isHighContrast ? '#000000' : cfg.color;
      ctx.lineWidth = isHighContrast ? 3.5 : 2.5;
      ctx.stroke();

      // 6. Draw X-Axis Ticks (Timestamps)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = textColor;
      ctx.font = '10px sans-serif';

      const xStep = Math.max(1, Math.floor(points.length / 5));
      points.forEach((p, idx) => {
        if (idx % xStep === 0 || idx === points.length - 1) {
          ctx.fillText(p.data.time, p.x, padTop + plotHeight + 8);
        }
      });

      // 7. Render Active Hover Cursor Point
      if (this.activeHoverIndex !== null && points[this.activeHoverIndex]) {
        const activePt = points[this.activeHoverIndex];

        // Vertical dashed indicator
        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = cfg.color;
        ctx.lineWidth = 1.5;
        ctx.moveTo(activePt.x, padTop);
        ctx.lineTo(activePt.x, padTop + plotHeight);
        ctx.stroke();
        ctx.setLineDash([]);

        // Target point dot with pulse ring
        ctx.beginPath();
        ctx.arc(activePt.x, activePt.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = cfg.color;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Update accessibility ARIA label
      const latest = data[data.length - 1].value;
      this.canvas.setAttribute(
        'aria-label',
        `${cfg.label} telemetry chart. Current reading: ${latest}${cfg.unit}. Minimum: ${dataMin}${cfg.unit}, Maximum: ${dataMax}${cfg.unit}. Data source: SIMULATED — Virtual IoT.`
      );

      // Render Section 45 Screen Reader Accessible Data Table
      this._renderAccessibleTable(data, cfg);
    }

    /**
     * Compute statistics and update cards
     */
    _updateStats(data, cfg) {
      const values = data.map(d => d.value);
      const current = values[values.length - 1];
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;

      // Trend calculation
      const recent = values.slice(-4);
      const delta = recent[recent.length - 1] - recent[0];
      let trendText = '→ Stable';
      let trendClass = 'stat-trend-optimal';

      if (delta > 1.5) {
        trendText = `↑ Rising (+${delta.toFixed(1)}${cfg.unit})`;
        trendClass = 'stat-trend-rising';
      } else if (delta < -1.5) {
        trendText = `↓ Falling (${delta.toFixed(1)}${cfg.unit})`;
        trendClass = 'stat-trend-falling';
      }

      this.container.querySelector('#stat-current').textContent = current;
      this.container.querySelector('#stat-current-unit').textContent = cfg.unit;
      this.container.querySelector('#stat-min').textContent = min;
      this.container.querySelector('#stat-min-unit').textContent = cfg.unit;
      this.container.querySelector('#stat-max').textContent = max;
      this.container.querySelector('#stat-max-unit').textContent = cfg.unit;
      this.container.querySelector('#stat-avg').textContent = avg;
      this.container.querySelector('#stat-avg-unit').textContent = cfg.unit;

      const trendEl = this.container.querySelector('#stat-trend');
      trendEl.textContent = trendText;
      trendEl.className = trendClass;

      const now = new Date();
      this.container.querySelector('#chart-last-updated').textContent = `Last update: ${now.toLocaleTimeString()}`;
    }

    /**
     * Render screen-reader accessible HTML data table (Section 45 Standard)
     */
    _renderAccessibleTable(data, cfg) {
      let rows = '';
      data.forEach(d => {
        let status = 'Normal';
        if (cfg.optimal) {
          if (d.value < cfg.optimal[0]) status = 'Low / Stress Alert';
          else if (d.value > cfg.optimal[1]) status = 'High / Saturation Alert';
          else status = 'Optimal Agronomic Zone';
        }

        rows += `
          <tr>
            <td>${d.time}</td>
            <td><strong>${d.value} ${cfg.unit}</strong></td>
            <td>${status}</td>
            <td><span class="badge-virtual-iot" style="font-size: 0.65rem;">SIMULATED — Virtual IoT</span></td>
          </tr>
        `;
      });

      this.a11yContainer.innerHTML = `
        <table class="chart-a11y-table" summary="Detailed tabular representation of ${cfg.label} sensor telemetry over the past ${this.rangeKey}">
          <caption style="font-weight: bold; margin-bottom: 6px; text-align: left;">
            ${cfg.label} Telemetry Data Table (Source: SIMULATED — Virtual IoT)
          </caption>
          <thead>
            <tr>
              <th scope="col">Time</th>
              <th scope="col">Reading (${cfg.unit})</th>
              <th scope="col">Agronomic Status</th>
              <th scope="col">Source Label</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    }

    /**
     * Handle mouse or touch pointer on canvas
     */
    _handlePointer(e) {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const width = rect.width;
      const data = this.data;
      if (!data || data.length === 0) return;

      const padLeft = 45;
      const padRight = 20;
      const plotWidth = width - padLeft - padRight;

      const clampedX = Math.max(padLeft, Math.min(width - padRight, clientX));
      const ratio = (clampedX - padLeft) / plotWidth;
      const nearestIdx = Math.round(ratio * (data.length - 1));

      if (nearestIdx >= 0 && nearestIdx < data.length) {
        this.activeHoverIndex = nearestIdx;
        this.render();
        this._showTooltip(data[nearestIdx], clampedX);
      }
    }

    /**
     * Show floating tooltip
     */
    _showTooltip(point, x) {
      const cfg = METRIC_CONFIGS[this.metricKey];
      this.tooltip.innerHTML = `
        <div class="chart-tooltip-time">🕒 ${point.time}</div>
        <div class="chart-tooltip-value">${point.value} ${cfg.unit}</div>
        <div class="chart-tooltip-source">⚡ SIMULATED — Virtual IoT</div>
      `;
      this.tooltip.style.left = `${x}px`;
      this.tooltip.style.top = `60px`;
      this.tooltip.style.display = 'block';
    }

    /**
     * Hide floating tooltip
     */
    _hideTooltip() {
      this.activeHoverIndex = null;
      this.tooltip.style.display = 'none';
      this.render();
    }

    /**
     * Generate realistic simulated telemetry data points
     */
    _generateSampleData(metricKey, rangeKey) {
      const cfg = METRIC_CONFIGS[metricKey] || METRIC_CONFIGS.soil_moisture;
      let count = 12;
      let timeStepMinutes = 5;

      switch (rangeKey) {
        case '1h': count = 12; timeStepMinutes = 5; break;
        case '6h': count = 12; timeStepMinutes = 30; break;
        case '24h': count = 24; timeStepMinutes = 60; break;
        case '7d': count = 14; timeStepMinutes = 720; break;
        case '30d': count = 30; timeStepMinutes = 1440; break;
      }

      const points = [];
      const now = new Date();

      // Seed baseline around midpoint of optimal
      let currentVal = (cfg.optimal[0] + cfg.optimal[1]) / 2;

      for (let i = count - 1; i >= 0; i--) {
        const t = new Date(now.getTime() - i * timeStepMinutes * 60000);
        let timeStr = '';
        if (rangeKey === '7d' || rangeKey === '30d') {
          timeStr = `${t.getDate()} ${t.toLocaleString('default', { month: 'short' })}`;
        } else {
          timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // Random organic drift
        const delta = (Math.random() - 0.48) * (cfg.yMax - cfg.yMin) * 0.08;
        currentVal = Math.max(cfg.yMin, Math.min(cfg.yMax, currentVal + delta));

        points.push({
          time: timeStr,
          value: Math.round(currentVal * 10) / 10
        });
      }

      return points;
    }
  }

  // Export globally to window
  window.KrishiChart = KrishiChart;
  window.METRIC_CONFIGS = METRIC_CONFIGS;
})();
