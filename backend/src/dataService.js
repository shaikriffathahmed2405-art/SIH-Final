import fs from "node:fs/promises";
import path from "node:path";
import { DATA_DIR } from "./env.js";

let plantsCache = null;
let pestManagementCache = null;

export async function getPlants() {
  if (!plantsCache) {
    const raw = await fs.readFile(path.join(DATA_DIR, "plants.json"), "utf8");
    plantsCache = JSON.parse(raw);
  }
  return plantsCache;
}

export async function getPestManagement() {
  if (!pestManagementCache) {
    const raw = await fs.readFile(path.join(DATA_DIR, "pest_management.json"), "utf8");
    pestManagementCache = JSON.parse(raw);
  }
  return pestManagementCache;
}
