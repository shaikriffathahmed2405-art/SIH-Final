import { clamp, num } from "./assessmentEngine.js";

export function getIoTTelemetry(body = {}) {
  const rainForecast7d = num(body.rainfall7dMm, 38);
  const tempC = num(body.temperatureC, 28.5);
  const isDryTest = body.forceDry === true || (body.soilMoisturePct && body.soilMoisturePct < 30) || rainForecast7d === 0;

  const soilMoisturePct = isDryTest 
    ? 21 
    : (body.soilMoisturePct ? num(body.soilMoisturePct, 48) : clamp(Math.round(48 + (Math.sin(Date.now() / 10000) * 12)), 32, 92));
  
  const substrateTempC = isDryTest ? 36.5 : clamp(Math.round(tempC - 4.5 + (Math.cos(Date.now() / 8000) * 1.5)), 15, 45);
  const cisternTankLevelPct = isDryTest ? 42 : clamp(Math.round(68 + (Math.sin(Date.now() / 15000) * 8)), 20, 100);

  let valveState = "CLOSED";
  let irrigationMode = "AUTOMATED_OPTIMAL";
  let statusMessage = "Moisture levels optimal (48%). Soil hydration adequate.";
  let waterSavedLitres = 0;

  if (isDryTest) {
    valveState = "OPEN (PULSE DRIP)";
    irrigationMode = "ACTIVE_HYDRATION";
    statusMessage = `Soil moisture critical (${soilMoisturePct}%). Automated solenoid valve OPENED — delivering 8-minute micro-drip cycle from cistern.`;
    waterSavedLitres = 0;
  } else if (rainForecast7d > 15) {
    valveState = "HELD_OFF (RAIN FORECAST)";
    irrigationMode = "WEATHER_PREDICTIVE_HOLD";
    statusMessage = `Rain predicted (${rainForecast7d}mm in 7 days). Automated drip irrigation held to conserve stored cistern water and prevent waterlogging.`;
    waterSavedLitres = 160;
  }

  return {
    timestamp: new Date().toISOString(),
    sensors: {
      soilMoisturePct,
      substrateTempC,
      cisternTankLevelPct,
      ambientTempC: tempC
    },
    actuator: {
      dripValveState: valveState,
      mode: irrigationMode,
      statusMessage,
      waterSavedLitres
    }
  };
}
