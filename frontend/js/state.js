// Shared browser state.

const $ = id => document.getElementById(id);

const defaultState = {
  lat: 12.9716,
  lon: 77.5946,
  place: "Bengaluru, Karnataka (BBMP Zone)",
  temp: 28.5,
  rain: 38,
  annualRain: 950,
  climate: "Tropical Warm",
  greenRatio: 0.22,
  imageReady: false,
  imageValid: false,
  usableAreaPct: 78,
  currentAssessment: null,
  analyzedDeckType: "concrete_rcc",
  roofArea: 650,
  coverage: 75,
  costTier: "standard",
  phone: ""
};

let state = { ...defaultState };

function loadState() {
  try {
    const raw = localStorage.getItem("gra_state");
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...defaultState, ...parsed };
    }
  } catch (e) {
    console.warn("Failed to parse stored state:", e);
  }
  return state;
}

function saveState(updates = {}) {
  state = { ...state, ...updates };
  try {
    localStorage.setItem("gra_state", JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to persist state:", e);
  }
}

// Toast messages.
function toast(title, msg, type = "ok") {
  let stack = $("toastStack");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "toastStack";
    stack.className = "toast-stack";
    stack.style.cssText = "position:fixed;bottom:20px;left:20px;z-index:9999;display:flex;flex-direction:column;gap:8px";
    document.body.appendChild(stack);
  }
  const el = document.createElement("div");
  el.style.cssText = `min-width:240px;max-width:340px;padding:11px 14px;border-radius:12px;background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow);font-size:12px;border-left:4px solid ${type === "err" ? "var(--clay)" : type === "warn" ? "var(--amber)" : "var(--canopy)"};animation:rise .25s ease both;`;
  el.innerHTML = `<b>${title}</b><div style="margin-top:2px;color:var(--muted)">${msg || ""}</div>`;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity .3s ease, transform .3s ease";
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    setTimeout(() => el.remove(), 320);
  }, 3800);
}

// Theme preference.
function initTheme() {
  try {
    const saved = localStorage.getItem("gra_theme");
    if (saved) {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch (e) {}

  const toggleBtn = $("themeToggle");
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      const cur = document.documentElement.getAttribute("data-theme");
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("gra_theme", next); } catch (e) {}
    };
  }
}

// Load saved state when the page starts.
loadState();
document.addEventListener("DOMContentLoaded", initTheme);
