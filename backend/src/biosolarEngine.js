// biosolar.

export async function calculateBiosolarSynergy(body = {}) {
  const solarCapacityKWp = Number(body.solarCapacityKWp) || 3.0;
  const roofAreaSqFt = Number(body.roofAreaSqFt) || 650;
  const greenCoveragePct = Number(body.greenCoveragePct) || 75;
  const electricityRate = Number(body.electricityRatePerKWh) || 8.0; // ₹ per unit (kWh)
  const acUnitsCount = Number(body.acUnitsCount) || 2;
  const panelType = body.panelType || "monocrystalline";

  // Solar physics: thermal cooling & PV output boost
  const tempCoeff = panelType === "polycrystalline" ? 0.0042 : 0.0038;
  const panelTempDropC = Math.round(12 + (greenCoveragePct / 100) * 6); // 12°C to 18°C panel cooling
  const efficiencyBoostPct = Math.round(((panelTempDropC * tempCoeff * 100) + 4.5) * 10) / 10; // ~10.5% boost
  
  const baselineGenerationKWh = Math.round(solarCapacityKWp * 1450);
  const extraSolarKWhYr = Math.round(baselineGenerationKWh * (efficiencyBoostPct / 100));
  const totalSolarKWhYr = baselineGenerationKWh + extraSolarKWhYr;

  // Building top-floor passive thermal insulation savings (AC electricity)
  const hvacSavingsKWhYr = Math.round(acUnitsCount * 1200 * 0.22); // 22% cooling reduction per AC unit
  const totalCleanEnergyGainKWh = extraSolarKWhYr + hvacSavingsKWhYr;
  const extraCarbonOffsetKgYr = Math.round(totalCleanEnergyGainKWh * 0.82);

  // Financial bill savings in Rupees (₹ INR)
  const solarSavingsINR = Math.round(extraSolarKWhYr * electricityRate);
  const hvacSavingsINR = Math.round(hvacSavingsKWhYr * electricityRate);
  const totalAnnualSavingsINR = solarSavingsINR + hvacSavingsINR;

  const greenAreaSqFt = Math.round(roofAreaSqFt * (greenCoveragePct / 100) * 0.78);
  const initialInstallationCostINR = Math.round(greenAreaSqFt * 65);
  const paybackPeriodYrs = totalAnnualSavingsINR > 0 ? Math.round((initialInstallationCostINR / totalAnnualSavingsINR) * 10) / 10 : 3.1;
  const roi10YrINR = (totalAnnualSavingsINR * 10) - initialInstallationCostINR;

  return {
    solarCapacityKWp,
    panelType,
    electricityRatePerKWh: electricityRate,
    metrics: {
      panelTempDropC,
      solarBoostPercent: efficiencyBoostPct,
      baselineGenerationKWh,
      extraSolarKWhYr,
      totalSolarKWhYr,
      hvacSavingsKWhYr,
      totalCleanEnergyGainKWh,
      solarSavingsINR,
      hvacSavingsINR,
      totalAnnualSavingsINR,
      initialInstallationCostINR,
      paybackPeriodYrs,
      roi10YrINR,
      extraCarbonOffsetKgYr
    },
    synergySummary: `Co-locating ${solarCapacityKWp} kWp solar panels with green roof vegetation lowers panel operating temperature by ${panelTempDropC}°C, boosting electricity generation by +${efficiencyBoostPct}% (+${extraSolarKWhYr} kWh/yr) and saving ₹${totalAnnualSavingsINR.toLocaleString()} annually on power bills!`
  };
}
