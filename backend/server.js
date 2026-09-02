import http from "node:http";
import { URL } from "node:url";
import { PORT, BUILD_VERSION } from "./src/env.js";
import { handleCors } from "./src/cors.js";
import { routeApiRequest } from "./src/apiRouter.js";
import { sendJson, handleServerError } from "./src/errorHandler.js";

const server = http.createServer(async (req, res) => {
  // 1. Handle CORS Preflight and set standard CORS headers
  if (handleCors(req, res)) return;

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  try {
    // 2. Dispatch REST API Route
    const handled = await routeApiRequest(req, res, url.pathname);
    if (handled !== false) return;

    // 3. Fallback for root or unrecognized routes on API Server
    if (url.pathname === "/") {
      return sendJson(res, 200, {
        service: "green-roof-ai-backend",
        status: "online",
        build: BUILD_VERSION,
        docs: "Access REST APIs via /api/*",
        health: "/api/health"
      });
    }

    return sendJson(res, 404, { ok: false, error: "Route not found on API server." });
  } catch (err) {
    return handleServerError(res, err);
  }
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`\n[INFO] Backend API port ${PORT} is already in use by an active instance.`);
    console.log(`Backend is accessible at http://localhost:${PORT}/api/health\n`);
    process.exit(0);
  } else {
    console.error("Backend Server error:", err);
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`\n🌿 Green Roof AI — Backend REST API Server`);
  console.log(`🚀 Running at http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health\n`);
});

export default server;
