/**
 * KrishiNirnay AI - Centralized Runtime Configuration
 * Handles API Base URLs, Render Wake-up settings, and feature flags.
 */

export const APP_CONFIG = {
  // Production FastAPI Backend URL on Render
  // Fallback to local development server if window.APP_CONFIG is not injected
  API_BASE_URL: window.APP_CONFIG?.API_BASE_URL ||
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8000/api'
      : 'https://krishinirnay-api.onrender.com/api'),

  // Environment mode: 'production' | 'development' | 'demo'
  ENV: window.APP_CONFIG?.ENV || 'production',

  // Render sleep/wake-up detection timeout (30 seconds)
  RENDER_WAKEUP_TIMEOUT_MS: 30000,

  // Polling Intervals (milliseconds)
  SENSOR_POLL_INTERVAL_MS: 10000,
  WEATHER_POLL_INTERVAL_MS: 300000, // 5 mins
  EXECUTION_POLL_INTERVAL_MS: 5000,

  // Feature Flags
  ENABLE_VIRTUAL_IOT: true,
  ENABLE_MOCK_FALLBACK: true, // Gracefully serve simulated telemetry if backend is cold/sleeping

  // App Metadata
  APP_NAME: 'KrishiNirnay AI',
  APP_VERSION: '1.0.0',
  PLATFORM: 'Autonomous Farm-to-Field Advisory & Action Orchestration'
};

export default APP_CONFIG;
