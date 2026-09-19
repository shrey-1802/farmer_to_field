/**
 * KrishiNirnay AI - Configuration & Error Dictionaries
 * Strict compliance with Section 57 (Phase 51):
 * Safe Production Configuration Strategy
 *
 * Production:
 *   API_BASE_URL: "https://krishinirnay-backend.onrender.com/api"
 *   ENABLE_DEMO_MODE: false
 *
 * Local Development:
 *   API_BASE_URL: "http://localhost:8000/api"
 *   ENABLE_DEMO_MODE: true
 *
 * Security Principle:
 *   Zero secrets committed. Backend public URL is not a secret.
 */

(function () {
  'use strict';

  // Environment detection: localhost vs production (GitHub Pages / Render)
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' || 
                      window.location.protocol === 'file:';

  const isGitHubPages = window.location.hostname.endsWith('github.io');
  const envMode = isLocalhost ? 'development' : (isGitHubPages ? 'production_github_pages' : 'production');

  const PROD_API_URL = 'https://krishinirnay-backend.onrender.com/api';
  const DEV_API_URL = 'http://localhost:8000/api';

  // Check URL query parameter overrides if present (?demo=true or ?api=...)
  let urlApiOverride = null;
  let urlDemoOverride = null;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('api')) {
      const apiCandidate = params.get('api');
      if (apiCandidate.startsWith('https://') || apiCandidate.startsWith('http://localhost')) {
        urlApiOverride = apiCandidate;
      }
    }
    if (params.has('demo')) {
      urlDemoOverride = params.get('demo') === 'true' || params.get('demo') === '1';
    }
  } catch (_) {}

  // Check localStorage overrides if set by developer or user in UI
  let storedApiUrl = null;
  let storedDemoMode = null;
  try {
    storedApiUrl = localStorage.getItem('krishinirnay_api_url');
    const storedDemo = localStorage.getItem('krishinirnay_demo_mode');
    if (storedDemo !== null) {
      storedDemoMode = storedDemo === 'true';
    }
  } catch (_) {}

  const activeApiUrl = urlApiOverride || storedApiUrl || (isLocalhost ? DEV_API_URL : PROD_API_URL);
  const activeDemoMode = urlDemoOverride !== null 
    ? urlDemoOverride 
    : (storedDemoMode !== null ? storedDemoMode : isLocalhost);

  window.APP_CONFIG = Object.assign(
    {
      APP_NAME: 'KrishiNirnay AI',
      TAGLINE: 'Autonomous Farm-to-Field Advisory & Action Platform',
      VERSION: '1.0.0',
      ENV: envMode,
      IS_PRODUCTION: !isLocalhost,
      API_BASE_URL: activeApiUrl,
      ENABLE_DEMO_MODE: activeDemoMode,
      API_TIMEOUT_MS: 15000,
      RENDER_WAKE_UP_SECONDS: 30,
      MAX_RETRY_ATTEMPTS: 3,
      POLL_INTERVAL_ACTIVE_MS: 2500,
      POLL_INTERVAL_TELEMETRY_MS: 15000,
      POLL_INTERVAL_DASHBOARD_MS: 30000,
    },
    window.APP_CONFIG || {}
  );

  const ConfigManager = {
    getConfig: function () {
      return { ...window.APP_CONFIG };
    },

    setApiUrl: function (newUrl, persist = true) {
      if (!newUrl || typeof newUrl !== 'string') return false;
      const cleanUrl = newUrl.trim().replace(/\/+$/, '');
      window.APP_CONFIG.API_BASE_URL = cleanUrl;
      if (persist) {
        try {
          localStorage.setItem('krishinirnay_api_url', cleanUrl);
        } catch (_) {}
      }
      window.dispatchEvent(new CustomEvent('krishinirnay:config_changed', { detail: { key: 'API_BASE_URL', value: cleanUrl } }));
      return true;
    },

    setDemoMode: function (enabled, persist = true) {
      const boolVal = !!enabled;
      window.APP_CONFIG.ENABLE_DEMO_MODE = boolVal;
      if (persist) {
        try {
          localStorage.setItem('krishinirnay_demo_mode', String(boolVal));
        } catch (_) {}
      }
      window.dispatchEvent(new CustomEvent('krishinirnay:config_changed', { detail: { key: 'ENABLE_DEMO_MODE', value: boolVal } }));
      return boolVal;
    },

    resetToDefaults: function () {
      try {
        localStorage.removeItem('krishinirnay_api_url');
        localStorage.removeItem('krishinirnay_demo_mode');
      } catch (_) {}
      window.APP_CONFIG.API_BASE_URL = isLocalhost ? DEV_API_URL : PROD_API_URL;
      window.APP_CONFIG.ENABLE_DEMO_MODE = isLocalhost;
      window.dispatchEvent(new CustomEvent('krishinirnay:config_changed', { detail: { reset: true } }));
    },

    audit: function () {
      const config = window.APP_CONFIG;
      const issues = [];
      if (!config.API_BASE_URL) {
        issues.push('API_BASE_URL is undefined.');
      }
      if (config.IS_PRODUCTION && config.API_BASE_URL.startsWith('http://') && !config.API_BASE_URL.includes('localhost')) {
        issues.push('Insecure HTTP protocol used in production configuration.');
      }
      return {
        secure: issues.length === 0,
        issues,
        summary: `Env: ${config.ENV} • API: ${config.API_BASE_URL} • Demo: ${config.ENABLE_DEMO_MODE}`
      };
    }
  };

  window.ConfigManager = ConfigManager;

  /**
   * HTTP Status Code Catalog & Farmer-Friendly Error Guidance
   * Mandatory Phase 31 Requirement
   */
  window.HTTP_STATUS_MESSAGES = {
    400: {
      title: 'Invalid Request',
      message: 'The request could not be processed due to invalid parameters. Please check your inputs.',
      farmerHint: 'Please verify the details you entered.',
      severity: 'warning',
      action: 'check_input',
    },
    401: {
      title: 'Session Expired',
      message: 'Your session has expired or authentication is missing. Please log in again.',
      farmerHint: 'Please log in with your mobile number.',
      severity: 'warning',
      action: 'redirect_login',
    },
    403: {
      title: 'Access Restricted',
      message: 'You do not have authorization to perform this agricultural action.',
      farmerHint: 'You do not have permission for this farm action.',
      severity: 'danger',
      action: 'contact_admin',
    },
    404: {
      title: 'Resource Not Found',
      message: 'The requested farm, field, sensor, or action record could not be found.',
      farmerHint: 'The selected farm record was not found.',
      severity: 'info',
      action: 'navigate_back',
    },
    408: {
      title: 'Request Timed Out',
      message: 'The server took too long to respond. The farm network might be weak.',
      farmerHint: 'Connection is slow. Please try again.',
      severity: 'warning',
      action: 'retry',
    },
    409: {
      title: 'State Conflict',
      message: 'The resource has been updated elsewhere (e.g., action was already approved or execution started).',
      farmerHint: 'This action was already updated. Please refresh.',
      severity: 'warning',
      action: 'refresh',
    },
    422: {
      title: 'Validation Failed',
      message: 'The submitted data failed agricultural validation rules.',
      farmerHint: 'Some entered details are not valid. Please review them.',
      severity: 'warning',
      action: 'check_input',
    },
    429: {
      title: 'Rate Limit Reached',
      message: 'Too many requests have been made in a short period. Please wait a moment.',
      farmerHint: 'Please wait a moment before trying again.',
      severity: 'warning',
      action: 'cooldown',
    },
    500: {
      title: 'Server Error',
      message: 'An unexpected error occurred on the KrishiNirnay server. Our engineers have been alerted.',
      farmerHint: 'A system error occurred. Please try again shortly.',
      severity: 'danger',
      action: 'retry',
    },
    502: {
      title: 'Gateway Error',
      message: 'The backend service is temporarily unreachable or restarting.',
      farmerHint: 'System is updating. Please try again in a moment.',
      severity: 'danger',
      action: 'retry',
    },
    503: {
      title: 'Backend Waking Up',
      message: 'Backend is waking up or temporarily unavailable. Please try again in a few seconds.',
      farmerHint: 'Server is starting up. Please wait 15–30 seconds and retry.',
      severity: 'warning',
      action: 'retry',
    },
  };

  /**
   * Domain-Specific Backend Error Codes
   * Maps backend machine codes to empathetic, farmer-centric messages
   */
  window.BACKEND_ERROR_CODES = {
    INVALID_PHONE: 'Please enter a valid 10-digit mobile number.',
    OTP_EXPIRED: 'The OTP has expired. Please request a new OTP.',
    INVALID_OTP: 'That OTP is not correct. Please check and try again.',
    TOO_MANY_ATTEMPTS: 'Too many attempts. Please wait before trying again.',
    OTP_COOLDOWN: 'Please wait for the cooldown timer before requesting another OTP.',
    RATE_LIMITED: 'Request limit reached. Please wait a moment.',
    ACCOUNT_BLOCKED: 'Your account has been temporarily held. Please contact farm support.',
    SERVER_ERROR: 'An error occurred while processing your request.',
    NETWORK_ERROR: 'Unable to connect to KrishiNirnay. Please check your internet connection.',
    BACKEND_UNAVAILABLE: 'Backend is waking up. Please try again in a few seconds.',
    ACTION_ALREADY_APPROVED: 'This action plan has already been approved and queued for execution.',
    ACTION_ALREADY_REJECTED: 'This action plan was rejected and cannot be re-executed.',
    SIMULATION_RUNNING: 'A simulation scenario is currently active on this field.',
    SENSOR_OFFLINE: 'Virtual sensor stream temporarily interrupted.',
  };
})();
