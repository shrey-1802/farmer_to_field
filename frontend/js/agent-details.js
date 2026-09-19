/**
 * KrishiNirnay AI - AI Agent Detail & Explainability Trace Controller (Phase 13)
 * Implements Section 19: Agent Detail Page & Coordinated Multi-Agent Timeline.
 * 
 * Dynamically renders comprehensive explainability telemetry for all 9 agents:
 * Soil, Weather, Irrigation, Nutrient, Drone/Disease, Market, Risk Detection,
 * Farm Context, and Master Orchestrator based on ?agent=<id> query parameter.
 */

import APP_CONFIG from './config.js';
import appShell from './ui.js';

export const AGENTS_DETAIL_CATALOG = {
  soil: {
    id: 'soil',
    name: 'Soil Dynamics Agent',
    shortName: 'Soil Agent',
    icon: '🪨',
    domain: 'Infiltration, Compaction & Horizon Balance',
    model: 'Hydrological Darcy-Richards Infiltration & Unsaturated Flow Model',
    purpose: 'Analyzes multi-depth soil moisture dynamics, water infiltration rates, soil compaction indices, and horizon water movement to calculate root-zone readily available water (RAW).',
    status: 'COMPLETED',
    lastExecution: 'Today at 08:31:00 AM (4m ago)',
    executionDuration: '380 ms',
    confidence: 96.4,
    inferencesToday: 142,
    source: 'AI GENERATED',
    inputs: [
      { label: 'Soil Moisture (15cm)', value: '24.1% (Zone 2)', source: 'SIMULATED — Virtual IoT', alert: true },
      { label: 'Soil Moisture (30cm)', value: '29.4% (Zone 2)', source: 'SIMULATED — Virtual IoT' },
      { label: 'Soil Temperature', value: '30.1°C', source: 'SIMULATED — Virtual IoT' },
      { label: 'Bulk Density', value: '1.32 g/cm³', source: 'MODEL — Agronomic Baseline' },
      { label: 'Soil Organic Matter', value: '0.62%', source: 'USER INPUT — Soil Health Card' }
    ],
    outputSummary: 'Root zone capillary water deficit reached 41mm (> RAW threshold 32mm). Zone 2 requires 18,200 Liters replenishing to avert irreversible vegetative stress.',
    evidence: 'Capillary gradient dΨ/dz indicates rapid upward flux due to high solar evaporative suction. Infiltration capacity estimated at 18 mm/hr for medium black clay loam series.',
    detectedRisks: [
      { title: 'Zone 2 Upper Horizon Moisture Deficit', severity: 'High', score: 78, zone: 'Zone 2 (North Cotton Block)', type: 'danger' }
    ],
    recommendation: 'Initiate sub-surface irrigation on Zone 2 to restore root zone capillary water before reaching Permanent Wilting Point (18.0%). Coordinate with Weather Agent to avoid midday heat.',
    reasoningSteps: [
      { status: 'pass', title: '1. Infiltration Analysis', desc: 'Calibrated water infiltration rate across medium black soil series at 18 mm/hr (hydraulic conductivity verified).' },
      { status: 'warning', title: '2. Root Zone Depletion Check', desc: 'Current soil moisture (24.1%) dropped significantly below MAD threshold (28.0%). Readily Available Water exhausted.' },
      { status: 'pass', title: '3. Compaction & Aeration Check', desc: 'Soil penetrometer resistance index 1.32 g/cm³ within optimal root exploration range. No compaction pan detected.' },
      { status: 'pass', title: '4. Hydrological Balance Formulation', desc: 'Calculated net replenishment deficit of 41mm across 1.2 hectare zone; dispatched payload to Master Orchestrator.' }
    ],
    rawPayload: {
      agent_id: 'soil',
      cycle_id: 'CYC-1492-SOIL',
      timestamp: new Date().toISOString(),
      horizon_depth_cm: [15, 30, 60],
      moisture_values: [24.1, 29.4, 38.2],
      hydraulic_conductivity_ksat: 0.0028,
      readily_available_water_mm: 32.0,
      current_depletion_mm: 41.2,
      deficit_status: 'CRITICAL_WATER_STRESS'
    }
  },

  weather: {
    id: 'weather',
    name: 'Weather Risk Agent',
    shortName: 'Weather Agent',
    icon: '🌦️',
    domain: 'Microclimate & ET₀ Demand Synthesizer',
    model: 'Multi-Ensemble Open-Meteo & ECMWF Micro-Forecast Synthesizer',
    purpose: 'Ingests live Open-Meteo microclimate ensembles and ECMWF numerical forecasts to predict convective storms, rainfall timing, solar radiation peaks, and reference evapotranspiration (ET0).',
    status: 'COMPLETED',
    lastExecution: 'Today at 08:32:00 AM (8m ago)',
    executionDuration: '510 ms',
    confidence: 97.2,
    inferencesToday: 142,
    source: 'AI GENERATED',
    inputs: [
      { label: 'Ambient Temperature', value: '31.2°C (Peak 34°C)', source: 'LIVE — Open-Meteo' },
      { label: 'Relative Humidity', value: '48%', source: 'LIVE — Open-Meteo' },
      { label: 'Wind Speed & Gusts', value: '14 km/h (Gusts 21 km/h)', source: 'LIVE — Open-Meteo' },
      { label: '48h Rain Probability', value: '0.0 mm (5% chance)', source: 'LIVE — Forecast' },
      { label: 'Solar Irradiance', value: '880 W/m²', source: 'LIVE — Open-Meteo' }
    ],
    outputSummary: 'Calculated daily ET0 at 5.4 mm/day. Verified zero precipitation buffer for next 48h. Afternoon thermal heat index peak of 34°C will trigger leaf scorch if watered at midday.',
    evidence: 'Ensemble convergence across 4 numerical weather prediction models (ECMWF, GFS, ICON, Open-Meteo) confirms high atmospheric evaporative demand and negligible rain probability until Sept 24.',
    detectedRisks: [
      { title: 'Midday Thermal Stress Risk', severity: 'Moderate', score: 62, zone: 'Entire Farm', type: 'warning' }
    ],
    recommendation: 'Shift scheduled irrigation cycles to post-17:30 to avoid 28% midday solar evaporative loss and foliage burn.',
    reasoningSteps: [
      { status: 'pass', title: '1. Numerical Ensemble Verification', desc: 'Checked ECMWF and GFS 48-hour precipitation forecasts. Dry spell verified with 95% ensemble agreement.' },
      { status: 'pass', title: '2. ET0 Reference Computation', desc: 'Penman-Monteith equation computes 5.4 mm/day evaporative demand under current solar irradiance and vapor deficit.' },
      { status: 'pass', title: '3. Microclimate Wind Threshold', desc: 'Wind speed under 20 km/h; drift risk for spray operations is low.' },
      { status: 'warning', title: '4. Heat Index Guardrail Check', desc: 'Flagged 34°C peak between 12:30 PM and 15:30 PM. Imposed operational ban on daytime surface spraying and overhead watering.' }
    ],
    rawPayload: {
      agent_id: 'weather',
      cycle_id: 'CYC-1492-WTHR',
      timestamp: new Date().toISOString(),
      et0_mm_day: 5.4,
      rain_forecast_48h_mm: 0.0,
      peak_temperature_c: 34.1,
      peak_heat_window: '12:30-15:30',
      advisory_code: 'EVAPORATIVE_LOSS_AVOIDANCE'
    }
  },

  irrigation: {
    id: 'irrigation',
    name: 'Irrigation Advisory Agent',
    shortName: 'Irrigation Agent',
    icon: '💧',
    domain: 'Evapo-Transpiration & Moisture Balancing',
    model: 'FAO-56 Penman-Monteith Evapo-Transpiration Balancer',
    purpose: 'Optimizes irrigation schedules, calculates precise volumetric water requirements per zone, and commands automated drip valve timing while conserving aquifer and reservoir reserves.',
    status: 'WARNING',
    lastExecution: 'Today at 08:32:45 AM (12m ago)',
    executionDuration: '640 ms',
    confidence: 94.8,
    inferencesToday: 142,
    source: 'AI GENERATED',
    inputs: [
      { label: 'Virtual Soil Moisture', value: '24.1% (Zone 2)', source: 'SIMULATED — Virtual IoT', alert: true },
      { label: 'Reference ET (ET0)', value: '5.4 mm/day', source: 'LIVE — Open-Meteo' },
      { label: 'Crop Coefficient (Kc)', value: '1.15 (Flowering / Boll)', source: 'MODEL — Agronomic Baseline' },
      { label: 'Forecasted Rainfall (48h)', value: '0.0 mm (0% chance)', source: 'LIVE — Forecast' },
      { label: 'Emitter Discharge Rate', value: '2.4 L/hr per nozzle', source: 'USER INPUT — Drip Specs' }
    ],
    outputSummary: 'Calculated gross water requirement: 15.2mm (18,200 Liters). Generated 45-minute pressurized drip pulse for Valve Line B scheduled at 18:00.',
    evidence: 'MAD depletion ratio Dr/TAW = 0.58 exceeds critical threshold 0.50. Drip emitter discharge rate 2.4 L/hr requires 45 minutes operating pressure at 1.8 bar.',
    detectedRisks: [
      { title: 'Critical Root Zone Water Stress in Zone 2', severity: 'Critical', score: 84, zone: 'Zone 2 (Field 1)', type: 'danger' }
    ],
    recommendation: 'Execute 45-min pressurized drip pulse on Valve Line B starting at 18:00 (estimated volume 18,200 L). Awaiting farmer authorization.',
    reasoningSteps: [
      { status: 'pass', title: '1. Soil Water Depletion Calculation', desc: 'Depletion factor p = 0.65 for cotton. Readily Available Water calculated at 32mm. Current depletion reached 41mm (> RAW threshold).' },
      { status: 'pass', title: '2. Weather Precipitation Check', desc: 'Verified that zero rainfall is forecasted for the next 48 hours. Irrigation will not be redundant with impending precipitation.' },
      { status: 'pass', title: '3. Thermal Heat Stress Guardrail', desc: 'Peak ambient temperature will reach 34°C. Safety policy dictates irrigation should execute after 17:30 to prevent leaf scorching.' },
      { status: 'warning', title: '4. Action Plan Synthesis', desc: 'Generated Action Plan #AP-418: Dispatch 15.2mm drip cycle to Valve Line B. Pending farmer authorization.' }
    ],
    rawPayload: {
      agent_id: 'irrigation',
      cycle_id: 'CYC-1492-IRR',
      timestamp: new Date().toISOString(),
      zone_target: 'zone-2',
      valve_line: 'Valve B',
      water_depth_mm: 15.2,
      volume_liters: 18200,
      run_duration_mins: 45,
      scheduled_start: '18:00',
      action_plan_id: 'AP-418'
    }
  },

  nutrient: {
    id: 'nutrient',
    name: 'Fertigation & Nutrient Agent',
    shortName: 'Nutrient Agent',
    icon: '🌱',
    domain: 'Phenology NPK Uptake Optimizer',
    model: 'Phenological Crop Stage NPK Depletion Curve Model',
    purpose: 'Tracks macro (NPK) and secondary nutrient consumption curves calibrated to phenological growth stages, timing water-soluble fertilizer injections to maximize nutrient use efficiency.',
    status: 'COMPLETED',
    lastExecution: 'Today at 08:30:15 AM (25m ago)',
    executionDuration: '450 ms',
    confidence: 92.3,
    inferencesToday: 142,
    source: 'AI GENERATED',
    inputs: [
      { label: 'Available Nitrogen (N)', value: '135 kg/ha (Adequate)', source: 'SIMULATED — Virtual IoT' },
      { label: 'Available Phosphorus (P₂O₅)', value: '30 kg/ha (Normal)', source: 'SIMULATED — Virtual IoT' },
      { label: 'Available Potassium (K₂O)', value: '175 kg/ha (High)', source: 'SIMULATED — Virtual IoT' },
      { label: 'Soil Electrical Cond. (EC)', value: '1.2 dS/m (Normal)', source: 'SIMULATED — Virtual IoT' },
      { label: 'Soil Reaction (pH)', value: '8.0 (Slightly Alkaline)', source: 'SIMULATED — Virtual IoT' }
    ],
    outputSummary: 'NPK balance satisfactory. Micronutrient Zinc shows mild absorption suppression due to slight soil alkalinity (pH 8.0). Nitrogen uptake is normal for flowering stage.',
    evidence: 'Crop uptake curves show flowering stage requires 1.8 kg N/ha/day and 2.1 kg K/ha/day. Soil EC remains well within salinity safety ceiling (< 2.0 dS/m).',
    detectedRisks: [
      { title: 'Mild Zinc Bioavailability Suppression', severity: 'Low', score: 32, zone: 'Zone 2 & Zone 3', type: 'info' }
    ],
    recommendation: 'Plan 19:19:19 soluble NPK fertigation injection with next scheduled irrigation cycle; consider chelated Zn foliar booster.',
    reasoningSteps: [
      { status: 'pass', title: '1. Phenology Demand Mapping', desc: 'Aligned nutrient uptake model with Day 54 flowering stage. NPK uptake velocity matches benchmark.' },
      { status: 'pass', title: '2. Salinity Guardrail Check', desc: 'Verified soil EC at 1.2 dS/m — no osmolarity hazard or root burn condition detected.' },
      { status: 'pass', title: '3. NPK Ratio Verification', desc: 'N:P:K stoichiometry checks out at 4.5:1:5.8 in soil solution.' },
      { status: 'info', title: '4. Micronutrient Solubility Check', desc: 'Identified mild zinc absorption suppression at pH 8.0. Added foliar zinc advisory to next booster cycle.' }
    ],
    rawPayload: {
      agent_id: 'nutrient',
      cycle_id: 'CYC-1492-NUTR',
      timestamp: new Date().toISOString(),
      nitrogen_kg_ha: 135,
      phosphorus_kg_ha: 30,
      potassium_kg_ha: 175,
      ph_level: 8.0,
      ec_ds_m: 1.2,
      recommendation: 'FERTIGATION_BOOSTER_STAGE_4'
    }
  },

  drone: {
    id: 'drone',
    name: 'Drone & Disease Agent',
    shortName: 'Drone/Disease Agent',
    icon: '🔬',
    domain: 'Multispectral NDVI & Pathogen Classifier',
    model: 'Multispectral NDVI & Fungal Spore Microclimate Classifier',
    purpose: 'Processes multispectral drone orthomosaics, calculates normalized difference vegetation index (NDVI) biomass maps, and models microclimate fungal pathogen incubation risks.',
    status: 'COMPLETED',
    lastExecution: 'Today at 08:28:30 AM (42m ago)',
    executionDuration: '1,180 ms',
    confidence: 98.1,
    inferencesToday: 72,
    source: 'MODEL',
    inputs: [
      { label: 'Mean Field NDVI', value: '0.74 (Healthy Vigorous)', source: 'MODEL — Drone Orthomosaic' },
      { label: 'Leaf Wetness Duration', value: '2.1 hours', source: 'SIMULATED — Virtual IoT' },
      { label: 'Canopy Relative Humidity', value: '56%', source: 'SIMULATED — Virtual IoT' },
      { label: 'Growing Degree-Days', value: '1,140 GDD', source: 'MODEL — Thermal Accumulation' },
      { label: 'Canopy Chlorophyll Index', value: '42.8 SPAD', source: 'MODEL — Spectral Reflection' }
    ],
    outputSummary: 'Fungal spore germination index at 14% (Low). NDVI shows dense vigorous vegetative canopy. Zero foliar blight or cotton bollworm infestation detected.',
    evidence: 'Fungal spore germination model (Alternaria / Cercospora) requires > 6 consecutive hours of leaf wetness at > 85% RH. Current exposure is 2.1h at 56% RH.',
    detectedRisks: [
      { title: 'Foliar Pathogen Risk: Minimal', severity: 'Safe', score: 14, zone: 'North Canopy', type: 'safe' }
    ],
    recommendation: 'No chemical fungicide required. Next automated multispectral scan scheduled in 48h.',
    reasoningSteps: [
      { status: 'pass', title: '1. Multispectral Orthomosaic Alignment', desc: 'Processed 4-band reflectance imagery (NIR, Red Edge, Red, Green) with 2.5cm/pixel resolution.' },
      { status: 'pass', title: '2. NDVI Biomass Segmentation', desc: '94.2% canopy area in 0.68–0.82 vigorous biomass range. No localized chlorosis detected.' },
      { status: 'pass', title: '3. Pathogen Incubation Simulation', desc: 'Leaf wetness duration (2.1h) well below 6h threshold. Spore germination probability estimated at 14%.' },
      { status: 'pass', title: '4. Pest Degree-Day Model', desc: 'Thermal accumulation indicates bollworm moth flight window has not initiated.' }
    ],
    rawPayload: {
      agent_id: 'drone',
      cycle_id: 'CYC-1492-DRON',
      timestamp: new Date().toISOString(),
      mean_ndvi: 0.74,
      chlorophyll_index: 42.8,
      leaf_wetness_hours: 2.1,
      spore_germination_prob: 0.14,
      flight_id: 'FLIGHT-2026-09-18'
    }
  },

  market: {
    id: 'market',
    name: 'Market & Mandi Agent',
    shortName: 'Market Agent',
    icon: '⚖️',
    domain: 'APMC Mandi Price Trend & Demand Forecaster',
    model: 'APMC Mandi Price Forecasting & Harvest Optimization Model',
    purpose: 'Ingests APMC Mandi modal prices, national commodity demand, seasonal arrival trends, and transportation tariffs to recommend profit-maximizing harvesting and marketing windows.',
    status: 'IDLE',
    lastExecution: 'Today at 07:30:00 AM (1h ago)',
    executionDuration: '720 ms',
    confidence: 89.5,
    inferencesToday: 24,
    source: 'AI GENERATED',
    inputs: [
      { label: 'Rajkot APMC Modal Price', value: '₹7,420 / Quintal', source: 'LIVE — APMC Mandi Feed' },
      { label: 'Gondal APMC Modal Price', value: '₹7,380 / Quintal', source: 'LIVE — APMC Mandi Feed' },
      { label: 'Daily Mandi Influx', value: '1,420 Quintals (Moderate)', source: 'LIVE — Agmarknet' },
      { label: '14-Day Price Forecast', value: '▲ Bullish (+3.2% projected)', source: 'MODEL — Time Series' },
      { label: 'Transport Cost to Mandi', value: '₹140 / Quintal', source: 'USER INPUT — Logistics' }
    ],
    outputSummary: 'Current market sentiment bullish. Projected harvest window yields an estimated 8.4% premium over historical 5-year Kharif average.',
    evidence: 'Spinning mill procurement orders increased 12% WoW. Seasonal monsoon delay across southern belts has tightened early-season arrivals in Gujarat mandis.',
    detectedRisks: [
      { title: 'Post-Harvest Moisture Degradation Risk', severity: 'Low', score: 24, zone: 'Storage Shed', type: 'info' }
    ],
    recommendation: 'Target harvest window between Sept 28–Oct 02 for Rajkot APMC premium rates (₹7,420/Q). Maintain storage moisture below 10%.',
    reasoningSteps: [
      { status: 'pass', title: '1. Mandi Feed Ingestion', desc: 'Synced daily morning modal price feeds from Rajkot and Gondal APMC.' },
      { status: 'pass', title: '2. Arrival Volume Normalization', desc: 'Modal price stability validated against 7-day moving average and arrival tonnage.' },
      { status: 'pass', title: '3. Net Realization Computation', desc: 'Factored ₹140/Q haulage cost to determine net farmgate realization of ₹7,280/Q.' },
      { status: 'pass', title: '4. Harvest Timing Window', desc: 'Generated target delivery advisory for farmer profit maximization.' }
    ],
    rawPayload: {
      agent_id: 'market',
      cycle_id: 'CYC-1492-MKT',
      timestamp: new Date().toISOString(),
      primary_mandi: 'Rajkot APMC',
      modal_price_inr: 7420,
      projected_trend: 'BULLISH',
      target_harvest_start: '2026-09-28',
      target_harvest_end: '2026-10-02'
    }
  },

  risk: {
    id: 'risk',
    name: 'Risk Detection Agent',
    shortName: 'Risk Detection Agent',
    icon: '⚠️',
    domain: 'Cross-Domain Anomaly Synthesis',
    model: 'Multi-Hazard Anomaly Correlator & Escalation Engine',
    purpose: 'Synthesizes cross-domain telemetry and agent inference vectors to detect multi-hazard compounding agricultural threats, calculate hazard severity scores, and dispatch emergency alerts.',
    status: 'WARNING',
    lastExecution: 'Today at 08:33:10 AM (2m ago)',
    executionDuration: '390 ms',
    confidence: 95.6,
    inferencesToday: 142,
    source: 'AI GENERATED',
    inputs: [
      { label: 'Soil Moisture Anomaly', value: '-1.4%/hr rapid drop in Zone 2', source: 'SIMULATED — Virtual IoT', alert: true },
      { label: 'Atmospheric Evaporation', value: 'ET0 = 5.4 mm/day', source: 'LIVE — Open-Meteo' },
      { label: 'Canopy Temp Anomaly', value: '+2.8°C above field baseline', source: 'SIMULATED — Virtual IoT', alert: true },
      { label: 'Actuator Telemetry', value: 'Valve Line B CLOSED', source: 'LIVE — IoT Gateway' }
    ],
    outputSummary: 'Compound Water + Heat Stress identified in Zone 2. Severity score: 82/100. Dispatched high-priority alert ACT-2026-0919 to Farmer Dashboard.',
    evidence: 'Simultaneous occurrence of root moisture depletion (< MAD 28%) and peak canopy heating (+2.8°C) exceeds single-variable tolerance envelopes and threatens boll shedding.',
    detectedRisks: [
      { title: 'Compound Water & Heat Stress Hazard', severity: 'Critical', score: 82, zone: 'Zone 2 (Field 1)', type: 'danger' }
    ],
    recommendation: 'Dispatched Emergency Action Alert #ACT-2026-0919 to Farmer Dashboard for 1-click authorization.',
    reasoningSteps: [
      { status: 'warning', title: '1. Anomaly Detection Sweep', desc: 'Flagged anomalous rate-of-decay in Zone 2 moisture sensor (-1.4%/hr).' },
      { status: 'warning', title: '2. Cross-Domain Correlation', desc: 'Correlated root soil deficit with 34°C weather forecast and closed valve state.' },
      { status: 'warning', title: '3. Hazard Severity Scoring', desc: 'Composite risk score evaluated at 82/100 (Threshold > 70 triggers immediate action).' },
      { status: 'pass', title: '4. Escalation Dispatch', desc: 'Automated notification dispatched to Farmer SMS and UI bell.' }
    ],
    rawPayload: {
      agent_id: 'risk',
      cycle_id: 'CYC-1492-RISK',
      timestamp: new Date().toISOString(),
      composite_risk_score: 82,
      hazard_type: 'COMPOUND_HEAT_DROUGHT_STRESS',
      affected_zone: 'zone-2',
      alert_id: 'ACT-2026-0919',
      priority: 'HIGH'
    }
  },

  farm_context: {
    id: 'farm_context',
    name: 'Farm Context Agent',
    shortName: 'Farm Context Agent',
    icon: '🏡',
    domain: 'Agronomic Knowledge Graph & Baseline Engine',
    model: 'Agronomic Knowledge Graph & Phenology Calibrator',
    purpose: 'Maintains the foundational agronomic knowledge graph, historical seasonal baselines, cultivar phenological traits, soil series chemistry, and farmer equipment profiles.',
    status: 'COMPLETED',
    lastExecution: 'Today at 08:25:00 AM (15m ago)',
    executionDuration: '310 ms',
    confidence: 99.0,
    inferencesToday: 142,
    source: 'AI GENERATED',
    inputs: [
      { label: 'Cultivar Specification', value: 'Bt Cotton (G-Cot 20 - Medium Staple)', source: 'USER INPUT — Farmer Profile' },
      { label: 'Crop Sowing Date', value: 'June 28, 2026 (Day 54 Post-Emergence)', source: 'USER INPUT — Crop History' },
      { label: 'Soil Taxonomic Series', value: 'Medium Black Vertisol (Calcareous)', source: 'USER INPUT — Soil Card' },
      { label: 'Irrigation System', value: 'Inline Pressure Compensating Drip (2.4 L/h)', source: 'USER INPUT — Farm Equipment' },
      { label: 'Total Farm Area', value: '12 Acres (4.85 Hectares)', source: 'USER INPUT — Farm Specs' }
    ],
    outputSummary: 'Phenological stage confirmed: Flowering / Square Formation. Calibrated MAD threshold at 28% and Kc at 1.15. Moisture stress at this stage risks severe boll dropping.',
    evidence: 'Day 54 post-sowing corresponds to critical reproductive square formation. Moisture stress at this stage causes irreversible square shedding and 30-40% yield loss.',
    detectedRisks: [
      { title: 'Phenological Vulnerability: High Sensitivity to Drought Shock', severity: 'Moderate', score: 48, zone: 'Entire Crop', type: 'warning' }
    ],
    recommendation: 'Maintain soil moisture strictly above 30% MAD threshold during flowering phase to avert square dropping.',
    reasoningSteps: [
      { status: 'pass', title: '1. Phenology Staging', desc: 'Calculated 54 days after sowing (DAS) corresponding to early flowering.' },
      { status: 'pass', title: '2. Crop Coefficient Calibration', desc: 'Assigned Kc = 1.15 according to FAO-56 table for cotton.' },
      { status: 'pass', title: '3. Soil Texture Hydrology', desc: 'Bound soil water retention parameters to medium black vertisol curve.' },
      { status: 'pass', title: '4. Agronomic Constraints Dispatch', desc: 'Broadcasted moisture safety thresholds to all active agents.' }
    ],
    rawPayload: {
      agent_id: 'farm_context',
      cycle_id: 'CYC-1492-CTXT',
      timestamp: new Date().toISOString(),
      crop_type: 'Bt Cotton',
      crop_variety: 'G-Cot 20',
      phenological_stage: 'FLOWERING_STAGE',
      days_after_sowing: 54,
      kc_coefficient: 1.15,
      mad_threshold_percent: 28.0
    }
  },

  orchestrator: {
    id: 'orchestrator',
    name: 'Master Orchestrator',
    shortName: 'Orchestrator',
    icon: '🧠',
    domain: 'Autonomous Consensus & Multi-Agent Planning',
    model: 'Hierarchical Task Network & Conflict-Free Action Planner',
    purpose: 'Serves as the central autonomous decision coordinator, continuously arbitrating conflicts between specialized agents, validating agronomic safety guardrails, and synthesizing unified action plans.',
    status: 'RUNNING',
    lastExecution: 'Today at 08:33:30 AM (Live polling every 10s)',
    executionDuration: '890 ms',
    confidence: 96.9,
    inferencesToday: 142,
    source: 'AI GENERATED',
    inputs: [
      { label: 'Soil Agent Vector', value: 'Zone 2 Deficit (41mm water debt)', source: 'AI GENERATED — Soil Agent', alert: true },
      { label: 'Weather Agent Vector', value: '0mm precipitation, peak 34°C at noon', source: 'AI GENERATED — Weather Agent' },
      { label: 'Irrigation Agent Vector', value: '45-min drip run proposed for Line B', source: 'AI GENERATED — Irrigation Agent' },
      { label: 'Farm Context Constraints', value: 'Day 54 Flowering critical threshold', source: 'AI GENERATED — Context Agent' }
    ],
    outputSummary: 'Consensus verified with 0 policy violations. Synthesized Unified Action Plan #AP-418 (Zone 2 Drip Irrigation). Awaiting Farmer Approval.',
    evidence: 'Constraint solver resolved schedule collision: moved irrigation from 13:00 to 18:00 to reconcile Weather Agent heat guardrail with Irrigation Agent water requirement.',
    detectedRisks: [
      { title: '1 Action Plan Pending Farmer Authorization', severity: 'Action Required', score: 75, zone: 'Zone 2 (Field 1)', type: 'warning' }
    ],
    recommendation: 'Synthesized multi-agent inputs into Unified Action Plan #AP-418 (Zone 2 Drip Irrigation). Dispatched to Action Plans center for authorization.',
    reasoningSteps: [
      { status: 'pass', title: '1. Multi-Agent Vector Ingestion', desc: 'Ingested 8 domain agent decision payloads from active consensus cycle #1,492.' },
      { status: 'pass', title: '2. Constraint Collision Resolution', desc: 'Resolved weather heat vs watering time conflict; shifted schedule to 18:00.' },
      { status: 'pass', title: '3. Policy Guardrail Verification', desc: 'Verified compliance with national groundwater conservation and energy tariff off-peak windows.' },
      { status: 'warning', title: '4. Action Plan Generation', desc: 'Generated Action Plan #AP-418 with exact actuator commands. Awaiting farmer sign-off.' }
    ],
    rawPayload: {
      agent_id: 'orchestrator',
      cycle_id: 'CYC-1492-ORCH',
      timestamp: new Date().toISOString(),
      consensus_id: 'CNS-2026-0919-01',
      participating_agents: 9,
      conflicts_detected: 1,
      conflicts_resolved: 1,
      action_plan_id: 'AP-418',
      status: 'AWAITING_FARMER_APPROVAL'
    }
  }
};

export const MASTER_TIMELINE = [
  { time: '08:31:00 AM', agent: 'Soil Agent', icon: '🪨', status: 'COMPLETED', summary: 'Soil Agent completed: Evaluated root moisture deficit for Zone 2 (24.1% moisture, 41mm deficit).' },
  { time: '08:32:00 AM', agent: 'Weather Agent', icon: '🌦️', status: 'COMPLETED', summary: 'Weather Agent completed: Verified 0mm rainfall next 48h; ET₀ computed at 5.4 mm/day; 34°C midday heat alert.' },
  { time: '08:32:45 AM', agent: 'Irrigation Agent', icon: '💧', status: 'WARNING', summary: 'Irrigation Agent completed: Formulated 45-min pressurized drip pulse requirement on Valve Line B (18,200 L).' },
  { time: '08:33:10 AM', agent: 'Risk Agent', icon: '⚠️', status: 'WARNING', summary: 'Risk Agent completed: Correlated root zone water stress with midday heat index; dispatched emergency alert.' },
  { time: '08:33:30 AM', agent: 'Master Orchestrator', icon: '🧠', status: 'COMPLETED', summary: 'Orchestrator generated action plan: Synthesized multi-agent inputs into Unified Action Plan #AP-418 (Zone 2 Drip Irrigation).' }
];

export const EXECUTION_HISTORY_SAMPLES = [
  { id: 'RUN-8921', time: 'Today 08:32:45', duration: '640 ms', status: 'WARNING', confidence: '94.8%', outcome: 'Formulated Action Plan #AP-418 (Zone 2)' },
  { id: 'RUN-8920', time: 'Today 08:22:45', duration: '615 ms', status: 'COMPLETED', confidence: '94.2%', outcome: 'Telemetry normal; moisture steady' },
  { id: 'RUN-8919', time: 'Today 08:12:45', duration: '630 ms', status: 'COMPLETED', confidence: '94.9%', outcome: 'Routine observation; no policy alerts' },
  { id: 'RUN-8918', time: 'Today 08:02:45', duration: '595 ms', status: 'COMPLETED', confidence: '94.6%', outcome: 'Pre-flight calibration check passed' },
  { id: 'RUN-8917', time: 'Today 07:52:45', duration: '620 ms', status: 'COMPLETED', confidence: '94.5%', outcome: 'Morning baseline synchronization complete' }
];

class AgentDetailsController {
  constructor() {
    this.currentAgentId = 'irrigation';
    this.agent = null;
    this.isReplaying = false;
  }

  init() {
    this.parseQueryParam();
    this.renderAgentSwitcher();
    this.renderAgentDetails();
    this.renderConsensusTimeline();
    this.renderExecutionHistory();
    this.bindActions();
  }

  parseQueryParam() {
    const params = new URLSearchParams(window.location.search);
    const agentParam = params.get('agent');
    if (agentParam && AGENTS_DETAIL_CATALOG[agentParam]) {
      this.currentAgentId = agentParam;
    } else {
      this.currentAgentId = 'irrigation';
    }
    this.agent = AGENTS_DETAIL_CATALOG[this.currentAgentId];
  }

  switchAgent(agentId) {
    if (!AGENTS_DETAIL_CATALOG[agentId]) return;
    this.currentAgentId = agentId;
    this.agent = AGENTS_DETAIL_CATALOG[agentId];

    // Update URL query parameter without reload
    const newUrl = `${window.location.pathname}?agent=${agentId}`;
    window.history.pushState({ agent: agentId }, '', newUrl);

    this.renderAgentSwitcher();
    this.renderAgentDetails();
    this.renderExecutionHistory();

    appShell.showToast(`Switched to ${this.agent.name}`, 'info', 1800);
  }

  bindActions() {
    window.addEventListener('popstate', () => {
      this.parseQueryParam();
      this.renderAgentSwitcher();
      this.renderAgentDetails();
      this.renderExecutionHistory();
    });

    const rerunBtn = document.getElementById('btn-replay-timeline');
    if (rerunBtn) {
      rerunBtn.addEventListener('click', () => this.replayConsensusTimeline());
    }
  }

  renderAgentSwitcher() {
    const switcherEl = document.getElementById('agent-switcher-strip');
    if (!switcherEl) return;

    const agentsList = Object.values(AGENTS_DETAIL_CATALOG);
    switcherEl.innerHTML = agentsList.map(a => `
      <button class="agent-switch-pill ${a.id === this.currentAgentId ? 'active' : ''}" data-agent-id="${a.id}">
        <span class="pill-icon">${a.icon}</span>
        <span class="pill-title">${a.shortName}</span>
        ${a.status === 'WARNING' ? '<span class="status-micro-dot warning"></span>' : ''}
        ${a.status === 'RUNNING' ? '<span class="status-micro-dot running"></span>' : ''}
      </button>
    `).join('');

    switcherEl.querySelectorAll('.agent-switch-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = e.currentTarget.getAttribute('data-agent-id');
        this.switchAgent(targetId);
      });
    });
  }

  renderAgentDetails() {
    const a = this.agent;
    if (!a) return;

    // 1. Breadcrumbs
    const breadcrumbEl = document.getElementById('breadcrumb-agent-name');
    if (breadcrumbEl) breadcrumbEl.textContent = a.name;

    // 2. Banner
    const bannerEl = document.getElementById('agent-detail-banner-content');
    if (bannerEl) {
      const statusBadge = this.getStatusBadge(a.status);
      bannerEl.innerHTML = `
        <div class="agent-detail-header-row">
          <div class="agent-identity">
            <span class="agent-avatar-large">${a.icon}</span>
            <div>
              <div class="agent-title-badge-row">
                <h1 class="page-title">${a.name}</h1>
                ${statusBadge}
                <span class="source-tag ${a.source === 'MODEL' ? 'source-model' : 'source-ai'}">${a.source}</span>
              </div>
              <p class="agent-detail-sub"><strong>Model Architecture:</strong> ${a.model}</p>
              <p class="agent-purpose-text"><strong>Autonomous Purpose:</strong> ${a.purpose}</p>
            </div>
          </div>
          <div class="agent-banner-controls">
            <button id="btn-trigger-single-inference" class="btn btn-primary">
              <span class="btn-icon">⚡</span>
              <span>Trigger Live Inference</span>
            </button>
            <a href="./action-plans.html" class="btn btn-outline">
              Review Action Plans →
            </a>
          </div>
        </div>
      `;

      const triggerBtn = bannerEl.querySelector('#btn-trigger-single-inference');
      if (triggerBtn) {
        triggerBtn.addEventListener('click', () => this.triggerSingleInference());
      }
    }

    // 3. Performance Strip
    const perfEl = document.getElementById('agent-perf-strip');
    if (perfEl) {
      perfEl.innerHTML = `
        <div class="kpi-mini-card">
          <span class="kpi-mini-label">Execution Duration</span>
          <span class="kpi-mini-value">${a.executionDuration}</span>
          <span class="kpi-mini-sub text-success">Sub-second Inference</span>
        </div>
        <div class="kpi-mini-card">
          <span class="kpi-mini-label">Confidence Score</span>
          <span class="kpi-mini-value text-primary">${a.confidence}%</span>
          <div class="confidence-track" style="margin-top: 4px;">
            <div class="confidence-fill" style="width: ${a.confidence}%;"></div>
          </div>
        </div>
        <div class="kpi-mini-card">
          <span class="kpi-mini-label">Last Execution</span>
          <span class="kpi-mini-value" style="font-size: 1.1rem;">${a.lastExecution}</span>
          <span class="kpi-mini-sub">Autonomous Heartbeat</span>
        </div>
        <div class="kpi-mini-card">
          <span class="kpi-mini-label">Today's Inferences</span>
          <span class="kpi-mini-value">${a.inferencesToday}</span>
          <span class="kpi-mini-sub text-success">0 Pipeline Errors</span>
        </div>
      `;
    }

    // 4. Inputs Evaluated Grid
    const inputsEl = document.getElementById('inputs-grid-content');
    if (inputsEl) {
      inputsEl.innerHTML = a.inputs.map(inp => `
        <div class="input-card ${inp.alert ? 'input-alert' : ''}">
          <span class="input-label">${inp.label}</span>
          <span class="input-val ${inp.alert ? 'text-warning' : ''}">${inp.value}</span>
          <span class="input-source">${inp.source}</span>
        </div>
      `).join('');
    }

    // 5. Output Summary & Recommendation
    const outputEl = document.getElementById('agent-output-content');
    if (outputEl) {
      outputEl.innerHTML = `
        <div class="agent-output-block">
          <div class="output-statement-box">
            <h4>Inference Summary Output</h4>
            <p>${a.outputSummary}</p>
          </div>
          <div class="agent-recommendation-box highlight-recommendation">
            <div class="rec-header">
              <span class="rec-icon">💡</span>
              <span class="rec-title">Synthesized Recommendation</span>
            </div>
            <p class="rec-body" style="font-size: var(--font-size-sm); margin: var(--space-2) 0;">
              ${a.recommendation}
            </p>
            <div style="margin-top: var(--space-3);">
              <a href="./action-plans.html" class="btn btn-sm btn-primary">
                Review & Approve Action Plan →
              </a>
            </div>
          </div>
        </div>
      `;
    }

    // 6. Scientific Evidence & Grounding
    const evidenceEl = document.getElementById('agent-evidence-content');
    if (evidenceEl) {
      evidenceEl.innerHTML = `
        <div class="evidence-card">
          <div class="evidence-header">
            <span class="evidence-icon">🔬</span>
            <h4>Scientific Grounding & Agronomic Evidence</h4>
          </div>
          <p class="evidence-text">${a.evidence}</p>
          <div class="evidence-risks-section">
            <h5 class="sub-heading">Associated Agronomic Hazards:</h5>
            <div class="detected-risks-chips">
              ${a.detectedRisks.map(r => `
                <div class="risk-chip risk-${r.type}">
                  <span class="risk-chip-icon">${r.type === 'danger' ? '🚨' : r.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                  <div>
                    <strong>${r.title}</strong>
                    <span class="risk-chip-sub">Severity: ${r.score}/100 (${r.severity}) • Location: ${r.zone}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    // 7. Reasoning Steps (CoT)
    const cotEl = document.getElementById('reasoning-timeline-content');
    if (cotEl) {
      cotEl.innerHTML = a.reasoningSteps.map(step => `
        <div class="reasoning-step ${step.status}">
          <div class="step-marker">${step.status === 'pass' ? '✓' : step.status === 'warning' ? '!' : 'ℹ'}</div>
          <div class="step-content">
            <h4>${step.title}</h4>
            <p>${step.desc}</p>
          </div>
        </div>
      `).join('');
    }

    // 8. Raw Telemetry Payload Viewer
    const payloadEl = document.getElementById('agent-raw-payload-viewer');
    if (payloadEl) {
      payloadEl.textContent = JSON.stringify(a.rawPayload, null, 2);
    }
  }

  renderConsensusTimeline() {
    const timelineEl = document.getElementById('master-consensus-timeline');
    if (!timelineEl) return;

    timelineEl.innerHTML = MASTER_TIMELINE.map((item, idx) => `
      <div class="consensus-timeline-item" id="timeline-step-${idx}">
        <div class="consensus-time">${item.time}</div>
        <div class="consensus-bullet">
          <span class="bullet-inner">${item.icon}</span>
        </div>
        <div class="consensus-body">
          <div class="consensus-agent-title">
            <strong>${item.agent}</strong>
            ${this.getStatusBadge(item.status)}
          </div>
          <p class="consensus-summary">${item.summary}</p>
        </div>
      </div>
    `).join('');
  }

  renderExecutionHistory() {
    const tableBody = document.getElementById('execution-history-tbody');
    if (!tableBody) return;

    tableBody.innerHTML = EXECUTION_HISTORY_SAMPLES.map(item => `
      <tr>
        <td><code>${item.id}</code></td>
        <td>${item.time}</td>
        <td>${item.duration}</td>
        <td>${this.getStatusBadge(item.status)}</td>
        <td><strong>${item.confidence}</strong></td>
        <td>${item.outcome}</td>
        <td>
          <button class="btn btn-xs btn-outline btn-view-payload" data-run-id="${item.id}">
            Inspect
          </button>
        </td>
      </tr>
    `).join('');

    tableBody.querySelectorAll('.btn-view-payload').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const runId = e.currentTarget.getAttribute('data-run-id');
        appShell.showToast(`Viewing audit trace for ${runId}`, 'info', 2000);
      });
    });
  }

  triggerSingleInference() {
    const triggerBtn = document.getElementById('btn-trigger-single-inference');
    if (triggerBtn) {
      triggerBtn.disabled = true;
      triggerBtn.innerHTML = `<span class="btn-icon spinner">⏳</span><span>Evaluating Model...</span>`;
    }

    appShell.showToast(`Triggering single-agent inference: ${this.agent.name}`, 'info', 2000);

    setTimeout(() => {
      this.agent.lastExecution = 'Just now';
      this.agent.inferencesToday += 1;
      this.agent.confidence = Math.min(99.4, Math.max(91.0, +(this.agent.confidence + (Math.random() * 0.6 - 0.3)).toFixed(1)));
      this.renderAgentDetails();

      if (triggerBtn) {
        triggerBtn.disabled = false;
        triggerBtn.innerHTML = `<span class="btn-icon">⚡</span><span>Trigger Live Inference</span>`;
      }

      appShell.showToast(`✓ ${this.agent.name} inference completed in ${this.agent.executionDuration} (${this.agent.confidence}% confidence)`, 'success', 3500);
    }, 1200);
  }

  async replayConsensusTimeline() {
    if (this.isReplaying) return;
    this.isReplaying = true;

    const btn = document.getElementById('btn-replay-timeline');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="btn-icon spinner">⏳</span><span>Replaying Trace...</span>`;
    }

    appShell.showToast('Replaying autonomous multi-agent consensus pipeline trace', 'info', 2500);

    const items = document.querySelectorAll('.consensus-timeline-item');
    items.forEach(el => el.classList.remove('active-step', 'completed-step'));

    for (let i = 0; i < items.length; i++) {
      items[i].classList.add('active-step');
      items[i].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      await new Promise(r => setTimeout(r, 700));
      items[i].classList.remove('active-step');
      items[i].classList.add('completed-step');
    }

    this.isReplaying = false;
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span class="btn-icon">⚡</span><span>Replay Consensus Pipeline Trace</span>`;
    }

    appShell.showToast('✓ Consensus Pipeline Replay Complete: Action Plan #AP-418 verified', 'success', 4000);
  }

  getStatusBadge(status) {
    switch (status) {
      case 'RUNNING':
        return `<span class="badge badge-running"><span class="pulse-dot"></span> RUNNING</span>`;
      case 'WARNING':
        return `<span class="badge badge-warning">⚠️ WARNING</span>`;
      case 'COMPLETED':
        return `<span class="badge badge-success">✓ COMPLETED</span>`;
      case 'IDLE':
        return `<span class="badge badge-secondary">⏸ IDLE</span>`;
      case 'FAILED':
        return `<span class="badge badge-danger">✕ FAILED</span>`;
      default:
        return `<span class="badge badge-secondary">${status}</span>`;
    }
  }
}

export const agentDetailsController = new AgentDetailsController();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => agentDetailsController.init());
} else {
  agentDetailsController.init();
}

export default agentDetailsController;
