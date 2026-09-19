/**
 * KrishiNirnay AI - Authentication & Session State Machine (Section 73, 74 & 75)
 * Centralized authentication state management, session tokens, and route guards.
 */

import APP_CONFIG from './config.js';

export const AUTH_STATES = {
  LOGGED_OUT: 'LOGGED_OUT',
  OTP_REQUESTING: 'OTP_REQUESTING',
  OTP_SENT: 'OTP_SENT',
  OTP_VERIFYING: 'OTP_VERIFYING',
  AUTHENTICATED: 'AUTHENTICATED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  LOGOUT_PENDING: 'LOGOUT_PENDING',
  ERROR: 'ERROR'
};

const TOKEN_KEY = 'krishi_auth_token';
const SESSION_KEY = 'krishi_farmer_session';

class AuthManager {
  constructor() {
    this.currentState = this.getInitialState();
  }

  getInitialState() {
    const token = this.getToken();
    const session = this.getSession();
    if (token && session) {
      return AUTH_STATES.AUTHENTICATED;
    }
    return AUTH_STATES.LOGGED_OUT;
  }

  getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  setToken(token, remember = true) {
    try {
      if (remember) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        sessionStorage.setItem(TOKEN_KEY, token);
      }
    } catch (e) {
      console.warn('Unable to persist auth token:', e);
    }
  }

  getSession() {
    try {
      const data = localStorage.getItem(SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  setSession(sessionData) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.warn('Unable to persist farmer session:', e);
    }
  }

  isAuthenticated() {
    return !!(this.getToken() && this.getSession());
  }

  /**
   * Route Guard: Protects authenticated pages (Section 74)
   * Redirects to login.html if session is invalid.
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      // Determine relative path back to login
      const isPagesDir = window.location.pathname.includes('/pages/');
      const loginUrl = isPagesDir ? './login.html' : './pages/login.html';
      window.location.replace(loginUrl);
      return false;
    }
    return true;
  }

  /**
   * Redirects away from login if already authenticated
   */
  redirectIfAuthenticated() {
    if (this.isAuthenticated()) {
      const isPagesDir = window.location.pathname.includes('/pages/');
      const dashboardUrl = isPagesDir ? './dashboard.html' : './pages/dashboard.html';
      window.location.replace(dashboardUrl);
      return true;
    }
    return false;
  }

  /**
   * Demo Account Login Bypass
   */
  loginWithDemo() {
    const demoToken = 'demo-jwt-krishi-' + Math.random().toString(36).substring(2);
    const demoSession = {
      farmerName: 'Ramesh Patel',
      mobile: '+91 98765 43210',
      farmName: 'Shanti Agro Farm',
      acres: 12,
      primaryCrop: 'cotton',
      soilType: 'black-cotton',
      district: 'Rajkot, Gujarat',
      role: 'Farm Owner',
      loginTime: new Date().toISOString(),
      isDemo: true
    };

    this.setToken(demoToken);
    this.setSession(demoSession);
    this.currentState = AUTH_STATES.AUTHENTICATED;

    const isPagesDir = window.location.pathname.includes('/pages/');
    const dashboardUrl = isPagesDir ? './dashboard.html' : './pages/dashboard.html';
    window.location.replace(dashboardUrl);
  }

  /**
   * Logout State & Session Cleansing (Section 73 & 75)
   */
  logout() {
    this.currentState = AUTH_STATES.LOGOUT_PENDING;
    try {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem('krishi_pending_phone');
    } catch (e) {
      console.warn('Error clearing session:', e);
    }
    this.currentState = AUTH_STATES.LOGGED_OUT;

    const isPagesDir = window.location.pathname.includes('/pages/');
    const loginUrl = isPagesDir ? './login.html' : './pages/login.html';
    window.location.replace(loginUrl);
  }
}

export const authManager = new AuthManager();
export default authManager;
