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
   * Top Header Farm Selector Synchronization
   */
  setupFarmSelector() {
    const farmSelect = document.getElementById('farm-select');
    if (!farmSelect) return;

    // Restore saved farm
    const savedFarm = localStorage.getItem('krishi_selected_farm');
    if (savedFarm) {
      farmSelect.value = savedFarm;
    }

    farmSelect.addEventListener('change', (e) => {
      const newFarm = e.target.value;
      localStorage.setItem('krishi_selected_farm', newFarm);
      
      window.dispatchEvent(new CustomEvent('farmchange', {
        detail: { farmId: newFarm }
      }));

      this.showToast(`Switched farm view`, 'info', 2500);
    });
  }

  /**
   * Farmer Profile Display in Header
   */
  setupFarmerProfile() {
    try {
      const sessionData = localStorage.getItem('krishi_farmer_session');
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
