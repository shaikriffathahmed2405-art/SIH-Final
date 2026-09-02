import {
  GROQ_API_KEY, GROQ_MODEL, GROQ_MODEL_FALLBACKS,
  XAI_API_KEY, GROK_MODEL, GROK_MODEL_FALLBACKS,
  GEMINI_API_KEY, GEMINI_MODEL, GEMINI_MODEL_FALLBACKS
} from "./env.js";
import { clamp, num } from "./assessmentEngine.js";

export const ROOFTOP_VALIDATION_PROMPT = [
  "You are the image-validation gate for a rooftop-greening assessment app called Green Roof AI.",
  "Look ONLY at the attached photo and answer two separate questions about it.",
  "QUESTION 1 (containsPerson): Does the photo show a person, a person's face, a portrait, a selfie, a child, or any human being as a recognizable subject anywhere in the frame — foreground or background, close-up or distant? Answer true even if the person is small, partial, blurry, or off to the side. Answer false only if the photo shows no human being at all.",
  "QUESTION 2 (isRooftop): Setting people aside, is the photo's main subject a genuine building rooftop, terrace, flat roof deck, or roof-level balcony — the kind of open outdoor surface someone would consider installing a green roof / rooftop garden on (bare concrete/tiled terrace, industrial flat roof, parapet walls, water tanks, roof railings, HVAC units, or a roof seen from above or at an angle)? A rooftop photo that happens to show a distant city skyline or other buildings in the background still counts as isRooftop: true — only judge the surface in the foreground/main subject. Answer isRooftop: false for anything that is not actually a rooftop surface: indoor rooms, streets at ground level, vehicle interiors, food, screenshots, documents, or unrelated objects.",
  "Be strict and literal — do not guess in favor of acceptance. If you are not reasonably confident the photo is a rooftop, answer isRooftop: false.",
  "Respond with STRICT JSON ONLY — no markdown fences, no commentary — in exactly this shape:",
  '{"containsPerson": boolean, "isRooftop": boolean, "confidence": number between 0 and 100, "detectedSubject": "short phrase describing what the photo actually shows", "reason": "one concise sentence explaining the decision"}'
].join(" ");

export function parseRooftopVerificationText(text) {
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { parsed = JSON.parse(match[0]); } catch { parsed = null; }
    }
  }

  if (!parsed || typeof parsed.isRooftop !== "boolean") {
    return { ok: false, error: "Could not parse the AI verification response." };
  }

  const confidence = clamp(num(parsed.confidence, 80), 0, 100);
  const containsPerson = parsed.containsPerson === true;
  const isRooftop = parsed.isRooftop && !containsPerson;
  let reason = String(parsed.reason || "").slice(0, 400);
  if (containsPerson && parsed.isRooftop) {
    reason = "A person was detected in the photo. Please upload a rooftop photo with no people in it.";
  }

  return {
    ok: true,
    isRooftop,
    containsPerson,
    confidence,
    detectedSubject: String(parsed.detectedSubject || "").slice(0, 200),
    reason
  };
}

export async function verifyRooftopWithGroq(base64Image, mimeType) {
  if (!GROQ_API_KEY) {
    return { ok: false, error: "Groq is not configured (missing GROQ_API_KEY)." };
  }
  if (!base64Image || typeof base64Image !== "string") {
    return { ok: false, error: "No image data received." };
  }

  const modelsToTry = [GROQ_MODEL, ...GROQ_MODEL_FALLBACKS.filter(m => m !== GROQ_MODEL)];
  let lastError = null;
  let data = null;
  let modelUsed = null;

  for (const model of modelsToTry) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [{
            role: "user",
            content: [
              { type: "text", text: ROOFTOP_VALIDATION_PROMPT },
              { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${base64Image}` } }
            ]
          }]
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!r.ok) {
        const errText = await r.text().catch(() => "");
        lastError = `Groq API error ${r.status}: ${errText.slice(0, 300)}`;
        if (r.status === 404) continue;
        if (r.status === 429) {
          return {
            ok: false,
            quotaExceeded: true,
            error: "You've hit the Groq API's rate limit / quota for this key."
          };
        }
        return { ok: false, error: lastError };
      }

      data = await r.json();
      modelUsed = model;
      break;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err.name === "AbortError" ? "Groq API request timed out." : `Groq API request failed: ${err.message}`;
    }
  }

  if (!data) {
    return { ok: false, error: lastError || "All Groq models failed." };
  }

  try {
    const text = (data?.choices?.[0]?.message?.content || "").trim();
    if (!text) {
      return { ok: false, error: "Groq returned an empty response." };
    }

    const parsed = parseRooftopVerificationText(text);
    if (!parsed.ok) return parsed;
    return { ...parsed, modelUsed };
  } catch (err) {
    return { ok: false, error: `Groq rooftop verification failed: ${err.message || err}` };
  }
}

export async function verifyRooftopWithGrok(base64Image, mimeType) {
  if (!XAI_API_KEY) {
    return { ok: false, error: "Grok is not configured (missing XAI_API_KEY)." };
  }
  if (!base64Image || typeof base64Image !== "string") {
    return { ok: false, error: "No image data received." };
  }

  const body = {
    model: GROK_MODEL,
    input: [{
      role: "user",
      content: [
        { type: "input_image", image_url: `data:${mimeType || "image/jpeg"};base64,${base64Image}`, detail: "high" },
        { type: "input_text", text: ROOFTOP_VALIDATION_PROMPT }
      ]
    }],
    store: false
  };

  const modelsToTry = [GROK_MODEL, ...GROK_MODEL_FALLBACKS.filter(m => m !== GROK_MODEL)];
  let lastError = null;
  let data = null;
  let modelUsed = null;

  for (const model of modelsToTry) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const r = await fetch("https://api.x.ai/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${XAI_API_KEY}`
        },
        body: JSON.stringify({ ...body, model }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!r.ok) {
        const errText = await r.text().catch(() => "");
        lastError = `Grok API error ${r.status}: ${errText.slice(0, 300)}`;
        if (r.status === 404) continue;
        if (r.status === 429) {
          return {
            ok: false,
            quotaExceeded: true,
            error: "You've hit the Grok API's rate limit / quota for this key."
          };
        }
        return { ok: false, error: lastError };
      }

      data = await r.json();
      modelUsed = model;
      break;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err.name === "AbortError" ? "Grok API request timed out." : `Grok API request failed: ${err.message}`;
    }
  }

  if (!data) {
    return { ok: false, error: lastError || "All Grok models failed." };
  }

  try {
    const messageItem = (data.output || []).find(item => item.type === "message" && item.role === "assistant");
    const text = (messageItem?.content || [])
      .map(c => c.text || "")
      .join("")
      .trim();

    if (!text) {
      return { ok: false, error: "Grok returned an empty response." };
    }

    const parsed = parseRooftopVerificationText(text);
    if (!parsed.ok) return parsed;
    return { ...parsed, modelUsed };
  } catch (err) {
    return { ok: false, error: `Grok rooftop verification failed: ${err.message || err}` };
  }
}

export async function verifyRooftopWithGemini(base64Image, mimeType) {
  if (!GEMINI_API_KEY) {
    return { ok: false, error: "AI rooftop verification is not configured (missing GEMINI_API_KEY)." };
  }
  if (!base64Image || typeof base64Image !== "string") {
    return { ok: false, error: "No image data received." };
  }

  const prompt = ROOFTOP_VALIDATION_PROMPT;
  const body = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType || "image/jpeg", data: base64Image } }
      ]
    }],
    generationConfig: {
      temperature: 0,
      response_mime_type: "application/json"
    }
  };

  const modelsToTry = [GEMINI_MODEL, ...GEMINI_MODEL_FALLBACKS.filter(m => m !== GEMINI_MODEL)];
  let lastError = null;
  let data = null;
  let modelUsed = null;

  for (const model of modelsToTry) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!r.ok) {
        const errText = await r.text().catch(() => "");
        lastError = `Gemini API error ${r.status}: ${errText.slice(0, 300)}`;
        if (r.status === 404) continue;
        if (r.status === 429) {
          return {
            ok: false,
            quotaExceeded: true,
            error: "You've hit the Gemini API's rate limit / free-tier quota for this key."
          };
        }
        return { ok: false, error: lastError };
      }

      data = await r.json();
      modelUsed = model;
      break;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err.name === "AbortError" ? "Gemini API request timed out." : `Gemini API request failed: ${err.message}`;
    }
  }

  if (!data) {
    return { ok: false, error: lastError || "All Gemini models failed." };
  }

  try {
    const blocked = data?.promptFeedback?.blockReason;
    if (blocked) {
      return { ok: false, error: `Image was blocked by the AI safety filter (${blocked}).` };
    }

    const text = (data?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
    if (!text) {
      return { ok: false, error: "Gemini returned an empty response." };
    }

    const parsed = parseRooftopVerificationText(text);
    if (!parsed.ok) return parsed;
    return { ...parsed, modelUsed };
  } catch (err) {
    return { ok: false, error: `AI rooftop verification failed: ${err.message || err}` };
  }
}

export async function verifyRooftopImage(base64Image, mimeType) {
  const attempts = [];

  if (GROQ_API_KEY) {
    const groqResult = await verifyRooftopWithGroq(base64Image, mimeType);
    if (groqResult.ok) return { ...groqResult, provider: "groq" };
    attempts.push(`Groq failed (${groqResult.error})`);
  }

  if (XAI_API_KEY) {
    const grokResult = await verifyRooftopWithGrok(base64Image, mimeType);
    if (grokResult.ok) return { ...grokResult, provider: "grok" };
    attempts.push(`Grok failed (${grokResult.error})`);
  }

  const geminiResult = await verifyRooftopWithGemini(base64Image, mimeType);
  if (geminiResult.ok) return { ...geminiResult, provider: "gemini" };
  attempts.push(`Gemini failed (${geminiResult.error})`);

  return {
    ok: false,
    provider: "none",
    error: attempts.join("; "),
    quotaExceeded: !!geminiResult?.quotaExceeded
  };
}
