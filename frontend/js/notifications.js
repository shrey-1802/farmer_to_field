/**
 * KrishiNirnay AI - Notification & Alert Center Controller (Phase 21)
 * Implements Section 27: Notifications.
 * 
 * 7 Notification Categories:
 * 1. System Alerts
 * 2. Weather Alerts
 * 3. Risk Alerts
 * 4. Action Updates
 * 5. Sensor Alerts
 * 6. Expert Messages
 * 7. Market Alerts
 * 
 * Notification Attributes:
 * - Title
 * - Description
 * - Severity (CRITICAL, WARNING, INFO, SUCCESS)
 * - Timestamp
 * - Related Field
 * - Related Action
 * - Read / Unread status
 * 
 * Interactive Actions:
 * - Mark Read / Mark All as Read
 * - Acknowledge
 * - View Related Item
 */

import APP_CONFIG from './config.js';
import appShell from './ui.js';

export const NOTIFICATIONS_CATALOG = [
  {
    id: 'NOTIF-01',
    category: 'Risk Alerts',
    title: 'Critical Root-Zone Water Stress in Zone 2',
    description: 'Virtual soil moisture dropped to 24.1% (below 28.0% MAD threshold) during boll formation stage. Immediate drip pulse advised.',
    severity: 'CRITICAL',
    timestamp: '15 mins ago',
    timeValue: Date.now() - 15 * 60 * 1000,
    relatedField: 'North Cotton Plot (Field 1)',
    relatedZone: 'Zone 2: East Sloped',
    relatedAction: 'Action Plan #AP-1082',
    relatedUrl: './action-plans.html',
    isRead: false,
    isAcknowledged: false,
    icon: '🚨'
  },
  {
    id: 'NOTIF-02',
    category: 'Weather Alerts',
    title: 'High Thermal Evaporation Alert for Afternoon',
    description: 'Open-Meteo forecasts peak ambient temperature of 34.0°C with solar radiation 880 W/m² between 13:00 and 15:30. Foliar spray moratorium recommended.',
    severity: 'WARNING',
    timestamp: '42 mins ago',
    timeValue: Date.now() - 42 * 60 * 1000,
    relatedField: 'North Cotton Plot (Field 1)',
    relatedZone: 'All Zones',
    relatedAction: 'Guardrail Moratorium #GD-09',
    relatedUrl: './field-details.html?tab=weather',
    isRead: false,
    isAcknowledged: false,
    icon: '☀️'
  },
  {
    id: 'NOTIF-03',
    category: 'Action Updates',
    title: 'Action Plan #AP-1082 Dispatched for Execution',
    description: 'Precision Drip Irrigation cycle (42,000 Litres across 45m) successfully engaged on Solenoid Valve B.',
    severity: 'SUCCESS',
    timestamp: '1 hour ago',
    timeValue: Date.now() - 60 * 60 * 1000,
    relatedField: 'North Cotton Plot (Field 1)',
    relatedZone: 'Zone 2: East Sloped',
    relatedAction: 'Action Plan #AP-1082',
    relatedUrl: './execution.html?job=AP-1082',
    isRead: true,
    isAcknowledged: true,
    icon: '⚡'
  },
  {
    id: 'NOTIF-04',
    category: 'Expert Messages',
    title: 'Agronomist Endorsement: Bio-Pesticide Azadirachtin',
    description: 'Dr. V. K. Patel (KVK Anand) validated prophylactic neem foliar spray for Whitefly vector suppression in Zone 1 and 3.',
    severity: 'INFO',
    timestamp: '3 hours ago',
    timeValue: Date.now() - 3 * 60 * 60 * 1000,
    relatedField: 'North Cotton Plot (Field 1)',
    relatedZone: 'Zone 1 & Zone 3',
    relatedAction: 'Action Plan #AP-1083',
    relatedUrl: './action-plans.html',
    isRead: true,
    isAcknowledged: false,
    icon: '👨‍🔬'
  },
  {
    id: 'NOTIF-05',
    category: 'Market Alerts',
    title: 'Rajkot APMC Cotton Price Momentum Spike',
    description: 'Modal price rose by +₹80 to ₹7,420/Quintal (+₹298 above MSP). Optimal selling window decision support generated.',
    severity: 'INFO',
    timestamp: '4 hours ago',
    timeValue: Date.now() - 4 * 60 * 60 * 1000,
    relatedField: 'Market Intelligence Service',
    relatedZone: 'Regional Saurashtra Mandis',
    relatedAction: 'Market Signal #MKT-01',
    relatedUrl: './market.html',
    isRead: false,
    isAcknowledged: false,
    icon: '📈'
  },
  {
    id: 'NOTIF-06',
    category: 'Sensor Alerts',
    title: 'Virtual IoT Telemetry Node-02 Recalibrated',
    description: 'Capacitive moisture probe and soil temperature channel successfully passed integrity CRC check with zero packet dropout.',
    severity: 'SUCCESS',
    timestamp: 'Yesterday at 05:20 PM',
    timeValue: Date.now() - 19 * 60 * 60 * 1000,
    relatedField: 'North Cotton Plot (Field 1)',
    relatedZone: 'Zone 2: East Sloped',
    relatedAction: 'Hardware Telemetry Diagnostics',
    relatedUrl: './field-details.html?tab=sensors',
    isRead: true,
    isAcknowledged: true,
    icon: '📡'
  },
  {
    id: 'NOTIF-07',
    category: 'System Alerts',
    title: 'Continuous Autonomous Monitoring Loop Active',
    description: '9 multi-agent decision engines online. Farm consensus cycle #1,492 synchronized with 10-second polling heartbeat.',
    severity: 'INFO',
    timestamp: 'Yesterday at 11:30 PM',
    timeValue: Date.now() - 13 * 60 * 60 * 1000,
    relatedField: 'All Deployed Fields',
    relatedZone: 'Autonomous Orchestrator',
    relatedAction: 'System Self-Check',
    relatedUrl: './agents.html',
    isRead: true,
    isAcknowledged: true,
    icon: '🤖'
  }
];

class NotificationsController {
  constructor() {
    this.notifications = JSON.parse(JSON.stringify(NOTIFICATIONS_CATALOG));
    this.activeFilter = 'ALL'; // 'ALL' | 'UNREAD' | 'CRITICAL' | 'ACTIONS' | 'SYSTEM'
    this.searchQuery = '';
  }

  init() {
    this.render();
    this.bindHeaderActions();
  }

  render() {
    const listContainer = document.querySelector('.notifications-list');
    if (!listContainer) return;

    this.renderFilterTabs();
    const filtered = this.getFilteredNotifications();

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: var(--space-8); background-color: var(--color-card-bg); border-radius: var(--radius-lg); border: 1px dashed var(--color-border);">
          <span style="font-size: 3rem;">🔔</span>
          <h3 style="margin-top: var(--space-3); color: var(--color-text-primary);">No Notifications Match Your Filter</h3>
          <p style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: var(--space-1);">
            Try selecting another category tab or clearing search criteria.
          </p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filtered.map(n => this.renderNotificationCard(n)).join('');
    this.bindCardActions(listContainer);
  }

  renderFilterTabs() {
    let tabs = document.querySelector('.filter-tabs');
    if (!tabs) return;

    const total = this.notifications.length;
    const unread = this.notifications.filter(n => !n.isRead).length;
    const critical = this.notifications.filter(n => n.severity === 'CRITICAL' || n.category === 'Risk Alerts').length;
    const actions = this.notifications.filter(n => n.category === 'Action Updates').length;
    const system = this.notifications.filter(n => n.category === 'System Alerts' || n.category === 'Sensor Alerts').length;

    tabs.innerHTML = `
      <button type="button" class="tab-btn ${this.activeFilter === 'ALL' ? 'active' : ''}" data-filter="ALL">
        All (${total})
      </button>
      <button type="button" class="tab-btn ${this.activeFilter === 'UNREAD' ? 'active' : ''}" data-filter="UNREAD">
        Unread (${unread})
      </button>
      <button type="button" class="tab-btn ${this.activeFilter === 'CRITICAL' ? 'active' : ''}" data-filter="CRITICAL">
        🚨 Critical & Risks (${critical})
      </button>
      <button type="button" class="tab-btn ${this.activeFilter === 'ACTIONS' ? 'active' : ''}" data-filter="ACTIONS">
        ⚡ Actions (${actions})
      </button>
      <button type="button" class="tab-btn ${this.activeFilter === 'SYSTEM' ? 'active' : ''}" data-filter="SYSTEM">
        🤖 System & IoT (${system})
      </button>
    `;

    tabs.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.activeFilter = e.currentTarget.getAttribute('data-filter');
        this.render();
      });
    });
  }

  getFilteredNotifications() {
    return this.notifications.filter(n => {
      if (this.activeFilter === 'UNREAD' && n.isRead) return false;
      if (this.activeFilter === 'CRITICAL' && n.severity !== 'CRITICAL' && n.category !== 'Risk Alerts') return false;
      if (this.activeFilter === 'ACTIONS' && n.category !== 'Action Updates') return false;
      if (this.activeFilter === 'SYSTEM' && n.category !== 'System Alerts' && n.category !== 'Sensor Alerts') return false;

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        return n.title.toLowerCase().includes(q) ||
               n.description.toLowerCase().includes(q) ||
               n.category.toLowerCase().includes(q) ||
               n.relatedField.toLowerCase().includes(q);
      }
      return true;
    });
  }

  renderNotificationCard(n) {
    const sevBadge = n.severity === 'CRITICAL' ? '<span class="badge badge-danger">CRITICAL</span>' :
                     n.severity === 'WARNING' ? '<span class="badge badge-warning">WARNING</span>' :
                     n.severity === 'SUCCESS' ? '<span class="badge badge-success">RESOLVED</span>' :
                     '<span class="badge badge-outline">INFO</span>';

    const borderClass = n.severity === 'CRITICAL' ? 'critical' :
                        n.severity === 'WARNING' ? 'warning' : 'info';

    return `
      <article class="notification-item ${n.isRead ? 'read' : 'unread'} ${borderClass}" id="notif-${n.id}">
        <div class="notif-icon">${n.icon}</div>
        <div class="notif-content" style="width: 100%;">
          <div class="notif-header-row" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-2);">
            <div style="display: flex; align-items: center; gap: var(--space-2);">
              <h2 class="notif-title" style="margin: 0; font-size: var(--font-size-base);">${n.title}</h2>
              ${sevBadge}
              <span class="source-tag source-ai" style="font-size: 9px;">${n.category}</span>
            </div>
            <span class="notif-time">⏱️ ${n.timestamp}</span>
          </div>

          <p class="notif-text" style="margin: var(--space-2) 0;">
            ${n.description}
          </p>

          <!-- Section 27 Metadata: Related Field & Related Action -->
          <div style="display: flex; gap: var(--space-3); flex-wrap: wrap; font-size: 11px; color: var(--color-text-secondary); margin-bottom: var(--space-3); background: var(--color-surface); padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--color-border);">
            <span>🌾 <strong>Field:</strong> ${n.relatedField} (${n.relatedZone})</span>
            ${n.relatedAction ? `<span>📋 <strong>Action:</strong> ${n.relatedAction}</span>` : ''}
            <span>${n.isAcknowledged ? '<strong class="text-success">✓ Acknowledged</strong>' : '<span style="color: var(--color-text-muted);">Unacknowledged</span>'}</span>
          </div>

          <!-- Section 27 Actions: Mark Read, Acknowledge, View Related Item -->
          <div class="notif-meta" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-2);">
            <div style="display: flex; gap: var(--space-2); align-items: center;">
              <button type="button" class="btn btn-sm btn-outline btn-toggle-read" data-notif-id="${n.id}">
                ${n.isRead ? 'Mark as Unread' : '✓ Mark Read'}
              </button>
              ${!n.isAcknowledged ? `
                <button type="button" class="btn btn-sm btn-outline btn-ack-notif" data-notif-id="${n.id}">
                  Acknowledge
                </button>
              ` : ''}
            </div>
            ${n.relatedUrl ? `
              <a href="${n.relatedUrl}" class="btn btn-sm ${n.severity === 'CRITICAL' ? 'btn-primary' : 'btn-outline'}">
                View Related Item →
              </a>
            ` : ''}
          </div>
        </div>
      </article>
    `;
  }

  bindCardActions(container) {
    // Mark Read
    container.querySelectorAll('.btn-toggle-read').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-notif-id');
        const notif = this.notifications.find(n => n.id === id);
        if (notif) {
          notif.isRead = !notif.isRead;
          this.render();
        }
      });
    });

    // Acknowledge
    container.querySelectorAll('.btn-ack-notif').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-notif-id');
        const notif = this.notifications.find(n => n.id === id);
        if (notif) {
          notif.isAcknowledged = true;
          notif.isRead = true;
          appShell.showToast(`Notification #${id} acknowledged.`, 'info', 2500);
          this.render();
        }
      });
    });
  }

  bindHeaderActions() {
    const markAllBtn = document.querySelector('.page-title-banner button');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', () => {
        this.notifications.forEach(n => {
          n.isRead = true;
          n.isAcknowledged = true;
        });
        appShell.showToast('All notifications marked as read and acknowledged.', 'success', 3000);
        this.render();
      });
    }
  }
}

export const notificationsController = new NotificationsController();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => notificationsController.init());
} else {
  notificationsController.init();
}

export default notificationsController;
