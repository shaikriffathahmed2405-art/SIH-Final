import { handleHealthCheck } from "./healthController.js";
import { handleGetPlants, handleGetPestManagement } from "./dataController.js";
import { handleEnvironment, handleAssessment, handleScenario, handleVerifyRooftop } from "./assessmentController.js";
import { handleStructuralCheck } from "./structuralController.js";
import { handleBiosolarSynergy } from "./biosolarController.js";
import { handleIoTTelemetry } from "./iotController.js";
import { handleAskAI } from "./aiController.js";
import { handleAutoNotify, handleGetAutoNotifyLogs } from "./notificationController.js";
import { sendJson } from "./errorHandler.js";

export async function routeApiRequest(req, res, pathname) {
  const method = req.method;

  // 1. Health Check
  if (method === "GET" && pathname === "/api/health") {
    return handleHealthCheck(req, res);
  }

  // 2. Data Catalogs
  if (method === "GET" && pathname === "/api/plants") {
    return handleGetPlants(req, res);
  }
  if (method === "GET" && pathname === "/api/pest-management") {
    return handleGetPestManagement(req, res);
  }

  // 3. Environmental & Assessment
  if (method === "POST" && pathname === "/api/environment") {
    return handleEnvironment(req, res);
  }
  if (method === "POST" && pathname === "/api/assessment") {
    return handleAssessment(req, res);
  }
  if (method === "POST" && pathname === "/api/scenario") {
    return handleScenario(req, res);
  }
  if (method === "POST" && pathname === "/api/verify-rooftop") {
    return handleVerifyRooftop(req, res);
  }

  // 4. Structural Safety
  if (method === "POST" && pathname === "/api/structural-check") {
    return handleStructuralCheck(req, res);
  }

  // 5. Biosolar PV Micro-Cooling Synergy
  if (method === "POST" && (pathname === "/api/biosolar-synergy" || pathname === "/api/biosolar" || pathname === "/api/biosolar-roi")) {
    return handleBiosolarSynergy(req, res);
  }

  // 6. IoT Telemetry
  if (method === "POST" && pathname === "/api/iot-telemetry") {
    return handleIoTTelemetry(req, res);
  }

  // 7. GreenAI Assistant
  if (method === "POST" && pathname === "/api/ask-ai") {
    return handleAskAI(req, res);
  }

  // 8. Auto Notifications & Logs
  if (method === "POST" && pathname === "/api/auto-notify") {
    return handleAutoNotify(req, res);
  }
  if (method === "GET" && pathname === "/api/auto-notify-logs") {
    return handleGetAutoNotifyLogs(req, res);
  }

  // Fallback 404 for unhandled API routes
  if (pathname.startsWith("/api/")) {
    return sendJson(res, 404, { ok: false, error: `API route not found: ${method} ${pathname}` });
  }

  return false; // Not an API route
}
