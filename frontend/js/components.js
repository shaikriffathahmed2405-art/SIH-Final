// Shared page components.

function initHeaderNav() {
  const currentPath = window.location.pathname.toLowerCase();
  const page = currentPath.split("/").pop() || "index.html";

  // Map each tab to its page.
  const tabs = [
    { id: "home", href: "index.html", label: "Home", icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>` },
    { id: "assessment", href: "assessment.html", label: "Assessment", icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>` },
    { id: "results", href: "results.html", label: "Results & Impact", icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M7 3h8l4 4v14H7z"/><path d="M9 12h6M9 16h6"/></svg>`, hasDot: true },
    { id: "structural", href: "structural.html", label: "IS 875 Structural", icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>` },
    { id: "biosolar", href: "biosolar.html", label: "Biosolar Synergy", icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2"/></svg>` },
    { id: "iot", href: "iot.html", label: "Weather-Aware Irrigation", icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M2 12h5l3 8 4-16 3 8h5"/></svg>` },
    { id: "calculations", href: "calculations.html", label: "Sensitivity Modeler", icon: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h8"/></svg>` }
  ];

  const navEl = $("tabnav");
  if (navEl) {
    navEl.innerHTML = tabs.map(t => {
      let isActive = false;
      if (page === t.href || (page === "index.html" && t.id === "home") || (page === "" && t.id === "home") || (page === "/" && t.id === "home")) {
        isActive = true;
      }
      const showDot = t.hasDot && state && state.currentAssessment;
      return `
        <a href="${t.href}" class="tab-btn ${isActive ? "active" : ""} ${showDot ? "has-data" : ""}" data-page="${t.id}">
          ${t.icon}
          <span>${t.label}</span>
          ${t.hasDot ? '<span class="dot"></span>' : ''}
        </a>
      `;
    }).join("");
  }

  // Start a fresh assessment.
  const newBtn = $("newAssessmentBtn");
  if (newBtn) {
    newBtn.onclick = () => {
      saveState({
        currentAssessment: null,
        imageReady: false,
        imageValid: false
      });
      if (window.location.pathname.includes("assessment.html")) {
        window.location.reload();
      } else {
        window.location.href = "assessment.html";
      }
    };
  }

  // Print the report.
  const reportBtn = $("reportBtn");
  if (reportBtn) {
    reportBtn.onclick = () => {
      const dprDate = $("dprDate");
      if (dprDate) {
        dprDate.textContent = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
      }
      window.print();
    };
  }

  // Show whether the API is reachable.
  checkBackendHealth();
}

async function checkBackendHealth() {
  const badge = $("backendBadge");
  if (!badge) return;

  const updateBadge = (isOnline, details = null) => {
    if (isOnline) {
      badge.textContent = "API CONNECTED";
      badge.className = "badge gold";
      badge.title = `Backend REST API Server connected: ${typeof API_BASE_URL !== "undefined" ? API_BASE_URL : "Render API"} (Version ${details?.version || "2.2.0"})`;
    } else {
      badge.textContent = "STANDALONE ENGINE";
      badge.className = "badge sky";
      badge.title = "Backend unreachable — running with client-side fallback calculation engine.";
    }
  };

  try {
    if (typeof GreenRoofAPI !== "undefined" && typeof GreenRoofAPI.checkHealth === "function") {
      const res = await GreenRoofAPI.checkHealth();
      updateBadge(res.ok && res.data?.ok === true, res.data);
    } else {
      const res = await (typeof apiFetch === "function" ? apiFetch("/api/health", { method: "GET" }) : fetch("/api/health", { method: "GET" }));
      const data = await res.json();
      updateBadge(data && data.ok === true, data);
    }
  } catch (e) {
    updateBadge(false);
  }
}

document.addEventListener("DOMContentLoaded", initHeaderNav);
window.addEventListener("focus", checkBackendHealth);

