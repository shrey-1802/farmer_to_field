/**
 * KrishiNirnay AI - Admin Panel & System Health Controller (Phase 26)
 * Implements Section 32: Admin Panel with authorization gate.
 * 
 * Required sections (shown only to authorized admin users):
 * - Manage Users
 * - Manage Farms
 * - Manage Fields
 * - Sensor Status
 * - System Logs
 * - Agent Activity
 * - System Settings
 * 
 * Also handles backend health diagnostics, API endpoint ping, and
 * real-time Render cold-start wake-up detection.
 */

import APP_CONFIG from './config.js';
import appShell from './ui.js';

// ─── Mock Data ─────────────────────────────────────────────────────────────

const ADMIN_USERS = [
  { id: 'USR-001', name: 'Ramesh Patel', mobile: '+91 98765 43210', role: 'FARMER_ADMIN', farm: 'Shanti Agro Farm', status: 'ACTIVE', joined: '2024-03-12' },
  { id: 'USR-002', name: 'Meena Patel', mobile: '+91 98765 43211', role: 'FARMER', farm: 'Shanti Agro Farm', status: 'ACTIVE', joined: '2024-03-12' },
  { id: 'USR-003', name: 'Suresh Yadav', mobile: '+91 90001 22334', role: 'FARMER', farm: 'Yadav Krishi Bhumi', status: 'INACTIVE', joined: '2024-07-01' },
  { id: 'USR-004', name: 'Admin Operator', mobile: '+91 80000 00001', role: 'SUPER_ADMIN', farm: 'All Farms', status: 'ACTIVE', joined: '2024-01-01' }
];

const ADMIN_FARMS = [
  { id: 'FARM-001', name: 'Shanti Agro Farm', owner: 'Ramesh Patel', district: 'Rajkot', state: 'Gujarat', acres: 12.0, fields: 3, sensors: 7, status: 'ACTIVE' },
  { id: 'FARM-002', name: 'Yadav Krishi Bhumi', owner: 'Suresh Yadav', district: 'Botad', state: 'Gujarat', acres: 8.5, fields: 2, sensors: 4, status: 'PENDING_SETUP' }
];

const ADMIN_FIELDS = [
  { id: 'FLD-001', farm: 'Shanti Agro Farm', name: 'North Cotton Basin', crop: 'BT Cotton', acres: 5.0, zones: 3, sensors: 4, status: 'ACTIVE' },
  { id: 'FLD-002', farm: 'Shanti Agro Farm', name: 'South Groundnut Terrace', crop: 'Groundnut GG-20', acres: 4.0, zones: 2, sensors: 2, status: 'ACTIVE' },
  { id: 'FLD-003', farm: 'Shanti Agro Farm', name: 'West Cumin Plot', crop: 'Cumin Jeera-4', acres: 3.0, zones: 1, sensors: 1, status: 'FALLOW_PREP' },
  { id: 'FLD-004', farm: 'Yadav Krishi Bhumi', name: 'East Paddy Field', crop: 'Paddy IR-36', acres: 5.0, zones: 2, sensors: 3, status: 'ACTIVE' }
];

const SENSOR_STATUS_DATA = [
  { id: 'VS-MOIST-101', type: 'Virtual', zone: 'Zone 2 East', reading: '38.4%', lastSeen: '10s ago', battery: '98%', status: 'ONLINE' },
  { id: 'VS-TEMP-102', type: 'Virtual', zone: 'Zone 1 North', reading: '28.2°C', lastSeen: '10s ago', battery: '95%', status: 'ONLINE' },
  { id: 'VS-HUMID-103', type: 'Virtual', zone: 'Zone 1 North', reading: '54%', lastSeen: '10s ago', battery: '92%', status: 'ONLINE' },
  { id: 'VS-NPK-106', type: 'Virtual', zone: 'Zone 2 East', reading: '148 mg/kg', lastSeen: '4m ago', battery: '14%', status: 'OFFLINE' },
  { id: 'PS-SOL-01', type: 'Physical', zone: 'Zone 2 Valve', reading: 'CLOSED', lastSeen: '2s ago', battery: 'Mains', status: 'ONLINE' },
  { id: 'PS-PUMP-01', type: 'Physical', zone: 'Pump House', reading: '7.5 HP', lastSeen: '2s ago', battery: 'Solar DC', status: 'ONLINE' },
  { id: 'PS-FLOW-02', type: 'Physical', zone: 'Manifold', reading: 'STALE', lastSeen: '18m ago', battery: 'LoRa Dead', status: 'ERROR' }
];

const SYSTEM_LOGS = [
  { ts: '2026-09-19 14:10:22', level: 'INFO', source: 'SensorWorker', msg: 'Generated 28 virtual IoT readings across 4 zones in 0.38s.' },
  { ts: '2026-09-19 14:08:05', level: 'INFO', source: 'IrrigationAgent', msg: 'Consensus reached: Drip cycle AP-1082 approved with 94.2% confidence.' },
  { ts: '2026-09-19 14:05:44', level: 'WARN', source: 'SensorWorker', msg: 'Sensor VS-NPK-106 reported stale reading. Battery at 14%.' },
  { ts: '2026-09-19 14:02:11', level: 'INFO', source: 'WeatherAgent', msg: 'Open-Meteo data refreshed. Next precipitation: 0.0mm for 72h.' },
  { ts: '2026-09-19 13:58:30', level: 'ERROR', source: 'PhysicalSensor', msg: 'PS-FLOW-02 LoRa packet timeout. Heartbeat missed for 18 minutes.' },
  { ts: '2026-09-19 13:55:12', level: 'INFO', source: 'RiskAgent', msg: 'WATER_STRESS risk RSK-WS-091 detected and dispatched for farmer review.' },
  { ts: '2026-09-19 13:50:00', level: 'INFO', source: 'Execution', msg: 'Irrigation job JOB-1082 started: Zone 2 East Sloped, 42,000L target.' },
  { ts: '2026-09-19 13:45:19', level: 'INFO', source: 'Auth', msg: 'Farmer Ramesh Patel (USR-001) authenticated via OTP from +91 98765 43210.' },
  { ts: '2026-09-19 13:40:00', level: 'WARN', source: 'RenderWakeUp', msg: 'Render cold-start detected. Backend awakened after 472ms.' },
  { ts: '2026-09-19 13:35:00', level: 'INFO', source: 'SimulationEngine', msg: 'Simulation reset to NORMAL baseline for farm FARM-001.' }
];

const AGENT_ACTIVITY = [
  { name: 'Irrigation Agent', id: 'AGT-IRR-01', status: 'ACTIVE', lastDecision: 'Approved 22mm drip cycle for Zone 2', cycles: 48, confidence: '94.2%', latency: '380ms' },
  { name: 'Pest & Disease Agent', id: 'AGT-DIS-02', status: 'MONITORING', lastDecision: 'Leaf spot risk at 12% — below threshold', cycles: 47, confidence: '88.7%', latency: '520ms' },
  { name: 'Nutrient Agent', id: 'AGT-NUT-03', status: 'ACTIVE', lastDecision: 'N deficit detected: drip fertigation recommended', cycles: 31, confidence: '91.4%', latency: '290ms' },
  { name: 'Weather Forecasting Agent', id: 'AGT-WTH-04', status: 'SYNCED', lastDecision: 'Zero rainfall for 72h — irrigation window clear', cycles: 24, confidence: '96.1%', latency: '140ms' },
  { name: 'Yield Prediction Agent', id: 'AGT-YLD-05', status: 'COMPUTED', lastDecision: 'Projected 12.8 Qtl/Acre (+14.2% vs benchmark)', cycles: 8, confidence: '87.3%', latency: '890ms' },
  { name: 'Market Advisory Agent', id: 'AGT-MKT-06', status: 'SYNCED', lastDecision: 'Cotton price bullish: ₹7,320/Q — hold 48h', cycles: 12, confidence: '79.8%', latency: '210ms' },
  { name: 'Expert Escalation Agent', id: 'AGT-EXP-07', status: 'STANDBY', lastDecision: 'No critical escalation required in last 24h', cycles: 3, confidence: '100%', latency: '0ms' },
  { name: 'Drone Analysis Agent', id: 'AGT-DRN-08', status: 'WAITING', lastDecision: 'NDVI 0.74 — next imagery scheduled Thursday', cycles: 2, confidence: '92.0%', latency: '1200ms' },
  { name: 'Risk Orchestrator Agent', id: 'AGT-RSK-09', status: 'ACTIVE', lastDecision: '3 risks resolved; 1 new critical dispatched', cycles: 64, confidence: '95.6%', latency: '220ms' }
];

const API_ENDPOINTS = [
  { module: 'Auth', method: 'POST', endpoint: '/api/auth/send-otp', desc: 'Generate & send 6-digit OTP to mobile', status: 'HEALTHY' },
  { module: 'Auth', method: 'POST', endpoint: '/api/auth/verify-otp', desc: 'Verify code and issue JWT session token', status: 'HEALTHY' },
  { module: 'Farms', method: 'GET', endpoint: '/api/farms', desc: 'Retrieve monitored farms and boundaries', status: 'HEALTHY' },
  { module: 'Fields', method: 'GET', endpoint: '/api/farms/{id}/fields', desc: 'Get all fields for a given farm', status: 'HEALTHY' },
  { module: 'Sensors', method: 'GET', endpoint: '/api/sensors/readings', desc: 'Virtual IoT telemetry stream', status: 'HEALTHY' },
  { module: 'Weather', method: 'GET', endpoint: '/api/weather/live', desc: 'Open-Meteo live observation & 7-day forecast', status: 'HEALTHY' },
  { module: 'AI Agents', method: 'GET', endpoint: '/api/agents/status', desc: 'Multi-agent decision and reasoning states', status: 'HEALTHY' },
  { module: 'Risks', method: 'GET', endpoint: '/api/risks', desc: 'Active agronomic risk detections', status: 'HEALTHY' },
  { module: 'Actions', method: 'POST', endpoint: '/api/actions/{id}/approve', desc: 'Authorize autonomous farm intervention', status: 'HEALTHY' },
  { module: 'Execution', method: 'POST', endpoint: '/api/execution/irrigation/start', desc: 'Trigger virtual drip irrigation job', status: 'HEALTHY' },
  { module: 'Simulation', method: 'POST', endpoint: '/api/simulation/water-stress', desc: 'Inject water stress scenario', status: 'HEALTHY' },
  { module: 'Simulation', method: 'GET', endpoint: '/api/simulation/status', desc: 'Get active simulation scenario status', status: 'HEALTHY' }
];

// ─── Authorization Gate ─────────────────────────────────────────────────────

function checkAdminAuth() {
  // Backend authorization is authoritative (Section 32).
  // Frontend gate: check local session role flag set at login.
  const role = localStorage.getItem('krishi_user_role') || 'FARMER_ADMIN'; // Demo default
  const adminRoles = ['FARMER_ADMIN', 'SUPER_ADMIN', 'ADMIN'];
  return adminRoles.includes(role);
}

// ─── Admin Panel Controller ─────────────────────────────────────────────────

class AdminPanel {
  constructor() {
    this.isAdmin = checkAdminAuth();
    this.backendStatus = 'CHECKING';
    this.pingStart = null;
    this.activeTab = 'health';
  }

  init() {
    this.renderAuthGate();
    if (this.isAdmin) {
      this.renderAllSections();
      this.bindTabNavigation();
      this.pingBackend();
      this.startLiveLogStream();
    }
  }

  renderAuthGate() {
    const gate = document.getElementById('admin-auth-gate');
    const content = document.getElementById('admin-authorized-content');

    if (!this.isAdmin) {
      if (gate) gate.style.display = 'flex';
      if (content) content.style.display = 'none';
    } else {
      if (gate) gate.style.display = 'none';
      if (content) content.style.display = 'block';
    }
  }

  renderAllSections() {
    this.renderHealthMetrics();
    this.renderManageUsers();
    this.renderManageFarms();
    this.renderManageFields();
    this.renderSensorStatus();
    this.renderSystemLogs();
    this.renderAgentActivity();
    this.renderApiEndpoints();
    this.renderSystemSettings();
  }

  // ── Tab Navigation ──────────────────────────────────────────────────────

  bindTabNavigation() {
    document.querySelectorAll('[data-admin-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-admin-tab');
        this.switchTab(tab);
      });
    });
  }

  switchTab(tab) {
    this.activeTab = tab;

    document.querySelectorAll('[data-admin-tab]').forEach(btn => {
      btn.classList.toggle('admin-tab-active', btn.getAttribute('data-admin-tab') === tab);
    });

    document.querySelectorAll('[data-admin-section]').forEach(sec => {
      const isVisible = sec.getAttribute('data-admin-section') === tab;
      sec.style.display = isVisible ? 'block' : 'none';
    });
  }

  // ── Health Diagnostics ──────────────────────────────────────────────────

  async pingBackend() {
    this.updatePingStatus('CHECKING', '—', '—');
    this.pingStart = performance.now();
    const pingBtn = document.getElementById('ping-backend-btn');
    if (pingBtn) pingBtn.disabled = true;

    try {
      const res = await fetch(`${APP_CONFIG.API_BASE_URL.replace('/api', '')}/`, {
        signal: AbortSignal.timeout(10000)
      });
      const latencyMs = Math.round(performance.now() - this.pingStart);
      const statusCode = res.status;

      if (statusCode >= 200 && statusCode < 300) {
        this.backendStatus = 'ONLINE';
        this.updatePingStatus('ONLINE', `${statusCode} OK`, `${latencyMs}ms`);
        appShell.showToast(`Backend online — ${latencyMs}ms response time`, 'success');
      } else {
        this.backendStatus = 'DEGRADED';
        this.updatePingStatus('DEGRADED', `${statusCode}`, `${latencyMs}ms`);
        appShell.showToast(`Backend responded with ${statusCode}`, 'warning');
      }
    } catch (err) {
      const latencyMs = Math.round(performance.now() - this.pingStart);
      this.backendStatus = 'OFFLINE';
      this.updatePingStatus('OFFLINE', 'Timeout / No Response', `${latencyMs}ms`);
      appShell.showToast('Backend unreachable — running on mock fallback', 'warning');
    }

    if (pingBtn) pingBtn.disabled = false;
  }

  updatePingStatus(status, httpStatus, latency) {
    const statusEl = document.getElementById('be-status-badge');
    const httpEl = document.getElementById('be-http-status');
    const latEl = document.getElementById('be-latency');
    const uptimeEl = document.getElementById('be-uptime-label');

    if (statusEl) {
      statusEl.textContent = status;
      statusEl.className = `badge ${status === 'ONLINE' ? 'badge-success' : status === 'DEGRADED' ? 'badge-warning' : 'badge-danger'}`;
    }
    if (httpEl) httpEl.textContent = httpStatus;
    if (latEl) latEl.textContent = latency;
    if (uptimeEl) {
      uptimeEl.textContent = status === 'ONLINE' ? 'Warm & Active' :
                              status === 'CHECKING' ? 'Pinging...' :
                              'Cold / Sleeping — Waking Up';
    }
  }

  renderHealthMetrics() {
    const ts = document.getElementById('health-timestamp');
    if (ts) ts.textContent = `Last checked: ${new Date().toLocaleTimeString()}`;
  }

  // ── Manage Users ────────────────────────────────────────────────────────

  renderManageUsers() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    tbody.innerHTML = ADMIN_USERS.map(u => {
      const roleBadge = u.role === 'SUPER_ADMIN' ? 'badge-danger' :
                        u.role === 'FARMER_ADMIN' ? 'badge-warning' : 'badge-success';
      const statusBadge = u.status === 'ACTIVE' ? 'badge-success' : 'badge-outline';

      return `
        <tr>
          <td>
            <div class="admin-cell-main">
              <span class="admin-user-avatar">${u.name.split(' ').map(n => n[0]).join('')}</span>
              <div>
                <strong>${u.name}</strong>
                <div class="admin-cell-sub">${u.mobile}</div>
              </div>
            </div>
          </td>
          <td><span class="badge ${roleBadge}">${u.role}</span></td>
          <td>${u.farm}</td>
          <td><span class="badge ${statusBadge}">${u.status}</span></td>
          <td class="admin-cell-sub">${u.joined}</td>
        </tr>
      `;
    }).join('');
  }

  // ── Manage Farms ────────────────────────────────────────────────────────

  renderManageFarms() {
    const tbody = document.getElementById('farms-table-body');
    if (!tbody) return;

    tbody.innerHTML = ADMIN_FARMS.map(f => {
      const badge = f.status === 'ACTIVE' ? 'badge-success' : 'badge-warning';
      return `
        <tr>
          <td>
            <strong>${f.name}</strong>
            <div class="admin-cell-sub">${f.id}</div>
          </td>
          <td>${f.owner}</td>
          <td>${f.district}, ${f.state}</td>
          <td>${f.acres} Acres</td>
          <td>${f.fields} / ${f.sensors}</td>
          <td><span class="badge ${badge}">${f.status}</span></td>
        </tr>
      `;
    }).join('');
  }

  // ── Manage Fields ───────────────────────────────────────────────────────

  renderManageFields() {
    const tbody = document.getElementById('fields-table-body');
    if (!tbody) return;

    tbody.innerHTML = ADMIN_FIELDS.map(f => {
      const badge = f.status === 'ACTIVE' ? 'badge-success' : 'badge-outline';
      return `
        <tr>
          <td>
            <strong>${f.name}</strong>
            <div class="admin-cell-sub">${f.id}</div>
          </td>
          <td>${f.farm}</td>
          <td>${f.crop}</td>
          <td>${f.acres}A / ${f.zones}Z</td>
          <td>${f.sensors}</td>
          <td><span class="badge ${badge}">${f.status}</span></td>
        </tr>
      `;
    }).join('');
  }

  // ── Sensor Status ───────────────────────────────────────────────────────

  renderSensorStatus() {
    const tbody = document.getElementById('sensors-status-body');
    if (!tbody) return;

    const online = SENSOR_STATUS_DATA.filter(s => s.status === 'ONLINE').length;
    const offline = SENSOR_STATUS_DATA.filter(s => s.status === 'OFFLINE').length;
    const error = SENSOR_STATUS_DATA.filter(s => s.status === 'ERROR').length;

    const summaryEl = document.getElementById('sensor-health-summary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <span class="badge badge-success">${online} Online</span>
        <span class="badge badge-danger">${offline} Offline</span>
        <span class="badge badge-warning">${error} Error</span>
      `;
    }

    tbody.innerHTML = SENSOR_STATUS_DATA.map(s => {
      const badge = s.status === 'ONLINE' ? 'badge-success' :
                    s.status === 'OFFLINE' ? 'badge-danger' : 'badge-warning';
      const typeBadge = s.type === 'Virtual' ? 'tag-virtual' : 'tag-physical';

      return `
        <tr>
          <td>
            <code class="sensor-code">${s.id}</code>
            <span class="device-type-tag ${typeBadge}">${s.type}</span>
          </td>
          <td>${s.zone}</td>
          <td><strong>${s.reading}</strong></td>
          <td><span class="admin-cell-sub">${s.lastSeen}</span></td>
          <td>${s.battery}</td>
          <td><span class="badge ${badge}">${s.status}</span></td>
        </tr>
      `;
    }).join('');
  }

  // ── System Logs ─────────────────────────────────────────────────────────

  renderSystemLogs(logs = SYSTEM_LOGS) {
    const container = document.getElementById('system-logs-feed');
    if (!container) return;

    container.innerHTML = logs.map(log => {
      const levelClass = log.level === 'ERROR' ? 'log-error' :
                          log.level === 'WARN' ? 'log-warn' : 'log-info';
      return `
        <div class="log-entry ${levelClass}">
          <span class="log-ts">${log.ts}</span>
          <span class="log-level">[${log.level}]</span>
          <span class="log-source">${log.source}:</span>
          <span class="log-msg">${log.msg}</span>
        </div>
      `;
    }).join('');
  }

  startLiveLogStream() {
    const liveIndicator = document.getElementById('log-live-indicator');
    if (liveIndicator) {
      setInterval(() => {
        const dot = liveIndicator.textContent === '●' ? '○' : '●';
        liveIndicator.textContent = dot;
      }, 800);
    }
  }

  // ── Agent Activity ──────────────────────────────────────────────────────

  renderAgentActivity() {
    const tbody = document.getElementById('agent-activity-body');
    if (!tbody) return;

    tbody.innerHTML = AGENT_ACTIVITY.map(ag => {
      const badge = ag.status === 'ACTIVE' ? 'badge-execution' :
                    ag.status === 'SYNCED' || ag.status === 'COMPUTED' ? 'badge-success' :
                    ag.status === 'MONITORING' ? 'badge-info' :
                    ag.status === 'STANDBY' ? 'badge-outline' : 'badge-warning';

      return `
        <tr>
          <td>
            <strong>${ag.name}</strong>
            <div class="admin-cell-sub">${ag.id}</div>
          </td>
          <td><span class="badge ${badge}">${ag.status}</span></td>
          <td class="admin-cell-decision">${ag.lastDecision}</td>
          <td>${ag.cycles}</td>
          <td><span class="confidence-val">${ag.confidence}</span></td>
          <td><code>${ag.latency}</code></td>
        </tr>
      `;
    }).join('');
  }

  // ── API Endpoints ───────────────────────────────────────────────────────

  renderApiEndpoints() {
    const tbody = document.getElementById('api-endpoints-body');
    if (!tbody) return;

    tbody.innerHTML = API_ENDPOINTS.map(ep => {
      const mClass = ep.method === 'GET' ? 'get' : ep.method === 'POST' ? 'post' : 'put';
      return `
        <tr>
          <td><strong>${ep.module}</strong></td>
          <td><span class="method-badge ${mClass}">${ep.method}</span></td>
          <td><code>${ep.endpoint}</code></td>
          <td>${ep.desc}</td>
          <td><span class="badge badge-success">${ep.status}</span></td>
        </tr>
      `;
    }).join('');
  }

  // ── System Settings ─────────────────────────────────────────────────────

  renderSystemSettings() {
    const versionEl = document.getElementById('system-version');
    if (versionEl) versionEl.textContent = APP_CONFIG.APP_VERSION || '1.0.0';

    const envEl = document.getElementById('system-env');
    if (envEl) {
      const env = APP_CONFIG.ENV || 'production';
      envEl.textContent = env.toUpperCase();
      envEl.className = `badge ${env === 'production' ? 'badge-success' : 'badge-warning'}`;
    }

    const apiUrlEl = document.getElementById('system-api-url');
    if (apiUrlEl) apiUrlEl.textContent = APP_CONFIG.API_BASE_URL;

    const simEl = document.getElementById('system-sim-mode');
    if (simEl) simEl.textContent = APP_CONFIG.ENABLE_VIRTUAL_IOT ? 'ON' : 'OFF';
  }
}

export const adminPanel = new AdminPanel();

document.addEventListener('DOMContentLoaded', () => {
  adminPanel.init();

  const pingBtn = document.getElementById('ping-backend-btn');
  if (pingBtn) {
    pingBtn.addEventListener('click', () => adminPanel.pingBackend());
  }

  // Log filter
  const logFilterInput = document.getElementById('log-filter-input');
  if (logFilterInput) {
    logFilterInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = SYSTEM_LOGS.filter(l =>
        l.msg.toLowerCase().includes(query) ||
        l.source.toLowerCase().includes(query) ||
        l.level.toLowerCase().includes(query)
      );
      adminPanel.renderSystemLogs(filtered);
    });
  }

  // Start on health tab
  adminPanel.switchTab('health');
});

export default adminPanel;
