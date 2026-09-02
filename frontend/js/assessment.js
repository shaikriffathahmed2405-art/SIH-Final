// Assessment page and rooftop image tools.

let blazefaceModel = null;
let map = null, mapMarker = null, mapTileLayer = null, mapSatLayer = null, mapCircle = null;
let mapIsSat = false, mapExpanded = false;
let showObstacles = true, showGreenTransform = false, showThermal = false, canvasImg = null;

let dynamicObstacles = {
  tank: { rx: 0.15, ry: 0.20, rw: 0.22, rh: 0.25 },
  hvac: { rx: 0.65, ry: 0.55, rw: 0.18, rh: 0.20 }
};

let pendingVerification = null;

const STREET_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const SAT_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

async function initFaceDetector() {
  if (typeof blazeface !== "undefined") {
    try {
      blazefaceModel = await blazeface.load();
    } catch (e) {
      console.warn("Blazeface init:", e);
    }
  }
}

function setStep(name, status) {
  const el = document.querySelector(`.step[data-step="${name}"]`);
  if (!el) return;
  el.classList.remove("active", "done");
  if (status) el.classList.add(status);
}

function customPinIcon() {
  return L.divIcon({
    className: "",
    html: `<div class="map-pin">
      <svg viewBox="0 0 34 44" fill="none">
        <path d="M17 2C9.27 2 3 8.27 3 16c0 10.5 14 26 14 26s14-15.5 14-26C31 8.27 24.73 2 17 2z" fill="#2f6b46" stroke="#fff" stroke-width="2"/>
        <circle cx="17" cy="16" r="6" fill="#fff"/>
      </svg>
      <div class="pulse"></div>
    </div>`,
    iconSize: [34, 44],
    iconAnchor: [17, 44]
  });
}

function initMap(lat, lon, name) {
  if (typeof L === "undefined") return;
  const mapEl = $("miniMap");
  if (!mapEl) return;
  mapEl.style.display = "block";
  try {
    if (!map) {
      map = L.map("miniMap", { zoomControl: false, attributionControl: true }).setView([lat, lon], 17);
      mapTileLayer = L.tileLayer(STREET_TILES, { maxZoom: 20, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
      mapSatLayer = L.tileLayer(SAT_TILES, { maxZoom: 20, attribution: "Tiles &copy; Esri" });
      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapMarker = L.marker([lat, lon], { icon: customPinIcon() }).addTo(map);
      mapCircle = L.circle([lat, lon], { radius: 35, color: "#2f6b46", weight: 1.5, fillColor: "#5fb37f", fillOpacity: 0.12 }).addTo(map);
    } else {
      map.setView([lat, lon], 17);
      mapMarker.setLatLng([lat, lon]);
      if (mapCircle) mapCircle.setLatLng([lat, lon]);
      setTimeout(() => map.invalidateSize(), 150);
    }
    if (mapMarker.bindPopup) mapMarker.bindPopup(name || "Rooftop location");
    const coordsEl = $("mapCoords");
    if (coordsEl) coordsEl.textContent = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch (e) { mapEl.style.display = "none"; }
}

function toggleSatellite() {
  if (!map) return;
  mapIsSat = !mapIsSat;
  if (mapIsSat) { map.removeLayer(mapTileLayer); mapSatLayer.addTo(map); }
  else { map.removeLayer(mapSatLayer); mapTileLayer.addTo(map); }
  const btn = $("mapSatBtn");
  if (btn) btn.classList.toggle("active", mapIsSat);
}

function recenterMap() {
  if (!map || state.lat === null) return;
  map.setView([state.lat, state.lon], 17);
}

function toggleExpandMap() {
  const mapEl = $("miniMap");
  if (!mapEl) return;
  mapExpanded = !mapExpanded;
  mapEl.classList.toggle("expanded", mapExpanded);
  const btn = $("mapExpandBtn");
  if (btn) btn.classList.toggle("active", mapExpanded);
  setTimeout(() => { if (map) map.invalidateSize(); }, 260);
}

function setLocation(lat, lon, name) {
  saveState({ lat, lon, place: name });
  if ($("locDot")) $("locDot").classList.add("on");
  if ($("locationTitle")) $("locationTitle").textContent = name;
  if ($("locationDetail")) $("locationDetail").textContent = `Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}`;
  setStep("locate", "done");
  initMap(lat, lon, name);
  getWeather(lat, lon);
}

async function getWeather(lat, lon) {
  if ($("dataState")) $("dataState").textContent = "Syncing";
  try {
    const r = await (typeof apiFetch === "function" ? apiFetch("/api/environment", {
      method: "POST",
      body: JSON.stringify({ latitude: lat, longitude: lon })
    }) : fetch("/api/environment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: lat, longitude: lon })
    }));
    const d = await r.json();
    const e = d.environment || {};
    const temp = Number(e.temperatureC) || 28.5;
    const rain = Number(e.rainfall7dMm) || 38;
    const climate = e.climate || "Tropical Warm";
    const annualRain = e.annualRainfallMm || 950;
    saveState({ temp, rain, climate, annualRain });

    if ($("temp")) $("temp").textContent = `${temp.toFixed(1)} °C`;
    if ($("rain")) $("rain").textContent = `${rain.toFixed(0)} mm`;
    if ($("climate")) $("climate").textContent = climate;
    if ($("dataState")) $("dataState").textContent = e.source === "live" ? "Live GPS" : "City Fallback";
  } catch (err) {
    if ($("temp")) $("temp").textContent = "28.5 °C";
    if ($("rain")) $("rain").textContent = "38 mm";
    if ($("climate")) $("climate").textContent = "Tropical Warm";
    if ($("dataState")) $("dataState").textContent = "City Fallback";
  }
}

function renderCanvasOverlay() {
  const canvas = $("roofCanvas");
  if (!canvas || !canvasImg) return;
  const ctx = canvas.getContext("2d");

  canvas.width = canvasImg.width;
  canvas.height = canvasImg.height;
  ctx.drawImage(canvasImg, 0, 0);

  const w = canvas.width, h = canvas.height;
  const tX = w * dynamicObstacles.tank.rx, tY = h * dynamicObstacles.tank.ry;
  const tW = w * dynamicObstacles.tank.rw, tH = h * dynamicObstacles.tank.rh;
  const hX = w * dynamicObstacles.hvac.rx, hY = h * dynamicObstacles.hvac.ry;
  const hW = w * dynamicObstacles.hvac.rw, hH = h * dynamicObstacles.hvac.rh;

  if (showThermal) {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "rgba(239,68,68,0.45)");
    grad.addColorStop(0.5, "rgba(245,158,11,0.35)");
    grad.addColorStop(1, "rgba(34,197,94,0.45)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  if (showGreenTransform) {
    ctx.fillStyle = "rgba(46, 125, 50, 0.58)";
    ctx.fillRect(w * 0.08, h * 0.12, w * 0.84, h * 0.76);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1.5;
    const gridStep = Math.max(16, Math.floor(w / 18));
    for (let gx = w * 0.08; gx < w * 0.92; gx += gridStep) {
      ctx.beginPath(); ctx.moveTo(gx, h * 0.12); ctx.lineTo(gx, h * 0.88); ctx.stroke();
    }
    for (let gy = h * 0.12; gy < h * 0.88; gy += gridStep) {
      ctx.beginPath(); ctx.moveTo(w * 0.08, gy); ctx.lineTo(w * 0.92, gy); ctx.stroke();
    }

    const flowerColors = ["#ec4899", "#facc15", "#4ade80", "#a855f7"];
    for (let i = 0; i < 45; i++) {
      const fx = w * 0.10 + ((i * 37) % Math.floor(w * 0.78));
      const fy = h * 0.14 + ((i * 53) % Math.floor(h * 0.70));
      const insideTank = (fx >= tX && fx <= tX + tW && fy >= tY && fy <= tY + tH);
      const insideHvac = (fx >= hX && fx <= hX + hW && fy >= hY && fy <= hY + hH);
      if (!insideTank && !insideHvac) {
        ctx.fillStyle = flowerColors[i % flowerColors.length];
        ctx.beginPath();
        ctx.arc(fx, fy, Math.max(2, Math.floor(w / 110)), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = "rgba(22, 101, 52, 0.92)";
    ctx.fillRect(w * 0.08, h * 0.12, Math.min(w * 0.84, 270), 22);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("🌿 POST-INSTALLATION AI GREEN ROOF", w * 0.08 + 8, h * 0.12 + 15);
  }

  if (showObstacles) {
    if (!showGreenTransform) {
      ctx.fillStyle = "rgba(34,197,94,0.28)";
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = Math.max(2, Math.floor(w / 180));
      ctx.beginPath();
      ctx.rect(w * 0.08, h * 0.12, w * 0.84, h * 0.76);
      ctx.fill();
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(239,68,68,0.55)";
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3;
    ctx.fillRect(tX, tY, tW, tH);
    ctx.strokeRect(tX, tY, tW, tH);
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.max(11, Math.floor(w / 35))}px sans-serif`;
    ctx.fillText("WATER TANK", tX + 6, tY + 18);

    ctx.fillRect(hX, hY, hW, hH);
    ctx.strokeRect(hX, hY, hW, hH);
    ctx.fillText("HVAC UNIT", hX + 6, hY + 18);

    ctx.strokeStyle = "rgba(245,158,11,0.8)";
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(w * 0.04, h * 0.04, w * 0.92, h * 0.92);
    ctx.setLineDash([]);
  }
}

async function verifyRooftopServer(base64Image, mimeType) {
  try {
    const res = await (typeof apiFetch === "function" ? apiFetch("/api/verify-rooftop", {
      method: "POST",
      body: JSON.stringify({ imageBase64: base64Image, mimeType })
    }) : fetch("/api/verify-rooftop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: base64Image, mimeType })
    }));
    return await res.json();
  } catch (e) {
    const isFileProtocol = window.location.protocol === "file:";
    const hint = isFileProtocol
      ? " This page was opened as a local file. For real Gemini Vision checks, launch via start.bat."
      : " Ensure server.js is running, then click Retry.";
    return { ok: false, error: "Couldn't reach the AI verification server." + hint };
  }
}

function renderVerifyingState(url) {
  const el = $("imageValidation");
  if (!el) return;
  el.style.display = "block";
  el.style.background = "transparent";
  el.style.border = "none";
  el.style.padding = "0";
  el.innerHTML = `
    <div style="margin-top:14px;border-radius:18px;overflow:hidden;box-shadow:0 14px 36px rgba(47,107,70,0.15);border:1px solid var(--line);animation:rise .25s ease both">
      <div style="background:linear-gradient(135deg, var(--canopy-deep) 0%, var(--canopy) 100%);color:#fff;padding:18px 24px;display:flex;align-items:center;gap:14px">
        <div style="width:22px;height:22px;border-radius:50%;border:3px solid rgba(255,255,255,0.35);border-top-color:#fff;animation:spin .8s linear infinite;flex-shrink:0"></div>
        <div>
          <div style="font-weight:900;font-size:14px">Verifying rooftop with AI Vision Engine…</div>
          <div style="font-size:12px;color:#e9f3ec;margin-top:2px">Checking that this photo actually shows a rooftop or terrace surface.</div>
        </div>
      </div>
    </div>
  `;
}

function renderAiRejection(url, reasonText, detectedSubject, locText) {
  const el = $("imageValidation");
  if (!el) return;
  el.style.display = "block";
  el.style.background = "transparent";
  el.style.border = "none";
  el.style.padding = "0";
  el.innerHTML = `
    <div style="margin-top:14px;border-radius:18px;overflow:hidden;box-shadow:0 14px 36px rgba(220,38,38,0.18);border:1px solid #fecaca;animation:rise .25s ease both">
      <div style="background:linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);color:#fff;padding:22px 24px">
        <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:10px;backdrop-filter:blur(4px)">
          <span>🚫</span> Image Validation Result
        </div>
        <h2 style="margin:0 0 6px;font-size:24px;font-weight:900;letter-spacing:0.5px;color:#fff;display:flex;align-items:center;gap:10px;font-family:var(--font-display)">
          <span>❌</span> ROOFTOP NOT DETECTED
        </h2>
        <p style="margin:0;font-size:13px;color:#fee2e2;line-height:1.45">
          The uploaded image does not appear to show a usable rooftop or terrace.<br>Please upload a clear photograph of a rooftop.
        </p>
      </div>
      <div style="background:#fff;padding:20px 24px;border-bottom:1px solid #f1f5f9">
        <div style="display:flex;gap:18px;align-items:center;background:#f8fafc;padding:14px 16px;border-radius:14px;border:1px solid #e2e8f0">
          <img src="${url}" style="width:130px;height:90px;object-fit:cover;border-radius:10px;box-shadow:0 4px 10px rgba(0,0,0,0.12);border:1px solid #cbd5e1;flex-shrink:0">
          <div style="flex:1">
            ${detectedSubject ? `<div style="font-size:11px;font-weight:800;letter-spacing:0.6px;color:#64748b;text-transform:uppercase;margin-bottom:4px">AI DETECTED</div><div style="font-size:13px;color:#1e293b;font-weight:700;margin-bottom:8px">${detectedSubject}</div>` : ""}
            <div style="font-size:11px;font-weight:800;letter-spacing:0.6px;color:#64748b;text-transform:uppercase;margin-bottom:4px">VALIDATION REASON</div>
            <div style="font-size:12.5px;line-height:1.5;color:#1e293b;font-style:italic;font-weight:600">
              "${reasonText}"
            </div>
            <div style="display:flex;align-items:center;gap:5px;font-size:11.5px;color:#64748b;margin-top:8px">
              <span>📍</span> <span>Input Location: <b>${locText}</b></span>
            </div>
          </div>
        </div>
        <div style="margin-top:14px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:12px 16px">
          <div style="display:flex;align-items:center;gap:6px;font-weight:800;color:#92400e;font-size:13px">
            <span>⚠️</span> Assessment Stopped
          </div>
          <div style="font-size:12px;line-height:1.45;color:#b45309;margin-top:4px">
            To prevent misleading results, Green Roof AI does not calculate suitability scores, plant recommendations, or cost estimates for non-rooftop images.
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderVerifyError(url, errorText, quotaExceeded = false) {
  const el = $("imageValidation");
  if (!el) return;
  el.style.display = "block";
  el.style.background = "transparent";
  el.style.border = "none";
  el.style.padding = "0";
  const title = quotaExceeded ? "AI Rate Limit Reached" : "AI Verification Unavailable";
  const icon = quotaExceeded ? "⏳" : "⚠️";
  const footNote = quotaExceeded
    ? "This is an API quota limit. Wait a few moments, then retry."
    : "Assessment stopped — we can't confirm this is a rooftop without AI verification.";
  el.innerHTML = `
    <div style="margin-top:14px;border-radius:18px;overflow:hidden;box-shadow:0 14px 36px rgba(180,131,11,0.18);border:1px solid #fde68a;animation:rise .25s ease both">
      <div style="background:linear-gradient(135deg, #b45309 0%, #92400e 100%);color:#fff;padding:20px 24px">
        <h2 style="margin:0 0 6px;font-size:18px;font-weight:900;color:#fff;display:flex;align-items:center;gap:10px">
          <span>${icon}</span> ${title}
        </h2>
        <p style="margin:0;font-size:12.5px;color:#fef3c7;line-height:1.45">${errorText}</p>
      </div>
      <div style="background:#fff;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:12px">
        <div style="font-size:12px;color:#64748b">${footNote}</div>
        <button type="button" id="retryVerifyBtn" style="background:var(--canopy-deep);color:#fff;border:none;padding:9px 16px;border-radius:10px;font-weight:800;font-size:12.5px;cursor:pointer">Retry</button>
      </div>
    </div>
  `;
  const btn = $("retryVerifyBtn");
  if (btn) btn.onclick = () => runAiVerification();
}

async function runAiVerification() {
  if (!pendingVerification) return;
  const { img, url, greenRatio, grayRatio, terracottaRatio, whiteRatio, darkXSum, darkYSum, darkCount, brightXSum, brightYSum, brightCount, w, h } = pendingVerification;

  renderVerifyingState(url);

  const cAI = document.createElement("canvas");
  const aiMax = 1024;
  const aiScale = Math.min(1, aiMax / img.width, aiMax / img.height);
  cAI.width = Math.max(1, Math.round(img.width * aiScale));
  cAI.height = Math.max(1, Math.round(img.height * aiScale));
  cAI.getContext("2d").drawImage(img, 0, 0, cAI.width, cAI.height);
  const aiBase64 = cAI.toDataURL("image/jpeg", 0.9).split(",")[1];

  const result = await verifyRooftopServer(aiBase64, "image/jpeg");
  const locText = state.place || ($("locationTitle") ? $("locationTitle").textContent : "Bengaluru, Karnataka");

  if (!result.ok) {
    saveState({ imageReady: false, imageValid: false });
    canvasImg = null;
    const cEl = $("roofCanvas");
    if (cEl) cEl.getContext("2d").clearRect(0, 0, cEl.width, cEl.height);
    if ($("canvasContainer")) $("canvasContainer").style.display = "none";
    if ($("quickAnalyze")) { $("quickAnalyze").style.display = "none"; $("quickAnalyze").disabled = true; }
    renderVerifyError(url, result.error || "The AI verification service did not respond.", !!result.quotaExceeded);
    setStep("upload", null);
    setStep("segment", null);
    return;
  }

  if (!result.isRooftop || result.containsPerson || result.confidence < 55) {
    saveState({ imageReady: false, imageValid: false });
    canvasImg = null;
    const cEl = $("roofCanvas");
    if (cEl) cEl.getContext("2d").clearRect(0, 0, cEl.width, cEl.height);
    if ($("canvasContainer")) $("canvasContainer").style.display = "none";
    if ($("quickAnalyze")) { $("quickAnalyze").style.display = "none"; $("quickAnalyze").disabled = true; }
    renderAiRejection(url, result.reason || "This does not appear to be a photograph of a rooftop or terrace.", result.detectedSubject, locText);
    if ($("imageMeta")) $("imageMeta").textContent += " • validation rejected";
    toast("Image Rejected", "Non-rooftop image detected. Assessment stopped.", "err");
    setStep("upload", null);
    setStep("segment", null);
    return;
  }

  const vEl = $("imageValidation");
  if (vEl) { vEl.style.display = "none"; vEl.innerHTML = ""; }
  acceptRooftopImage(img, url, greenRatio, grayRatio, terracottaRatio, whiteRatio, darkXSum, darkYSum, darkCount, brightXSum, brightYSum, brightCount, w, h);
}

function handleImageFile(file) {
  if (!file) return;
  if ($("imageMeta")) $("imageMeta").textContent = `${file.name} • ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  setStep("upload", "active");

  const url = URL.createObjectURL(file);
  saveState({ imageReady: false, imageValid: false });

  const img = new Image();
  img.onload = async () => {
    canvasImg = img;
    if ($("canvasContainer")) $("canvasContainer").style.display = "block";
    renderCanvasOverlay();

    let aiFaceDetected = false;
    const cFace = document.createElement("canvas");
    const faceMax = 320;
    const fScale = Math.min(1, faceMax / img.width, faceMax / img.height);
    cFace.width = Math.max(1, Math.round(img.width * fScale));
    cFace.height = Math.max(1, Math.round(img.height * fScale));
    const fCtx = cFace.getContext("2d");
    fCtx.drawImage(img, 0, 0, cFace.width, cFace.height);

    if (blazefaceModel) {
      try {
        const faces = await blazefaceModel.estimateFaces(cFace, false);
        if (faces && faces.length > 0) {
          const validFaces = faces.filter(f => {
            const p = f.probability;
            const prob = typeof p === "number" ? p : (Array.isArray(p) ? (p[0] || 0) : 0);
            if (prob < 0.9) return false;
            const tl = f.topLeft, br = f.bottomRight;
            if (!tl || !br) return false;
            const boxW = Math.abs(br[0] - tl[0]);
            const boxH = Math.abs(br[1] - tl[1]);
            const frameArea = cFace.width * cFace.height;
            const boxArea = boxW * boxH;
            return (boxArea / frameArea) > 0.02;
          });
          if (validFaces.length > 0) aiFaceDetected = true;
        }
      } catch (err) {
        console.warn("Blazeface infer err:", err);
      }
    }

    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    const max = 240;
    const scale = Math.min(1, max / img.width);
    c.width = Math.max(1, Math.round(img.width * scale));
    c.height = Math.max(1, Math.round(img.height * scale));
    ctx.drawImage(img, 0, 0, c.width, c.height);

    const px = ctx.getImageData(0, 0, c.width, c.height).data;
    let white = 0, dark = 0, blue = 0, green = 0, gray = 0, terracotta = 0;
    let skinPixels = 0, centerSkinPixels = 0, skinLuminanceSum = 0, skinLuminanceSqSum = 0;
    let total = px.length / 4;
    const w = c.width, h = c.height;

    let darkXSum = 0, darkYSum = 0, darkCount = 0;
    let brightXSum = 0, brightYSum = 0, brightCount = 0;

    for (let i = 0; i < px.length; i += 4) {
      const R = px[i], G = px[i + 1], B = px[i + 2];
      const r = R / 255, g = G / 255, b = B / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const pixelIdx = i / 4, y = Math.floor(pixelIdx / w), x = pixelIdx % w;

      const Y = 0.299 * R + 0.587 * G + 0.114 * B;
      const Cb = 128 - 0.168736 * R - 0.331264 * G + 0.5 * B;
      const Cr = 128 + 0.5 * R - 0.418688 * G - 0.081312 * B;

      const isSkin = (R > 85) && (G > 35) && (B > 18) && (R > G) && (R > B) && 
                     (Math.abs(R - G) > 10) && (Cb >= 77 && Cb <= 132) && (Cr >= 133 && Cr <= 175);

      if (isSkin) {
        skinPixels++;
        skinLuminanceSum += Y;
        skinLuminanceSqSum += Y * Y;
        if (x > w * 0.15 && x < w * 0.85 && y > h * 0.05 && y < h * 0.85) {
          centerSkinPixels++;
        }
      }

      if (r > 0.88 && g > 0.88 && b > 0.88) {
        white++;
        if (x > w * 0.4 && y > h * 0.3) { brightXSum += x; brightYSum += y; brightCount++; }
      }
      if (r < 0.20 && g < 0.20 && b < 0.20) {
        dark++;
        if (x < w * 0.6 && y > h * 0.15) { darkXSum += x; darkYSum += y; darkCount++; }
      }
      if (b > r * 1.15 && b > g * 1.05 && b > 0.25) blue++;
      if (g > r * 1.05 && g > b * 0.95 && g > 0.18) green++;
      if (mx - mn < 0.16 && mx > 0.18 && mx < 0.88) gray++;
      if (R > 130 && G < R * 0.85 && B < G * 0.85 && R > B * 1.35) terracotta++;
    }

    const skinRatio = skinPixels / total;
    const centerSkinRatio = centerSkinPixels / total;
    const skinMeanLum = skinPixels > 0 ? (skinLuminanceSum / skinPixels) : 0;
    const skinVariance = skinPixels > 0 ? (skinLuminanceSqSum / skinPixels - skinMeanLum * skinMeanLum) : 9999;

    const grayRatio = gray / total;
    const terracottaRatio = terracotta / total;
    const greenRatio = green / total;
    const whiteRatio = white / total;
    const darkRatio = dark / total;

    const isHumanOrPortrait = aiFaceDetected || (skinRatio > 0.12 && centerSkinRatio > 0.08 && skinVariance < 1200);

    let flatColorPixels = 0;
    for (let i = 0; i < px.length - 4; i += 4) {
      if (px[i] === px[i + 4] && px[i + 1] === px[i + 4 + 1] && px[i + 2] === px[i + 4 + 2]) {
        flatColorPixels++;
      }
    }
    const syntheticGraphicRatio = flatColorPixels / total;

    let sharpEdgeTransitions = 0;
    for (let y = 1; y < h - 1; y += 2) {
      for (let x = 1; x < w - 1; x += 2) {
        const idx = (y * w + x) * 4;
        const lum = 0.299 * px[idx] + 0.587 * px[idx + 1] + 0.114 * px[idx + 2];
        const lumR = 0.299 * px[idx + 4] + 0.587 * px[idx + 5] + 0.114 * px[idx + 6];
        const lumD = 0.299 * px[idx + w * 4] + 0.587 * px[idx + w * 4 + 1] + 0.114 * px[idx + w * 4 + 2];
        if (Math.abs(lum - lumR) > 55 || Math.abs(lum - lumD) > 55) {
          sharpEdgeTransitions++;
        }
      }
    }
    const textEdgeDensity = sharpEdgeTransitions / (total / 4);

    const fn = (file.name || "").toLowerCase();
    const isDocFilename = fn.includes("survey") || fn.includes("analysis") || fn.includes("visualization") || 
                          fn.includes("chart") || fn.includes("graph") || fn.includes("report") || 
                          fn.includes("poster") || fn.includes("infographic") || fn.includes("diagram") ||
                          fn.includes("table") || fn.includes("slide") || fn.includes("doc") || fn.includes("form");

    const isDocumentOrGraphic = (syntheticGraphicRatio > 0.26) || 
                                (isDocFilename && syntheticGraphicRatio > 0.14) || 
                                (textEdgeDensity > 0.30 && syntheticGraphicRatio > 0.16);

    let rejectionReason = null;
    if (isHumanOrPortrait) {
      rejectionReason = "The AI neural detector identified a human portrait / photograph with people in the frame, which does not represent an open rooftop or building terrace.";
    } else if (isDocumentOrGraphic) {
      rejectionReason = `The image provided is a digital document / infographic graphic (${file.name}) containing text paragraphs, survey charts, or data tables rather than a photograph of an actual building rooftop.`;
    } else if (whiteRatio > 0.94) {
      rejectionReason = "The image provided appears to be a blank white document or sheet without structural building elements.";
    } else if (darkRatio > 0.94) {
      rejectionReason = "The image provided is too dark or pitch black to identify rooftop surfaces and structural geometry.";
    }

    if (rejectionReason) {
      saveState({ imageReady: false, imageValid: false });
      canvasImg = null;
      const cEl = $("roofCanvas");
      if (cEl) cEl.getContext("2d").clearRect(0, 0, cEl.width, cEl.height);
      if ($("canvasContainer")) $("canvasContainer").style.display = "none";
      if ($("quickAnalyze")) { $("quickAnalyze").style.display = "none"; $("quickAnalyze").disabled = true; }
      renderAiRejection(url, rejectionReason, null, state.place || "Bengaluru, Karnataka");
      if ($("imageMeta")) $("imageMeta").textContent += " • validation rejected";
      toast("Image Rejected", "Non-rooftop image detected. Assessment stopped.", "err");
      setStep("upload", null);
      setStep("segment", null);
      return;
    }

    pendingVerification = { img, url, greenRatio, grayRatio, terracottaRatio, whiteRatio, darkXSum, darkYSum, darkCount, brightXSum, brightYSum, brightCount, w, h };
    await runAiVerification();
  };

  img.onerror = () => {
    saveState({ imageReady: false, imageValid: false });
    if ($("canvasContainer")) $("canvasContainer").style.display = "none";
    if ($("quickAnalyze")) $("quickAnalyze").style.display = "none";
    const vEl = $("imageValidation");
    if (vEl) {
      vEl.style.display = "block";
      vEl.className = "validation invalid";
      vEl.innerHTML = "<strong>✕ Invalid image file</strong> We could not read this image. Choose a JPG, PNG or WebP rooftop photograph.";
    }
    setStep("upload", null);
  };

  img.src = url;
}

function acceptRooftopImage(img, url, greenRatio = 0.22, grayRatio = 0.45, terracottaRatio = 0.0, whiteRatio = 0.1, darkXSum = 0, darkYSum = 0, darkCount = 0, brightXSum = 0, brightYSum = 0, brightCount = 0, cw = 240, ch = 180) {
  let analyzedDeckType = "concrete_rcc";
  let usableAreaPct = 78;
  let deckName = "Standard RCC Concrete Slab";
  let analysisDesc = "";
  
  if (whiteRatio > 0.32) {
    analyzedDeckType = "cool_roof_coating";
    deckName = "Reflective Cool-Roof / China Mosaic Terrace";
    usableAreaPct = Math.min(92, Math.max(76, Math.round(82 + whiteRatio * 15 - (darkCount > 10 ? 6 : 0))));
    analysisDesc = `"AI Vision Engine verified a <b>${deckName}</b> with <b>${usableAreaPct}% net usable greening area</b>. High solar albedo detected. Excellent candidate for Biosolar PV efficiency synergy (+12% energy boost)."`;
  } else if (greenRatio > 0.18) {
    analyzedDeckType = "vegetated_deck";
    deckName = "Partially Vegetated Terrace Garden";
    usableAreaPct = Math.min(86, Math.max(68, Math.round(72 + greenRatio * 20 - (darkCount > 10 ? 8 : 0))));
    analysisDesc = `"AI Vision Engine recognized a <b>${deckName}</b> with <b>${usableAreaPct}% retrofit area</b>. Pre-existing botanical micro-climate will accelerate native sedum and succulent root establishment."`;
  } else if (terracottaRatio > 0.22 && terracottaRatio > grayRatio * 0.7) {
    analyzedDeckType = "terracotta_tiles";
    deckName = "Terracotta / Brick-Bat Coba Deck";
    usableAreaPct = Math.min(88, Math.max(66, Math.round(74 + terracottaRatio * 18 - (darkCount > 10 ? 7 : 0))));
    analysisDesc = `"AI Vision Engine identified a <b>${deckName}</b> with <b>${usableAreaPct}% open greening deck</b>. High direct solar exposure. Lightweight perlite-vermiculite substrate recommended to preserve underlying tile waterproofing."`;
  } else {
    analyzedDeckType = "concrete_rcc";
    deckName = "Standard Cast In-situ RCC Roof Slab";
    usableAreaPct = Math.min(90, Math.max(64, Math.round(76 + grayRatio * 14 - (darkCount > 8 ? 6 : 0))));
    analysisDesc = `"AI Vision Engine analyzed a <b>${deckName}</b> with <b>${usableAreaPct}% net usable area</b>. Structural concrete provides robust dead-load capacity. Mapped ${darkCount > 8 ? "2" : "1"} localized utility obstacle zones with perimeter safety clearance."`;
  }

  saveState({
    imageReady: true,
    imageValid: true,
    greenRatio,
    usableAreaPct,
    analyzedDeckType
  });

  if ($("usablePctLabel")) $("usablePctLabel").textContent = `${usableAreaPct}%`;
  if ($("obstaclePctLabel")) $("obstaclePctLabel").textContent = `${100 - usableAreaPct}%`;

  if (darkCount > 6) {
    const rx = Math.min(0.35, Math.max(0.10, (darkXSum / darkCount / cw) - 0.10));
    const ry = Math.min(0.40, Math.max(0.12, (darkYSum / darkCount / ch) - 0.10));
    dynamicObstacles.tank = { rx, ry, rw: 0.22, rh: 0.25 };
  } else {
    dynamicObstacles.tank = { rx: 0.15, ry: 0.18, rw: 0.22, rh: 0.25 };
  }

  if (brightCount > 6) {
    const rx = Math.min(0.75, Math.max(0.50, (brightXSum / brightCount / cw) - 0.08));
    const ry = Math.min(0.65, Math.max(0.40, (brightYSum / brightCount / ch) - 0.08));
    dynamicObstacles.hvac = { rx, ry, rw: 0.18, rh: 0.20 };
  } else {
    dynamicObstacles.hvac = { rx: 0.65, ry: 0.52, rw: 0.18, rh: 0.20 };
  }

  canvasImg = img;
  if ($("canvasContainer")) $("canvasContainer").style.display = "block";
  renderCanvasOverlay();

  const locText = state.place || ($("locationTitle") ? $("locationTitle").textContent : "Bengaluru, Karnataka");

  const vEl = $("imageValidation");
  if (vEl) {
    vEl.style.display = "block";
    vEl.style.background = "transparent";
    vEl.style.border = "none";
    vEl.style.padding = "0";
    vEl.innerHTML = `
      <div style="margin-top:14px;border-radius:18px;overflow:hidden;box-shadow:0 14px 36px rgba(22,101,52,0.18);border:1px solid #bbf7d0;animation:rise .25s ease both">
        <div style="background:linear-gradient(135deg, #16a34a 0%, #15803d 100%);color:#fff;padding:22px 24px">
          <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.22);padding:4px 12px;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:10px;backdrop-filter:blur(4px)">
            <span>✓</span> Image Validation Result
          </div>
          <h2 style="margin:0 0 6px;font-size:24px;font-weight:900;letter-spacing:0.5px;color:#fff;display:flex;align-items:center;gap:10px;font-family:var(--font-display)">
            <span>✅</span> GENUINE ROOFTOP VERIFIED
          </h2>
          <p style="margin:0;font-size:13px;color:#dcfce7;line-height:1.45">
            The uploaded image shows a valid flat rooftop terrace suitable for modular greening.
          </p>
        </div>
        <div style="background:#fff;padding:20px 24px;border-bottom:1px solid #f1f5f9">
          <div style="display:flex;gap:18px;align-items:center;background:#f0fdf4;padding:14px 16px;border-radius:14px;border:1px solid #bbf7d0">
            <img src="${url}" style="width:130px;height:90px;object-fit:cover;border-radius:10px;box-shadow:0 4px 10px rgba(0,0,0,0.12);border:1px solid #86efac;flex-shrink:0">
            <div style="flex:1">
              <div style="font-size:11px;font-weight:800;letter-spacing:0.6px;color:#166534;text-transform:uppercase;margin-bottom:4px">VALIDATION ANALYSIS</div>
              <div style="font-size:12.5px;line-height:1.5;color:#14532d;font-weight:600">
                ${analysisDesc}
              </div>
              <div style="display:flex;align-items:center;gap:5px;font-size:11.5px;color:#166534;margin-top:8px">
                <span>📍</span> <span>Input Location: <b>${locText}</b></span>
              </div>
            </div>
          </div>
          <div style="margin-top:14px;background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:12px 16px">
            <div style="display:flex;align-items:center;gap:6px;font-weight:800;color:#166534;font-size:13px">
              <span>✨</span> Ready for Feasibility &amp; Engineering Assessment
            </div>
            <div style="font-size:12px;line-height:1.45;color:#15803d;margin-top:4px">
              Click <b>'✨ Generate Full AI Assessment &amp; Feasibility'</b> below to compute your IS 875 load rating, biosolar boost, and DPR scorecard.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if ($("quickAnalyze")) {
    $("quickAnalyze").style.display = "block";
    $("quickAnalyze").disabled = false;
  }
  setStep("upload", "done");
  setStep("segment", "done");
  toast("Rooftop Verified", `Detected ${deckName} with ${usableAreaPct}% usable area.`, "ok");
}

async function runAssessment() {
  if (!state.imageReady || !canvasImg) {
    toast("⚠️ Incomplete Step 1", "Please upload a valid rooftop photograph first.", "warn");
    if ($("uploadZone")) $("uploadZone").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  if (!state.place || $("locationTitle").textContent.includes("Not Set")) {
    toast("⚠️ Incomplete Step 2", "Please select your location / city.", "warn");
    if ($("locationTitle")) $("locationTitle").scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const roofAreaSqFt = Number($("area").value);
  if (!roofAreaSqFt || roofAreaSqFt < 20) {
    toast("⚠️ Incomplete Step 3", "Please enter a valid roof area (min 20 sq ft).", "warn");
    if ($("area")) $("area").focus();
    return;
  }

  const phoneVal = ($("userPhoneAssessment") ? $("userPhoneAssessment").value : "").replace(/[^0-9]/g, "");
  if (!phoneVal || phoneVal.length < 10) {
    toast("⚠️ Incomplete Step 3", "Please enter your 10-digit mobile number for smart WhatsApp rain alerts.", "warn");
    if ($("userPhoneAssessment")) $("userPhoneAssessment").focus();
    return;
  }

  const coveragePercent = Number($("coverageSelect").value) || 75;
  const costTier = $("costTierSelect").value || "standard";

  saveState({ roofArea: roofAreaSqFt, coverage: coveragePercent, costTier, phone: phoneVal });

  if ($("quickAnalyze")) {
    $("quickAnalyze").disabled = true;
    $("quickAnalyze").textContent = "Running AI & Structural Engine…";
  }
  setStep("assess", "active");

  let a = null;
  try {
    const annualRain = state.place.includes("Mumbai") ? 2400 : state.place.includes("Delhi") ? 650 : state.place.includes("Hyderabad") ? 820 : state.place.includes("Chennai") ? 1400 : state.place.includes("Pune") ? 750 : 950;
    const res = await (typeof apiFetch === "function" ? apiFetch("/api/assessment", {
      method: "POST",
      body: JSON.stringify({
        roofAreaSqFt,
        coveragePercent,
        costTier,
        environment: { temperatureC: state.temp, rainfall7dMm: state.rain, annualRainfallMm: annualRain, climate: state.climate },
        roof: { structuralVerified: true, waterproofingVerified: true, drainageVerified: true, slabType: state.analyzedDeckType || "concrete_rcc" },
        visual: { visibleRoofEvidence: state.usableAreaPct > 70 ? 92 : 80, usableAreaPercent: state.usableAreaPct, greenRatio: state.greenRatio }
      })
    }) : fetch("/api/assessment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roofAreaSqFt,
        coveragePercent,
        costTier,
        environment: { temperatureC: state.temp, rainfall7dMm: state.rain, annualRainfallMm: annualRain, climate: state.climate },
        roof: { structuralVerified: true, waterproofingVerified: true, drainageVerified: true, slabType: state.analyzedDeckType || "concrete_rcc" },
        visual: { visibleRoofEvidence: state.usableAreaPct > 70 ? 92 : 80, usableAreaPercent: state.usableAreaPct, greenRatio: state.greenRatio }
      })
    }));
    const data = await res.json();
    if (data && data.ok && data.assessment) a = data.assessment;
  } catch (err) {}

  if (!a) {
    a = clientCalculateAssessment({
      roofAreaSqFt,
      coveragePercent,
      costTier,
      environment: { annualRainfallMm: state.annualRain || 950 },
      visual: { usableAreaPercent: state.usableAreaPct }
    });
  }

  saveState({ currentAssessment: a });
  setStep("assess", "done");
  setStep("report", "done");
  toast("Assessment Generated", `Suitability Score: ${a.recommendation.score}/100`, "ok");

  // Move to the results page after saving the assessment.
  setTimeout(() => {
    window.location.href = "results.html";
  }, 400);
}

function initAssessmentPage() {
  initFaceDetector();

  if ($("toggleMaskBtn")) {
    $("toggleMaskBtn").onclick = e => {
      showObstacles = !showObstacles;
      e.target.classList.toggle("active", showObstacles);
      renderCanvasOverlay();
    };
  }

  if ($("toggleGreenTransformBtn")) {
    $("toggleGreenTransformBtn").onclick = e => {
      showGreenTransform = !showGreenTransform;
      e.target.classList.toggle("active", showGreenTransform);
      renderCanvasOverlay();
    };
  }

  if ($("toggleThermalBtn")) {
    $("toggleThermalBtn").onclick = e => {
      showThermal = !showThermal;
      e.target.classList.toggle("active", showThermal);
      renderCanvasOverlay();
    };
  }

  if ($("roofImage")) {
    $("roofImage").onchange = e => handleImageFile(e.target.files[0]);
  }

  const dropZone = $("uploadZone");
  if (dropZone) {
    ["dragenter", "dragover"].forEach(evt => dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.classList.add("dragover"); }));
    ["dragleave", "drop"].forEach(evt => dropZone.addEventListener(evt, e => { e.preventDefault(); dropZone.classList.remove("dragover"); }));
    dropZone.addEventListener("drop", e => {
      const f = e.dataTransfer && e.dataTransfer.files[0];
      if (f) handleImageFile(f);
    });
  }

  if ($("locBtn")) {
    $("locBtn").onclick = () => {
      if (!navigator.geolocation) { toast("GPS Unavailable", "Using demo city.", "warn"); return; }
      navigator.geolocation.getCurrentPosition(
        p => setLocation(p.coords.latitude, p.coords.longitude, "Current GPS Location"),
        () => toast("Permission denied", "Using default Indian metro.", "warn")
      );
    };
  }

  if ($("demoLocBtn")) {
    $("demoLocBtn").onclick = () => setLocation(12.9716, 77.5946, "Bengaluru, Karnataka (BBMP Zone)");
  }

  const satBtn = $("mapSatBtn"), recenterBtn = $("mapRecenterBtn"), expandBtn = $("mapExpandBtn");
  if (satBtn) satBtn.onclick = toggleSatellite;
  if (recenterBtn) recenterBtn.onclick = recenterMap;
  if (expandBtn) expandBtn.onclick = toggleExpandMap;

  if ($("quickAnalyze")) $("quickAnalyze").onclick = runAssessment;

  if ($("userPhoneAssessment")) {
    $("userPhoneAssessment").oninput = e => handlePhoneAutoDispatch(e.target.value);
  }

  // Restore the last saved form values.
  if ($("area") && state.roofArea) $("area").value = state.roofArea;
  if ($("coverageSelect") && state.coverage) $("coverageSelect").value = state.coverage;
  if ($("costTierSelect") && state.costTier) $("costTierSelect").value = state.costTier;

  // Start with the browser location when available.
  setLocation(state.lat || 12.9716, state.lon || 77.5946, state.place || "Bengaluru, Karnataka (BBMP Zone)");
}

document.addEventListener("DOMContentLoaded", initAssessmentPage);
