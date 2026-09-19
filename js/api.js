/**
 * KrishiNirnay AI - Centralized API Service Layer
 * Mandatory Phase 31 Implementation: HTTP Error Interception & Status Code Management
 * Section 34, 37, 38, 41, 66.5 Compliance
 */

(function () {
  'use strict';

  class ApiError extends Error {
    /**
     * @param {object} params
     * @param {number} params.status HTTP Status Code
     * @param {string} params.code Machine Error Code
     * @param {string} params.message User-friendly sanitized message
     * @param {string} params.farmerHint Empathetic farmer advice
     * @param {string} params.requestId Unique request tracer
     * @param {string} params.severity 'danger' | 'warning' | 'info'
     * @param {Function} [params.retryFn] Retry trigger function
     * @param {any} [params.raw] Raw parsed response (kept internal, never shown in UI)
     */
    constructor({ status, code, message, farmerHint, requestId, severity, retryFn, raw }) {
      super(message);
      this.name = 'ApiError';
      this.status = status || 0;
      this.code = code || 'UNKNOWN_ERROR';
      this.message = message;
      this.farmerHint = farmerHint || message;
      this.requestId = requestId || (window.Utils ? window.Utils.generateRequestId() : 'req_local');
      this.severity = severity || 'danger';
      this.retryFn = retryFn || null;
      this.timestamp = new Date().toISOString();
      this._raw = raw;
    }

    retry() {
      if (typeof this.retryFn === 'function') {
        return this.retryFn();
      }
      return Promise.reject(new Error('No retry handler attached to this request.'));
    }
  }

  const ApiClient = {
    /**
     * Base request dispatcher with full status code handling, abort controller, and error normalization
     * @param {string} endpoint
     * @param {object} options
     * @returns {Promise<any>}
     */
    request: async function (endpoint, options = {}) {
      const config = window.APP_CONFIG || {};
      const baseUrl = config.API_BASE_URL ? config.API_BASE_URL.replace(/\/+$/, '') : '';
      
      // Allow relative or full URL
      const fullUrl = endpoint.startsWith('http') 
        ? endpoint 
        : `${baseUrl}/${endpoint.replace(/^\/+/, '')}`;

      const headers = Object.assign(
        {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        options.headers || {}
      );

      // Attach token if session exists in memory/storage
      const authToken = localStorage.getItem('krishinirnay_token');
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      // Setup AbortController for timeout handling (408)
      const controller = new AbortController();
      const timeoutMs = options.timeoutMs || config.API_TIMEOUT_MS || 15000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const fetchOptions = Object.assign({}, options, {
        headers: headers,
        signal: controller.signal,
      });

      // Prepare retry handler for self-retrying
      const retryExecution = () => ApiClient.request(endpoint, options);

      try {
        const response = await fetch(fullUrl, fetchOptions);
        clearTimeout(timeoutId);

        // Parse response body safely
        let data = null;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          try {
            data = await response.json();
          } catch (_) {
            data = null;
          }
        } else {
          try {
            const rawText = await response.text();
            data = { text: rawText };
          } catch (_) {
            data = null;
          }
        }

        // Check if response is successful
        if (response.ok) {
          return data;
        }

        // =========================================================================
        // Error Normalization & Status Code Interception (Phase 31)
        // =========================================================================
        const status = response.status;
        const statusMeta = (window.HTTP_STATUS_MESSAGES && window.HTTP_STATUS_MESSAGES[status]) || {
          title: `Error ${status}`,
          message: 'An unexpected response was returned by the server.',
          farmerHint: 'Please try again.',
          severity: 'danger',
          action: 'retry',
        };

        let backendCode = 'HTTP_' + status;
        let backendMessage = statusMeta.message;
        let requestId = null;

        // Parse standard backend contract: { error: { code, message, request_id } }
        if (data && data.error && typeof data.error === 'object') {
          backendCode = data.error.code || backendCode;
          backendMessage = data.error.message || backendMessage;
          requestId = data.error.request_id || requestId;
        } 
        // Parse FastAPI default validation error format: { detail: "..." }
        else if (data && data.detail) {
          if (Array.isArray(data.detail)) {
            // Pydantic validation error list
            const firstErr = data.detail[0];
            backendMessage = firstErr && firstErr.msg 
              ? `Validation Error: ${firstErr.loc ? firstErr.loc.join('.') + ' - ' : ''}${firstErr.msg}`
              : 'Submitted data could not be validated.';
          } else if (typeof data.detail === 'string') {
            backendMessage = data.detail;
          }
        }

        // Sanitize error message to suppress any internal stack traces / leaks
        const sanitizedMessage = window.Utils 
          ? window.Utils.sanitizeErrorMessage(backendMessage)
          : backendMessage;

        // Farmer friendly hint resolution
        let farmerHint = statusMeta.farmerHint;
        if (window.BACKEND_ERROR_CODES && window.BACKEND_ERROR_CODES[backendCode]) {
          farmerHint = window.BACKEND_ERROR_CODES[backendCode];
        }

        // Special handling for 503/502 Render Wake-up (Phase 32)
        const isWakeUp = (status === 503 || status === 502);
        if (isWakeUp) {
          backendMessage = 'Backend is waking up. Please try again in a few seconds.';
          farmerHint = 'Backend is waking up. Please try again in a few seconds.';
        }

        // Construct normalized ApiError
        const apiError = new ApiError({
          status: status,
          code: isWakeUp ? 'BACKEND_WAKING_UP' : backendCode,
          message: isWakeUp ? 'Backend is waking up. Please try again in a few seconds.' : sanitizedMessage,
          farmerHint: farmerHint,
          requestId: requestId || (window.Utils ? window.Utils.generateRequestId() : 'req_gen'),
          severity: isWakeUp ? 'warning' : statusMeta.severity,
          retryFn: retryExecution,
          raw: data,
        });
        apiError.isWakeUp = isWakeUp;

        // Broadcast auth error event for global route guard (Phase 34)
        if (status === 401) {
          window.dispatchEvent(new CustomEvent('krishinirnay:unauthorized', { detail: apiError }));
        }

        // Broadcast Render Wake-Up event (Phase 32)
        if (isWakeUp) {
          window.dispatchEvent(new CustomEvent('krishinirnay:backend_wakeup', { detail: apiError }));
        }

        throw apiError;

      } catch (err) {
        clearTimeout(timeoutId);

        // Already normalized ApiError
        if (err instanceof ApiError) {
          throw err;
        }

        // Check for AbortError (Timeout 408)
        if (err.name === 'AbortError') {
          throw new ApiError({
            status: 408,
            code: 'REQUEST_TIMEOUT',
            message: 'The request timed out while waiting for KrishiNirnay servers.',
            farmerHint: 'The connection is taking too long. Please check your signal and try again.',
            severity: 'warning',
            retryFn: retryExecution,
          });
        }

        // Network failure (offline or Render sleep connection drop)
        const isOffline = !navigator.onLine;
        const wakeUpErr = new ApiError({
          status: isOffline ? 0 : 503,
          code: isOffline ? 'CLIENT_OFFLINE' : 'BACKEND_WAKING_UP',
          message: isOffline 
            ? 'You appear to be offline. Please check your network connection.'
            : 'Backend is waking up. Please try again in a few seconds.',
          farmerHint: isOffline
            ? 'No internet connection detected on this device.'
            : 'Backend is waking up. Please try again in a few seconds.',
          severity: 'warning',
          retryFn: retryExecution,
        });
        wakeUpErr.isWakeUp = !isOffline;

        if (!isOffline) {
          window.dispatchEvent(new CustomEvent('krishinirnay:backend_wakeup', { detail: wakeUpErr }));
        }

        throw wakeUpErr;
      }
    },

    get: async function (endpoint, params = {}, options = {}) {
      let queryStr = '';
      if (params && Object.keys(params).length > 0) {
        const queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value);
          }
        }
        queryStr = (endpoint.includes('?') ? '&' : '?') + queryParams.toString();
      }

      const fullEndpoint = endpoint + queryStr;

      // Safe Read-Only Caching (Phase 37)
      if (options.cache && window.CacheManager) {
        const cacheKey = window.CacheManager.generateKey(endpoint, params);
        const cached = window.CacheManager.get(cacheKey);
        if (cached !== null) {
          return cached;
        }

        const data = await ApiClient.request(fullEndpoint, Object.assign({}, options, { method: 'GET' }));
        window.CacheManager.set(cacheKey, data, options.ttlMs || 300000);
        return data;
      }

      return ApiClient.request(fullEndpoint, Object.assign({}, options, { method: 'GET' }));
    },

    post: async function (endpoint, body = {}, options = {}) {
      // Invalidate relevant caches upon mutation (Phase 37)
      if (window.CacheManager) {
        window.CacheManager.invalidate(new RegExp(endpoint.split('/')[0]));
      }

      return ApiClient.request(endpoint, Object.assign({}, options, {
        method: 'POST',
        body: JSON.stringify(body),
      }));
    },

    put: async function (endpoint, body = {}, options = {}) {
      if (window.CacheManager) {
        window.CacheManager.invalidate(new RegExp(endpoint.split('/')[0]));
      }

      return ApiClient.request(endpoint, Object.assign({}, options, {
        method: 'PUT',
        body: JSON.stringify(body),
      }));
    },

    delete: async function (endpoint, options = {}) {
      if (window.CacheManager) {
        window.CacheManager.invalidate(new RegExp(endpoint.split('/')[0]));
      }

      return ApiClient.request(endpoint, Object.assign({}, options, { method: 'DELETE' }));
    },

    /**
     * Poll backend until Render spins up and responds with 200 OK (Phase 32)
     * @param {object} [options]
     * @param {number} [options.maxWaitMs=45000]
     * @param {number} [options.checkIntervalMs=4000]
     * @param {Function} [options.onProgress] Callback with elapsed seconds
     * @returns {Promise<boolean>}
     */
    waitForBackend: async function (options = {}) {
      const maxWaitMs = options.maxWaitMs || 45000;
      const intervalMs = options.checkIntervalMs || 3500;
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitMs) {
        const elapsedSec = Math.round((Date.now() - startTime) / 1000);
        if (typeof options.onProgress === 'function') {
          options.onProgress(elapsedSec);
        }

        try {
          await ApiClient.get('health', {}, { timeoutMs: 3000 });
          window.dispatchEvent(new CustomEvent('krishinirnay:backend_awake'));
          return true;
        } catch (_) {
          // Wait before next check
          await new Promise(res => setTimeout(res, intervalMs));
        }
      }

      throw new ApiError({
        status: 503,
        code: 'BACKEND_WAKEUP_TIMEOUT',
        message: 'Backend is waking up. Please try again in a few seconds.',
        farmerHint: 'The server is taking longer than usual to wake up. Please click retry.',
        severity: 'warning',
      });
    },

    /**
     * Diagnostic helper: Simulates any HTTP status or error payload locally for verification
     * @param {number} status
     * @param {object} [customPayload]
     */
    simulateError: function (status, customPayload) {
      const statusMeta = (window.HTTP_STATUS_MESSAGES && window.HTTP_STATUS_MESSAGES[status]) || {
        title: `Error ${status}`,
        message: `Simulated HTTP ${status} error response`,
        farmerHint: 'Simulated failure test.',
        severity: 'danger',
      };

      const isWakeUp = (status === 503 || status === 502);
      const defaultMessage = isWakeUp 
        ? 'Backend is waking up. Please try again in a few seconds.'
        : statusMeta.message;

      const payload = customPayload || {
        error: {
          code: isWakeUp ? 'BACKEND_WAKING_UP' : ('SIMULATED_' + status),
          message: defaultMessage,
          request_id: 'sim_' + Math.random().toString(36).substring(2, 9),
        }
      };

      const sanitizedMessage = window.Utils 
        ? window.Utils.sanitizeErrorMessage(payload.error ? payload.error.message : defaultMessage)
        : defaultMessage;

      const err = new ApiError({
        status: status,
        code: payload.error ? payload.error.code : 'SIMULATED_ERR',
        message: sanitizedMessage,
        farmerHint: isWakeUp ? 'Backend is waking up. Please try again in a few seconds.' : statusMeta.farmerHint,
        requestId: payload.error ? payload.error.request_id : 'sim_req_test',
        severity: isWakeUp ? 'warning' : statusMeta.severity,
        retryFn: () => new Promise(resolve => setTimeout(() => resolve({ success: true, message: 'Retry succeeded: server awake' }), 800)),
        raw: payload,
      });
      err.isWakeUp = isWakeUp;

      if (isWakeUp) {
        window.dispatchEvent(new CustomEvent('krishinirnay:backend_wakeup', { detail: err }));
      }

      return Promise.reject(err);
    }
  };

  window.ApiError = ApiError;
  window.ApiClient = ApiClient;
})();
