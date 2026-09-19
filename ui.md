# KRISHINIRNAY AI — UI DESIGN PROMPT

## Role

Act as a Senior UI Designer and Design System Architect for **KrishiNirnay AI**, an autonomous farm-to-field advisory and action orchestration platform.

Design a premium, production-quality agricultural intelligence interface.

The uploaded/reference image is **design inspiration only**. Do not copy it directly. Extract useful principles such as hierarchy, agricultural context, card organization, data visualization, and modern AgTech presentation.

---

## 1. Product Identity

**Product:** KrishiNirnay AI  
**Tagline:** From Farm Data to Intelligent Action

The interface must communicate this continuous loop:

`MONITOR → ANALYZE → DETECT → DECIDE → ACT → VERIFY → REASSESS`

The product should look like a serious AgTech startup/control center, not a generic admin dashboard, student project, chatbot, crypto dashboard, or gaming interface.

---

## 2. Visual Direction

Use a visual language that is:

- Premium
- Clean
- Modern
- Intelligent
- Trustworthy
- Calm
- Agricultural
- Technical
- Practical
- Data-driven

Use restrained:

- Green/natural agricultural tones
- Earth tones
- White/off-white
- Charcoal/dark gray
- Neutral gray
- Amber for warnings
- Red for critical states
- Blue for weather/water

Avoid excessive gradients, glassmorphism, neon colors, oversized shadows, and unnecessary decoration.

### Typography

Prefer:

- Inter
- Manrope
- DM Sans
- Plus Jakarta Sans

Use clear hierarchy:

Page title → Section title → Card title → Body → Metadata.

Use responsive typography with `clamp()` where appropriate.

---

## 3. Target Users

Design for:

### Farmer
Needs:
- Field condition
- Weather
- Risks
- Recommendations
- Actions
- Tasks

### Farm/Control Room Operator
Needs:
- Farms
- Fields
- Zones
- Sensors
- AI agents
- Risks
- Action plans
- Tasks
- System health

### Agronomist/Expert
Needs:
- Evidence
- Sensor readings
- Weather context
- Agent findings
- Confidence
- Expert review

Use progressive disclosure so advanced information is available without overwhelming the primary user.

---

## 4. Application Shell

### Desktop/Laptop

Use:

`Sidebar + Header + Main Content`

Sidebar navigation:

- Dashboard
- Farms
- Fields
- Live Map
- AI Agents
- Risks
- Action Plans
- Tasks
- Simulation
- Weather
- Market
- Alerts
- Reports
- Settings

Header:

- KrishiNirnay AI logo
- Farm selector
- Search
- Weather
- System health
- Notifications
- Profile

### Mobile

Do not simply shrink the desktop layout.

Use:

- Compact top header
- Main content
- Mobile bottom navigation

Bottom navigation:

- Dashboard
- Farms
- Risks
- Tasks
- More

"More" contains the remaining navigation items.

---

## 5. Critical Virtual IoT Design

The hackathon uses **virtual/simulated IoT sensors**.

The interface must never imply that simulated data comes from physical hardware.

Always display:

`SIMULATION MODE — Virtual IoT Active`

and/or:

`SIMULATED — Virtual IoT`

Other source labels:

- `LIVE — Open-Meteo`
- `MODEL OUTPUT`
- `USER INPUT`
- `CACHED`
- `UNAVAILABLE`

These labels must remain visible on mobile as well.

---

## 6. Dashboard

The dashboard must answer:

**"What is happening on my farm right now?"**

Recommended order:

1. Farm Summary
2. KPI Cards
3. Field Health
4. Active Risks
5. AI Recommendations
6. Weather
7. Sensor Activity
8. Tasks
9. Recent Activity

### KPI Cards

- Total Farms
- Active Fields
- Active Risks
- Pending Actions
- Tasks Today
- Water Stress
- Water Usage
- System Health

Desktop: multi-column.

Laptop: fewer columns.

Mobile: 2-column where readable, otherwise 1-column.

Use flexible grids such as:

`repeat(auto-fit, minmax(180px, 1fr))`

Never use fixed-width cards that create overflow.

---

## 7. Farm and Field Hierarchy

Represent:

`Farm → Field → Zone → Virtual Sensors`

Example:

Anand Farm

North Field
- Zone A
  - Soil Moisture
  - Temperature
  - NPK
- Zone B
  - Soil Moisture
  - Temperature

The UI must always make the selected farm, field, and zone obvious.

---

## 8. Field Cards

Each field card should show:

- Field name
- Crop
- Growth stage
- Health
- Soil moisture
- Temperature
- Active risk
- Recommended action

Example:

**North Field**

Wheat  
Vegetative Stage

Soil Moisture: 31%  
Temperature: 27°C

`HIGH — Water Stress`

Recommended: Review irrigation

Use icon + text + color. Never rely on color alone.

---

## 9. Live Map

Create an agricultural map experience showing:

- Farm boundaries
- Field boundaries
- Zones
- Virtual sensor locations
- Risks
- Tasks
- Weather

Map layers:

- Fields
- Zones
- Sensors
- Risks
- Tasks
- Weather

### Desktop

Large map with side controls.

### Mobile

Map with floating controls and a bottom-sheet layer panel.

Do not cover the map with large permanent panels on mobile.

---

## 10. Sensor UI

Sensors:

- Soil Moisture
- Soil Temperature
- Humidity
- NPK
- pH
- EC

Sensor card:

- Sensor name
- Status
- Current value
- Unit
- Last updated
- Source

Example:

**SOIL MOISTURE**

31.8%

`ONLINE`

Updated 34 seconds ago

`SIMULATED — Virtual IoT`

Sensor detail should contain:

- Current reading
- Historical data
- Trend
- Data quality
- Status
- Last update
- Source

Time filters:

`6H | 24H | 7D | 30D`

---

## 11. AI Agent Center

Agents:

- Farm Context Agent
- Soil Agent
- Weather Agent
- Irrigation Agent
- Nutrient Agent
- Disease Agent
- Drone Agent
- Market Agent
- Risk Agent
- Orchestrator

Agent cards:

- Agent name
- Status
- Last run
- Current task
- Confidence
- Latest result

Statuses:

- ACTIVE
- IDLE
- ANALYZING
- WARNING
- ERROR

Agent detail:

`Overview → Inputs → Evidence → Analysis → Output → Confidence → Recommendation → Execution History`

---

## 12. AI Explainability

Never show only:

> "AI says irrigate."

Instead show:

### Why?

- Soil moisture: 31%
- Recent irrigation: Low
- Rain probability: 12%
- Weather: Dry
- Confidence: 89%

Recommendation:

**Schedule irrigation**

The UI must make AI decisions understandable.

---

## 13. Risk Center

Risk types:

- Water Stress
- Disease Risk
- Nutrient Deficiency
- Heavy Rain
- Heat Stress
- Sensor Failure

Risk levels:

- LOW
- MEDIUM
- HIGH
- CRITICAL

Risk card:

- Risk type
- Severity
- Field
- Confidence
- Detection time
- Status
- Recommended action

Risk details:

`Risk → Severity → Confidence → Evidence → Sensors → Weather → Agent Findings → Recommendation`

Include:

**Why was this risk detected?**

---

## 14. Action Plans

Every action plan should visually communicate:

- WHAT
- WHERE
- WHEN
- WHY
- COST
- CONFIDENCE
- SAFETY
- STATUS

Example:

**IRRIGATE ZONE A**

When: Today · 18:30  
Why: Soil moisture below configured threshold  
Confidence: 89%  
Status: Awaiting Approval

Approval controls:

- Approve Action
- Reject
- Request Expert Review

Show evidence and expected effect before approval.

---

## 15. Task Management

Task states:

- CREATED
- PENDING APPROVAL
- APPROVED
- SCHEDULED
- ASSIGNED
- IN PROGRESS
- COMPLETED
- VERIFIED
- FAILED
- ESCALATED

Show a clear timeline:

`Created → Approved → Scheduled → Started → Completed → Verified`

Desktop can use Kanban or multi-column views.

Mobile should use stacked cards or horizontally scrollable task groups.

---

## 16. Virtual Execution UI

Create an irrigation controller interface.

Example:

**IRRIGATION CONTROLLER**

● RUNNING

Field: North Field  
Zone: Zone A  
Duration: 18 min  
Progress: 78%

Controls:

- Pause
- Stop

The UI must make it clear this is virtual execution when using simulated hardware.

---

## 17. Execution Feedback

After execution show:

**ACTION COMPLETED**

Before: 31%  
After: 39%  
Change: +8%  
Verification: Successful

Then:

`Water Stress → Reduced`

This should visually demonstrate the closed-loop system.

---

## 18. Simulation Center

Scenarios:

- Water Stress
- Heavy Rain
- Heat Wave
- Nutrient Deficiency
- Disease Favorable Conditions
- Sensor Failure
- Reset

Each simulation card:

- Scenario
- Description
- Affected signals
- Expected response
- Run Simulation

Visual flow examples:

### Water Stress

`Normal → Moisture Drops → Risk → Irrigation Agent → Action → Execution → Moisture Improves → Reassessment`

### Heavy Rain

`Rain → Weather Risk → Existing Irrigation → Conflict → Orchestrator → Delay → Alert`

---

## 19. Disease Analysis

Provide:

- Drag & Drop image upload
- Choose image
- Image preview
- Model result
- Confidence
- Affected area
- Weather correlation
- Risk
- Recommendation

Clearly separate:

`MODEL RESULT`

from:

`AI EXPLANATION`

---

## 20. Weather

Display:

- Current weather
- Hourly forecast
- Daily forecast
- Temperature
- Humidity
- Rain probability
- Rainfall
- Wind
- ET0 where available

Agricultural interpretation:

- Irrigation suitability
- Spraying suitability
- Field work window
- Heat risk
- Rain risk

Source:

`LIVE — Open-Meteo`

---

## 21. Market

Show:

- Crop
- Market
- Current price
- Historical trend
- Market signal
- Harvest readiness
- Storage context

Clearly label this:

`DECISION SUPPORT`

Do not visually imply guaranteed future prices.

---

## 22. Alerts

Filters:

- All
- Critical
- High
- Warning
- Info

Example:

**HIGH**

Heavy rain expected

North Field

Recommended:
Review irrigation schedule

Actions:

- Acknowledge
- View Details

---

## 23. Reports

Reports:

- Water Usage
- Risk Summary
- Field Performance
- AI Activity
- Action Effectiveness
- Sensor History
- Market Trends

Use responsive charts, summary cards, tables, and filters.

---

## 24. Expert Review

Expert case should contain:

- Problem
- Field
- Evidence
- Sensor data
- Weather
- Agent findings
- Conflict
- Recommendation

Actions:

- Resolve
- Request More Data
- Add Recommendation
- Escalate

---

## 25. Empty, Loading and Error States

Every page needs useful states.

### Loading

Prefer skeleton loaders.

### Empty

Example:

**NO ACTIVE RISKS**

Your monitored fields currently have no active risk events.

`[View Field Health]`

### Error

Example:

Weather data temporarily unavailable.

Showing latest cached forecast.

Last updated: 08:42 AM

`[Retry]`

Never fabricate unavailable data.

---

## 26. Accessibility

Use:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Accessible labels
- Proper contrast
- Alt text
- ARIA where needed
- Minimum 44×44px touch targets

Never communicate information through color alone.

Example:

`[HIGH RISK] + icon + red indicator`

---

## 27. Responsive UI Rules

The design MUST work on:

- 360×800
- 390×844
- 430×932
- 768×1024
- 1024×768
- 1280×720
- 1366×768
- 1440×900
- 1920×1080

### Mobile

Prioritize:

1. Critical Alerts
2. Active Risks
3. Recommended Actions
4. Field Health
5. Weather
6. Tasks
7. Sensors
8. Detailed Analytics

### Mobile behavior

- Hide desktop sidebar
- Use mobile bottom navigation
- Stack cards
- Convert modals to full-screen/bottom sheets
- Convert side drawers to bottom sheets
- Make forms single-column
- Keep charts within viewport
- Make tables scrollable or card-based
- Never allow horizontal page scrolling

### Desktop behavior

- Multi-column layouts
- Larger maps
- Side panels
- Higher information density
- Full analytics

Do not simply shrink desktop UI for mobile.

---

## 28. Responsive Components

Design reusable:

- Button
- IconButton
- Card
- KPI Card
- Metric Card
- Chart Card
- Status Badge
- Data Table
- Modal
- Drawer
- Toast
- Alert
- Notification
- Tabs
- Dropdown
- Select
- Search
- Progress Bar
- Timeline
- Agent Card
- Risk Card
- Action Card
- Task Card
- Sensor Card
- Weather Card
- Field Card
- Map Legend
- Simulation Card

Maintain one consistent design system.

---

## 29. Responsive Autonomous Loop

Desktop:

`MONITOR → ANALYZE → DETECT → DECIDE → ACT → VERIFY → REASSESS`

Mobile:

```text
MONITOR
   ↓
ANALYZE
   ↓
DETECT
   ↓
DECIDE
   ↓
ACT
   ↓
VERIFY
   ↓
REASSESS
```

This should be a signature visual component of the product.

---

## 30. UI Quality Bar

The final UI should feel like:

**A FARM INTELLIGENCE CONTROL CENTER**

The user should understand:

1. What is happening?
2. Why is it happening?
3. What did the AI detect?
4. What does the AI recommend?
5. What action will happen?
6. What happened after the action?
7. What was reassessed?

Prioritize:

- Clarity
- Trust
- Explainability
- Agricultural context
- Data visualization
- Operational usability
- Responsive design
- Accessibility

Do not prioritize decoration over usability.
