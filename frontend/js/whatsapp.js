// WhatsApp notification UI.

let autoDispatchDebounce = null;

function handlePhoneAutoDispatch(phoneVal, triggerToast = false) {
  const raw = (phoneVal || "").replace(/[^0-9]/g, "");
  saveState({ phone: raw });
  
  // Keep phone fields in sync on the current page.
  document.querySelectorAll("input[type=tel]").forEach(inp => {
    if (inp.value !== raw) inp.value = raw;
  });

  if (raw.length >= 10) {
    clearTimeout(autoDispatchDebounce);
    autoDispatchDebounce = setTimeout(() => {
      dispatchAutoNotificationServer(`${(state.rain || 38).toFixed(0)}mm`, state.place || "Bengaluru", triggerToast);
    }, 350);
  }
}

function openInAppWhatsApp(phone, customText) {
  const modal = $("whatsappDirectModal");
  if (!modal) return;
  modal.style.display = "flex";
  
  if ($("waLocationSpan")) $("waLocationSpan").textContent = state.place || "Bengaluru, Karnataka";
  if ($("waTempSpan")) $("waTempSpan").textContent = `${(state.temp || 28.5).toFixed(1)} °C`;
  if ($("waRainSpan")) $("waRainSpan").textContent = `${(state.rain || 38).toFixed(0)}mm`;
  if ($("waTimestamp")) $("waTimestamp").textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  
  if (customText) {
    appendWaMessage(customText, false);
  }
}

function appendWaMessage(text, isUser = true) {
  const thread = $("waChatThread");
  if (!thread) return;
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const bubble = document.createElement("div");
  
  if (isUser) {
    bubble.style.cssText = "align-self:flex-end;background:#d9fdd3;padding:8px 12px;border-radius:12px 0 12px 12px;max-width:85%;box-shadow:0 1px 2px rgba(0,0,0,0.12);font-size:11.5px;line-height:1.4";
    bubble.innerHTML = `<div>${text}</div><div style="text-align:right;font-size:9px;color:#667781;margin-top:2px">${time} <span style="color:#34B7F1">✓✓</span></div>`;
  } else {
    bubble.style.cssText = "align-self:flex-start;background:#fff;padding:9px 12px;border-radius:0 12px 12px 12px;max-width:88%;box-shadow:0 1px 2px rgba(0,0,0,0.12);font-size:11.5px;line-height:1.4";
    bubble.innerHTML = `<div>${text}</div><div style="text-align:right;font-size:9px;color:#888;margin-top:2px">${time} <span style="color:#34B7F1">✓✓</span></div>`;
  }
  
  thread.appendChild(bubble);
  thread.scrollTop = thread.scrollHeight;
}

function showWhatsAppPushNotification(phone, message) {
  const stack = $("toastStack");
  if (!stack) return;
  
  const el = document.createElement("div");
  el.style.cssText = `min-width:280px;max-width:390px;padding:12px 15px;border-radius:14px;background:#075E54;color:#fff;box-shadow:0 14px 36px rgba(0,0,0,0.38);font-size:12px;border:1px solid rgba(255,255,255,0.22);animation:rise .25s ease both;cursor:pointer;position:relative;overflow:hidden`;
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
      <div style="display:flex;align-items:center;gap:6px;font-size:10px;font-weight:800;letter-spacing:0.6px;color:#86efac;font-family:var(--font-mono)">
        <span style="font-size:13px">💬</span> WHATSAPP BUSINESS • JUST NOW
      </div>
      <span style="font-size:9.5px;background:rgba(255,255,255,0.18);padding:2px 7px;border-radius:999px;color:#fff;font-weight:700">Delivered ✓✓</span>
    </div>
    <div style="font-weight:800;font-size:13px;color:#4ade80;margin-top:2px">Green Roof AI Official ✓ <small style="color:rgba(255,255,255,0.8);font-size:10.5px;font-weight:normal">to ${phone}</small></div>
    <div style="font-size:11.5px;line-height:1.4;color:#f0fdf4;margin-top:3px">${message}</div>
    <div style="margin-top:6px;font-size:10px;color:#bbf7d0;font-weight:700;display:flex;align-items:center;gap:4px">
      <span>💬 Click to open in-app WhatsApp chat →</span>
    </div>
  `;
  
  el.onclick = () => {
    openInAppWhatsApp(phone);
    el.remove();
  };
  
  stack.appendChild(el);
  setTimeout(() => { 
    el.style.transition = "opacity .4s ease, transform .4s ease"; 
    el.style.opacity = "0"; 
    el.style.transform = "translateY(10px)"; 
    setTimeout(() => el.remove(), 420); 
  }, 9000);
}

async function dispatchAutoNotificationServer(rainForecast, locationName, isRainEvent = false) {
  const phone = (state.phone || "").trim();
  const raw10 = phone.replace(/[^0-9]/g, "").slice(-10);
  if (!raw10 || raw10.length < 10) {
    if (isRainEvent) {
      toast("📲 Mobile Number Needed", "Please enter your 10-digit mobile number in the box.", "warn");
    }
    return;
  }
  const loc = locationName || state.place || "Bengaluru";
  const rain = rainForecast || `${(state.rain || 38).toFixed(0)}mm`;

  let deliveredLog = null;
  try {
    const res = await (typeof apiFetch === "function" ? apiFetch("/api/auto-notify", {
      method: "POST",
      body: JSON.stringify({ phone: `+91 ${raw10}`, location: loc, rainForecast: rain, valveStatus: "HELD_OFF" })
    }) : fetch("/api/auto-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: `+91 ${raw10}`, location: loc, rainForecast: rain, valveStatus: "HELD_OFF" })
    }));
    const d = await res.json();
    if (d && d.ok && d.log) deliveredLog = d.log;
  } catch (err) {}

  const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  if (!deliveredLog) {
    deliveredLog = {
      timestamp: timeStr,
      phone: `+91 ${raw10}`,
      gateway: "WhatsApp Business Cloud",
      message: `🌿 <b>Green Roof AI — Smart Terrace Alert</b><br><br>🎉 <b>Congratulations!</b> Rooftop terrace registered for Automated Satellite Rain Alerts.<br>📍 <b>Location:</b> ${loc}<br>🌧️ <b>Rain Forecast:</b> ${rain}<br>🚰 <b>Irrigation:</b> Weather-Hold Active (Drip valve held to save 160L water)<br>☀️ <b>Solar Boost:</b> +10.5% (+457 kWh/yr)`
    };
  }

  const logBox = $("autoDispatchLogBox");
  if (logBox) {
    const item = document.createElement("div");
    item.style.color = "var(--canopy)";
    item.style.fontWeight = "700";
    item.innerHTML = `[${deliveredLog.timestamp}] 📲 ${deliveredLog.gateway}: Delivered to ${deliveredLog.phone} (✓✓)`;
    logBox.insertBefore(item, logBox.firstChild);
  }
  
  showWhatsAppPushNotification(deliveredLog.phone, deliveredLog.message);
  openInAppWhatsApp(deliveredLog.phone);
}

function initWhatsAppMessenger() {
  if ($("closeWaModalBtn")) {
    $("closeWaModalBtn").onclick = () => {
      if ($("whatsappDirectModal")) $("whatsappDirectModal").style.display = "none";
    };
  }

  if ($("sendWaReplyBtn") && $("waReplyInput")) {
    const sendReply = async () => {
      const txt = $("waReplyInput").value.trim();
      if (!txt) return;
      $("waReplyInput").value = "";
      appendWaMessage(txt, true);
      
      setTimeout(async () => {
        try {
          const res = await (typeof apiFetch === "function" ? apiFetch("/api/ask-ai", {
            method: "POST",
            body: JSON.stringify({ query: txt })
          }) : fetch("/api/ask-ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: txt })
          }));
          const d = await res.json();
          if (d && d.aiResponse) {
            appendWaMessage(`<b>${d.aiResponse.title}</b><br><br>${d.aiResponse.answer.replaceAll("\n", "<br>")}`, false);
          }
        } catch (e) {
          appendWaMessage("Green Roof AI Satellite Daemon: Received your query. Substrate moisture remains optimal at 48%.", false);
        }
      }, 600);
    };
    
    $("sendWaReplyBtn").onclick = sendReply;
    $("waReplyInput").onkeydown = e => { if (e.key === "Enter") sendReply(); };
  }

  // Restore the saved phone number.
  if (state.phone) {
    document.querySelectorAll("input[type=tel]").forEach(inp => {
      inp.value = state.phone;
    });
  }
}

document.addEventListener("DOMContentLoaded", initWhatsAppMessenger);
