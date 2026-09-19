/**
 * KrishiNirnay AI - Shared Utility Functions (Phase 27 / Section 33)
 *
 * Domain-agnostic helper functions used across all page modules.
 * No external dependencies. Vanilla JS only.
 *
 * Categories:
 *  - Date / Time formatting
 *  - Number / Unit formatting
 *  - String helpers (escaping, truncation, initials)
 *  - DOM helpers (skeleton loaders, error/empty states, debounce)
 *  - Agronomy unit helpers (moisture %, temperature, NPK)
 *  - Loading state helpers
 *  - URL / query-string helpers
 */

// ─── Date & Time ─────────────────────────────────────────────────────────────

/**
 * Format an ISO timestamp into a human-readable date string.
 * @param {string|Date} ts
 * @param {'date'|'time'|'datetime'|'relative'} format
 */
export function formatDate(ts, format = 'datetime') {
  if (!ts) return '—';
  const d = typeof ts === 'string' ? new Date(ts) : ts;
  if (isNaN(d)) return '—';

  switch (format) {
    case 'date':
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    case 'time':
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    case 'relative':
      return relativeTime(d);
    case 'datetime':
    default:
      return d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
  }
}

/**
 * Return a human-readable relative time string (e.g. "2 minutes ago").
 */
export function relativeTime(date) {
  const now = Date.now();
  const ts = date instanceof Date ? date.getTime() : new Date(date).getTime();
  const diffMs = now - ts;

  if (diffMs < 0) return 'just now';
  if (diffMs < 60_000)  return `${Math.floor(diffMs / 1_000)}s ago`;
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  return `${Math.floor(diffMs / 86_400_000)}d ago`;
}

/**
 * Format elapsed seconds into HH:MM:SS string.
 */
export function formatElapsed(startMs) {
  const elapsed = Math.floor((Date.now() - startMs) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

// ─── Number & Unit Formatting ─────────────────────────────────────────────────

/**
 * Format Indian currency (₹).
 */
export function formatINR(amount, { decimals = 0, compact = false } = {}) {
  if (amount === null || amount === undefined) return '—';
  if (compact && Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (compact && Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: decimals
  }).format(amount);
}

/**
 * Format a percentage value.
 */
export function formatPct(value, decimals = 1) {
  if (value === null || value === undefined) return '—';
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Format a number with Indian locale commas.
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// ─── Agronomy Units ───────────────────────────────────────────────────────────

/** Soil moisture status label and CSS class */
export function moistureStatus(pct) {
  if (pct < 25) return { label: 'Critical Low', cls: 'status-critical' };
  if (pct < 35) return { label: 'Stress', cls: 'status-warning' };
  if (pct < 65) return { label: 'Optimal', cls: 'status-ok' };
  if (pct < 75) return { label: 'High', cls: 'status-warning' };
  return { label: 'Saturated', cls: 'status-critical' };
}

/** Battery level label and CSS class */
export function batteryStatus(pct) {
  if (typeof pct !== 'number') return { label: String(pct), cls: '' };
  if (pct <= 10) return { label: `${pct}% — Critical`, cls: 'status-critical' };
  if (pct <= 25) return { label: `${pct}% — Low`, cls: 'status-warning' };
  return { label: `${pct}%`, cls: 'status-ok' };
}

// ─── String Helpers ───────────────────────────────────────────────────────────

/**
 * Safely escape a string for insertion into HTML.
 * Use instead of raw innerHTML assignment.
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Truncate a string with ellipsis.
 */
export function truncate(str, maxLen = 60) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}

/**
 * Get initials from a full name (max 2 characters).
 */
export function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

/**
 * Convert a snake_case or kebab-case string to Title Case.
 */
export function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── DOM Helpers ──────────────────────────────────────────────────────────────

/**
 * Generate N skeleton loader rows for a table body.
 * @param {number} rows  - Number of skeleton rows
 * @param {number} cols  - Number of columns
 */
export function skeletonTableRows(rows = 4, cols = 5) {
  return Array.from({ length: rows }, () => `
    <tr class="skeleton-row">
      ${Array.from({ length: cols }, () =>
        `<td><div class="skeleton skeleton-text"></div></td>`
      ).join('')}
    </tr>
  `).join('');
}

/**
 * Generate a skeleton card loader.
 */
export function skeletonCard(lines = 3) {
  const lineHtml = Array.from({ length: lines }, () =>
    `<div class="skeleton skeleton-text"></div>`
  ).join('');
  return `<div class="skeleton-card">${lineHtml}</div>`;
}

/**
 * Render an empty state placeholder into a container element.
 * @param {HTMLElement} container
 * @param {string} icon       - Emoji or SVG string
 * @param {string} title
 * @param {string} desc
 * @param {string} [actionHtml] - Optional CTA button HTML
 */
export function renderEmptyState(container, icon, title, desc, actionHtml = '') {
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state" role="status" aria-label="${escapeHtml(title)}">
      <div class="empty-state-icon">${icon}</div>
      <h3 class="empty-state-title">${escapeHtml(title)}</h3>
      <p class="empty-state-desc">${escapeHtml(desc)}</p>
      ${actionHtml}
    </div>
  `;
}

/**
 * Render a consistent error state into a container element (Section 39).
 * @param {HTMLElement} container
 * @param {string} message
 * @param {Function} [retryCallback] - Called when "Try Again" is clicked
 */
export function renderErrorState(container, message, retryCallback = null) {
  if (!container) return;
  const retryBtn = retryCallback
    ? `<button class="btn btn-primary btn-sm retry-btn">Try Again</button>`
    : '';
  container.innerHTML = `
    <div class="error-state" role="alert">
      <div class="error-state-icon">⚠️</div>
      <p class="error-state-msg">${escapeHtml(message)}</p>
      ${retryBtn}
    </div>
  `;
  if (retryCallback) {
    container.querySelector('.retry-btn')?.addEventListener('click', retryCallback);
  }
}

/**
 * Render an offline / cached data notice (Section 39).
 */
export function renderOfflineState(container) {
  renderErrorState(
    container,
    'Connection unavailable. Showing previously cached interface data where available.'
  );
}

// ─── Loading State Helpers ───────────────────────────────────────────────────

/**
 * Show or hide a loading spinner overlay inside a container.
 * @param {HTMLElement} container
 * @param {boolean} show
 */
export function setLoadingState(container, show) {
  if (!container) return;
  let overlay = container.querySelector('.loading-overlay');
  if (show) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `<div class="spinner" aria-label="Loading..." role="status"></div>`;
      overlay.style.cssText = `
        position: absolute; inset: 0; display: flex;
        align-items: center; justify-content: center;
        background: rgba(var(--color-surface-rgb, 255,255,255), 0.7);
        border-radius: inherit; z-index: 10;
      `;
      container.style.position = 'relative';
      container.appendChild(overlay);
    }
    overlay.style.display = 'flex';
  } else {
    if (overlay) overlay.style.display = 'none';
  }
}

// ─── Function Utilities ───────────────────────────────────────────────────────

/**
 * Debounce a function (Section 43 — performance).
 * @param {Function} fn
 * @param {number} delayMs
 */
export function debounce(fn, delayMs = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delayMs);
  };
}

/**
 * Throttle a function to at most once per interval.
 */
export function throttle(fn, intervalMs = 1000) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= intervalMs) {
      last = now;
      fn.apply(this, args);
    }
  };
}

// ─── URL / Query Helpers ──────────────────────────────────────────────────────

/**
 * Get a named query parameter from the current URL.
 */
export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/**
 * Build a query string from a plain object.
 */
export function buildQueryString(params) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

// ─── Colour Helpers ───────────────────────────────────────────────────────────

/**
 * Map a severity string to a CSS badge class.
 */
export function severityBadge(severity) {
  switch ((severity || '').toUpperCase()) {
    case 'CRITICAL': return 'badge-danger';
    case 'HIGH':     return 'badge-warning';
    case 'MEDIUM':   return 'badge-info';
    case 'LOW':      return 'badge-outline';
    case 'SUCCESS':  return 'badge-success';
    default:         return 'badge-outline';
  }
}

/**
 * Map a generic status string to a CSS badge class.
 */
export function statusBadge(status) {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':
    case 'ONLINE':
    case 'HEALTHY':
    case 'SUCCESS':
    case 'COMPLETED': return 'badge-success';
    case 'WARNING':
    case 'DEGRADED':
    case 'PENDING':
    case 'SCHEDULED': return 'badge-warning';
    case 'ERROR':
    case 'CRITICAL':
    case 'FAILED':
    case 'OFFLINE':   return 'badge-danger';
    default:           return 'badge-outline';
  }
}

export default {
  formatDate, relativeTime, formatElapsed,
  formatINR, formatPct, formatNumber, clamp,
  moistureStatus, batteryStatus,
  escapeHtml, truncate, getInitials, toTitleCase,
  skeletonTableRows, skeletonCard,
  renderEmptyState, renderErrorState, renderOfflineState,
  setLoadingState,
  debounce, throttle,
  getQueryParam, buildQueryString,
  severityBadge, statusBadge
};
