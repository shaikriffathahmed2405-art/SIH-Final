// Structural safety page.

const currentLayerData = {
  7: { title: "Layer 7: Drought-Resilient Vegetation Layer", desc: "Pre-cultivated sedum, portulaca, and native succulents with high Crassulacean Acid Metabolism (CAM) to survive extreme tropical heat and transpire moisture efficiently." },
  6: { title: "Layer 6: Engineered Lightweight Substrate (Coco-peat + Pumice)", desc: "Engineered lightweight soil mix (35% Coco-peat, 25% Pumice, 20% Vermiculite, 15% Compost, 5% Zeolite). Saturated density is only ~950 kg/m³ (50% lighter than standard field soil)." },
  5: { title: "Layer 5: Needle-Punched Non-Woven Geotextile Filter Fleece", desc: "Prevents fine substrate particles from washing down into drainage cups while allowing free passage of excess rainwater (permeability > 100 L/m²/sec)." },
  4: { title: "Layer 4: Dimpled HDPE Drainage & Water Retention Trays", desc: "Cup-shaped modular dimpled panels that hold 4–6 Liters/m² of emergency reservoir water for plant roots while discharging excess runoff through overflow channels." },
  3: { title: "Layer 3: Heavy-Duty Root Permeation Barrier", desc: "Chemical-free high-density polyethylene (HDPE) or TPO root barrier membrane preventing aggressive plant roots from penetrating the underlying slab waterproofing." },
  2: { title: "Layer 2: Elastomeric Waterproofing Membrane", desc: "Continuous, seamless liquid-applied polyurethane or APP-modified bitumen membrane with high crack-bridging flexibility and ponding water resistance." },
  1: { title: "Layer 1: Reinforced Cement Concrete (RCC) Structural Deck", desc: "Cast-in-situ reinforced concrete roof slab designed according to IS 456 / IS 875 load parameters." }
};

async function checkStructural() {
  const slabType = $("structSlabType") ? $("structSlabType").value : "rcc_125";
  const mediaDepthMm = Number($("structDepthSlider") ? $("structDepthSlider").value : 80);
  const buildingAgeYrs = Number($("structAgeSlider") ? $("structAgeSlider").value : 10);

  if ($("structDepthVal")) $("structDepthVal").textContent = `${mediaDepthMm} mm`;
  if ($("structAgeVal")) $("structAgeVal").textContent = `${buildingAgeYrs} Years`;

  let s = null;
  try {
    const res = await (typeof apiFetch === "function" ? apiFetch("/api/structural-check", {
      method: "POST",
      body: JSON.stringify({ slabType, mediaDepthMm, buildingAgeYrs })
    }) : fetch("/api/structural-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slabType, mediaDepthMm, buildingAgeYrs })
    }));
    const d = await res.json();
    if (d && d.ok && d.structural) s = d.structural;
  } catch (err) {}

  if (!s) {
    s = clientCalculateStructural({ slabType, mediaDepthMm, buildingAgeYrs });
  }

  if ($("structDryLoad")) $("structDryLoad").textContent = `${s.weights.totalDeadLoadDryKgM2} kg/m²`;
  if ($("structSatLoad")) $("structSatLoad").textContent = `${s.weights.totalDeadLoadSaturatedKgM2} kg/m² (${s.weights.saturatedKNPsqM} kN/m²)`;
  if ($("structCapacity")) $("structCapacity").textContent = `${s.weights.effectiveCapacityKgM2} kg/m²`;
  if ($("structSafetyFactor")) $("structSafetyFactor").textContent = `${s.safetyFactor}x`;

  const banner = $("structSafetyBadge");
  if (banner) {
    banner.className = `validation ${s.statusColor === "green" ? "valid" : "invalid"}`;
    banner.style.display = "block";
    banner.innerHTML = `${s.statusColor === "green" ? "🟢" : s.statusColor === "amber" ? "🟡" : "🔴"} <b>${s.safetyRating} — ${s.complianceCode}</b> ${s.safetyMessage}`;
  }
}

function initStructuralPage() {
  if ($("calcStructBtn")) $("calcStructBtn").onclick = checkStructural;
  if ($("structDepthSlider")) $("structDepthSlider").oninput = checkStructural;
  if ($("structAgeSlider")) $("structAgeSlider").oninput = checkStructural;
  if ($("structSlabType")) $("structSlabType").onchange = checkStructural;

  // The layer cards are clickable so the user can inspect each roof layer.
  document.querySelectorAll(".layer-item").forEach(item => {
    item.onclick = () => {
      document.querySelectorAll(".layer-item").forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      const id = item.dataset.layer;
      const l = currentLayerData[id];
      if (l) {
        if ($("layerDetailTitle")) $("layerDetailTitle").textContent = l.title;
        if ($("layerDetailDesc")) $("layerDetailDesc").textContent = l.desc;
      }
    };
  });

  checkStructural();
}

document.addEventListener("DOMContentLoaded", initStructuralPage);
