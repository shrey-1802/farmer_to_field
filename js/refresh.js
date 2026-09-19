/**
 * KrishiNirnay AI - Data Refresh Strategy
 * Section 44 (Phase 38) Compliance
 * Selective refresh rhythms: Periodic for Dashboard/Sensors, Short Polling for Execution, Freshness TTL for Weather
 */

(function () {
  'use strict';

  const RefreshStrategy = {
    // Configured standard intervals according to Section 44 and Section 58 (Code Quality)
    get INTERVALS() {
      const config = window.APP_CONFIG || {};
      return {
        DASHBOARD: config.POLL_INTERVAL_DASHBOARD_MS || 30000,      // 30s periodic refresh
        SENSORS: config.POLL_INTERVAL_TELEMETRY_MS || 15000,        // 15s virtual telemetry refresh
        EXECUTION: config.POLL_INTERVAL_ACTIVE_MS || 2500,          // 2.5s short polling ONLY while active
        NOTIFICATIONS: 45000,                                       // 45s notification stream refresh
        WEATHER_TTL: 900000,                                        // 15 minutes backend weather freshness
      };
    },

    _activeTimers: new Map(),

    /**
     * Start periodic dashboard refresh routine
     * @param {Function} refreshFn
     * @returns {string} Timer ID
     */
    startDashboardSync: function (refreshFn) {
      const id = 'refresh_dashboard';
      this.stop(id);

      if (window.PollManager) {
        const task = window.PollManager.start({
          id: id,
          intervalMs: this.INTERVALS.DASHBOARD,
          fn: async () => {
            if (typeof refreshFn === 'function') {
              await refreshFn();
            }
            return { done: false };
          }
        });
        this._activeTimers.set(id, task);
      }
      return id;
    },

    /**
     * Start virtual sensor telemetry periodic refresh
     * @param {string|number} fieldId
     * @param {Function} refreshFn
     * @returns {string} Timer ID
     */
    startSensorSync: function (fieldId, refreshFn) {
      const id = `refresh_sensors_field_${fieldId}`;
      this.stop(id);

      if (window.PollManager) {
        const task = window.PollManager.start({
          id: id,
          intervalMs: this.INTERVALS.SENSORS,
          fn: async () => {
            if (typeof refreshFn === 'function') {
              await refreshFn(fieldId);
            }
            return { done: false };
          }
        });
        this._activeTimers.set(id, task);
      }
      return id;
    },

    /**
     * Start short polling for active execution tasks (drip irrigation, pump activation)
     * Section 44: "Execution: short polling while active. Stop when completed."
     * @param {string} taskId
     * @param {object} options
     * @param {Function} options.checkStatusFn Returns { done: boolean, status: string, progress: number }
     * @param {Function} [options.onProgress]
     * @param {Function} [options.onComplete]
     */
    startExecutionShortPolling: function (taskId, options = {}) {
      const id = `execution_poll_${taskId}`;
      this.stop(id);

      if (window.PollManager) {
        const task = window.PollManager.start({
          id: id,
          intervalMs: this.INTERVALS.EXECUTION,
          maxDurationMs: 60000, // Safety limit
          fn: async (count) => {
            if (typeof options.checkStatusFn === 'function') {
              return await options.checkStatusFn(count);
            }
            // Simulated execution step if checkStatusFn not provided
            const progress = Math.min(100, count * 25);
            const isDone = progress >= 100;
            return {
              done: isDone,
              status: isDone ? 'COMPLETED' : 'EXECUTING',
              progress: progress,
              taskId: taskId
            };
          },
          onProgress: options.onProgress,
          onComplete: (res) => {
            this._activeTimers.delete(id);
            if (typeof options.onComplete === 'function') {
              options.onComplete(res);
            }
          },
          onError: options.onError
        });
        this._activeTimers.set(id, task);
      }
      return id;
    },

    /**
     * Start periodic notification refresh routine
     * @param {Function} refreshFn
     */
    startNotificationSync: function (refreshFn) {
      const id = 'refresh_notifications';
      this.stop(id);

      if (window.PollManager) {
        const task = window.PollManager.start({
          id: id,
          intervalMs: this.INTERVALS.NOTIFICATIONS,
          fn: async () => {
            if (typeof refreshFn === 'function') {
              await refreshFn();
            }
            return { done: false };
          }
        });
        this._activeTimers.set(id, task);
      }
      return id;
    },

    /**
     * Check weather data according to backend freshness TTL (Section 44)
     * Avoids repeatedly calling weather APIs if cached data is fresh
     * @param {Function} fetchWeatherFn
     * @returns {Promise<any>}
     */
    getWeatherWithFreshness: async function (fetchWeatherFn) {
      const cacheKey = 'weather_freshness_snapshot';

      if (window.CacheManager) {
        const cached = window.CacheManager.get(cacheKey);
        if (cached) {
          return { data: cached, source: 'backend_cached_fresh', freshUntil: cached.expiresAt };
        }
      }

      const freshData = typeof fetchWeatherFn === 'function' 
        ? await fetchWeatherFn()
        : { temp: 29.5, condition: 'Clear Sky', humidity: 55, last_updated: new Date().toISOString() };

      if (window.CacheManager) {
        window.CacheManager.set(cacheKey, freshData, this.INTERVALS.WEATHER_TTL);
      }

      return { data: freshData, source: 'backend_live_sync' };
    },

    /**
     * Trigger immediate refresh after scenario execution (Section 44)
     * Section 44: "Simulation: refresh after scenario execution"
     * @param {string} scenarioType ('water_stress' | 'heavy_rain' | 'disease')
     * @param {Function} onRefreshComplete
     */
    refreshAfterSimulation: async function (scenarioType, onRefreshComplete) {
      console.info(`[RefreshStrategy] Scenario "${scenarioType}" executed; triggering immediate state synchronization...`);

      // Invalidate existing telemetry cache
      if (window.CacheManager) {
        window.CacheManager.invalidate(/sensors|telemetry|risks|actions/);
      }

      if (typeof onRefreshComplete === 'function') {
        await onRefreshComplete(scenarioType);
      }

      window.dispatchEvent(
        new CustomEvent('krishinirnay:simulation_refreshed', {
          detail: { scenario: scenarioType, timestamp: new Date().toISOString() }
        })
      );
    },

    /**
     * Stop a specific refresh routine
     * @param {string} id
     */
    stop: function (id) {
      if (this._activeTimers.has(id)) {
        const task = this._activeTimers.get(id);
        if (task && typeof task.stop === 'function') {
          task.stop();
        }
        this._activeTimers.delete(id);
      }
    },

    /**
     * Stop all active refresh routines
     */
    stopAll: function () {
      this._activeTimers.forEach(task => {
        if (task && typeof task.stop === 'function') {
          task.stop();
        }
      });
      this._activeTimers.clear();
    },

    /**
     * Get snapshot of currently active refresh schedules
     * @returns {Array<{ id: string, type: string, intervalMs: number }>}
     */
    getActiveRoutines: function () {
      const list = [];
      this._activeTimers.forEach((task, id) => {
        list.push({
          id: id,
          intervalMs: task.intervalMs,
          isPaused: task.isPaused,
          pollCount: task.pollCount
        });
      });
      return list;
    }
  };

  window.RefreshStrategy = RefreshStrategy;
})();
