# BACKEND.md

# KrishiNirnay AI --- Production Backend Master Prompt

## 0. ROLE

You are a **Senior Backend Architect, FastAPI Engineer, AI/Multi-Agent
Systems Engineer, IoT Architect, Database Engineer, Security Engineer,
and DevOps Engineer**.

Build the complete production-oriented backend for:

> **KrishiNirnay AI --- Autonomous Farm-to-Field Advisory & Action
> Orchestration Platform**

The backend will be deployed on:

> **Render**

The frontend is a separate static application built with:

> **HTML + CSS + Vanilla JavaScript**

and deployed on:

> **GitHub Pages**

The backend is the authoritative source of truth for:

-   farm data
-   field data
-   zones
-   virtual sensors
-   telemetry
-   live weather
-   AI-agent outputs
-   risk detection
-   action plans
-   approvals
-   execution
-   notifications
-   market data
-   expert escalation
-   audit history

------------------------------------------------------------------------

# 1. CORE PRODUCT OBJECTIVE

KrishiNirnay AI continuously monitors agricultural conditions and
coordinates farm decisions.

The core system must implement:

``` text
Farm
 ↓
Field
 ↓
Zone
 ↓
Virtual Sensors
 ↓
Telemetry
 ↓
Data Validation
 ↓
Data Fusion
 ↓
AI Agents
 ↓
Risk Engine
 ↓
Multi-Agent Orchestrator
 ↓
Policy/Safety Engine
 ↓
Action Plan
 ↓
Farmer Approval
 ↓
Execution
 ↓
Feedback
 ↓
New Telemetry
 ↓
Verification
 ↓
Reassessment
```

The system must behave as a connected operational platform, not a
collection of disconnected APIs.

------------------------------------------------------------------------

# 2. MOST IMPORTANT REQUIREMENT --- VIRTUAL SENSOR SYSTEM

The hackathon environment may not have physical IoT sensors.

Therefore implement a complete:

> **Virtual IoT Sensor Engine**

This is not a frontend mock.

The virtual sensor engine must run in the backend and generate
persistent telemetry that behaves like an IoT data source.

The frontend only consumes the resulting API.

Every virtual reading must identify:

``` text
source = virtual_sensor
```

and the frontend should display:

> SIMULATED --- Virtual IoT

------------------------------------------------------------------------

# 3. FUTURE PHYSICAL IOT COMPATIBILITY

Design the sensor ingestion layer so that:

### Today

``` text
Virtual Sensor
 ↓
Sensor Service
 ↓
SensorReading
```

### Future

``` text
ESP32 / Physical Sensor
 ↓
MQTT / IoT Gateway
 ↓
Sensor Service
 ↓
SensorReading
```

Both must produce the same normalized sensor-reading contract.

AI agents must not care whether a reading came from:

``` text
virtual_sensor
physical_iot
external
```

Only the ingestion layer should know the source.

------------------------------------------------------------------------

# 4. TECHNOLOGY STACK

Use:

### Backend

-   Python 3.11+
-   FastAPI
-   Pydantic
-   SQLAlchemy
-   PostgreSQL
-   PostGIS
-   Alembic
-   HTTPX
-   Redis
-   JWT authentication
-   secure password hashing
-   structured logging
-   background jobs/workers where required
-   Docker

### External data

Use a weather provider such as:

> Open-Meteo

The weather provider must be accessed by the backend, not directly by
frontend JavaScript.

### Optional AI/LLM

Use an LLM only where it adds value.

Do not make the entire system dependent on an LLM.

Every critical workflow must have deterministic/rule-based fallback
behavior.

------------------------------------------------------------------------

# 5. REQUIRED PROJECT STRUCTURE

Create:

``` text
backend/
│
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │   ├── dependencies.py
│   │   └── routes/
│   │       ├── auth.py
│   │       ├── farms.py
│   │       ├── fields.py
│   │       ├── zones.py
│   │       ├── sensors.py
│   │       ├── weather.py
│   │       ├── agents.py
│   │       ├── risks.py
│   │       ├── actions.py
│   │       ├── tasks.py
│   │       ├── execution.py
│   │       ├── simulation.py
│   │       ├── alerts.py
│   │       ├── market.py
│   │       ├── experts.py
│   │       ├── reports.py
│   │       └── admin.py
│   │
│   ├── agents/
│   │   ├── base.py
│   │   ├── orchestrator.py
│   │   ├── farm_context.py
│   │   ├── soil_agent.py
│   │   ├── weather_agent.py
│   │   ├── irrigation_agent.py
│   │   ├── nutrient_agent.py
│   │   ├── disease_agent.py
│   │   ├── drone_agent.py
│   │   ├── market_agent.py
│   │   └── risk_agent.py
│   │
│   ├── services/
│   │   ├── farm_service.py
│   │   ├── field_service.py
│   │   ├── sensor_service.py
│   │   ├── weather_service.py
│   │   ├── risk_service.py
│   │   ├── action_service.py
│   │   ├── task_service.py
│   │   ├── execution_service.py
│   │   ├── notification_service.py
│   │   ├── market_service.py
│   │   └── report_service.py
│   │
│   ├── simulation/
│   │   ├── sensor_simulator.py
│   │   ├── scenarios.py
│   │   ├── scenario_engine.py
│   │   └── execution_simulator.py
│   │
│   ├── policies/
│   │   ├── safety.py
│   │   ├── approval.py
│   │   ├── constraints.py
│   │   └── thresholds.py
│   │
│   ├── integrations/
│   │   ├── weather/
│   │   ├── llm/
│   │   ├── market/
│   │   └── storage/
│   │
│   ├── db/
│   │   ├── database.py
│   │   ├── models/
│   │   ├── repositories/
│   │   └── seed.py
│   │
│   ├── schemas/
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── logging.py
│   │   └── exceptions.py
│   │
│   └── workers/
│       ├── scheduler.py
│       ├── sensor_worker.py
│       ├── weather_worker.py
│       └── agent_worker.py
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── migrations/
├── Dockerfile
├── render.yaml
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

Keep domain logic out of route files.

Routes should be thin and call services.

------------------------------------------------------------------------

# PHASE 1 --- APPLICATION INITIALIZATION

Create the FastAPI application with:

-   API versioning structure
-   routers
-   middleware
-   exception handling
-   CORS
-   logging
-   health checks
-   request IDs
-   OpenAPI documentation

Main application:

``` text
app/main.py
```

Required:

``` text
GET /health
GET /ready
```

------------------------------------------------------------------------

# PHASE 2 --- ENVIRONMENT CONFIGURATION

Create `.env.example`:

``` env
APP_NAME=KrishiNirnay AI
APP_ENV=development
PORT=8000

DATABASE_URL=
REDIS_URL=

JWT_SECRET=
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

FRONTEND_ORIGIN=http://localhost:5500
FRONTEND_PRODUCTION_ORIGIN=https://YOUR-USERNAME.github.io

WEATHER_API_BASE_URL=
WEATHER_CACHE_TTL_SECONDS=1800

LLM_API_KEY=
LLM_MODEL=

SIMULATION_MODE=true

LOG_LEVEL=INFO
```

Never commit:

-   database passwords
-   JWT secrets
-   LLM keys
-   private credentials

------------------------------------------------------------------------

# PHASE 3 --- DATABASE ARCHITECTURE

Use:

> PostgreSQL + PostGIS

Use SQLAlchemy models and Alembic migrations.

Required entities:

``` text
User
Farm
Field
Zone

Crop
CropCycle
SoilProfile

Sensor
SensorReading

WeatherRecord
WeatherForecast

Image
ImageAnalysis

AgentRun
AgentPrediction

RiskEvent
Recommendation

ActionPlan
Task
TaskEvent

IrrigationRun

Alert
ExpertCase

MarketPrice

AuditLog
SystemEvent
```

------------------------------------------------------------------------

# PHASE 4 --- FARM DATA MODEL

## Farm

Fields:

``` text
id
user_id
name
description
latitude
longitude
area
soil_type
irrigation_type
boundary
status
created_at
updated_at
```

## Field

``` text
id
farm_id
name
area
crop_id
crop_cycle_id
boundary
status
created_at
updated_at
```

## Zone

``` text
id
field_id
name
boundary
crop_stage
area
status
created_at
updated_at
```

Use PostGIS geometry types where appropriate.

------------------------------------------------------------------------

# PHASE 5 --- CROP & SOIL MODELS

Create:

``` text
Crop
CropCycle
SoilProfile
```

Crop cycle should contain:

``` text
crop
variety
planting_date
expected_harvest_date
growth_stage
area
```

Soil profile:

``` text
soil_type
pH
EC
baseline_N
baseline_P
baseline_K
water_holding_characteristics
```

Agronomic thresholds must be configurable.

Do not assume one threshold is valid for every crop and soil.

------------------------------------------------------------------------

# PHASE 6 --- SENSOR MODEL

Sensor fields:

``` text
id
farm_id
field_id
zone_id
name
sensor_type
source
status
unit
last_seen
configuration
created_at
updated_at
```

Sensor source:

``` text
virtual_sensor
physical_iot
external
```

Sensor status:

``` text
ONLINE
STALE
OFFLINE
ERROR
```

------------------------------------------------------------------------

# PHASE 7 --- SENSOR READING MODEL

Create a normalized telemetry model.

Example:

``` json
{
  "sensor_id": "sensor-123",
  "farm_id": "farm-1",
  "field_id": "field-1",
  "zone_id": "zone-a",
  "timestamp": "2026-09-19T08:30:00Z",
  "measurements": {
    "soil_moisture": 32.4,
    "soil_temperature": 27.1
  },
  "quality": "GOOD",
  "source": "virtual_sensor"
}
```

Support:

``` text
GOOD
WARNING
INVALID
MISSING
```

------------------------------------------------------------------------

# PHASE 8 --- VIRTUAL SENSOR ENGINE

Build a realistic simulation engine.

Do NOT generate pure random numbers.

Use:

``` text
Baseline
+
Trend
+
Noise
+
Crop Influence
+
Weather Influence
+
Scenario Modifier
=
Sensor Reading
```

Example:

``` text
soil_moisture
temperature
humidity
NPK
pH
EC
rainfall
```

Each reading should depend on previous state where appropriate.

The engine must maintain continuity.

Example:

``` text
Previous soil moisture = 42%
Next = 41.5%
Next = 40.8%
Next = 39.9%
```

rather than:

``` text
42%
8%
73%
21%
```

------------------------------------------------------------------------

# PHASE 9 --- VIRTUAL SENSOR SCENARIOS

Support:

``` text
NORMAL
WATER_STRESS
NUTRIENT_DEFICIENCY
HEAT_WAVE
HEAVY_RAIN
DISEASE_FAVORABLE
SENSOR_FAILURE
```

## Water Stress

Modify:

``` text
soil moisture ↓
humidity ↓
temperature ↑
ET0 ↑ where available
```

## Heavy Rain

Modify:

``` text
rainfall ↑
soil moisture ↑
humidity ↑
irrigation suitability ↓
```

## Heat Wave

Modify:

``` text
temperature ↑
humidity ↓
soil moisture consumption ↑
```

## Nutrient Deficiency

Modify relevant:

``` text
N ↓ / P ↓ / K ↓
```

according to the selected scenario.

## Sensor Failure

Set:

``` text
status = OFFLINE
quality = INVALID
```

and stop generating valid readings for the failed sensor.

------------------------------------------------------------------------

# PHASE 10 --- SENSOR API

Implement:

``` http
GET    /api/sensors
POST   /api/sensors
GET    /api/sensors/{id}
PATCH  /api/sensors/{id}
GET    /api/sensors/{id}/readings
POST   /api/sensors/telemetry
GET    /api/zones/{id}/sensors
GET    /api/fields/{id}/sensors
```

Validate ownership on every request.

------------------------------------------------------------------------

# PHASE 11 --- SIMULATION API

Implement:

``` http
POST /api/simulation/water-stress
POST /api/simulation/disease
POST /api/simulation/nutrient
POST /api/simulation/heavy-rain
POST /api/simulation/heat-wave
POST /api/simulation/sensor-failure
POST /api/simulation/reset
GET  /api/simulation/status
```

The simulation endpoint must modify backend state.

It must trigger the relevant downstream processing.

Example:

``` text
POST water-stress
 ↓
Scenario state updated
 ↓
Virtual telemetry changes
 ↓
Agents run
 ↓
Risk recalculated
 ↓
Action plan evaluated
 ↓
Alerts generated
```

Do not return a fake success response without changing system state.

------------------------------------------------------------------------

# PHASE 12 --- LIVE WEATHER SERVICE

Integrate a weather provider through a backend adapter.

Preferred provider for the hackathon:

> Open-Meteo

The weather service must:

``` text
Farm Coordinates
 ↓
Weather Provider
 ↓
Validation
 ↓
Normalization
 ↓
Cache
 ↓
Database
 ↓
API Response
```

Support:

``` text
current weather
hourly forecast
daily forecast
rain probability
precipitation
temperature
humidity
wind
cloud cover
ET0 where supported
```

Never fabricate live weather.

------------------------------------------------------------------------

# PHASE 13 --- WEATHER FAILURE STRATEGY

If live weather fails:

``` text
Live Provider
 ↓
Cached Data
```

Return:

``` json
{
  "source": "cached",
  "stale": true
}
```

If no cached data exists:

``` json
{
  "weather_available": false,
  "source": null
}
```

Do not silently create fake weather.

------------------------------------------------------------------------

# PHASE 14 --- WEATHER API

Implement:

``` http
GET /api/weather/current
GET /api/weather/forecast
GET /api/weather/hourly
GET /api/weather/farm/{farm_id}
```

Support farm-based coordinates so the frontend does not need to manage
weather-provider credentials.

------------------------------------------------------------------------

# PHASE 15 --- FARM CONTEXT AGENT

Build a context aggregation layer.

It should collect:

``` text
Farm
Field
Zone
Crop
Crop Stage
Soil Profile
Latest Sensor Data
Recent Sensor Trends
Weather
Forecast
Recent Risks
Previous Actions
Execution History
Drone Results
Market Information
```

The context object becomes the standardized input to agents.

------------------------------------------------------------------------

# PHASE 16 --- AGENT BASE CONTRACT

Every agent must implement:

``` python
run(context)
validate_input(context)
validate_output(result)
get_status()
get_metadata()
```

Every agent result must contain:

``` text
agent_name
run_id
timestamp
status
risk
confidence
evidence
recommendation
```

Agent outputs must be structured.

Do not rely on unstructured LLM text as the system contract.

------------------------------------------------------------------------

# PHASE 17 --- SOIL AGENT

Inputs:

``` text
soil moisture
soil temperature
NPK
pH
EC
soil type
crop
growth stage
```

Outputs:

``` text
soil condition
water status
nutrient status
risk
confidence
evidence
recommendation
```

------------------------------------------------------------------------

# PHASE 18 --- WEATHER AGENT

Analyze:

``` text
current weather
forecast
rain probability
temperature
humidity
wind
ET0
```

Outputs:

``` text
heat risk
rain risk
irrigation suitability
field-work suitability
spraying suitability
weather window
confidence
evidence
```

------------------------------------------------------------------------

# PHASE 19 --- IRRIGATION AGENT

Inputs:

``` text
soil moisture
soil type
crop
growth stage
temperature
humidity
rain probability
rain forecast
ET0
recent irrigation
```

Outputs:

``` text
risk_score
severity
recommended_action
affected_zone
recommended_window
estimated_duration
confidence
evidence
```

Thresholds must be configurable.

Do not hard-code one universal moisture threshold.

------------------------------------------------------------------------

# PHASE 20 --- NUTRIENT AGENT

Analyze:

``` text
N
P
K
pH
EC
soil
crop
growth stage
fertilizer history
weather
```

Return:

``` text
nitrogen_status
phosphorus_status
potassium_status
overall_risk
confidence
evidence
recommendation
```

Do not allow an LLM to invent unsafe fertilizer or chemical application
rates.

------------------------------------------------------------------------

# PHASE 21 --- DISEASE / DRONE AGENT

Pipeline:

``` text
Image
 ↓
Validation
 ↓
Model Inference
 ↓
Disease Prediction
 ↓
Probability
 ↓
Severity
 ↓
Affected Area
 ↓
Weather Correlation
 ↓
Disease Risk
```

Endpoint:

``` http
POST /api/agents/disease/analyze
```

Validate:

-   MIME type
-   extension
-   file size
-   dimensions

Return:

``` text
prediction
probability
severity
affected_area
confidence
evidence
```

If a real model is unavailable for the hackathon, use a deterministic
demo provider and label it clearly as demo/model output.

Never claim a demo classifier is clinically/agronomically validated.

------------------------------------------------------------------------

# PHASE 22 --- MARKET AGENT

Inputs:

``` text
crop
market
current price
historical prices
harvest readiness
storage capacity
```

Outputs:

``` text
current price
trend
market signal
confidence
evidence
```

Market information is decision support.

Do not produce guaranteed profit or guaranteed future-price claims.

------------------------------------------------------------------------

# PHASE 23 --- RISK ENGINE

Normalize risks to:

``` text
0–100
```

Severity:

``` text
LOW
MEDIUM
HIGH
CRITICAL
```

Risk records must contain:

``` text
risk_type
score
severity
confidence
farm_id
field_id
zone_id
evidence
detected_at
status
```

Examples:

``` text
WATER_STRESS
DISEASE_RISK
NUTRIENT_DEFICIENCY
HEAT_STRESS
HEAVY_RAIN
SENSOR_FAILURE
MARKET_SIGNAL
```

------------------------------------------------------------------------

# PHASE 24 --- MULTI-AGENT ORCHESTRATOR

The orchestrator is responsible for combining specialized agent outputs.

Flow:

``` text
Agent Results
 ↓
Validate
 ↓
Compare
 ↓
Detect Conflicts
 ↓
Prioritize Risks
 ↓
Apply Policies
 ↓
Generate Action Plan
```

Example:

``` text
Irrigation Agent:
Recommend irrigation

Weather Agent:
Heavy rain expected

↓

Orchestrator:
Delay irrigation
```

The reason for the decision must be stored as evidence/explanation.

------------------------------------------------------------------------

# PHASE 25 --- POLICY / SAFETY ENGINE

Never allow:

``` text
LLM → Device
```

Correct:

``` text
AI
 ↓
Risk
 ↓
Orchestrator
 ↓
Policy
 ↓
Action Plan
 ↓
Approval
 ↓
Execution
```

Approval policy:

### Low-risk

Monitoring and notifications may be automatic.

### Medium-risk

Require farmer approval for resource-consuming operations.

### High-risk

Require human/expert review.

Escalate when:

``` text
low confidence
high-impact action
agent conflict
uncertain diagnosis
high cost
sensor failure
unsafe/unsupported recommendation
```

------------------------------------------------------------------------

# PHASE 26 --- ACTION PLAN MODEL

Create:

``` text
ActionPlan
```

Fields:

``` text
id
farm_id
field_id
zone_id
action_type
description
scheduled_at
priority
estimated_cost
confidence
reason
evidence
safety_status
approval_status
created_by
created_at
updated_at
```

Approval states:

``` text
PENDING
APPROVED
REJECTED
EXPERT_REVIEW
```

------------------------------------------------------------------------

# PHASE 27 --- ACTION API

Implement:

``` http
GET  /api/actions
GET  /api/actions/{id}
POST /api/actions/{id}/approve
POST /api/actions/{id}/reject
POST /api/actions/{id}/expert-review
```

Approval must be validated server-side.

The backend must not trust:

``` text
frontend role
frontend user ID
frontend approval status
```

------------------------------------------------------------------------

# PHASE 28 --- TASK ENGINE

Task states:

``` text
CREATED
PENDING_APPROVAL
APPROVED
SCHEDULED
ASSIGNED
IN_PROGRESS
COMPLETED
VERIFIED
FAILED
ESCALATED
```

Endpoints:

``` http
GET  /api/tasks
GET  /api/tasks/{id}
POST /api/tasks/{id}/start
POST /api/tasks/{id}/complete
POST /api/tasks/{id}/fail
```

Every state transition should be validated.

Record transitions in:

``` text
TaskEvent
```

------------------------------------------------------------------------

# PHASE 29 --- VIRTUAL EXECUTION ENGINE

Implement a virtual irrigation/device execution layer.

States:

``` text
OFF
STARTING
RUNNING
PAUSED
COMPLETED
FAILED
```

Endpoints:

``` http
POST /api/execution/irrigation/start
POST /api/execution/irrigation/pause
POST /api/execution/irrigation/stop
GET  /api/execution/irrigation/{id}
```

Backend owns the execution state.

The browser never directly controls a device.

------------------------------------------------------------------------

# PHASE 30 --- EXECUTION FEEDBACK LOOP

After successful virtual irrigation:

``` text
Execution completed
 ↓
Virtual soil moisture increases
 ↓
New sensor reading
 ↓
Risk recalculated
 ↓
Agents reassess
 ↓
Result verified
```

Store:

``` text
IrrigationRun
TaskEvent
SensorReading
RiskEvent
AgentRun
```

This creates the autonomous loop.

------------------------------------------------------------------------

# PHASE 31 --- EXPERT ESCALATION

Create:

``` text
ExpertCase
```

Escalate when:

``` text
confidence below threshold
high-risk action
agent conflict
uncertain disease diagnosis
sensor failure
repeated execution failure
```

Endpoints:

``` http
GET  /api/experts/cases
POST /api/experts/cases
POST /api/experts/cases/{id}/resolve
```

------------------------------------------------------------------------

# PHASE 32 --- ALERT ENGINE

Alert categories:

``` text
SYSTEM
WEATHER
RISK
ACTION
SENSOR
EXPERT
MARKET
```

Severity:

``` text
INFO
WARNING
HIGH
CRITICAL
```

Endpoints:

``` http
GET /api/alerts
POST /api/alerts/{id}/acknowledge
```

Alerts should be generated by backend events.

------------------------------------------------------------------------

# PHASE 33 --- EVENT SYSTEM

Create internal events:

``` text
sensor.reading.created
weather.updated
agent.started
agent.completed
risk.detected
risk.resolved
action.plan.created
approval.requested
action.approved
action.rejected
task.started
task.completed
task.failed
execution.started
execution.completed
expert.escalation.created
```

Use events to keep services loosely coupled.

------------------------------------------------------------------------

# PHASE 34 --- AUTHENTICATION

Implement:

``` http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Use:

-   secure password hashing
-   JWT access tokens
-   token expiration
-   authorization checks
-   user ownership validation

Never store plaintext passwords.

------------------------------------------------------------------------

# PHASE 35 --- AUTHORIZATION

Every user must only access their own:

``` text
Farms
Fields
Zones
Sensors
Telemetry
Actions
Tasks
Alerts
Reports
Images
```

Admin operations require explicit authorization.

Never depend on frontend role checks alone.

------------------------------------------------------------------------

# PHASE 36 --- DATABASE REPOSITORIES

Use repositories/services instead of placing complex SQL inside route
handlers.

Example:

``` text
FarmRepository
FieldRepository
SensorRepository
RiskRepository
ActionRepository
TaskRepository
```

Keep:

``` text
Routes
 ↓
Services
 ↓
Repositories
 ↓
Database
```

------------------------------------------------------------------------

# PHASE 37 --- BACKGROUND PROCESSING

Background processing may be used for:

``` text
virtual sensor generation
weather refresh
agent execution
risk evaluation
notifications
task progress
feedback/reassessment
```

Use a Render-compatible worker architecture.

For lightweight bounded work, FastAPI background tasks may be used.

Do not create uncontrolled infinite processes inside the web server.

------------------------------------------------------------------------

# PHASE 38 --- SENSOR SCHEDULING

Virtual sensor generation should operate on a controlled interval.

Example concept:

``` text
Every N seconds/minutes
 ↓
Generate next telemetry
 ↓
Validate
 ↓
Store
 ↓
Trigger relevant processing
```

The interval must be configurable.

Do not generate excessive database writes.

------------------------------------------------------------------------

# PHASE 39 --- CACHING

Use Redis where appropriate for:

``` text
weather responses
short-lived API data
rate limiting
job coordination
temporary state
```

Database remains the persistent source of truth.

Do not rely on Redis alone for critical farm/action history.

------------------------------------------------------------------------

# PHASE 40 --- IMAGE STORAGE

Do not depend on Render local filesystem for permanent image storage.

Create an abstraction:

``` text
StorageService
```

It should support future:

``` text
S3-compatible storage
Cloud object storage
```

For hackathon/demo mode, local temporary storage may be supported with
clear limitations.

------------------------------------------------------------------------

# PHASE 41 --- REPORTING

Implement backend report endpoints such as:

``` http
GET /api/reports/field-performance
GET /api/reports/yield-estimation
GET /api/reports/risk-summary
GET /api/reports/action-effectiveness
GET /api/reports/water-usage
GET /api/reports/sensor-history
GET /api/reports/agent-activity
GET /api/reports/market-analysis
```

Reports must be generated from actual stored system data.

------------------------------------------------------------------------

# PHASE 42 --- API RESPONSE CONTRACTS

Use Pydantic schemas.

Keep API responses predictable.

Example:

``` json
{
  "data": {},
  "meta": {
    "request_id": "...",
    "timestamp": "..."
  }
}
```

For errors:

``` json
{
  "error": {
    "code": "WEATHER_PROVIDER_TIMEOUT",
    "message": "Weather provider temporarily unavailable",
    "request_id": "..."
  }
}
```

Do not expose internal stack traces.

------------------------------------------------------------------------

# PHASE 43 --- PAGINATION / FILTERING

For list endpoints support where useful:

``` text
page
limit
sort
status
field_id
farm_id
zone_id
start_date
end_date
```

Do not return unlimited database records.

------------------------------------------------------------------------

# PHASE 44 --- INPUT VALIDATION

Validate:

-   IDs
-   dates
-   coordinates
-   numeric ranges
-   uploaded files
-   enum values
-   pagination
-   query parameters
-   request bodies

Reject malformed requests cleanly.

------------------------------------------------------------------------

# PHASE 45 --- SECURITY

Implement:

-   password hashing
-   JWT security
-   authorization
-   input validation
-   ownership checks
-   rate limiting
-   CORS restrictions
-   file validation
-   request size limits
-   SQL injection protection through SQLAlchemy
-   secret management
-   structured audit logging

Never trust client-controlled:

``` text
user_id
role
approval
risk
task status
execution status
```

------------------------------------------------------------------------

# PHASE 46 --- CORS

Allow only configured origins.

Development:

``` text
http://localhost:5500
```

Production:

``` text
https://YOUR-USERNAME.github.io
```

Do not use unrestricted:

``` text
*
```

when authenticated production access requires controlled origins.

------------------------------------------------------------------------

# PHASE 47 --- RATE LIMITING

Apply stricter rate limits to:

``` text
login
register
image upload
simulation
AI analysis
expert actions
```

Use Redis-backed rate limiting where appropriate.

------------------------------------------------------------------------

# PHASE 48 --- AUDIT LOGGING

Record important operations:

``` text
login
logout
farm created
field created
sensor created
simulation started
risk detected
action approved
action rejected
expert review requested
task started
task completed
execution started
execution stopped
settings changed
```

Audit record:

``` text
user
action
resource
resource_id
timestamp
metadata
request_id
```

------------------------------------------------------------------------

# PHASE 49 --- OBSERVABILITY

Implement:

-   structured logs
-   request IDs
-   API timing
-   agent execution logs
-   weather provider errors
-   LLM errors
-   sensor errors
-   simulation events
-   execution events

Do not log:

-   passwords
-   JWT secrets
-   API keys
-   sensitive credentials

------------------------------------------------------------------------

# PHASE 50 --- LLM INTEGRATION

If an LLM is used:

Use it for tasks such as:

``` text
explanation
summarization
natural-language advisory
agent reasoning assistance
```

Do not make it the only decision mechanism.

LLM output must be:

``` text
validated
structured
bounded
auditable
```

Never allow:

``` text
LLM → direct device command
```

Use:

``` text
LLM
 ↓
Structured Recommendation
 ↓
Validation
 ↓
Risk/Policy Engine
 ↓
Action Plan
 ↓
Approval
 ↓
Execution
```

If the LLM fails:

``` text
LLM
 ↓
Deterministic fallback
```

The system must continue operating.

------------------------------------------------------------------------

# PHASE 51 --- AGENT FAILURE HANDLING

If one agent fails:

``` text
Agent failure
 ↓
Record failure
 ↓
Continue other agents where safe
 ↓
Mark confidence appropriately
 ↓
Escalate if necessary
```

Do not crash the complete orchestration pipeline because one
non-critical agent failed.

------------------------------------------------------------------------

# PHASE 52 --- AGENT CONFLICT HANDLING

Example:

``` text
Agent A:
Irrigate

Agent B:
Do not irrigate

↓

Orchestrator detects conflict

↓

Policy evaluation

↓

Action delayed / approval required / expert review
```

Store:

``` text
conflicting_agents
evidence
resolution
confidence
```

------------------------------------------------------------------------

# PHASE 53 --- WATER-STRESS DEMO

This must work end-to-end.

``` text
Simulation Center
 ↓
POST /api/simulation/water-stress
 ↓
Virtual sensor scenario changes
 ↓
Telemetry generated
 ↓
Irrigation Agent
 ↓
Weather Agent
 ↓
Risk Engine
 ↓
Orchestrator
 ↓
Policy Engine
 ↓
Action Plan
 ↓
Farmer Approval
 ↓
Task
 ↓
Virtual Irrigation
 ↓
Execution Completed
 ↓
Soil Moisture Updated
 ↓
New Telemetry
 ↓
Risk Recalculation
 ↓
Verification
```

No stage should be fake.

------------------------------------------------------------------------

# PHASE 54 --- HEAVY-RAIN DEMO

Implement:

``` text
Heavy Rain Scenario
 ↓
Rain conditions change
 ↓
Weather/risk state updates
 ↓
Irrigation recommendation conflicts
 ↓
Orchestrator detects conflict
 ↓
Policy evaluates
 ↓
Action delayed
 ↓
Weather alert generated
```

------------------------------------------------------------------------

# PHASE 55 --- DISEASE DEMO

Implement:

``` text
Image upload
 ↓
Image validation
 ↓
Disease model/demo provider
 ↓
Prediction
 ↓
Confidence
 ↓
Weather correlation
 ↓
Disease risk
 ↓
Recommendation
 ↓
Safety policy
 ↓
Farmer approval or expert escalation
```

------------------------------------------------------------------------

# PHASE 56 --- SEED DATA

Create development/demo seed data:

``` text
1 demo user
1 farm
3 fields
multiple zones
multiple crops
multiple crop cycles
multiple virtual sensors
sensor telemetry
soil profiles
weather records
agent runs
risks
action plans
tasks
alerts
market records
```

Every simulated sensor should be marked:

``` text
source = virtual_sensor
```

------------------------------------------------------------------------

# PHASE 57 --- DATABASE MIGRATIONS

Use Alembic.

Never manually create production tables.

Workflow:

``` text
Code change
 ↓
Alembic migration
 ↓
Migration applied
 ↓
Application starts
```

Render deployment must run migrations safely.

------------------------------------------------------------------------

# PHASE 58 --- TESTING STRATEGY

Create unit tests for:

``` text
virtual sensor calculations
scenario modifiers
risk scoring
agent rules
policy engine
orchestrator
weather normalization
```

Integration tests for:

``` text
database
weather provider
simulation
agent pipeline
action approval
execution
```

End-to-end test:

``` text
Water stress
 ↓
Telemetry
 ↓
Agent
 ↓
Risk
 ↓
Orchestrator
 ↓
Action
 ↓
Approval
 ↓
Execution
 ↓
Updated telemetry
 ↓
Reassessment
```

------------------------------------------------------------------------

# PHASE 59 --- API TESTING

Test:

``` text
authentication
authorization
farm ownership
sensor access
weather
simulation
risks
actions
approvals
tasks
execution
alerts
reports
```

Verify unauthorized users cannot access another user's data.

------------------------------------------------------------------------

# PHASE 60 --- HEALTH CHECKS

Implement:

``` http
GET /health
GET /ready
```

Health:

``` json
{
  "status": "healthy"
}
```

Readiness should verify required dependencies according to deployment
requirements.

Do not expose secrets or internal credentials.

------------------------------------------------------------------------

# PHASE 61 --- FASTAPI DOCUMENTATION

Expose:

``` text
/docs
/redoc
/openapi.json
```

Organize API tags:

``` text
Authentication
Farms
Fields
Zones
Sensors
Weather
Agents
Risks
Actions
Tasks
Execution
Simulation
Alerts
Market
Experts
Reports
Admin
```

------------------------------------------------------------------------

# PHASE 62 --- DOCKER

Create a production-ready Dockerfile.

The application must listen on:

``` text
0.0.0.0:$PORT
```

Use:

``` bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Do not hard-code the production port.

------------------------------------------------------------------------

# PHASE 63 --- RENDER DEPLOYMENT

Create:

``` text
render.yaml
```

Configure:

``` text
FastAPI web service
PostgreSQL database
Redis if required
environment variables
health check
migration process
```

The deployment must support:

``` text
GitHub Repository
 ↓
Render
 ↓
FastAPI
 ↓
PostgreSQL
 ↓
Redis
```

------------------------------------------------------------------------

# PHASE 64 --- FRONTEND CONNECTION

The frontend is:

``` text
GitHub Pages
```

The backend is:

``` text
Render
```

Connection:

``` text
Browser
 ↓ HTTPS
GitHub Pages frontend
 ↓ HTTPS REST
Render FastAPI
 ↓
PostgreSQL / Redis / Agents / Virtual Sensors
 ↓
External Weather Provider
```

The backend must support the frontend's required API contracts.

------------------------------------------------------------------------

# PHASE 65 --- FRONTEND API COMPATIBILITY

Ensure the backend exposes APIs required by the HTML/JS frontend:

``` text
/auth
/farms
/fields
/zones
/sensors
/weather
/agents
/risks
/actions
/tasks
/execution
/simulation
/alerts
/market
/experts
/reports
/admin
```

Return predictable JSON.

Do not require frontend framework-specific behavior.

------------------------------------------------------------------------

# PHASE 66 --- DATA FRESHNESS

Every time-sensitive response should include timestamps.

Example:

``` json
{
  "value": 32.4,
  "unit": "%",
  "source": "virtual_sensor",
  "timestamp": "...",
  "quality": "GOOD"
}
```

Weather:

``` json
{
  "source": "open_meteo",
  "retrieved_at": "...",
  "stale": false
}
```

This allows the frontend to communicate data freshness honestly.

------------------------------------------------------------------------

# PHASE 67 --- NO FAKE LIVE DATA

Never label simulated data as:

``` text
LIVE
REAL SENSOR
PHYSICAL SENSOR
```

Never generate fake weather and label it live.

Never generate fake ML results and label them as a validated model.

All demo components must be clearly identifiable.

------------------------------------------------------------------------

# PHASE 68 --- AGRICULTURAL SAFETY

The platform is decision support.

Do not make unsupported claims.

Do not allow the AI to invent:

-   chemical dosages
-   pesticide application rates
-   fertilizer rates
-   guaranteed yield
-   guaranteed profit
-   guaranteed disease diagnosis

Where uncertainty is high:

``` text
Escalate to expert
```

------------------------------------------------------------------------

# PHASE 69 --- MARKET DATA SAFETY

Market agent should provide:

``` text
current market information
historical trend
market signal
decision-support context
```

Do not guarantee:

``` text
future price
profit
best guaranteed selling time
```

------------------------------------------------------------------------

# PHASE 70 --- PERFORMANCE

Avoid:

-   unbounded telemetry writes
-   excessive agent execution
-   repeated weather requests
-   repeated database queries
-   unnecessary LLM calls

Use:

``` text
caching
batching
controlled polling
indexes
pagination
background jobs
```

Add database indexes for common:

``` text
farm_id
field_id
zone_id
sensor_id
timestamp
status
```

------------------------------------------------------------------------

# PHASE 71 --- DATA RETENTION

Design telemetry storage so it can scale.

Consider:

``` text
raw readings
aggregated readings
historical data
```

Do not keep unlimited high-frequency telemetry without a
retention/aggregation strategy.

For the hackathon, a reasonable retention period may be configured
through environment settings.

------------------------------------------------------------------------

# PHASE 72 --- IDEMPOTENCY

Important operations should avoid accidental duplication.

Examples:

``` text
simulation start
action approval
task completion
execution start
```

Where appropriate, use idempotency keys or state validation.

Example:

``` text
Do not start an irrigation task twice if it is already RUNNING.
```

------------------------------------------------------------------------

# PHASE 73 --- CONCURRENCY

Protect state transitions.

Example:

``` text
Task:
PENDING_APPROVAL

Two approval requests arrive simultaneously.

Only one valid transition should succeed.
```

Use appropriate database transaction handling.

------------------------------------------------------------------------

# PHASE 74 --- FAILURE RECOVERY

The backend must handle:

``` text
weather API failure
LLM failure
database temporary failure
Redis failure
sensor failure
agent failure
image processing failure
execution failure
```

The system should fail gracefully.

Never report success if an operation actually failed.

------------------------------------------------------------------------

# PHASE 75 --- FINAL SYSTEM FLOW

The final backend must implement:

``` text
                 ┌────────────────────┐
                 │   Virtual Sensors  │
                 └─────────┬──────────┘
                           ↓
                 ┌────────────────────┐
                 │    Telemetry       │
                 └─────────┬──────────┘
                           ↓
              ┌──────────────────────────┐
              │       Data Fusion        │
              └────────────┬─────────────┘
                           ↓
          ┌─────────────────────────────────┐
          │          AI AGENT LAYER         │
          │                                 │
          │ Soil | Weather | Irrigation     │
          │ Nutrient | Disease | Market     │
          └────────────────┬────────────────┘
                           ↓
                    ┌─────────────┐
                    │ Risk Engine │
                    └──────┬──────┘
                           ↓
                  ┌────────────────┐
                  │  Orchestrator  │
                  └───────┬────────┘
                          ↓
                  ┌────────────────┐
                  │ Policy Engine  │
                  └───────┬────────┘
                          ↓
                   ┌──────────────┐
                   │ Action Plan   │
                   └──────┬───────┘
                          ↓
                    Approval
                          ↓
                   ┌──────────────┐
                   │  Execution   │
                   └──────┬───────┘
                          ↓
                   New Telemetry
                          ↓
                    Verification
                          ↓
                    Reassessment
```

------------------------------------------------------------------------

# 76. FINAL AUTONOMOUS LOOP

The backend must make this loop possible:

``` text
MONITOR
Virtual Sensors + Weather + Drone + Market
        ↓
ANALYZE
Specialized AI Agents
        ↓
DETECT
Risk Engine
        ↓
DECIDE
Multi-Agent Orchestrator
        ↓
PLAN
Action Plan + Policy + Approval
        ↓
EXECUTE
Virtual Device / Future Physical IoT
        ↓
VERIFY
Telemetry + Outcome
        ↓
MONITOR AGAIN
```

------------------------------------------------------------------------

# 77. NON-NEGOTIABLE ENGINEERING RULES

The backend must NOT:

-   put AI logic in frontend
-   trust frontend approval
-   trust frontend roles
-   expose secrets
-   fabricate live weather
-   label virtual sensors as physical sensors
-   allow LLM direct device control
-   hard-code all decisions into routes
-   store plaintext passwords
-   skip authorization
-   lose action state after restart
-   return fake success
-   rely on Render local disk for permanent files
-   create uncontrolled background loops
-   use one universal agricultural threshold for every crop
-   make guaranteed yield/profit claims

The backend MUST:

-   own all authoritative state
-   support virtual sensors
-   support future physical sensors
-   store telemetry
-   integrate live weather
-   run modular agents
-   provide evidence and confidence
-   detect agent conflicts
-   apply policy/safety checks
-   support approval
-   track task state
-   simulate execution
-   feed execution results back into telemetry
-   reassess risks
-   log important events
-   support expert escalation
-   handle external failures
-   provide stable REST APIs
-   support PostgreSQL/PostGIS
-   support Render deployment
-   provide health/readiness endpoints
-   include tests
-   use migrations
-   enforce user ownership

------------------------------------------------------------------------

# 78. FINAL DEFINITION OF DONE

The backend is complete only when all of the following work:

## Core

-   FastAPI starts
-   PostgreSQL connects
-   migrations work
-   authentication works
-   authorization works

## Farm

-   farms work
-   fields work
-   zones work
-   crops work
-   soil profiles work

## Virtual IoT

-   virtual sensors exist
-   telemetry is generated
-   values are continuous
-   scenarios work
-   sensor failure works
-   readings are persisted

## Weather

-   live weather works
-   forecast works
-   caching works
-   stale state works
-   provider failure works

## AI

-   soil agent works
-   weather agent works
-   irrigation agent works
-   nutrient agent works
-   disease/drone pipeline works
-   market agent works
-   risk agent works
-   orchestrator works

## Decision

-   risks are generated
-   conflicts are detected
-   policies are applied
-   action plans are created
-   approvals work
-   expert escalation works

## Execution

-   tasks work
-   virtual irrigation works
-   execution states persist
-   feedback updates telemetry
-   reassessment works

## Operations

-   alerts work
-   reports work
-   audit logs work
-   structured errors work
-   request IDs work

## Deployment

-   Docker works
-   Render deployment works
-   environment variables work
-   migrations work
-   health check works
-   readiness check works
-   GitHub Pages frontend can connect
-   CORS works

------------------------------------------------------------------------

# 79. PRIMARY HACKATHON DEMONSTRATION

The main demonstration should be:

``` text
1. Open Field Dashboard

2. Select a field

3. Show:
   Farm → Field → Zone → Virtual Sensors

4. Open sensor telemetry

5. Start:
   WATER STRESS SIMULATION

6. Virtual soil moisture decreases

7. Irrigation Agent detects water stress

8. Weather Agent checks forecast

9. Risk Engine calculates risk

10. Orchestrator generates action plan

11. Farmer reviews evidence

12. Farmer approves action

13. Task becomes approved

14. Virtual irrigation starts

15. Execution becomes RUNNING

16. Execution completes

17. Virtual soil moisture increases

18. New telemetry is generated

19. Risk is recalculated

20. System verifies the result

21. Dashboard updates
```

This should demonstrate that KrishiNirnay AI is an **autonomous
closed-loop farm decision and action system**, rather than a static
dashboard.

------------------------------------------------------------------------

# 80. FINAL ENGINEERING PRINCIPLE

Build the backend as a real domain platform.

The virtual sensor system is a **simulation of the future physical IoT
layer**, not a shortcut.

The architecture must therefore remain:

``` text
DATA
 ↓
INTELLIGENCE
 ↓
RISK
 ↓
ORCHESTRATION
 ↓
POLICY
 ↓
ACTION
 ↓
EXECUTION
 ↓
FEEDBACK
 ↓
REASSESSMENT
```

The system should be ready to move from:

``` text
Virtual Sensor
```

to:

``` text
Physical Sensor
```

without rewriting:

``` text
AI Agents
Risk Engine
Orchestrator
Policy Engine
Action Engine
Frontend API contracts
```

The final result must be a **secure, modular, testable, observable,
deployment-ready FastAPI backend** for KrishiNirnay AI.
