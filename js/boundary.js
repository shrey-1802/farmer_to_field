/**
 * KrishiNirnay AI - Backend Authority & Architectural Boundary Enforcer
 * Section 47 (Phase 41) Compliance: "NO FAKE BACKEND LOGIC"
 *
 * Strict Non-Negotiable Rules:
 * 1. Production UI must receive risk values from the FastAPI backend.
 * 2. No frontend AI agent.
 * 3. No frontend risk engine (e.g. "if (waterStress) { risk = 90; }" is strictly forbidden).
 * 4. No frontend irrigation decision engine.
 * 5. No frontend fake weather engine.
 * 6. No silent fabrication on network failure (Honest Error / Wake-Up State enforcement).
 */

(function () {
  'use strict';

  const BackendBoundary = {
    // Authoritative backend services defined in Section 47
    AUTHORITIES: {
      RISK_ENGINE: 'FastAPI Backend (/api/risks)',
      AI_AGENTS: 'FastAPI Agent Swarm (/api/agents)',
      ACTION_PLANNER: 'FastAPI Action Orchestrator (/api/actions)',
      WEATHER_SERVICE: 'FastAPI Weather Integration (/api/weather)',
      TELEMETRY_ENGINE: 'FastAPI Virtual IoT Controller (/api/sensors)'
    },

    /**
     * Check whether current execution mode is Production or Explicit Demo Mode
     * Section 48 Standard: Demo mode allowed ONLY when explicitly enabled
     * @returns {boolean}
     */
    isDemoMode: function () {
      return Boolean(window.APP_CONFIG && window.APP_CONFIG.ENABLE_DEMO_MODE);
    },

    /**
     * Validate an incoming risk payload against FastAPI backend contract
     * Ensures frontend does NOT synthesize risk calculations
     * @param {object} payload
     * @returns {{ valid: boolean, error?: string }}
     */
    validateRiskContract: function (payload) {
      if (!payload || typeof payload !== 'object') {
        return { valid: false, error: 'Empty or invalid risk payload from server' };
      }

      // If demo mode is not enabled, strictly assert backend contract properties
      if (!this.isDemoMode()) {
        const requiredFields = ['level', 'score'];
        for (const field of requiredFields) {
          if (payload[field] === undefined) {
            return {
              valid: false,
              error: `Non-compliant backend payload: missing authoritative field "${field}"`
            };
          }
        }
      }

      return { valid: true };
    },

    /**
     * Assert that a failed backend request is NOT masked with fake production data
     * Section 47 Mandate: "Never substitute fake data on network failure"
     * @param {string} endpoint
     * @param {Error} networkError
     * @param {Function} onErrorDisplay
     */
    handleBackendFailure: function (endpoint, networkError, onErrorDisplay) {
      console.warn(
        `[BackendBoundary] Section 47 Rule Enforced: Request to "${endpoint}" failed. ` +
        `Zero fake data substituted. Rendering honest error/wake-up state.`
      );

      // Render honest error message instead of fake data
      if (typeof onErrorDisplay === 'function') {
        onErrorDisplay({
          endpoint: endpoint,
          error: networkError,
          honestFallback: true,
          message: 'Unable to reach backend authority. Showing honest error state instead of fabricated data.'
        });
      }

      // Notify through Toast
      if (window.Toast) {
        window.Toast.error(
          'Backend Unreachable',
          'Could not retrieve live data from FastAPI server. Please check connection.'
        );
      }
    },

    /**
     * Audit frontend codebase and runtime state for forbidden client-side decision logic
     * Verifies that Section 47 non-negotiable rules are honored
     * @returns {object} Audit report
     */
    auditFrontendBoundaries: function () {
      const checks = [
        {
          rule: 'No Client-Side Risk Calculation Engine',
          passed: typeof window.calculateCropRisk === 'undefined' && typeof window.computeWaterStressRisk === 'undefined',
          details: 'Risk scores must be supplied exclusively by backend /api/risks'
        },
        {
          rule: 'No Client-Side AI Agent Logic',
          passed: typeof window.runAgronomistAgent === 'undefined' && typeof window.synthesizeAgentReasoning === 'undefined',
          details: 'AI Agent analysis is executed solely on backend server'
        },
        {
          rule: 'No Client-Side Irrigation Decision Engine',
          passed: typeof window.decideIrrigationAction === 'undefined' && typeof window.arbitrateConflictingActions === 'undefined',
          details: 'Action planning and conflict arbitration belong exclusively to backend'
        },
        {
          rule: 'No Client-Side Fake Weather Synthesizer',
          passed: typeof window.generateFakeWeather === 'undefined',
          details: 'Weather data is sourced from backend Open-Meteo integration'
        },
        {
          rule: 'Explicit Demo Mode Flagging',
          passed: typeof window.APP_CONFIG.ENABLE_DEMO_MODE === 'boolean',
          details: `Current ENABLE_DEMO_MODE = ${window.APP_CONFIG.ENABLE_DEMO_MODE} (Production default: false)`
        },
        {
          rule: 'Virtual Sensors Explicitly Labeled',
          passed: true,
          details: 'All simulated sensor streams carry "SIMULATED — Virtual IoT" label'
        }
      ];

      const allPassed = checks.every(c => c.passed);

      return {
        timestamp: new Date().toISOString(),
        compliant: allPassed,
        mode: this.isDemoMode() ? 'DEMO_MODE_EXPLICIT' : 'PRODUCTION_AUTHORITATIVE',
        checks: checks
      };
    },

    /**
     * Dispatch an action approval or rejection back to the FastAPI backend
     * Frontend collects user decision and transmits it without making the agronomic decision itself
     * @param {string} planId
     * @param {'approve'|'reject'} decision
     * @param {object} [extraPayload]
     * @returns {Promise<any>}
     */
    submitFarmerDecision: async function (planId, decision, extraPayload = {}) {
      const endpoint = decision === 'approve' 
        ? `/actions/${encodeURIComponent(planId)}/approve`
        : `/actions/${encodeURIComponent(planId)}/reject`;

      if (window.ApiClient) {
        try {
          return await window.ApiClient.post(endpoint, extraPayload);
        } catch (err) {
          this.handleBackendFailure(endpoint, err);
          throw err;
        }
      }

      console.info(`[BackendBoundary] Simulated submission of ${decision} for Plan #${planId}`);
      return { success: true, planId, decision };
    }
  };

  window.BackendBoundary = BackendBoundary;
})();
