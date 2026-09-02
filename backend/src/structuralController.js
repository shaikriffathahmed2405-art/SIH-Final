import { calculateStructuralCheck } from "./structuralEngine.js";
import { readJsonBody } from "./bodyParser.js";
import { sendJson, handleServerError } from "./errorHandler.js";

export async function handleStructuralCheck(req, res) {
  try {
    const body = await readJsonBody(req);
    const structural = calculateStructuralCheck(body);
    return sendJson(res, 200, { ok: true, structural });
  } catch (err) {
    return handleServerError(res, err);
  }
}
