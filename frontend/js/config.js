const RENDER_BACKEND_URL = "https://sih-final-1-3ksw.onrender.com";

const API_BASE_URL = (() => {
  // Use a supplied API URL first.
  if (typeof window !== "undefined") {
    if (window.__GREEN_ROOF_API_BASE__) return window.__GREEN_ROOF_API_BASE__;
    if (window.API_BASE_URL) return window.API_BASE_URL;
    
    // A saved browser override is useful when testing a different backend.
    try {
      const stored = localStorage.getItem("green_roof_api_url");
      if (stored) return stored;
    } catch (e) {}

    // During local development the frontend and backend normally run on different ports.
    if (window.location && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
      const currentPort = window.location.port;
      if (currentPort !== "8787") {
        return `http://${window.location.hostname}:8787`;
      }
      return window.location.origin;
    }

    // On cloud deployment (e.g. Vercel / Netlify), route requests to the live Render Backend.
    return RENDER_BACKEND_URL;
  }

  return RENDER_BACKEND_URL;
})();

/** Small wrapper used by the page scripts for JSON API calls. */
async function apiFetch(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${cleanEndpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(options.headers || {})
  };

  return fetch(url, {
    mode: "cors",
    ...options,
    headers
  });
}

// Expose the helper to the page scripts.
if (typeof window !== "undefined") {
  window.API_BASE_URL = API_BASE_URL;
  window.apiFetch = apiFetch;
}
