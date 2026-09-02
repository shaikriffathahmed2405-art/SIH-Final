import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_SCRIPT = path.join(__dirname, "backend", "server.js");
const FRONTEND_SCRIPT = path.join(__dirname, "frontend", "server.js");

console.log("\n\x1b[36m====================================================\x1b[0m");
console.log("\x1b[36m   Green Roof AI — Full-Stack Concurrency Runner    \x1b[0m");
console.log("\x1b[36m====================================================\x1b[0m\n");

function startProcess(name, scriptPath, color, env = {}) {
  const child = spawn(process.execPath, [scriptPath], {
    env: { ...process.env, ...env },
    stdio: ["pipe", "pipe", "pipe"]
  });

  child.stdout.on("data", data => {
    const lines = data.toString().split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      console.log(`${color}[${name}]\x1b[0m ${line}`);
    }
  });

  child.stderr.on("data", data => {
    const lines = data.toString().split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      console.error(`${color}[${name} ERR]\x1b[0m ${line}`);
    }
  });

  child.on("close", code => {
    console.log(`${color}[${name}]\x1b[0m Process exited with code ${code}`);
  });

  return child;
}

const backendProc = startProcess("BACKEND", BACKEND_SCRIPT, "\x1b[32m", { PORT: "8787" });
const frontendProc = startProcess("FRONTEND", FRONTEND_SCRIPT, "\x1b[34m", { FRONTEND_PORT: "3000" });

function cleanup() {
  console.log("\n\x1b[33mShutting down Green Roof AI services...\x1b[0m");
  try { backendProc.kill(); } catch (e) {}
  try { frontendProc.kill(); } catch (e) {}
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
