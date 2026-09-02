import { getIoTTelemetry } from "./iotService.js";
import { readJsonBody } from "./bodyParser.js";
import { sendJson, handleServerError } from "./errorHandler.js";

export async function handleIoTTelemetry(req, res) {
  try {
    const body = await readJsonBody(req);
    const telemetry = getIoTTelemetry(body);
    return sendJson(res, 200, { ok: true, telemetry });
  } catch (err) {
    return handleServerError(res, err);
  }
}
