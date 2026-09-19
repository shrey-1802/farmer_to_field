/**
 * KrishiNirnay AI - Farm → Field → Zone Hierarchy Controller (Phase 6)
 * Manages the multi-tier agricultural hierarchy, drill-down navigation,
 * dynamic breadcrumbs, and zone-level virtual IoT sensor telemetry.
 */

import APP_CONFIG from './config.js';
import appShell from './ui.js';

export const HIERARCHY_DATA = {
  'farm-1': {
    id: 'farm-1',
    name: 'Shanti Agro Farm',
    location: 'Rajkot, Gujarat',
    totalAcres: 12.0,
    fields: [
      {
        id: 'field-1',
        name: 'North Cotton Plot',
        acres: 8.8,
        crop: 'BT Cotton (Bt-2)',
        sowingDate: 'June 18, 2026',
        soilType: 'Deep Black Cotton Soil',
        zones: [
          {
            id: 'zone-1',
            name: 'Zone 1: North Acre',
            acres: 3.5,
            valveId: 'Valve A',
            valveStatus: 'CLOSED',
            health: 'optimal',
            sensors: {
              moisture: 41.2,
              temp: 27.4,
              leafWetness: 0,
              solarRadiation: 820,
              npk: { n: 140, p: 35, k: 180 },
              ph: 7.8,
              ec: 0.85
            }
          },
          {
            id: 'zone-2',
            name: 'Zone 2: East Sloped',
            acres: 2.8,
            valveId: 'Valve B',
            valveStatus: 'SCHEDULED',
            health: 'stress',
            sensors: {
              moisture: 24.1,
              temp: 30.1,
              leafWetness: 0,
              solarRadiation: 860,
              npk: { n: 135, p: 30, k: 175 },
              ph: 8.0,
              ec: 0.92
            }
          },
          {
            id: 'zone-3',
            name: 'Zone 3: Central Loam',
            acres: 2.5,
            valveId: 'Valve C',
            valveStatus: 'CLOSED',
            health: 'optimal',
            sensors: {
              moisture: 38.5,
              temp: 28.0,
              leafWetness: 0,
              solarRadiation: 815,
              npk: { n: 145, p: 40, k: 190 },
              ph: 7.6,
              ec: 0.80
            }
          }
        ]
      },
      {
        id: 'field-2',
        name: 'South Boundary Plot',
        acres: 3.2,
        crop: 'Groundnut / Fallow',
        sowingDate: 'July 02, 2026',
        soilType: 'Medium Black Soil',
        zones: [
          {
            id: 'zone-4',
            name: 'Zone 4: South Border',
            acres: 3.2,
            valveId: 'Valve D',
            valveStatus: 'CLOSED',
            health: 'optimal',
            sensors: {
              moisture: 36.3,
              temp: 28.5,
              leafWetness: 0,
              solarRadiation: 830,
              npk: { n: 130, p: 38, k: 170 },
              ph: 7.7,
              ec: 0.82
            }
          }
        ]
      }
    ]
  },
  'farm-2': {
    id: 'farm-2',
    name: 'South Valley Field',
    location: 'Gondal, Gujarat',
    totalAcres: 8.0,
    fields: [
      {
        id: 'field-3',
        name: 'Valley Wheat & Mustard',
        acres: 8.0,
        crop: 'Wheat (GW-496)',
        sowingDate: 'November 12, 2025',
        soilType: 'Alluvial Loam',
        zones: [
          {
            id: 'zone-5',
            name: 'Zone 1: Upper Valley',
            acres: 4.0,
            valveId: 'Valve A1',
            valveStatus: 'CLOSED',
            health: 'optimal',
            sensors: {
              moisture: 39.0,
              temp: 26.2,
              leafWetness: 0,
              solarRadiation: 790,
              npk: { n: 155, p: 45, k: 200 },
              ph: 7.4,
              ec: 0.75
            }
          },
          {
            id: 'zone-6',
            name: 'Zone 2: Lower Terrace',
            acres: 4.0,
            valveId: 'Valve A2',
            valveStatus: 'CLOSED',
            health: 'optimal',
            sensors: {
              moisture: 40.5,
              temp: 25.8,
              leafWetness: 0,
              solarRadiation: 780,
              npk: { n: 150, p: 42, k: 195 },
              ph: 7.5,
              ec: 0.72
            }
          }
        ]
      }
    ]
  }
};

class HierarchyManager {
  constructor() {
    this.selectedFarmId = localStorage.getItem('krishi_selected_farm') || 'farm-1';
    this.selectedFieldId = 'field-1';
    this.selectedZoneId = 'zone-2'; // Default to active stressed zone for demo focus
    this.init();
  }

  init() {
    this.parseUrlParams();
    this.renderHierarchyBreadcrumbs();
    this.renderHierarchySelectorStrip();
    this.initTabs();
    this.bindEvents();
  }

  parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('farm')) this.selectedFarmId = params.get('farm');
    if (params.has('field')) this.selectedFieldId = params.get('field');
    if (params.has('zone')) this.selectedZoneId = params.get('zone');
  }

  getFarm() {
    return HIERARCHY_DATA[this.selectedFarmId] || HIERARCHY_DATA['farm-1'];
  }

  getField() {
    const farm = this.getFarm();
    return farm.fields.find(f => f.id === this.selectedFieldId) || farm.fields[0];
  }

  getZone() {
    const field = this.getField();
    return field.zones.find(z => z.id === this.selectedZoneId) || field.zones[0];
  }

  setHierarchy(farmId, fieldId, zoneId) {
    if (farmId) {
      this.selectedFarmId = farmId;
      localStorage.setItem('krishi_selected_farm', farmId);
      const farm = this.getFarm();
      this.selectedFieldId = farm.fields[0]?.id || '';
      this.selectedZoneId = farm.fields[0]?.zones[0]?.id || '';
    }

    if (fieldId) {
      this.selectedFieldId = fieldId;
      const field = this.getField();
      this.selectedZoneId = field.zones[0]?.id || '';
    }

    if (zoneId) {
      this.selectedZoneId = zoneId;
    }

    this.renderHierarchyBreadcrumbs();
    this.renderHierarchySelectorStrip();
    this.updateActiveZoneView();

    window.dispatchEvent(new CustomEvent('hierarchychange', {
      detail: {
        farm: this.getFarm(),
        field: this.getField(),
        zone: this.getZone()
      }
    }));
  }

  /**
   * Render Hierarchy Breadcrumbs (Section 12)
   */
  renderHierarchyBreadcrumbs() {
    const breadcrumbEl = document.querySelector('.breadcrumb-nav');
    if (!breadcrumbEl) return;

    const farm = this.getFarm();
    const field = this.getField();
    const zone = this.getZone();

    breadcrumbEl.innerHTML = `
      <a href="./dashboard.html">Home</a>
      <span class="breadcrumb-separator">/</span>
      <a href="#" data-nav-tier="farm">${farm.name}</a>
      <span class="breadcrumb-separator">/</span>
      <a href="#" data-nav-tier="field">${field.name}</a>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">${zone.name}</span>
    `;

    breadcrumbEl.querySelector('[data-nav-tier="farm"]')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.renderHierarchySelectorStrip('farm');
    });

    breadcrumbEl.querySelector('[data-nav-tier="field"]')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.renderHierarchySelectorStrip('field');
    });
  }

  /**
   * Render Interactive Hierarchy Drill-down Selector Strip
   */
  renderHierarchySelectorStrip() {
    let strip = document.getElementById('hierarchy-selector-strip');
    if (!strip) {
      strip = document.createElement('section');
      strip.id = 'hierarchy-selector-strip';
      strip.className = 'card hierarchy-strip-card';
      
      const main = document.getElementById('main-content');
      const breadcrumb = document.querySelector('.breadcrumb-nav');
      if (main && breadcrumb) {
        breadcrumb.insertAdjacentElement('afterend', strip);
      }
    }

    const farm = this.getFarm();
    const field = this.getField();
    const currentZone = this.getZone();

    strip.innerHTML = `
      <div class="hierarchy-level-row">
        <div class="hierarchy-group">
          <label class="hierarchy-label">Select Field:</label>
          <div class="hierarchy-pills">
            ${farm.fields.map(f => `
              <button type="button" class="pill-btn ${f.id === this.selectedFieldId ? 'active' : ''}" data-field-id="${f.id}">
                🌾 ${f.name} (${f.acres} Ac)
              </button>
            `).join('')}
          </div>
        </div>

        <div class="hierarchy-group">
          <label class="hierarchy-label">Select Management Zone:</label>
          <div class="hierarchy-pills">
            ${field.zones.map(z => `
              <button type="button" class="pill-btn ${z.id === this.selectedZoneId ? 'active' : ''} ${z.health === 'stress' ? 'pill-stress' : ''}" data-zone-id="${z.id}">
                ${z.name} ${z.health === 'stress' ? '⚠️' : '✓'}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Event listeners for field buttons
    strip.querySelectorAll('[data-field-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setHierarchy(null, btn.getAttribute('data-field-id'), null);
      });
    });

    // Event listeners for zone buttons
    strip.querySelectorAll('[data-zone-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setHierarchy(null, null, btn.getAttribute('data-zone-id'));
      });
    });
  }

  /**
   * Update active zone visual indicators
   */
  updateActiveZoneView() {
    const zone = this.getZone();
    if (!zone) return;

    // Highlight active polygon in SVG map
    document.querySelectorAll('.field-svg-map polygon').forEach(poly => {
      poly.style.strokeWidth = '1.5';
    });

    // SVG polygon mapping
    const polyIndex = zone.id === 'zone-1' ? 1 : zone.id === 'zone-2' ? 2 : zone.id === 'zone-3' ? 3 : 4;
    const activePoly = document.querySelectorAll('.field-svg-map polygon')[polyIndex];
    if (activePoly) {
      activePoly.style.strokeWidth = '4';
    }

    appShell.showToast(`Drilled into ${zone.name}`, 'info', 2000);
  }

  /**
   * Initialize 8-Tab Field Inspection System (Phase 7)
   */
  initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn[data-tab]');
    if (!tabBtns.length) return;

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });

    // Check URL query param or hash for pre-selected tab
    const urlParams = new URLSearchParams(window.location.search);
    const hashTab = window.location.hash.replace('#', '');
    const initialTab = urlParams.get('tab') || hashTab || 'overview';
    this.switchTab(initialTab, false);
  }

  /**
   * Switch Active Tab Pane
   */
  switchTab(tabId, updateUrl = true) {
    const targetPane = document.getElementById(`tab-pane-${tabId}`);
    const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);

    if (!targetPane || !targetBtn) return;

    // Deactivate current tabs
    document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });

    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.remove('active');
    });

    // Activate target
    targetBtn.classList.add('active');
    targetBtn.setAttribute('aria-selected', 'true');
    targetPane.classList.add('active');

    if (updateUrl) {
      const url = new URL(window.location);
      url.searchParams.set('tab', tabId);
      window.history.replaceState(null, '', url);
    }

    // Scroll tab button into view smoothly on mobile devices
    targetBtn.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });

    window.dispatchEvent(new CustomEvent('tabchange', { detail: { tab: tabId } }));
  }

  bindEvents() {
    window.addEventListener('farmchange', (e) => {
      this.setHierarchy(e.detail.farmId, null, null);
    });

    // Interactive Map Overlay controls
    document.querySelectorAll('.map-controls button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.map-controls button').forEach(b => b.classList.remove('active-filter'));
        btn.classList.add('active-filter');
        const isNdvi = btn.textContent.includes('NDVI');
        appShell.showToast(`Switched map layer to ${isNdvi ? 'NDVI Canopy Overlay' : 'Soil Moisture Heatmap'}`, 'info', 2000);
      });
    });

    // Sensor node clicks
    document.querySelectorAll('.sensor-node').forEach((node, idx) => {
      node.addEventListener('click', () => {
        const zoneIds = ['zone-1', 'zone-2', 'zone-3', 'zone-4'];
        if (zoneIds[idx]) {
          this.setHierarchy(null, null, zoneIds[idx]);
        }
      });
    });

    // Listen for zone selections from MapController
    window.addEventListener('mapzoneselect', (e) => {
      if (e.detail?.zoneId) {
        this.setHierarchy(null, null, e.detail.zoneId);
      }
    });
  }
}

export const hierarchyManager = new HierarchyManager();
export default hierarchyManager;
