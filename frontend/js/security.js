/**
 * KrishiNirnay AI - Frontend Security Suite
 * Section 41 (Phase 35) Compliance
 * XSS Prevention, Input Validation, Upload Sanitization, and Authorization Shields
 */

(function () {
  'use strict';

  const Security = {
    /**
     * Escape special HTML characters to prevent XSS injection
     * @param {string} str
     * @returns {string}
     */
    escapeHtml: function (str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\//g, '&#x2F;');
    },

    /**
     * Safely insert dynamic text into an element using textContent
     * Section 41: "Use textContent for ordinary dynamic text whenever possible."
     * @param {HTMLElement|string} target
     * @param {string|number} text
     */
    safeSetText: function (target, text) {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) {
        el.textContent = text == null ? '' : String(text);
      }
    },

    /**
     * Validate agricultural numeric parameters
     * @param {number|string} value
     * @param {number} min
     * @param {number} max
     * @returns {boolean}
     */
    validateNumeric: function (value, min, max) {
      const num = Number(value);
      if (isNaN(num)) return false;
      if (min != null && num < min) return false;
      if (max != null && num > max) return false;
      return true;
    },

    /**
     * Validate resource identifiers (Field ID, Sensor ID, Action ID)
     * Must be alphanumeric with hyphens/underscores (prevent path traversal / SQLi)
     * @param {string|number} id
     * @returns {boolean}
     */
    validateId: function (id) {
      if (!id) return false;
      return /^[a-zA-Z0-9_-]{1,64}$/.test(String(id));
    },

    /**
     * Sanitize uploaded file names (Drone imagery, crop disease photos)
     * Section 41: "Sanitize uploaded file metadata"
     * Strips path traversals (../, ..\), executable extensions, and illegal characters
     * @param {string} rawName
     * @returns {string} Sanitized safe filename
     */
    sanitizeFilename: function (rawName) {
      if (!rawName || typeof rawName !== 'string') return 'upload_' + Date.now() + '.jpg';

      // Remove directory paths and traversal attempts
      let cleaned = rawName.replace(/^.*[\\\/]/, '').replace(/\.\.+/g, '');

      // Disallow dangerous executable extensions
      const dangerousExtensions = /\.(exe|bat|cmd|sh|php|pl|cgi|py|js|vbs|msi|dll|scr|bin)$/i;
      if (dangerousExtensions.test(cleaned)) {
        cleaned = cleaned.replace(dangerousExtensions, '.safe');
      }

      // Allow only safe alphanumeric characters, underscores, hyphens, and dots
      cleaned = cleaned.replace(/[^a-zA-Z0-9._-]/g, '_');

      // Ensure length limit
      if (cleaned.length > 80) {
        const parts = cleaned.split('.');
        const ext = parts.length > 1 ? '.' + parts.pop() : '';
        cleaned = parts.join('_').substring(0, 75) + ext;
      }

      return cleaned || ('file_' + Date.now() + '.jpg');
    },

    /**
     * Validate upload metadata before sending to FastAPI backend
     * @param {File|object} file
     * @param {object} [options]
     * @param {number} [options.maxSizeMb=10]
     * @param {string[]} [options.allowedTypes]
     * @returns {{ valid: boolean, error?: string, sanitizedName?: string, sizeMb?: number }}
     */
    validateUploadMetadata: function (file, options = {}) {
      if (!file) {
        return { valid: false, error: 'No file selected.' };
      }

      const maxSizeMb = options.maxSizeMb || 10;
      const allowedTypes = options.allowedTypes || [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
      ];

      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > maxSizeMb) {
        return {
          valid: false,
          error: `File size (${sizeMb.toFixed(1)} MB) exceeds maximum allowed limit of ${maxSizeMb} MB.`
        };
      }

      const mimeType = (file.type || '').toLowerCase();
      if (allowedTypes.length > 0 && !allowedTypes.includes(mimeType)) {
        return {
          valid: false,
          error: `Invalid file format (${mimeType || 'unknown'}). Please upload a JPEG, PNG, or WebP agricultural image.`
        };
      }

      const sanitizedName = this.sanitizeFilename(file.name || 'image.jpg');

      return {
        valid: true,
        sanitizedName: sanitizedName,
        sizeMb: parseFloat(sizeMb.toFixed(2)),
        mimeType: mimeType
      };
    },

    /**
     * Audit frontend runtime to verify that ZERO secrets are exposed
     * Section 41 & 51: "never expose API keys, database credentials, LLM keys, or JWT secrets"
     * @returns {{ secure: boolean, exposedSecrets: string[] }}
     */
    auditFrontendSecrets: function () {
      const suspiciousPatterns = [
        /sk-[a-zA-Z0-9]{20,}/i,               // OpenAI / LLM key pattern
        /AIzaSy[a-zA-Z0-9_-]{33}/i,           // Google API key pattern
        /postgresql:\/\//i,                   // Database connection string
        /mongodb(\+srv)?:\/\//i,              // Mongo connection string
        /BEGIN PRIVATE KEY/i,                 // Private signing key
        /jwt_secret/i                         // JWT secret
      ];

      const exposed = [];

      // Check window.APP_CONFIG
      const configStr = JSON.stringify(window.APP_CONFIG || {});
      suspiciousPatterns.forEach((pattern, idx) => {
        if (pattern.test(configStr)) {
          exposed.push(`Exposed credential signature index ${idx} in window.APP_CONFIG`);
        }
      });

      // Check localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);
        suspiciousPatterns.forEach((pattern, idx) => {
          if (pattern.test(val)) {
            exposed.push(`Exposed credential in localStorage key: ${key}`);
          }
        });
      }

      return {
        secure: exposed.length === 0,
        exposedSecrets: exposed
      };
    },

    /**
     * Wrap privileged operations to enforce backend authoritative authorization
     * Section 41: "never trust frontend role information; never trust frontend approval state"
     * @param {Promise} apiPromise
     * @param {object} rollbackState
     * @param {Function} onRollback
     * @returns {Promise}
     */
    assertBackendAuthorized: async function (apiPromise, rollbackState, onRollback) {
      try {
        return await apiPromise;
      } catch (err) {
        if (err.status === 403 || err.status === 401) {
          console.warn('[Security Shield] Backend denied authorization for privileged operation.');
          if (typeof onRollback === 'function') {
            onRollback(rollbackState);
          }
          if (window.Toast) {
            window.Toast.error(
              'Authorization Denied',
              'You do not have permission to authorize this agricultural action.'
            );
          }
        }
        throw err;
      }
    }
  };

  window.Security = Security;
})();
