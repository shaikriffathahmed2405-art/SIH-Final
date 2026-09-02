// Weather-aware irrigation dashboard.

async function updateIoTTelemetry(forceDry = false, forceRain = false) {
  const rain = forceRain ? 50 : forceDry ? 0 : (state.rain || 38);
  const temp = forceDry ? 36 : (state.temp || 28.5);

  let t = null;
  try {
    const res = await (typeof apiFetch === "function" ? apiFetch("/api/iot-telemetry", {
      method: "POST",
      body: JSON.stringify({ rainfall7dMm: rain, temperatureC: temp, forceDry, forceRain })
    }) : fetch("/api/iot-telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rainfall7dMm: rain, temperatureC: temp, forceDry, forceRain })
    }));
    const d = await res.json();
    if (d && d.telemetry) t = d.telemetry;
  } catch (e) {}

  if (!t) {
    t = clientGetIoT({ forceDry, forceRain });
  }

  if ($("iotMoisture")) $("iotMoisture").textContent = `${t.sensors.soilMoisturePct}%`;
  if ($("iotTemp")) $("iotTemp").textContent = `${t.sensors.substrateTempC} °C`;
  if ($("iotCistern")) $("iotCistern").textContent = `${t.sensors.cisternTankLevelPct}%`;
  if ($("iotValve")) $("iotValve").textContent = t.actuator.dripValveState;
  if ($("iotValveTag")) $("iotValveTag").textContent = t.actuator.mode;
  if ($("iotDecisionMsg")) $("iotDecisionMsg").textContent = t.actuator.statusMessage;

  if ($("iotMoistureTag")) {
    if (forceDry || t.sensors.soilMoisturePct < 25) {
      $("iotMoistureTag").textContent = "CRITICAL LOW (<25%)";
      $("iotMoistureTag").style.background = "var(--clay-soft)";
      $("iotMoistureTag").style.color = "var(--clay)";
    } else {
      $("iotMoistureTag").textContent = "OPTIMAL HYDRATION";
      $("iotMoistureTag").style.background = "var(--canopy-soft)";
      $("iotMoistureTag").style.color = "var(--canopy-deep)";
    }
  }

  if ($("iotCisternTag")) {
    $("iotCisternTag").textContent = `${Math.round(t.sensors.cisternTankLevelPct * 20)} LITERS STORED`;
  }

  if ($("iotValve") && $("iotValveTag")) {
    if (t.actuator.dripValveState.includes("OPEN")) {
      $("iotValve").style.color = "var(--clay)";
      $("iotValveTag").style.background = "var(--clay-soft)";
      $("iotValveTag").style.color = "var(--clay)";
    } else {
      $("iotValve").style.color = "var(--canopy)";
      $("iotValveTag").style.background = "var(--canopy-soft)";
      $("iotValveTag").style.color = "var(--canopy-deep)";
    }
  }

  // Rain is treated as a notification trigger in the demo.
  if (forceRain) {
    dispatchAutoNotificationServer(`${rain.toFixed(1)}mm`, state.place || "Bengaluru", true);
  }
}

function initIoTPage() {
  if ($("iotSimulateDryBtn")) {
    $("iotSimulateDryBtn").onclick = () => {
      updateIoTTelemetry(true, false);
      toast("Low Moisture Triggered", "Substrate <25% — Drip solenoid valve OPENED for 8 mins.", "warn");
      appendWaMessage("⚠️ <b>IoT Alert:</b> Substrate moisture dropped to <b>21%</b>. Automated solenoid valve OPENED — delivering 8-minute micro-drip cycle from cistern.", false);
    };
  }

  if ($("iotSimulateRainBtn")) {
    $("iotSimulateRainBtn").onclick = () => {
      updateIoTTelemetry(false, true);
      toast("Rain Event Detected", "Rain predicted (50mm) — Valve held & WhatsApp auto-sent.", "ok");
      appendWaMessage("🌧️ <b>Satellite Rain Forecast:</b> 50mm precipitation predicted in Bengaluru. Drip valve switched to <b>HELD_OFF</b> mode to conserve 160L cistern water! ✅", false);
    };
  }

  if ($("userPhoneInput")) {
    $("userPhoneInput").oninput = e => handlePhoneAutoDispatch(e.target.value);
  }

  if ($("testNotificationBtn")) {
    $("testNotificationBtn").onclick = () => {
      const raw = (state.phone || "").replace(/[^0-9]/g, "");
      if (raw.length < 10) {
        toast("⚠️ Mobile Number Needed", "Please enter your 10-digit mobile number.", "warn");
        if ($("userPhoneInput")) $("userPhoneInput").focus();
        return;
      }
      dispatchAutoNotificationServer(`${(state.rain || 38).toFixed(0)}mm`, state.place || "Bengaluru", true);
      toast("📲 WhatsApp Alert Sent!", `Automated rain report delivered to +91 ${raw} (Delivered ✓✓)`, "ok");
    };
  }

  if ($("directPhoneDeliverBtn")) {
    $("directPhoneDeliverBtn").onclick = () => {
      openInAppWhatsApp(state.phone || "8520886121");
    };
  }

  updateIoTTelemetry(false, false);
  setInterval(() => updateIoTTelemetry(false, false), 20000);
}

document.addEventListener("DOMContentLoaded", initIoTPage);
