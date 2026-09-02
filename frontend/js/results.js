// Results and report rendering.

function renderResults() {
  let a = state.currentAssessment;
  if (!a) {
    // A direct visit has no saved assessment, so use the default values.
    a = clientCalculateAssessment({
      roofAreaSqFt: state.roofArea || 650,
      coveragePercent: state.coverage || 75,
      costTier: state.costTier || "standard",
      environment: { annualRainfallMm: state.annualRain || 950 },
      visual: { usableAreaPercent: state.usableAreaPct || 78 }
    });
    saveState({ currentAssessment: a });
  }

  // Score summary.
  const score = a.recommendation.score;
  if ($("score")) $("score").textContent = score;
  const circumference = 326.7;
  if ($("gaugeFill")) {
    $("gaugeFill").style.strokeDashoffset = circumference - (circumference * score / 100);
  }
  if ($("status")) $("status").textContent = a.recommendation.status;
  if ($("dashLocation")) {
    $("dashLocation").textContent = `Location: ${state.place} • Gross Roof: ${a.inputs.roofAreaSqFt} sq ft • Net Greening: ${a.budget.recommendedGreenAreaSqFt} sq ft`;
  }

  // Budget summary.
  const b = a.budget;
  if ($("starterPilotCost")) $("starterPilotCost").textContent = `₹${b.starterCostLow.toLocaleString()}–₹${b.starterCostHigh.toLocaleString()}`;
  if ($("fullGreenAreaLabel")) $("fullGreenAreaLabel").textContent = `${b.recommendedGreenAreaSqFt} sq ft`;
  if ($("cost")) $("cost").textContent = `₹${b.estimatedLow.toLocaleString()}–₹${b.estimatedHigh.toLocaleString()}`;
  if ($("costRateLabel")) $("costRateLabel").textContent = `₹${b.rateLowPerSqFt}–₹${b.rateHighPerSqFt} / sq ft`;

  if ($("tier50")) $("tier50").textContent = `₹${b.budgetTiers.sqft50.low.toLocaleString()}–₹${b.budgetTiers.sqft50.high.toLocaleString()}`;
  if ($("tier100")) $("tier100").textContent = `₹${b.budgetTiers.sqft100.low.toLocaleString()}–₹${b.budgetTiers.sqft100.high.toLocaleString()}`;
  if ($("tier150")) $("tier150").textContent = `₹${b.budgetTiers.sqft150.low.toLocaleString()}–₹${b.budgetTiers.sqft150.high.toLocaleString()}`;
  if ($("tier200")) $("tier200").textContent = `₹${b.budgetTiers.sqft200.low.toLocaleString()}–₹${b.budgetTiers.sqft200.high.toLocaleString()}`;

  // Main assessment values.
  if ($("water")) $("water").textContent = `${a.impact.estimatedRainwaterCaptureLitresPerYear.toLocaleString()} L/yr`;
  if ($("cooling")) $("cooling").textContent = `${a.impact.coolingIndex}/100`;
  if ($("sustainability")) $("sustainability").textContent = `${a.impact.sustainabilityScore}/100`;

  // Environmental figures.
  if ($("uhiSurface")) $("uhiSurface").textContent = `-${a.impact.surfaceTempDropC} °C`;
  if ($("uhiIndoor")) $("uhiIndoor").textContent = `-${a.impact.indoorAmbientDropC} °C`;
  if ($("carbonSeq")) $("carbonSeq").textContent = `${a.impact.carbonSequestrationKgYr} kg CO₂/yr`;
  if ($("oxygenProd")) $("oxygenProd").textContent = `${a.impact.oxygenProducedKgYr} kg O₂/yr`;

  // Plant suggestions.
  const plants = (a.planting && a.planting.candidates) || embeddedPlants;
  if ($("plantCards")) {
    $("plantCards").innerHTML = plants.map((p, i) => `
      <div class="plant-card ${i === 0 ? "best" : ""}">
        <div class="plant-rank">${i === 0 ? "⭐ Top Native Fit" : "Indigenous Option"}</div>
        <b>${p.name}</b>
        <div class="plant-fit">${p.group}</div>
        <div class="plant-use">${p.description}</div>
        <div class="plant-fit" style="margin-top:6px;color:var(--muted)">Depth: ${p.mediaDepthMm || 60}mm • ${p.water} water</div>
      </div>
    `).join("");
  }

  // Show how the usable area was calculated.
  const t = a.usableAreaTrace;
  if ($("traceFormula") && t) {
    $("traceFormula").textContent = `Gross Area (${t.declaredRoofAreaSqFt} sq ft) × ${t.usableAreaRatioPercent}% Usable Deck = ${t.estimatedUsableAreaSqFt} sq ft × ${a.inputs.coveragePercent}% Coverage = ${t.netGreenAreaSqFt} sq ft Net Green Area`;
  }

  // Show the score inputs.
  const f = a.factors;
  if ($("weightedList") && f) {
    $("weightedList").innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><b>Visible Roof Evidence:</b> ${f.visibleRoofEvidence}% (Weight 25%)</div>
        <div><b>Rainfall Suitability:</b> ${f.rainfallSuitability}% (Weight 20%)</div>
        <div><b>Usable Deck Area:</b> ${f.usableAreaAssumption}% (Weight 15%)</div>
        <div><b>Structural Integrity:</b> ${f.structuralVerification}% (Weight 20%)</div>
      </div>
    `;
  }

  updateScenario();
}

async function updateScenario() {
  const roofAreaSqFt = (state.currentAssessment && state.currentAssessment.inputs.roofAreaSqFt) || state.roofArea || 650;
  const coverageB = Number($("scenarioSlider") ? $("scenarioSlider").value : 75);
  if ($("scenarioCoverageVal")) $("scenarioCoverageVal").textContent = coverageB;
  if ($("scenarioTableCol")) $("scenarioTableCol").textContent = `${coverageB}% Selected Plan`;

  let sc50 = null, scCur = null;
  try {
    const res = await (typeof apiFetch === "function" ? apiFetch("/api/scenario", {
      method: "POST",
      body: JSON.stringify({ roofAreaSqFt, coverageA: 50, coverageB })
    }) : fetch("/api/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roofAreaSqFt, coverageA: 50, coverageB })
    }));
    const d = await res.json();
    if (d && d.scenarios) {
      [sc50, scCur] = d.scenarios;
    }
  } catch (e) {}

  if (!sc50 || !scCur) {
    const g50 = Math.round(roofAreaSqFt * 0.78 * 0.50);
    const gCur = Math.round(roofAreaSqFt * 0.78 * (coverageB / 100));
    sc50 = { estimatedLow: Math.round(g50 * 60), estimatedHigh: Math.round(g50 * 78), rainwaterCaptureLitresPerYear: Math.round(g50 * 0.0929 * 0.95 * 0.65 * 1000), sustainabilityScore: 72 };
    scCur = { estimatedLow: Math.round(gCur * 60), estimatedHigh: Math.round(gCur * 78), rainwaterCaptureLitresPerYear: Math.round(gCur * 0.0929 * 0.95 * 0.65 * 1000), sustainabilityScore: Math.min(100, Math.round(45 + coverageB * 0.5)) };
  }

  if ($("scCost50")) $("scCost50").textContent = `₹${sc50.estimatedLow.toLocaleString()}–₹${sc50.estimatedHigh.toLocaleString()}`;
  if ($("scCostCurrent")) $("scCostCurrent").textContent = `₹${scCur.estimatedLow.toLocaleString()}–₹${scCur.estimatedHigh.toLocaleString()}`;
  if ($("scWater50")) $("scWater50").textContent = `${sc50.rainwaterCaptureLitresPerYear.toLocaleString()} L/yr`;
  if ($("scWaterCurrent")) $("scWaterCurrent").textContent = `${scCur.rainwaterCaptureLitresPerYear.toLocaleString()} L/yr`;
  if ($("scSus50")) $("scSus50").textContent = `${sc50.sustainabilityScore} / 100`;
  if ($("scSusCurrent")) $("scSusCurrent").textContent = `${scCur.sustainabilityScore} / 100`;

  const maxCost = Math.max(scCur.estimatedHigh, 1);
  if ($("barScCost50")) $("barScCost50").style.width = `${Math.min(100, (sc50.estimatedHigh / maxCost) * 100)}%`;
  if ($("barScCostCurrent")) $("barScCostCurrent").style.width = "100%";

  const maxWater = Math.max(scCur.rainwaterCaptureLitresPerYear, 1);
  if ($("barScWater50")) $("barScWater50").style.width = `${Math.min(100, (sc50.rainwaterCaptureLitresPerYear / maxWater) * 100)}%`;
  if ($("barScWaterCurrent")) $("barScWaterCurrent").style.width = "100%";
}

function initResultsPage() {
  renderResults();
  if ($("scenarioSlider")) $("scenarioSlider").oninput = updateScenario;
  if ($("goToPhase2Btn")) {
    $("goToPhase2Btn").onclick = () => { window.location.href = "iot.html"; };
  }
}

document.addEventListener("DOMContentLoaded", initResultsPage);
