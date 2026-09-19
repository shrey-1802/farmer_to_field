/**
 * KrishiNirnay AI - Lightweight State Management
 * Section 53 (Phase 47) Compliance
 * Pure Vanilla JS Object - Zero Framework Overhead
 */

(function () {
  'use strict';

  const STORAGE_PREFIX = 'krishinirnay_';

  const AppState = {
    // 7 Canonical State Properties (Section 53)
    currentUser: null,
    currentFarm: null,
    currentField: null,
    currentZone: null,
    simulationMode: false,
    selectedSensor: null,
    notifications: [],

    _subscribers: {},

    /**
     * Initialize state from storage where applicable
     */
    init: function () {
      try {
        const cachedUser = localStorage.getItem(STORAGE_PREFIX + 'user');
        if (cachedUser) {
          this.currentUser = JSON.parse(cachedUser);
        }
        const cachedFarm = localStorage.getItem(STORAGE_PREFIX + 'farm');
        if (cachedFarm) {
          this.currentFarm = JSON.parse(cachedFarm);
        }
        const cachedField = localStorage.getItem(STORAGE_PREFIX + 'field');
        if (cachedField) {
          this.currentField = JSON.parse(cachedField);
        }
        const cachedZone = localStorage.getItem(STORAGE_PREFIX + 'zone');
        if (cachedZone) {
          this.currentZone = JSON.parse(cachedZone);
        }
      } catch (_) {
        this.currentUser = null;
      }
    },

    /**
     * Get a single state property
     * @param {string} key
     * @returns {any}
     */
    get: function (key) {
      return this[key];
    },

    /**
     * Get a snapshot of all state properties
     * @returns {Object}
     */
    getAll: function () {
      return {
        currentUser: this.currentUser,
        currentFarm: this.currentFarm,
        currentField: this.currentField,
        currentZone: this.currentZone,
        simulationMode: this.simulationMode,
        selectedSensor: this.selectedSensor,
        notifications: [...this.notifications]
      };
    },

    /**
     * Update state and notify subscribers via CustomEvent & direct callbacks
     * @param {string} key
     * @param {any} value
     * @param {boolean} [persist=false]
     */
    set: function (key, value, persist = false) {
      const oldValue = this[key];
      this[key] = value;

      if (persist) {
        try {
          if (value == null) {
            localStorage.removeItem(STORAGE_PREFIX + key);
          } else {
            localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
          }
        } catch (_) {}
      }

      // Dispatch global CustomEvent for UI components
      window.dispatchEvent(
        new CustomEvent('krishinirnay:state_changed', {
          detail: { key, value, oldValue, timestamp: new Date().toISOString() }
        })
      );

      // Notify direct subscribers registered via subscribe()
      if (this._subscribers[key]) {
        this._subscribers[key].forEach(fn => {
          try {
            fn(value, oldValue);
          } catch (e) {
            console.error(`[AppState] Listener error for key "${key}":`, e);
          }
        });
      }
    },

    /**
     * Subscribe to state changes on a specific key
     * @param {string} key
     * @param {Function} callback
     * @returns {Function} Unsubscribe handle
     */
    subscribe: function (key, callback) {
      if (!this._subscribers[key]) {
        this._subscribers[key] = [];
      }
      this._subscribers[key].push(callback);

      // Return unsubscribe function for memory cleanup
      return () => {
        this._subscribers[key] = this._subscribers[key].filter(fn => fn !== callback);
      };
    },

    /**
     * Set active farm
     * @param {Object|null} farm
     */
    selectFarm: function (farm) {
      this.set('currentFarm', farm, true);
    },

    /**
     * Set active field
     * @param {Object|null} field
     */
    selectField: function (field) {
      this.set('currentField', field, true);
    },

    /**
     * Set active zone
     * @param {Object|null} zone
     */
    selectZone: function (zone) {
      this.set('currentZone', zone, true);
    },

    /**
     * Set active sensor for telemetry inspection
     * @param {Object|null} sensor
     */
    selectSensor: function (sensor) {
      this.set('selectedSensor', sensor, false);
    },

    /**
     * Toggle simulation mode flag
     * @returns {boolean}
     */
    toggleSimulationMode: function () {
      const next = !this.simulationMode;
      this.set('simulationMode', next, false);
      return next;
    },

    /**
     * Append a notification to state
     * @param {Object} notif - { id, title, message, type, time }
     */
    addNotification: function (notif) {
      const item = {
        id: notif.id || 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title: notif.title || 'System Notification',
        message: notif.message || '',
        type: notif.type || 'info',
        time: notif.time || new Date().toLocaleTimeString()
      };
      const updated = [item, ...this.notifications].slice(0, 50); // keep last 50
      this.set('notifications', updated, false);
      window.dispatchEvent(new CustomEvent('krishinirnay:notification_added', { detail: item }));
      return item;
    },

    /**
     * Clear all notifications
     */
    clearNotifications: function () {
      this.set('notifications', [], false);
    },

    /**
     * Reset state on logout or clean initialization
     */
    reset: function () {
      this.currentUser = null;
      this.currentFarm = null;
      this.currentField = null;
      this.currentZone = null;
      this.simulationMode = false;
      this.selectedSensor = null;
      this.notifications = [];

      try {
        localStorage.removeItem(STORAGE_PREFIX + 'user');
        localStorage.removeItem(STORAGE_PREFIX + 'token');
        localStorage.removeItem(STORAGE_PREFIX + 'farm');
        localStorage.removeItem(STORAGE_PREFIX + 'field');
        localStorage.removeItem(STORAGE_PREFIX + 'zone');
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('krishinirnay:state_reset'));
    }
  };

  AppState.init();
  window.AppState = AppState;
})();
