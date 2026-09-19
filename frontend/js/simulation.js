/**
 * KrishiNirnay AI - Virtual IoT & Simulation Center Controller (Phase 23 & 24)
 * Implements:
 * - Section 29 (Phase 23): Simulation Center (6 agronomic stress injections + reset)
 * - Section 30 (Phase 24): Real-Time Simulation Status Dashboard
 * 
 * Endpoints:
 * - POST /api/simulation/water-stress
 * - POST /api/simulation/disease
 * - POST /api/simulation/nutrient
 * - POST /api/simulation/heavy-rain
 * - POST /api/simulation/heat-wave
 * - POST /api/simulation/sensor-failure
 * - POST /api/simulation/reset
 * - GET  /api/simulation/status
 */

import APP_CONFIG from './config.js';
import appShell from './ui.js';

export const SCENARIO_DEFINITIONS = {
  'normal': {
    id: 'normal',
    name: 'Normal Baseline Conditions',
    icon: '🌱',
    badgeClass: 'badge-success',
    modeLabel: 'IDLE (BASELINE)',
    description: 'All virtual IoT sensors report optimal agronomic parameters. Crop physiology within healthy benchmark thresholds.',
    affectedFields: 'None — All 12 Monitored Acres in Optimal State',
    affectedSensors: [
      { id: 'VS-MOIST-101', name: 'Root Zone Moisture (15cm)', value: '38.4%', status: 'ONLINE', trend: 'Stable' },
      { id: 'VS-TEMP-102', name: 'Canopy Soil Temperature', value: '28.2°C', status: 'ONLINE', trend: 'Nominal' },
      { id: 'VS-HUMID-103', name: 'Ambient Canopy Humidity', value: '54%', status: 'ONLINE', trend: 'Optimal' },
      { id: 'VS-NPK-106', name: 'Available Nitrogen (N)', value: '148 mg/kg', status: 'ONLINE', trend: 'Optimal' }
    ],
    agentStatus: [
      { name: 'Irrigation Agent', state: 'MONITORING', color: 'text-success', detail: 'Moisture in buffer range (35-45%). Next routine cycle tomorrow at 06:00 AM.' },
      { name: 'Pest & Disease Agent', state: 'IDLE', color: 'text-success', detail: 'Fungal spore germination index < 12%. No prophylactic action needed.' },
      { name: 'Nutrient Agent', state: 'NOMINAL', color: 'text-success', detail: 'Macronutrient absorption balanced. Foliar EC stable at 1.4 dS/m.' },
      { name: 'Weather Agent', state: 'SYNCED', color: 'text-success', detail: 'Regional IMD forecast aligned. Mild westerly breeze 9 km/h.' }
    ],
    generatedRisks: [
      { id: 'RSK-000', code: 'ALL_CLEAR', title: 'Zero Critical Agronomic Hazards', severity: 'LOW', desc: 'Crop stress indicators within ±3% tolerance limit.' }
    ],
    generatedActions: [
      { id: 'AP-ROUTINE-01', title: 'Routine Twilight Soil Moisture Polling', priority: 'LOW', status: 'AUTOMATED', target: 'Zone 1 & 2' }
    ]
  },

  'water-stress': {
    id: 'water-stress',
    name: 'Water Stress (Severe Moisture Deficit)',
    icon: '🏜️',
    badgeClass: 'badge-danger',
    modeLabel: 'STRESS ACTIVE',
    description: 'Rapid dry-down induced. Soil water tension spikes past 80 kPa, leaf stomatal conductance drops by 65%.',
    affectedFields: 'Field 1 — Zone 2: East Sloped (Cotton, 4.2 Acres) & Zone 3: Lowland (Wheat)',
    affectedSensors: [
      { id: 'VS-MOIST-101', name: 'Root Zone Moisture (15cm)', value: '17.8%', status: 'CRITICAL', trend: '▼ Declining Fast (-4%/hr)' },
      { id: 'VS-TEMP-102', name: 'Canopy Soil Temperature', value: '34.6°C', status: 'ELEVATED', trend: '▲ Rising (+2.1°C)' },
      { id: 'VS-ET0-105', name: 'Reference Evapotranspiration', value: '6.8 mm/day', status: 'HIGH', trend: '▲ Spiking' },
      { id: 'VS-TENS-107', name: 'Soil Matric Potential', value: '-85 kPa', status: 'DANGER', trend: 'Severe Wilt Hazard' }
    ],
    agentStatus: [
      { name: 'Irrigation Agent', state: 'CRITICAL DISPATCH', color: 'text-danger', detail: 'Calculated 24mm water deficit. Dispatched Emergency Drip Plan AP-SIM-801.' },
      { name: 'Pest & Disease Agent', state: 'STANDBY', color: 'text-secondary', detail: 'Suppressed foliar treatments while crop is under severe hydraulic stress.' },
      { name: 'Nutrient Agent', state: 'RESTRICTED', color: 'text-warning', detail: 'Recommended holding chemical fertigation until soil moisture returns above 30%.' },
      { name: 'Weather Agent', state: 'ALERTING', color: 'text-warning', detail: 'Zero rainfall projected over next 96 hours. Soil moisture evaporation accelerating.' }
    ],
    generatedRisks: [
      { id: 'RSK-WS-091', code: 'WILTING_POINT_BREACH', title: 'Root Zone Water Depletion Below PWP', severity: 'CRITICAL', desc: 'Moisture dropped to 17.8%, breaching wilting threshold of 20% in Cotton root zone.' },
      { id: 'RSK-ET-044', code: 'TRANSPIRATION_DEFICIT', title: 'Severe Vapor Pressure Deficit Stress', severity: 'HIGH', desc: 'VPD exceeding 3.4 kPa triggering canopy thermal overload and boll abortion.' }
    ],
    generatedActions: [
      { id: 'AP-SIM-801', title: 'Emergency 24mm Variable-Rate Drip Irrigation', priority: 'URGENT', status: 'READY FOR APPROVAL', target: 'Zone 2 East Sloped' },
      { id: 'AP-SIM-802', title: 'Deploy Twilight Canopy Anti-Transpirant Foliar Mist', priority: 'HIGH', status: 'SCHEDULED', target: 'Zone 2 & Zone 3' }
    ]
  },

  'disease': {
    id: 'disease',
    name: 'Disease Risk (Fungal Blight Outbreak)',
    icon: '🍄',
    badgeClass: 'badge-danger',
    modeLabel: 'PATHOGEN SURGE',
    description: 'Microclimate inversion creates sustained leaf wetness (>9 hours) at 26°C with 94% humidity, triggering Cercospora spores.',
    affectedFields: 'Field 1 — Zone 1: North Flat (Groundnut, 3.8 Acres) & Zone 2: Sloped',
    affectedSensors: [
      { id: 'VS-HUMID-103', name: 'Canopy Relative Humidity', value: '94.8%', status: 'CRITICAL', trend: '▲ Pathogen Zone (>90%)' },
      { id: 'VS-LEAF-104', name: 'Continuous Leaf Wetness', value: '9.5 hrs', status: 'DANGER', trend: '▲ Incubation Triggered' },
      { id: 'VS-TEMP-102', name: 'Canopy Air Temperature', value: '26.1°C', status: 'ELEVATED', trend: 'Optimal Spore Range' },
      { id: 'VS-SPORE-115', name: 'Simulated Pathogen Index', value: '91/100', status: 'CRITICAL', trend: 'High Spore Load' }
    ],
    agentStatus: [
      { name: 'Pest & Disease Agent', state: 'OUTBREAK ALERT', color: 'text-danger', detail: 'Tikka / Early Leaf Spot model reached 91% risk threshold. Generated AP-SIM-803.' },
      { name: 'Irrigation Agent', state: 'SUSPENDED', color: 'text-warning', detail: 'Overhead sprinkler/misting automatically locked to prevent leaf washing.' },
      { name: 'Nutrient Agent', state: 'ANALYZING', color: 'text-primary', detail: 'Recommending prophylactic systemic fungicide + potassium phosphite tank mix.' },
      { name: 'Weather Agent', state: 'MONITORING', color: 'text-warning', detail: 'Dense morning fog and calm winds (<4 km/h) stalling canopy drying.' }
    ],
    generatedRisks: [
      { id: 'RSK-DIS-112', code: 'CERCOSPORA_OUTBREAK', title: 'Early Leaf Spot (Tikka) Fungal Outbreak', severity: 'CRITICAL', desc: 'Leaf wetness duration > 9 hours at 26°C satisfies primary germination criteria.' },
      { id: 'RSK-CAN-032', code: 'MICROCLIMATE_STAGNATION', title: 'Dense Canopy Humidity Stagnation', severity: 'HIGH', desc: 'Lack of air turbulence maintains 95% boundary layer moisture.' }
    ],
    generatedActions: [
      { id: 'AP-SIM-803', title: 'Prophylactic Bio-Fungicide (Trichoderma viride @ 5g/L) Spray', priority: 'URGENT', status: 'READY FOR APPROVAL', target: 'Zone 1 Groundnut' },
      { id: 'AP-SIM-804', title: 'Inhibit Overhead Misting & Enable Canopy Aeration Protocol', priority: 'HIGH', status: 'AUTO-LOCKED', target: 'Zone 1 & 2' }
    ]
  },

  'nutrient': {
    id: 'nutrient',
    name: 'Nutrient Deficiency (Nitrogen & Potassium Depletion)',
    icon: '🧪',
    badgeClass: 'badge-warning',
    modeLabel: 'DEFICIENCY ALERT',
    description: 'Soil root zone reports acute nitrogen starvation and potassium deficiency, leading to interveinal chlorosis.',
    affectedFields: 'Field 1 — Zone 2: East Sloped (Cotton, 4.2 Acres)',
    affectedSensors: [
      { id: 'VS-NPK-N-106', name: 'Available Nitrate-N', value: '54 mg/kg', status: 'CRITICAL', trend: '▼ Deficient (<80 mg/kg)' },
      { id: 'VS-NPK-K-107', name: 'Available Potassium (K2O)', value: '88 mg/kg', status: 'WARNING', trend: '▼ Depleted' },
      { id: 'VS-EC-108', name: 'Soil Electrical Conductivity', value: '0.48 dS/m', status: 'LOW', trend: '▼ Low Ion Density' },
      { id: 'VS-NDVI-109', name: 'Synthetic Canopy Chlorophyll', value: '0.46', status: 'WARNING', trend: '▼ Chlorosis Onset' }
    ],
    agentStatus: [
      { name: 'Nutrient Agent', state: 'NUTRIENT DEFICIT', color: 'text-warning', detail: 'Acute N-starvation detected. Calculated 4.5 kg/acre urea top-dress + K2SO4 foliar.' },
      { name: 'Irrigation Agent', state: 'COORDINATING', color: 'text-primary', detail: 'Configuring Venturi fertigation injector for 35-minute automated dosed cycle.' },
      { name: 'Pest & Disease Agent', state: 'NOMINAL', color: 'text-success', detail: 'Inspecting weakened foliage for secondary opportunistic sap-sucking pests.' },
      { name: 'Weather Agent', state: 'SUITABLE', color: 'text-success', detail: 'Low wind velocity (7 km/h) provides ideal conditions for foliar nutrient uptake.' }
    ],
    generatedRisks: [
      { id: 'RSK-NUT-201', code: 'NITROGEN_CHLOROSIS', title: 'Lower Canopy Nitrogen Chlorosis & Square Shed', severity: 'HIGH', desc: 'Nitrate level at 54 mg/kg is 62% below reproductive flowering benchmark.' },
      { id: 'RSK-YLD-078', code: 'YIELD_PENALTY_PROJECTED', title: 'Boll Mass Reduction Risk (-18%)', severity: 'MEDIUM', desc: 'Potassium deficiency impairs phloem sugar translocation to developing cotton bolls.' }
    ],
    generatedActions: [
      { id: 'AP-SIM-805', title: 'Automated Drip Fertigation: Urea + Soluble Potassium Nitrate', priority: 'HIGH', status: 'READY FOR APPROVAL', target: 'Zone 2 East Cotton' },
      { id: 'AP-SIM-806', title: 'Foliar Spray: Chelated Zinc (Zn-EDTA) + Boron 20%', priority: 'MEDIUM', status: 'RECOMMENDED', target: 'Zone 2' }
    ]
  },

  'heavy-rain': {
    id: 'heavy-rain',
    name: 'Heavy Rain & Flooding (Flash Deluge)',
    icon: '⛈️',
    badgeClass: 'badge-danger',
    modeLabel: 'FLOODING / DELUGE',
    description: 'Extreme sudden precipitation of 58mm in 90 minutes. Spikes soil moisture to saturation and triggers root hypoxia hazard.',
    affectedFields: 'All Zones — Field 1 (12 Acres Total Shanti Agro Farm)',
    affectedSensors: [
      { id: 'VS-RAIN-110', name: 'Precipitation Intensity', value: '58.4 mm/hr', status: 'CRITICAL', trend: '▲ Extreme Flash Deluge' },
      { id: 'VS-MOIST-101', name: 'Root Zone Moisture (15cm)', value: '58.2%', status: 'SATURATED', trend: '▲ Field Capacity Exceeded' },
      { id: 'VS-BARO-112', name: 'Barometric Pressure', value: '992 hPa', status: 'DANGER', trend: '▼ Rapid Squall Drop' },
      { id: 'VS-RUNOFF-116', name: 'Surface Runoff Velocity', value: '1.8 m/s', status: 'WARNING', trend: '▲ Topsoil Leaching Risk' }
    ],
    agentStatus: [
      { name: 'Weather Agent', state: 'EXTREME SQUALL', color: 'text-danger', detail: 'Radar cloud reflectivity > 52 dBZ. Active thunderstorm cell passing directly overhead.' },
      { name: 'Irrigation Agent', state: 'AUTO-ABORT', color: 'text-danger', detail: 'All electric pump controllers instantly shut down. Solenoid valves locked in closed state.' },
      { name: 'Pest & Disease Agent', state: 'WATCH', color: 'text-warning', detail: 'Flagging post-downpour bacterial slime and soil-borne Phytophthora rot threats.' },
      { name: 'Nutrient Agent', state: 'SURVEYING', color: 'text-warning', detail: 'Evaluating nitrogen leaching from topsoil layers into subsurface drainage.' }
    ],
    generatedRisks: [
      { id: 'RSK-FL-301', code: 'ROOT_ZONE_ANOXIA', title: 'Soil Waterlogging & Root Zone Oxygen Starvation', severity: 'CRITICAL', desc: 'Moisture at 58.2% fills all macropores; root respiration ceases within 24h.' },
      { id: 'RSK-SOIL-118', code: 'RUNOFF_EROSION_HAZARD', title: 'Severe Fertilizer Washout & Topsoil Erosion', severity: 'HIGH', desc: 'Surface runoff rate exceeds infiltration capacity of black cotton soil.' }
    ],
    generatedActions: [
      { id: 'AP-SIM-807', title: 'Emergency Gravitational Drainage Valve Opening', priority: 'URGENT', status: 'AUTO-EXECUTED', target: 'Zone 3 Lowland Outlet' },
      { id: 'AP-SIM-808', title: 'Hard Electrical Lockout: All Irrigation Pumps for 72 Hours', priority: 'URGENT', status: 'APPLIED', target: 'Main Pump House #1' }
    ]
  },

  'heat-wave': {
    id: 'heat-wave',
    name: 'Severe Heat Wave (43.5°C Thermal Surge)',
    icon: '🔥',
    badgeClass: 'badge-danger',
    modeLabel: 'HEATWAVE EMERGENCY',
    description: 'Blistering temperature anomaly with scorching dry desert wind. Extreme vapor pressure deficit induces crop heat shock.',
    affectedFields: 'Field 1 — Zone 1: North Flat & Zone 2: East Sloped',
    affectedSensors: [
      { id: 'VS-TEMP-102', name: 'Ambient Air Temperature', value: '43.6°C', status: 'CRITICAL', trend: '▲ Extreme Thermal Surge' },
      { id: 'VS-HUMID-103', name: 'Relative Humidity', value: '15.4%', status: 'LOW', trend: '▼ Desiccating Atmosphere' },
      { id: 'VS-VPD-113', name: 'Vapor Pressure Deficit (VPD)', value: '4.3 kPa', status: 'DANGER', trend: '▲ Stomatal Shutdown' },
      { id: 'VS-SOLAR-114', name: 'Solar Irradiance (GHI)', value: '1060 W/m²', status: 'MAX', trend: '▲ Intense Radiation' }
    ],
    agentStatus: [
      { name: 'Weather Agent', state: 'HEATWAVE WARNING', color: 'text-danger', detail: 'IMD Red Heat Warning. Ground surface temperature exceeds 52°C in bare soil areas.' },
      { name: 'Irrigation Agent', state: 'ADAPTIVE COOLING', color: 'text-danger', detail: 'Restricting midday irrigation to prevent boiling root tips. Queued evening cycle.' },
      { name: 'Pest & Disease Agent', state: 'STANDBY', color: 'text-secondary', detail: 'Fungal viability halted by dry heat; monitoring thrips and spider mite infestations.' },
      { name: 'Nutrient Agent', state: 'STRESS REGULATION', color: 'text-primary', detail: 'Prescribed potassium silicate foliar application to enhance cellular wall rigidity.' }
    ],
    generatedRisks: [
      { id: 'RSK-HEAT-401', code: 'POLLEN_STERILITY', title: 'Flowering Flower Bud Abscission & Pollen Sterility', severity: 'CRITICAL', desc: 'Canopy temperatures above 40°C cause reproductive failure in blooming cotton.' },
      { id: 'RSK-VPD-092', code: 'CANOPY_BURNING', title: 'Severe Leaf Margin Scorching Hazard', severity: 'HIGH', desc: 'VPD of 4.3 kPa leads to catastrophic transpirational water loss.' }
    ],
    generatedActions: [
      { id: 'AP-SIM-809', title: 'Twilight Low-Volume Micro-Sprinkler Evaporative Cooling', priority: 'HIGH', status: 'READY FOR APPROVAL', target: 'Zone 1 & Zone 2' },
      { id: 'AP-SIM-810', title: 'Apply Foliar Anti-Stress Formulation (Potassium Silicate + Kaolin)', priority: 'MEDIUM', status: 'SCHEDULED', target: 'All Monitored Crops' }
    ]
  },

  'sensor-failure': {
    id: 'sensor-failure',
    name: 'Virtual Sensor Failure & Gateway Loss',
    icon: '⚠️',
    badgeClass: 'badge-danger',
    modeLabel: 'TELEMETRY FAILURE',
    description: 'Simulates sudden hardware battery brownout, LoRa packet dropping, and corrupted checksum telemetry packets.',
    affectedFields: 'Field 1 — Zone 2: East Sloped (Node VS-GATEWAY-02)',
    affectedSensors: [
      { id: 'VS-MOIST-101', name: 'Root Zone Moisture (15cm)', value: 'ERR / TIMEOUT', status: 'OFFLINE', trend: '✕ Packet Loss 100%' },
      { id: 'VS-TEMP-102', name: 'Canopy Soil Temperature', value: '-999.0 (STALE)', status: 'OFFLINE', trend: '✕ Checksum Failed' },
      { id: 'VS-NODE-02', name: 'LoRa Gateway Node #2', value: 'BATTERY: 0.7V', status: 'DEAD', trend: '✕ Brownout Drop' },
      { id: 'VS-SURROGATE', name: 'Copernicus Sentinel-2 Fallback', value: 'ACTIVE SYNTHETIC', status: 'FALLBACK', trend: '▲ Failsafe Engaged' }
    ],
    agentStatus: [
      { name: 'System Agent', state: 'HARDWARE CORRUPTION', color: 'text-danger', detail: '3 consecutive heartbeat ping failures from Field Node #2. Switched to safe-mode.' },
      { name: 'Irrigation Agent', state: 'FAILSAFE MODE', color: 'text-warning', detail: 'Hardware telemetry unavailable; switched to historical evapotranspiration interpolation.' },
      { name: 'Disease Agent', state: 'MACRO PROXY', color: 'text-warning', detail: 'Interpolating boundary layer moisture from regional AWS station 4.2 km away.' },
      { name: 'Weather Agent', state: 'ONLINE', color: 'text-success', detail: 'Satellite and synoptic forecast channels remain 100% operational.' }
    ],
    generatedRisks: [
      { id: 'RSK-SENS-501', code: 'TELEMETRY_BLINDSPOT', title: 'Total Telemetry Blindspot in Zone 2 Root Zone', severity: 'HIGH', desc: 'Real-time moisture readings unavailable for automated closed-loop decision making.' },
      { id: 'RSK-FSAFE-012', code: 'FAILSAFE_LIMITATION', title: 'Irrigation Automation Operating on Model Approximation', severity: 'MEDIUM', desc: 'Closed-loop irrigation precision reduced by ±12% while running on fallback model.' }
    ],
    generatedActions: [
      { id: 'AP-SIM-811', title: 'Engage Autonomous Satellite NDVI & ET0 Proxy Failsafe Engine', priority: 'URGENT', status: 'ACTIVE', target: 'Zone 2 East Sloped' },
      { id: 'AP-SIM-812', title: 'Dispatch Hardware Maintenance Ticket: Check Node #2 Solar Panel & Battery', priority: 'HIGH', status: 'DISPATCHED', target: 'Technician Portal' }
    ]
  }
};

class SimulationManager {
  constructor() {
    this.activeScenarioKey = 'normal';
    this.scenarioStartedAt = null;
    this.timerInterval = null;
    this.farmId = localStorage.getItem('krishi_farm_id') || 'farm-001';

    // Manual slider values
    this.manualParams = {
      moisture: 38,
      temp: 28.2,
      humidity: 54,
      radiation: 860
    };
  }

  init() {
    this.bindEvents();
    this.loadActiveStatus();
    this.renderCurrentScenario();
  }

  bindEvents() {
    // Scenario Buttons
    document.querySelectorAll('[data-scenario]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const scenario = e.currentTarget.getAttribute('data-scenario');
        this.injectScenario(scenario);
      });
    });

    // Reset Button
    const resetBtn = document.getElementById('reset-sim-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetSimulation());
    }

    // Manual Slider Listeners
    const sliders = [
      { id: 'slider-moisture', key: 'moisture', disp: 'val-disp-moisture', unit: '%' },
      { id: 'slider-temp', key: 'temp', disp: 'val-disp-temp', unit: '°C' },
      { id: 'slider-humidity', key: 'humidity', disp: 'val-disp-humidity', unit: '%' },
      { id: 'slider-radiation', key: 'radiation', disp: 'val-disp-radiation', unit: ' W/m²' }
    ];

    sliders.forEach(s => {
      const el = document.getElementById(s.id);
      const disp = document.getElementById(s.disp);
      if (el && disp) {
        el.addEventListener('input', () => {
          disp.textContent = el.value + s.unit;
          this.manualParams[s.key] = parseFloat(el.value);
          this.onManualParamChange();
        });
      }
    });
  }

  async loadActiveStatus() {
    try {
      const token = localStorage.getItem('krishi_auth_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(`${APP_CONFIG.API_BASE_URL}/simulation/status?farm_id=${this.farmId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.active_scenario && SCENARIO_DEFINITIONS[data.active_scenario]) {
          this.activeScenarioKey = data.active_scenario;
          this.scenarioStartedAt = data.set_at ? new Date(data.set_at) : new Date();
          this.startElapsedTimer();
        }
      }
    } catch (err) {
      console.warn('[Simulation] Backend status unreachable, maintaining local simulation state:', err);
    }
    this.renderCurrentScenario();
  }

  async injectScenario(scenarioKey) {
    if (!SCENARIO_DEFINITIONS[scenarioKey]) {
      console.error(`Unknown scenario: ${scenarioKey}`);
      return;
    }

    const scenario = SCENARIO_DEFINITIONS[scenarioKey];
    appShell.showToast(`Injecting scenario: ${scenario.name}...`, 'info');

    // Attempt Backend Call: POST /api/simulation/{scenarioKey}?farm_id=...
    try {
      const token = localStorage.getItem('krishi_auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      
      const res = await fetch(`${APP_CONFIG.API_BASE_URL}/simulation/${scenarioKey}?farm_id=${this.farmId}`, {
        method: 'POST',
        headers
      });

      if (!res.ok) {
        console.warn(`[Simulation] Backend returned ${res.status}, continuing with local virtual IoT engine.`);
      }
    } catch (error) {
      console.warn('[Simulation] Backend offline/cold. Executing local simulated state seamlessly:', error.message);
    }

    // Set local state
    this.activeScenarioKey = scenarioKey;
    this.scenarioStartedAt = new Date();
    this.startElapsedTimer();
    this.syncSlidersToScenario(scenarioKey);
    this.renderCurrentScenario();

    appShell.showToast(`Active Scenario: ${scenario.name}`, 'success');
  }

  async resetSimulation() {
    appShell.showToast('Resetting simulation to baseline...', 'info');

    try {
      const token = localStorage.getItem('krishi_auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      await fetch(`${APP_CONFIG.API_BASE_URL}/simulation/reset?farm_id=${this.farmId}`, {
        method: 'POST',
        headers
      });
    } catch (error) {
      console.warn('[Simulation] Backend reset offline fallback:', error.message);
    }

    this.activeScenarioKey = 'normal';
    this.scenarioStartedAt = null;
    this.stopElapsedTimer();
    this.syncSlidersToScenario('normal');
    this.renderCurrentScenario();

    appShell.showToast('Simulation reset to Normal Baseline', 'success');
  }

  startElapsedTimer() {
    this.stopElapsedTimer();
    const timerDisp = document.getElementById('sim-elapsed-timer');
    if (!timerDisp) return;

    this.timerInterval = setInterval(() => {
      if (!this.scenarioStartedAt) {
        timerDisp.textContent = '00:00:00';
        return;
      }
      const now = new Date();
      const diffSec = Math.floor((now - this.scenarioStartedAt) / 1000);
      const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
      const secs = String(diffSec % 60).padStart(2, '0');
      timerDisp.textContent = `${hrs}:${mins}:${secs}`;
    }, 1000);
  }

  stopElapsedTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    const timerDisp = document.getElementById('sim-elapsed-timer');
    if (timerDisp) timerDisp.textContent = '00:00:00';
  }

  syncSlidersToScenario(scenarioKey) {
    let m = 38, t = 28.2, h = 54, r = 860;
    switch (scenarioKey) {
      case 'water-stress': m = 18; t = 34.5; h = 28; r = 940; break;
      case 'disease': m = 44; t = 26.1; h = 95; r = 420; break;
      case 'nutrient': m = 36; t = 29.0; h = 52; r = 880; break;
      case 'heavy-rain': m = 58; t = 22.4; h = 98; r = 180; break;
      case 'heat-wave': m = 20; t = 43.6; h = 15; r = 1060; break;
      case 'sensor-failure': m = 10; t = 15.0; h = 15; r = 100; break;
      default: break;
    }

    const map = [
      { id: 'slider-moisture', disp: 'val-disp-moisture', val: m, unit: '%' },
      { id: 'slider-temp', disp: 'val-disp-temp', val: t, unit: '°C' },
      { id: 'slider-humidity', disp: 'val-disp-humidity', val: h, unit: '%' },
      { id: 'slider-radiation', disp: 'val-disp-radiation', val: r, unit: ' W/m²' }
    ];

    map.forEach(item => {
      const el = document.getElementById(item.id);
      const disp = document.getElementById(item.disp);
      if (el) el.value = item.val;
      if (disp) disp.textContent = item.val + item.unit;
    });
  }

  onManualParamChange() {
    // Dynamic feedback if user manually tweaks sliders
    const liveText = document.getElementById('sim-active-scenario-name');
    if (liveText && this.activeScenarioKey === 'normal') {
      liveText.textContent = 'Custom Virtual Telemetry (User Manual Override)';
    }
  }

  renderCurrentScenario() {
    const s = SCENARIO_DEFINITIONS[this.activeScenarioKey] || SCENARIO_DEFINITIONS['normal'];

    // 1. Update Top Prominent DEMO / SIMULATION MODE Banner
    const isNormal = this.activeScenarioKey === 'normal';
    const bannerBadge = document.getElementById('sim-banner-badge');
    const bannerDesc = document.getElementById('sim-banner-desc');
    if (bannerBadge) {
      bannerBadge.className = `badge ${isNormal ? 'badge-success' : 'badge-simulated'}`;
      bannerBadge.textContent = isNormal ? 'BASELINE RUNNING' : 'DEMO / SIMULATION MODE ACTIVE';
    }
    if (bannerDesc) {
      bannerDesc.textContent = isNormal
        ? 'Virtual IoT sensor generator running nominal benchmark telemetry. Select a stress scenario below to test AI agent reflexes.'
        : `Active Stress Injected: ${s.name}. Telemetry actively shifting; autonomous AI agents are re-evaluating risk matrices.`;
    }

    // 2. Section 30 Simulation Status Display Card
    const modeEl = document.getElementById('sim-status-mode');
    if (modeEl) {
      modeEl.textContent = s.modeLabel;
      modeEl.className = `status-pill-val ${s.badgeClass}`;
    }

    const nameEl = document.getElementById('sim-active-scenario-name');
    if (nameEl) {
      nameEl.innerHTML = `<span class="sim-scenario-icon">${s.icon}</span> ${s.name}`;
    }

    const descEl = document.getElementById('sim-scenario-desc-text');
    if (descEl) descEl.textContent = s.description;

    const fieldsEl = document.getElementById('sim-affected-fields');
    if (fieldsEl) fieldsEl.textContent = s.affectedFields;

    const startedAtEl = document.getElementById('sim-started-at');
    if (startedAtEl) {
      startedAtEl.textContent = this.scenarioStartedAt 
        ? this.scenarioStartedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : 'Baseline Nominal';
    }

    // 3. Affected Sensors
    const sensorsContainer = document.getElementById('sim-affected-sensors-list');
    if (sensorsContainer) {
      sensorsContainer.innerHTML = s.affectedSensors.map(sen => `
        <div class="sim-sensor-item">
          <div class="sim-sensor-header">
            <span class="sensor-id-tag">${sen.id}</span>
            <span class="badge ${sen.status === 'CRITICAL' || sen.status === 'DANGER' || sen.status === 'OFFLINE' || sen.status === 'DEAD' ? 'badge-danger' : sen.status === 'WARNING' || sen.status === 'ELEVATED' ? 'badge-warning' : 'badge-success'}">${sen.status}</span>
          </div>
          <div class="sim-sensor-name">${sen.name}</div>
          <div class="sim-sensor-footer">
            <strong class="sim-sensor-val">${sen.value}</strong>
            <span class="sim-sensor-trend">${sen.trend}</span>
          </div>
        </div>
      `).join('');
    }

    // 4. Agent Status List
    const agentsContainer = document.getElementById('sim-agent-status-list');
    if (agentsContainer) {
      agentsContainer.innerHTML = s.agentStatus.map(ag => `
        <div class="sim-agent-item">
          <div class="sim-agent-row">
            <strong class="sim-agent-name">${ag.name}</strong>
            <span class="sim-agent-state ${ag.color}">${ag.state}</span>
          </div>
          <p class="sim-agent-detail">${ag.detail}</p>
        </div>
      `).join('');
    }

    // 5. Generated Risks
    const risksContainer = document.getElementById('sim-generated-risks-list');
    if (risksContainer) {
      risksContainer.innerHTML = s.generatedRisks.map(r => `
        <div class="sim-generated-card risk-card-${r.severity.toLowerCase()}">
          <div class="sim-gen-header">
            <span class="badge badge-${r.severity === 'CRITICAL' ? 'danger' : r.severity === 'HIGH' ? 'danger' : r.severity === 'MEDIUM' ? 'warning' : 'success'}">${r.severity}</span>
            <span class="sim-gen-id">${r.id}</span>
          </div>
          <h4 class="sim-gen-title">${r.title}</h4>
          <p class="sim-gen-desc">${r.desc}</p>
        </div>
      `).join('');
    }

    // 6. Generated Actions
    const actionsContainer = document.getElementById('sim-generated-actions-list');
    if (actionsContainer) {
      actionsContainer.innerHTML = s.generatedActions.map(a => `
        <div class="sim-generated-card action-card-item">
          <div class="sim-gen-header">
            <span class="badge badge-execution">${a.priority}</span>
            <span class="sim-gen-status">${a.status}</span>
          </div>
          <h4 class="sim-gen-title">${a.title}</h4>
          <p class="sim-gen-desc">Target: <strong>${a.target}</strong> • Ref: ${a.id}</p>
        </div>
      `).join('');
    }

    // 7. Highlight Active Scenario Card
    document.querySelectorAll('.scenario-card').forEach(card => {
      const btn = card.querySelector('[data-scenario]');
      if (!btn) return;
      const key = btn.getAttribute('data-scenario');
      if (key === this.activeScenarioKey) {
        card.classList.add('scenario-card-active');
      } else {
        card.classList.remove('scenario-card-active');
      }
    });
  }
}

export const simulationManager = new SimulationManager();
document.addEventListener('DOMContentLoaded', () => {
  simulationManager.init();
});

export default simulationManager;
