// GreenAI chat widget.

function initGreenAIChat() {
  const fab = $("chatFab");
  const drawer = $("chatDrawer");
  const closeBtn = $("closeChatBtn");
  const clearBtn = $("clearChatBtn");
  const sendBtn = $("sendChatBtn");
  const input = $("chatInput");

  if (fab && drawer) {
    fab.onclick = () => drawer.classList.toggle("open");
  }

  if (closeBtn && drawer) {
    closeBtn.onclick = () => drawer.classList.remove("open");
  }

  if (clearBtn) {
    clearBtn.onclick = () => {
      const body = $("chatBody");
      if (body) {
        body.innerHTML = `<div class="chat-bubble bot">Chat cleared. Ask <b>GreenAI</b> any question on plants, soil, civil loads, solar boost, or municipal rebates!</div>`;
      }
    };
  }

  if (sendBtn && input) {
    const doSend = () => {
      const txt = input.value.trim();
      if (txt) sendChatMessage(txt);
    };
    sendBtn.onclick = doSend;
    input.onkeydown = e => { if (e.key === "Enter") doSend(); };
  }

  document.querySelectorAll(".chat-chip").forEach(chip => {
    chip.onclick = () => sendChatMessage(chip.dataset.q);
  });
}

async function sendChatMessage(text) {
  if (!text) return;
  const body = $("chatBody");
  if (!body) return;

  body.innerHTML += `<div class="chat-bubble user">${text}</div>`;
  const input = $("chatInput");
  if (input) input.value = "";

  const loadingId = "load_" + Date.now();
  body.innerHTML += `<div class="chat-bubble bot" id="${loadingId}"><i>Consulting GreenAI knowledge base…</i></div>`;
  body.scrollTop = body.scrollHeight;

  let resp = null;
  try {
    const res = await (typeof apiFetch === "function" ? apiFetch("/api/ask-ai", {
      method: "POST",
      body: JSON.stringify({ query: text })
    }) : fetch("/api/ask-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: text })
    }));
    const d = await res.json();
    if (d && d.aiResponse) resp = d.aiResponse;
  } catch (e) {}

  if (!resp) {
    const q = text.toLowerCase();
    let title = "Green Roof AI Advisory & Engineering Consultant";
    let tags = ["General Advisory", "Smart Rooftop", "IS 875"];
    let suggestions = ["Cost & Budget", "Lightweight Soil Mix", "Biosolar PV Synergy", "Municipal Tax Rebates"];
    let answer = `**I can assist you with comprehensive rooftop greening intelligence:**\n\n- 🌿 **Plant Selection:** Heat-hardy CAM succulents, sedums, portulacas, and native herbs.\n- 🏗️ **Structural Safety:** IS 875 & IS 456 dead/live load verification and safety factor analysis.\n- 🧪 **Lightweight Substrate:** Engineered coco-peat, pumice, perlite, and vermiculite recipes.\n- ☀️ **Biosolar PV Synergy:** Boosting solar output by +8.5% to +14% through micro-cooling.\n- 💰 **Budget & Rebates:** Municipal tax rebates (BBMP, MCGM, GHMC, PMC) and phased ROI payback.`;

    if (q.includes("cost") || q.includes("budget") || q.includes("price") || q.includes("rate")) {
      title = "Rooftop Greening Investment Tiers & Phased Budgeting";
      tags = ["Economics", "Budgeting", "Turnkey"];
      suggestions = ["Lightweight Soil Mix", "Municipal Tax Rebates", "Biosolar PV Synergy"];
      answer = `**Investment Estimates (Indian Metros):**\n\n1. **DIY / Community Model:** ₹45–₹60 / sq ft (Salvaged crates, local vermicompost, cuttings).\n2. **Standard Modular System:** ₹60–₹78 / sq ft (Interlocking dimpled retention trays, geotextile fleece, engineered coco-pumice media).\n3. **Turnkey Commercial System:** ₹78–₹95 / sq ft (Micro-drip solenoid automation, advanced root barrier, pre-grown sedum mats).\n\n💡 *Tip: A 100 sq ft starter pilot costs just ₹6,000–₹7,800 and delivers immediate rooftop cooling!*`;
    } else if (q.includes("soil") || q.includes("substrate") || q.includes("mix") || q.includes("weight")) {
      title = "Engineered Lightweight Substrate Recipe (IS 875 Compliant)";
      tags = ["Substrate Science", "Dead Load", "IS 875"];
      suggestions = ["Cost & Budget", "Best Plants (CAM Flora)", "IS 875 Structural Safety"];
      answer = `**Engineered Lightweight Substrate Recipe:**\n\n- **35% Coco-Peat:** High water retention capacity.\n- **25% Pumice / Perlite:** Aeration, low bulk density, zero compaction.\n- **20% Expanded Clay / Vermiculite:** Thermal insulation and root anchorage.\n- **15% Enriched Vermicompost:** Slow-release macro & micronutrients.\n- **5% Zeolite Mineral:** Cation exchange capacity & odor filtration.\n\n📊 *Saturated Density:* ~950 kg/m³ (50% lighter than standard field soil at ~1,900 kg/m³).`;
    } else if (q.includes("plant") || q.includes("flora") || q.includes("sedum") || q.includes("cam")) {
      title = "Native CAM & Drought-Tolerant Plant Selection";
      tags = ["Botany", "CAM Flora", "Low Water"];
      suggestions = ["Lightweight Soil Mix", "Smart IoT Irrigation", "Zero-Leak Waterproofing"];
      answer = `**Top Recommended Plant Species for Indian Rooftops:**\n\n1. **Sedum spurium (Stonecrop):** Crassulacean Acid Metabolism (CAM) species storing water in fleshy leaves; survives full 45°C sun with near-zero watering.\n2. **Portulaca grandiflora (Moss Rose):** Low-growing native succulent with vivid flowering and excellent root soil retention.\n3. **Aloe vera (Indian Aloe):** Releases nighttime oxygen and lowers roof surface temperature by up to 26°C.\n4. **Cymbopogon citratus (Lemongrass):** Deep fibrous root mesh that prevents media erosion and naturally repels insects.`;
    } else if (q.includes("safe") || q.includes("load") || q.includes("is 875") || q.includes("slab") || q.includes("weight")) {
      title = "IS 875 & NBC 2016 Structural Safety Compliance";
      tags = ["Structural Safety", "IS 875", "Civil Engineering"];
      suggestions = ["Zero-Leak Waterproofing", "Lightweight Soil Mix", "Cost & Budget"];
      answer = `**Civil Engineering Safety Guidelines (IS 875 Part 2 / IS 456):**\n\n- **Extensive Green Roof Dead Load:** 75–105 kg/m² (~0.75–1.05 kN/m²) at 80mm saturated media depth.\n- **Standard 125mm RCC Slab Capacity:** Typically designed for 150–200 kg/m² live/dead load.\n- **Safety Factor Rule:** Always maintain a Safety Factor ≥ 1.3x for aged slabs (>10 years).\n- **Load Concentration:** Place heavier concrete planters and rainwater cisterns directly over columns or main RCC load-bearing beams.`;
    }

    resp = { title, tags, suggestions, answer };
  }

  const loadEl = $(loadingId);
  if (loadEl && resp) {
    const formatted = (resp.answer || "").replaceAll("\n", "<br>");
    const tagsHtml = (resp.tags || []).map(t => `<span class="badge" style="font-size:9.5px;padding:2px 6px;background:var(--canopy-soft);color:var(--canopy-deep);margin-right:4px">${t}</span>`).join("");
    const suggHtml = (resp.suggestions || []).map(s => `<button class="secondary" style="font-size:10px;padding:3px 8px;margin:3px 3px 0 0;background:#fff;cursor:pointer" onclick="sendChatMessage('${s}')">→ ${s}</button>`).join("");
    
    const content = `
      <div style="margin-bottom:6px">${tagsHtml}</div>
      <div style="font-weight:700;font-size:13px;color:var(--canopy-deep);margin-bottom:4px">${resp.title}</div>
      <div style="font-size:12px;line-height:1.5">${formatted}</div>
      ${suggHtml ? `<div style="margin-top:8px;padding-top:6px;border-top:1px dashed var(--line)"><small style="color:var(--muted);display:block;margin-bottom:3px">Suggested Next Steps:</small>${suggHtml}</div>` : ""}
    `;
    loadEl.innerHTML = content;
  }
  body.scrollTop = body.scrollHeight;
}

document.addEventListener("DOMContentLoaded", initGreenAIChat);
