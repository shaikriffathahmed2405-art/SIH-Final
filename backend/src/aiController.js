import { askGreenAI } from "./aiService.js";
import { readJsonBody } from "./bodyParser.js";
import { sendJson, handleServerError } from "./errorHandler.js";

export async function handleAskAI(req, res) {
  try {
    const body = await readJsonBody(req);
    const aiResponse = askGreenAI(body);
    return sendJson(res, 200, { ok: true, aiResponse });
  } catch (err) {
    return handleServerError(res, err);
  }
}
