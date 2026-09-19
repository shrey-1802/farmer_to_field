/**
 * KrishiNirnay AI - UI Feedback, Toast & Modal Error Presentation Layer
 * Section 31, 33, 40, 41, 42 Compliance
 */

(function () {
  'use strict';

  // =========================================================================
  // Toast Notification System
  // =========================================================================
  const Toast = {
    _container: null,

    _getContainer: function () {
      if (!this._container) {
        let el = document.getElementById('toast-container');
        if (!el) {
          el = document.createElement('div');
          el.id = 'toast-container';
          el.setAttribute('role', 'region');
          el.setAttribute('aria-label', 'System notifications');
          document.body.appendChild(el);
        }
        this._container = el;
      }
      return this._container;
    },

    /**
     * Display a toast notification
     * @param {object} options
     * @param {'success'|'warning'|'danger'|'info'} options.type
     * @param {string} options.title
     * @param {string} options.message
     * @param {number} [options.duration=5000] Duration in ms (0 for persistent)
     */
    show: function ({ type = 'info', title = '', message = '', duration = 5000 }) {
      const container = this._getContainer();
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.setAttribute('role', type === 'danger' ? 'alert' : 'status');
      toast.setAttribute('aria-live', type === 'danger' ? 'assertive' : 'polite');

      const icons = {
        success: '✓',
        warning: '⚠',
        danger: '✕',
        info: 'ℹ',
      };

      const safeTitle = window.Utils ? window.Utils.escapeHtml(title) : title;
      const safeMessage = window.Utils 
        ? window.Utils.escapeHtml(window.Utils.sanitizeErrorMessage(message))
        : message;

      toast.innerHTML = `
        <div class="toast-icon">${icons[type] || 'ℹ'}</div>
        <div class="toast-content">
          ${safeTitle ? `<div class="toast-title">${safeTitle}</div>` : ''}
          <div class="toast-message">${safeMessage}</div>
        </div>
        <button type="button" class="toast-close" aria-label="Close notification">&times;</button>
      `;

      const closeBtn = toast.querySelector('.toast-close');
      const closeToast = () => {
        toast.classList.add('toast-closing');
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 180);
      };

      closeBtn.addEventListener('click', closeToast);

      container.appendChild(toast);

      if (duration > 0) {
        setTimeout(closeToast, duration);
      }

      return toast;
    },

    success: function (title, message, duration) {
      return this.show({ type: 'success', title, message, duration });
    },

    warning: function (title, message, duration) {
      return this.show({ type: 'warning', title, message, duration });
    },

    error: function (title, message, duration = 7000) {
      return this.show({ type: 'danger', title, message, duration });
    },

    info: function (title, message, duration) {
      return this.show({ type: 'info', title, message, duration });
    },
  };

  // =========================================================================
  // Modal Error Presentation (For Blocking Errors / Render Wake-up)
  // =========================================================================
  const Modal = {
    _backdrop: null,

    _getBackdrop: function () {
      if (!this._backdrop) {
        let el = document.getElementById('app-modal-backdrop');
        if (!el) {
          el = document.createElement('div');
          el.id = 'app-modal-backdrop';
          el.className = 'modal-backdrop';
          el.setAttribute('role', 'dialog');
          el.setAttribute('aria-modal', 'true');
          document.body.appendChild(el);
        }
        this._backdrop = el;
      }
      return this._backdrop;
    },

    /**
     * Show an accessible error modal dialog
     * @param {ApiError|Error|object} error
     * @param {object} [options]
     * @param {Function} [options.onRetry] Callback when retry button is pressed
     * @param {Function} [options.onDismiss] Callback on dismissal
     */
    showError: function (error, options = {}) {
      const backdrop = this._getBackdrop();
      const status = error.status || 0;
      const title = error.title || (window.HTTP_STATUS_MESSAGES && window.HTTP_STATUS_MESSAGES[status] 
        ? window.HTTP_STATUS_MESSAGES[status].title 
        : 'Action Notice');
      
      const safeMessage = window.Utils 
        ? window.Utils.escapeHtml(window.Utils.sanitizeErrorMessage(error.message || error.farmerHint))
        : (error.message || 'An error occurred.');

      const farmerHint = error.farmerHint && error.farmerHint !== error.message 
        ? window.Utils.escapeHtml(error.farmerHint) 
        : null;

      const requestId = error.requestId ? window.Utils.escapeHtml(error.requestId) : null;
      const errorCode = error.code ? window.Utils.escapeHtml(error.code) : `HTTP_${status}`;
      const hasRetry = typeof options.onRetry === 'function' || (error && typeof error.retry === 'function');

      backdrop.innerHTML = `
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-icon-badge modal-icon-badge-${error.severity || 'danger'}">
              ${error.severity === 'warning' ? '⚠' : '✕'}
            </div>
            <div>
              <h2 class="modal-title">${window.Utils.escapeHtml(title)}</h2>
              <div class="modal-subtitle">Status Code: ${status || 'Client/Network'}</div>
            </div>
          </div>
          <div class="modal-body">
            <p>${safeMessage}</p>
            ${farmerHint ? `<p style="margin-top: 8px; font-weight: 500; color: var(--color-primary-800);">${farmerHint}</p>` : ''}
            <div class="modal-technical-details">
              <div>Reference Code: <code>${errorCode}</code></div>
              ${requestId ? `<div>Request ID: <code>${requestId}</code></div>` : ''}
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary modal-btn-dismiss">Close</button>
            ${hasRetry ? `<button type="button" class="btn btn-primary modal-btn-retry">Try Again</button>` : ''}
          </div>
        </div>
      `;

      const dismissBtn = backdrop.querySelector('.modal-btn-dismiss');
      const retryBtn = backdrop.querySelector('.modal-btn-retry');

      const closeModal = () => {
        backdrop.classList.remove('is-active');
        if (typeof options.onDismiss === 'function') {
          options.onDismiss();
        }
      };

      dismissBtn.addEventListener('click', closeModal);

      if (retryBtn) {
        retryBtn.addEventListener('click', async () => {
          retryBtn.disabled = true;
          retryBtn.innerHTML = `<span class="spinner"></span> Retrying...`;
          try {
            if (typeof options.onRetry === 'function') {
              await options.onRetry();
            } else if (typeof error.retry === 'function') {
              await error.retry();
            }
            closeModal();
          } catch (retryErr) {
            retryBtn.disabled = false;
            retryBtn.textContent = 'Retry Again';
            Toast.error('Retry Failed', retryErr.message || 'The server is still unavailable.');
          }
        });
      }

      // Close on backdrop click or ESC key
      backdrop.onclick = (e) => {
        if (e.target === backdrop) closeModal();
      };

      const escListener = (e) => {
        if (e.key === 'Escape') {
          closeModal();
          window.removeEventListener('keydown', escListener);
        }
      };
      window.addEventListener('keydown', escListener);

      backdrop.classList.add('is-active');
      if (retryBtn) retryBtn.focus();
      else dismissBtn.focus();
    },

    close: function () {
      if (this._backdrop) {
        this._backdrop.classList.remove('is-active');
      }
    },
  };

  // =========================================================================
  // Alert Banner Component (Section-Level Error & State Presentation)
  // =========================================================================
  const AlertBanner = {
    /**
     * Render an alert banner inside a container element
     * @param {HTMLElement|string} target Container element or selector
     * @param {object} params
     * @param {'danger'|'warning'|'info'|'success'} [params.severity='danger']
     * @param {string} params.title
     * @param {string} params.message
     * @param {string} [params.requestId]
     * @param {string} [params.code]
     * @param {Function} [params.onRetry]
     */
    render: function (target, { severity = 'danger', title, message, requestId, code, onRetry }) {
      const container = typeof target === 'string' ? document.querySelector(target) : target;
      if (!container) return;

      const safeTitle = window.Utils ? window.Utils.escapeHtml(title) : title;
      const safeMessage = window.Utils 
        ? window.Utils.escapeHtml(window.Utils.sanitizeErrorMessage(message)) 
        : message;
      
      const banner = document.createElement('div');
      banner.className = `alert-banner alert-banner-${severity}`;
      banner.setAttribute('role', severity === 'danger' ? 'alert' : 'status');

      const icons = {
        danger: '✕',
        warning: '⚠',
        info: 'ℹ',
        success: '✓',
      };

      banner.innerHTML = `
        <div class="alert-icon">${icons[severity] || 'ℹ'}</div>
        <div class="alert-content">
          <div class="alert-title">${safeTitle}</div>
          <div class="alert-message">${safeMessage}</div>
          ${code || requestId ? `
            <div class="alert-meta">
              ${code ? `<span>Code: <code>${window.Utils.escapeHtml(code)}</code></span>` : ''}
              ${requestId ? `<span>Trace: <code>${window.Utils.escapeHtml(requestId)}</code></span>` : ''}
            </div>
          ` : ''}
          ${onRetry ? `
            <div class="alert-actions">
              <button type="button" class="btn btn-sm btn-secondary alert-retry-btn">
                ↻ Try Again
              </button>
            </div>
          ` : ''}
        </div>
      `;

      if (onRetry) {
        const retryBtn = banner.querySelector('.alert-retry-btn');
        retryBtn.addEventListener('click', async () => {
          retryBtn.disabled = true;
          retryBtn.innerHTML = `<span class="spinner"></span> Retrying...`;
          try {
            await onRetry();
            banner.remove();
          } catch (err) {
            retryBtn.disabled = false;
            retryBtn.innerHTML = `↻ Try Again`;
            Toast.error('Retry Failed', err.message);
          }
        });
      }

      container.innerHTML = '';
      container.appendChild(banner);
      return banner;
    },

    clear: function (target) {
      const container = typeof target === 'string' ? document.querySelector(target) : target;
      if (container) {
        container.innerHTML = '';
      }
    }
  };

  // =========================================================================
  // Render Sleep / Backend Wake-Up Banner Component (Phase 32)
  // =========================================================================
  const WakeUpBanner = {
    _bannerEl: null,
    _isPolling: false,

    _getBanner: function () {
      if (!this._bannerEl) {
        let el = document.getElementById('render-wakeup-banner');
        if (!el) {
          el = document.createElement('div');
          el.id = 'render-wakeup-banner';
          el.className = 'wakeup-banner';
          el.setAttribute('role', 'status');
          el.setAttribute('aria-live', 'polite');

          // Place right after header or at top of body
          const header = document.querySelector('.app-header');
          if (header && header.parentNode) {
            header.parentNode.insertBefore(el, header.nextSibling);
          } else {
            document.body.insertBefore(el, document.body.firstChild);
          }
        }
        this._bannerEl = el;
      }
      return this._bannerEl;
    },

    /**
     * Display the wake-up banner
     * Mandatory copy: "Backend is waking up. Please try again in a few seconds."
     * @param {object} [options]
     * @param {Function} [options.onRetry] Callback when retry is clicked or server wakes up
     * @param {boolean} [options.autoPolling=true] Whether to automatically poll /health
     */
    show: function (options = {}) {
      const banner = this._getBanner();
      const onRetry = options.onRetry;

      banner.className = 'wakeup-banner';
      banner.style.display = 'flex';
      banner.innerHTML = `
        <div class="wakeup-banner-content">
          <div class="wakeup-icon-pulse" aria-hidden="true">☁</div>
          <div class="wakeup-message-group">
            <span class="wakeup-primary-text">Backend is waking up. Please try again in a few seconds.</span>
            <span class="wakeup-sub-text" id="wakeup-timer-label">Render cloud instance is spinning up (est. 15–30s). Connecting...</span>
          </div>
        </div>
        <div class="wakeup-actions">
          <button type="button" class="btn btn-sm btn-secondary wakeup-retry-btn" id="wakeup-manual-retry">
            ↻ Retry
          </button>
        </div>
      `;

      // Insert progress bar
      let progressBar = document.getElementById('wakeup-progress-bar');
      if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.id = 'wakeup-progress-bar';
        progressBar.className = 'wakeup-progress-bar';
        progressBar.innerHTML = '<div class="wakeup-progress-fill"></div>';
        banner.parentNode.insertBefore(progressBar, banner.nextSibling);
      }
      progressBar.style.display = 'block';

      const retryBtn = banner.querySelector('#wakeup-manual-retry');
      const timerLabel = banner.querySelector('#wakeup-timer-label');

      const triggerRetry = async () => {
        retryBtn.disabled = true;
        retryBtn.innerHTML = `<span class="spinner"></span> Checking...`;
        timerLabel.textContent = 'Contacting server...';

        try {
          if (typeof onRetry === 'function') {
            await onRetry();
          } else if (window.ApiClient) {
            await window.ApiClient.get('health', {}, { timeoutMs: 4000 });
          }
          WakeUpBanner.markAwake();
        } catch (err) {
          retryBtn.disabled = false;
          retryBtn.textContent = '↻ Retry';
          timerLabel.textContent = 'Server still spinning up. Will recheck automatically...';
        }
      };

      retryBtn.addEventListener('click', triggerRetry);

      // Auto-polling detection if enabled
      if (options.autoPolling !== false && !this._isPolling && window.ApiClient) {
        this._isPolling = true;
        window.ApiClient.waitForBackend({
          onProgress: (sec) => {
            if (timerLabel && banner.style.display !== 'none') {
              timerLabel.textContent = `Server spinning up (${sec}s elapsed)... Auto-reconnecting`;
            }
          }
        })
        .then(async () => {
          this._isPolling = false;
          WakeUpBanner.markAwake();
          if (typeof onRetry === 'function') {
            try {
              await onRetry();
            } catch (_) {}
          }
        })
        .catch(() => {
          this._isPolling = false;
          if (timerLabel) {
            timerLabel.textContent = 'Wake-up check paused. Click Retry when ready.';
          }
        });
      }
    },

    /**
     * Transition banner to green awake state and auto-hide
     */
    markAwake: function () {
      if (!this._bannerEl) return;
      this._bannerEl.className = 'wakeup-banner is-awake';
      const primaryText = this._bannerEl.querySelector('.wakeup-primary-text');
      const subText = this._bannerEl.querySelector('#wakeup-timer-label');
      const retryBtn = this._bannerEl.querySelector('#wakeup-manual-retry');

      if (primaryText) primaryText.textContent = 'Backend is awake! Connection established.';
      if (subText) subText.textContent = 'KrishiNirnay AI server is live and responsive.';
      if (retryBtn) retryBtn.style.display = 'none';

      const progressBar = document.getElementById('wakeup-progress-bar');
      if (progressBar) {
        progressBar.style.display = 'none';
      }

      Toast.success('Backend Awake', 'KrishiNirnay server resumed successfully.');

      setTimeout(() => {
        WakeUpBanner.hide();
      }, 2500);
    },

    /**
     * Hide the wake-up banner
     */
    hide: function () {
      if (this._bannerEl) {
        this._bannerEl.style.display = 'none';
      }
      const progressBar = document.getElementById('wakeup-progress-bar');
      if (progressBar) {
        progressBar.style.display = 'none';
      }
    }
  };

  // =========================================================================
  // Phase 33: Standardized Section State Manager (Loading / Empty / Error / Offline)
  // =========================================================================
  const UIState = {
    /**
     * Mount loading skeleton or spinner inside target container
     * @param {HTMLElement|string} target
     * @param {object} [options]
     * @param {'card'|'chart'|'table'|'spinner'} [options.type='card']
     * @param {string} [options.message='Loading telemetry...']
     */
    loading: function (target, options = {}) {
      const container = typeof target === 'string' ? document.querySelector(target) : target;
      if (!container) return;

      const type = options.type || 'card';

      if (type === 'spinner') {
        container.innerHTML = `
          <div class="state-card">
            <span class="spinner" style="width: 32px; height: 32px; color: var(--color-primary-600); margin-bottom: 12px;"></span>
            <div class="state-card-title">${window.Utils ? window.Utils.escapeHtml(options.message || 'Loading...') : 'Loading...'}</div>
          </div>
        `;
        return;
      }

      if (type === 'chart') {
        container.innerHTML = `
          <div class="skeleton-card" aria-busy="true" aria-label="Loading chart data">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="skeleton skeleton-title" style="width: 140px;"></span>
              <span class="skeleton skeleton-badge"></span>
            </div>
            <span class="skeleton skeleton-text skeleton-text-short"></span>
            <div class="skeleton skeleton-chart"></div>
          </div>
        `;
        return;
      }

      if (type === 'table') {
        container.innerHTML = `
          <div class="skeleton-card" aria-busy="true" aria-label="Loading table records">
            <span class="skeleton skeleton-title" style="width: 180px;"></span>
            <span class="skeleton skeleton-text"></span>
            <span class="skeleton skeleton-text"></span>
            <span class="skeleton skeleton-text"></span>
          </div>
        `;
        return;
      }

      // Default: Card Skeleton
      container.innerHTML = `
        <div class="skeleton-card" aria-busy="true" aria-label="Loading content">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="skeleton skeleton-title"></span>
            <span class="skeleton skeleton-badge"></span>
          </div>
          <span class="skeleton skeleton-text"></span>
          <span class="skeleton skeleton-text skeleton-text-short"></span>
        </div>
      `;
    },

    /**
     * Mount Empty state inside target container
     * Example copy from Section 39: "No active risks found for this field."
     * @param {HTMLElement|string} target
     * @param {object} [options]
     * @param {string} [options.title='No Records Found']
     * @param {string} [options.message='No active risks found for this field.']
     * @param {string} [options.icon='🌱']
     * @param {string} [options.actionLabel]
     * @param {Function} [options.onAction]
     */
    empty: function (target, options = {}) {
      const container = typeof target === 'string' ? document.querySelector(target) : target;
      if (!container) return;

      const title = options.title || 'No Active Records';
      const message = options.message || 'No active risks found for this field.';
      const icon = options.icon || '🌱';
      const actionLabel = options.actionLabel;

      const safeTitle = window.Utils ? window.Utils.escapeHtml(title) : title;
      const safeMessage = window.Utils ? window.Utils.escapeHtml(message) : message;

      container.innerHTML = `
        <div class="state-card state-card-empty" role="status">
          <div class="state-card-icon" aria-hidden="true">${icon}</div>
          <h3 class="state-card-title">${safeTitle}</h3>
          <p class="state-card-message">${safeMessage}</p>
          ${actionLabel ? `
            <div class="state-card-actions">
              <button type="button" class="btn btn-primary btn-sm state-empty-action-btn">
                ${window.Utils ? window.Utils.escapeHtml(actionLabel) : actionLabel}
              </button>
            </div>
          ` : ''}
        </div>
      `;

      if (actionLabel && typeof options.onAction === 'function') {
        const btn = container.querySelector('.state-empty-action-btn');
        if (btn) btn.addEventListener('click', options.onAction);
      }
    },

    /**
     * Mount Error state inside target container
     * Example copy from Section 39: "Unable to load sensor data." with button "Try Again"
     * @param {HTMLElement|string} target
     * @param {object} [options]
     * @param {string} [options.title='Connection Error']
     * @param {string} [options.message='Unable to load sensor data.']
     * @param {Function} [options.onRetry] Retry callback handler
     */
    error: function (target, options = {}) {
      const container = typeof target === 'string' ? document.querySelector(target) : target;
      if (!container) return;

      const title = options.title || 'Data Load Error';
      const message = options.message || 'Unable to load sensor data.';
      const safeTitle = window.Utils ? window.Utils.escapeHtml(title) : title;
      const safeMessage = window.Utils 
        ? window.Utils.escapeHtml(window.Utils.sanitizeErrorMessage(message)) 
        : message;

      container.innerHTML = `
        <div class="state-card state-card-error" role="alert">
          <div class="state-card-icon" aria-hidden="true">✕</div>
          <h3 class="state-card-title">${safeTitle}</h3>
          <p class="state-card-message">${safeMessage}</p>
          ${options.onRetry ? `
            <div class="state-card-actions">
              <button type="button" class="btn btn-primary btn-sm state-retry-btn">
                Try Again
              </button>
            </div>
          ` : ''}
        </div>
      `;

      if (typeof options.onRetry === 'function') {
        const btn = container.querySelector('.state-retry-btn');
        if (btn) {
          btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner"></span> Retrying...`;
            try {
              await options.onRetry();
            } catch (err) {
              btn.disabled = false;
              btn.textContent = 'Try Again';
              Toast.error('Retry Failed', err.message || 'Unable to load data.');
            }
          });
        }
      }
    },

    /**
     * Mount Offline state inside target container
     * Example copy from Section 39: "Connection unavailable. Showing previously cached interface data where available."
     * @param {HTMLElement|string} target
     * @param {object} [options]
     * @param {string} [options.message]
     * @param {string} [options.cachedTime]
     * @param {string} [options.cachedHtml]
     * @param {Function} [options.onRetry]
     */
    offline: function (target, options = {}) {
      const container = typeof target === 'string' ? document.querySelector(target) : target;
      if (!container) return;

      const message = options.message || 'Connection unavailable. Showing previously cached interface data where available.';
      const cachedTime = options.cachedTime || 'Cached 5m ago';
      const safeMessage = window.Utils ? window.Utils.escapeHtml(message) : message;
      const safeTime = window.Utils ? window.Utils.escapeHtml(cachedTime) : cachedTime;

      const bannerHtml = `
        <div class="offline-banner" role="status">
          <div class="offline-banner-text">
            <span>⚡</span>
            <span>${safeMessage}</span>
            <span class="offline-cache-tag">${safeTime}</span>
          </div>
          ${options.onRetry ? `
            <button type="button" class="btn btn-sm btn-secondary offline-retry-btn">
              Try Again
            </button>
          ` : ''}
        </div>
      `;

      const contentHtml = options.cachedHtml || `
        <div class="state-card state-card-offline">
          <div class="state-card-icon" aria-hidden="true">📡</div>
          <h3 class="state-card-title">Offline Cache Mode</h3>
          <p class="state-card-message">${safeMessage}</p>
        </div>
      `;

      container.innerHTML = bannerHtml + contentHtml;

      if (typeof options.onRetry === 'function') {
        const btn = container.querySelector('.offline-retry-btn');
        if (btn) {
          btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.innerHTML = `<span class="spinner"></span> Connecting...`;
            try {
              await options.onRetry();
            } catch (err) {
              btn.disabled = false;
              btn.textContent = 'Try Again';
              Toast.warning('Still Offline', 'Unable to establish live connection.');
            }
          });
        }
      }
    },

    /**
     * Inject live active content and clear state wrappers
     * @param {HTMLElement|string} target
     * @param {string|HTMLElement} content
     */
    content: function (target, content) {
      const container = typeof target === 'string' ? document.querySelector(target) : target;
      if (!container) return;

      if (typeof content === 'string') {
        container.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        container.innerHTML = '';
        container.appendChild(content);
      }
    }
  };

  window.Toast = Toast;
  window.Modal = Modal;
  window.AlertBanner = AlertBanner;
  window.WakeUpBanner = WakeUpBanner;
  window.UIState = UIState;
})();
