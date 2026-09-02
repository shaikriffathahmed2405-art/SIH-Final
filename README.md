# Green Roof AI

A prototype for checking whether an existing rooftop is suitable for a lightweight green roof and for estimating the practical cost and environmental impact.

## Why I built this

Most green-roof planning starts with a few separate checks: roof area, structural load, weather, planting, irrigation and cost. This project puts those checks in one place so a user can enter the basic roof details, review the result and move to the structural or biosolar pages when needed.

The app is built as a small Node.js REST backend with a separate browser frontend. It also keeps an offline calculation path because the prototype is meant to be easy to demonstrate without depending on every external service.

## Project layout

```text
Green_Roof_AI/
├── backend/
│   ├── src/
│   │   ├── config/              # Environment values and defaults
│   │   ├── controllers/         # Request handling
│   │   ├── middleware/          # CORS, body parsing and errors
│   │   ├── routes/              # API route registration
│   │   └── services/             # Assessment and integration logic
│   ├── data/                    # Plant and pest-management data
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── api.js               # Backend calls
│   │   ├── config.js             # API URL selection
│   │   ├── state.js              # Browser state
│   │   ├── engine.js             # Offline fallback calculations
│   │   ├── assessment.js         # Assessment and rooftop image view
│   │   ├── results.js             # Results and report rendering
│   │   ├── structural.js          # Structural checker UI
│   │   ├── biosolar.js            # Solar/green-roof calculator
│   │   ├── iot.js                 # Irrigation demo
│   │   ├── chat.js                # Chat widget
│   │   ├── whatsapp.js            # Notification UI
│   │   └── components.js          # Shared page controls
│   ├── index.html
│   ├── assessment.html
│   ├── results.html
│   ├── structural.html
│   ├── biosolar.html
│   ├── iot.html
│   ├── calculations.html
│   └── server.js
│
├── start-dev.js                  # Starts frontend and backend together
├── test.js                       # API integration checks
├── start.bat                     # Windows launcher
├── start.sh                      # Linux/macOS launcher
└── package.json
```

## Main API routes

| Method | Route | Use |
|---|---|---|
| GET | `/api/health` | Check the backend |
| GET | `/api/plants` | Plant catalogue |
| GET | `/api/pest-management` | Pest-management data |
| POST | `/api/environment` | Weather lookup |
| POST | `/api/assessment` | Roof feasibility and cost estimate |
| POST | `/api/verify-rooftop` | Rooftop image check |
| POST | `/api/structural-check` | Roof load check |
| POST | `/api/biosolar-roi` | Solar and green-roof estimate |
| POST | `/api/iot-telemetry` | Irrigation telemetry demo |
| POST | `/api/ask-ai` | GreenAI assistant |
| POST | `/api/auto-notify` | Notification request |
| GET | `/api/auto-notify-logs` | Notification history |
| POST | `/api/scenario` | Compare coverage scenarios |

## Running locally

Install the root dependencies first:

```bash
npm install
```

Start the full app:

```bash
npm start
```

The frontend normally runs on `http://localhost:3000` and the backend on `http://localhost:8787`.

To run them separately:

```bash
npm run start:backend
npm run start:frontend
```

Run the API checks with:

```bash
npm test
```

## Environment values

Copy `backend/.env.example` to `.env` and add only the services you want to use. The local calculations still work when optional provider keys are missing.

## Notes

This is a prototype, not a structural engineering approval tool. Load limits, waterproofing condition and drainage should be checked on site by a qualified professional before construction.
