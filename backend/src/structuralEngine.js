import { clamp, num } from "./assessmentEngine.js";

export function calculateStructuralCheck(body = {}) {
  const slabType = body.slabType || "rcc_125";
  const mediaDepthMm = clamp(num(body.mediaDepthMm, 80), 40, 250);
  const buildingAgeYrs = clamp(num(body.buildingAgeYrs, 10), 0, 80);
  const hasVegetationTrays = body.traySystem !== false;

  // Saturated density of engineered lightweight substrate with perlite + vermiculite + coco-peat is ~950 kg/m3
  const mediaDryDensity = 600;
  const mediaSaturatedDensity = 950;

  const depthM = mediaDepthMm / 1000;
  const soilDryKgM2 = Math.round(mediaDryDensity * depthM);
  const soilSaturatedKgM2 = Math.round(mediaSaturatedDensity * depthM);

  const drainageTrayKgM2 = hasVegetationTrays ? 8 : 4;
  const plantBiomassKgM2 = 6;
  const waterproofingWeightKgM2 = 4;

  const totalDeadLoadDryKgM2 = soilDryKgM2 + drainageTrayKgM2 + plantBiomassKgM2 + waterproofingWeightKgM2;
  const totalDeadLoadSaturatedKgM2 = soilSaturatedKgM2 + drainageTrayKgM2 + plantBiomassKgM2 + waterproofingWeightKgM2;

  const saturatedKNPsqM = Math.round((totalDeadLoadSaturatedKgM2 * 0.00981) * 100) / 100;

  let slabCapacityKgM2 = 175;
  let slabDesc = "Standard 125mm Cast In-situ RCC Slab";

  if (slabType === "rcc_150") {
    slabCapacityKgM2 = 240;
    slabDesc = "Heavy-Duty 150mm Reinforced Concrete Slab";
  } else if (slabType === "rcc_125") {
    slabCapacityKgM2 = 175;
    slabDesc = "Standard 125mm RCC Terrace Slab (NBC India Residential)";
  } else if (slabType === "brick_bat_coba") {
    slabCapacityKgM2 = 135;
    slabDesc = "Slab with Existing Brick Bat Coba Screed";
  } else if (slabType === "precast") {
    slabCapacityKgM2 = 115;
    slabDesc = "Precast Concrete Plank / Joist Roof";
  } else if (slabType === "metal_deck") {
    slabCapacityKgM2 = 85;
    slabDesc = "Corrugated Metal Deck / Industrial PEB Roof";
  }

  const ageDegradation = Math.max(0.75, 1 - (buildingAgeYrs * 0.003));
  const effectiveCapacityKgM2 = Math.round(slabCapacityKgM2 * ageDegradation);

  const safetyFactor = Math.round((effectiveCapacityKgM2 / totalDeadLoadSaturatedKgM2) * 100) / 100;

  let safetyRating = "SAFE";
  let statusColor = "green";
  let safetyMessage = "Structural load is safely within permissible IS 875 allowable limits for extensive green roofs.";

  if (safetyFactor < 1.0) {
    safetyRating = "CRITICAL / OVERLOAD RISK";
    statusColor = "red";
    safetyMessage = "Saturated weight exceeds recommended slab safety margin. Reduce media depth or use ultra-light modular trays.";
  } else if (safetyFactor < 1.30) {
    safetyRating = "CAUTION / MARGINAL";
    statusColor = "amber";
    safetyMessage = "Moderate safety buffer. Structural engineer inspection advised before installing deep substrate.";
  }

  return {
    slabType,
    slabDesc,
    mediaDepthMm,
    buildingAgeYrs,
    weights: {
      soilDryKgM2,
      soilSaturatedKgM2,
      totalDeadLoadDryKgM2,
      totalDeadLoadSaturatedKgM2,
      saturatedKNPsqM,
      effectiveCapacityKgM2
    },
    safetyFactor,
    safetyRating,
    statusColor,
    safetyMessage,
    complianceCode: "IS 875 (Part 2) & NBC 2016"
  };
}
