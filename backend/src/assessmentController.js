import { calculateAssessment, calculateScenario, normalizeEnvironment, num } from "./assessmentEngine.js";
import { getLiveEnvironment } from "./weatherService.js";
import { verifyRooftopImage } from "./visionService.js";
import { BUILD_VERSION } from "./env.js";
import { readJsonBody } from "./bodyParser.js";
import { sendJson, handleServerError } from "./errorHandler.js";

export async function handleEnvironment(req, res) {
  try {
    const body = await readJsonBody(req);
    try {
      const environment = await getLiveEnvironment(num(body.latitude), num(body.longitude));
      return sendJson(res, 200, { ok: true, environment });
    } catch (err) {
      return sendJson(res, 200, {
        ok: true,
        environment: normalizeEnvironment({ source: "prototype-fallback" }),
        warning: "Live environmental data was unavailable; fallback values were returned."
      });
    }
  } catch (err) {
    return handleServerError(res, err);
  }
}

export async function handleAssessment(req, res) {
  try {
    const body = await readJsonBody(req);
    if (!body || !Number.isFinite(Number(body.roofAreaSqFt))) {
      return sendJson(res, 400, { ok: false, error: "roofAreaSqFt is required and must be numeric." });
    }
    const assessment = await calculateAssessment(body);
    return sendJson(res, 200, { ok: true, assessment });
  } catch (err) {
    return handleServerError(res, err);
  }
}

export async function handleScenario(req, res) {
  try {
    const body = await readJsonBody(req);
    if (!body || !Number.isFinite(Number(body.roofAreaSqFt))) {
      return sendJson(res, 400, { ok: false, error: "roofAreaSqFt is required and must be numeric." });
    }
    const result = calculateScenario(body);
    return sendJson(res, 200, { ok: true, ...result });
  } catch (err) {
    return handleServerError(res, err);
  }
}

export async function handleVerifyRooftop(req, res) {
  try {
    const body = await readJsonBody(req);
    const result = await verifyRooftopImage(body.imageBase64, body.mimeType);
    if (!result.ok) {
      return sendJson(res, 200, {
        ok: false,
        error: result.error,
        quotaExceeded: !!result.quotaExceeded,
        provider: result.provider,
        buildVersion: BUILD_VERSION
      });
    }
    return sendJson(res, 200, {
      ok: true,
      isRooftop: result.isRooftop,
      containsPerson: result.containsPerson,
      confidence: result.confidence,
      detectedSubject: result.detectedSubject,
      reason: result.reason,
      modelUsed: result.modelUsed,
      provider: result.provider,
      buildVersion: BUILD_VERSION
    });
  } catch (err) {
    return handleServerError(res, err);
  }
}
