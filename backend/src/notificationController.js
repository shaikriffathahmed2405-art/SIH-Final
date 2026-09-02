import { dispatchAutoNotification, getNotificationLogs } from "./notificationService.js";
import { readJsonBody } from "./bodyParser.js";
import { sendJson, handleServerError } from "./errorHandler.js";

export async function handleAutoNotify(req, res) {
  try {
    const body = await readJsonBody(req);
    const entry = await dispatchAutoNotification(body || {});
    return sendJson(res, 200, { ok: true, log: entry, allLogs: getNotificationLogs() });
  } catch (err) {
    return handleServerError(res, err);
  }
}

export function handleGetAutoNotifyLogs(req, res) {
  try {
    return sendJson(res, 200, { ok: true, logs: getNotificationLogs() });
  } catch (err) {
    return handleServerError(res, err);
  }
}
