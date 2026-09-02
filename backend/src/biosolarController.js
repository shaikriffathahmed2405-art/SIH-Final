import { calculateBiosolarSynergy } from "./biosolarEngine.js";
import { sendJson, handleServerError } from "./errorHandler.js";
import { readJsonBody } from "./bodyParser.js";

export async function handleBiosolarSynergy(req, res) {
  try {
    const body = await readJsonBody(req);
    const biosolar = await calculateBiosolarSynergy(body);
    return sendJson(res, 200, { ok: true, biosolar });
  } catch (err) {
    return handleServerError(res, err);
  }
}
