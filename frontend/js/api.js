// Browser API client.

const GreenRoofAPI = {
  baseUrl: typeof API_BASE_URL !== "undefined" ? API_BASE_URL : "http://localhost:8787",
  _isConnected: null,
  _listeners: [],

  onConnectionChange(fn) {
    if (typeof fn === "function") this._listeners.push(fn);
  },

  _notifyStatus(connected, data = null) {
    this._isConnected = connected;
    this._listeners.forEach(fn => {
      try { fn(connected, data); } catch (e) {}
    });
  },

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith("http") ? endpoint : `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    try {
      const res = await fetch(url, {
        mode: "cors",
        ...options,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(options.headers || {})
        }
      });
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.warn(`[GreenRoofAPI] Error calling ${endpoint}:`, err);
      return { ok: false, status: 0, error: err.message || "Network Error" };
    }
  },

  // Check the API before loading the rest of the page.
  async checkHealth() {
    const res = await this.request("/api/health");
    const connected = res.ok && res.data && res.data.ok === true;
    this._notifyStatus(connected, res.data);
    return res;
  },

  // Static catalogs used by the assessment.
  async getPlants() {
    return this.request("/api/plants");
  },

  async getPestManagement() {
    return this.request("/api/pest-management");
  },

  // Weather data.
  async fetchEnvironment(latitude, longitude) {
    return this.request("/api/environment", {
      method: "POST",
      body: JSON.stringify({ latitude, longitude })
    });
  },

  // Main assessment calculation.
  async runAssessment(payload) {
    return this.request("/api/assessment", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  // Coverage/cost scenarios.
  async runScenario(payload) {
    return this.request("/api/scenario", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  // Optional image verification.
  async verifyRooftop(imageBase64, mimeType = "image/jpeg") {
    return this.request("/api/verify-rooftop", {
      method: "POST",
      body: JSON.stringify({ imageBase64, mimeType })
    });
  },

  // Structural check.
  async checkStructural(payload) {
    return this.request("/api/structural-check", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  // Solar + green roof calculation.
  async calculateBiosolar(payload = {}) {
    return this.request("/api/biosolar-synergy", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  // IoT demo data.
  async getIoTTelemetry(payload = {}) {
    return this.request("/api/iot-telemetry", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  // Chat endpoint.
  async askAI(query) {
    return this.request("/api/ask-ai", {
      method: "POST",
      body: JSON.stringify({ query })
    });
  },

  // Notification endpoint.
  async sendNotification(payload) {
    return this.request("/api/auto-notify", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async getNotificationLogs() {
    return this.request("/api/auto-notify-logs");
  }
};

if (typeof window !== "undefined") {
  window.GreenRoofAPI = GreenRoofAPI;
}
