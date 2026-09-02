import { getPlants, getPestManagement } from "./dataService.js";
import { sendJson, handleServerError } from "./errorHandler.js";

export async function handleGetPlants(req, res) {
  try {
    const plants = await getPlants();
    return sendJson(res, 200, { count: plants.length, plants });
  } catch (err) {
    return handleServerError(res, err);
  }
}

export async function handleGetPestManagement(req, res) {
  try {
    const items = await getPestManagement();
    return sendJson(res, 200, { items });
  } catch (err) {
    return handleServerError(res, err);
  }
}
