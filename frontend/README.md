# KrishiNirnay AI — Frontend

Autonomous Farm-to-Field Advisory & Action Orchestration Platform Frontend.

Built with **HTML5, CSS3, and Vanilla JavaScript (ES6+)** for pure static hosting on **GitHub Pages**, communicating with a **FastAPI** backend hosted on **Render**.

---

## 🌾 Tech Stack & Architectural Principles

- **Zero Build Frameworks**: No React, Vue, Vite, TypeScript, Tailwind, or Webpack. Fast, direct, native web standards.
- **Static Compatibility**: Uses relative file referencing (`./`, `../`) across all HTML, CSS, and JS files, ensuring compatibility with GitHub Pages repo paths (`https://<username>.github.io/<repository>/`).
- **Farmer-First Design System**: Fresh green (`#16A34A`) and clean white palette, high-contrast readable typography (Inter/Plus Jakarta Sans), dark theme toggle, accessible mobile UI.
- **IoT & AI Transparence**: Explicit data labeling (`LIVE`, `SIMULATED — Virtual IoT`, `AI GENERATED`, `MODEL`).

---

## 📁 Directory Structure

```text
frontend/
├── index.html                  # Root gateway & authentication router
├── pages/                      # Application sub-pages
│   ├── login.html              # Farmer mobile OTP login
│   ├── verify-otp.html         # OTP verification
│   ├── onboarding.html        # Farm setup / profile onboarding
│   ├── dashboard.html          # Operational field dashboard
│   ├── field-details.html      # Detailed field condition & soil telemetry
│   ├── agents.html             # Autonomous AI agents overview
│   ├── agent-details.html      # Individual agent reasoning & explainability
│   ├── action-plans.html       # Farmer advisory & action approval
│   ├── execution.html          # Smart actuation & task execution center
│   ├── market.html             # Mandi prices & APMC market insights
│   ├── notifications.html      # System alerts & notification center
│   ├── reports.html            # Agronomy reports & resource savings
│   ├── simulation.html         # What-if agricultural simulation center
│   ├── settings.html           # Appearance, farm profile & configuration
│   └── admin.html              # Render API health check & telemetry diagnostics
├── components/                 # Reusable UI component modules
├── assets/                     # Static media
│   ├── icons/                  # Agricultural & system SVG icons
│   ├── images/                 # Field imagery & brand visuals
│   └── illustrations/          # Farmer onboarding illustrations
├── css/                        # Modular CSS architecture
│   ├── variables.css           # Color tokens, spacing, typography & themes
│   ├── reset.css               # Clean box model reset
│   ├── layout.css              # App shell, grid, sidebar & responsive containers
│   ├── components.css          # Cards, buttons, badges, tables & form controls
│   ├── auth.css                # Farmer OTP authentication screens
│   ├── dashboard.css           # Farm metrics & operational loop styling
│   ├── themes.css              # Light, Dark & System theme rules
│   └── ...                     # Page-specific styling modules
└── js/                         # Vanilla ES6 JavaScript modules
    ├── config.js               # Centralized configuration & API base URLs
    ├── api.js                  # Centralized HTTP client & request handling
    ├── auth.js                 # Session token management & route guards
    ├── otp.js                  # Farmer OTP request & verification logic
    ├── state.js                # Shared client-side reactive store
    ├── theme.js                # Instant light/dark theme switcher
    ├── ui.js                   # Common DOM utilities, modals & toasts
    ├── charts.js               # Canvas/SVG sensor telemetry graphs
    └── ...                     # Feature-specific controllers
```

---

## 🚀 Production Deployment to GitHub Pages

1. **Automatic Workflow**: Any push to the `main` branch automatically triggers `.github/workflows/deploy.yml`.
2. **Artifact Directory**: The action uploads the `./frontend` folder directly to GitHub Pages.
3. **Repository Settings**: Ensure **Settings -> Pages -> Source** is set to **GitHub Actions**.

---

## 💻 Local Development

Run any lightweight static HTTP server from the project root or `./frontend`:

```bash
# Option 1: Python HTTP server
python -m http.server 8000

# Option 2: Node npx serve
npx serve frontend

# Option 3: VS Code / IDE Live Server extension
```

Navigate to `http://localhost:8000/frontend/` or `http://localhost:3000/`.
