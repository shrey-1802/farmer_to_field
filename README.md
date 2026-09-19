# KrishiNirnay AI 🌾

**Autonomous Farm-to-Field Advisory & Action Orchestration Platform**

A production-grade, hackathon-ready precision agriculture platform built for Indian smallholder farmers. KrishiNirnay AI continuously monitors farm conditions using Virtual IoT sensors and live weather data, applies multi-agent AI intelligence to detect agronomic risks, generates action plans, and tracks autonomous execution — closing the loop from sensor to soil.

---

## 🚀 Live Demo

| Surface | URL |
|---|---|
| **Frontend (GitHub Pages)** | `https://shrey-1802.github.io/farmer_to_field/` |
| **Backend API (Render)** | `https://krishinirnay-api.onrender.com/api` |

> **Note:** The Render backend may take ~30 seconds to wake from a cold start. The frontend will show a wake-up banner automatically and retry.

---

## 🏗️ Architecture

```
                    KRISHINIRNAY AI
                           │
                           ▼
                  ┌─────────────────┐
                  │ HTML / CSS / JS │  ← GitHub Pages (static)
                  └────────┬────────┘
                           │ HTTPS REST API
                           ▼
                  ┌─────────────────┐
                  │ FastAPI Backend │  ← Render (Python)
                  └────────┬────────┘
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
Virtual Sensors       Live Weather        AI Agents
       │             (Open-Meteo)      (9 domain agents)
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

---

## ✨ Features

### 🌱 Core Platform
- **Farmer OTP Authentication** — 10-digit Indian mobile number login, 6-digit OTP verification, JWT session
- **Farm → Field → Zone Hierarchy** — Multi-tier navigation with SVG zone map polygon highlighting
- **Virtual IoT Sensor Engine** — 7 virtual sensor streams (moisture, temperature, NPK, pH, EC, leaf wetness, humidity) across 4 management zones, 10-second polling

### 🤖 AI Multi-Agent Intelligence
- **9 Autonomous AI Agents**: Irrigation, Pest & Disease, Nutrient, Weather Forecasting, Yield Prediction, Market Advisory, Expert Escalation, Drone Analysis, Risk Orchestrator
- **Multi-agent consensus cycles** with confidence-weighted voting and audit trail
- **Continuous 7-stage loop**: Monitor → Analyze → Detect → Decide → Act → Verify → Reassess (Section 52)

### 🌾 Field Operations
- **8-Tab Field Inspector**: Overview, Zones, Sensors, Weather, Drone, Risks, Actions, History
- **Drip Valve & Solenoid Control**: Per-zone actuation with manual override
- **Multispectral Drone Imagery**: NDVI biomass mapping with 5-band orthomosaic analysis

### ⚡ Action & Execution
- **AI-Generated Action Plans** with farmer approve / modify / reject workflow
- **Field Task Execution Center** — 6-state job lifecycle with virtual actuator status
- **Closed-Loop Feedback** — 6-stage verification timeline with telemetry delta

### 🧪 Simulation Center (Demo)
- **6 one-click agronomic stress scenarios**: Water Stress, Disease Risk, Nutrient Deficiency, Heavy Rain, Heat Wave, Sensor Failure
- **Real-time simulation status dashboard** with affected sensors, agent decisions, generated risks and actions
- Connects to `POST /api/simulation/{scenario}` with local-state fallback for offline demos

### 📊 Intelligence & Reporting
- **Market & Mandi Intelligence**: Live APMC spot prices, 7-day SVG trend chart, selling window decision support
- **Notification Center**: 7 categories, severity badges, acknowledge controls
- **Agronomy Reports**: 8 domain report cards with CSV export, print, and Web Share API
- **Admin Panel**: Manage Users, Farms, Fields, Sensors, System Logs, Agent Activity, System Settings

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vanilla HTML5, CSS3 (Custom Properties), ES6+ JavaScript (Modules) |
| **Styling** | CSS Grid, Flexbox, CSS Variables, Dark/Light/System themes |
| **Charts** | Zero-dependency SVG charts (no Chart.js or D3) |
| **Maps** | Inline SVG polygon zone maps |
| **Backend** | FastAPI (Python 3.11+) |
| **Database** | PostgreSQL (via SQLAlchemy) |
| **Hosting** | GitHub Pages (frontend) + Render (backend) |
| **Weather** | Open-Meteo API (free, no API key required) |

---

## 📁 Project Structure

```
farmer_to_field/
├── frontend/
│   ├── index.html              # Root entry → redirects to pages/
│   ├── pages/
│   │   ├── login.html          # Farmer OTP login
│   │   ├── verify-otp.html     # OTP verification
│   │   ├── onboarding.html     # Farm setup
│   │   ├── dashboard.html      # Main farm dashboard
│   │   ├── field-details.html  # Field & zone inspector
│   │   ├── agents.html         # AI agents console
│   │   ├── agent-details.html  # Agent deep-dive
│   │   ├── action-plans.html   # Action plan approval
│   │   ├── execution.html      # Execution center
│   │   ├── market.html         # Mandi intelligence
│   │   ├── notifications.html  # Alert center
│   │   ├── reports.html        # Agronomy reports
│   │   ├── simulation.html     # Simulation center
│   │   ├── settings.html       # Profile & settings
│   │   └── admin.html          # Admin panel
│   ├── css/
│   │   ├── variables.css       # Design tokens (Green/White/Dark)
│   │   ├── reset.css           # Normalize
│   │   ├── layout.css          # App shell, sidebar, header
│   │   ├── components.css      # Reusable UI components
│   │   ├── themes.css          # Light/Dark/System theme engine
│   │   ├── responsive.css      # Mobile breakpoints
│   │   └── *.css               # Feature stylesheets
│   ├── js/
│   │   ├── config.js           # Runtime config & API base URL
│   │   ├── api.js              # Centralized API service layer
│   │   ├── state.js            # Client-side reactive state manager
│   │   ├── utils.js            # Shared utility functions
│   │   ├── auth.js             # OTP authentication & session guards
│   │   ├── theme.js            # Theme manager (Light/Dark/System)
│   │   ├── ui.js               # App shell, navigation, toasts
│   │   ├── charts.js           # Zero-dependency SVG chart library
│   │   ├── map.js              # SVG zone map controller
│   │   └── *.js                # Page-specific controllers
│   └── assets/
│       └── icons/              # SVG icons
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app entrypoint
│   │   ├── api/routes/         # REST route controllers
│   │   ├── models/             # SQLAlchemy ORM models
│   │   └── services/           # Business logic & AI agents
│   └── requirements.txt
├── .github/workflows/
│   └── deploy.yml              # GitHub Pages CI/CD
├── .env.example                # Environment variable template
└── README.md
```

---

## 🔧 Local Development

### Prerequisites
- Python 3.11+
- Node.js (optional — only for local static server)

### 1. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp ../.env.example .env
# Edit .env with your credentials
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
# Serve statically (any method works — no Node required)
cd frontend
python -m http.server 3000

# OR use the VS Code Live Server extension
# OR use npx serve frontend/
```

Then open: `http://localhost:3000/pages/dashboard.html`

### 3. Demo Login

| Field | Value |
|---|---|
| Mobile | `+91 98765 43210` |
| OTP | `123456` (mock, always accepted in demo mode) |

---

## 🌐 Deployment

### GitHub Pages (Frontend)

The frontend deploys automatically on every push to `main` via GitHub Actions:

```yaml
# .github/workflows/deploy.yml
```

### Render (Backend)

1. Connect your GitHub repo to [render.com](https://render.com)
2. Set **Root Directory** → `backend/`
3. Set **Build Command** → `pip install -r requirements.txt`
4. Set **Start Command** → `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables from `.env.example`

---

## 🔌 API Contracts

Full contract at `frontend/js/api.js`. Key endpoints:

```http
POST /api/auth/send-otp
POST /api/auth/verify-otp
GET  /api/farms
GET  /api/sensors/readings
GET  /api/weather/live
GET  /api/agents/status
GET  /api/risks
POST /api/actions/{id}/approve
POST /api/simulation/water-stress
GET  /api/simulation/status
```

---

## 🧪 Hackathon Demo Flow (Section 49)

The fastest way to demonstrate the full autonomous loop:

1. Open **Simulation Center** → click **🌡️ Simulate Water Stress**
2. Watch the **Status Dashboard** — soil moisture drops to 17.8%
3. Navigate to **Dashboard** — Priority Alert appears automatically
4. Open **Action Plans** — Irrigation Agent has generated `#AP-2026-092`
5. Click **Approve** — execution starts
6. Open **Execution Center** — drip cycle runs in real time
7. Return to **Dashboard** — moisture recovers, loop resets to Monitor

---

## 📋 Environment Variables

See `.env.example` for the complete list.

---

## 🙏 Credits

- **Weather Data**: [Open-Meteo](https://open-meteo.com/) (free, no API key)
- **Design System**: Custom Green & White design system with Dark Mode
- **Icons**: Custom SVG sprout icons

---

## 📄 License

MIT License — see `LICENSE` for details.
