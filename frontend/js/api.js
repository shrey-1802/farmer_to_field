/**
 * KrishiNirnay AI - Centralized API Service Layer (Phase 27 / Section 34)
 *
 * Single source of truth for all backend HTTP communication.
 * - Base URL from APP_CONFIG (Section 35)
 * - Auth headers from localStorage token
 * - Standardized error handling for all HTTP codes (Section 37)
 * - Render sleep / backend wake-up detection & retry prompt (Section 38)
 * - Mock fallback on failure when ENABLE_MOCK_FALLBACK = true
 *
 * Domain functions (Section 34 required contracts):
 *   getFarms, getFields, getSensors, getSensorReadings,
 *   getWeather, getAgents, getRisks, getActions,
 *   approveAction, rejectAction, getTasks,
 *   startExecution, stopExecution, getNotifications,
 *   runSimulation, getSimulationStatus, getAlerts,
 *   acknowledgeAlert, sendOTP, verifyOTP, getCurrentUser
 */

import APP_CONFIG from './config.js';

// ─── Error Codes → User Messages (Section 37) ──────────────────────────────

const HTTP_ERROR_MESSAGES = {
  400: 'Invalid request. Please check your inputs.',
  401: 'Session expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  408: 'The request timed out. Please try again.',
  409: 'A conflict occurred. Please refresh and try again.',
  422: 'Validation error. Please review your data.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Server error. Our team has been notified.',
  502: 'Backend gateway error. Please try again shortly.',
  503: 'Service temporarily unavailable. Backend may be waking up.'
};

// ─── Wake-Up State ───────────────────────────────────────────────────────────

let _renderWakeUpShown = false;

function showWakeUpBanner(show) {
  const banner = document.getElementById('render-wakeup-banner');
  if (banner) {
    banner.style.display = show ? 'flex' : 'none';
  }
  _renderWakeUpShown = show;
}

// ─── Core API Request (Section 34) ──────────────────────────────────────────

/**
 * Central API request function — all domain functions route through here.
 * @param {string} endpoint  - Path relative to API_BASE_URL (e.g. '/farms')
 * @param {object} options   - fetch() options override
 * @returns {Promise<any>}   - Parsed JSON response
 */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('krishi_auth_token');

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    APP_CONFIG.RENDER_WAKEUP_TIMEOUT_MS || 30000
  );

  const url = `${APP_CONFIG.API_BASE_URL}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    showWakeUpBanner(false);

    // Parse body (may be empty on 204)
    let data = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      data = await res.json();
    }

    if (!res.ok) {
      // Handle 401 → redirect to login
      if (res.status === 401) {
        localStorage.removeItem('krishi_auth_token');
        localStorage.removeItem('krishi_farmer_session');
        window.location.href = './login.html';
        return;
      }

      const serverMsg = data?.error?.message || data?.detail || null;
      const userMsg = serverMsg || HTTP_ERROR_MESSAGES[res.status] || `Error ${res.status}`;

      throw new ApiError(res.status, userMsg, data?.error?.code || 'API_ERROR', data?.error?.request_id);
    }

    return data;

  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) throw err;

    // Network failure / Render cold-start / AbortError (timeout)
    if (err.name === 'AbortError') {
      showWakeUpBanner(true);
      throw new ApiError(
        408,
        'Backend is waking up. Please try again in a few seconds.',
        'RENDER_COLD_START'
      );
    }

    // CORS / network offline
    showWakeUpBanner(true);
    throw new ApiError(
      503,
      'Connection unavailable. Showing previously cached interface data where available.',
      'NETWORK_ERROR'
    );
  }
}

// ─── ApiError Class ──────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(status, message, code = 'API_ERROR', requestId = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

// ─── Domain Functions — Authentication (Section 36) ─────────────────────────

export async function registerUser(userData) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

export async function loginUser(credentials) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
}

export async function sendOTP(mobile) {
  return apiRequest('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile })
  });
}

export async function verifyOTP(mobile, otp) {
  return apiRequest('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile, otp })
  });
}

export async function getCurrentUser() {
  return apiRequest('/auth/me');
}

export async function logoutUser() {
  return apiRequest('/auth/logout', { method: 'POST' });
}

// ─── Domain Functions — Farms (Section 36) ──────────────────────────────────

export async function getFarms() {
  return apiRequest('/farms');
}

export async function getFarm(farmId) {
  return apiRequest(`/farms/${farmId}`);
}

export async function createFarm(data) {
  return apiRequest('/farms', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Domain Functions — Fields (Section 36) ─────────────────────────────────

export async function getFields(farmId) {
  return farmId ? apiRequest(`/farms/${farmId}/fields`) : apiRequest('/fields');
}

export async function getField(fieldId) {
  return apiRequest(`/fields/${fieldId}`);
}

export async function createField(data) {
  return apiRequest('/fields', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Domain Functions — Sensors (Section 36) ────────────────────────────────

export async function getSensors(farmId) {
  return farmId ? apiRequest(`/sensors?farm_id=${farmId}`) : apiRequest('/sensors');
}

export async function createSensor(data) {
  return apiRequest('/sensors', { method: 'POST', body: JSON.stringify(data) });
}

export async function getSensor(sensorId) {
  return apiRequest(`/sensors/${sensorId}`);
}

export async function getSensorReadings(sensorId) {
  return apiRequest(`/sensors/${sensorId}/readings`);
}

export async function getZoneSensors(zoneId) {
  return apiRequest(`/zones/${zoneId}/sensors`);
}

// ─── Domain Functions — Weather (Section 36) ────────────────────────────────

export async function getWeatherCurrent() {
  return apiRequest('/weather/current');
}

export async function getWeatherFarm(farmId) {
  return apiRequest(`/weather/farm/${farmId}`);
}

export async function getWeather(farmId) {
  return apiRequest(farmId ? `/weather/farm/${farmId}` : '/weather/current');
}

export async function getWeatherForecast() {
  return apiRequest('/weather/forecast');
}

export async function getWeatherHourly() {
  return apiRequest('/weather/hourly');
}

// ─── Domain Functions — AI Agents (Section 36) ──────────────────────────────

export async function getAgents() {
  return apiRequest('/agents');
}

export async function getAgent(agentId) {
  return apiRequest(`/agents/${agentId}`);
}

export async function getAgentRuns(agentId) {
  return apiRequest(`/agents/${agentId}/runs`);
}

// ─── Domain Functions — Risks (Section 36) ──────────────────────────────────

export async function getRisks(fieldId) {
  return apiRequest(fieldId ? `/risks?field_id=${fieldId}` : '/risks');
}

export async function getRisk(riskId) {
  return apiRequest(`/risks/${riskId}`);
}

// ─── Domain Functions — Actions (Section 36) ────────────────────────────────

export async function getActions(farmId) {
  return apiRequest(farmId ? `/actions?farm_id=${farmId}` : '/actions');
}

export async function getAction(actionId) {
  return apiRequest(`/actions/${actionId}`);
}

export async function approveAction(actionId) {
  return apiRequest(`/actions/${actionId}/approve`, { method: 'POST' });
}

export async function rejectAction(actionId, reason) {
  return apiRequest(`/actions/${actionId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
}

export async function requestExpertReview(actionId, notes) {
  return apiRequest(`/actions/${actionId}/expert-review`, {
    method: 'POST',
    body: JSON.stringify({ notes })
  });
}

// ─── Domain Functions — Tasks (Section 36) ──────────────────────────────────

export async function getTasks(farmId) {
  return apiRequest(farmId ? `/tasks?farm_id=${farmId}` : '/tasks');
}

export async function getTask(taskId) {
  return apiRequest(`/tasks/${taskId}`);
}

export async function startTask(taskId) {
  return apiRequest(`/tasks/${taskId}/start`, { method: 'POST' });
}

export async function completeTask(taskId) {
  return apiRequest(`/tasks/${taskId}/complete`, { method: 'POST' });
}

export async function failTask(taskId, reason) {
  return apiRequest(`/tasks/${taskId}/fail`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
}

// ─── Domain Functions — Execution (Section 36) ──────────────────────────────

export async function startExecution(payload) {
  return apiRequest('/execution/irrigation/start', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function pauseExecution(jobId) {
  return apiRequest('/execution/irrigation/pause', {
    method: 'POST',
    body: JSON.stringify({ job_id: jobId })
  });
}

export async function stopExecution(jobId) {
  return apiRequest('/execution/irrigation/stop', {
    method: 'POST',
    body: JSON.stringify({ job_id: jobId })
  });
}

export async function getExecution(jobId) {
  return apiRequest(`/execution/irrigation/${jobId}`);
}

// ─── Domain Functions — Notifications / Alerts (Section 36) ─────────────────

export async function getAlerts(farmId) {
  return apiRequest(farmId ? `/alerts?farm_id=${farmId}` : '/alerts');
}

export async function getNotifications(farmId) {
  return getAlerts(farmId);
}

export async function acknowledgeAlert(alertId) {
  return apiRequest(`/alerts/${alertId}/acknowledge`, { method: 'POST' });
}

// ─── Domain Functions — Simulation (Section 36) ─────────────────────────────

const SIMULATION_SCENARIOS = [
  'water-stress',
  'disease',
  'nutrient',
  'heavy-rain',
  'heat-wave',
  'sensor-failure',
  'reset'
];

export async function runSimulation(scenario, farmId) {
  if (!SIMULATION_SCENARIOS.includes(scenario)) {
    throw new ApiError(400, `Unknown simulation scenario: ${scenario}`, 'INVALID_SCENARIO');
  }
  const qs = farmId ? `?farm_id=${farmId}` : '';
  return apiRequest(`/simulation/${scenario}${qs}`, { method: 'POST' });
}

export async function simulateWaterStress(farmId) {
  return runSimulation('water-stress', farmId);
}

export async function simulateDisease(farmId) {
  return runSimulation('disease', farmId);
}

export async function simulateNutrient(farmId) {
  return runSimulation('nutrient', farmId);
}

export async function simulateHeavyRain(farmId) {
  return runSimulation('heavy-rain', farmId);
}

export async function simulateHeatWave(farmId) {
  return runSimulation('heat-wave', farmId);
}

export async function simulateSensorFailure(farmId) {
  return runSimulation('sensor-failure', farmId);
}

export async function resetSimulation(farmId) {
  return runSimulation('reset', farmId);
}

export async function getSimulationStatus(farmId) {
  const qs = farmId ? `?farm_id=${farmId}` : '';
  return apiRequest(`/simulation/status${qs}`);
}

// ─── Default Export: named shorthand bundle ──────────────────────────────────

const api = {
  // Auth
  registerUser, loginUser, sendOTP, verifyOTP, getCurrentUser, logoutUser,
  // Farms / Fields / Sensors
  getFarms, getFarm, createFarm,
  getFields, getField, createField,
  getSensors, getSensor, createSensor, getSensorReadings, getZoneSensors,
  // Weather
  getWeather, getWeatherCurrent, getWeatherFarm, getWeatherForecast, getWeatherHourly,
  // Agents / Risks / Actions
  getAgents, getAgent, getAgentRuns,
  getRisks, getRisk,
  getActions, getAction, approveAction, rejectAction, requestExpertReview,
  // Tasks / Execution
  getTasks, getTask, startTask, completeTask, failTask,
  startExecution, pauseExecution, stopExecution, getExecution,
  // Notifications / Alerts
  getAlerts, getNotifications, acknowledgeAlert,
  // Simulation
  runSimulation, simulateWaterStress, simulateDisease, simulateNutrient,
  simulateHeavyRain, simulateHeatWave, simulateSensorFailure, resetSimulation,
  getSimulationStatus
};

export default api;

