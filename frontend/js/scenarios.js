/**
 * KrishiNirnay AI - End-to-End Water Stress Simulation & Autonomous Loop Runner
 * Section 49 (Phase 43) & Section 64 (Most Important Engineering Rule) Compliance
 *
 * Implements the complete 9-stage connected autonomous loop:
 * 1. Simulation Start -> 2. Telemetry Decay -> 3. Agent Detection ->
 * 4. Risk Elevation -> 5. Action Plan Formulation -> 6. Farmer Approval ->
 * 7. Irrigation Execution -> 8. Telemetry Recovery -> 9. Reassessment & Closure
 */

(function () {
  'use strict';

  const STAGES = [
    {
      id: 'idle',
      title: 'Baseline Optimal',
      desc: 'Soil moisture at 52.0% (Optimal zone). No active risks.',
      moisture: 52.0,
      riskLevel: 'NORMAL',
      riskScore: 12.0,
      pumpState: 'OFF',
      flowRate: 0.0,
      planStatus: 'NONE',
      badgeClass: 'badge-success'
    },
    {
      id: 'sim_start',
      title: '1. Simulation Initiated',
      desc: 'Water Stress Deficit simulation triggered on North Orchard Block B.',
      moisture: 42.5,
      riskLevel: 'MODERATE',
      riskScore: 45.0,
      pumpState: 'OFF',
      flowRate: 0.0,
      planStatus: 'ANALYZING',
      badgeClass: 'badge-warning'
    },
    {
      id: 'telemetry_drop',
      title: '2. Telemetry Deficit',
      desc: 'Virtual IoT sensor detects severe moisture drop to 24.2% (< 40% agronomic threshold).',
      moisture: 24.2,
      riskLevel: 'HIGH',
      riskScore: 74.0,
      pumpState: 'OFF',
      flowRate: 0.0,
      planStatus: 'ANALYZING',
      badgeClass: 'badge-warning'
    },
    {
      id: 'agent_collaborate',
      title: '3. Multi-Agent Analysis',
      desc: 'Irrigation Agent detects drought stress; Weather Agent verifies 0mm rain in 48h forecast.',
      moisture: 24.2,
      riskLevel: 'CRITICAL',
      riskScore: 88.5,
      pumpState: 'OFF',
      flowRate: 0.0,
      planStatus: 'SYNTHESIZING',
      badgeClass: 'badge-danger'
    },
    {
      id: 'risk_detected',
      title: '4. Critical Risk Elevated',
      desc: 'Risk elevated to CRITICAL (Score: 88.5%). Evaporative transpiration exceeds root absorption.',
      moisture: 24.2,
      riskLevel: 'CRITICAL',
      riskScore: 88.5,
      pumpState: 'OFF',
      flowRate: 0.0,
      planStatus: 'PENDING_APPROVAL',
      badgeClass: 'badge-danger'
    },
    {
      id: 'plan_generated',
      title: '5. Action Plan Proposed',
      desc: 'Action Plan #AP-401 generated: 30-min Pulse Drip Irrigation on Zone North-2 (1,250 Liters).',
      moisture: 24.2,
      riskLevel: 'CRITICAL',
      riskScore: 88.5,
      pumpState: 'OFF',
      flowRate: 0.0,
      planStatus: 'AWAITING_FARMER',
      badgeClass: 'badge-warning'
    },
    {
      id: 'farmer_approved',
      title: '6. Farmer Approval',
      desc: 'Farmer approves Plan #AP-401. Authorized execution command dispatched to pump controller.',
      moisture: 24.2,
      riskLevel: 'CRITICAL',
      riskScore: 88.5,
      pumpState: 'STARTING',
      flowRate: 0.0,
      planStatus: 'APPROVED',
      badgeClass: 'badge-info'
    },
    {
      id: 'execution_running',
      title: '7. Irrigation Executing',
      desc: 'Solenoid valve SV-02 opened. Pump operating at 14.5 L/min. Active short polling rhythm.',
      moisture: 33.5,
      riskLevel: 'HIGH',
      riskScore: 60.0,
      pumpState: 'RUNNING',
      flowRate: 14.5,
      planStatus: 'EXECUTING',
      badgeClass: 'badge-success'
    },
    {
      id: 'telemetry_recovery',
      title: '8. Telemetry Recovery',
      desc: 'Soil moisture rises to 48.5%, successfully entering the agronomic optimal target window.',
      moisture: 48.5,
      riskLevel: 'MODERATE',
      riskScore: 28.0,
      pumpState: 'STOPPING',
      flowRate: 8.0,
      planStatus: 'COMPLETED',
      badgeClass: 'badge-success'
    },
    {
      id: 'reassessment_closed',
      title: '9. Reassessment & Closure',
      desc: 'Risk reassessed to NORMAL (12.0%). Pump switched OFF. Autonomous operational loop complete.',
      moisture: 51.8,
      riskLevel: 'NORMAL',
      riskScore: 12.0,
      pumpState: 'OFF',
      flowRate: 0.0,
      planStatus: 'RESOLVED',
      badgeClass: 'badge-success'
    }
  ];

  const WaterStressDemo = {
    currentStageIndex: 0,
    autoTimer: null,
    isRunningAuto: false,

    /**
     * Get current stage state
     */
    getCurrentStage: function () {
      return STAGES[this.currentStageIndex];
    },

    /**
     * Move to a specific stage by index
     * @param {number} index
     */
    goToStage: function (index) {
      if (index < 0 || index >= STAGES.length) return;
      this.currentStageIndex = index;
      const stage = STAGES[index];

      // Update telemetry chart if available
      if (window.globalTelemetryChart) {
        window.globalTelemetryChart.setMetric('soil_moisture');
        const points = [];
        const now = new Date();
        const base = index >= 8 ? 50 : (index >= 7 ? 35 : (index >= 2 ? 24.2 : 52));
        for (let i = 11; i >= 0; i--) {
          const t = new Date(now.getTime() - i * 5 * 60000);
          const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const jitter = (Math.random() - 0.5) * 1.5;
          points.push({ time: timeStr, value: Math.round((base + jitter) * 10) / 10 });
        }
        window.globalTelemetryChart.setData(points);
      }

      // Update feedback and toast announcements for key milestones
      if (stage.id === 'sim_start' && window.UIFeedback) {
        window.UIFeedback.startSimulation('Water Stress Deficit');
      } else if (stage.id === 'farmer_approved' && window.UIFeedback) {
        window.UIFeedback.approveAction('AP-401', { title: '30-min Pulse Drip on Zone North-2' });
      } else if (stage.id === 'execution_running' && window.UIFeedback) {
        window.UIFeedback.startIrrigation('Zone North-2', { rateLpm: 14.5, durationMinutes: 30 });
      } else if (stage.id === 'reassessment_closed') {
        if (window.UIFeedback) {
          window.UIFeedback.completeSimulation('Water Stress Deficit', 'Moisture restored to 51.8%. Risk closed.');
        }
        if (window.Toast) {
          window.Toast.success('Loop Completed', 'Autonomous cycle concluded successfully.');
        }
      }

      // Announce to screen reader
      if (window.A11y) {
        window.A11y.announce(`Stage ${index}: ${stage.title}. ${stage.desc}`);
      }

      // Dispatch global event for UI subscribers
      window.dispatchEvent(
        new CustomEvent('krishinirnay:water_stress_stage_changed', {
          detail: { stage, index, total: STAGES.length }
        })
      );
    },

    /**
     * Next stage
     */
    nextStage: function () {
      if (this.currentStageIndex < STAGES.length - 1) {
        this.goToStage(this.currentStageIndex + 1);
      } else {
        this.stopAuto();
      }
    },

    /**
     * Previous stage
     */
    prevStage: function () {
      if (this.currentStageIndex > 0) {
        this.goToStage(this.currentStageIndex - 1);
      }
    },

    /**
     * Reset back to Stage 0 (Baseline)
     */
    reset: function () {
      this.stopAuto();
      this.goToStage(0);
      if (window.Toast) {
        window.Toast.info('Demo Reset', 'Restored Stage 0 Baseline Optimal conditions.');
      }
    },

    /**
     * Start automated walkthrough playback for judges
     * @param {number} [intervalMs=2400]
     */
    startAuto: function (intervalMs = 2400) {
      this.stopAuto();
      this.isRunningAuto = true;
      if (this.currentStageIndex >= STAGES.length - 1) {
        this.goToStage(0);
      }

      this.autoTimer = setInterval(() => {
        if (this.currentStageIndex < STAGES.length - 1) {
          this.nextStage();
        } else {
          this.stopAuto();
        }
      }, intervalMs);

      window.dispatchEvent(new CustomEvent('krishinirnay:demo_autoplay_state', { detail: { running: true } }));
      if (window.Toast) {
        window.Toast.info('Autoplay Started', 'Demonstrating 9-stage autonomous water stress loop.');
      }
    },

    /**
     * Stop automated walkthrough
     */
    stopAuto: function () {
      if (this.autoTimer) {
        clearInterval(this.autoTimer);
        this.autoTimer = null;
      }
      this.isRunningAuto = false;
      window.dispatchEvent(new CustomEvent('krishinirnay:demo_autoplay_state', { detail: { running: false } }));
    },

    /**
     * Get all stages for stepper rendering
     */
    getStages: function () {
      return STAGES;
    }
  };

  // =========================================================================
  // Phase 44 (Section 50): Heavy Rain & Multi-Agent Conflict Arbitration Demo
  // =========================================================================

  const RAIN_STAGES = [
    {
      id: 'hr_baseline',
      title: 'Scheduled Baseline',
      desc: 'Clear skies. Planned drip fertigation on Zone South-1 scheduled for tomorrow.',
      forecastMm: 0.0,
      rainProb: 10,
      soilMoisture: 44.0,
      conflictStatus: 'NONE',
      actionState: 'SCHEDULED',
      actionTitle: '45-min Drip Fertigation (Zone South-1)',
      explanation: 'Routine nitrogen-potassium nutrient boost scheduled during early morning hours.',
      badgeClass: 'badge-neutral',
      savings: '0 L'
    },
    {
      id: 'hr_sim_trigger',
      title: '1. Heavy Rain Triggered',
      desc: 'Monsoonal cyclonic depression scenario injected via Simulation Center.',
      forecastMm: 18.0,
      rainProb: 65,
      soilMoisture: 44.0,
      conflictStatus: 'MONITORING',
      actionState: 'SCHEDULED',
      actionTitle: '45-min Drip Fertigation (Zone South-1)',
      explanation: 'Open-Meteo weather integration radar detecting approaching storm front.',
      badgeClass: 'badge-info',
      savings: '0 L'
    },
    {
      id: 'hr_forecast_spike',
      title: '2. Forecast Spike (68mm)',
      desc: 'Severe storm alert: 68.0mm rainfall forecast within 24h window (94% probability).',
      forecastMm: 68.0,
      rainProb: 94,
      soilMoisture: 45.0,
      conflictStatus: 'ALERT',
      actionState: 'REVIEWING',
      actionTitle: '45-min Drip Fertigation (Zone South-1)',
      explanation: 'Precipitation will exceed soil water-holding capacity (field saturation limit: 55%).',
      badgeClass: 'badge-warning',
      savings: '0 L'
    },
    {
      id: 'hr_conflict_detected',
      title: '3. Conflict Detected',
      desc: 'Irrigation Agent vs. Weather Agent: Artificial watering conflicts with heavy rainfall.',
      forecastMm: 68.0,
      rainProb: 94,
      soilMoisture: 45.0,
      conflictStatus: 'CRITICAL_CONFLICT',
      actionState: 'INTERCEPTED',
      actionTitle: 'Conflict: Leaching & Hypoxia Risk',
      explanation: 'CONFLICT DETECTED: Running irrigation during monsoonal downpour will cause severe nutrient leaching, root hypoxia, and energy waste.',
      badgeClass: 'badge-danger',
      savings: '0 L'
    },
    {
      id: 'hr_action_deferred',
      title: '4. Action Deferred (48h)',
      desc: 'Orchestrator arbitrates: Postpone irrigation by 48 hours until field drainage stabilizes.',
      forecastMm: 68.0,
      rainProb: 94,
      soilMoisture: 45.0,
      conflictStatus: 'RESOLVED_DEFERRED',
      actionState: 'POSTPONED (48h)',
      actionTitle: 'Postponed: Irrigation Suspended for 48h',
      explanation: 'DECISION ARBITRATION: Scheduled fertigation deferred by 48 hours. Rain will provide abundant natural moisture without fertilizer loss.',
      badgeClass: 'badge-success',
      savings: '3,200 L Water + ₹240 Power'
    },
    {
      id: 'hr_resolved',
      title: '5. Safe Normalization',
      desc: 'Field drainage clear. Weather alert active. Zero wasted water or chemical run-off.',
      forecastMm: 68.0,
      rainProb: 94,
      soilMoisture: 52.0,
      conflictStatus: 'SECURED',
      actionState: 'PROTECTED',
      actionTitle: 'Crop Root Aeration Preserved',
      explanation: 'Autonomous multi-agent protection successfully prevented waterlogging and unnecessary expenditure.',
      badgeClass: 'badge-success',
      savings: '3,200 L Water + ₹240 Power'
    }
  ];

  const HeavyRainDemo = {
    currentStageIndex: 0,
    autoTimer: null,
    isRunningAuto: false,

    getCurrentStage: function () {
      return RAIN_STAGES[this.currentStageIndex];
    },

    goToStage: function (index) {
      if (index < 0 || index >= RAIN_STAGES.length) return;
      this.currentStageIndex = index;
      const stage = RAIN_STAGES[index];

      // Update telemetry chart to rainfall if available
      if (window.globalTelemetryChart) {
        window.globalTelemetryChart.setMetric('rainfall');
        const points = [];
        const now = new Date();
        const base = index >= 2 ? 55 : (index === 1 ? 18 : 0);
        for (let i = 11; i >= 0; i--) {
          const t = new Date(now.getTime() - i * 5 * 60000);
          const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const val = i <= 3 && index >= 2 ? Math.round((base + Math.random() * 15) * 10) / 10 : (index === 1 && i <= 2 ? 18 : 0);
          points.push({ time: timeStr, value: val });
        }
        window.globalTelemetryChart.setData(points);
      }

      // Feedback toasts
      if (stage.id === 'hr_sim_trigger' && window.Toast) {
        window.Toast.info('Heavy Rain Simulated', 'Injected monsoonal storm scenario.');
      } else if (stage.id === 'hr_conflict_detected' && window.Toast) {
        window.Toast.warning('Conflict Intercepted', 'Weather Agent alerted: 68mm rain prevents scheduled fertigation.');
      } else if (stage.id === 'hr_action_deferred' && window.UIFeedback) {
        window.UIFeedback.pauseIrrigation('Zone South-1', 'Heavy rainfall of 68mm incoming. Deferred by 48 hours.');
      }

      if (window.A11y) {
        window.A11y.announce(`Heavy Rain Demo Stage ${index}: ${stage.title}. ${stage.desc}`);
      }

      window.dispatchEvent(
        new CustomEvent('krishinirnay:heavy_rain_stage_changed', {
          detail: { stage, index, total: RAIN_STAGES.length }
        })
      );
    },

    nextStage: function () {
      if (this.currentStageIndex < RAIN_STAGES.length - 1) {
        this.goToStage(this.currentStageIndex + 1);
      } else {
        this.stopAuto();
      }
    },

    prevStage: function () {
      if (this.currentStageIndex > 0) {
        this.goToStage(this.currentStageIndex - 1);
      }
    },

    reset: function () {
      this.stopAuto();
      this.goToStage(0);
      if (window.Toast) {
        window.Toast.info('Demo Reset', 'Restored Heavy Rain Baseline state.');
      }
    },

    startAuto: function (intervalMs = 2500) {
      this.stopAuto();
      this.isRunningAuto = true;
      if (this.currentStageIndex >= RAIN_STAGES.length - 1) {
        this.goToStage(0);
      }

      this.autoTimer = setInterval(() => {
        if (this.currentStageIndex < RAIN_STAGES.length - 1) {
          this.nextStage();
        } else {
          this.stopAuto();
        }
      }, intervalMs);

      window.dispatchEvent(new CustomEvent('krishinirnay:hr_autoplay_state', { detail: { running: true } }));
      if (window.Toast) {
        window.Toast.info('Autoplay Started', 'Demonstrating Heavy Rain conflict arbitration.');
      }
    },

    stopAuto: function () {
      if (this.autoTimer) {
        clearInterval(this.autoTimer);
        this.autoTimer = null;
      }
      this.isRunningAuto = false;
      window.dispatchEvent(new CustomEvent('krishinirnay:hr_autoplay_state', { detail: { running: false } }));
    },

    getStages: function () {
      return RAIN_STAGES;
    }
  };

  window.WaterStressDemo = WaterStressDemo;
  window.HeavyRainDemo = HeavyRainDemo;

  // =========================================================================
  // Phase 45 (Section 51 & 21): Drone Vision & Disease Detection Demo
  // =========================================================================

  const DISEASE_PRESETS = {
    pomegranate_blight: {
      id: 'pomegranate_blight',
      crop: 'Pomegranate (Bhagwa)',
      field: 'North Orchard Block B',
      imageName: 'drone_ortho_scan_block_b.jpg',
      imageAlt: 'Drone multispectral scan showing dark angular leaf lesions with water-soaked halos',
      diseaseName: 'Bacterial Blight (Xanthomonas axonopodis pv. punicae)',
      confidence: 93.4,
      affectedArea: '18.5% (0.44 Hectares)',
      severity: 'HIGH',
      riskScore: 86.0,
      sourceLabel: 'MODEL',
      weatherCorrelation: 'High canopy humidity (88.5%) + warm ambient temperature (31.2°C) created optimal incubation conditions for Xanthomonas bacterial proliferation.',
      prescription: 'Apply Copper Oxychloride 50 WP (2.5 g/L) + Streptocycline (0.5 g/L) via tractor-mounted boom spray within 36 hours.',
      safetyNotice: 'Wear protective mask & gloves. Do not apply during peak afternoon sunshine or wind speed > 15 km/h.',
      planId: 'AP-403',
      estimatedCost: '₹840 (Active spray solution)',
      boundingPositions: [
        { top: 25, left: 30, width: 45, height: 35, label: 'Lesion Cluster #1 (93%)' },
        { top: 55, left: 60, width: 30, height: 28, label: 'Incipient Blight #2 (88%)' }
      ]
    },
    cotton_leaf_curl: {
      id: 'cotton_leaf_curl',
      crop: 'Bt Cotton (RCH-659)',
      field: 'South Pasture Zone 1',
      imageName: 'drone_thermal_leaf_curl.jpg',
      imageAlt: 'Drone thermal scan showing vein thickening and upward leaf curling',
      diseaseName: 'Cotton Leaf Curl Virus (CLCuV)',
      confidence: 89.2,
      affectedArea: '12.0% (0.30 Hectares)',
      severity: 'MODERATE',
      riskScore: 68.0,
      sourceLabel: 'MODEL',
      weatherCorrelation: 'Dry hot winds (36.5°C) facilitated heavy whitefly (Bemisia tabaci) vector migration across field perimeter.',
      prescription: 'Spray Diafenthiuron 50 WP (1.2 g/L) or Flonicamid 50 WG (0.4 g/L) to suppress whitefly insect vectors.',
      safetyNotice: 'Direct spray toward underside of foliage where vectors aggregate. 14-day pre-harvest interval.',
      planId: 'AP-404',
      estimatedCost: '₹620 (Vector suppression)',
      boundingPositions: [
        { top: 20, left: 20, width: 55, height: 50, label: 'Vein Thickening (89%)' }
      ]
    },
    healthy_canopy: {
      id: 'healthy_canopy',
      crop: 'Soybean (JS-335)',
      field: 'East Plot Zone 3',
      imageName: 'drone_ortho_healthy_canopy.jpg',
      imageAlt: 'Drone RGB orthomosaic showing uniform vibrant green leaf canopy',
      diseaseName: 'Healthy Vigorous Canopy (No Pathogens Detected)',
      confidence: 98.1,
      affectedArea: '0.0% (0.00 Hectares)',
      severity: 'NONE',
      riskScore: 6.0,
      sourceLabel: 'MODEL',
      weatherCorrelation: 'Moderate humidity (60%) and steady aeration maintained clean phyllosphere microclimate.',
      prescription: 'No chemical intervention required. Continue scheduled bio-stimulant foliar nutrition next week.',
      safetyNotice: 'Continue routine weekly drone surveillance.',
      planId: 'AP-NONE',
      estimatedCost: '₹0 (Healthy crop)',
      boundingPositions: []
    }
  };

  const DiseaseDemo = {
    selectedKey: 'pomegranate_blight',
    isAnalyzing: false,
    planStatus: 'PENDING_APPROVAL',

    getPresets: function () {
      return DISEASE_PRESETS;
    },

    getCurrentData: function () {
      return DISEASE_PRESETS[this.selectedKey];
    },

    selectPreset: function (key) {
      if (!DISEASE_PRESETS[key]) return;
      this.selectedKey = key;
      this.planStatus = key === 'healthy_canopy' ? 'NOT_REQUIRED' : 'PENDING_APPROVAL';
      this.runAnalysisSimulation();
    },

    runAnalysisSimulation: function () {
      this.isAnalyzing = true;
      window.dispatchEvent(new CustomEvent('krishinirnay:disease_analysis_started', { detail: { key: this.selectedKey } }));

      setTimeout(() => {
        this.isAnalyzing = false;
        const data = this.getCurrentData();
        window.dispatchEvent(
          new CustomEvent('krishinirnay:disease_demo_updated', {
            detail: { data, planStatus: this.planStatus }
          })
        );
        if (window.Toast) {
          if (data.severity === 'NONE') {
            window.Toast.success('Canopy Healthy', 'Drone inference: 98.1% confidence healthy crop.');
          } else {
            window.Toast.warning('Pathogen Detected', `${data.diseaseName} (${data.confidence}% confidence).`);
          }
        }
      }, 1000);
    },

    approvePrescription: function () {
      const data = this.getCurrentData();
      this.planStatus = 'APPROVED';
      if (window.UIFeedback) {
        window.UIFeedback.approveAction(data.planId, { title: `Targeted Spray: ${data.diseaseName}` });
      }
      window.dispatchEvent(
        new CustomEvent('krishinirnay:disease_demo_updated', {
          detail: { data, planStatus: this.planStatus }
        })
      );
    },

    requestExpertReview: function () {
      const data = this.getCurrentData();
      this.planStatus = 'UNDER_REVIEW';
      if (window.UIFeedback) {
        window.UIFeedback.requestExpertReview(data.planId, 'Krishi Vigyan Kendra Plant Pathologist');
      }
      window.dispatchEvent(
        new CustomEvent('krishinirnay:disease_demo_updated', {
          detail: { data, planStatus: this.planStatus }
        })
      );
    }
  };

  window.DiseaseDemo = DiseaseDemo;
})();


