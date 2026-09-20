/**
 * KrishiNirnay AI - UI & Application Shell Controller (Phase 3)
 * Manages responsive sidebar drawer, active navigation state, header sync,
 * farmer profile display, and global toast notifications.
 */

import themeManager from './theme.js';
import APP_CONFIG from './config.js';
import authManager from './auth.js';

class ApplicationShell {
  constructor() {
    this.init();
  }

  init() {
    const isAuthPage = window.location.pathname.includes('login.html') ||
                       window.location.pathname.includes('verify-otp.html') ||
                       window.location.pathname.includes('onboarding.html');

    if (!isAuthPage) {
      if (!authManager.requireAuth()) return;
    }

    this.setupThemeToggle();
    this.setupSidebarDrawer();
    this.setupActiveNavigation();
    this.setupFarmSelector();
    this.setupFarmerProfile();
    this.setupNetworkMonitor();
    this.createToastContainer();
  }

  /**
   * Theme Toggle Binding for Header Button
   */
  setupThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
      const current = themeManager.getResolvedTheme();
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      themeManager.setTheme(nextTheme);
      this.showToast(`Switched to ${nextTheme} theme`, 'info', 2000);
    });
  }

  /**
   * Mobile Sidebar Drawer & Backdrop
   */
  setupSidebarDrawer() {
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebar = document.getElementById('app-sidebar');
    if (!toggleBtn || !sidebar) return;

    // Create backdrop element if not present
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
    }

    const openSidebar = () => {
      sidebar.classList.add('open');
      backdrop.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeSidebar = () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
    };

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sidebar.classList.contains('open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    backdrop.addEventListener('click', closeSidebar);

    // Close on navigation link click (mobile)
    sidebar.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          closeSidebar();
        }
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        closeSidebar();
      }
    });
  }

  /**
   * Automatic Active Navigation Detection
   */
  setupActiveNavigation() {
    const currentPath = window.location.pathname;
    const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';

    // Sidebar Links
    document.querySelectorAll('.app-sidebar .nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href.endsWith(currentFile) || (currentFile === '' && href.includes('dashboard.html')))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Mobile Bottom Nav Items
    document.querySelectorAll('.mobile-bottom-nav .mobile-nav-item').forEach(item => {
      const href = item.getAttribute('href');
      if (href && (href.endsWith(currentFile) || (currentFile === '' && href.includes('dashboard.html')))) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * Top Header Farm Selector Synchronization & Multi-Field Management
   */
  setupFarmSelector() {
    const farmSelect = document.getElementById('farm-select');
    if (!farmSelect) return;

    const renderFarmOptions = () => {
      let userFarms = [];
      try {
        const stored = localStorage.getItem('krishi_user_farms');
        if (stored) userFarms = JSON.parse(stored);
      } catch (_) {}

      if (!userFarms || userFarms.length === 0) {
        userFarms = [
          { id: 'farm-1', name: 'Shanti Agro Farm', totalAcres: 12 },
          { id: 'farm-2', name: 'South Valley Field', totalAcres: 8 }
        ];
      }

      farmSelect.innerHTML = '';
      userFarms.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = `${f.name} (${f.totalAcres} Acres)`;
        farmSelect.appendChild(opt);
      });

      // Append '+ Add Another Field' Option
      const addOpt = document.createElement('option');
      addOpt.value = '__add_new_field__';
      addOpt.textContent = '➕ Add Another Field...';
      addOpt.style.fontWeight = 'bold';
      addOpt.style.color = '#16a34a';
      farmSelect.appendChild(addOpt);

      // Restore selected farm or default to first
      const savedFarm = localStorage.getItem('krishi_selected_farm');
      if (savedFarm && userFarms.some(f => f.id === savedFarm)) {
        farmSelect.value = savedFarm;
      } else if (userFarms[0]) {
        farmSelect.value = userFarms[0].id;
        localStorage.setItem('krishi_selected_farm', userFarms[0].id);
      }
    };

    renderFarmOptions();

    farmSelect.addEventListener('change', (e) => {
      const selectedVal = e.target.value;
      if (selectedVal === '__add_new_field__') {
        // Reset to previous value and open modal
        const currentSaved = localStorage.getItem('krishi_selected_farm') || 'farm-1';
        farmSelect.value = currentSaved;
        this.openAddFieldModal(renderFarmOptions);
      } else {
        localStorage.setItem('krishi_selected_farm', selectedVal);
        window.dispatchEvent(new CustomEvent('farmchange', {
          detail: { farmId: selectedVal }
        }));
        this.showToast(`Switched farm view`, 'info', 2500);
      }
    });

    // Add a direct '+ Field' button next to farm selector if wrapper exists
    const wrapper = farmSelect.closest('.farm-selector-wrapper');
    if (wrapper && !document.getElementById('header-add-field-btn')) {
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.id = 'header-add-field-btn';
      addBtn.className = 'btn btn-sm btn-outline';
      addBtn.style.padding = '3px 8px';
      addBtn.style.fontSize = '0.75rem';
      addBtn.style.marginLeft = '6px';
      addBtn.title = 'Add Another Field';
      addBtn.innerHTML = '➕ Field';
      addBtn.addEventListener('click', () => {
        this.openAddFieldModal(renderFarmOptions);
      });
      wrapper.appendChild(addBtn);
    }
  }

  /**
   * Modal Dialog to Add Another Field with Size, Location & Crops per Side
   */
  openAddFieldModal(onSuccessCallback) {
    let modal = document.getElementById('add-field-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'add-field-modal';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100vw';
      modal.style.height = '100vh';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      modal.style.backdropFilter = 'blur(4px)';
      modal.style.zIndex = '9999';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.padding = '1rem';

      modal.innerHTML = `
        <div style="background: var(--color-surface, #ffffff); border-radius: 16px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 2rem; box-shadow: 0 20px 40px rgba(0,0,0,0.25); border: 1px solid var(--color-border, #e2e8f0);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <h2 style="font-size: 1.25rem; font-weight: 800; color: #14532d; margin: 0;">➕ Register Another Field / Plot</h2>
            <button type="button" id="close-add-field-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">&times;</button>
          </div>

          <form id="add-field-form">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
              <div>
                <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Field Name *</label>
                <input type="text" id="new-field-name" required placeholder="e.g. East River Plot" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.9rem;">
              </div>
              <div>
                <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Field Size (Acres) *</label>
                <input type="number" id="new-field-acres" min="0.5" step="0.5" required placeholder="e.g. 8" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.9rem;">
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
              <div>
                <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Location / Village</label>
                <input type="text" id="new-field-location" placeholder="e.g. Gondal, Gujarat" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.9rem;">
              </div>
              <div>
                <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 4px;">Soil Type</label>
                <select id="new-field-soil" style="width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.9rem;">
                  <option value="Deep Black Cotton Soil">Black Cotton Soil (काली मिट्टी)</option>
                  <option value="Alluvial Loam" selected>Alluvial Loam (जलोढ़ मिट्टी)</option>
                  <option value="Red Sandy Loam">Red Sandy Loam (लाल मिट्टी)</option>
                  <option value="Clayey Loam">Clayey Loam (चिकनी मिट्टी)</option>
                </select>
              </div>
            </div>

            <h3 style="font-size: 0.9rem; font-weight: 800; color: #16a34a; text-transform: uppercase; margin-bottom: 0.75rem;">🧭 Which crop on which side?</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.5rem;">
              <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <label style="font-size: 0.75rem; font-weight: 700; color: #2563eb;">⬆️ North Side Crop</label>
                <input type="text" id="new-crop-north" placeholder="e.g. Wheat" value="Wheat" style="width: 100%; padding: 6px; border-radius: 6px; border: 1px solid #cbd5e1; margin-top: 4px; font-size: 0.85rem;">
              </div>
              <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <label style="font-size: 0.75rem; font-weight: 700; color: #d97706;">⬇️ South Side Crop</label>
                <input type="text" id="new-crop-south" placeholder="e.g. Mustard" value="Mustard" style="width: 100%; padding: 6px; border-radius: 6px; border: 1px solid #cbd5e1; margin-top: 4px; font-size: 0.85rem;">
              </div>
              <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <label style="font-size: 0.75rem; font-weight: 700; color: #16a34a;">➡️ East Side Crop</label>
                <input type="text" id="new-crop-east" placeholder="e.g. Cotton" value="Cotton" style="width: 100%; padding: 6px; border-radius: 6px; border: 1px solid #cbd5e1; margin-top: 4px; font-size: 0.85rem;">
              </div>
              <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                <label style="font-size: 0.75rem; font-weight: 700; color: #9333ea;">⬅️ West Side Crop</label>
                <input type="text" id="new-crop-west" placeholder="e.g. Fallow / Veg" value="Vegetables" style="width: 100%; padding: 6px; border-radius: 6px; border: 1px solid #cbd5e1; margin-top: 4px; font-size: 0.85rem;">
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
              <button type="button" id="cancel-add-field" class="btn btn-outline btn-sm">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm">Save & Switch to This Field</button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(modal);

      const closeModal = () => { modal.style.display = 'none'; };
      document.getElementById('close-add-field-modal').addEventListener('click', closeModal);
      document.getElementById('cancel-add-field').addEventListener('click', closeModal);

      document.getElementById('add-field-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('new-field-name').value.trim();
        const acres = parseFloat(document.getElementById('new-field-acres').value) || 5;
        const loc = document.getElementById('new-field-location').value.trim() || 'Gujarat';
        const soil = document.getElementById('new-field-soil').value;

        const newId = 'farm-' + Date.now();
        const newField = {
          id: newId,
          name: name,
          totalAcres: acres,
          location: loc,
          soilType: soil,
          crops: {
            north: { side: 'North Side', crop: document.getElementById('new-crop-north').value },
            south: { side: 'South Side', crop: document.getElementById('new-crop-south').value },
            east: { side: 'East Side', crop: document.getElementById('new-crop-east').value },
            west: { side: 'West Side', crop: document.getElementById('new-crop-west').value }
          }
        };

        let userFarms = [];
        try {
          const stored = localStorage.getItem('krishi_user_farms');
          if (stored) userFarms = JSON.parse(stored);
        } catch (_) {}

        userFarms.push(newField);
        localStorage.setItem('krishi_user_farms', JSON.stringify(userFarms));
        localStorage.setItem('krishi_selected_farm', newId);

        closeModal();
        if (onSuccessCallback) onSuccessCallback();

        window.dispatchEvent(new CustomEvent('farmchange', {
          detail: { farmId: newId }
        }));
        this.showToast(`Registered new field: ${name} (${acres} Acres)!`, 'success', 4000);
      });
    }

    modal.style.display = 'flex';
  }

  /**
   * Farmer Profile Display in Header & Logout Handler
   */
  setupFarmerProfile() {
    try {
      const sessionData = localStorage.getItem('krishi_farmer_session');
      const farmerPill = document.querySelector('.farmer-pill');

      if (farmerPill) {
        farmerPill.style.cursor = 'pointer';
        farmerPill.title = 'Click to Logout / Switch Account';
        farmerPill.addEventListener('click', () => {
          if (confirm('Do you want to log out or switch farmer account?')) {
            authManager.logout();
          }
        });
      }

      // Add Logout item to Sidebar if not already present
      const navList = document.querySelector('.sidebar-nav ul:last-of-type');
      if (navList && !document.getElementById('sidebar-logout-item')) {
        const logoutLi = document.createElement('li');
        logoutLi.className = 'nav-item';
        logoutLi.id = 'sidebar-logout-item';
        logoutLi.innerHTML = `
          <a href="#" class="nav-link" id="sidebar-logout-btn" style="color: #ef4444;" title="Log out from current session">
            <span class="nav-icon">🚪</span>
            <span class="nav-text">Logout / Switch</span>
          </a>
        `;
        logoutLi.querySelector('a').addEventListener('click', (e) => {
          e.preventDefault();
          if (confirm('Are you sure you want to log out?')) {
            authManager.logout();
          }
        });
        navList.appendChild(logoutLi);
      }

      if (!sessionData) return;

      const session = JSON.parse(sessionData);
      const nameEl = document.getElementById('user-display-name');
      const avatarEl = document.querySelector('.farmer-avatar');

      if (nameEl && session.farmerName) {
        nameEl.textContent = session.farmerName;
      }

      if (avatarEl && session.farmerName) {
        const initials = session.farmerName
          .split(' ')
          .map(n => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
        avatarEl.textContent = initials;
      }
    } catch (e) {
      console.warn('Error reading farmer session:', e);
    }
  }

  /**
   * Online/Offline Network Status Monitor
   */
  setupNetworkMonitor() {
    const updateNetworkStatus = () => {
      if (!navigator.onLine) {
        this.showToast('You are offline. Showing cached field telemetry.', 'warning', 6000);
      } else {
        this.showToast('Network restored. Reconnected to FastAPI backend.', 'success', 3000);
      }
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
  }

  /**
   * Toast Container Creation
   */
  createToastContainer() {
    if (document.getElementById('toast-container')) return;
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  /**
   * Show Toast Notification
   */
  showToast(message, type = 'info', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      this.createToastContainer();
      container = document.getElementById('toast-container');
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: '✓',
      warning: '⚠️',
      danger: '✕',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ'}</span>
      <span class="toast-msg">${message}</span>
      <button class="toast-close" aria-label="Close notification">&times;</button>
    `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    const removeToast = () => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 250);
    };

    toast.querySelector('.toast-close').addEventListener('click', removeToast);
    if (duration > 0) {
      setTimeout(removeToast, duration);
    }
  }
}

export const appShell = new ApplicationShell();
export default appShell;
