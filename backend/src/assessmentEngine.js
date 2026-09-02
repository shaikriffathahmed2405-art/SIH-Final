import { getPlants, getPestManagement } from "./dataService.js";

export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const num = (v, fallback = null) => Number.isFinite(Number(v)) ? Number(v) : fallback;

export function normalizeEnvironment(input = {}) {
  return {
    temperatureC: num(input.temperatureC, 28.5),
    rainfall7dMm: num(input.rainfall7dMm, 38),
    annualRainfallMm: num(input.annualRainfallMm, 950),
    climate: input.climate || "Tropical Warm",
    source: input.source || "prototype-fallback"
  };
}

export function selectPlants(plants, env, roof = {}) {
  const hot = env.temperatureC >= 28;
  const dry = env.rainfall7dMm < 30;
  const shallow = roof.mediaDepth === "shallow" || roof.mediaDepth == null;

  const candidates = plants.map(p => {
    let score = 50;
    if (hot && p.hot) score += 18;
    if (dry && p.dry) score += 18;
    if (!dry && p.wet) score += 10;
    if (shallow && p.media === "shallow") score += 15;
    if (shallow && p.media !== "shallow") score -= 10;
    if (roof.sunExposure === "full_sun" && p.sun === "full_sun") score += 8;
    if (roof.irrigation === "limited" && p.water === "low") score += 8;
    if (p.uses?.includes("exposed_roof")) score += 6;
    if (p.uses?.includes("biosolar")) score += 5;
    return { ...p, score: clamp(Math.round(score), 0, 100) };
  }).sort((a, b) => b.score - a.score);

  return candidates.slice(0, 4);
}

export async function calculateAssessment(body = {}) {
  const plants = await getPlants();
  const pestManagement = await getPestManagement();

  const roofAreaSqFt = clamp(num(body.roofAreaSqFt, 650), 10, 100000);
  const env = normalizeEnvironment(body.environment);
  const roof = body.roof || {};
  const visual = body.visual || {};

  const visibleRoofEvidence = clamp(num(visual.visibleRoofEvidence, 85), 0, 100);
  const usableArea = clamp(num(visual.usableAreaPercent, 78), 0, 100);
  const rainfallSuitability = clamp(
    Math.round(100 - Math.abs(env.rainfall7dMm - 35) * 1.2),
    35, 95
  );

  const structuralVerified = roof.structuralVerified === true;
  const waterproofingVerified = roof.waterproofingVerified === true;
  const drainageVerified = roof.drainageVerified === true;

  let score = Math.round(
    visibleRoofEvidence * 0.25 +
    rainfallSuitability * 0.20 +
    usableArea * 0.15 +
    (structuralVerified ? 100 : 50) * 0.20 +
    (waterproofingVerified ? 100 : 50) * 0.10 +
    (drainageVerified ? 100 : 55) * 0.10
  );
  score = clamp(score, 0, 100);

  const recommendation =
    score >= 75 ? "Lightweight Modular Extensive Green Roof" :
    score >= 60 ? "Lightweight Modular Green Roof — Verification Advised" :
    "Roof Verification Required Prior to Green-Roof Installation";

  const requestedCoverage = clamp(num(body.coveragePercent, 75), 10, 100);
  const calculatedUsableSqFt = Math.round(roofAreaSqFt * (usableArea / 100));
  const greenAreaSqFt = Math.min(
    Math.round(calculatedUsableSqFt * requestedCoverage / 100),
    calculatedUsableSqFt
  );

  // Keep the three price bands here so the UI and API use the same figures.
  const costTier = body.costTier || "standard";
  let rateLow = 60;
  let rateHigh = 78;

  if (costTier === "diy") {
    rateLow = 45; rateHigh = 60;
  } else if (costTier === "turnkey") {
    rateLow = 78; rateHigh = 95;
  }

  const costLow = Math.round(greenAreaSqFt * rateLow);
  const costHigh = Math.round(greenAreaSqFt * rateHigh);

  // Small pilot option for users who do not want to cover the whole roof.
  const starterPilotSqFt = Math.min(100, greenAreaSqFt);
  const starterCostLow = Math.round(starterPilotSqFt * rateLow);
  const starterCostHigh = Math.round(starterPilotSqFt * rateHigh);

  const plantsSelected = selectPlants(plants, env, roof);
  const topPlant = plantsSelected[0];

  // Estimate annual rainwater retention from the green area.
  const greenAreaM2 = greenAreaSqFt * 0.0929;
  const annualRainMm = env.annualRainfallMm || 950;
  const retentionCoeff = 0.65;
  const waterLitres = Math.round(greenAreaM2 * (annualRainMm / 1000) * retentionCoeff * 1000);
  const coolingIndex = clamp(Math.round(42 + score * 0.45 + (topPlant?.water === "low" ? 6 : 0)), 0, 98);
  const sustainability = clamp(Math.round(score * 0.60 + coolingIndex * 0.40), 0, 100);

  // Rough cooling estimates used by the prototype.
  const surfaceTempDropC = clamp(Math.round(16 + (greenAreaSqFt / 180) * 4), 15, 26);
  const indoorAmbientDropC = clamp(Math.round(2.2 + (score / 100) * 1.8), 2.0, 4.5);

  // Annual carbon and oxygen estimates.
  const carbonSequestrationKgYr = Math.round(greenAreaM2 * (topPlant?.carbonAbsorptionKgPerM2Yr || 1.8) * 10) / 10;
  const oxygenProducedKgYr = Math.round(carbonSequestrationKgYr * 2.67 * 10) / 10;

  // Basic BOQ used for the estimate.
  const boq = {
    drainageTrays: { item: "Dimpled High-Density PE Drainage & Retention Trays", qty: `${greenAreaSqFt} sq ft`, cost: Math.round(greenAreaSqFt * 18) },
    filterFleece: { item: "Needle-Punched Non-Woven Geotextile Filter Membrane", qty: `${greenAreaSqFt} sq ft`, cost: Math.round(greenAreaSqFt * 8) },
    lightweightMedia: { item: "Engineered Lightweight Substrate (Coco-peat, Perlite, Pumice, Compost)", qty: `${Math.round(greenAreaSqFt * 0.07)} cu.m`, cost: Math.round(greenAreaSqFt * 22) },
    vegetation: { item: `Plug Plants / Succulent Groundcover (${topPlant?.name || "Portulaca / Purslane / Sedum"})`, qty: `${Math.round(greenAreaSqFt * 1.2)} units`, cost: Math.round(greenAreaSqFt * 14) },
    dripSystem: { item: "Micro-Drip Irrigation Line with Timer & Connectors", qty: "1 Kit", cost: Math.round(greenAreaSqFt * 6) }
  };

  const confidence = clamp(
    Math.round(
      55 +
      visibleRoofEvidence * 0.20 +
      (env.source === "live" ? 15 : 5) +
      (roofAreaSqFt ? 10 : 0)
    ), 0, 98
  );

  return {
    assessmentVersion: "backend-v2-sih-pro",
    generatedAt: new Date().toISOString(),
    inputs: {
      roofAreaSqFt,
      coveragePercent: requestedCoverage,
      costTier,
      environment: env,
      roof,
      visual
    },
    recommendation: {
      score,
      status: score >= 75 ? "EXCELLENT CANDIDATE" : score >= 60 ? "PROMISING FEASIBILITY" : "STRUCTURAL REVIEW REQUIRED",
      roofSystem: recommendation,
      confidence,
      rationale: score >= 75
        ? "The site demonstrates high feasibility for a lightweight modular extensive green roof system with excellent environmental, stormwater, and microclimate cooling returns."
        : "Moderate feasibility detected. Site inspection and shallow modular tray layout recommended prior to full substrate installation."
    },
    factors: {
      visibleRoofEvidence,
      rainfallSuitability,
      usableAreaAssumption: usableArea,
      structuralVerification: structuralVerified ? 100 : 50,
      waterproofingVerification: waterproofingVerified ? 100 : 50,
      drainageVerification: drainageVerified ? 100 : 55
    },
    factorWeights: {
      visibleRoofEvidence: 0.25,
      rainfallSuitability: 0.20,
      usableAreaAssumption: 0.15,
      structuralVerification: 0.20,
      waterproofingVerification: 0.10,
      drainageVerification: 0.10
    },
    planting: {
      bestFit: topPlant,
      candidates: plantsSelected
    },
    budget: {
      costTier,
      recommendedGreenAreaSqFt: greenAreaSqFt,
      rateLowPerSqFt: rateLow,
      rateHighPerSqFt: rateHigh,
      estimatedLow: costLow,
      estimatedHigh: costHigh,
      starterPilotSqFt,
      starterCostLow,
      starterCostHigh,
      budgetTiers: {
        sqft50: { low: Math.round(50 * rateLow), high: Math.round(50 * rateHigh) },
        sqft100: { low: Math.round(100 * rateLow), high: Math.round(100 * rateHigh) },
        sqft150: { low: Math.round(150 * rateLow), high: Math.round(150 * rateHigh) },
        sqft200: { low: Math.round(200 * rateLow), high: Math.round(200 * rateHigh) }
      },
      boq,
      note: "Affordable modular green roof estimate in Indian Rupees (₹). Major structural retrofits excluded."
    },
    usableAreaTrace: {
      declaredRoofAreaSqFt: roofAreaSqFt,
      usableAreaRatioPercent: usableArea,
      estimatedUsableAreaSqFt: calculatedUsableSqFt,
      netGreenAreaSqFt: greenAreaSqFt,
      formula: `${roofAreaSqFt} sq ft × ${usableArea}% usable deck × ${requestedCoverage}% coverage = ${greenAreaSqFt} sq ft`
    },
    impact: {
      estimatedRainwaterCaptureLitresPerYear: waterLitres,
      coolingIndex,
      sustainabilityScore: sustainability,
      surfaceTempDropC,
      indoorAmbientDropC,
      carbonSequestrationKgYr,
      oxygenProducedKgYr
    },
    pestManagement,
    nextSteps: [
      "Confirm slab dead-load allowance with the IS 875 Structural Safety Tool.",
      "Apply elastomeric waterproofing primer and install dimpled drainage / water retention trays.",
      "Plant pre-conditioned native succulents / herbs with micro-drip hydration.",
      "Register project with Municipal Corporation for property tax rebate and GRIHA green points."
    ]
  };
}

export function calculateScenario(body = {}) {
  const roofAreaSqFt = clamp(num(body.roofAreaSqFt, 650), 10, 100000);
  const usableRatio = 0.78;
  const rates = { low: 60, high: 78 };

  const build = pct => {
    const greenArea = Math.round(roofAreaSqFt * usableRatio * pct / 100);
    const greenAreaM2 = greenArea * 0.0929;
    const annualRainMm = 950;
    return {
      coveragePercent: pct,
      greenAreaSqFt: greenArea,
      estimatedLow: Math.round(greenArea * rates.low),
      estimatedHigh: Math.round(greenArea * rates.high),
      rainwaterCaptureLitresPerYear: Math.round(greenAreaM2 * (annualRainMm / 1000) * 0.65 * 1000),
      coolingIndex: clamp(Math.round(42 + pct * 0.45), 0, 98),
      sustainabilityScore: clamp(Math.round(45 + pct * 0.50), 0, 100),
      surfaceTempDropC: clamp(Math.round(16 + (greenArea / 180) * 4), 15, 26),
      carbonSequestrationKgYr: Math.round(greenAreaM2 * 1.8 * 10) / 10
    };
  };

  const coverageA = clamp(num(body.coverageA, 50), 10, 100);
  const coverageB = clamp(num(body.coverageB, 75), 10, 100);
  return { scenarios: [build(coverageA), build(coverageB)] };
}
