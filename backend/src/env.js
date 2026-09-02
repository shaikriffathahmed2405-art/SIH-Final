import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const BACKEND_DIR = path.resolve(__dirname, "..");
export const DATA_DIR = path.join(BACKEND_DIR, "data");

export const PORT = Number(process.env.PORT || 8787);

// Google Gemini API Configuration
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
export const GEMINI_MODEL_FALLBACKS = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-latest"];

// xAI Grok Configuration
export const XAI_API_KEY = process.env.XAI_API_KEY || "";
export const GROK_MODEL = process.env.GROK_MODEL || "grok-4.6";
export const GROK_MODEL_FALLBACKS = ["grok-4.6", "grok-4.5", "grok-4.3"];

// Groq Vision Configuration
export const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
export const GROQ_MODEL = process.env.GROQ_MODEL || "qwen/qwen3.6-27b";
export const GROQ_MODEL_FALLBACKS = ["qwen/qwen3.6-27b", "qwen/qwen3.8-27b"];

// WhatsApp Cloud & Twilio API Configuration
export const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
export const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || "";
export const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
export const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

export const BUILD_VERSION = "v13-decoupled-backend";
