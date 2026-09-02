// Biosolar calculator.

async function checkBiosolarSynergy() {
  const roofAreaSqFt = state.roofArea || 650;
  const greenCoveragePct = Number($("roiGreenCoverage") ? $("roiGreenCoverage").value : (state.coverage || 75)) || 75;
  const solarCapacityKWp = Number($("roiSolarKw") ? $("roiSolarKw").value : 3.0) || 3.0;
  const electricityRate = Number($("roiTariffRate") ? $("roiTariffRate").value : 8.0) || 8.0;
  const acUnitsCount = Number($("roiAcUnits") ? $("roiAcUnits").value : 2) || 2;

  // Keep the value labels beside the sliders updated.
  if ($("roiSolarKwLabel")) $("roiSolarKwLabel").textContent = `${solarCapacityKWp.toFixed(1)} kWp`;
  if ($("roiGreenCoverageLabel")) $("roiGreenCoverageLabel").textContent = `${greenCoveragePct}%`;

  let b = null;
  try {
    const res = await (typeof apiFetch === "function" ? apiFetch("/api/biosolar-synergy", {
      method: "POST",
      body: JSON.stringify({ roofAreaSqFt, greenCoveragePct, solarCapacityKWp, electricityRatePerKWh: electricityRate, acUnitsCount })
    }) : fetch("/api/biosolar-synergy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roofAreaSqFt, greenCoveragePct, solarCapacityKWp, electricityRatePerKWh: electricityRate, acUnitsCount })
    }));
    const d = await res.json();
    if (d && d.biosolar) b = d.biosolar;
  } catch (e) {}

  if (!b && typeof clientCalculateBiosolarSynergy === "function") {
    b = clientCalculateBiosolarSynergy({ roofAreaSqFt, greenCoveragePct, solarCapacityKWp, electricityRatePerKWh: electricityRate, acUnitsCount });
  }

  if (b && b.metrics) {
    const m = b.metrics;
    if ($("roiSolarTempDrop")) $("roiSolarTempDrop").textContent = `-${m.panelTempDropC}°C Surface Cooling`;
    if ($("roiSolarBoost")) $("roiSolarBoost").textContent = `+${m.solarBoostPercent}% Output Boost`;
    if ($("roiSolarSavings")) $("roiSolarSavings").textContent = `₹${m.solarSavingsINR.toLocaleString()} / year (+${m.extraSolarKWhYr} kWh)`;
    if ($("roiAcSavings")) $("roiAcSavings").textContent = `₹${m.hvacSavingsINR.toLocaleString()} / year (${m.hvacSavingsKWhYr} kWh saved)`;
    if ($("roiAnnualTotal")) $("roiAnnualTotal").textContent = `₹${m.totalAnnualSavingsINR.toLocaleString()} / yr`;
    if ($("roiEnergyGainSubtitle")) $("roiEnergyGainSubtitle").textContent = `+${m.totalCleanEnergyGainKWh.toLocaleString()} kWh total clean energy / yr`;
    if ($("roiSetupCost")) $("roiSetupCost").textContent = `₹${m.initialInstallationCostINR.toLocaleString()}`;
    if ($("roiPaybackYears")) $("roiPaybackYears").textContent = `${m.paybackPeriodYrs} Years`;
    if ($("roi10YrNet")) $("roi10YrNet").textContent = `₹${m.roi10YrINR.toLocaleString()}`;
    if ($("roiCarbonOffset")) $("roiCarbonOffset").textContent = `${m.extraCarbonOffsetKgYr.toLocaleString()} kg CO₂ / yr`;
  }
}

function initBiosolarPage() {
  if ($("calcRoiBtn")) $("calcRoiBtn").onclick = checkBiosolarSynergy;
  if ($("roiSolarKw")) $("roiSolarKw").oninput = checkBiosolarSynergy;
  if ($("roiGreenCoverage")) $("roiGreenCoverage").oninput = checkBiosolarSynergy;
  if ($("roiTariffRate")) $("roiTariffRate").oninput = checkBiosolarSynergy;
  if ($("roiAcUnits")) $("roiAcUnits").oninput = checkBiosolarSynergy;

  checkBiosolarSynergy();
}

document.addEventListener("DOMContentLoaded", initBiosolarPage);
