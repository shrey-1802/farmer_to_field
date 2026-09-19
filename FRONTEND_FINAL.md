# FRONTEND.md

# KrishiNirnay AI --- Production Frontend Master Prompt

## 0. ROLE

You are a **Senior Frontend Engineer, UI/UX Engineer, Vanilla JavaScript
Architect, Data Visualization Engineer, and GitHub Pages Deployment
Engineer**.

Build the complete production-oriented frontend for:

> **KrishiNirnay AI --- Autonomous Farm-to-Field Advisory & Action
> Orchestration Platform**

The frontend must be built using **only**:

-   HTML5
-   CSS3
-   Vanilla JavaScript (ES6+)

Do **NOT** use:

-   React
-   Vue
-   Angular
-   Svelte
-   TypeScript
-   JSX/TSX
-   Vite
-   Next.js
-   Tailwind CSS
-   Bootstrap
-   jQuery
-   frontend AI/LLM logic
-   client-side database logic

The frontend will be deployed on **GitHub Pages**.

The backend will be a separate **FastAPI application deployed on
Render**.

------------------------------------------------------------------------

# 1. PRODUCT OBJECTIVE

KrishiNirnay AI is an autonomous farm-to-field advisory and action
orchestration system.

The frontend must communicate this complete operational workflow:

``` text
Farm
  ↓
Field
  ↓
Zone
  ↓
Virtual Sensors
  ↓
Data Collection
  ↓
AI Agents
  ↓
Risk Detection
  ↓
Action Planning
  ↓
Approval
  ↓
Execution
  ↓
Feedback
  ↓
Reassessment
```

The frontend is responsible for:

-   displaying farm information
-   displaying field and zone information
-   displaying virtual sensor telemetry
-   displaying live weather returned by the backend
-   displaying drone/image analysis
-   displaying AI-agent outputs
-   displaying detected risks
-   displaying action plans
-   allowing authorized user actions such as approve/reject
-   displaying execution status
-   displaying notifications
-   displaying market information
-   displaying reports
-   providing simulation controls
-   communicating with backend APIs
-   handling loading, errors, offline states, and backend failures

The frontend must **not** make autonomous agricultural decisions itself.

------------------------------------------------------------------------

# 2. CRITICAL VIRTUAL SENSOR REQUIREMENT

Virtual sensors are a **core product feature**, not temporary fake UI
data.

The hackathon environment may not have physical sensors.

Therefore the frontend must support a backend-powered **Virtual IoT
Sensor system**.

The frontend must display virtual sensor data as:

> **SIMULATED --- Virtual IoT**

Never present simulated sensor readings as physical hardware
measurements.

The architecture must allow the backend to later replace:

``` text
Virtual Sensor
```

with:

``` text
ESP32 / Physical Sensor
      ↓
IoT Gateway / MQTT
      ↓
FastAPI Backend
      ↓
Same Sensor API
      ↓
Same Frontend
```

The frontend must not need major changes when physical sensors are
introduced.

------------------------------------------------------------------------

# 3. DATA SOURCE LABELS

Every important data source must have a visible source label.

Supported labels:

``` text
LIVE
SIMULATED
AI GENERATED
MODEL
USER INPUT
CACHED
VIRTUAL IoT
```

Examples:

``` text
Weather:
LIVE — Open-Meteo

Soil Moisture:
SIMULATED — Virtual IoT

Disease Prediction:
MODEL

Farmer Crop Information:
USER INPUT

Weather fallback:
CACHED
```

Never hide the distinction between real and simulated data.

------------------------------------------------------------------------

# 4. VISUAL DESIGN SYSTEM

Use the uploaded KrishiNirnay AI workflow as the primary
information-architecture reference.

The interface should feel like a premium agricultural intelligence
platform.

## Visual direction

Use:

-   clean white/light background
-   agricultural green as primary identity
-   soft pastel cards
-   blue for weather and information
-   purple for AI
-   amber/yellow for risks and actions
-   teal/cyan for execution
-   pink/red for alerts
-   dark navy text
-   subtle borders
-   moderate rounded corners
-   minimal shadows
-   professional charts
-   clear status badges
-   high readability

Do not make the website look like:

-   a generic admin panel
-   a crypto dashboard
-   a gaming interface
-   a generic chatbot
-   an over-animated landing page

The design should communicate:

> **Smart Farming \| Better Decisions \| Higher Yields**

------------------------------------------------------------------------

# 5. PRIMARY INFORMATION ARCHITECTURE

Implement these main sections:

``` text
Home
Field Dashboard
AI Agents
Action Plans
Execution
Market & Insights
Notifications
Profile & Settings
```

Additional sections:

``` text
Field Details
Drone Section
Weather Section
Market Section
Reports
Simulation Center
Admin Panel
```

------------------------------------------------------------------------

# 6. REQUIRED PROJECT STRUCTURE

Use a multi-page HTML architecture.

``` text
frontend/
│
├── index.html
│
├── pages/
│   ├── dashboard.html
│   ├── field-details.html
│   ├── agents.html
│   ├── agent-details.html
│   ├── action-plans.html
│   ├── execution.html
│   ├── market.html
│   ├── notifications.html
│   ├── reports.html
│   ├── simulation.html
│   ├── settings.html
│   └── admin.html
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── illustrations/
│
├── css/
│   ├── variables.css
│   ├── reset.css
│   ├── layout.css
│   ├── components.css
│   ├── dashboard.css
│   ├── field.css
│   ├── agents.css
│   ├── actions.css
│   ├── execution.css
│   ├── market.css
│   ├── notifications.css
│   ├── reports.css
│   ├── settings.css
│   └── responsive.css
│
├── js/
│   ├── config.js
│   ├── api.js
│   ├── auth.js
│   ├── state.js
│   ├── utils.js
│   ├── ui.js
│   ├── charts.js
│   ├── map.js
│   ├── notifications.js
│   ├── dashboard.js
│   ├── fields.js
│   ├── sensors.js
│   ├── agents.js
│   ├── risks.js
│   ├── actions.js
│   ├── execution.js
│   ├── weather.js
│   ├── drone.js
│   ├── market.js
│   ├── reports.js
│   ├── simulation.js
│   └── settings.js
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── .env.example
└── README.md
```

Because GitHub Pages serves static files, use relative paths carefully.

------------------------------------------------------------------------

# 7. PHASE 1 --- BASE HTML ARCHITECTURE

Create semantic HTML5.

Use:

``` html
<header>
<nav>
<main>
<section>
<article>
<aside>
<footer>
```

Avoid unnecessarily deep nested containers.

Every page must have:

-   header
-   navigation
-   page title
-   main content
-   footer/status area where appropriate

Use reusable HTML patterns through JavaScript where appropriate.

------------------------------------------------------------------------

# 8. PHASE 2 --- GLOBAL CSS FOUNDATION

Create CSS variables:

``` css
:root {
    --primary-green: ...;
    --primary-green-dark: ...;
    --navy: ...;
    --text-primary: ...;
    --text-secondary: ...;
    --border: ...;
    --surface: ...;
    --background: ...;

    --success: ...;
    --warning: ...;
    --danger: ...;
    --info: ...;

    --radius-sm: ...;
    --radius-md: ...;
    --radius-lg: ...;

    --shadow-sm: ...;
    --shadow-md: ...;

    --sidebar-width: ...;
}
```

Do not hard-code the same value throughout multiple CSS files.

Create reusable classes for:

-   cards
-   buttons
-   badges
-   status indicators
-   modals
-   dropdowns
-   tabs
-   tables
-   charts
-   empty states
-   loading states
-   error states
-   toast notifications

------------------------------------------------------------------------

# 9. PHASE 3 --- RESPONSIVE APPLICATION SHELL

Build:

## Desktop

Left navigation sidebar.

## Tablet

Compact sidebar.

## Mobile

Bottom navigation or collapsible menu.

Global header:

``` text
KrishiNirnay AI
Current Farm
Current Field
Weather
System Health
Notifications
Profile
```

The header must remain consistent across application pages.

------------------------------------------------------------------------

# 10. PHASE 4 --- HOME / LANDING PAGE

Create a professional homepage.

## Hero

Display:

> KrishiNirnay AI

Subtitle:

> Smart Farming \| Better Decisions \| Higher Yields

Supporting text:

> AI-powered autonomous monitoring, risk detection and farm-to-field
> action orchestration.

CTA buttons:

``` text
Open Field Dashboard
Explore How It Works
```

## Feature sections

Display:

-   Virtual IoT Sensors
-   Live Weather
-   AI Agents
-   Risk Detection
-   Action Planning
-   Virtual Execution
-   Market Intelligence
-   Continuous Monitoring

## Core flow

Visually show:

``` text
1. Monitor
     ↓
2. Analyze
     ↓
3. Detect Risk
     ↓
4. Plan
     ↓
5. Execute
     ↓
6. Monitor Again
```

------------------------------------------------------------------------

# 11. PHASE 5 --- FIELD DASHBOARD

The Field Dashboard is the main operational screen.

## KPI cards

Display:

``` text
Total Farms
Active Fields
Active Risks
Pending Actions
Today's Tasks
Water Stress
Water Saved
System Health
```

Every KPI must come from the backend where applicable.

Do not hard-code production values.

## Quick actions

Provide:

``` text
View Field
View Sensors
Check Weather
Run Simulation
View Risks
Review Actions
```

------------------------------------------------------------------------

# 12. PHASE 6 --- FARM → FIELD → ZONE HIERARCHY

Create a clear drill-down experience:

``` text
Farm
  ↓
Field
  ↓
Zone
  ↓
Virtual Sensors
```

Example:

``` text
Farm A

├── Field 1
│   ├── Zone A
│   │   ├── Soil Moisture
│   │   ├── Soil Temperature
│   │   ├── NPK
│   │   ├── pH
│   │   └── EC
│   │
│   └── Zone B
│
└── Field 2
```

Users must always understand where they are in the hierarchy.

------------------------------------------------------------------------

# 13. PHASE 7 --- FIELD DETAILS PAGE

Display:

-   field name
-   crop
-   crop stage
-   area
-   soil type
-   irrigation type
-   field status
-   map
-   zones
-   sensor summary
-   soil health
-   irrigation status
-   recent images
-   current risks
-   active actions

Provide tabs:

``` text
Overview
Zones
Sensors
Weather
Drone
Risks
Actions
History
```

------------------------------------------------------------------------

# 14. PHASE 8 --- MAP INTERFACE

Use a browser-compatible mapping library only if needed.

Recommended:

-   Leaflet via CDN

Do not expose private API keys.

Map should show:

``` text
Farm boundary
Field boundary
Zone boundaries
Virtual sensor locations
Risk markers
Active tasks
Weather context where supported
```

Clicking a zone should open its details.

Use clear map legends.

------------------------------------------------------------------------

# 15. PHASE 9 --- VIRTUAL SENSOR CENTER

Create a dedicated sensor interface.

Supported sensors:

``` text
Soil Moisture
Soil Temperature
Nitrogen
Phosphorus
Potassium
pH
EC
Air Temperature
Humidity
Rainfall
```

Each sensor card must display:

``` text
Sensor Name
Current Value
Unit
Status
Source
Zone
Last Updated
Trend
Data Quality
```

Example:

``` text
Soil Moisture

32.4 %

Status:
Normal

Source:
SIMULATED — Virtual IoT

Zone:
Field 1 / Zone A

Updated:
15 seconds ago

Trend:
↓ Decreasing
```

------------------------------------------------------------------------

# 16. PHASE 10 --- SENSOR TELEMETRY CHARTS

Create interactive charts for:

``` text
Soil Moisture
Temperature
Humidity
NPK
pH
EC
Rainfall
```

Time ranges:

``` text
1 Hour
6 Hours
24 Hours
7 Days
30 Days
```

Display:

-   current
-   minimum
-   maximum
-   average
-   trend
-   last updated

Use Chart.js or another lightweight browser-compatible chart library
through CDN if desired.

Do not generate sensor values in JavaScript.

Fetch them from the backend.

------------------------------------------------------------------------

# 17. PHASE 11 --- SENSOR STATUS

Statuses:

``` text
ONLINE
STALE
OFFLINE
ERROR
SIMULATED
```

A simulated sensor should clearly display:

``` text
SIMULATED
```

A physical sensor should display:

``` text
PHYSICAL IoT
```

The frontend should simply render the backend source.

------------------------------------------------------------------------

# 18. PHASE 12 --- AI AGENTS PAGE

Create an AI Agent monitoring dashboard.

Agents:

``` text
Soil Agent
Weather Agent
Irrigation Agent
Nutrient Agent
Drone/Disease Agent
Market Agent
Risk Detection Agent
Farm Context Agent
Orchestrator
```

Each agent card:

``` text
Agent Name
Status
Last Run
Current Risk
Confidence
Latest Recommendation
```

Statuses:

``` text
IDLE
RUNNING
COMPLETED
WARNING
FAILED
```

------------------------------------------------------------------------

# 19. PHASE 13 --- AGENT DETAIL PAGE

Display:

``` text
Agent
Purpose
Status
Last Execution
Execution Duration
Input Data
Output
Confidence
Evidence
Detected Risks
Recommendation
Execution History
```

Create a timeline:

``` text
08:31 Soil Agent completed
08:32 Weather Agent completed
08:32 Irrigation Agent completed
08:33 Risk Agent completed
08:33 Orchestrator generated action plan
```

------------------------------------------------------------------------

# 20. PHASE 14 --- WEATHER SECTION

Display:

## Current Weather

``` text
Temperature
Humidity
Rain
Rain Probability
Wind Speed
Wind Direction
Cloud Cover
```

## Forecast

Provide:

``` text
Hourly
Daily
Agricultural suitability
```

Display the source:

``` text
LIVE — Open-Meteo
```

If backend returns cached data:

``` text
CACHED — Weather provider unavailable
```

Never fabricate live weather.

------------------------------------------------------------------------

# 21. PHASE 15 --- DRONE SECTION

Create:

``` text
Upload Image
Latest Image
Historical Images
Analysis Results
Detected Issues
Affected Area
Confidence
Schedule Next Scan
```

Image analysis results must come from the backend.

Example:

``` text
Disease Risk
HIGH

Confidence
87%

Affected Area
14%

Source
MODEL
```

If the backend uses demo inference, show:

``` text
DEMO MODEL
```

Do not label demo inference as a validated production model.

------------------------------------------------------------------------

# 22. PHASE 16 --- RISK CENTER

Display:

``` text
Water Stress
Disease Risk
Nutrient Deficiency
Heat Stress
Heavy Rain
Sensor Failure
Market Signal
```

Every risk should show:

``` text
Risk Type
Score
Severity
Confidence
Farm
Field
Zone
Evidence
Detected At
Recommended Response
```

Severity:

``` text
LOW
MEDIUM
HIGH
CRITICAL
```

Use color consistently but also include text so the interface is
accessible without color.

------------------------------------------------------------------------

# 23. PHASE 17 --- ACTION PLANS

Create an Action Plan page.

Every plan should display:

``` text
Action
Reason
Affected Farm
Affected Field
Affected Zone
Scheduled Time
Priority
Estimated Cost
Confidence
Evidence
Safety Status
Approval Status
```

Possible approval states:

``` text
PENDING
APPROVED
REJECTED
EXPERT_REVIEW
```

Buttons:

``` text
Approve
Reject
Request Expert Review
View Details
```

The frontend only sends the user's requested action.

The backend must verify authorization and policy.

------------------------------------------------------------------------

# 24. PHASE 18 --- EXECUTION CENTER

Display:

``` text
Ongoing Actions
Completed Actions
Failed Actions
Virtual Device Status
Manual Override
```

Virtual irrigation states:

``` text
OFF
STARTING
RUNNING
PAUSED
COMPLETED
FAILED
```

Display:

``` text
VIRTUAL EXECUTION
```

until physical hardware is connected.

Buttons:

``` text
Start
Pause
Stop
View Status
```

Do not directly control hardware from browser JavaScript.

------------------------------------------------------------------------

# 25. PHASE 19 --- EXECUTION FEEDBACK

When an action is completed, display:

``` text
Action completed
↓
Execution result
↓
Sensor values updated
↓
Risk recalculated
↓
Agent reassessment
↓
Verification result
```

Show this as a timeline.

This visually demonstrates the autonomous feedback loop.

------------------------------------------------------------------------

# 26. PHASE 20 --- MARKET & INSIGHTS

Create:

``` text
Live Market Prices
Price Trends
Market Alerts
Crop-wise Analysis
Best Selling Window
Mandi Information
```

Use charts for historical prices.

Always distinguish:

``` text
LIVE
CACHED
SIMULATED
```

Avoid wording that implies guaranteed prices or guaranteed profits.

Use:

> Market signal

> Decision support

where appropriate.

------------------------------------------------------------------------

# 27. PHASE 21 --- NOTIFICATIONS

Notification categories:

``` text
System Alerts
Weather Alerts
Risk Alerts
Action Updates
Sensor Alerts
Expert Messages
Market Alerts
```

Each notification:

``` text
Title
Description
Severity
Timestamp
Related Field
Related Action
Read/Unread
```

Actions:

``` text
Mark Read
Acknowledge
View Related Item
```

------------------------------------------------------------------------

# 28. PHASE 22 --- REPORTS

Create:

``` text
Field Performance
Yield Estimation
Risk Summary
Action Effectiveness
Water Usage
Sensor History
AI Agent Activity
Market Analysis
```

Each report page should support:

``` text
View
Filter
Date Range
Field Filter
Download
Print
Share
```

For static GitHub Pages, downloads should be generated client-side only
from data already received from the backend.

Do not expose backend secrets.

------------------------------------------------------------------------

# 29. PHASE 23 --- SIMULATION CENTER

This page is essential for the online hackathon.

Create controls:

``` text
Simulate Water Stress
Simulate Disease Risk
Simulate Nutrient Deficiency
Simulate Heavy Rain
Simulate Heat Wave
Simulate Sensor Failure
Reset Simulation
```

When the user selects a scenario:

``` text
Frontend
  ↓
POST /api/simulation/...
  ↓
Backend changes virtual farm state
  ↓
Virtual telemetry changes
  ↓
Agents process new data
  ↓
Risk is detected
  ↓
Action plan is generated
  ↓
Frontend refreshes
```

Do not simulate the scenario only inside the browser.

The backend must be the source of truth.

------------------------------------------------------------------------

# 30. PHASE 24 --- SIMULATION STATUS

Show:

``` text
Simulation Mode
Current Scenario
Started At
Affected Fields
Affected Sensors
Agent Status
Generated Risks
Generated Actions
```

Use a strong visual label:

> DEMO / SIMULATION MODE

This prevents judges/users from confusing simulated IoT with physical
IoT.

------------------------------------------------------------------------

# 31. PHASE 25 --- PROFILE & SETTINGS

Create:

``` text
Profile Details
Farm Management
Field Management
Device Settings
Notification Preferences
Language
Account Settings
Logout
```

Device settings must display:

``` text
Virtual Sensor
Physical Sensor
Offline
Online
Error
```

------------------------------------------------------------------------

# 32. PHASE 26 --- ADMIN PANEL

If the authenticated user has admin privileges, show:

``` text
Manage Users
Manage Farms
Manage Fields
Sensor Status
System Logs
Agent Activity
System Settings
```

Do not show Admin Panel to unauthorized users.

Backend authorization is authoritative.

------------------------------------------------------------------------

# 33. PHASE 27 --- JAVASCRIPT ARCHITECTURE

Use modular ES6 JavaScript.

Example:

``` text
js/
├── config.js
├── api.js
├── auth.js
├── state.js
├── ui.js
├── utils.js
├── charts.js
├── map.js
├── dashboard.js
├── fields.js
├── sensors.js
├── agents.js
├── risks.js
├── actions.js
├── execution.js
├── weather.js
├── drone.js
├── market.js
├── reports.js
├── simulation.js
└── settings.js
```

Use:

``` javascript
import ...
export ...
```

where browser module support is appropriate.

Avoid one giant `script.js`.

------------------------------------------------------------------------

# 34. PHASE 28 --- API SERVICE LAYER

Create one centralized API layer.

Example:

``` javascript
async function apiRequest(endpoint, options = {}) {
    // base URL
    // authentication
    // request headers
    // timeout
    // response parsing
    // standardized error handling
}
```

Then create domain functions:

``` text
getFarms()
getFields()
getSensors()
getSensorReadings()
getWeather()
getAgents()
getRisks()
getActions()
approveAction()
rejectAction()
getTasks()
startExecution()
stopExecution()
getNotifications()
runSimulation()
```

Do not scatter raw `fetch()` calls across every page.

------------------------------------------------------------------------

# 35. PHASE 29 --- API BASE URL

Use a single configuration value.

Example:

``` javascript
const API_BASE_URL =
    window.APP_CONFIG?.API_BASE_URL ||
    "http://localhost:8000/api";
```

For production configure:

``` text
https://YOUR-BACKEND.onrender.com/api
```

Do not hard-code the Render URL into dozens of files.

------------------------------------------------------------------------

# 36. PHASE 30 --- REQUIRED API CONTRACTS

Frontend should be prepared for:

## Authentication

``` http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Farms

``` http
GET /api/farms
GET /api/farms/{id}
POST /api/farms
```

## Fields

``` http
GET /api/fields
GET /api/fields/{id}
POST /api/fields
```

## Sensors

``` http
GET /api/sensors
POST /api/sensors
GET /api/sensors/{id}
GET /api/sensors/{id}/readings
GET /api/zones/{id}/sensors
```

## Weather

``` http
GET /api/weather/current
GET /api/weather/forecast
GET /api/weather/hourly
GET /api/weather/farm/{farm_id}
```

## Agents

``` http
GET /api/agents
GET /api/agents/{id}
GET /api/agents/{id}/runs
```

## Risks

``` http
GET /api/risks
GET /api/risks/{id}
```

## Actions

``` http
GET  /api/actions
GET  /api/actions/{id}
POST /api/actions/{id}/approve
POST /api/actions/{id}/reject
POST /api/actions/{id}/expert-review
```

## Tasks

``` http
GET /api/tasks
GET /api/tasks/{id}
POST /api/tasks/{id}/start
POST /api/tasks/{id}/complete
POST /api/tasks/{id}/fail
```

## Execution

``` http
POST /api/execution/irrigation/start
POST /api/execution/irrigation/pause
POST /api/execution/irrigation/stop
GET  /api/execution/irrigation/{id}
```

## Simulation

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

## Alerts

``` http
GET /api/alerts
POST /api/alerts/{id}/acknowledge
```

------------------------------------------------------------------------

# 37. PHASE 31 --- ERROR HANDLING

Handle:

``` text
400
401
403
404
408
409
422
429
500
502
503
```

Standard backend error:

``` json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Readable error message",
    "request_id": "..."
  }
}
```

Show user-friendly messages.

Never expose stack traces.

------------------------------------------------------------------------

# 38. PHASE 32 --- RENDER SLEEP / BACKEND WAKE-UP

Render may take time to wake up.

If request fails because the backend is unavailable, display:

> Backend is waking up. Please try again in a few seconds.

Provide:

``` text
Retry
```

Do not silently replace failed API calls with fake production data.

------------------------------------------------------------------------

# 39. PHASE 33 --- LOADING / EMPTY / ERROR STATES

Every data-driven section must have:

### Loading

Skeleton or spinner.

### Empty

Example:

> No active risks found for this field.

### Error

Example:

> Unable to load sensor data.

### Retry

Button:

> Try Again

### Offline

Example:

> Connection unavailable. Showing previously cached interface data where
> available.

------------------------------------------------------------------------

# 40. PHASE 34 --- AUTHENTICATION

Store authentication securely according to the backend's chosen
mechanism.

Do not store passwords.

Do not expose JWT secrets.

Do not put authentication logic in HTML.

Pages requiring authentication must check the current session.

If unauthenticated:

``` text
redirect → login
```

------------------------------------------------------------------------

# 41. PHASE 35 --- SECURITY

Frontend security requirements:

-   never expose API keys
-   never expose database credentials
-   never expose LLM keys
-   never expose JWT signing secrets
-   validate user input
-   escape dynamically inserted HTML
-   avoid unsafe `innerHTML`
-   sanitize uploaded file metadata
-   never trust frontend role information
-   never trust frontend approval state
-   never perform privileged operations without backend authorization

Use `textContent` for ordinary dynamic text whenever possible.

------------------------------------------------------------------------

# 42. PHASE 36 --- ACCESSIBILITY

Implement:

-   semantic HTML
-   keyboard navigation
-   visible focus states
-   accessible buttons
-   labels for inputs
-   ARIA only when necessary
-   sufficient contrast
-   chart descriptions
-   non-color status indicators
-   responsive text sizing

All major functionality must be usable without a mouse.

------------------------------------------------------------------------

# 43. PHASE 37 --- PERFORMANCE

Optimize for GitHub Pages.

Requirements:

-   no unnecessary frameworks
-   lazy-load heavy pages where practical
-   defer non-critical scripts
-   compress images
-   use modern image formats
-   avoid huge JavaScript bundles
-   avoid unnecessary polling
-   debounce filters/search
-   clean event listeners
-   avoid repeated API requests
-   cache safe read-only responses where appropriate

Use polling only where needed, such as:

``` text
simulation status
execution status
agent status
```

Use reasonable intervals and stop polling when the page is hidden or the
task completes.

------------------------------------------------------------------------

# 44. PHASE 38 --- DATA REFRESH STRATEGY

Use backend data as the source of truth.

Examples:

``` text
Dashboard:
periodic refresh

Sensor readings:
periodic refresh

Execution:
short polling while active

Notifications:
periodic refresh

Weather:
refresh according to backend freshness

Simulation:
refresh after scenario execution
```

Do not continuously refresh every API.

------------------------------------------------------------------------

# 45. PHASE 39 --- CHART DESIGN

Charts should be:

-   readable
-   responsive
-   labeled
-   unit-aware
-   time-aware
-   accessible

Example:

``` text
Soil Moisture (%)
|
|      ╲
|       ╲
|        ╲
|_________╲________ Time
```

For sensor charts, display source:

``` text
SIMULATED — Virtual IoT
```

------------------------------------------------------------------------

# 46. PHASE 40 --- UI FEEDBACK

Every user action should provide feedback.

Examples:

``` text
Action approved
Action rejected
Expert review requested
Simulation started
Simulation completed
Irrigation started
Irrigation paused
Notification acknowledged
```

Use toast notifications plus persistent state updates where appropriate.

------------------------------------------------------------------------

# 47. PHASE 41 --- NO FAKE BACKEND LOGIC

This is mandatory.

Do not create JavaScript like:

``` javascript
if (waterStress) {
    risk = 90;
}
```

unless it is purely a UI demonstration fallback explicitly marked as
demo-only.

Production UI must receive risk values from:

``` text
FastAPI backend
```

Likewise:

-   no frontend AI agent
-   no frontend risk engine
-   no frontend irrigation decision engine
-   no frontend fake weather engine
-   no frontend fake sensor engine

------------------------------------------------------------------------

# 48. PHASE 42 --- DEMO MODE

A demo mode is allowed only when explicitly enabled.

Example:

``` text
VITE_ENABLE_DEMO_MODE=true
```

For plain HTML/JS, configure this through:

``` javascript
window.APP_CONFIG = {
    API_BASE_URL: "...",
    ENABLE_DEMO_MODE: true
};
```

Demo mode must be visually labeled.

Use:

> DEMO MODE

or:

> SIMULATION MODE

Do not make demo data appear to be real production data.

------------------------------------------------------------------------

# 49. PHASE 43 --- END-TO-END WATER STRESS DEMO

The frontend must make this sequence easy to demonstrate:

``` text
Open Simulation Center
        ↓
Click "Water Stress"
        ↓
Backend simulation starts
        ↓
Virtual soil moisture decreases
        ↓
Sensor dashboard refreshes
        ↓
Irrigation Agent detects stress
        ↓
Weather Agent checks weather
        ↓
Risk appears
        ↓
Action Plan appears
        ↓
Farmer opens action
        ↓
Farmer approves
        ↓
Execution starts
        ↓
Virtual irrigation runs
        ↓
Execution completes
        ↓
Sensor value changes
        ↓
Risk is reassessed
```

This should be the primary hackathon demo flow.

------------------------------------------------------------------------

# 50. PHASE 44 --- HEAVY RAIN DEMO

Demonstrate:

``` text
Heavy Rain Simulation
        ↓
Rain conditions change
        ↓
Weather data updates
        ↓
Irrigation recommendation conflicts
        ↓
Orchestrator changes action
        ↓
Action is delayed
        ↓
Weather alert displayed
```

Frontend should show the explanation returned by the backend.

------------------------------------------------------------------------

# 51. PHASE 45 --- DISEASE DEMO

Demonstrate:

``` text
Upload Image
        ↓
Backend Image Analysis
        ↓
Disease Result
        ↓
Weather Correlation
        ↓
Risk
        ↓
Recommendation
        ↓
Approval / Expert Review
```

Display model confidence and evidence.

Do not fabricate model output in the browser.

------------------------------------------------------------------------

# 52. PHASE 46 --- CONTINUOUS MONITORING VISUALIZATION

Create a visible autonomous-loop component:

``` text
MONITOR
  ↓
ANALYZE
  ↓
DETECT
  ↓
PLAN
  ↓
EXECUTE
  ↓
VERIFY
  ↓
MONITOR AGAIN
```

The active step should update based on backend state where possible.

This should be visually prominent on the dashboard.

------------------------------------------------------------------------

# 53. PHASE 47 --- STATE MANAGEMENT

Do not introduce a frontend state-management framework.

Create a lightweight state module:

``` javascript
const AppState = {
    currentUser: null,
    currentFarm: null,
    currentField: null,
    currentZone: null,
    simulationMode: false,
    selectedSensor: null,
    notifications: []
};
```

Use custom events or simple functions for UI updates.

Avoid creating a complex custom framework.

------------------------------------------------------------------------

# 54. PHASE 48 --- URL / PAGE STATE

Use query parameters where useful.

Examples:

``` text
field-details.html?field=123
agent-details.html?id=soil-agent
action-plans.html?action=456
execution.html?task=789
```

Validate IDs before sending API requests.

------------------------------------------------------------------------

# 55. PHASE 49 --- GITHUB PAGES COMPATIBILITY

The application must work as a static website.

Requirements:

-   relative asset paths
-   no server-side rendering
-   no Node runtime in production
-   no backend code inside frontend
-   no dependency on localhost
-   no absolute filesystem paths
-   no framework-specific server configuration

Use:

``` text
GitHub Pages
      ↓
Static HTML
Static CSS
Vanilla JavaScript
      ↓
HTTPS FastAPI API
      ↓
Render
```

------------------------------------------------------------------------

# 56. PHASE 50 --- DEPLOYMENT WORKFLOW

Create:

``` text
.github/workflows/deploy.yml
```

Pipeline:

``` text
Checkout
↓
Validate files
↓
Run frontend checks
↓
Deploy to GitHub Pages
```

If no package manager is required, keep the workflow simple.

Do not introduce Node tooling merely for the sake of tooling.

------------------------------------------------------------------------

# 57. PHASE 51 --- CONFIGURATION

Create a safe production configuration strategy.

Example:

``` javascript
window.APP_CONFIG = {
    API_BASE_URL: "https://YOUR-BACKEND.onrender.com/api",
    APP_NAME: "KrishiNirnay AI",
    ENABLE_DEMO_MODE: false
};
```

For local development:

``` javascript
window.APP_CONFIG = {
    API_BASE_URL: "http://localhost:8000/api",
    APP_NAME: "KrishiNirnay AI",
    ENABLE_DEMO_MODE: true
};
```

Do not commit secrets.

The backend URL is not a secret.

------------------------------------------------------------------------

# 58. PHASE 52 --- CODE QUALITY

Follow:

-   meaningful variable names
-   small reusable functions
-   modular files
-   comments only where useful
-   no duplicated API logic
-   no duplicated UI logic
-   no dead code
-   no unused files
-   no console spam
-   no magic constants where configuration is appropriate

Use strict JavaScript patterns where practical.

------------------------------------------------------------------------

# 59. PHASE 53 --- CROSS-BROWSER SUPPORT

Test:

-   Chrome
-   Edge
-   Firefox

The application must work on current desktop browsers and common mobile
browsers.

------------------------------------------------------------------------

# 60. PHASE 54 --- FINAL TESTING

Test every page:

``` text
Home
Dashboard
Field Details
Sensors
AI Agents
Agent Details
Risks
Action Plans
Execution
Weather
Drone
Market
Notifications
Reports
Simulation
Settings
Admin
```

Test:

``` text
Login
Logout
API unavailable
Empty data
Slow API
Invalid data
Unauthorized access
Simulation
Action approval
Execution
Mobile layout
Desktop layout
```

------------------------------------------------------------------------

# 61. PHASE 55 --- PRODUCTION ACCEPTANCE TEST

The frontend is complete only if:

### Architecture

-   HTML/CSS/Vanilla JS only
-   modular JavaScript
-   no TypeScript
-   no React
-   no unnecessary framework

### UI

-   premium agricultural design
-   responsive
-   accessible
-   consistent navigation
-   clear statuses

### Virtual IoT

-   sensors displayed
-   telemetry charts work
-   simulation works
-   source labels are visible
-   simulated data is never presented as physical data

### AI

-   agent outputs display correctly
-   confidence and evidence display
-   no AI logic hidden in frontend

### Weather

-   live backend weather displays
-   cached weather displays correctly
-   provider failures are handled

### Actions

-   risks display
-   action plans display
-   approval works
-   execution status works
-   feedback is visible

### Deployment

-   GitHub Pages build/deployment works
-   Render backend URL is configurable
-   HTTPS API works
-   CORS is compatible
-   no secrets exist in frontend

------------------------------------------------------------------------

# 62. FINAL ARCHITECTURE

The final frontend architecture must be:

``` text
                    KRISHINIRNAY AI
                           │
                           ▼
                  ┌─────────────────┐
                  │ HTML / CSS / JS │
                  └────────┬────────┘
                           │
                 HTTPS REST API
                           │
                           ▼
                  ┌─────────────────┐
                  │ FastAPI Backend │
                  └────────┬────────┘
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
Virtual Sensors       Live Weather        AI Agents
       │                   │                   │
       └───────────────────┼───────────────────┘
                           ▼
                     Risk Engine
                           ▼
                     Orchestrator
                           ▼
                     Action Plan
                           ▼
                       Approval
                           ▼
                       Execution
                           ▼
                    New Telemetry
                           ▼
                     Reassessment
```

------------------------------------------------------------------------

# 63. CORE UI WORKFLOW

The main interface must communicate:

``` text
FARM
  ↓
FIELD
  ↓
ZONE
  ↓
VIRTUAL SENSORS
  ↓
DATA COLLECTION
  ↓
AI AGENTS
  ↓
RISK DETECTION
  ↓
ACTION PLAN
  ↓
EXECUTION
  ↓
FEEDBACK
  ↓
MONITOR AGAIN
```

------------------------------------------------------------------------

# 64. MOST IMPORTANT ENGINEERING RULE

Do not build a collection of disconnected dashboard screens.

Build a frontend that represents one connected system.

For example:

``` text
A virtual sensor changes
        ↓
The dashboard reflects the change
        ↓
The agent result changes
        ↓
The risk changes
        ↓
The action plan changes
        ↓
The execution state changes
        ↓
The sensor value changes again
        ↓
The dashboard reflects the new state
```

The UI must make this relationship obvious to the farmer and to
hackathon judges.

------------------------------------------------------------------------

# 65. FINAL DELIVERABLE

Produce a complete GitHub Pages-ready frontend containing:

``` text
index.html
pages/*.html
css/*.css
js/*.js
assets/*
.github/workflows/deploy.yml
README.md
.env.example
```

The final application must be:

-   responsive
-   accessible
-   modular
-   API-driven
-   production-oriented
-   GitHub Pages compatible
-   FastAPI compatible
-   virtual-sensor ready
-   physical-IoT migration ready
-   simulation ready
-   hackathon-demo ready

The frontend should clearly demonstrate the product vision:

> **KrishiNirnay AI continuously monitors farm conditions, combines
> virtual sensor and external data, presents multi-agent intelligence,
> detects risks, supports safe action planning, tracks execution, and
> feeds results back into continuous monitoring.**

## NON-NEGOTIABLE RULE

**HTML + CSS + Vanilla JavaScript only.**

The frontend must remain a presentation, interaction, and
API-consumption layer.

All authoritative:

-   AI decisions
-   risk calculations
-   sensor simulation
-   weather retrieval
-   action decisions
-   approval validation
-   execution state
-   database operations
-   security checks

belong to the FastAPI backend.


---

# 66. FINAL PRODUCT UI OVERRIDES — FARMER OTP LOGIN + GREEN/WHITE DESIGN + THEME SYSTEM

This section is authoritative for the final implementation wherever it conflicts with an earlier generic frontend instruction.

## 66.1 Farmer-first authentication

The application is designed primarily for farmers. The first screen shown to an unauthenticated user must be a simple, mobile-friendly **Farmer Login** screen.

Authentication must use **OTP-based login** rather than a password-first login.

### Login flow

```text
Open KrishiNirnay AI
        ↓
Farmer Login
        ↓
Enter Mobile Number
        ↓
Send OTP
        ↓
OTP Verification
        ↓
Successful Verification
        ↓
Create/Restore Authenticated Session
        ↓
Open Farmer Dashboard
```

The frontend must never generate, validate, or guess an OTP.

The backend is the authoritative source for:

- OTP generation
- OTP delivery
- OTP verification
- OTP expiry
- retry/cooldown rules
- maximum verification attempts
- session creation
- refresh/revocation
- account status
- rate limiting

The frontend only collects the mobile number and OTP, sends them to the API, and renders the backend response.

### Required authentication pages

Add:

```text
pages/
├── login.html
├── verify-otp.html
└── onboarding.html
```

`index.html` must determine whether the user has a valid authenticated session. Unauthenticated users go to `login.html`; authenticated users go to `pages/dashboard.html`.

---

## 66.2 Farmer Login UI

The login page must feel trustworthy, simple, rural-friendly, modern, and premium without looking like a banking, crypto, or generic enterprise login page.

### Primary visual composition

Desktop:

```text
┌──────────────────────────────────────────────────────────────┐
│                         KRISHINIRNAY AI                      │
│                                                              │
│      ┌──────────────────────┐   ┌────────────────────────┐  │
│      │                      │   │  Welcome, Farmer       │  │
│      │  Agriculture visual  │   │                        │  │
│      │  / field illustration│   │  Login with mobile     │  │
│      │                      │   │  number + OTP          │  │
│      │  Smart farming       │   │                        │  │
│      │  Better decisions    │   │  +91 [___________]     │  │
│      │  Higher yields       │   │                        │  │
│      │                      │   │  [ Send OTP ]          │  │
│      └──────────────────────┘   └────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

Mobile:

```text
Logo
Welcome, Farmer
Short supporting message
Mobile number
Send OTP
Help / privacy text
```

Do not overload the login screen with dashboard information.

### Farmer-friendly copy

Use clear language such as:

- `Welcome, Farmer`
- `Login to your farm`
- `Enter your mobile number`
- `We'll send a one-time password to verify your number`
- `Send OTP`
- `Enter the 6-digit OTP`
- `Verify & Continue`
- `Didn't receive the OTP?`
- `Resend OTP`
- `Change mobile number`

Avoid unnecessary technical terminology such as JWT, API, session token, backend, OAuth, or authentication provider.

---

## 66.3 Mobile number input

Requirements:

- Country code must be supported.
- Default country may be India for the primary farmer experience.
- Display `+91` clearly when India is selected.
- Accept only valid numeric mobile input according to backend rules.
- Prevent accidental alphabetic input.
- Provide inline validation.
- Do not expose raw backend validation errors directly to farmers.
- Do not store the OTP in localStorage.
- Do not log the mobile number or OTP to the browser console.

Example:

```text
Mobile Number

+91  [ 98765 43210 ]

[ Send OTP ]
```

The exact validation rules must remain aligned with the backend API.

---

## 66.4 OTP verification UI

The verification screen must clearly show:

```text
Verify your mobile number

OTP sent to
+91 XXXXX XXXXX

[ _ ] [ _ ] [ _ ] [ _ ] [ _ ] [ _ ]

[ Verify & Continue ]

Didn't receive the OTP?
[ Resend OTP ]

[ Change mobile number ]
```

### OTP UX

Implement:

- six-digit OTP UI if the backend uses six digits
- automatic focus movement
- backspace navigation
- paste support
- keyboard-friendly input
- mobile numeric keyboard
- countdown based on backend-provided retry/cooldown information
- clear verification state
- loading state
- error state
- success transition

Do not assume a fixed OTP expiry or resend interval in frontend business logic if the backend provides those values.

Never display the actual OTP in the UI except what the farmer personally enters.

Never use a fake OTP such as `123456` in production mode.

---

## 66.5 OTP API contract

Prepare the centralized API layer for endpoints equivalent to:

```http
POST /api/auth/otp/request
POST /api/auth/otp/verify
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/refresh
```

Example request:

```json
{
  "phone": "+919876543210"
}
```

Example verification request:

```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

The exact payload and endpoint names must be configurable so the frontend can adapt to the FastAPI implementation without changing every page.

Possible backend response fields:

```json
{
  "success": true,
  "message": "OTP verified",
  "session": {
    "access_token": "...",
    "expires_at": "..."
  },
  "user": {
    "id": "farmer_123",
    "name": "Farmer Name",
    "role": "farmer"
  }
}
```

If the backend uses secure HTTP-only cookies instead of exposing an access token to JavaScript, the frontend must support that architecture and must not attempt to extract or persist the cookie.

### OTP error states

Map backend errors into friendly messages:

```text
INVALID_PHONE
OTP_EXPIRED
INVALID_OTP
TOO_MANY_ATTEMPTS
OTP_COOLDOWN
RATE_LIMITED
ACCOUNT_BLOCKED
SERVER_ERROR
NETWORK_ERROR
```

Examples:

```text
The OTP has expired. Please request a new OTP.

That OTP is not correct. Please check and try again.

Too many attempts. Please wait before trying again.

We couldn't send the OTP right now. Please try again.
```

Never reveal security-sensitive details that help enumerate accounts.

---

# 67. FINAL GREEN + WHITE DESIGN SYSTEM

The primary brand identity must be **green and white**.

The visual system should feel:

```text
Fresh
Agricultural
Trustworthy
Calm
Readable
Modern
Professional
Farmer-friendly
```

## 67.1 Color tokens

Define all colors centrally in `css/variables.css`.

Recommended light theme foundation:

```css
:root {
    --color-primary-50: #F0FDF4;
    --color-primary-100: #DCFCE7;
    --color-primary-200: #BBF7D0;
    --color-primary-300: #86EFAC;
    --color-primary-400: #4ADE80;
    --color-primary-500: #22C55E;
    --color-primary-600: #16A34A;
    --color-primary-700: #15803D;
    --color-primary-800: #166534;
    --color-primary-900: #14532D;

    --color-background: #F7FBF8;
    --color-surface: #FFFFFF;
    --color-surface-soft: #F0FDF4;

    --color-text-primary: #163020;
    --color-text-secondary: #52705C;
    --color-text-muted: #718278;

    --color-border: #DCE9DF;
    --color-border-strong: #C5D8C9;

    --color-success: #16A34A;
    --color-warning: #D97706;
    --color-danger: #DC2626;
    --color-info: #2563EB;

    --color-overlay: rgba(20, 83, 45, 0.45);
}
```

These are design starting points. Keep the tokens centralized so the visual palette can be adjusted without editing individual components.

## 67.2 Green usage rules

Use green for:

- primary CTA buttons
- active navigation
- selected controls
- success states
- farm/field identity
- important positive metrics
- progress indicators
- brand accents

Do not make every element green.

Use white and very light green surfaces to create visual hierarchy.

Use red, amber, blue, and purple only for semantic categories already defined by the product.

---

# 68. LIGHT MODE AND DARK MODE

Add a complete theme system under:

```text
Settings
  ↓
Appearance
  ↓
Theme
  ├── Light
  ├── Dark
  └── System
```

The setting must be visible inside the Settings page.

## 68.1 Theme options

Display three options:

```text
☀ Light
Use the bright agricultural theme.

◐ Dark
Use the dark low-light theme.

⌘ System
Follow the device/browser preference.
```

The actual icons can use the project's icon system.

## 68.2 Theme behavior

Requirements:

- Default to `system` for a new user unless the product/backend specifies another default.
- Persist the selected theme locally as a UI preference.
- Apply the theme before the main UI paints where practical to reduce flash of incorrect theme.
- Respect `prefers-color-scheme` when System is selected.
- Do not reload the page just to change theme.
- Theme changes must be instant.
- Charts must update their text/grid/surface styling when the theme changes.
- Maps should remain readable in both modes.
- Modals, dropdowns, tooltips, tables, forms, badges, and navigation must all support both themes.
- Maintain accessible contrast in both themes.

## 68.3 Dark theme tokens

Create a dark theme using the same semantic token names.

Example:

```css
[data-theme="dark"] {
    --color-background: #07130B;
    --color-surface: #0D1B12;
    --color-surface-soft: #102619;

    --color-text-primary: #ECFDF3;
    --color-text-secondary: #B7D1BE;
    --color-text-muted: #89A293;

    --color-border: #23422D;
    --color-border-strong: #31583D;

    --color-primary-400: #4ADE80;
    --color-primary-500: #22C55E;
    --color-primary-600: #16A34A;
}
```

Do not simply invert colors.

The dark theme must be deliberately designed for readability.

Avoid pure black backgrounds where possible; use deep green-black surfaces.

---

# 69. SETTINGS PAGE — FINAL STRUCTURE

The Settings page must be redesigned as:

```text
Settings
│
├── Profile
│
├── Farm Preferences
│
├── Appearance
│   ├── Theme
│   │   ├── Light
│   │   ├── Dark
│   │   └── System
│   ├── Compact Mode
│   └── Reduced Motion
│
├── Language
│
├── Notifications
│
├── Device Preferences
│
├── Privacy & Security
│
├── Help & Support
│
└── Logout
```

## 69.1 Appearance card

Make Appearance a prominent settings card:

```text
Appearance

Theme
Choose how KrishiNirnay AI looks on your device.

[ Light ] [ Dark ] [ System ]

Preview
┌──────────────────────────────┐
│  Dashboard preview           │
│  Field        Healthy        │
│  Soil Moisture     42%       │
└──────────────────────────────┘
```

The preview should use the actual design tokens where practical.

## 69.2 Reduced motion

Provide:

```text
Reduced Motion
[ On / Off ]
```

Respect:

```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}
```

Do not remove important status information when animations are disabled.

---

# 70. FINAL FARMER APPLICATION SHELL

After OTP authentication, use this primary navigation:

```text
┌──────────────────────────────────────────────┐
│ KrishiNirnay AI       Weather  Alerts  User │
├──────────────┬───────────────────────────────┤
│ Home         │                               │
│ My Farm      │        Main Content           │
│ Fields       │                               │
│ Sensors      │                               │
│ AI Insights  │                               │
│ Risks        │                               │
│ Actions      │                               │
│ Execution    │                               │
│ Market       │                               │
│ Reports      │                               │
│ Simulation   │                               │
│ Settings     │                               │
└──────────────┴───────────────────────────────┘
```

For mobile:

```text
┌─────────────────────────────┐
│ KrishiNirnay AI       ☰     │
├─────────────────────────────┤
│                             │
│        Main Content         │
│                             │
├─────────────────────────────┤
│ Home | Farm | Alerts | More │
└─────────────────────────────┘
```

The navigation labels should use farmer-understandable language.

---

# 71. FARMER DASHBOARD UX PRIORITY

The dashboard must prioritize information in this order:

```text
1. Farm status
2. Important alerts / risks
3. Today's actions
4. Weather
5. Field health
6. Sensor summary
7. AI insights
8. Market information
9. Detailed analytics
```

Do not make the farmer search through multiple technical screens to discover an important risk or action.

## 71.1 Dashboard greeting

Display:

```text
Good morning, [Farmer Name]

Here's what is happening on your farm today.
```

The greeting should not claim time-specific information unless the frontend can reliably determine local time.

## 71.2 Primary farm card

Show:

```text
My Farm
Farm Name
Location
Total Area
Active Fields
Farm Health
Last Updated
```

## 71.3 Priority alert card

When the backend returns an important risk:

```text
Attention Needed

Water stress detected in Field 2

Severity: HIGH
Confidence: 91%
Detected: 10 minutes ago

[ View Risk ]
[ View Action ]
```

Severity and confidence must come from the backend.

---

# 72. FARMER-FRIENDLY INFORMATION DESIGN

Technical backend concepts must be visually translated into understandable UI labels without changing their meaning.

Examples:

```text
Backend concept          UI wording

Virtual IoT              Virtual Sensor
Telemetry                Sensor Readings
Risk Engine              Risk Detection
Orchestrator             Action Planner
Execution                Action Status
Agent Run                AI Analysis
API Error 503            Service temporarily unavailable
```

Where technical details matter, provide a secondary detail view.

Do not hide source information.

For example:

```text
Soil Moisture
42%

Normal

Source:
SIMULATED — Virtual IoT

Last updated:
2 minutes ago
```

---

# 73. AUTHENTICATION SECURITY UX

The frontend must:

- never store passwords because password login is not the primary farmer authentication flow
- never store raw OTPs
- never log OTPs
- never place OTPs in URLs
- never put tokens in query parameters
- never expose secrets
- clear temporary OTP state after successful verification or cancellation
- clear sensitive login state after logout
- handle expired sessions gracefully
- redirect to login after confirmed authentication expiry
- avoid leaking whether a particular phone number belongs to an account
- respect backend rate limits
- show retry/cooldown states supplied by the backend

If the backend uses secure HTTP-only cookies, use `credentials: "include"` where required and do not attempt to read the cookie from JavaScript.

---

# 74. AUTHENTICATED ROUTE GUARD

Every authenticated page must perform a session check.

Conceptually:

```text
Page opens
   ↓
Check session
   ↓
Authenticated?
 ┌───────┴────────┐
YES               NO
 ↓                 ↓
Load page       Login page
```

Avoid rendering sensitive farmer information before authentication has been confirmed.

The frontend route guard is only a UX layer. Backend authorization remains authoritative.

---

# 75. LOGIN / LOGOUT STATE MACHINE

Implement explicit UI states:

```text
LOGGED_OUT
OTP_REQUESTING
OTP_SENT
OTP_VERIFYING
AUTHENTICATED
SESSION_EXPIRED
LOGOUT_PENDING
ERROR
```

Do not create multiple competing authentication states across different files.

Centralize authentication state in:

```text
js/auth.js
```

and session state in:

```text
js/state.js
```

---

# 76. ACCESSIBILITY FOR FARMERS

Because the product may be used outdoors and on mobile devices:

- use large touch targets
- use readable font sizes
- keep line lengths reasonable
- maintain strong contrast
- do not rely on color alone
- support keyboard navigation
- provide visible focus
- provide labels for all form controls
- provide accessible error messages
- make OTP input easy to operate on touchscreens
- avoid tiny icon-only controls unless they have accessible labels
- support reduced motion
- maintain readable text in dark mode

Primary mobile buttons should generally be large enough for comfortable touch interaction.

---

# 77. FINAL FILE STRUCTURE UPDATE

The final project structure must include the OTP and theme architecture:

```text
frontend/
│
├── index.html
│
├── pages/
│   ├── login.html
│   ├── verify-otp.html
│   ├── onboarding.html
│   ├── dashboard.html
│   ├── field-details.html
│   ├── agents.html
│   ├── agent-details.html
│   ├── action-plans.html
│   ├── execution.html
│   ├── market.html
│   ├── notifications.html
│   ├── reports.html
│   ├── simulation.html
│   ├── settings.html
│   └── admin.html
│
├── components/
│   ├── header.html
│   ├── sidebar.html
│   ├── mobile-nav.html
│   └── theme-toggle.html
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── illustrations/
│
├── css/
│   ├── variables.css
│   ├── reset.css
│   ├── layout.css
│   ├── components.css
│   ├── auth.css
│   ├── dashboard.css
│   ├── field.css
│   ├── agents.css
│   ├── actions.css
│   ├── execution.css
│   ├── market.css
│   ├── notifications.css
│   ├── reports.css
│   ├── settings.css
│   ├── themes.css
│   └── responsive.css
│
├── js/
│   ├── config.js
│   ├── api.js
│   ├── auth.js
│   ├── otp.js
│   ├── state.js
│   ├── theme.js
│   ├── ui.js
│   ├── utils.js
│   ├── charts.js
│   ├── map.js
│   ├── notifications.js
│   ├── dashboard.js
│   ├── fields.js
│   ├── sensors.js
│   ├── agents.js
│   ├── risks.js
│   ├── actions.js
│   ├── execution.js
│   ├── weather.js
│   ├── drone.js
│   ├── market.js
│   ├── reports.js
│   ├── simulation.js
│   └── settings.js
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── .env.example
└── README.md
```

If HTML component files are not actually supported by the chosen static architecture, implement reusable header/sidebar/mobile navigation through JavaScript templates or duplicated semantic markup with shared CSS. Do not introduce a server-side templating engine.

---

# 78. THEME JAVASCRIPT ARCHITECTURE

Create:

```text
js/theme.js
```

Responsibilities:

- read saved theme preference
- detect System preference
- apply `data-theme`
- expose current theme
- update theme controls
- persist the UI preference
- listen for system theme changes when System is selected
- dispatch a custom `themechange` event
- allow charts/components to redraw when necessary

Conceptual API:

```javascript
ThemeManager.init();

ThemeManager.getPreference();

ThemeManager.setPreference("light");
ThemeManager.setPreference("dark");
ThemeManager.setPreference("system");

ThemeManager.getResolvedTheme();
```

Do not create a frontend framework.

---

# 79. FINAL DESIGN TOKENS

All major visual decisions must be tokenized:

```text
Colors
Typography
Spacing
Radii
Shadows
Borders
Z-index
Transitions
Container widths
Sidebar width
Mobile navigation height
Touch target size
```

Example:

```css
:root {
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 20px;
    --space-6: 24px;
    --space-8: 32px;
    --space-10: 40px;

    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 20px;

    --shadow-sm: 0 1px 3px rgba(20, 83, 45, 0.08);
    --shadow-md: 0 8px 24px rgba(20, 83, 45, 0.10);

    --transition-fast: 150ms ease;
    --transition-normal: 220ms ease;
}
```

Keep shadows subtle and avoid excessive glassmorphism.

---

# 80. FINAL AUTHENTICATION ACCEPTANCE TEST

The frontend is not complete until this flow works:

```text
1. Open application
2. User is not authenticated
3. Redirect to Farmer Login
4. Enter mobile number
5. Press Send OTP
6. Loading state appears
7. Backend responds
8. Navigate to OTP verification
9. OTP countdown/status is shown
10. Enter OTP
11. Press Verify & Continue
12. Loading state appears
13. Backend validates OTP
14. Authenticated session is established
15. Farmer Dashboard opens
16. Farmer name/farm data loads
17. Logout works
18. Reopening protected page after logout returns to login
```

Test failure cases:

```text
Invalid phone
OTP request failure
Wrong OTP
Expired OTP
Too many attempts
Rate limit
Backend unavailable
Session expired
Logout failure
Slow network
Mobile viewport
Desktop viewport
Dark mode
Light mode
System mode
```

---

# 81. FINAL THEME ACCEPTANCE TEST

Test:

```text
Light selected
    ↓
Entire application becomes light

Dark selected
    ↓
Entire application becomes dark

System selected
    ↓
Browser OS preference controls theme

System preference changes
    ↓
Application updates automatically

Reload page
    ↓
Selected preference remains

Open Settings
    ↓
Appearance → Theme clearly shows current selection
```

Verify:

- login
- OTP screen
- dashboard
- cards
- tables
- charts
- maps
- modals
- dropdowns
- notifications
- settings
- error states
- loading states
- empty states

in all supported themes.

---

# 82. FINAL PRODUCT REQUIREMENT

The final frontend must present **KrishiNirnay AI as a farmer-first agricultural intelligence product**, not merely as a technical dashboard.

The first interaction must be simple:

```text
Farmer
  ↓
Mobile Number
  ↓
OTP
  ↓
Farm Dashboard
```

The core visual identity must be:

```text
GREEN + WHITE
      +
SOFT AGRICULTURAL SURFACES
      +
CLEAR STATUS COLORS
      +
LIGHT / DARK / SYSTEM THEMES
```

The authenticated experience must then expose the existing platform workflow:

```text
Farm
 ↓
Field
 ↓
Zone
 ↓
Virtual Sensors
 ↓
Data
 ↓
AI Agents
 ↓
Risks
 ↓
Action Plans
 ↓
Approval
 ↓
Execution
 ↓
Feedback
 ↓
Continuous Monitoring
```

All authoritative business logic remains in the FastAPI backend.

The frontend remains:

```text
Presentation
+
Interaction
+
Authentication UX
+
API Consumption
+
State Rendering
+
Accessibility
+
Theme Management
+
Responsive Experience
```

---

# 83. FINAL NON-NEGOTIABLE REQUIREMENTS — CONSOLIDATED

1. HTML5 + CSS3 + Vanilla JavaScript only.
2. No React, Vue, Angular, Svelte, TypeScript, JSX/TSX, Vite, Next.js, Tailwind, Bootstrap, or jQuery.
3. GitHub Pages compatible.
4. FastAPI backend compatible.
5. Farmer-first UX.
6. Mobile-number + OTP authentication.
7. No password storage in frontend.
8. No OTP generation or verification in frontend.
9. No fake production authentication.
10. Green + white primary brand system.
11. Light theme supported.
12. Dark theme supported.
13. System theme supported.
14. Theme controls must exist in Settings.
15. Theme preference must persist.
16. Accessibility must work in both themes.
17. Virtual IoT must be visibly labeled.
18. AI outputs must come from the backend.
19. Risks must come from the backend.
20. Weather must come from the backend.
21. Actions must be authorized by the backend.
22. Execution must be controlled by the backend.
23. No secrets in frontend.
24. No database credentials in frontend.
25. No LLM keys in frontend.
26. No JWT signing secrets in frontend.
27. Centralized API service.
28. Centralized authentication service.
29. Centralized theme service.
30. Explicit loading, empty, error, offline, and retry states.
31. Responsive desktop/tablet/mobile layouts.
32. Farmer-friendly language.
33. Large, touch-friendly controls.
34. Keyboard accessibility.
35. Reduced-motion support.
36. Cross-browser support.
37. GitHub Pages deployment workflow.
38. Production-oriented code organization.
39. No disconnected dashboard screens.
40. Every important state change must remain traceable from backend response to UI.

## FINAL VISUAL PRINCIPLE

The interface should look like:

> **A trusted digital farm assistant that happens to be powered by sophisticated AI — not a complicated AI system that expects farmers to understand technology.**
