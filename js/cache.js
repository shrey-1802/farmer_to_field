/**
 * KrishiNirnay AI - Performance, Caching & Smart Polling Suite
 * Section 43 (Phase 37) Compliance
 * Read-Only Response Caching, Cache Invalidation, and Visibility-Aware Polling
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. Safe Read-Only Response Cache Manager
  // =========================================================================
  const CacheManager = {
    _memoryCache: new Map(),

    /**
     * Generate cache key from endpoint and query parameters
     * @param {string} endpoint
     * @param {object} [params]
     * @returns {string}
     */
    generateKey: function (endpoint, params = {}) {
      const cleanEndpoint = endpoint.replace(/^\/+/, '').split('?')[0];
      const sortedKeys = Object.keys(params).sort();
      const queryStr = sortedKeys.map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
      return `cache_${cleanEndpoint}${queryStr ? '?' + queryStr : ''}`;
    },

    /**
     * Store data in cache with TTL
     * @param {string} key
     * @param {any} data
     * @param {number} [ttlMs=300000] Default 5 minutes
     */
    set: function (key, data, ttlMs = 300000) {
      const entry = {
        data: data,
        expiresAt: Date.now() + ttlMs,
        cachedAt: Date.now(),
      };
      this._memoryCache.set(key, entry);

      // Session storage backup for survival across page reloads
      try {
        sessionStorage.setItem('krishi_' + key, JSON.stringify(entry));
      } catch (_) {}
    },

    /**
     * Retrieve cached data if valid and unexpired
     * @param {string} key
     * @returns {any|null}
     */
    get: function (key) {
      let entry = this._memoryCache.get(key);

      if (!entry) {
        try {
          const stored = sessionStorage.getItem('krishi_' + key);
          if (stored) {
            entry = JSON.parse(stored);
            this._memoryCache.set(key, entry);
          }
        } catch (_) {
          entry = null;
        }
      }

      if (!entry) return null;

      if (Date.now() > entry.expiresAt) {
        this.invalidate(key);
        return null;
      }

      return entry.data;
    },

    /**
     * Invalidate a single key or pattern
     * @param {string|RegExp} pattern
     */
    invalidate: function (pattern) {
      if (typeof pattern === 'string') {
        this._memoryCache.delete(pattern);
        try {
          sessionStorage.removeItem('krishi_' + pattern);
        } catch (_) {}
        return;
      }

      if (pattern instanceof RegExp) {
        for (const key of this._memoryCache.keys()) {
          if (pattern.test(key)) {
            this._memoryCache.delete(key);
            try {
              sessionStorage.removeItem('krishi_' + key);
            } catch (_) {}
          }
        }
      }
    },

    /**
     * Purge all cache
     */
    clearAll: function () {
      this._memoryCache.clear();
      try {
        Object.keys(sessionStorage)
          .filter(k => k.startsWith('krishi_cache_'))
          .forEach(k => sessionStorage.removeItem(k));
      } catch (_) {}
    }
  };

  // =========================================================================
  // 2. Smart Polling Manager with Page Visibility Awareness
  // Section 43: "Stop polling when the page is hidden or the task completes"
  // =========================================================================
  class PollTask {
    /**
     * @param {object} config
     * @param {string} config.id Unique task identifier
     * @param {Function} config.fn Polling callback returning { done: boolean, data?: any }
     * @param {number} [config.intervalMs=4000] Polling frequency
     * @param {number} [config.maxDurationMs=120000] Max polling window (2 min)
     * @param {Function} [config.onProgress]
     * @param {Function} [config.onComplete]
     * @param {Function} [config.onError]
     */
    constructor({ id, fn, intervalMs = 4000, maxDurationMs = 120000, onProgress, onComplete, onError }) {
      this.id = id;
      this.fn = fn;
      this.intervalMs = intervalMs;
      this.maxDurationMs = maxDurationMs;
      this.onProgress = onProgress;
      this.onComplete = onComplete;
      this.onError = onError;

      this.timerId = null;
      this.startTime = null;
      this.isPaused = false;
      this.isStopped = false;
      this.pollCount = 0;
    }

    start() {
      this.startTime = Date.now();
      this.isStopped = false;
      this.isPaused = false;
      this.pollCount = 0;
      this._scheduleNext();
    }

    pause() {
      this.isPaused = true;
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
    }

    resume() {
      if (this.isStopped) return;
      this.isPaused = false;
      this._scheduleNext(100); // Resume immediately
    }

    stop() {
      this.isStopped = true;
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
    }

    _scheduleNext(delay) {
      if (this.isStopped || this.isPaused) return;

      const wait = delay != null ? delay : this.intervalMs;
      this.timerId = setTimeout(async () => {
        if (this.isStopped || this.isPaused) return;

        // Check timeout
        if (Date.now() - this.startTime > this.maxDurationMs) {
          this.stop();
          if (typeof this.onError === 'function') {
            this.onError(new Error(`Polling task ${this.id} exceeded max time limit (${this.maxDurationMs / 1000}s).`));
          }
          return;
        }

        try {
          this.pollCount++;
          const result = await this.fn(this.pollCount);

          if (typeof this.onProgress === 'function') {
            this.onProgress(result, this.pollCount);
          }

          if (result && result.done) {
            this.stop();
            if (typeof this.onComplete === 'function') {
              this.onComplete(result);
            }
            return;
          }

          this._scheduleNext();
        } catch (err) {
          if (typeof this.onError === 'function') {
            this.onError(err);
          }
          this._scheduleNext(); // Continue until max time or stop
        }
      }, wait);
    }
  }

  const PollManager = {
    _tasks: new Map(),

    init: function () {
      // Listen for tab visibility changes (Section 43)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          console.info('[Performance] Page hidden; pausing all active background polling tasks.');
          this._tasks.forEach(task => task.pause());
        } else {
          console.info('[Performance] Page visible; resuming active background polling tasks.');
          this._tasks.forEach(task => task.resume());
        }
      });
    },

    /**
     * Start a smart polling task
     * @param {object} config
     * @returns {PollTask}
     */
    start: function (config) {
      if (this._tasks.has(config.id)) {
        this._tasks.get(config.id).stop();
      }

      const task = new PollTask(config);
      this._tasks.set(config.id, task);
      task.start();
      return task;
    },

    stop: function (id) {
      if (this._tasks.has(id)) {
        this._tasks.get(id).stop();
        this._tasks.delete(id);
      }
    },

    stopAll: function () {
      this._tasks.forEach(task => task.stop());
      this._tasks.clear();
    }
  };

  PollManager.init();

  window.CacheManager = CacheManager;
  window.PollManager = PollManager;
})();
