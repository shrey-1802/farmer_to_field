/**
 * KrishiNirnay AI - Profile & Settings Controller (Phase 25)
 * Implements:
 * - Section 31: Profile Details, Farm Management, Field Management, Device Settings,
 *               Notification Preferences, Language, Account Settings, Logout.
 * - Section 69: Settings Page Final Structure, Appearance Card (Light/Dark/System),
 *               Dashboard Token Preview, Compact Mode, Reduced Motion.
 */

import themeManager from './theme.js';
import appShell from './ui.js';

export const DEFAULT_FARM_DATA = {
  farmer: {
    name: 'Ramesh Patel',
    mobile: '+91 98765 43210',
    district: 'Rajkot',
    state: 'Gujarat',
    village: 'Gondal Taluka',
    totalAcres: 12.0,
    experienceYears: 24,
    preferredLanguage: 'en'
  },
  farm: {
    title: 'Shanti Agro Farm',
    registrationNo: 'GJ-RJK-AGR-8842',
    soilType: 'Medium Black Soil (Vertisol)',
    waterSource: 'Borewell #1 (380 ft) & Check Dam Canal',
    pumpSystem: 'Solar Hybrid 7.5 HP (Grid-Tied)',
    irrigationType: 'Precision Drip & Low-Pressure Sprinkler'
  },
  fields: [
    { id: 'FLD-01', name: 'Field 1: North Cotton Basin', crop: 'BT Cotton (Hybrid)', acres: 5.0, zones: 3, irrigation: 'Drip Line A', status: 'ACTIVE' },
    { id: 'FLD-02', name: 'Field 2: South Groundnut Terrace', crop: 'Groundnut (GG-20)', acres: 4.0, zones: 2, irrigation: 'Micro-Sprinkler', status: 'ACTIVE' },
    { id: 'FLD-03', name: 'Field 3: West Cumin Plot', crop: 'Cumin (Gujarat Jeera-4)', acres: 3.0, zones: 1, irrigation: 'Drip Line B', status: 'FALLOW_PREP' }
  ],
  devices: [
    { id: 'VS-MOIST-101', name: 'Soil Moisture Depth Sensor (15cm/30cm)', type: 'Virtual Sensor', zone: 'Zone 2 East', status: 'Online', battery: '98%' },
    { id: 'VS-TEMP-102', name: 'Canopy Air & Surface Temp Sensor', type: 'Virtual Sensor', zone: 'Zone 1 North', status: 'Online', battery: '95%' },
    { id: 'VS-HUMID-103', name: 'Canopy Relative Humidity Sensor', type: 'Virtual Sensor', zone: 'Zone 1 North', status: 'Online', battery: '92%' },
    { id: 'VS-NPK-106', name: 'Soil Optical Nitrate & Potassium Probe', type: 'Virtual Sensor', zone: 'Zone 2 East', status: 'Offline', battery: '14%' },
    { id: 'PS-SOL-01', name: 'Zone 2 Drip Solenoid Valve Actuator', type: 'Physical Sensor', zone: 'Zone 2 East', status: 'Online', battery: '100% (Mains)' },
    { id: 'PS-PUMP-01', name: 'Main Solar Submersible 7.5HP Pump', type: 'Physical Sensor', zone: 'Pump House', status: 'Online', battery: 'Solar DC' },
    { id: 'PS-FLOW-02', name: 'Main Line Ultrasonic Flow Meter', type: 'Physical Sensor', zone: 'Manifold', status: 'Error', battery: 'LoRa Stale' }
  ],
  notifications: {
    whatsapp: true,
    sms: true,
    push: true,
    weatherAlerts: true,
    diseaseRisk: true,
    irrigationUpdates: true,
    marketPrices: false
  },
  preferences: {
    reducedMotion: false,
    compactMode: false
  }
};

class SettingsManager {
  constructor() {
    this.data = this.loadSettings();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('krishi_settings_data');
      if (saved) {
        return { ...DEFAULT_FARM_DATA, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load settings from storage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_FARM_DATA));
  }

  saveSettings() {
    try {
      localStorage.setItem('krishi_settings_data', JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  init() {
    this.populateForm();
    this.renderFieldsList();
    this.renderDeviceSettings();
    this.syncThemeAndAppearance();
    this.bindEvents();
  }

  populateForm() {
    // Farmer details
    const farmer = this.data.farmer;
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };

    setVal('set-farmer-name', farmer.name);
    setVal('set-mobile', farmer.mobile);
    setVal('set-district', `${farmer.district}, ${farmer.state}`);
    setVal('set-village', farmer.village || 'Gondal Taluka');
    setVal('set-acres', farmer.totalAcres);
    setVal('set-experience', farmer.experienceYears);
    setVal('set-language', farmer.preferredLanguage || 'en');

    // Farm details
    const farm = this.data.farm;
    setVal('set-farm-title', farm.title);
    setVal('set-soil-type', farm.soilType);
    setVal('set-water-source', farm.waterSource);
    setVal('set-pump-system', farm.pumpSystem);

    // Notification checkboxes
    const setCheck = (id, checked) => {
      const el = document.getElementById(id);
      if (el) el.checked = !!checked;
    };

    const notifs = this.data.notifications;
    setCheck('notif-whatsapp', notifs.whatsapp);
    setCheck('notif-sms', notifs.sms);
    setCheck('notif-push', notifs.push);
    setCheck('notif-weather', notifs.weatherAlerts);
    setCheck('notif-disease', notifs.diseaseRisk);
    setCheck('notif-irrigation', notifs.irrigationUpdates);
    setCheck('notif-market', notifs.marketPrices);

    // Reduced motion & compact toggles
    setCheck('toggle-reduced-motion', this.data.preferences.reducedMotion);
    setCheck('toggle-compact-mode', this.data.preferences.compactMode);

    this.applyReducedMotion(this.data.preferences.reducedMotion);
    this.applyCompactMode(this.data.preferences.compactMode);
  }

  renderFieldsList() {
    const listEl = document.getElementById('fields-management-list');
    if (!listEl) return;

    listEl.innerHTML = this.data.fields.map(f => `
      <div class="field-setting-card" id="field-card-${f.id}">
        <div class="field-setting-header">
          <span class="field-badge-id">${f.id}</span>
          <span class="badge ${f.status === 'ACTIVE' ? 'badge-success' : 'badge-outline'}">${f.status}</span>
        </div>
        <h4 class="field-setting-name">${f.name}</h4>
        <div class="field-setting-meta">
          <span>Crop: <strong>${f.crop}</strong></span>
          <span>Size: <strong>${f.acres} Acres</strong></span>
          <span>Zones: <strong>${f.zones} Zones</strong></span>
          <span>Method: <strong>${f.irrigation}</strong></span>
        </div>
      </div>
    `).join('');
  }

  renderDeviceSettings() {
    // Section 31 Requirement: Virtual Sensor, Physical Sensor, Offline, Online, Error
    const virtualCount = this.data.devices.filter(d => d.type === 'Virtual Sensor').length;
    const physicalCount = this.data.devices.filter(d => d.type === 'Physical Sensor').length;
    const onlineCount = this.data.devices.filter(d => d.status === 'Online').length;
    const offlineCount = this.data.devices.filter(d => d.status === 'Offline').length;
    const errorCount = this.data.devices.filter(d => d.status === 'Error').length;

    const vEl = document.getElementById('cnt-virtual-sensors');
    const pEl = document.getElementById('cnt-physical-sensors');
    const onEl = document.getElementById('cnt-online-sensors');
    const offEl = document.getElementById('cnt-offline-sensors');
    const errEl = document.getElementById('cnt-error-sensors');

    if (vEl) vEl.textContent = virtualCount;
    if (pEl) pEl.textContent = physicalCount;
    if (onEl) onEl.textContent = onlineCount;
    if (offEl) offEl.textContent = offlineCount;
    if (errEl) errEl.textContent = errorCount;

    // Device table
    const tableBody = document.getElementById('device-matrix-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = this.data.devices.map(d => {
      const isVirtual = d.type === 'Virtual Sensor';
      const statusBadge = d.status === 'Online' ? 'badge-success' :
                          d.status === 'Offline' ? 'badge-danger' : 'badge-warning';

      return `
        <tr>
          <td>
            <div class="device-cell-main">
              <span class="device-type-tag ${isVirtual ? 'tag-virtual' : 'tag-physical'}">${d.type}</span>
              <strong class="device-id-code">${d.id}</strong>
            </div>
            <div class="device-cell-name">${d.name}</div>
          </td>
          <td>${d.zone}</td>
          <td><span class="badge ${statusBadge}">${d.status}</span></td>
          <td><span class="device-battery">${d.battery}</span></td>
        </tr>
      `;
    }).join('');
  }

  syncThemeAndAppearance() {
    // Sync theme radio buttons
    const currentPref = themeManager.currentPreference;
    const radio = document.querySelector(`input[name="theme-choice"][value="${currentPref}"]`);
    if (radio) radio.checked = true;

    // Update live dashboard preview card (Section 69.1)
    this.updateDashboardPreview();
  }

  updateDashboardPreview() {
    const previewEl = document.getElementById('appearance-live-preview');
    if (!previewEl) return;

    const resolved = themeManager.getResolvedTheme();
    previewEl.setAttribute('data-preview-theme', resolved);
  }

  applyReducedMotion(enabled) {
    // Section 69.2: Respect prefers-reduced-motion and toggle class
    document.documentElement.classList.toggle('reduce-motion', !!enabled);
    this.data.preferences.reducedMotion = !!enabled;
    this.saveSettings();
  }

  applyCompactMode(enabled) {
    document.documentElement.classList.toggle('compact-mode', !!enabled);
    this.data.preferences.compactMode = !!enabled;
    this.saveSettings();
  }

  bindEvents() {
    // Theme Radio Selection (Section 69.1)
    document.querySelectorAll('input[name="theme-choice"]').forEach(r => {
      r.addEventListener('change', (e) => {
        themeManager.setTheme(e.target.value);
        this.updateDashboardPreview();
        appShell.showToast(`Theme updated to ${e.target.value.toUpperCase()}`, 'success');
      });
    });

    // Reduced Motion Toggle (Section 69.2)
    const motionToggle = document.getElementById('toggle-reduced-motion');
    if (motionToggle) {
      motionToggle.addEventListener('change', (e) => {
        this.applyReducedMotion(e.target.checked);
        appShell.showToast(e.target.checked ? 'Reduced motion enabled' : 'Smooth animations restored', 'info');
      });
    }

    // Compact Mode Toggle
    const compactToggle = document.getElementById('toggle-compact-mode');
    if (compactToggle) {
      compactToggle.addEventListener('change', (e) => {
        this.applyCompactMode(e.target.checked);
        appShell.showToast(e.target.checked ? 'Compact UI density enabled' : 'Standard spacing restored', 'info');
      });
    }

    // Profile Form Save
    const profileForm = document.getElementById('profile-settings-form');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const farmer = this.data.farmer;
        farmer.name = document.getElementById('set-farmer-name')?.value || farmer.name;
        farmer.village = document.getElementById('set-village')?.value || farmer.village;
        farmer.totalAcres = parseFloat(document.getElementById('set-acres')?.value) || farmer.totalAcres;
        farmer.preferredLanguage = document.getElementById('set-language')?.value || 'en';

        const farm = this.data.farm;
        farm.title = document.getElementById('set-farm-title')?.value || farm.title;
        farm.soilType = document.getElementById('set-soil-type')?.value || farm.soilType;
        farm.waterSource = document.getElementById('set-water-source')?.value || farm.waterSource;

        this.saveSettings();
        appShell.showToast('Profile & Farm configurations saved successfully!', 'success');
      });
    }

    // Notification Toggles Save
    const notifForm = document.getElementById('notification-settings-form');
    if (notifForm) {
      notifForm.addEventListener('change', () => {
        this.data.notifications = {
          whatsapp: document.getElementById('notif-whatsapp')?.checked || false,
          sms: document.getElementById('notif-sms')?.checked || false,
          push: document.getElementById('notif-push')?.checked || false,
          weatherAlerts: document.getElementById('notif-weather')?.checked || false,
          diseaseRisk: document.getElementById('notif-disease')?.checked || false,
          irrigationUpdates: document.getElementById('notif-irrigation')?.checked || false,
          marketPrices: document.getElementById('notif-market')?.checked || false
        };
        this.saveSettings();
        appShell.showToast('Notification preferences updated', 'success');
      });
    }

    // Language selector change
    const langSelect = document.getElementById('set-language');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        const lang = e.target.value;
        this.data.farmer.preferredLanguage = lang;
        this.saveSettings();
        localStorage.setItem('krishi_language', lang);
        appShell.showToast(`Language set to ${e.target.options[e.target.selectedIndex].text}`, 'info');
      });
    }

    // Export Farm Data Button
    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `krishinirnay-farm-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        appShell.showToast('Farm data exported successfully', 'success');
      });
    }

    // Clear Cache Button
    const clearBtn = document.getElementById('clear-cache-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        localStorage.removeItem('krishi_telemetry_cache');
        localStorage.removeItem('krishi_reports_cache');
        appShell.showToast('Local telemetry cache cleared', 'success');
      });
    }

    // Reset Defaults Button
    const resetDefaultsBtn = document.getElementById('reset-defaults-btn');
    if (resetDefaultsBtn) {
      resetDefaultsBtn.addEventListener('click', () => {
        if (confirm('Reset all farm preferences to initial setup defaults?')) {
          this.data = JSON.parse(JSON.stringify(DEFAULT_FARM_DATA));
          this.saveSettings();
          this.populateForm();
          this.renderDeviceSettings();
          appShell.showToast('Settings reset to default', 'info');
        }
      });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to log out from this farm session?')) {
          localStorage.removeItem('krishi_auth_token');
          localStorage.removeItem('krishi_farmer_session');
          sessionStorage.clear();
          window.location.replace('./login.html');
        }
      });
    }
  }
}

export const settingsManager = new SettingsManager();
document.addEventListener('DOMContentLoaded', () => {
  settingsManager.init();
});

export default settingsManager;
