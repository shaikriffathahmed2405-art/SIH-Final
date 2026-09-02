import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { URL, fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = __dirname;

const PORT = Number(process.env.FRONTEND_PORT || process.env.PORT || 3000);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  let rel = pathname === "/" || pathname === "/home" || pathname === "/home.html" ? "index.html" : pathname.replace(/^\/+/, "");
  const normalized = path.normalize(rel);
  
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    return res.end("Forbidden");
  }

  let file = path.join(FRONTEND_DIR, normalized);

  try {
    let data;
    try {
      data = await fs.readFile(file);
    } catch (e) {
      if (!path.extname(file)) {
        file = file + ".html";
        data = await fs.readFile(file);
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("404 Not Found");
      }
    }

    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*"
    });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Not Found");
  }
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`\n[INFO] Frontend port ${PORT} is already in use by an active instance.`);
    console.log(`Open http://localhost:${PORT} in your browser.\n`);
    process.exit(0);
  } else {
    console.error("Frontend Server error:", err);
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`\n💻 Green Roof AI — Frontend Web Client`);
  console.log(`🌐 Accessible at http://localhost:${PORT}`);
  console.log(`📱 Landing Page: http://localhost:${PORT}/index.html\n`);
});

export default server;
