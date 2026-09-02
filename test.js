import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_TEST_PORT = 8789;
const FRONTEND_TEST_PORT = 3001;
const BACKEND_URL = `http://localhost:${BACKEND_TEST_PORT}`;
const FRONTEND_URL = `http://localhost:${FRONTEND_TEST_PORT}`;

let backendProcess = null;
let frontendProcess = null;
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${message}`);
    failed++;
  }
}

async function fetchBackendJson(endpoint, options = {}) {
  const url = `${BACKEND_URL}${endpoint}`;
  const res = await fetch(url, options);
  const data = await res.json();
  return { status: res.status, headers: res.headers, data };
}

async function fetchFrontendRaw(endpoint, options = {}) {
  const url = `${FRONTEND_URL}${endpoint}`;
  const res = await fetch(url, options);
  const text = await res.text();
  return { status: res.status, headers: res.headers, text };
}

async function startBackend() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, "backend", "server.js");
    backendProcess = spawn(process.execPath, [serverPath], {
      env: { ...process.env, PORT: String(BACKEND_TEST_PORT) },
      stdio: ["pipe", "pipe", "pipe"]
    });

    let started = false;
    backendProcess.stdout.on("data", data => {
      const out = data.toString();
      if (out.includes("Running at") && !started) {
        started = true;
        resolve();
      }
    });

    backendProcess.stderr.on("data", data => {
      // console.error(data.toString());
    });

    backendProcess.on("error", reject);

    setTimeout(() => {
      if (!started) reject(new Error("Backend startup timed out"));
    }, 8000);
  });
}

async function startFrontend() {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, "frontend", "server.js");
    frontendProcess = spawn(process.execPath, [serverPath], {
      env: { ...process.env, FRONTEND_PORT: String(FRONTEND_TEST_PORT) },
      stdio: ["pipe", "pipe", "pipe"]
    });

    let started = false;
    frontendProcess.stdout.on("data", data => {
      const out = data.toString();
      if (out.includes("Accessible at") && !started) {
        started = true;
        resolve();
      }
    });

    frontendProcess.stderr.on("data", data => {
      // console.error(data.toString());
    });

    frontendProcess.on("error", reject);

    setTimeout(() => {
      if (!started) reject(new Error("Frontend startup timed out"));
    }, 8000);
  });
}

function stopServices() {
  if (backendProcess) {
    try { backendProcess.kill(); } catch (e) {}
  }
  if (frontendProcess) {
    try { frontendProcess.kill(); } catch (e) {}
  }
}

async function runTests() {
  console.log("\n\x1b[36m===============================================================\x1b[0m");
  console.log("\x1b[36m   Green Roof AI — Decoupled Architecture Test Suite          \x1b[0m");
  console.log("\x1b[36m===============================================================\x1b[0m\n");

  try {
    console.log(`[1/4] Starting decoupled Backend API server on port ${BACKEND_TEST_PORT}...`);
    await startBackend();
    console.log("  Backend successfully started.\n");

    console.log(`[2/4] Starting decoupled Frontend Web server on port ${FRONTEND_TEST_PORT}...`);
    await startFrontend();
    console.log("  Frontend successfully started.\n");

    console.log("\x1b[33m[3/4] Testing Backend REST API Endpoints...\x1b[0m");

    // 1. Health Check
    {
      const res = await fetchBackendJson("/api/health");
      assert(res.status === 200 && res.data.ok === true, "GET /api/health returns ok: true");
      assert(res.data.service === "green-roof-ai-backend", "GET /api/health service identification");
      assert(Array.isArray(res.data.features) && res.data.features.length > 0, "GET /api/health features list");
      assert(res.headers.get("access-control-allow-origin") === "*", "CORS header Access-Control-Allow-Origin present");
    }

    // 2. Plants Database
    {
      const res = await fetchBackendJson("/api/plants");
      assert(res.status === 200 && res.data.count > 0, `GET /api/plants returns ${res.data.count} plants`);
      assert(res.data.plants[0].name && res.data.plants[0].group, "GET /api/plants has valid plant schemas");
    }

    // 3. Pest Management
    {
      const res = await fetchBackendJson("/api/pest-management");
      assert(res.status === 200 && Array.isArray(res.data.items), "GET /api/pest-management returns items");
    }

    // 5. Environment Forecast
    {
      const res = await fetchBackendJson("/api/environment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: 12.9716, longitude: 77.5946 })
      });
      assert(res.status === 200 && res.data.ok === true, "POST /api/environment returns environmental data");
      assert(typeof res.data.environment.temperatureC === "number", "POST /api/environment includes numeric temperature");
    }

    // 6. Feasibility Assessment Engine
    {
      const res = await fetchBackendJson("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roofAreaSqFt: 650,
          coveragePercent: 75,
          costTier: "standard",
          environment: { temperatureC: 28.5, rainfall7dMm: 38, annualRainfallMm: 950, climate: "Tropical Warm" },
          roof: { structuralVerified: true, waterproofingVerified: true, drainageVerified: true, slabType: "concrete_rcc" },
          visual: { visibleRoofEvidence: 92, usableAreaPercent: 78, greenRatio: 0.22 }
        })
      });
      assert(res.status === 200 && res.data.ok === true, "POST /api/assessment generates assessment");
      const a = res.data.assessment;
      assert(a.recommendation && a.recommendation.score >= 0 && a.recommendation.score <= 100, `POST /api/assessment feasibility score: ${a.recommendation?.score}/100`);
      assert(a.budget && a.budget.recommendedGreenAreaSqFt > 0, "POST /api/assessment calculates recommended green area");
      assert(a.impact && a.impact.estimatedRainwaterCaptureLitresPerYear > 0, "POST /api/assessment calculates rainwater capture");
      assert(a.impact && a.impact.carbonSequestrationKgYr > 0, "POST /api/assessment calculates carbon sequestration");
      assert(a.budget && a.budget.boq && a.budget.boq.drainageTrays, "POST /api/assessment provides Bill of Quantities (BOQ)");
    }

    // 6b. Feasibility Assessment Validation (Bad inputs)
    {
      const res = await fetchBackendJson("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roofAreaSqFt: "invalid" })
      });
      assert(res.status === 400 && res.data.ok === false, "POST /api/assessment returns 400 for non-numeric area");
    }

    // 7. Structural Check (IS 875)
    {
      const res = await fetchBackendJson("/api/structural-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slabType: "rcc_125", mediaDepthMm: 80, buildingAgeYrs: 10 })
      });
      assert(res.status === 200 && res.data.ok === true, "POST /api/structural-check computes structural rating");
      assert(res.data.structural.safetyFactor > 0, `POST /api/structural-check safety factor: ${res.data.structural.safetyFactor}x`);
      assert(res.data.structural.complianceCode.includes("IS 875"), "POST /api/structural-check references IS 875 standard");
    }

    // 8. Biosolar PV Micro-Cooling Synergy
    {
      const res = await fetchBackendJson("/api/biosolar-synergy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solarCapacityKWp: 3.0, roofAreaSqFt: 650, greenCoveragePct: 75, panelType: "monocrystalline" })
      });
      assert(res.status === 200 && res.data.ok === true, "POST /api/biosolar-synergy computes energy boost");
      assert(res.data.biosolar.metrics.solarBoostPercent > 0, `POST /api/biosolar-synergy solar boost: +${res.data.biosolar.metrics.solarBoostPercent}%`);
      assert(res.data.biosolar.metrics.panelTempDropC > 0, `POST /api/biosolar-synergy panel cooling: -${res.data.biosolar.metrics.panelTempDropC}°C`);
    }

    // 9. IoT Telemetry & Actuator Rules
    {
      const dryRes = await fetchBackendJson("/api/iot-telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceDry: true, temperatureC: 36, rainfall7dMm: 0 })
      });
      assert(dryRes.status === 200 && dryRes.data.telemetry.actuator.dripValveState.includes("OPEN"), "POST /api/iot-telemetry (forceDry) opens solenoid valve");

      const rainRes = await fetchBackendJson("/api/iot-telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rainfall7dMm: 40, temperatureC: 28 })
      });
      assert(rainRes.status === 200 && rainRes.data.telemetry.actuator.dripValveState.includes("HELD_OFF"), "POST /api/iot-telemetry (rain forecast) holds valve to save water");
    }

    // 10. Ask AI
    {
      const res = await fetchBackendJson("/api/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "What are the best drought resilient sedum plants for Indian rooftops?" })
      });
      assert(res.status === 200 && res.data.ok === true, "POST /api/ask-ai answers plant query");
      assert(res.data.aiResponse.answer.length > 50, "POST /api/ask-ai response content populated");
    }

    // 11. Auto Notification & Logs
    {
      const res = await fetchBackendJson("/api/auto-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "+91 8520886121", location: "Bengaluru, Karnataka", rainForecast: "38mm" })
      });
      assert(res.status === 200 && res.data.ok === true, "POST /api/auto-notify dispatches message");

      const logsRes = await fetchBackendJson("/api/auto-notify-logs");
      assert(logsRes.status === 200 && logsRes.data.logs.length > 0, "GET /api/auto-notify-logs retrieves notification logs");
    }

    // 12. Sensitivity Scenario Modeler
    {
      const res = await fetchBackendJson("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roofAreaSqFt: 650, coverageA: 50, coverageB: 75 })
      });
      assert(res.status === 200 && res.data.scenarios.length === 2, "POST /api/scenario compares two coverage tiers");
    }

    // 13. Rooftop Image Verification
    {
      const res = await fetchBackendJson("/api/verify-rooftop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: "", mimeType: "image/jpeg" })
      });
      assert(res.status === 200 && res.data.ok === false, "POST /api/verify-rooftop gracefully handles missing image");
    }

    // 14. CORS Preflight OPTIONS Check
    {
      const res = await fetch(`${BACKEND_URL}/api/assessment`, {
        method: "OPTIONS"
      });
      assert(res.status === 204, "OPTIONS /api/assessment returns 204 Preflight OK");
    }

    console.log("\n\x1b[33m[4/4] Testing Frontend Web Client Assets & Pages...\x1b[0m");

    const pages = [
      { path: "/", check: "Green Roof AI" },
      { path: "/index.html", check: "Green Roof AI" },
      { path: "/home.html", check: "Green Roof AI" },
      { path: "/assessment.html", check: "Assessment Studio" },
      { path: "/results.html", check: "Results" },
      { path: "/structural.html", check: "IS 875" },
      { path: "/biosolar.html", check: "Biosolar" },
      { path: "/iot.html", check: "Irrigation" },
      { path: "/calculations.html", check: "Sensitivity" },
      { path: "/css/style.css", check: "--canopy" },
      { path: "/js/config.js", check: "API_BASE_URL" },
      { path: "/js/api.js", check: "GreenRoofAPI" },
      { path: "/js/assessment.js", check: "acceptRooftopImage" },
      { path: "/js/components.js", check: "initHeaderNav" },
      { path: "/js/engine.js", check: "clientCalculateAssessment" },
      { path: "/js/state.js", check: "saveState" }
    ];

    for (const page of pages) {
      const res = await fetchFrontendRaw(page.path);
      const isOk = res.status === 200 && res.text.includes(page.check);
      assert(isOk, `GET Frontend ${page.path} (HTTP 200 & content verified)`);
    }

    // 404 Route Check on Frontend
    {
      const res = await fetchFrontendRaw("/non-existent-page");
      assert(res.status === 404, "GET Frontend /non-existent-page returns HTTP 404");
    }

  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    stopServices();
  }

  console.log("\n\x1b[36m===============================================================\x1b[0m");
  console.log(`\x1b[1mTest Results: \x1b[32m${passed} Passed\x1b[0m, \x1b[31m${failed} Failed\x1b[0m`);
  console.log("\x1b[36m===============================================================\x1b[0m\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
