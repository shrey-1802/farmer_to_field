/**
 * KrishiNirnay AI - Unified Action Feedback & Persistent State Controller
 * Section 46 (Phase 40) Compliance
 * Provides explicit Toast feedback + Persistent State updates for all 8 standard user actions
 */

(function () {
  'use strict';

  const AUDIT_STORAGE_KEY = 'krishinirnay_audit_log';

  const UIFeedback = {
    /**
     * Internal audit log of farmer actions
     */
    _auditLog: [],

    init: function () {
      try {
        const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
        if (stored) {
          this._auditLog = JSON.parse(stored);
        }
      } catch (_) {
        this._auditLog = [];
      }
    },

    /**
     * Record an action into persistent audit log
     * @param {string} actionName
     * @param {object} detail
     */
    _recordAudit: function (actionName, detail = {}) {
      const entry = {
        id: 'act_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        action: actionName,
        detail: detail,
        timestamp: new Date().toISOString(),
        formattedTime: new Date().toLocaleTimeString()
      };

      this._auditLog.unshift(entry);
      if (this._auditLog.length > 50) {
        this._auditLog = this._auditLog.slice(0, 50);
      }

      try {
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this._auditLog));
      } catch (_) {}

      // Dispatch global event for live UI subscribers
      window.dispatchEvent(
        new CustomEvent('krishinirnay:action_feedback', {
          detail: entry
        })
      );

      return entry;
    },

    /**
     * 1. Action Approved (Section 46 Standard)
     * @param {string} planId
     * @param {object} [details]
     */
    approveAction: function (planId, details = {}) {
      const planTitle = details.title || `Plan #${planId}`;
      const message = `Autonomous action "${planTitle}" has been approved for execution.`;

      // 1. Toast Notification
      if (window.Toast) {
        window.Toast.success('Action approved', message);
      }

      // 2. Screen Reader Polite Announcement
      if (window.A11y) {
        window.A11y.announce(`Action approved: ${planTitle}`);
      }

      // 3. Persistent State Update
      if (window.AppState) {
        window.AppState.set(`action_status_${planId}`, {
          status: 'APPROVED',
          planId: planId,
          approvedAt: new Date().toISOString(),
          approvedBy: window.AppState.currentUser ? window.AppState.currentUser.phone : 'Authorized Farmer'
        }, true);
      }

      return this._recordAudit('Action approved', { planId, title: planTitle, status: 'APPROVED' });
    },

    /**
     * 2. Action Rejected (Section 46 Standard)
     * @param {string} planId
     * @param {string} [reason]
     */
    rejectAction: function (planId, reason = 'Manually rejected by field operator.') {
      const message = `Action Plan #${planId} rejected. Reason: ${reason}`;

      // 1. Toast Notification
      if (window.Toast) {
        window.Toast.warning('Action rejected', message);
      }

      // 2. Screen Reader Announcement
      if (window.A11y) {
        window.A11y.announce(`Action rejected: Plan #${planId}`);
      }

      // 3. Persistent State Update
      if (window.AppState) {
        window.AppState.set(`action_status_${planId}`, {
          status: 'REJECTED',
          planId: planId,
          reason: reason,
          rejectedAt: new Date().toISOString()
        }, true);
      }

      return this._recordAudit('Action rejected', { planId, reason, status: 'REJECTED' });
    },

    /**
     * 3. Expert Review Requested (Section 46 Standard)
     * @param {string} planId
     * @param {string} [expertRole]
     */
    requestExpertReview: function (planId, expertRole = 'Krishi Vigyan Kendra Agronomist') {
      const message = `Action Plan #${planId} forwarded to ${expertRole} for agronomic validation.`;

      // 1. Toast Notification
      if (window.Toast) {
        window.Toast.info('Expert review requested', message);
      }

      // 2. Screen Reader Announcement
      if (window.A11y) {
        window.A11y.announce(`Expert review requested for Plan #${planId}`);
      }

      // 3. Persistent State Update
      if (window.AppState) {
        window.AppState.set(`action_status_${planId}`, {
          status: 'UNDER_REVIEW',
          planId: planId,
          assignedTo: expertRole,
          requestedAt: new Date().toISOString()
        }, true);
      }

      return this._recordAudit('Expert review requested', { planId, expertRole, status: 'UNDER_REVIEW' });
    },

    /**
     * 4. Simulation Started (Section 46 Standard)
     * @param {string} scenarioName
     */
    startSimulation: function (scenarioName) {
      const message = `Scenario simulation "${scenarioName}" initiated. Telemetry stress test running.`;

      // 1. Toast Notification
      if (window.Toast) {
        window.Toast.info('Simulation started', message);
      }

      // 2. Screen Reader Announcement
      if (window.A11y) {
        window.A11y.announce(`Simulation started: ${scenarioName}`);
      }

      // 3. Persistent State Update
      if (window.AppState) {
        window.AppState.set('simulation_active', {
          status: 'RUNNING',
          scenario: scenarioName,
          startedAt: new Date().toISOString()
        }, true);
      }

      return this._recordAudit('Simulation started', { scenario: scenarioName, status: 'RUNNING' });
    },

    /**
     * 5. Simulation Completed (Section 46 Standard)
     * @param {string} scenarioName
     * @param {string} [resultSummary]
     */
    completeSimulation: function (scenarioName, resultSummary = 'Telemetry re-synchronized with simulated readings.') {
      const message = `Simulation "${scenarioName}" completed. ${resultSummary}`;

      // 1. Toast Notification
      if (window.Toast) {
        window.Toast.success('Simulation completed', message);
      }

      // 2. Screen Reader Announcement
      if (window.A11y) {
        window.A11y.announce(`Simulation completed: ${scenarioName}`);
      }

      // 3. Persistent State Update
      if (window.AppState) {
        window.AppState.set('simulation_active', {
          status: 'COMPLETED',
          scenario: scenarioName,
          completedAt: new Date().toISOString(),
          summary: resultSummary
        }, true);
      }

      return this._recordAudit('Simulation completed', { scenario: scenarioName, summary: resultSummary, status: 'COMPLETED' });
    },

    /**
     * 6. Irrigation Started (Section 46 Standard)
     * @param {string} zoneName
     * @param {object} [params]
     */
    startIrrigation: function (zoneName, params = { rateLpm: 14.5, durationMinutes: 30 }) {
      const message = `Drip irrigation pump started on ${zoneName} (${params.rateLpm} L/min, ${params.durationMinutes} min).`;

      // 1. Toast Notification
      if (window.Toast) {
        window.Toast.success('Irrigation started', message);
      }

      // 2. Screen Reader Announcement
      if (window.A11y) {
        window.A11y.announce(`Irrigation started on ${zoneName}`);
      }

      // 3. Persistent State Update
      if (window.AppState) {
        window.AppState.set(`irrigation_${zoneName}`, {
          status: 'RUNNING',
          zone: zoneName,
          flowRate: params.rateLpm,
          startedAt: new Date().toISOString()
        }, true);
      }

      return this._recordAudit('Irrigation started', { zone: zoneName, params, status: 'RUNNING' });
    },

    /**
     * 7. Irrigation Paused (Section 46 Standard)
     * @param {string} zoneName
     * @param {string} [reason]
     */
    pauseIrrigation: function (zoneName, reason = 'Rainfall surge forecast detected.') {
      const message = `Irrigation paused on ${zoneName}. Reason: ${reason}`;

      // 1. Toast Notification
      if (window.Toast) {
        window.Toast.warning('Irrigation paused', message);
      }

      // 2. Screen Reader Announcement
      if (window.A11y) {
        window.A11y.announce(`Irrigation paused on ${zoneName}`);
      }

      // 3. Persistent State Update
      if (window.AppState) {
        window.AppState.set(`irrigation_${zoneName}`, {
          status: 'PAUSED',
          zone: zoneName,
          reason: reason,
          pausedAt: new Date().toISOString()
        }, true);
      }

      return this._recordAudit('Irrigation paused', { zone: zoneName, reason, status: 'PAUSED' });
    },

    /**
     * 8. Notification Acknowledged (Section 46 Standard)
     * @param {string} notificationId
     * @param {string} [title]
     */
    acknowledgeNotification: function (notificationId, title = 'Risk Alert') {
      const message = `Notification "${title}" acknowledged and archived.`;

      // 1. Toast Notification
      if (window.Toast) {
        window.Toast.info('Notification acknowledged', message);
      }

      // 2. Screen Reader Announcement
      if (window.A11y) {
        window.A11y.announce(`Notification acknowledged: ${title}`);
      }

      // 3. Persistent State Update
      if (window.AppState) {
        const notifs = window.AppState.get('notifications') || [];
        const updated = notifs.map(n => n.id === notificationId ? { ...n, acknowledged: true } : n);
        window.AppState.set('notifications', updated, true);
        window.AppState.set(`notif_ack_${notificationId}`, true, true);
      }

      return this._recordAudit('Notification acknowledged', { id: notificationId, title, status: 'ACKNOWLEDGED' });
    },

    /**
     * Get recent audit history of actions
     * @returns {Array<object>}
     */
    getAuditLog: function () {
      return [...this._auditLog];
    },

    /**
     * Clear audit log
     */
    clearAuditLog: function () {
      this._auditLog = [];
      try {
        localStorage.removeItem(AUDIT_STORAGE_KEY);
      } catch (_) {}
      window.dispatchEvent(new CustomEvent('krishinirnay:action_feedback', { detail: { action: 'CLEARED' } }));
    }
  };

  // Initialize immediately
  UIFeedback.init();

  // Export globally
  window.UIFeedback = UIFeedback;
})();
