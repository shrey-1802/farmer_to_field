/**
 * KrishiNirnay AI - Utility Functions & Security Sanitizers
 * Section 31, 35, 41, 52 Compliance
 */

(function () {
  'use strict';

  const Utils = {
    /**
     * Escape raw HTML strings to prevent XSS injection (Phase 35)
     * @param {string} str
     * @returns {string}
     */
    escapeHtml: function (str) {
      if (typeof str !== 'string') return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    /**
     * Sanitize Error Message & Suppress Stack Traces
     * MANDATORY Phase 31 & Phase 35 Requirement:
     * Never expose raw Python tracebacks, file paths, database schemas, or internal exceptions to farmers.
     * @param {string|object} rawError
     * @returns {string} Safe user-facing string
     */
    sanitizeErrorMessage: function (rawError) {
      if (!rawError) {
        return 'An unknown issue occurred. Please try again.';
      }

      let errorText = '';
      if (typeof rawError === 'string') {
        errorText = rawError;
      } else if (rawError && typeof rawError.message === 'string') {
        errorText = rawError.message;
      } else if (rawError && typeof rawError.detail === 'string') {
        errorText = rawError.detail;
      } else {
        try {
          errorText = JSON.stringify(rawError);
        } catch (_) {
          errorText = 'An unexpected error occurred.';
        }
      }

      // Detection signatures for stack traces and sensitive technical leaks
      const stackTraceSignatures = [
        /traceback \(most recent call last\):/i,
        /File ".*?", line \d+/i,
        /at Object\..*?\(.*?:\d+:\d+\)/i,
        /at async /i,
        /SQLAlchemyError/i,
        /psycopg2\./i,
        /pymongo\./i,
        /InternalServerError/i,
        /Exception in ASGI application/i,
        /<class '.*?'/i,
      ];

      for (let i = 0; i < stackTraceSignatures.length; i++) {
        if (stackTraceSignatures[i].test(errorText)) {
          console.warn('[KrishiNirnay Security] Stack trace detected in response; suppressed from farmer UI.');
          return 'The server encountered an unexpected situation. Our technical team has been logged this event. Please try again shortly.';
        }
      }

      // Clean HTML tags and limit length
      const cleaned = errorText
        .replace(/<[^>]*>?/gm, '')
        .trim();

      if (cleaned.length > 250) {
        return cleaned.substring(0, 247) + '...';
      }

      return cleaned || 'An error occurred. Please try again.';
    },

    /**
     * Safely insert text into a DOM node using textContent
     * @param {HTMLElement|string} target Element or selector
     * @param {string} text Text content
     */
    safeSetText: function (target, text) {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) {
        el.textContent = text == null ? '' : String(text);
      }
    },

    /**
     * Relative time formatter
     * @param {string|number|Date} dateInput
     * @returns {string}
     */
    formatRelativeTime: function (dateInput) {
      if (!dateInput) return 'Just now';
      const date = new Date(dateInput);
      const now = new Date();
      const elapsedSeconds = Math.floor((now - date) / 1000);

      if (elapsedSeconds < 5) return 'Just now';
      if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;
      const minutes = Math.floor(elapsedSeconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    },

    /**
     * Generate fallback client-side request ID if backend did not supply one
     * @returns {string}
     */
    generateRequestId: function () {
      return 'req_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    },

    /**
     * Debounce utility for input handlers and search
     * @param {Function} fn
     * @param {number} delay
     * @returns {Function}
     */
    debounce: function (fn, delay) {
      let timer = null;
      return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
          fn.apply(context, args);
        }, delay || 250);
      };
    },

    /**
     * Compute relative path to root for GitHub Pages subfolder compatibility
     * @param {string} path Path relative to project root
     * @returns {string}
     */
    getRelativePath: function (path) {
      if (!path) return '';
      // If path starts with slash, make it relative
      if (path.startsWith('/')) {
        return '.' + path;
      }
      return path;
    },

    /**
     * Detect if running on GitHub Pages domain (*.github.io)
     * @returns {boolean}
     */
    isGitHubPages: function () {
      return window.location.hostname.endsWith('github.io');
    },

    /**
     * Get base path of current deployment (supports repo subpaths like /farmer_to_field/)
     * @returns {string}
     */
    getBasePath: function () {
      const pathname = window.location.pathname;
      if (this.isGitHubPages()) {
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length > 0) {
          return '/' + segments[0] + '/';
        }
      }
      return '/';
    },

    /**
     * Resolve URL relative to current location, preserving subpath routing
     * @param {string} target
     * @returns {string}
     */
    resolveUrl: function (target) {
      try {
        return new URL(target, window.location.href).href;
      } catch (_) {
        return target;
      }
    },

    /**
     * Audit DOM elements on page to verify zero absolute paths
     * Section 55 Compliance Check
     * @returns {{ compliant: boolean, totalChecked: number, violations: Array<string> }}
     */
    auditStaticAssetPaths: function () {
      const violations = [];
      let totalChecked = 0;

      // Check scripts
      document.querySelectorAll('script[src]').forEach(el => {
        totalChecked++;
        const src = el.getAttribute('src');
        if (src && (src.startsWith('/') && !src.startsWith('//'))) {
          violations.push(`Script with absolute root path: ${src}`);
        }
      });

      // Check stylesheets
      document.querySelectorAll('link[rel="stylesheet"]').forEach(el => {
        totalChecked++;
        const href = el.getAttribute('href');
        if (href && (href.startsWith('/') && !href.startsWith('//'))) {
          violations.push(`Stylesheet with absolute root path: ${href}`);
        }
      });

      // Check internal anchors
      document.querySelectorAll('a[href]').forEach(el => {
        const href = el.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
          totalChecked++;
          if (href.startsWith('/') && !href.startsWith('//')) {
            violations.push(`Anchor with absolute root path: ${href}`);
          }
        }
      });

      return {
        compliant: violations.length === 0,
        totalChecked,
        violations
      };
    }
  };

  window.Utils = Utils;
})();

