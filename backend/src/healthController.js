import { sendJson } from "./errorHandler.js";

export function handleHealthCheck(req, res) {
  return sendJson(res, 200, {
    ok: true,
    service: "green-roof-ai-backend",
    version: "2.2.0-sih-pro",
    timestamp: new Date().toISOString(),
    features: [
      "structural-check",
      "biosolar-synergy",
      "iot-telemetry",
      "green-ai",
      "uhi-carbon-model",
      "phased-budgeting"
    ]
  });
}
