// Client-side fallback calculations.

const embeddedPlants = [
  { id: "sedum_spurium", name: "Sedum spurium (Two-Row Stonecrop)", group: "Succulent Groundcover", water: "Very Low", description: "Extreme drought tolerance with thick water-storing leaves, ideal for extensive green roofs.", mediaDepthMm: 60 },
  { id: "portulaca_grandiflora", name: "Portulaca grandiflora (Moss Rose)", group: "Flowering Succulent", water: "Low", description: "Vibrant native flowering succulent that thrives in direct full sun with minimal irrigation.", mediaDepthMm: 70 },
  { id: "aloe_vera", name: "Aloe vera (Indian Aloe)", group: "Medicinal CAM Succulent", water: "Low", description: "Crassulacean Acid Metabolism plant with superior nighttime cooling and air purification.", mediaDepthMm: 80 },
  { id: "cymbopogon_citratus", name: "Cymbopogon citratus (Lemongrass)", group: "Aromatic Grass", water: "Moderate", description: "Fibrous root matrix that prevents substrate erosion while naturally deterring mosquitoes and pests.", mediaDepthMm: 100 }
];

function clientCalculateAssessment(body) {
  const roofArea = Number(body.roofAreaSqFt) || state.roofArea || 650;
  const coverage = Number(body.coveragePercent) || state.coverage || 75;
  const deckType = (body.roof && body.roof.slabType) || state.analyzedDeckType || "concrete_rcc";
  const usableRatio = (body.visual && body.visual.usableAreaPercent ? body.visual.usableAreaPercent : (state.usableAreaPct || 78)) / 100;
  const usableSqFt = Math.round(roofArea * usableRatio);
  const greenSqFt = Math.round(usableSqFt * (coverage / 100));
  const greenM2 = greenSqFt * 0.0929;
  
  const costTier = body.costTier || state.costTier || "standard";
  const rateLow = costTier === "diy" ? 45 : costTier === "turnkey" ? 78 : 60;
  const rateHigh = costTier === "diy" ? 60 : costTier === "turnkey" ? 95 : 78;
  
  const estLow = Math.round(greenSqFt * rateLow);
  const estHigh = Math.round(greenSqFt * rateHigh);
  const rainAnnual = (body.environment && body.environment.annualRainfallMm) || state.annualRain || 950;
  const tempC = (body.environment && body.environment.temperatureC) || state.temp || 28.5;

  // Use the image checks as one input to the feasibility score.
  const usableScore = (usableRatio * 100) * 0.38;
  const weatherScore = Math.min(28, Math.max(12, Math.round(28 - Math.abs(rainAnnual - 950) * 0.012)));
  const deckBonus = deckType === "cool_roof_coating" ? 26 : deckType === "concrete_rcc" ? 24 : deckType === "vegetated_deck" ? 22 : 18;
  const dynamicScore = Math.min(96, Math.max(58, Math.round(usableScore + weatherScore + deckBonus)));

  let dynamicStatus = "EXCELLENT CANDIDATE (HIGH FEASIBILITY)";
  if (dynamicScore < 65) dynamicStatus = "MODERATE FEASIBILITY (LIGHTWEIGHT SYSTEM ADVISED)";
  else if (dynamicScore < 78) dynamicStatus = "GOOD FEASIBILITY (MODULAR RETROFIT RECOMMENDED)";

  const waterL = Math.round(greenM2 * (rainAnnual / 1000) * 0.65 * 1000);
  const coolingIdx = Math.min(98, Math.max(40, Math.round(38 + (coverage * 0.42) + (usableRatio * 20))));
  const sustainScore = Math.min(100, Math.max(45, Math.round(40 + (coverage * 0.45) + (dynamicScore * 0.15))));

  const surfaceDrop = Math.min(28, Math.max(12, Math.round(14 + (greenSqFt / 220) * 4.2 + (coverage / 100) * 4)));
  const indoorDrop = Math.min(6.5, Math.max(1.8, Math.round((2.2 + (coverage / 100) * 2.8) * 10) / 10));

  // Rank plants using the weather and roof inputs.
  const rankedPlants = embeddedPlants.slice().sort((a, b) => {
    let scoreA = tempC > 30 ? (a.id === "sedum_spurium" ? 2 : 1) : (a.id === "portulaca_grandiflora" ? 2 : 1);
    let scoreB = tempC > 30 ? (b.id === "sedum_spurium" ? 2 : 1) : (b.id === "portulaca_grandiflora" ? 2 : 1);
    return scoreB - scoreA;
  });

  return {
    recommendation: { score: dynamicScore, status: dynamicStatus },
    inputs: { roofAreaSqFt: roofArea, coveragePercent: coverage },
    budget: {
      recommendedGreenAreaSqFt: greenSqFt,
      estimatedLow: estLow,
      estimatedHigh: estHigh,
      rateLowPerSqFt: rateLow,
      rateHighPerSqFt: rateHigh,
      starterCostLow: Math.round(100 * rateLow),
      starterCostHigh: Math.round(100 * rateHigh),
      budgetTiers: {
        sqft50: { low: Math.round(50 * rateLow), high: Math.round(50 * rateHigh) },
        sqft100: { low: Math.round(100 * rateLow), high: Math.round(100 * rateHigh) },
        sqft150: { low: Math.round(150 * rateLow), high: Math.round(150 * rateHigh) },
        sqft200: { low: Math.round(200 * rateLow), high: Math.round(200 * rateHigh) }
      }
    },
    impact: {
      estimatedRainwaterCaptureLitresPerYear: waterL,
      coolingIndex: coolingIdx,
      sustainabilityScore: sustainScore,
      surfaceTempDropC: surfaceDrop,
      indoorAmbientDropC: indoorDrop,
      carbonSequestrationKgYr: Math.round(greenM2 * 1.8 * 10) / 10,
      oxygenProducedKgYr: Math.round(greenM2 * 1.3 * 10) / 10
    },
    planting: { candidates: rankedPlants },
    usableAreaTrace: {
      declaredRoofAreaSqFt: roofArea,
      usableAreaRatioPercent: Math.round(usableRatio * 100),
      estimatedUsableAreaSqFt: usableSqFt,
      netGreenAreaSqFt: greenSqFt
    },
    factors: {
      visibleRoofEvidence: Math.round(85 + usableRatio * 10),
      rainfallSuitability: weatherScore * 3,
      usableAreaAssumption: Math.round(usableRatio * 100),
      structuralVerification: deckBonus * 4
    }
  };
}

function clientCalculateStructural(body) {
  const slabType = body.slabType || "rcc_125";
  const mediaDepthMm = Number(body.mediaDepthMm) || 80;
  const buildingAgeYrs = Number(body.buildingAgeYrs) || 10;
  
  const depthM = mediaDepthMm / 1000;
  const soilDry = Math.round(600 * depthM);
  const soilSat = Math.round(950 * depthM);
  const deadLoadSat = soilSat + 8 + 6 + 4;
  
  let slabCap = 175;
  let slabDesc = "Standard 125mm Cast In-situ RCC Slab";
  if (slabType === "rcc_150") { slabCap = 240; slabDesc = "Heavy-Duty 150mm Reinforced Concrete Slab"; }
  else if (slabType === "filler_slab") { slabCap = 145; slabDesc = "Precast / Filler Slab Construction"; }
  else if (slabType === "profiled_sheet") { slabCap = 110; slabDesc = "Insulated Profiled Metal / Steel Deck"; }
  
  const effectiveCap = Math.round(slabCap * Math.max(0.75, 1 - (buildingAgeYrs * 0.003)));
  const sf = Math.round((effectiveCap / deadLoadSat) * 100) / 100;
  
  return {
    slabType, slabDesc, mediaDepthMm, buildingAgeYrs,
    weights: {
      totalDeadLoadDryKgM2: soilDry + 18,
      totalDeadLoadSaturatedKgM2: deadLoadSat,
      saturatedKNPsqM: Math.round(deadLoadSat * 0.00981 * 100) / 100,
      effectiveCapacityKgM2: effectiveCap
    },
    safetyFactor: sf,
    safetyRating: sf >= 1.3 ? "SAFE" : sf >= 1.0 ? "CAUTION / MARGINAL" : "CRITICAL OVERLOAD",
    statusColor: sf >= 1.3 ? "green" : sf >= 1.0 ? "amber" : "red",
    complianceCode: "IS 875 (Part 2) & NBC 2016",
    safetyMessage: sf >= 1.3 ? "Structural load is safely within permissible IS 875 limits." : "Caution: Reduce media depth."
  };
}

function clientCalculateBiosolarSynergy(body = {}) {
  const solarCapacityKWp = Number(body.solarCapacityKWp) || 3.0;
  const roofAreaSqFt = Number(body.roofAreaSqFt) || state.roofArea || 650;
  const greenCoveragePct = Number(body.greenCoveragePct) || state.coverage || 75;
  const electricityRate = Number(body.electricityRatePerKWh) || 8.0;
  const acUnitsCount = Number(body.acUnitsCount) || 2;
  const panelType = body.panelType || "monocrystalline";

  const tempCoeff = panelType === "polycrystalline" ? 0.0042 : 0.0038;
  const panelTempDropC = Math.round(12 + (greenCoveragePct / 100) * 6);
  const efficiencyBoostPct = Math.round(((panelTempDropC * tempCoeff * 100) + 4.5) * 10) / 10;
  
  const baselineGenerationKWh = Math.round(solarCapacityKWp * 1450);
  const extraSolarKWhYr = Math.round(baselineGenerationKWh * (efficiencyBoostPct / 100));
  const totalSolarKWhYr = baselineGenerationKWh + extraSolarKWhYr;

  const hvacSavingsKWhYr = Math.round(acUnitsCount * 1200 * 0.22);
  const totalCleanEnergyGainKWh = extraSolarKWhYr + hvacSavingsKWhYr;
  const extraCarbonOffsetKgYr = Math.round(totalCleanEnergyGainKWh * 0.82);

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
    }
  };
}

function clientGetIoT(body) {
  const isDry = body.forceDry === true;
  const rain = body.forceRain ? 50 : isDry ? 0 : (state.rain || 38);
  const moisture = isDry ? 21 : 48;
  const temp = isDry ? 36.5 : 25.0;
  const cistern = isDry ? 42 : 61;
  const valve = isDry ? "OPEN (PULSE DRIP)" : rain > 15 ? "HELD_OFF (RAIN FORECAST)" : "CLOSED";
  const mode = isDry ? "ACTIVE_HYDRATION" : rain > 15 ? "WEATHER_PREDICTIVE_HOLD" : "AUTOMATED_OPTIMAL";
  const msg = isDry ? "Soil moisture critical (21%). Solenoid valve OPENED for 8-min drip cycle." : rain > 15 ? `Rain predicted (${rain}mm). Solenoid held to save 160L water.` : "Moisture levels optimal (48%). Soil hydration adequate.";
  
  return {
    sensors: { soilMoisturePct: moisture, substrateTempC: temp, cisternTankLevelPct: cistern },
    actuator: { dripValveState: valve, mode: mode, statusMessage: msg }
  };
}
