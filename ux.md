# KRISHINIRNAY AI — UX / PRODUCT EXPERIENCE PROMPT

## Role

Act as a Senior UX Architect, Product Designer, AgTech UX Specialist, and Human-AI Interaction Designer.

Design the complete user experience for **KrishiNirnay AI**, an autonomous farm-to-field advisory and action orchestration platform.

The goal is not just to create attractive screens.

The goal is to create a clear, trustworthy, explainable, operational workflow from farm data to verified action.

---

# 1. CORE UX PRINCIPLE

The complete experience must follow:

`MONITOR → ANALYZE → DETECT → DECIDE → ACT → VERIFY → REASSESS`

The user must always be able to understand:

- What is happening?
- Where is it happening?
- Why is it happening?
- What did the system detect?
- What does the AI recommend?
- What action is proposed?
- Does the user need to approve it?
- What happened after execution?
- Was the result verified?
- What happens next?

---

# 2. UX GOALS

Prioritize:

1. Clarity
2. Trust
3. Explainability
4. Actionability
5. Safety
6. Low cognitive load
7. Fast navigation
8. Responsive usability
9. Agricultural context
10. Human control where required

Avoid unnecessary complexity.

---

# 3. TARGET USERS

### Farmer

Primary questions:

- Is my crop okay?
- Is there a risk?
- Do I need to irrigate?
- What should I do?
- When should I do it?
- What will it cost/use?
- Did the action work?

### Farm Operator

Primary questions:

- Which fields need attention?
- Which risks are active?
- Which agents are running?
- Which actions are pending?
- Which tasks are executing?
- Is the system healthy?

### Agricultural Expert

Primary questions:

- What evidence produced this recommendation?
- Which sensors contributed?
- What does weather indicate?
- What did the agents conclude?
- How confident is the system?
- Why was the case escalated?

---

# 4. INFORMATION HIERARCHY

Use progressive disclosure.

### Level 1 — Immediate

Show:

- Risk
- Field
- Action
- Status

### Level 2 — Explanation

Show:

- Why
- Evidence
- Weather
- Sensor data
- Confidence

### Level 3 — Technical

Show:

- Agent inputs
- Model output
- Historical data
- Execution history
- Technical diagnostics

Do not expose all technical information at once.

---

# 5. PRIMARY USER JOURNEY

Design the main journey as:

```text
Dashboard
   ↓
Field Condition
   ↓
Risk Detected
   ↓
Why?
   ↓
AI Recommendation
   ↓
Action Plan
   ↓
Approval
   ↓
Execution
   ↓
Verification
   ↓
Reassessment
```

This must be consistent throughout the application.

---

# 6. DASHBOARD UX

Dashboard should answer within seconds:

**"What needs my attention?"**

Priority order:

1. Critical alerts
2. High risks
3. Pending approvals
4. Field health
5. AI recommendations
6. Weather
7. Tasks
8. Sensor trends
9. Historical analytics

Do not make users search through multiple pages to find urgent actions.

---

# 7. FARM CONTEXT UX

Always maintain context:

`Farm → Field → Zone`

When viewing data, the user should know:

- Which farm?
- Which field?
- Which zone?
- Which crop?
- Which growth stage?

Avoid ambiguous sensor/risk information.

---

# 8. VIRTUAL IoT UX

The hackathon uses simulated sensors.

This must be obvious.

Display:

`SIMULATION MODE — Virtual IoT Active`

and:

`SIMULATED — Virtual IoT`

Never create UX that makes simulated data appear to be physical hardware.

The design should still demonstrate how the same interface could later connect to physical sensors.

---

# 9. SENSOR UX

Sensor experience:

```text
Sensor
  ↓
Current Value
  ↓
Trend
  ↓
Data Quality
  ↓
Source
  ↓
Related Risk
```

Users should not need to understand IoT technology to understand sensor information.

Example:

Soil Moisture  
31%

↓ Falling

`SIMULATED — Virtual IoT`

Related risk:

Water Stress

---

# 10. DATA TRUST UX

Every important data point should have a source.

Possible labels:

- SIMULATED — Virtual IoT
- LIVE — Open-Meteo
- MODEL OUTPUT
- USER INPUT
- CACHED
- UNAVAILABLE

Do not hide stale or unavailable information.

If data is cached, show:

`Cached — Last updated 08:42 AM`

If unavailable:

`Unavailable`

Never fabricate data.

---

# 11. AI EXPLAINABILITY UX

Never make the user trust a black box.

Bad:

> AI recommends irrigation.

Good:

### Why?

- Soil moisture is below threshold
- Rain probability is low
- Recent irrigation was insufficient
- ET0 is elevated

### Recommendation

Schedule irrigation.

### Confidence

89%

Confidence must be presented as system/model confidence only if supplied by the backend. Do not imply it is a calibrated probability unless the backend defines it that way.

---

# 12. RISK UX

Every risk must answer:

- What?
- Where?
- Severity?
- When?
- Why?
- What should I do?

Example:

```text
HIGH
Water Stress

North Field

Detected 10 min ago

Why:
Soil moisture 31%
Rain probability 12%
High ET0

Recommended:
Review irrigation
```

---

# 13. ACTION UX

Every action should answer:

### WHAT

What operation will happen?

### WHERE

Which field/zone?

### WHEN

When will it happen?

### WHY

Why is it needed?

### COST

Expected resource/cost.

### CONFIDENCE

System confidence.

### SAFETY

Relevant constraints.

### STATUS

Pending / approved / executing / completed.

---

# 14. HUMAN APPROVAL UX

Do not hide approval requirements.

When approval is needed:

```text
ACTION REQUIRES APPROVAL

Irrigate Zone A

Why:
Soil moisture is low.

Expected result:
Increase soil moisture.

Weather:
Low rain probability.

Resource:
Water requirement shown by backend.

Confidence:
89%

[Approve]
[Reject]
[Request Expert Review]
```

The approval screen must be understandable without technical knowledge.

---

# 15. HUMAN CONTROL

Autonomous does NOT mean uncontrolled.

The UX must distinguish:

- automatic monitoring
- AI recommendation
- approval-required action
- automatic low-risk action
- expert review
- failed action
- escalated action

High-impact or uncertain operations should clearly indicate that human/expert review is required.

---

# 16. TASK UX

Use a lifecycle:

```text
CREATED
↓
PENDING APPROVAL
↓
APPROVED
↓
SCHEDULED
↓
ASSIGNED
↓
IN PROGRESS
↓
COMPLETED
↓
VERIFIED
```

Failure path:

```text
FAILED
↓
ESCALATED
```

Users should be able to understand exactly where a task is in the lifecycle.

---

# 17. EXECUTION UX

When an action is running, show:

- What is running?
- Where?
- Start time
- Expected completion
- Current progress
- Current status
- Controls available

Example:

```text
IRRIGATION RUNNING

North Field
Zone A

18 minutes

78%

[Pause]
[Stop]
```

For virtual execution, clearly identify the simulation/virtual context.

---

# 18. VERIFICATION UX

After execution:

```text
ACTION COMPLETED

Before:
31%

After:
39%

Change:
+8%

Verification:
Successful
```

Then:

```text
RISK REASSESSMENT

Water Stress
Reduced
```

The user should see that the system did not stop after recommending the action.

---

# 19. SIMULATION UX

Simulation should be designed as a demonstration of autonomous intelligence.

Available scenarios:

- Water Stress
- Heavy Rain
- Heat Wave
- Nutrient Deficiency
- Disease Favorable Conditions
- Sensor Failure
- Reset

Each scenario should show:

### Before

Current state.

### Trigger

What changed.

### AI Response

Which agents activated.

### Decision

What action was generated.

### Execution

What happened.

### Verification

What changed.

### Reassessment

What the system concluded.

---

# 20. WATER STRESS UX JOURNEY

Design:

```text
Normal Field
↓
Soil Moisture Drops
↓
Water Stress Detected
↓
Irrigation Agent
↓
Risk Assessment
↓
Action Plan
↓
Approval
↓
Virtual Irrigation
↓
Moisture Improves
↓
Verification
↓
Risk Reduced
```

This should be one of the primary demo journeys.

---

# 21. HEAVY RAIN CONFLICT UX

Show that agents can disagree.

Example:

```text
Water Stress
       +
Heavy Rain Forecast
       ↓
Potential Conflict
       ↓
Orchestrator
       ↓
Irrigation Delayed
       ↓
Alert
```

Explain:

"Existing irrigation plan conflicts with expected heavy rainfall."

This demonstrates multi-agent coordination.

---

# 22. AGENT UX

Do not make agents look like chatbots.

Agents are operational system components.

Each agent should show:

- Status
- Last run
- Inputs
- Evidence
- Result
- Confidence
- Recommendation
- Execution/reasoning history where appropriate

Agent UX should communicate system intelligence without pretending that every agent is a human-like assistant.

---

# 23. ORCHESTRATOR UX

The Orchestrator is the coordination layer.

Show:

```text
Agent Findings
      ↓
Conflict Detection
      ↓
Priority
      ↓
Constraints
      ↓
Decision
      ↓
Action Plan
```

Example:

Irrigation Agent:
High water stress

Weather Agent:
Heavy rain expected

Orchestrator:
Delay irrigation

Reason:
Expected rainfall may reduce irrigation requirement.

---

# 24. WEATHER UX

Weather should not be a generic weather app.

Translate weather into farm decisions:

- irrigation suitability
- spraying suitability
- field work window
- heat risk
- rain risk

Always distinguish:

`LIVE — Open-Meteo`

from simulated sensor information.

---

# 25. MARKET UX

Market data should support decisions, not make guarantees.

Show:

- Current price
- Market
- Crop
- Historical trend
- Harvest readiness
- Storage context

Use:

`DECISION SUPPORT`

Avoid language implying guaranteed profits or future prices.

---

# 26. DISEASE UX

Disease analysis must distinguish:

### Image/model evidence

What the model detected.

### AI explanation

How the result relates to weather/field context.

### Recommendation

What action is proposed.

Do not let an AI explanation invent image findings.

If confidence is low, clearly indicate uncertainty and allow expert review.

---

# 27. EXPERT ESCALATION UX

Escalate when:

- diagnosis is uncertain
- confidence is low for high-impact decisions
- agents conflict
- high-cost action is proposed
- safety constraints are triggered
- backend policy requires expert review

Expert case should contain all relevant evidence.

Do not force experts to reconstruct the case manually.

---

# 28. NOTIFICATION UX

Notifications should be actionable.

Bad:

> Risk detected.

Good:

> HIGH — Water Stress detected in North Field.  
> Soil moisture: 31%.  
> [View Risk]

Notifications should deep-link to the relevant entity.

---

# 29. SEARCH UX

Search should cover:

- farms
- fields
- zones
- sensors
- risks
- actions
- tasks
- agents
- alerts

Use debounced search.

Mobile should provide a dedicated expanded search experience.

---

# 30. EMPTY STATE UX

Empty states should guide the user.

Bad:

> No data.

Good:

> No active risks detected across your monitored fields.

`[View Field Health]`

---

# 31. ERROR UX

Every error should explain:

1. What happened?
2. What does it affect?
3. What can the user do?

Example:

```text
Weather data temporarily unavailable.

The latest cached forecast is being displayed.

Last updated:
08:42 AM

[Retry]
```

Never pretend a failed service is working.

---

# 32. MOBILE UX

Mobile is a first-class experience.

Prioritize:

1. Alerts
2. Risks
3. Actions
4. Field health
5. Weather
6. Tasks
7. Sensors
8. Analytics

Use:

- 44px minimum touch targets
- large actionable controls
- bottom navigation
- bottom sheets
- stacked cards
- collapsible technical sections

Do not simply scale desktop screens down.

---

# 33. DESKTOP UX

Desktop/laptop should function as a farm control center.

Use available space for:

- multiple fields
- maps
- charts
- agent monitoring
- risk lists
- task status
- detailed analytics

Maintain clear visual hierarchy despite higher information density.

---

# 34. RESPONSIVE USER JOURNEYS

### Desktop

```text
Dashboard
↓
Field
↓
Risk
↓
Evidence
↓
Action
↓
Approval
↓
Execution
↓
Verification
```

### Mobile

```text
Alert
↓
Risk
↓
Why?
↓
Recommendation
↓
Approve
↓
Task
↓
Result
```

Both must lead to the same backend-driven workflow.

---

# 35. ACCESSIBILITY UX

Ensure:

- semantic navigation
- keyboard operation
- visible focus
- accessible form labels
- accessible status messages
- sufficient contrast
- no color-only meaning
- touch-friendly controls
- readable text

Status example:

`[HIGH RISK]` + icon + color

not color alone.

---

# 36. USER FEEDBACK

Use:

- Toasts
- Inline feedback
- Progress indicators
- Status badges
- Confirmation messages
- Timelines

Example:

After approval:

`Action approved successfully.`

After task completion:

`Irrigation completed. Verification in progress.`

After verification:

`Action verified. Water stress reassessed.`

---

# 37. UX STATE MODEL

Every important object should have clear states.

### Sensor

ONLINE / STALE / OFFLINE / ERROR

### Risk

LOW / MEDIUM / HIGH / CRITICAL

### Action

PENDING / APPROVED / REJECTED / EXPERT REVIEW

### Task

CREATED / SCHEDULED / IN PROGRESS / COMPLETED / FAILED / ESCALATED

The UX should make state transitions obvious.

---

# 38. TRUST AND SAFETY PRINCIPLES

Never hide:

- simulation
- stale data
- unavailable data
- uncertainty
- low confidence
- expert review requirements
- action status

Never make the UI claim that an action happened when backend confirmation has not been received.

Never show a successful execution state based only on a button click.

---

# 39. FRONTEND/BACKEND RESPONSIBILITY

Frontend:

- display
- navigation
- user input
- API requests
- UI state
- rendering

Backend:

- AI agents
- orchestration
- risk calculation
- simulation engine
- policy engine
- action execution
- database
- weather integration
- authentication
- authorization

Never design UX that depends on frontend-generated fake AI decisions.

---

# 40. CORE UX PRINCIPLE

The user should never ask:

"Why did the system do this?"

The interface should proactively answer:

**WHAT happened?**

**WHY?**

**WHAT does the AI recommend?**

**WHAT will happen next?**

**WHAT happened after execution?**

**WHAT changed?**

**WHAT is the system doing now?**

---

# 41. FINAL UX EXPERIENCE

The ideal experience is:

```text
SEE
↓
UNDERSTAND
↓
TRUST
↓
DECIDE
↓
ACT
↓
VERIFY
↓
LEARN/REASSESS
```

KrishiNirnay AI should feel like an intelligent operational partner for farm management, while keeping data provenance, uncertainty, and human control visible.

The final UX must be:

- Simple for farmers
- Powerful for operators
- Explainable for experts
- Responsive on mobile
- Information-rich on laptop/desktop
- Trustworthy
- Operational
- Production-ready
