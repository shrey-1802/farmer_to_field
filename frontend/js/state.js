/**
 * KrishiNirnay AI - Shared Client-Side State Manager (Phase 27 / Section 33)
 *
 * Central reactive store for all cross-page application state:
 * - Active farm / field / zone selection
 * - Current farmer session profile
 * - Simulation status
 * - Network online/offline state
 * - Pending action count badge
 *
 * Modules subscribe to state changes via addEventListener('statechange', cb)
 * on the returned emitter, rather than polling or re-fetching.
 */

class StateManager extends EventTarget {
  constructor() {
    super();

    // ── Session / Farmer Profile ──────────────────────────────────────────
    this._farmer = this._loadFromStorage('krishi_farmer_session', null);

    // ── Farm / Field / Zone Selection ────────────────────────────────────
    this._activeFarmId   = this._loadFromStorage('krishi_active_farm', 'farm-1');
    this._activeFieldId  = this._loadFromStorage('krishi_active_field', 'field-1');
    this._activeZoneId   = null;

    // ── Simulation ───────────────────────────────────────────────────────
    this._simulationActive   = false;
    this._simulationScenario = null;
    this._simulationStartTs  = null;

    // ── Network ──────────────────────────────────────────────────────────
    this._online = navigator.onLine;
    window.addEventListener('online',  () => this._setOnline(true));
    window.addEventListener('offline', () => this._setOnline(false));

    // ── Notification / Action Badges ─────────────────────────────────────
    this._unreadNotificationCount = 0;
    this._pendingActionCount       = 0;
  }

  // ─── Internal helpers ─────────────────────────────────────────────────────

  _loadFromStorage(key, defaultVal) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  _saveToStorage(key, value) {
    try {
      if (value === null || value === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch { /* storage quota or private browsing */ }
  }

  _emit(eventName, detail = {}) {
    this.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true }));
    this.dispatchEvent(new CustomEvent('statechange', { detail: { event: eventName, ...detail }, bubbles: true }));
  }

  // ─── Farmer / Session ────────────────────────────────────────────────────

  get farmer() { return this._farmer; }

  setFarmer(profile) {
    this._farmer = profile;
    this._saveToStorage('krishi_farmer_session', profile);
    this._emit('farmer:updated', { farmer: profile });
  }

  clearFarmer() {
    this._farmer = null;
    localStorage.removeItem('krishi_farmer_session');
    localStorage.removeItem('krishi_auth_token');
    this._emit('farmer:cleared');
  }

  get isLoggedIn() {
    return !!(localStorage.getItem('krishi_auth_token'));
  }

  // ─── Farm / Field / Zone ─────────────────────────────────────────────────

  get activeFarmId() { return this._activeFarmId; }
  get activeFieldId() { return this._activeFieldId; }
  get activeZoneId()  { return this._activeZoneId; }

  setActiveFarm(farmId) {
    this._activeFarmId = farmId;
    this._saveToStorage('krishi_active_farm', farmId);
    this._emit('farm:changed', { farmId });
  }

  setActiveField(fieldId) {
    this._activeFieldId = fieldId;
    this._saveToStorage('krishi_active_field', fieldId);
    this._emit('field:changed', { fieldId });
  }

  setActiveZone(zoneId) {
    this._activeZoneId = zoneId;
    this._emit('zone:changed', { zoneId });
  }

  // ─── Simulation State ────────────────────────────────────────────────────

  get isSimulationActive() { return this._simulationActive; }
  get simulationScenario() { return this._simulationScenario; }
  get simulationStartTs()  { return this._simulationStartTs; }

  setSimulation(active, scenario = null) {
    this._simulationActive   = active;
    this._simulationScenario = scenario;
    this._simulationStartTs  = active ? Date.now() : null;
    this._emit('simulation:changed', { active, scenario });
  }

  // ─── Network ─────────────────────────────────────────────────────────────

  get isOnline() { return this._online; }

  _setOnline(online) {
    this._online = online;
    this._emit('network:changed', { online });
  }

  // ─── Badges ──────────────────────────────────────────────────────────────

  get unreadNotificationCount() { return this._unreadNotificationCount; }
  get pendingActionCount()       { return this._pendingActionCount; }

  setNotificationCount(count) {
    this._unreadNotificationCount = count;
    this._emit('notifications:count', { count });
    this._updateBadge('notification-badge', count);
  }

  setPendingActionCount(count) {
    this._pendingActionCount = count;
    this._emit('actions:count', { count });
    this._updateBadge('actions-badge', count);
  }

  _updateBadge(id, count) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = count > 99 ? '99+' : String(count);
    el.style.display = count > 0 ? 'inline-flex' : 'none';
  }
}

// ─── Singleton Export ────────────────────────────────────────────────────────

export const appState = new StateManager();
export default appState;
