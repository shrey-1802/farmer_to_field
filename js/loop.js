/**
 * KrishiNirnay AI - Continuous Monitoring Autonomous Loop
 * Strict compliance with Section 52:
 * MONITOR -> ANALYZE -> DETECT -> PLAN -> EXECUTE -> VERIFY -> MONITOR AGAIN
 *
 * Provides a visible, interactive autonomous-loop component that updates
 * dynamically based on backend state and simulation scenarios.
 */

(function () {
  'use strict';

  const LOOP_STAGES = [
    {
      id: 'monitor',
      number: 1,
      title: 'MONITOR',
      label: '1. Ingest Telemetry',
      icon: '📡',
      subsystem: 'Virtual IoT & Weather Integration',
      description: 'Continuous ingestion of virtual soil moisture, temperature, and Open-Meteo precipitation forecasts.',
      action: 'Polling virtual sensor telemetry every 10s. Ambient conditions stable.',
      telemetry: 'Moisture: 42.4% • Temp: 26.2°C • Rain Forecast: 0.0mm',
      badgeClass: 'badge-info',
      accentColor: '#2563EB',
      nextCycleIn: 'Active Stream'
    },
    {
      id: 'analyze',
      number: 2,
      title: 'ANALYZE',
      label: '2. Multi-Agent Synthesis',
      icon: '🧠',
      subsystem: 'Soil & Crop Physiology Agents',
      description: 'Multi-agent reasoning models correlate root-zone moisture decay against crop evapotranspiration curves.',
      action: 'Evaluating soil drying gradient against 35% critical stress threshold.',
      telemetry: 'Evapotranspiration rate: 4.8 mm/day • Root zone depletion: Normal',
      badgeClass: 'badge-info',
      accentColor: '#3B82F6',
      nextCycleIn: 'Analyzing'
    },
    {
      id: 'detect',
      number: 3,
      title: 'DETECT',
      label: '3. Stress Detection',
      icon: '🚨',
      subsystem: 'Risk Detection Engine',
      description: 'Anomaly detection flags biological stress, pest outbreak risk, or extreme weather divergence.',
      action: 'Comparing live readings with threshold trip-points. Anomaly flag evaluated.',
      telemetry: 'Water Stress Risk: 14% (Normal) • Pathogen Probability: < 5%',
      badgeClass: 'badge-warning',
      accentColor: '#D97706',
      nextCycleIn: 'Real-time Trip'
    },
    {
      id: 'plan',
      number: 4,
      title: 'PLAN',
      label: '4. Action Formulation',
      icon: '📋',
      subsystem: 'Action Planner & Conflict Arbiter',
      description: 'Synthesizes targeted agronomic intervention plans with cost estimates, water volumes, and weather conflict arbitration.',
      action: 'Orchestrator generates candidate action plans and checks for weather conflicts.',
      telemetry: 'Candidate Plan: 25mm Drip Irrigation • Conflict Check: Cleared',
      badgeClass: 'badge-primary',
      accentColor: '#16A34A',
      nextCycleIn: 'Awaiting Auth'
    },
    {
      id: 'execute',
      number: 5,
      title: 'EXECUTE',
      label: '5. Actuation & Dispatch',
      icon: '⚡',
      subsystem: 'Actuation & Execution Controller',
      description: 'Authoritative execution of approved action plans (smart drip valves, pump stations, or drone dispatch).',
      action: 'Awaiting farmer authorization or executing approved automated irrigation cycle.',
      telemetry: 'Pump Station Zone South-1: Ready • Execution Rhythm: 2.5s Short Polling',
      badgeClass: 'badge-success',
      accentColor: '#15803D',
      nextCycleIn: 'In Execution'
    },
    {
      id: 'verify',
      number: 6,
      title: 'VERIFY',
      label: '6. Outcome Validation',
      icon: '✓',
      subsystem: 'Closed-Loop Verification Agent',
      description: 'Validates post-action sensor recovery curve to ensure physiological stress has resolved.',
      action: 'Tracking real-time soil hydration curve. Confirming moisture level restoration.',
      telemetry: 'Post-action moisture delta: +12.8% • Field capacity secured',
      badgeClass: 'badge-success',
      accentColor: '#059669',
      nextCycleIn: 'Verifying'
    },
    {
      id: 'monitor_again',
      number: 7,
      title: 'MONITOR AGAIN',
      label: '7. Loop Reassessment',
      icon: '🔄',
      subsystem: 'Autonomous Loop Supervisor',
      description: 'Closes the autonomous loop and transitions back to steady-state continuous surveillance.',
      action: 'Cycle successfully completed. Resetting monitoring timer for next scheduled pass.',
      telemetry: 'Autonomous health check: 100% • System readiness: OPTIMAL',
      badgeClass: 'badge-neutral',
      accentColor: '#16A34A',
      nextCycleIn: 'Cycle Restart (T-10s)'
    }
  ];

  const AutonomousLoop = {
    currentStageIndex: 0,
    autoTimer: null,
    isRunningAuto: false,
    speedMs: 2600,

    /**
     * Get list of all loop stages
     */
    getStages: function () {
      return LOOP_STAGES;
    },

    /**
     * Get current stage object
     */
    getCurrentStage: function () {
      return LOOP_STAGES[this.currentStageIndex];
    },

    /**
     * Navigate to a specific stage index
     * @param {number} index
     */
    goToStage: function (index) {
      if (index < 0 || index >= LOOP_STAGES.length) return;
      this.currentStageIndex = index;
      const stage = LOOP_STAGES[index];

      // A11y announcement
      if (window.A11y) {
        window.A11y.announce(`Autonomous Loop Stage ${stage.number}: ${stage.title}. Subsystem: ${stage.subsystem}`);
      }

      // Dispatch event for UI listeners
      window.dispatchEvent(
        new CustomEvent('krishinirnay:loop_stage_changed', {
          detail: { stage, index, total: LOOP_STAGES.length }
        })
      );
    },

    /**
     * Advance to next stage (wraps from stage 6 back to 0)
     */
    nextStage: function () {
      const nextIdx = (this.currentStageIndex + 1) % LOOP_STAGES.length;
      this.goToStage(nextIdx);
    },

    /**
     * Step back to previous stage
     */
    prevStage: function () {
      const prevIdx = (this.currentStageIndex - 1 + LOOP_STAGES.length) % LOOP_STAGES.length;
      this.goToStage(prevIdx);
    },

    /**
     * Reset loop back to Stage 0 (MONITOR)
     */
    reset: function () {
      this.stopAuto();
      this.goToStage(0);
      if (window.Toast) {
        window.Toast.info('Loop Reset', 'Returned to Stage 1: MONITOR (Continuous Ingestion).');
      }
    },

    /**
     * Start automated continuous cycle playback
     * @param {number} [intervalMs=2600]
     */
    startAuto: function (intervalMs = 2600) {
      this.stopAuto();
      this.isRunningAuto = true;
      this.speedMs = intervalMs;

      this.autoTimer = setInterval(() => {
        this.nextStage();
      }, this.speedMs);

      window.dispatchEvent(new CustomEvent('krishinirnay:loop_autoplay_state', { detail: { running: true } }));
      if (window.Toast) {
        window.Toast.info('Autonomous Cycle Running', 'Visualizing continuous closed-loop monitoring cycle.');
      }
    },

    /**
     * Stop automated continuous cycle playback
     */
    stopAuto: function () {
      if (this.autoTimer) {
        clearInterval(this.autoTimer);
        this.autoTimer = null;
      }
      this.isRunningAuto = false;
      window.dispatchEvent(new CustomEvent('krishinirnay:loop_autoplay_state', { detail: { running: false } }));
    },

    /**
     * Toggle automated playback state
     */
    toggleAuto: function () {
      if (this.isRunningAuto) {
        this.stopAuto();
      } else {
        this.startAuto(this.speedMs);
      }
    },

    /**
     * Synchronize loop position with authoritative backend status or active scenario
     * @param {string} stateKeyword - e.g. 'monitor', 'analyze', 'detect', 'risk', 'plan', 'execute', 'verify', 'normal'
     */
    syncWithBackendState: function (stateKeyword) {
      if (!stateKeyword) return;
      const kw = stateKeyword.toLowerCase();

      let targetIdx = 0;
      if (kw.includes('analyze') || kw.includes('reasoning')) {
        targetIdx = 1;
      } else if (kw.includes('detect') || kw.includes('stress') || kw.includes('risk') || kw.includes('anomaly')) {
        targetIdx = 2;
      } else if (kw.includes('plan') || kw.includes('proposal') || kw.includes('arbitrat')) {
        targetIdx = 3;
      } else if (kw.includes('execut') || kw.includes('pump') || kw.includes('approv')) {
        targetIdx = 4;
      } else if (kw.includes('verify') || kw.includes('recover') || kw.includes('validat')) {
        targetIdx = 5;
      } else if (kw.includes('again') || kw.includes('reassess') || kw.includes('closure')) {
        targetIdx = 6;
      } else {
        targetIdx = 0; // MONITOR
      }

      this.goToStage(targetIdx);
      if (window.Toast) {
        const stage = LOOP_STAGES[targetIdx];
        window.Toast.info('Loop Synchronized', `Autonomous loop synced to: ${stage.title}`);
      }
    },

    /**
     * Render the Autonomous Loop component HTML into a target container
     * @param {string|HTMLElement} container
     * @param {Object} [options]
     */
    render: function (container, options = {}) {
      const el = typeof container === 'string' ? document.querySelector(container) : container;
      if (!el) return;

      const prefix = options.idPrefix || 'aloop';
      const isCompact = options.compact || false;

      let pipelineHtml = '';
      LOOP_STAGES.forEach((stg, idx) => {
        const isActive = idx === this.currentStageIndex;
        const isPast = idx < this.currentStageIndex;
        pipelineHtml += `
          <button type="button" 
                  class="loop-pipeline-node ${isActive ? 'active' : ''} ${isPast ? 'passed' : ''}" 
                  data-stage-idx="${idx}"
                  onclick="AutonomousLoop.goToStage(${idx})"
                  aria-label="Stage ${stg.number}: ${stg.title}">
            <div class="loop-node-badge">
              <span class="loop-node-icon">${stg.icon}</span>
              <span class="loop-node-num">${stg.number}</span>
            </div>
            <div class="loop-node-info">
              <span class="loop-node-title">${stg.title}</span>
              <span class="loop-node-sub">${stg.subsystem.split(' ')[0]}</span>
            </div>
          </button>
          ${idx < LOOP_STAGES.length - 1 ? '<div class="loop-pipeline-arrow" aria-hidden="true">➔</div>' : '<div class="loop-pipeline-arrow loop-return-arrow" aria-hidden="true">↺</div>'}
        `;
      });

      const current = this.getCurrentStage();

      el.innerHTML = `
        <div class="autonomous-loop-card" id="${prefix}-card">
          <div class="loop-header-bar">
            <div class="loop-header-title">
              <div class="loop-radar-pulse" aria-hidden="true"></div>
              <div>
                <span class="loop-title-text">Autonomous Closed-Loop Pipeline</span>
                <span class="badge badge-success" style="margin-left: 8px;">Continuous 7-Stage Cycle</span>
              </div>
            </div>
            <div class="loop-controls-bar">
              <button type="button" id="${prefix}-btn-auto" class="btn btn-primary btn-sm" onclick="AutonomousLoop.toggleAuto()">
                ${this.isRunningAuto ? '⏹ Pause Loop' : '▶ Auto Cycle'}
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="AutonomousLoop.prevStage()" aria-label="Previous Loop Stage">
                ⏮
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="AutonomousLoop.nextStage()" aria-label="Next Loop Stage">
                ⏭
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="AutonomousLoop.reset()" aria-label="Reset Loop">
                🔄
              </button>
            </div>
          </div>

          <!-- Horizontal Continuous Pipeline Visualizer -->
          <div class="loop-pipeline-container" role="tablist" aria-label="Autonomous Monitoring Loop Stages">
            ${pipelineHtml}
          </div>

          <!-- Active Stage Highlight Details Card -->
          <div class="loop-detail-panel" id="${prefix}-detail-panel">
            <div class="loop-detail-top">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span class="loop-active-icon" id="${prefix}-icon">${current.icon}</span>
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span id="${prefix}-badge" class="badge ${current.badgeClass}">STAGE ${current.number} OF 7</span>
                    <strong id="${prefix}-title" style="font-size: var(--font-size-base); color: var(--color-text-primary);">
                      ${current.title} — ${current.subsystem}
                    </strong>
                  </div>
                  <p id="${prefix}-desc" style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-top: 4px; margin-bottom: 0;">
                    ${current.description}
                  </p>
                </div>
              </div>
              <span class="badge badge-neutral" id="${prefix}-cycle-timer">${current.nextCycleIn}</span>
            </div>

            <div class="loop-metrics-grid">
              <div class="stat-pill" style="margin-bottom: 0;">
                <span class="stat-pill-label">Operational Action</span>
                <div id="${prefix}-action" style="font-size: var(--font-size-xs); font-weight: 600; color: var(--color-text-primary); margin-top: 4px;">
                  ${current.action}
                </div>
              </div>
              <div class="stat-pill" style="margin-bottom: 0;">
                <span class="stat-pill-label">Live Telemetry Context</span>
                <div id="${prefix}-telemetry" style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-top: 4px;">
                  ${current.telemetry}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Update UI elements dynamically when stage changes
      const updateView = (stage, idx) => {
        // Update nodes
        const nodes = el.querySelectorAll('.loop-pipeline-node');
        nodes.forEach((node, nIdx) => {
          node.classList.toggle('active', nIdx === idx);
          node.classList.toggle('passed', nIdx < idx);
        });

        // Update detail panel elements
        const iconEl = el.querySelector(`#${prefix}-icon`);
        const badgeEl = el.querySelector(`#${prefix}-badge`);
        const titleEl = el.querySelector(`#${prefix}-title`);
        const descEl = el.querySelector(`#${prefix}-desc`);
        const timerEl = el.querySelector(`#${prefix}-cycle-timer`);
        const actionEl = el.querySelector(`#${prefix}-action`);
        const telemEl = el.querySelector(`#${prefix}-telemetry`);

        if (iconEl) iconEl.textContent = stage.icon;
        if (badgeEl) {
          badgeEl.className = `badge ${stage.badgeClass}`;
          badgeEl.textContent = `STAGE ${stage.number} OF 7`;
        }
        if (titleEl) titleEl.textContent = `${stage.title} — ${stage.subsystem}`;
        if (descEl) descEl.textContent = stage.description;
        if (timerEl) timerEl.textContent = stage.nextCycleIn;
        if (actionEl) actionEl.textContent = stage.action;
        if (telemEl) telemEl.textContent = stage.telemetry;
      };

      // Listen to stage changed
      window.addEventListener('krishinirnay:loop_stage_changed', (e) => {
        if (e.detail && e.detail.stage) {
          updateView(e.detail.stage, e.detail.index);
        }
      });

      // Listen to autoplay button state
      window.addEventListener('krishinirnay:loop_autoplay_state', (e) => {
        const btn = el.querySelector(`#${prefix}-btn-auto`);
        if (btn) {
          btn.textContent = e.detail.running ? '⏹ Pause Loop' : '▶ Auto Cycle';
        }
      });
    }
  };

  // Expose globally
  window.AutonomousLoop = AutonomousLoop;
})();
