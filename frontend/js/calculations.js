// Coverage and cost scenario calculator.

function updateSensitivityCalc() {
  const area = $("calcArea") ? Number($("calcArea").value) : 650;
  const cov = $("calcCoverage") ? Number($("calcCoverage").value) : 75;
  const rain = $("calcRain") ? Number($("calcRain").value) : 950;
  const ret = $("calcRetention") ? Number($("calcRetention").value) : 0.65;

  if ($("calcAreaVal")) $("calcAreaVal").textContent = `${area} sq ft`;
  if ($("calcCoverageVal")) $("calcCoverageVal").textContent = `${cov}%`;
  if ($("calcRainVal")) $("calcRainVal").textContent = `${rain} mm/yr`;
  if ($("calcRetVal")) $("calcRetVal").textContent = ret.toFixed(2);

  const greenArea = Math.round(area * (cov / 100) * 0.78);
  const rateLow = 60;
  const rateHigh = 78;
  const costLow = Math.round(greenArea * rateLow);
  const costHigh = Math.round(greenArea * rateHigh);
  const waterL = Math.round((greenArea * 0.0929) * (rain / 1000) * ret * 1000);
  const sustainScore = Math.min(100, Math.max(45, Math.round(40 + (cov * 0.45) + (area > 300 ? 15 : 8))));

  if ($("calcCost")) $("calcCost").textContent = `₹${costLow.toLocaleString()}–₹${costHigh.toLocaleString()}`;
  if ($("calcWater")) $("calcWater").textContent = `${waterL.toLocaleString()} Liters/year`;
  if ($("calcSustain")) $("calcSustain").textContent = `${sustainScore} / 100`;
}

function initCalculationsPage() {
  if ($("calcArea")) $("calcArea").oninput = updateSensitivityCalc;
  if ($("calcCoverage")) $("calcCoverage").oninput = updateSensitivityCalc;
  if ($("calcRain")) $("calcRain").oninput = updateSensitivityCalc;
  if ($("calcRetention")) $("calcRetention").oninput = updateSensitivityCalc;

  updateSensitivityCalc();
}

document.addEventListener("DOMContentLoaded", initCalculationsPage);
