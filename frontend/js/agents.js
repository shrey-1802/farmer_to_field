/**
 * KrishiNirnay AI - Autonomous AI Agents Controller (Phase 12)
 * Implements Section 18: AI Agents Overview & Monitoring Center.
 * 
 * Manages all 9 Autonomous AI Agents:
 * 1. Soil Agent
 * 2. Weather Agent
 * 3. Irrigation Agent
 * 4. Nutrient Agent
 * 5. Drone/Disease Agent
 * 6. Market Agent
 * 7. Risk Detection Agent
 * 8. Farm Context Agent
 * 9. Master Orchestrator
 * 
 * Complies with Section 18 Statuses: IDLE, RUNNING, COMPLETED, WARNING, FAILED.
 * Enforces prominent Section 3 "AI GENERATED" / "MODEL" labeling.
 */

import APP_CONFIG from './config.js';
import appShell from './ui.js';

export const INITIAL_AGENTS = [
  {
    id: 'soil',
    name: 'Soil Dynamics Agent',
    shortName: 'Soil Agent',
    icon: '🪨',
    domain: 'Infiltration, Compaction & Horizon Balance',
    model: 'Hydrological Darcy-Richards Soil Moisture Engine',
    status: 'COMPLETED',
    lastRun: '4m ago',
    lastRunTimestamp: Date.now() - 4 * 60 * 1000,
    currentRisk: 'Zone 2 Upper Horizon Moisture Deficit (-1.4%/hr)',
    riskLevel: 'warning',
    confidence: 96.4,
    latestRecommendation: 'Initiate sub-surface irrigation on Zone 2 to restore root zone capillary water before MAD threshold.',
    source: 'AI GENERATED',
    detailsUrl: 'agent-details.html?agent=soil',
    metrics: {
      'Soil Saturation': '34.2%',
      'Infiltration': '18 mm/hr',
      'Horizon Status': 'Capillary Deficit'
    }
  },
  {
    id: 'weather',
    name: 'Weather Risk Agent',
    shortName: 'Weather Agent',
    icon: '🌦️',
    domain: 'Microclimate & ET₀ Demand Synthesizer',
    model: 'Multi-Ensemble Open-Meteo & ECMWF Micro-Forecast',
    status: 'COMPLETED',
    lastRun: '8m ago',
    lastRunTimestamp: Date.now() - 8 * 60 * 1000,
    currentRisk: 'Zero precipitation next 48h; Afternoon heat index peak 34°C',
    riskLevel: 'safe',
    confidence: 97.2,
    latestRecommendation: 'Shift irrigation cycles to post-17:30 to avoid 28% midday solar evaporative loss.',
    source: 'AI GENERATED',
    detailsUrl: 'agent-details.html?agent=weather',
    metrics: {
      'Forecast ET₀': '5.4 mm/day',
      'Rainfall Prob.': '5% (Minimal)',
      'Solar Radiation': '880 W/m²'
    }
  },
  {
    id: 'irrigation',
    name: 'Irrigation Advisory Agent',
    shortName: 'Irrigation Agent',
    icon: '💧',
    domain: 'Evapo-Transpiration & Moisture Balancing',
    model: 'FAO-56 Penman-Monteith Evapo-Transpiration Balancer',
    status: 'WARNING',
    lastRun: '12m ago',
    lastRunTimestamp: Date.now() - 12 * 60 * 1000,
    currentRisk: 'Critical Root Zone Water Stress in Cotton Block (Zone 2 - 24.1%)',
    riskLevel: 'danger',
    confidence: 94.8,
    latestRecommendation: 'Execute 45-min pressurized drip pulse on Valve Line B (estimated volume 18,200 L).',
    source: 'AI GENERATED',
    detailsUrl: 'agent-details.html?agent=irrigation',
    metrics: {
      'Depletion MAD': '48.2%',
      'Recommended Run': '45 Mins',
      'Volume Required': '18.2 kL'
    }
  },
  {
    id: 'nutrient',
    name: 'Fertigation & Nutrient Agent',
    shortName: 'Nutrient Agent',
    icon: '🌱',
    domain: 'Phenology NPK Uptake Optimizer',
    model: 'Phenological Crop Stage NPK Depletion Curve Model',
    status: 'COMPLETED',
    lastRun: '25m ago',
    lastRunTimestamp: Date.now() - 25 * 60 * 1000,
    currentRisk: 'Nitrogen uptake steady; Micronutrient Zinc mildly suppressed',
    riskLevel: 'safe',
    confidence: 92.3,
    latestRecommendation: 'Plan 19:19:19 soluble NPK fertigation injection with next scheduled irrigation cycle.',
    source: 'AI GENERATED',
    detailsUrl: 'agent-details.html?agent=nutrient',
    metrics: {
      'Available N': '135 kg/ha',
      'Soil EC': '1.2 dS/m',
      'Uptake Index': 'Normal'
    }
  },
  {
    id: 'drone',
    name: 'Drone & Disease Agent',
    shortName: 'Drone/Disease Agent',
    icon: '🔬',
    domain: 'Multispectral NDVI & Pathogen Classifier',
    model: 'Multispectral NDVI & Fungal Spore Microclimate Classifier',
    status: 'COMPLETED',
    lastRun: '42m ago',
    lastRunTimestamp: Date.now() - 42 * 60 * 1000,
    currentRisk: 'Fungal Spore Germination Index: Low (14%) across North Canopy',
    riskLevel: 'safe',
    confidence: 98.1,
    latestRecommendation: 'No chemical fungicide required. Next automated multispectral scan scheduled in 48h.',
    source: 'MODEL',
    detailsUrl: 'agent-details.html?agent=drone',
    metrics: {
      'Mean NDVI': '0.74 (Healthy)',
      'Leaf Wetness': '2.1 hrs',
      'Pathogen Risk': '14% (Low)'
    }
  },
  {
    id: 'market',
    name: 'Market & Mandi Agent',
    shortName: 'Market Agent',
    icon: '⚖️',
    domain: 'APMC Mandi Price Trend & Demand Forecaster',
    model: 'APMC Mandi Price Forecasting & Harvest Optimization Model',
    status: 'IDLE',
    lastRun: '1h ago',
    lastRunTimestamp: Date.now() - 60 * 60 * 1000,
    currentRisk: 'Seasonal arrival volume spike anticipated in 10-14 days',
    riskLevel: 'safe',
    confidence: 89.5,
    latestRecommendation: 'Target harvest window between Sept 28–Oct 02 for Rajkot APMC premium rates (₹7,420/Q).',
    source: 'AI GENERATED',
    detailsUrl: 'agent-details.html?agent=market',
    metrics: {
      'Rajkot APMC': '₹7,420/Q',
      'Weekly Trend': '▲ +3.2%',
      'Arrival Volume': 'Moderate'
    }
  },
  {
    id: 'risk',
    name: 'Risk Detection Agent',
    shortName: 'Risk Detection Agent',
    icon: '⚠️',
    domain: 'Cross-Domain Anomaly Synthesis',
    model: 'Multi-Hazard Anomaly Correlator & Escalation Engine',
    status: 'WARNING',
    lastRun: '2m ago',
    lastRunTimestamp: Date.now() - 2 * 60 * 1000,
    currentRisk: 'High Priority: Combined Water Stress + Thermal Peak in Zone 2',
    riskLevel: 'danger',
    confidence: 95.6,
    latestRecommendation: 'Dispatched Emergency Action Alert #ACT-2026-0919 to Farmer Dashboard for 1-click approval.',
    source: 'AI GENERATED',
    detailsUrl: 'agent-details.html?agent=risk',
    metrics: {
      'Severity': 'High (82/100)',
      'Affected Zone': 'Zone 2 (Field 1)',
      'Action State': 'Alert Dispatched'
    }
  },
  {
    id: 'farm_context',
    name: 'Farm Context Agent',
    shortName: 'Farm Context Agent',
    icon: '🏡',
    domain: 'Agronomic Knowledge Graph & Baseline Engine',
    model: 'Agronomic Knowledge Graph & Phenology Calibrator',
    status: 'COMPLETED',
    lastRun: '15m ago',
    lastRunTimestamp: Date.now() - 15 * 60 * 1000,
    currentRisk: 'Flowering / Boll Formation Stage requires tight soil moisture buffer',
    riskLevel: 'safe',
    confidence: 99.0,
    latestRecommendation: 'Maintain soil moisture strictly above 30% MAD threshold during flowering phase to avert square dropping.',
    source: 'AI GENERATED',
    detailsUrl: 'agent-details.html?agent=farm_context',
    metrics: {
      'Crop Stage': 'Flowering (Day 54)',
      'Cultivar': 'Bt Cotton (G-Cot 20)',
      'Soil Series': 'Medium Black Calcareous'
    }
  },
  {
    id: 'orchestrator',
    name: 'Master Orchestrator',
    shortName: 'Orchestrator',
    icon: '🧠',
    domain: 'Autonomous Consensus & Multi-Agent Planning',
    model: 'Hierarchical Task Network & Conflict-Free Action Planner',
    status: 'RUNNING',
    lastRun: 'Live (every 10s)',
    lastRunTimestamp: Date.now(),
    currentRisk: '1 Action Plan awaiting farmer authorization (Water Stress)',
    riskLevel: 'warning',
    confidence: 96.9,
    latestRecommendation: 'Synthesized multi-agent inputs into Unified Action Plan #AP-418 (Zone 2 Drip Irrigation).',
    source: 'AI GENERATED',
    detailsUrl: 'agent-details.html?agent=orchestrator',
    metrics: {
      'Consensus Cycle': 'Active (#1,492)',
      'Active Agents': '9/9 Coordinated',
      'Action Queue': '1 Pending Approval'
    }
  }
];

class AgentsController {
  constructor() {
    this.agents = JSON.parse(JSON.stringify(INITIAL_AGENTS));
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.pollInterval = null;
    this.isCascading = false;
  }

  init() {
    this.renderOrchestratorBanner();
    this.renderSummaryKPIs();
    this.renderFilterTabs();
    this.renderGrid();
    this.bindEvents();
    this.startPolling();
    this.fetchBackendAgents();
  }

  /**
   * Bind event listeners for search, filter, and coordinated actions
   */
  bindEvents() {
    const searchInput = document.getElementById('agent-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderGrid();
      });
    }

    const runAllBtn = document.getElementById('run-all-agents-btn');
    if (runAllBtn) {
      runAllBtn.addEventListener('click', () => {
        this.runAllAgentsCascade();
      });
    }

    const refreshBtn = document.getElementById('refresh-agents-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.fetchBackendAgents(true);
      });
    }
  }

  /**
   * Filter tabs setup and count badges
   */
  renderFilterTabs() {
    const filterContainer = document.getElementById('agent-filter-tabs');
    if (!filterContainer) return;

    const counts = {
      all: this.agents.length,
      running: this.agents.filter(a => a.status === 'RUNNING').length,
      warning: this.agents.filter(a => a.status === 'WARNING').length,
      completed: this.agents.filter(a => a.status === 'COMPLETED').length,
      idle: this.agents.filter(a => a.status === 'IDLE').length,
    };

    filterContainer.innerHTML = `
      <button class="filter-tab ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">
        All Agents <span class="tab-count">${counts.all}</span>
      </button>
      <button class="filter-tab ${this.activeFilter === 'running' ? 'active' : ''}" data-filter="running">
        Running <span class="tab-count badge-running-count">${counts.running}</span>
      </button>
      <button class="filter-tab ${this.activeFilter === 'warning' ? 'active' : ''}" data-filter="warning">
        Warnings & Actions <span class="tab-count badge-warning-count">${counts.warning}</span>
      </button>
      <button class="filter-tab ${this.activeFilter === 'completed' ? 'active' : ''}" data-filter="completed">
        Completed <span class="tab-count">${counts.completed}</span>
      </button>
      <button class="filter-tab ${this.activeFilter === 'idle' ? 'active' : ''}" data-filter="idle">
        Idle <span class="tab-count">${counts.idle}</span>
      </button>
    `;

    filterContainer.querySelectorAll('.filter-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.currentTarget.getAttribute('data-filter');
        this.activeFilter = filter;
        this.renderFilterTabs();
        this.renderGrid();
      });
    });
  }

  /**
   * Orchestrator Master Banner
   */
  renderOrchestratorBanner() {
    const bannerEl = document.getElementById('orchestrator-banner-content');
    if (!bannerEl) return;

    const orchestrator = this.agents.find(a => a.id === 'orchestrator');
    if (!orchestrator) return;

    bannerEl.innerHTML = `
      <div class="orchestrator-banner-left">
        <div class="orchestrator-pulse-icon">
          <span class="pulse-ring"></span>
          <span class="pulse-core">🧠</span>
        </div>
        <div>
          <div class="orchestrator-headline">
            <h2>Autonomous Multi-Agent Consensus Engine</h2>
            <span class="badge badge-running">Active Consensus</span>
            <span class="source-tag source-ai">AI GENERATED</span>
          </div>
          <p class="orchestrator-desc">
            Continuous synthesis across all 9 specialized domain agents. Resolves cross-agent constraints (e.g. soil moisture vs weather rainfall forecast) into unified, verifiable field execution plans.
          </p>
          <div class="orchestrator-meta-row">
            <span class="meta-item"><strong id="orch-cycle-count">#1,492</strong> Consensus Cycle</span>
            <span class="meta-sep">•</span>
            <span class="meta-item">Cycle Interval: <strong>10s Heartbeat</strong></span>
            <span class="meta-sep">•</span>
            <span class="meta-item">Active Pipeline: <strong>9/9 Agents Online</strong></span>
            <span class="meta-sep">•</span>
            <span class="meta-item">Pending Authorization: <strong class="text-warning">1 Action Plan</strong></span>
          </div>
        </div>
      </div>
      <div class="orchestrator-banner-actions">
        <button id="run-all-agents-btn" class="btn btn-primary btn-run-all" ${this.isCascading ? 'disabled' : ''}>
          <span class="btn-icon">⚡</span>
          <span>Run All 9 Agents (Consensus)</span>
        </button>
        <button id="refresh-agents-btn" class="btn btn-outline btn-icon-only" title="Sync with Backend" aria-label="Sync with Backend">
          🔄
        </button>
      </div>
    `;

    // Re-bind run-all button inside dynamic banner
    const runAllBtn = bannerEl.querySelector('#run-all-agents-btn');
    if (runAllBtn) {
      runAllBtn.addEventListener('click', () => this.runAllAgentsCascade());
    }
    const refreshBtn = bannerEl.querySelector('#refresh-agents-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.fetchBackendAgents(true));
    }
  }

  /**
   * Top KPI Summary Strip
   */
  renderSummaryKPIs() {
    const kpiEl = document.getElementById('agents-kpi-strip');
    if (!kpiEl) return;

    const total = this.agents.length;
    const running = this.agents.filter(a => a.status === 'RUNNING').length;
    const warnings = this.agents.filter(a => a.status === 'WARNING').length;
    const avgConfidence = (this.agents.reduce((acc, a) => acc + a.confidence, 0) / total).toFixed(1);

    kpiEl.innerHTML = `
      <div class="kpi-mini-card">
        <span class="kpi-mini-label">Total AI Agents</span>
        <span class="kpi-mini-value">${total}</span>
        <span class="kpi-mini-sub text-success">100% Operational</span>
      </div>
      <div class="kpi-mini-card">
        <span class="kpi-mini-label">Active / Running</span>
        <span class="kpi-mini-value text-primary">${running}</span>
        <span class="kpi-mini-sub">Real-time Polling</span>
      </div>
      <div class="kpi-mini-card">
        <span class="kpi-mini-label">Action / Warnings</span>
        <span class="kpi-mini-value text-warning">${warnings}</span>
        <span class="kpi-mini-sub">Attention Required</span>
      </div>
      <div class="kpi-mini-card">
        <span class="kpi-mini-label">Mean Confidence</span>
        <span class="kpi-mini-value">${avgConfidence}%</span>
        <span class="kpi-mini-sub text-success">High Reliability</span>
      </div>
    `;
  }

  /**
   * Render the Agents Grid based on active filter and search query
   */
  renderGrid() {
    const gridEl = document.getElementById('agents-grid');
    if (!gridEl) return;

    const filtered = this.agents.filter(agent => {
      // Filter tab logic
      if (this.activeFilter === 'running' && agent.status !== 'RUNNING') return false;
      if (this.activeFilter === 'warning' && agent.status !== 'WARNING') return false;
      if (this.activeFilter === 'completed' && agent.status !== 'COMPLETED') return false;
      if (this.activeFilter === 'idle' && agent.status !== 'IDLE') return false;

      // Search query logic
      if (this.searchQuery) {
        const matchName = agent.name.toLowerCase().includes(this.searchQuery);
        const matchShort = agent.shortName.toLowerCase().includes(this.searchQuery);
        const matchDomain = agent.domain.toLowerCase().includes(this.searchQuery);
        const matchRisk = agent.currentRisk.toLowerCase().includes(this.searchQuery);
        const matchRec = agent.latestRecommendation.toLowerCase().includes(this.searchQuery);
        return matchName || matchShort || matchDomain || matchRisk || matchRec;
      }

      return true;
    });

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div class="empty-state-agents">
          <span class="empty-icon">🔍</span>
          <h3>No AI Agents match your filter</h3>
          <p>Try clearing search keywords or switching filter tabs.</p>
          <button class="btn btn-outline" id="clear-agent-filter-btn">Reset All Filters</button>
        </div>
      `;
      const clearBtn = gridEl.querySelector('#clear-agent-filter-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.activeFilter = 'all';
          this.searchQuery = '';
          const searchInput = document.getElementById('agent-search-input');
          if (searchInput) searchInput.value = '';
          this.renderFilterTabs();
          this.renderGrid();
        });
      }
      return;
    }

    gridEl.innerHTML = filtered.map(agent => this.renderAgentCard(agent)).join('');

    // Attach trigger buttons for each individual agent
    gridEl.querySelectorAll('.btn-trigger-agent').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const agentId = e.currentTarget.getAttribute('data-agent-id');
        this.triggerAgentRun(agentId);
      });
    });
  }

  /**
   * Render individual Agent Card meeting Section 18:
   * - Agent Name
   * - Status (IDLE, RUNNING, COMPLETED, WARNING, FAILED)
   * - Last Run
   * - Current Risk
   * - Confidence
   * - Latest Recommendation
   * - Link to inspect detailed reasoning
   */
  renderAgentCard(agent) {
    const statusBadge = this.getStatusBadge(agent.status);
    const riskBadgeClass = agent.riskLevel === 'danger' ? 'risk-danger' :
                           agent.riskLevel === 'warning' ? 'risk-warning' : 'risk-safe';
    const riskIcon = agent.riskLevel === 'danger' ? '🚨' :
                     agent.riskLevel === 'warning' ? '⚠️' : '✅';

    const metricsHtml = Object.entries(agent.metrics).map(([key, val]) => `
      <div class="agent-metric">
        <span class="metric-key">${key}</span>
        <span class="metric-val">${val}</span>
      </div>
    `).join('');

    const isRunning = agent.status === 'RUNNING';

    return `
      <article class="agent-card ${isRunning ? 'agent-running-state' : ''}" id="card-${agent.id}">
        <div class="agent-card-header">
          <div class="agent-icon-badge">${agent.icon}</div>
          <div class="agent-title-col">
            <div class="agent-name-row">
              <h2 class="agent-name">${agent.name}</h2>
              <span class="source-tag ${agent.source === 'MODEL' ? 'source-model' : 'source-ai'}">${agent.source}</span>
            </div>
            <span class="agent-model">${agent.model}</span>
          </div>
          <div class="agent-status-badge-wrapper">
            ${statusBadge}
          </div>
        </div>

        <div class="agent-risk-strip ${riskBadgeClass}">
          <span class="risk-strip-icon">${riskIcon}</span>
          <div class="risk-strip-content">
            <span class="risk-strip-title">Current Risk Assessment:</span>
            <span class="risk-strip-text">${agent.currentRisk}</span>
          </div>
        </div>

        <div class="agent-recommendation-box">
          <div class="rec-header">
            <span class="rec-icon">💡</span>
            <span class="rec-title">Latest Recommendation</span>
          </div>
          <p class="rec-body">${agent.latestRecommendation}</p>
        </div>

        <div class="agent-metrics">
          ${metricsHtml}
        </div>

        <div class="agent-confidence-wrapper">
          <div class="confidence-header">
            <span class="confidence-label">Agent Confidence Score</span>
            <span class="confidence-score">${agent.confidence}%</span>
          </div>
          <div class="confidence-track">
            <div class="confidence-fill" style="width: ${agent.confidence}%;"></div>
          </div>
        </div>

        <div class="agent-card-footer">
          <div class="agent-timing">
            <span class="timing-icon">⏱️</span>
            <span>Last Run: <strong>${agent.lastRun}</strong></span>
          </div>
          <div class="agent-action-buttons">
            <button class="btn btn-sm btn-outline btn-trigger-agent" data-agent-id="${agent.id}" ${isRunning ? 'disabled' : ''} title="Trigger real-time execution">
              ${isRunning ? '⏳ Running...' : '⚡ Run Agent'}
            </button>
            <a href="${agent.detailsUrl}" class="btn btn-sm btn-primary">
              Inspect Reasoning Trace →
            </a>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Helper for Section 18 Status Badges
   */
  getStatusBadge(status) {
    switch (status) {
      case 'RUNNING':
        return `<span class="badge badge-running"><span class="pulse-dot"></span> RUNNING</span>`;
      case 'WARNING':
        return `<span class="badge badge-warning">⚠️ WARNING</span>`;
      case 'COMPLETED':
        return `<span class="badge badge-success">✓ COMPLETED</span>`;
      case 'IDLE':
        return `<span class="badge badge-secondary">⏸ IDLE</span>`;
      case 'FAILED':
        return `<span class="badge badge-danger">✕ FAILED</span>`;
      default:
        return `<span class="badge badge-secondary">${status}</span>`;
    }
  }

  /**
   * Trigger single agent execution with live UI feedback
   */
  triggerAgentRun(agentId) {
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) return;

    // Set to RUNNING
    const prevStatus = agent.status;
    agent.status = 'RUNNING';
    agent.lastRun = 'Running now...';
    this.renderFilterTabs();
    this.renderSummaryKPIs();
    this.renderGrid();

    appShell.showToast(`Initiating autonomous execution: ${agent.name}`, 'info', 2500);

    // Simulate execution completion after 1.8s
    setTimeout(() => {
      agent.status = prevStatus === 'IDLE' ? 'COMPLETED' : prevStatus;
      agent.lastRun = 'Just now';
      agent.lastRunTimestamp = Date.now();
      // Slight variation in confidence
      agent.confidence = Math.min(99.4, Math.max(91.0, +(agent.confidence + (Math.random() * 0.8 - 0.4)).toFixed(1)));

      this.renderFilterTabs();
      this.renderSummaryKPIs();
      this.renderGrid();

      appShell.showToast(`✓ ${agent.name} completed reasoning successfully (${agent.confidence}% confidence)`, 'success', 3000);
    }, 1800);
  }

  /**
   * Coordinated cascade execution of all 9 agents + Master Orchestrator consensus
   */
  async runAllAgentsCascade() {
    if (this.isCascading) return;
    this.isCascading = true;

    const runBtn = document.getElementById('run-all-agents-btn');
    if (runBtn) {
      runBtn.disabled = true;
      runBtn.innerHTML = `<span class="btn-icon spinner">⏳</span><span>Executing Consensus Pipeline...</span>`;
    }

    appShell.showToast('🚀 Starting coordinated execution across all 9 Autonomous AI Agents', 'info', 3000);

    const nonOrchestrators = this.agents.filter(a => a.id !== 'orchestrator');
    const orchestrator = this.agents.find(a => a.id === 'orchestrator');

    // Run each domain agent sequentially with a brief delay
    for (let i = 0; i < nonOrchestrators.length; i++) {
      const agent = nonOrchestrators[i];
      agent.status = 'RUNNING';
      agent.lastRun = 'Evaluating...';
      this.renderGrid();
      this.renderFilterTabs();
      this.renderSummaryKPIs();

      await new Promise(r => setTimeout(r, 600));

      // Resolve agent
      agent.status = agent.id === 'irrigation' || agent.id === 'risk' ? 'WARNING' : 'COMPLETED';
      agent.lastRun = 'Just now';
      agent.lastRunTimestamp = Date.now();
      this.renderGrid();
    }

    // Finally run Orchestrator to generate consensus
    if (orchestrator) {
      orchestrator.status = 'RUNNING';
      orchestrator.lastRun = 'Synthesizing Consensus...';
      this.renderGrid();

      await new Promise(r => setTimeout(r, 800));

      orchestrator.status = 'COMPLETED';
      orchestrator.lastRun = 'Just now';
      orchestrator.lastRunTimestamp = Date.now();
      orchestrator.latestRecommendation = 'Consensus synthesized: Dispatched Unified Action Plan #AP-418 (Zone 2 Drip Irrigation) for Farmer Authorization.';
    }

    this.isCascading = false;
    this.renderOrchestratorBanner();
    this.renderSummaryKPIs();
    this.renderFilterTabs();
    this.renderGrid();

    if (runBtn) {
      runBtn.disabled = false;
      runBtn.innerHTML = `<span class="btn-icon">⚡</span><span>Run All 9 Agents (Consensus)</span>`;
    }

    appShell.showToast('🎯 Multi-Agent Consensus Complete! 1 Action Plan ready for approval in Action Plans center.', 'success', 5000);
  }

  /**
   * Polling every 10s (matching Orchestrator cycle)
   */
  startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      this.updateTimestamps();
      // Lightly sync with backend
      this.fetchBackendAgents(false);
    }, APP_CONFIG.SENSOR_POLL_INTERVAL_MS || 10000);
  }

  /**
   * Updates relative time strings like "4m ago"
   */
  updateTimestamps() {
    const now = Date.now();
    let changed = false;

    this.agents.forEach(agent => {
      if (agent.status === 'RUNNING') return;
      const diffMinutes = Math.floor((now - agent.lastRunTimestamp) / (60 * 1000));
      let newTime = '';
      if (diffMinutes < 1) newTime = 'Just now';
      else if (diffMinutes < 60) newTime = `${diffMinutes}m ago`;
      else newTime = `${Math.floor(diffMinutes / 60)}h ago`;

      if (agent.lastRun !== newTime && agent.lastRun !== 'Live (every 10s)') {
        agent.lastRun = newTime;
        changed = true;
      }
    });

    if (changed) {
      this.renderGrid();
    }
  }

  /**
   * Fetch agents status from FastAPI backend if available
   */
  async fetchBackendAgents(showNotification = false) {
    try {
      const url = `${APP_CONFIG.API_BASE_URL}/agents`;
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          // Merge backend agents into state
          data.forEach(backendAgent => {
            const local = this.agents.find(a => a.id === backendAgent.id);
            if (local) {
              if (backendAgent.status) local.status = backendAgent.status;
              if (backendAgent.confidence) local.confidence = backendAgent.confidence;
              if (backendAgent.recommendation) local.latestRecommendation = backendAgent.recommendation;
              if (backendAgent.current_risk) local.currentRisk = backendAgent.current_risk;
            }
          });
          this.renderSummaryKPIs();
          this.renderFilterTabs();
          this.renderGrid();
          if (showNotification) {
            appShell.showToast('Agents telemetry synced with backend', 'success', 2000);
          }
        }
      }
    } catch (err) {
      // Graceful fallback to rich local state machine
      if (showNotification) {
        appShell.showToast('Offline mode: Using cached AI agent telemetry', 'info', 2000);
      }
    }
  }
}

// Auto-initialize when DOM is ready
export const agentsController = new AgentsController();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => agentsController.init());
} else {
  agentsController.init();
}

export default agentsController;
