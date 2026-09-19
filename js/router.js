/**
 * KrishiNirnay AI - URL & Page State Management (Deep Linking)
 * Strict compliance with Section 54 (Phase 48):
 * field-details.html?field=123
 * agent-details.html?id=soil-agent
 * action-plans.html?action=456
 * execution.html?task=789
 *
 * Validates all IDs before sending API requests or applying state.
 * Uses pure HTML5 History API (pushState/replaceState) - Zero framework dependency.
 */

(function () {
  'use strict';

  const ID_PATTERNS = {
    field: /^[a-zA-Z0-9_-]{1,32}$/,
    action: /^[a-zA-Z0-9_-]{1,32}$/,
    task: /^[a-zA-Z0-9_-]{1,64}$/,
    id: /^[a-zA-Z0-9_-]{1,32}$/,
    agent: /^[a-zA-Z0-9_-]{1,32}$/,
    scenario: /^(water_stress|heavy_rain|disease|baseline)$/
  };

  const UrlState = {
    /**
     * Validate an ID string against expected entity pattern
     * Strict requirement from Section 54: "Validate IDs before sending API requests"
     * @param {string} id
     * @param {string} type - 'field' | 'action' | 'task' | 'agent' | 'scenario' | 'id'
     * @returns {{ valid: boolean, sanitized: string|null, error: string|null }}
     */
    validateId: function (id, type = 'id') {
      if (id === null || id === undefined) {
        return { valid: false, sanitized: null, error: 'ID is missing.' };
      }

      const str = String(id).trim();
      if (!str) {
        return { valid: false, sanitized: null, error: 'ID cannot be empty.' };
      }

      // Security defense: Reject dangerous characters or traversal attempts
      if (str.includes('../') || str.includes('..\\') || /<|>|'|"|`|;|\0/.test(str)) {
        return { valid: false, sanitized: null, error: 'Invalid characters detected in ID.' };
      }

      const pattern = ID_PATTERNS[type] || ID_PATTERNS.id;
      if (!pattern.test(str)) {
        return {
          valid: false,
          sanitized: null,
          error: `ID "${str}" does not match required format for entity type "${type}".`
        };
      }

      return { valid: true, sanitized: str, error: null };
    },

    /**
     * Get all current URL query parameters as an object
     * @returns {Object}
     */
    getParams: function () {
      try {
        const search = window.location.search;
        const params = new URLSearchParams(search);
        const result = {};
        for (const [k, v] of params.entries()) {
          result[k] = v;
        }
        return result;
      } catch (_) {
        return {};
      }
    },

    /**
     * Get a specific query parameter value
     * @param {string} key
     * @returns {string|null}
     */
    get: function (key) {
      try {
        const params = new URLSearchParams(window.location.search);
        return params.get(key);
      } catch (_) {
        return null;
      }
    },

    /**
     * Update a single query parameter in browser address bar without page reload
     * @param {string} key
     * @param {string|number|null} value
     * @param {boolean} [replace=false]
     */
    setParam: function (key, value, replace = false) {
      try {
        const url = new URL(window.location.href);
        if (value === null || value === undefined || value === '') {
          url.searchParams.delete(key);
        } else {
          url.searchParams.set(key, String(value));
        }

        if (replace) {
          window.history.replaceState({ path: url.href }, '', url.href);
        } else {
          window.history.pushState({ path: url.href }, '', url.href);
        }

        window.dispatchEvent(
          new CustomEvent('krishinirnay:url_changed', {
            detail: { key, value, search: url.search, url: url.href }
          })
        );
      } catch (err) {
        console.warn('[UrlState] Unable to update browser URL history:', err);
      }
    },

    /**
     * Set multiple query parameters in batch
     * @param {Object} paramsObj
     * @param {boolean} [replace=false]
     */
    setParams: function (paramsObj, replace = false) {
      try {
        const url = new URL(window.location.href);
        for (const [k, v] of Object.entries(paramsObj)) {
          if (v === null || v === undefined || v === '') {
            url.searchParams.delete(k);
          } else {
            url.searchParams.set(k, String(v));
          }
        }

        if (replace) {
          window.history.replaceState({ path: url.href }, '', url.href);
        } else {
          window.history.pushState({ path: url.href }, '', url.href);
        }

        window.dispatchEvent(
          new CustomEvent('krishinirnay:url_changed', {
            detail: { params: paramsObj, search: url.search, url: url.href }
          })
        );
      } catch (err) {
        console.warn('[UrlState] Unable to batch update URL history:', err);
      }
    },

    /**
     * Remove a query parameter
     * @param {string} key
     */
    removeParam: function (key) {
      this.setParam(key, null, true);
    },

    /**
     * Get the full shareable URL with current parameters
     * @returns {string}
     */
    getShareableUrl: function () {
      return window.location.href;
    },

    /**
     * Copy shareable deep link to clipboard
     * @returns {Promise<boolean>}
     */
    copyShareableUrl: async function () {
      const url = this.getShareableUrl();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
          if (window.Toast) {
            window.Toast.success('Deep Link Copied', 'URL copied to clipboard.');
          }
          return true;
        }
      } catch (_) {}

      // Fallback
      if (window.Toast) {
        window.Toast.info('Deep Link', url);
      }
      return false;
    },

    /**
     * Initialize deep link inspection and synchronization on page load
     */
    init: function () {
      // Listen for browser Back/Forward navigation
      window.addEventListener('popstate', (e) => {
        window.dispatchEvent(
          new CustomEvent('krishinirnay:url_changed', {
            detail: { search: window.location.search, url: window.location.href, fromPopState: true }
          })
        );
      });

      // Synchronize with AppState where applicable
      const params = this.getParams();

      // Check field param
      if (params.field) {
        const check = this.validateId(params.field, 'field');
        if (check.valid && window.AppState) {
          window.AppState.set('currentField', { id: check.sanitized, name: `Field #${check.sanitized}`, crop: 'Deep-Linked' });
        }
      }

      // Check scenario param
      if (params.scenario) {
        const check = this.validateId(params.scenario, 'scenario');
        if (check.valid) {
          setTimeout(() => {
            if (check.sanitized === 'water_stress' && window.WaterStressDemo) {
              window.WaterStressDemo.goToStage(1);
            } else if (check.sanitized === 'heavy_rain' && window.HeavyRainDemo) {
              window.HeavyRainDemo.goToStage(1);
            } else if (check.sanitized === 'disease' && window.DiseaseDemo) {
              window.DiseaseDemo.selectPreset('pomegranate_blight');
            }
          }, 300);
        }
      }
    }
  };

  UrlState.init();
  window.UrlState = UrlState;
})();
