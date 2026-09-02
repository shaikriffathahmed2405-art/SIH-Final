import { normalizeEnvironment } from "./assessmentEngine.js";

export async function getLiveEnvironment(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return normalizeEnvironment({ source: "prototype-fallback" });
  }

  const u = new URL("https://api.open-meteo.com/v1/forecast");
  u.searchParams.set("latitude", lat);
  u.searchParams.set("longitude", lon);
  u.searchParams.set("current", "temperature_2m,relative_humidity_2m,surface_pressure");
  u.searchParams.set("daily", "precipitation_sum,temperature_2m_max");
  u.searchParams.set("forecast_days", "7");
  u.searchParams.set("timezone", "auto");

  const response = await fetch(u);
  if (!response.ok) throw new Error(`Environment provider returned ${response.status}`);
  const data = await response.json();

  const rain = Array.isArray(data.daily?.precipitation_sum)
    ? data.daily.precipitation_sum.reduce((a, b) => a + (Number(b) || 0), 0)
    : 0;

  const temperatureC = Number(data.current?.temperature_2m);
  const climate = temperatureC >= 32 ? "Hot Semi-Arid" : temperatureC >= 25 ? "Tropical Warm" : "Moderate";

  return {
    temperatureC: Number.isFinite(temperatureC) ? temperatureC : 28.5,
    rainfall7dMm: Math.round(rain * 10) / 10,
    annualRainfallMm: 950,
    humidity: data.current?.relative_humidity_2m || 62,
    climate,
    source: "live"
  };
}
