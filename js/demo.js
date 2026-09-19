/**
 * KrishiNirnay AI - Explicit Demo Mode Controller & Scenario Fixtures
 * Section 48 (Phase 42) Compliance
 *
 * Requirements:
 * 1. Demo mode allowed ONLY when explicitly enabled (APP_CONFIG.ENABLE_DEMO_MODE or localStorage).
 * 2. Visually labeled: "DEMO MODE" / "SIMULATION MODE".
 * 3. Never make demo data appear to be real production physical data.
 * 4. Provides isolated scenario fixtures for Phases 43 (Water Stress), 44 (Heavy Rain), and 45 (Disease).
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'krishinirnay_demo_mode';

  const DemoMode = {
    _bannerEl: null,

    /**
     * Initialize Demo Mode from config or localStorage
     */
    init: function () {
      let isEnabled = false;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          isEnabled = stored === 'true';
        } else if (window.APP_CONFIG) {
          isEnabled = Boolean(window.APP_CONFIG.ENABLE_DEMO_MODE);
        }
      } catch (_) {
        isEnabled = false;
      }

      if (window.APP_CONFIG) {
        window.APP_CONFIG.ENABLE_DEMO_MODE = isEnabled;
      }

      if (isEnabled) {
        this._renderBanner();
      }
      this._updateUIElements();
    },

    /**
     * Is demo mode currently active?
     * @returns {boolean}
     */
    isEnabled: function () {
      return Boolean(window.APP_CONFIG && window.APP_CONFIG.ENABLE_DEMO_MODE);
    },

    /**
     * Explicitly enable Demo Mode
     */
    enable: function () {
      if (window.APP_CONFIG) {
        window.APP_CONFIG.ENABLE_DEMO_MODE = true;
      }
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch (_) {}

      this._renderBanner();
      this._updateUIElements();

      window.dispatchEvent(
        new CustomEvent('krishinirnay:demo_mode_changed', {
          detail: { enabled: true, mode: 'DEMO_MODE' }
        })
      );

      if (window.Toast) {
        window.Toast.info(
          'DEMO MODE ACTIVE',
          'Simulated demonstration fixtures enabled for evaluation. All readings marked as isolated demo fixtures.'
        );
      }

      if (window.A11y) {
        window.A11y.announce('Demo mode activated. Displaying simulated demonstration fixtures.');
      }
    },

    /**
     * Explicitly disable Demo Mode (revert to strict production backend authority)
     */
    disable: function () {
      if (window.APP_CONFIG) {
        window.APP_CONFIG.ENABLE_DEMO_MODE = false;
      }
      try {
        localStorage.setItem(STORAGE_KEY, 'false');
      } catch (_) {}

      this._removeBanner();
      this._updateUIElements();

      window.dispatchEvent(
        new CustomEvent('krishinirnay:demo_mode_changed', {
          detail: { enabled: false, mode: 'PRODUCTION' }
        })
      );

      if (window.Toast) {
        window.Toast.success(
          'Production Mode Restored',
          'Demo mode disabled. Strict FastAPI backend authority active.'
        );
      }

      if (window.A11y) {
        window.A11y.announce('Demo mode deactivated. Restored production mode.');
      }
    },

    /**
     * Toggle Demo Mode
     */
    toggle: function () {
      if (this.isEnabled()) {
        this.disable();
      } else {
        this.enable();
      }
    },

    /**
     * Render high-visibility top demo banner
     */
    _renderBanner: function () {
      if (this._bannerEl || document.getElementById('global-demo-banner')) {
        return;
      }

      const banner = document.createElement('div');
      banner.id = 'global-demo-banner';
      banner.className = 'demo-mode-banner';
      banner.setAttribute('role', 'status');
      banner.setAttribute('aria-label', 'Demo Mode Notification');

      banner.innerHTML = `
        <div class="demo-banner-content">
          <span class="demo-banner-tag">⚡ DEMO MODE ACTIVE</span>
          <span>Simulated demonstration fixtures active for offline hackathon evaluation. Not live physical sensors.</span>
        </div>
        <button type="button" class="demo-banner-exit-btn" onclick="DemoMode.disable()">
          Exit Demo Mode
        </button>
      `;

      document.body.insertBefore(banner, document.body.firstChild);
      this._bannerEl = banner;
    },

    /**
     * Remove top demo banner
     */
    _removeBanner: function () {
      const banner = document.getElementById('global-demo-banner');
      if (banner && banner.parentNode) {
        banner.parentNode.removeChild(banner);
      }
      this._bannerEl = null;
    },

    /**
     * Update UI tags/badges across header
     */
    _updateUIElements: function () {
      const badges = document.querySelectorAll('.demo-mode-indicator');
      const isDemo = this.isEnabled();

      badges.forEach(b => {
        b.style.display = isDemo ? 'inline-flex' : 'none';
        b.textContent = 'DEMO MODE';
      });
    },

    /**
     * =========================================================================
     * Explicitly Tagged Isolated Demo Fixtures (Section 48, 49, 50, 51)
     * All fixtures strictly marked with source: "DEMO — Isolated Fixture"
     * =========================================================================
     */
    getFixtures: function () {
      return {
        // Phase 43: Water Stress Fixture
        waterStress: {
          id: 'demo_scenario_water_stress',
          name: 'Critical Water Stress Deficit',
          is_demo: true,
          source: 'DEMO — Isolated Fixture (Simulated)',
          field: {
            id: 'field_demo_01',
            name: 'North Orchard Block B',
            crop: 'Pomegranate (Bhagwa)',
            areaHectares: 2.4
          },
          telemetry: {
            soilMoisture: 24.2,
            soilTemp: 31.5,
            humidity: 42.0,
            threshold: 40.0,
            status: 'CRITICAL_DEFICIT'
          },
          risk: {
            id: 'risk_demo_ws_01',
            level: 'CRITICAL',
            score: 88.5,
            factor: 'Soil Moisture Deficit (24.2% < 40% threshold)',
            explanation: 'Sustained moisture deficit during fruit development stage. High risk of fruit dropping and sun scalding.'
          },
          actionPlan: {
            id: 'plan_demo_ws_01',
            action: '30-minute Drip Irrigation Pulse on Zone North-2',
            zone: 'Zone North-2',
            estimatedDurationMin: 30,
            waterVolumeLiters: 1250,
            status: 'PENDING_APPROVAL'
          }
        },

        // Phase 44: Heavy Rain Conflict Fixture
        heavyRain: {
          id: 'demo_scenario_heavy_rain',
          name: 'Heavy Rainfall & Waterlogging Alert',
          is_demo: true,
          source: 'DEMO — Isolated Fixture (Simulated)',
          weather: {
            condition: 'Heavy Monsoonal Rain',
            forecastMm: 68.0,
            windowHours: 24,
            rainProbability: 92
          },
          telemetry: {
            soilMoisture: 65.0,
            soilTemp: 24.0,
            status: 'SATURATION_RISK'
          },
          conflict: {
            plannedAction: 'Scheduled Fertilizer Drip Fertigation',
            conflictReason: 'Heavy rainfall (> 50mm) will cause fertilizer leaching and root suffocation.',
            resolution: 'Postpone scheduled irrigation and fertigation by 48 hours.'
          }
        },

        // Phase 45: Drone Disease Fixture
        diseaseOutbreak: {
          id: 'demo_scenario_disease',
          name: 'Bacterial Blight Detection via Drone Multispectral Imaging',
          is_demo: true,
          source: 'DEMO — Isolated Fixture (Simulated)',
          drone: {
            flightId: 'flight_drone_044',
            altitudeMeters: 45,
            areaCoveredHa: 3.2,
            ndviAnomalyScore: 0.74,
            canopyHumidityIndex: 88.5
          },
          detection: {
            diseaseName: 'Bacterial Blight (Xanthomonas axonopodis)',
            confidence: 0.93,
            affectedFoliagePercent: 18.5,
            recommendedTreatment: 'Apply Copper Oxychloride 50 WP (2.5g/L) + Streptocycline (0.5g/L) targeted foliar spray.'
          }
        }
      };
    }
  };

  // Export globally to window
  window.DemoMode = DemoMode;

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DemoMode.init());
  } else {
    DemoMode.init();
  }
})();
