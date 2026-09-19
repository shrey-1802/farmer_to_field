/**
 * KrishiNirnay AI - Field Task Execution Center Controller (Phase 18)
 * Implements Section 24: Execution Center.
 * 
 * Display Requirements:
 * - Ongoing Actions
 * - Completed Actions
 * - Failed Actions
 * - Virtual Device Status
 * - Manual Override
 * 
 * 6 Virtual Irrigation States:
 * - OFF
 * - STARTING
 * - RUNNING
 * - PAUSED
 * - COMPLETED
 * - FAILED
 * 
 * Mandatory Label:
 * - "VIRTUAL EXECUTION" until physical hardware is connected.
 * 
 * Execution Controls:
 * - Start (POST /api/execution/irrigation/start)
 * - Pause (POST /api/execution/irrigation/pause)
 * - Stop  (POST /api/execution/irrigation/stop)
 * - View Status (Modal with pressure, flow rate, volume, telemetry)
 */

import APP_CONFIG from './config.js';
import appShell from './ui.js';

export const EXECUTION_JOBS = [
  {
    id: 'JOB-1082',
    actionPlanId: 'AP-1082',
    title: 'Precision Drip Irrigation Cycle (Zone 2 East Sloped)',
    category: 'ONGOING',
    state: 'RUNNING', // OFF | STARTING | RUNNING | PAUSED | COMPLETED | FAILED
    targetZone: 'Zone 2: East Sloped (2.8 Acres)',
    targetValve: 'Solenoid Valve B',
    durationMinutes: 45,
    elapsedSeconds: 1100, // ~18m 20s
    totalLiters: 42000,
    dispatchedLiters: 17220,
    targetPressureBar: 1.8,
    currentPressureBar: 1.82,
    flowRateLpm: 933,
    pumpCurrentAmps: 11.4,
    startTime: 'Today at 09:30 AM',
    estimatedEndTime: 'Today at 10:15 AM',
    isVirtual: true,
    manualOverride: false
  },
  {
    id: 'JOB-1081',
    actionPlanId: 'AP-1081',
    title: 'Water-Soluble Fertigation Boost (NPK 19:19:19)',
    category: 'COMPLETED',
    state: 'COMPLETED',
    targetZone: 'Zone 1 & Zone 3 (6.0 Acres)',
    targetValve: 'Venturi Injector + Valve A & C',
    durationMinutes: 30,
    elapsedSeconds: 1800,
    totalLiters: 15000,
    dispatchedLiters: 15000,
    targetPressureBar: 2.0,
    currentPressureBar: 0.0,
    flowRateLpm: 0,
    pumpCurrentAmps: 0.0,
    startTime: 'Yesterday at 06:15 PM',
    estimatedEndTime: 'Yesterday at 06:45 PM',
    isVirtual: true,
    manualOverride: false,
    verificationLogged: true
  },
  {
    id: 'JOB-1078',
    actionPlanId: 'AP-1078',
    title: 'Sub-lateral Flush & Soil Salt Washout',
    category: 'COMPLETED',
    state: 'COMPLETED',
    targetZone: 'Zone 4: South Lowland (2.2 Acres)',
    targetValve: 'Solenoid Valve D',
    durationMinutes: 20,
    elapsedSeconds: 1200,
    totalLiters: 18000,
    dispatchedLiters: 18000,
    targetPressureBar: 1.6,
    currentPressureBar: 0.0,
    flowRateLpm: 0,
    pumpCurrentAmps: 0.0,
    startTime: 'Sept 14, 2026 at 07:00 AM',
    estimatedEndTime: 'Sept 14, 2026 at 07:20 AM',
    isVirtual: true,
    manualOverride: false,
    verificationLogged: true
  },
  {
    id: 'JOB-1072',
    actionPlanId: 'AP-1072',
    title: 'High-Pressure Dripline Emitter Purge',
    category: 'FAILED',
    state: 'FAILED',
    targetZone: 'Zone 2: East Sloped',
    targetValve: 'Solenoid Valve B',
    durationMinutes: 15,
    elapsedSeconds: 180, // Failed after 3m
    totalLiters: 12000,
    dispatchedLiters: 2400,
    targetPressureBar: 2.5,
    currentPressureBar: 2.78,
    flowRateLpm: 0,
    pumpCurrentAmps: 14.8,
    startTime: 'Sept 10, 2026 at 02:15 PM',
    estimatedEndTime: 'Aborted at 02:18 PM',
    failureReason: 'Safety pressure limit exceeded (2.78 bar > 2.50 bar threshold). Emergency automated shutoff engaged to prevent dripline rupture.',
    isVirtual: true,
    manualOverride: false
  }
];

export const VIRTUAL_DEVICES = [
  {
    id: 'PUMP-01',
    name: 'Main Submersible Borewell Pump (7.5 HP)',
    type: 'PUMP',
    status: 'RUNNING', // OFF | RUNNING | FAULT
    currentAmps: 11.4,
    voltage: 415,
    pressureBar: 2.8,
    flowLpm: 933,
    location: 'Central Pump Station'
  },
  {
    id: 'VALVE-A',
    name: 'Solenoid Valve A (Zone 1 North)',
    type: 'VALVE',
    status: 'OFF',
    pressureBar: 0.0,
    flowLpm: 0,
    location: 'Sub-Main Manifold 1'
  },
  {
    id: 'VALVE-B',
    name: 'Solenoid Valve B (Zone 2 East Sloped)',
    type: 'VALVE',
    status: 'RUNNING',
    pressureBar: 1.82,
    flowLpm: 933,
    location: 'Sub-Main Manifold 2'
  },
  {
    id: 'VALVE-C',
    name: 'Solenoid Valve C (Zone 3 Central)',
    type: 'VALVE',
    status: 'OFF',
    pressureBar: 0.0,
    flowLpm: 0,
    location: 'Sub-Main Manifold 3'
  },
  {
    id: 'VALVE-D',
    name: 'Solenoid Valve D (Zone 4 South)',
    type: 'VALVE',
    status: 'OFF',
    pressureBar: 0.0,
    flowLpm: 0,
    location: 'Sub-Main Manifold 4'
  }
];

class ExecutionController {
  constructor() {
    this.jobs = JSON.parse(JSON.stringify(EXECUTION_JOBS));
    this.devices = JSON.parse(JSON.stringify(VIRTUAL_DEVICES));
    this.activeFilter = 'ALL'; // 'ALL' | 'ONGOING' | 'COMPLETED' | 'FAILED'
    this.manualOverrideMode = false;
    this.timerInterval = null;
  }

  init() {
    // Parse query params (e.g. ?job=AP-1082&status=running)
    const params = new URLSearchParams(window.location.search);
    const jobParam = params.get('job');
    if (jobParam) {
      const existing = this.jobs.find(j => j.actionPlanId === jobParam || j.id === jobParam);
      if (existing) {
        existing.state = 'RUNNING';
        existing.category = 'ONGOING';
      }
    }

    this.render();
    this.startSimulationClock();
  }

  render() {
    this.renderActiveJobSection();
    this.renderJobsList();
    this.renderDeviceStatusGrid();
    this.renderManualOverrideSection();
    this.bindEvents();
  }

  renderActiveJobSection() {
    const container = document.querySelector('.active-execution-card');
    if (!container) return;

    const activeJob = this.jobs.find(j => j.state === 'RUNNING' || j.state === 'PAUSED' || j.state === 'STARTING');

    if (!activeJob) {
      container.innerHTML = `
        <div style="text-align: center; padding: var(--space-6);">
          <span style="font-size: 2.5rem;">⚡</span>
          <h3 style="margin-top: var(--space-2); color: var(--color-text-primary);">No Active Execution Job In Progress</h3>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: var(--space-1);">
            All scheduled valve runs and field tasks are idle. Approve an action plan to initiate execution.
          </p>
          <a href="./action-plans.html" class="btn btn-sm btn-primary" style="margin-top: var(--space-3);">Browse Action Plans →</a>
        </div>
      `;
      return;
    }

    const totalSeconds = activeJob.durationMinutes * 60;
    const remainingSeconds = Math.max(0, totalSeconds - activeJob.elapsedSeconds);
    const remMins = Math.floor(remainingSeconds / 60);
    const remSecs = remainingSeconds % 60;
    const countdownText = `${remMins}m ${remSecs < 10 ? '0' : ''}${remSecs}s`;

    const progressPct = Math.min(100, Math.round((activeJob.elapsedSeconds / totalSeconds) * 100));

    const stateBadge = activeJob.state === 'RUNNING' ? '<span class="badge badge-execution">RUNNING (CYCLE ACTIVE)</span>' :
                       activeJob.state === 'PAUSED' ? '<span class="badge badge-warning">PAUSED</span>' :
                       '<span class="badge badge-outline">STARTING...</span>';

    container.innerHTML = `
      <!-- Section 24: VIRTUAL EXECUTION Banner -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-3); margin-bottom: var(--space-2);">
        <div style="display: flex; align-items: center; gap: var(--space-2);">
          <span class="badge" style="background-color: #0D9488; color: #FFFFFF; font-weight: 800; letter-spacing: 0.05em; padding: 3px 10px; border-radius: var(--radius-full);">
            VIRTUAL EXECUTION
          </span>
          <span style="font-size: var(--font-size-xs); color: var(--color-text-muted);">Simulated Smart Actuator Hub</span>
        </div>
        ${stateBadge}
      </div>

      <div class="execution-header-row">
        <div class="execution-status-group">
          <span class="pulse-indicator ${activeJob.state === 'RUNNING' ? '' : 'paused'}"></span>
          <div>
            <h2 class="execution-title">${activeJob.title}</h2>
            <p class="execution-target">Target: <strong>${activeJob.targetZone}</strong> • Actuator: <strong>${activeJob.targetValve}</strong></p>
          </div>
        </div>
        <div class="execution-timer">
          <span class="timer-label">Time Remaining</span>
          <span class="timer-countdown" id="timer-countdown">${countdownText}</span>
        </div>
      </div>

      <div class="progress-container">
        <div class="progress-bar-wrapper">
          <div class="progress-bar-fill active-glow" id="progress-bar-fill" style="width: ${progressPct}%;"></div>
        </div>
        <div class="progress-stats-row">
          <span id="progress-pct-label">Progress: <strong>${progressPct}% complete</strong> (${Math.floor(activeJob.elapsedSeconds / 60)}m of ${activeJob.durationMinutes}m)</span>
          <span id="water-dispatched-label">Water Dispatched: <strong>${activeJob.dispatchedLiters.toLocaleString()} L of ${activeJob.totalLiters.toLocaleString()} L</strong> (${activeJob.flowRateLpm} L/min)</span>
        </div>
      </div>

      <!-- Section 24 Buttons: Start, Pause, Stop, View Status -->
      <div class="execution-controls" style="display: flex; gap: var(--space-2); flex-wrap: wrap; justify-content: flex-end;">
        <button type="button" class="btn btn-outline" id="btn-view-status" data-job-id="${activeJob.id}">
          🔍 View Live Status
        </button>
        ${activeJob.state === 'RUNNING' ? `
          <button type="button" class="btn btn-outline" id="btn-pause-execution" data-job-id="${activeJob.id}">
            ⏸ Pause Cycle
          </button>
        ` : `
          <button type="button" class="btn btn-primary" id="btn-start-execution" data-job-id="${activeJob.id}">
            ▶ Resume Cycle
          </button>
        `}
        <button type="button" class="btn btn-danger" id="btn-stop-execution" data-job-id="${activeJob.id}">
          🛑 Emergency Valve Stop
        </button>
      </div>
    `;
  }

  renderJobsList() {
    let section = document.getElementById('execution-jobs-section');
    if (!section) {
      section = document.createElement('section');
      section.id = 'execution-jobs-section';
      section.className = 'card';
      const container = document.querySelector('.active-execution-card');
      if (container && container.parentNode) {
        container.parentNode.insertBefore(section, container.nextSibling);
      }
    }

    const ongoing = this.jobs.filter(j => j.category === 'ONGOING');
    const completed = this.jobs.filter(j => j.category === 'COMPLETED');
    const failed = this.jobs.filter(j => j.category === 'FAILED');

    let filteredJobs = this.jobs;
    if (this.activeFilter === 'ONGOING') filteredJobs = ongoing;
    else if (this.activeFilter === 'COMPLETED') filteredJobs = completed;
    else if (this.activeFilter === 'FAILED') filteredJobs = failed;

    section.innerHTML = `
      <div class="card-header" style="flex-wrap: wrap; gap: var(--space-3);">
        <div>
          <h2 class="card-title">Field Task & Execution Directory</h2>
          <p class="card-subtitle">Manage Ongoing, Completed, and Failed autonomous agricultural tasks (Section 24)</p>
        </div>
        <div class="filter-tabs-wrapper" id="exec-filter-tabs">
          <button class="filter-tab ${this.activeFilter === 'ALL' ? 'active' : ''}" data-filter="ALL">
            All Tasks (${this.jobs.length})
          </button>
          <button class="filter-tab ${this.activeFilter === 'ONGOING' ? 'active' : ''}" data-filter="ONGOING">
            ⚡ Ongoing (${ongoing.length})
          </button>
          <button class="filter-tab ${this.activeFilter === 'COMPLETED' ? 'active' : ''}" data-filter="COMPLETED">
            ✓ Completed (${completed.length})
          </button>
          <button class="filter-tab ${this.activeFilter === 'FAILED' ? 'active' : ''}" data-filter="FAILED">
            ✕ Failed (${failed.length})
          </button>
        </div>
      </div>

      <div class="execution-table-wrapper" style="overflow-x: auto; margin-top: var(--space-4);">
        <table class="data-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th>Task / Job ID</th>
              <th>Action Title</th>
              <th>Target Location & Valve</th>
              <th>Irrigation State</th>
              <th>Water / Volume</th>
              <th>Dispatched Window</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${filteredJobs.map(job => {
              const stateBadge = this.getIrrigationStateBadge(job.state);
              return `
                <tr>
                  <td><strong>#${job.id}</strong><div style="font-size: 11px; color: var(--color-text-muted);">VIRTUAL</div></td>
                  <td><strong>${job.title}</strong></td>
                  <td>${job.targetZone}<div style="font-size: 11px; color: var(--color-text-secondary);">${job.targetValve}</div></td>
                  <td>${stateBadge}</td>
                  <td><strong>${job.dispatchedLiters.toLocaleString()} L</strong> / ${job.totalLiters.toLocaleString()} L</td>
                  <td style="font-size: 12px; color: var(--color-text-secondary);">${job.startTime}</td>
                  <td>
                    <button class="btn btn-sm btn-outline btn-job-status" data-job-id="${job.id}">View Status</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Bind filter tabs
    section.querySelectorAll('.filter-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.activeFilter = e.currentTarget.getAttribute('data-filter');
        this.renderJobsList();
      });
    });

    section.querySelectorAll('.btn-job-status').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const jobId = e.currentTarget.getAttribute('data-job-id');
        this.showJobStatusModal(jobId);
      });
    });
  }

  getIrrigationStateBadge(state) {
    switch (state) {
      case 'OFF':
        return '<span class="badge badge-outline">OFF</span>';
      case 'STARTING':
        return '<span class="badge badge-warning">STARTING...</span>';
      case 'RUNNING':
        return '<span class="badge badge-execution">RUNNING</span>';
      case 'PAUSED':
        return '<span class="badge badge-warning">PAUSED</span>';
      case 'COMPLETED':
        return '<span class="badge badge-success">COMPLETED ✓</span>';
      case 'FAILED':
        return '<span class="badge badge-danger">FAILED ✕</span>';
      default:
        return `<span class="badge">${state}</span>`;
    }
  }

  renderDeviceStatusGrid() {
    const grid = document.querySelector('.actuator-grid');
    if (!grid) return;

    grid.innerHTML = this.devices.map(d => {
      const isPump = d.type === 'PUMP';
      const isRunning = d.status === 'RUNNING';
      const cardClass = isPump && isRunning ? 'active-pump' :
                        isRunning ? 'active-valve' : '';
      const badge = isRunning ? (isPump ? '<span class="badge badge-execution">PUMP RUNNING</span>' : '<span class="badge badge-success">OPEN</span>') :
                                '<span class="badge badge-outline">CLOSED</span>';

      return `
        <article class="actuator-card ${cardClass}" id="device-${d.id}">
          <div class="actuator-card-header">
            <span class="actuator-icon">${isPump ? '⚙️' : '🚰'}</span>
            ${badge}
          </div>
          <h3 class="actuator-name">${d.name}</h3>
          <p class="actuator-meta">
            Pressure: <strong>${d.pressureBar.toFixed(2)} Bar</strong> • Flow: <strong>${d.flowLpm} L/min</strong>
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-2); font-size: 11px; color: var(--color-text-muted);">
            <span>Location: ${d.location}</span>
            <span class="source-tag source-simulated" style="font-size: 9px;">VIRTUAL</span>
          </div>
        </article>
      `;
    }).join('');
  }

  renderManualOverrideSection() {
    let overrideCard = document.getElementById('manual-override-card');
    if (!overrideCard) {
      overrideCard = document.createElement('section');
      overrideCard.id = 'manual-override-card';
      overrideCard.className = 'card';
      const actuatorCard = document.querySelector('.actuator-grid')?.closest('section');
      if (actuatorCard && actuatorCard.parentNode) {
        actuatorCard.parentNode.insertBefore(overrideCard, actuatorCard.nextSibling);
      }
    }

    overrideCard.innerHTML = `
      <div class="card-header" style="border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-3);">
        <div>
          <h2 class="card-title">Manual Override & Actuation Safety Interlock</h2>
          <p class="card-subtitle">Direct farmer supervisory override of autonomous AI valve schedules (Section 24)</p>
        </div>
        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <span style="font-size: var(--font-size-xs); font-weight: 700; color: ${this.manualOverrideMode ? 'var(--color-danger)' : 'var(--color-success)'};">
            ${this.manualOverrideMode ? '⚠️ MANUAL OVERRIDE ACTIVE' : '✓ AUTONOMOUS AI SUPERVISION'}
          </span>
          <button type="button" class="btn btn-sm ${this.manualOverrideMode ? 'btn-danger' : 'btn-outline'}" id="btn-toggle-override">
            ${this.manualOverrideMode ? 'Disengage Override' : 'Engage Manual Override'}
          </button>
        </div>
      </div>

      <div style="margin-top: var(--space-4); display: flex; gap: var(--space-4); flex-wrap: wrap;">
        <div style="flex: 1; min-width: 260px; background-color: var(--color-surface-soft); padding: var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          <h4 style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: var(--space-2);">Safety Guardrail Interlocks</h4>
          <ul style="font-size: var(--font-size-xs); color: var(--color-text-secondary); line-height: 1.6; margin: 0; padding-left: 1.2rem;">
            <li>Pressure relief valve trips automatically if line pressure exceeds <strong>2.2 Bar</strong>.</li>
            <li>Thermal cut-off halts pumping if motor winding temperature crosses <strong>75°C</strong>.</li>
            <li>Browser JavaScript communicates only through authenticated backend command APIs.</li>
          </ul>
        </div>
        <div style="flex: 1; min-width: 260px; background-color: var(--color-surface-soft); padding: var(--space-4); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          <h4 style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: var(--space-2);">Direct Hardware Isolation</h4>
          <p style="font-size: var(--font-size-xs); color: var(--color-text-secondary); line-height: 1.6; margin: 0;">
            All actuations remain labeled <strong>VIRTUAL EXECUTION</strong> in production simulation mode until physical RS485/Modbus hardware relays are commissioned on site.
          </p>
        </div>
      </div>
    `;

    overrideCard.querySelector('#btn-toggle-override')?.addEventListener('click', () => {
      this.toggleManualOverride();
    });
  }

  bindEvents() {
    // Start / Resume
    document.getElementById('btn-start-execution')?.addEventListener('click', async (e) => {
      const jobId = e.currentTarget.getAttribute('data-job-id');
      await this.handleStart(jobId);
    });

    // Pause
    document.getElementById('btn-pause-execution')?.addEventListener('click', async (e) => {
      const jobId = e.currentTarget.getAttribute('data-job-id');
      await this.handlePause(jobId);
    });

    // Stop
    document.getElementById('btn-stop-execution')?.addEventListener('click', async (e) => {
      const jobId = e.currentTarget.getAttribute('data-job-id');
      await this.handleStop(jobId);
    });

    // View Status
    document.getElementById('btn-view-status')?.addEventListener('click', (e) => {
      const jobId = e.currentTarget.getAttribute('data-job-id');
      this.showJobStatusModal(jobId);
    });
  }

  async handleStart(jobId) {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job) return;

    try {
      await fetch(`${APP_CONFIG.api.baseUrl}/execution/irrigation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, valve: job.targetValve })
      }).catch(() => null);
    } catch (_) {}

    job.state = 'RUNNING';
    job.category = 'ONGOING';
    this.updateDeviceStatesForJob(job, true);
    appShell.showToast(`Irrigation cycle started for ${job.targetZone} (Valve Open).`, 'success', 3000);
    this.render();
  }

  async handlePause(jobId) {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job) return;

    try {
      await fetch(`${APP_CONFIG.api.baseUrl}/execution/irrigation/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      }).catch(() => null);
    } catch (_) {}

    job.state = 'PAUSED';
    this.updateDeviceStatesForJob(job, false);
    appShell.showToast(`Irrigation cycle paused for ${job.targetZone}.`, 'info', 3000);
    this.render();
  }

  async handleStop(jobId) {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job) return;

    if (!confirm('Emergency Shutoff: Are you sure you want to shut off all valves immediately?')) {
      return;
    }

    try {
      await fetch(`${APP_CONFIG.api.baseUrl}/execution/irrigation/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, reason: 'Farmer emergency stop' })
      }).catch(() => null);
    } catch (_) {}

    job.state = 'OFF';
    this.updateDeviceStatesForJob(job, false);
    appShell.showToast(`Emergency valve stop executed! All solenoid valves CLOSED.`, 'danger', 4000);
    this.render();
  }

  updateDeviceStatesForJob(job, isActive) {
    const valve = this.devices.find(d => d.name.includes(job.targetValve) || d.id === 'VALVE-B');
    const pump = this.devices.find(d => d.type === 'PUMP');

    if (valve) {
      valve.status = isActive ? 'RUNNING' : 'OFF';
      valve.pressureBar = isActive ? job.targetPressureBar : 0.0;
      valve.flowLpm = isActive ? job.flowRateLpm : 0;
    }
    if (pump) {
      pump.status = isActive ? 'RUNNING' : 'OFF';
      pump.pressureBar = isActive ? 2.8 : 0.0;
      pump.flowLpm = isActive ? job.flowRateLpm : 0;
      pump.currentAmps = isActive ? 11.4 : 0.0;
    }
  }

  toggleManualOverride() {
    this.manualOverrideMode = !this.manualOverrideMode;
    const msg = this.manualOverrideMode ?
      'Manual Override ENGAGED: Autonomous agent decisions paused for manual supervisory control.' :
      'Manual Override DISENGAGED: Autonomous agent closed-loop optimization restored.';
    appShell.showToast(msg, this.manualOverrideMode ? 'warning' : 'success', 3500);
    this.renderManualOverrideSection();
  }

  startSimulationClock() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      const activeJob = this.jobs.find(j => j.state === 'RUNNING');
      if (!activeJob) return;

      const totalSeconds = activeJob.durationMinutes * 60;
      if (activeJob.elapsedSeconds < totalSeconds) {
        activeJob.elapsedSeconds += 1;
        // Increment water volume dispatched proportionately
        activeJob.dispatchedLiters = Math.min(
          activeJob.totalLiters,
          Math.round((activeJob.elapsedSeconds / totalSeconds) * activeJob.totalLiters)
        );

        // Update DOM elements without full re-render
        const countdownEl = document.getElementById('timer-countdown');
        const progressBar = document.getElementById('progress-bar-fill');
        const progressPctLabel = document.getElementById('progress-pct-label');
        const waterLabel = document.getElementById('water-dispatched-label');

        const remainingSeconds = Math.max(0, totalSeconds - activeJob.elapsedSeconds);
        const remMins = Math.floor(remainingSeconds / 60);
        const remSecs = remainingSeconds % 60;
        const countdownText = `${remMins}m ${remSecs < 10 ? '0' : ''}${remSecs}s`;
        const pct = Math.min(100, Math.round((activeJob.elapsedSeconds / totalSeconds) * 100));

        if (countdownEl) countdownEl.textContent = countdownText;
        if (progressBar) progressBar.style.width = `${pct}%`;
        if (progressPctLabel) {
          progressPctLabel.innerHTML = `Progress: <strong>${pct}% complete</strong> (${Math.floor(activeJob.elapsedSeconds / 60)}m of ${activeJob.durationMinutes}m)`;
        }
        if (waterLabel) {
          waterLabel.innerHTML = `Water Dispatched: <strong>${activeJob.dispatchedLiters.toLocaleString()} L of ${activeJob.totalLiters.toLocaleString()} L</strong> (${activeJob.flowRateLpm} L/min)`;
        }
      } else {
        // Completed
        activeJob.state = 'COMPLETED';
        activeJob.category = 'COMPLETED';
        this.updateDeviceStatesForJob(activeJob, false);
        appShell.showToast(`Irrigation job #${activeJob.id} completed! Initiating closed-loop reassessment.`, 'success', 4000);
        this.render();
      }
    }, 1000);
  }

  showJobStatusModal(jobId) {
    const job = this.jobs.find(j => j.id === jobId);
    if (!job) return;

    let modal = document.getElementById('exec-status-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'exec-status-modal';
      modal.className = 'modal-backdrop';
      modal.style.display = 'none';
      modal.setAttribute('role', 'dialog');
      modal.innerHTML = `
        <div class="modal-dialog" style="max-width: 600px; background: var(--color-card-bg); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-6); box-shadow: var(--shadow-xl); position: relative; margin: 6vh auto; max-height: 85vh; overflow-y: auto;">
          <button type="button" class="modal-close-btn" id="exec-modal-close-x" style="position: absolute; top: var(--space-4); right: var(--space-4); background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--color-text-muted);">✕</button>
          <div id="exec-modal-slot"></div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#exec-modal-close-x').addEventListener('click', () => {
        modal.style.display = 'none';
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
      });
    }

    const slot = modal.querySelector('#exec-modal-slot');
    slot.innerHTML = `
      <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
        <span style="font-family: monospace; font-weight: 800;">#${job.id}</span>
        ${this.getIrrigationStateBadge(job.state)}
        <span class="badge" style="background-color: #0D9488; color: #FFFFFF;">VIRTUAL EXECUTION</span>
      </div>

      <h3 style="font-size: var(--font-size-lg); font-weight: 800; color: var(--color-text-primary); margin-bottom: var(--space-3);">${job.title}</h3>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); margin-bottom: var(--space-4);">
        <div style="background: var(--color-surface-soft); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          <div style="font-size: 10px; text-transform: uppercase; color: var(--color-text-muted); font-weight: 700;">Target Zone</div>
          <div style="font-size: var(--font-size-sm); font-weight: 700; color: var(--color-text-primary); margin-top: 2px;">${job.targetZone}</div>
        </div>
        <div style="background: var(--color-surface-soft); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          <div style="font-size: 10px; text-transform: uppercase; color: var(--color-text-muted); font-weight: 700;">Target Actuator</div>
          <div style="font-size: var(--font-size-sm); font-weight: 700; color: var(--color-text-primary); margin-top: 2px;">${job.targetValve}</div>
        </div>
        <div style="background: var(--color-surface-soft); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          <div style="font-size: 10px; text-transform: uppercase; color: var(--color-text-muted); font-weight: 700;">Line Pressure</div>
          <div style="font-size: var(--font-size-sm); font-weight: 700; color: var(--color-primary-700); margin-top: 2px;">${job.currentPressureBar} Bar (Target: ${job.targetPressureBar} Bar)</div>
        </div>
        <div style="background: var(--color-surface-soft); padding: var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
          <div style="font-size: 10px; text-transform: uppercase; color: var(--color-text-muted); font-weight: 700;">Flow Rate & Delivery</div>
          <div style="font-size: var(--font-size-sm); font-weight: 700; color: var(--color-success); margin-top: 2px;">${job.flowRateLpm} L/min • ${job.dispatchedLiters.toLocaleString()} L</div>
        </div>
      </div>

      ${job.failureReason ? `
        <div style="background-color: rgba(239, 68, 68, 0.08); border: 1px solid #EF4444; border-radius: var(--radius-md); padding: var(--space-3); margin-bottom: var(--space-4);">
          <strong style="font-size: var(--font-size-xs); color: var(--color-danger);">Failure Diagnostic Incident:</strong>
          <p style="font-size: var(--font-size-xs); color: var(--color-danger); margin: var(--space-1) 0 0 0;">${job.failureReason}</p>
        </div>
      ` : ''}

      <div style="display: flex; justify-content: flex-end; gap: var(--space-2); margin-top: var(--space-4);">
        <button type="button" class="btn btn-outline" id="exec-modal-close-btn">Close</button>
      </div>
    `;

    slot.querySelector('#exec-modal-close-btn')?.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    modal.style.display = 'block';
  }
}

export const executionController = new ExecutionController();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => executionController.init());
} else {
  executionController.init();
}

export default executionController;
