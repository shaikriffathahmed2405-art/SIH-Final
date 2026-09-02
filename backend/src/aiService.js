export function askGreenAI(body = {}) {
  const query = (body.query || "").toLowerCase();

  let title = "Green Roof Advisory & Engineering Intelligence";
  let answer = "";
  let tags = ["Rooftop Greening", "Sustainability"];
  let suggestions = ["Cost & Budget", "Lightweight Soil Mix", "Biosolar Synergy", "Tax Rebates (BBMP/MCGM)"];

  if (query.includes("plant") || query.includes("flower") || query.includes("vegetation") || query.includes("grass") || query.includes("sedum") || query.includes("portulaca") || query.includes("succulent") || query.includes("aloe") || query.includes("tulsi") || query.includes("species")) {
    title = "Top Climate-Resilient Rooftop Plant Species for India";
    tags = ["Botanical Selection", "CAM Flora", "Drought Resilient"];
    suggestions = ["Lightweight Soil Mix", "Smart IoT Irrigation", "Pest Management"];
    answer = `**Recommended Drought-Resilient Plants for Indian Rooftops:**
1. **Portulaca grandiflora (Moss Rose):** Thrives in scorching 42°C+ heat with vibrant multi-colored flowers and zero daily watering needs.
2. **Sedum spurium & Sedum kamtschaticum:** Shallow-root succulent groundcovers with CAM metabolism that transpire only at night.
3. **Aloe Vera & Sansevieria:** Hardy medicinal CAM plants that store moisture in thick gel tissue and withstand intense UV.
4. **Cymbopogon (Lemongrass) & Tulsi (Holy Basil):** Aromatic native herbs that deter insects, mosquito breeding, and purify rooftop air.
5. **Bougainvillea (Dwarf/Trellis):** High drought tolerance with prolific flowering for perimeter parapet screening.
6. **Alternanthera & Aptenia cordifolia:** Dense evergreen living carpet that reduces terrace surface temperature by up to 18°C.`;
  } else if (query.includes("soil") || query.includes("substrate") || query.includes("mix") || query.includes("weight") || query.includes("density") || query.includes("cocopeat") || query.includes("media") || query.includes("depth")) {
    title = "Engineered Lightweight Soil Substrate Recipe (IS 875 Compliant)";
    tags = ["Civil Engineering", "Substrate Mix", "IS 875"];
    suggestions = ["Structural Load (IS 875)", "Plant Selection", "Cost & Budget"];
    answer = `**Engineered Lightweight Green Roof Substrate Mix for Indian Terraces:**
- **Coco-Peat / Coir Pith (35%)**: High water holding capacity (8x dry weight) with ultra-low dry bulk density.
- **Pumice / Perlite / Expanded Clay Aggregate (25%)**: Volcanic aggregate providing 35% root aeration and rapid drainage without structural dead load.
- **Exfoliated Vermiculite (20%)**: High Cation Exchange Capacity (CEC) for micro-nutrient retention and thermal root buffering.
- **Well-Matured Organic Vermicompost (15%)**: Sustained micro-biological nutrients and humic acids.
- **Zeolite / Biochar (5%)**: Enhances beneficial mycorrhizal fungi and eliminates organic odors.

*Engineering Specs:*
- **Dry Bulk Density:** ~550–620 kg/m³
- **Fully Saturated Bulk Density:** ~920–960 kg/m³ *(50% lighter than natural red soil / field loam @ 1,800 kg/m³)*.
- **Recommended Depth:** 75 mm to 100 mm for extensive sedum/portulaca modular decks.`;
  } else if (query.includes("cost") || query.includes("budget") || query.includes("price") || query.includes("tier") || query.includes("rate") || query.includes("money") || query.includes("inr") || query.includes("rupee") || query.includes("afford")) {
    title = "Cost Structure, Budget Tiers & Phased Implementation";
    tags = ["Cost Estimation", "Budgeting", "Modular"];
    suggestions = ["Tax Rebates (BBMP/MCGM)", "Biosolar ROI", "Starter Pilot Phase"];
    answer = `**Realistic Cost Breakdown for Indian Rooftops (2026 Rates):**
1. **Tier 1: Starter DIY Modular Trays:** ₹45–₹60 per sq ft *(uses local nursery HDPE trays + coir pith media + sedum/succulent cuttings)*.
2. **Tier 2: Standard Extensive Modular Deck:** ₹60–₹78 per sq ft *(dimpled drainage sheets + 150 GSM geotextile + engineered pumice media + pre-grown CAM living tiles)*.
3. **Tier 3: Commercial Turnkey with Smart Automation:** ₹78–₹95 per sq ft *(includes Root Barrier membrane + pressure-compensating micro-drip + solenoid timer + 1-yr maintenance)*.

*💡 Phased Implementation Recommendation:*
Begin with a **100 sq ft Starter Pilot Area (₹5,500 – ₹7,500)** to calibrate local wind and sun exposure before expanding across the entire roof footprint. Payback period across HVAC and solar gains is typically **2.8 to 3.5 years**!`;
  } else if (query.includes("solar") || query.includes("biosolar") || query.includes("panel") || query.includes("pv") || query.includes("energy") || query.includes("electricity") || query.includes("kwh")) {
    title = "Biosolar Synergy: Solar PV + Green Roof Co-Location";
    tags = ["Energy", "Biosolar", "ROI"];
    suggestions = ["Tax Rebates", "Cost Breakdown", "Smart IoT Irrigation"];
    answer = `**How Biosolar Co-Location Increases Solar Power Generation:**
1. **The Overheating Penalty:** Standard Silicon PV panels experience an efficiency loss of **~0.4% per °C** above 25°C. On dark concrete roofs in Indian summers (reaching 60°C–65°C), solar panel output drops by **12% to 16%**.
2. **Evapotranspirative Micro-Cooling:** Green roof groundcover naturally transpires water, lowering the ambient micro-climate around the panels by **10°C to 15°C**.
3. **Efficiency Boost:** This temperature cooling generates **+8.5% to +14% extra clean electricity annually** from the exact same solar panels.
4. **Dust Binding:** Rooftop foliage traps airborne dust particles, significantly reducing panel soiling and cleaning frequency.`;
  } else if (query.includes("rebate") || query.includes("tax") || query.includes("subsidy") || query.includes("bbmp") || query.includes("mcgm") || query.includes("ghmc") || query.includes("pmc") || query.includes("government") || query.includes("incentive") || query.includes("griha") || query.includes("igbc")) {
    title = "Indian Municipal Property Tax Rebates & Green Incentives";
    tags = ["Urban Policy", "Municipal Rebates", "GRIHA"];
    suggestions = ["Cost & Budget", "Structural Check", "DPR Report"];
    answer = `**Major Indian Municipal Incentives for Rooftop Greening:**
- **BBMP (Bengaluru):** Up to **6% property tax rebate** for buildings featuring certified green roofs and rainwater harvesting installations under the Bengaluru Climate Action Plan.
- **MCGM (Mumbai):** **5% to 10% property tax concession** for housing societies with rooftop greenery and decentralized organic composting under Mumbai Environment Policy.
- **GHMC (Hyderabad):** **Cool Roof Policy incentives** and fast-track green building approval clearances.
- **PMC (Pune):** Up to **10% rebate** on general property tax for terrace gardens combined with solar rainwater harvesting.
- **National Green Building Credits:** Earns **2 to 4 direct points** under **GRIHA / IGBC (Indian Green Building Council)** certification, improving building valuation.`;
  } else if (query.includes("structural") || query.includes("load") || query.includes("weight") || query.includes("is 875") || query.includes("slab") || query.includes("collapse") || query.includes("safe") || query.includes("rcc") || query.includes("crack")) {
    title = "Structural Safety & IS 875 Load Compliance";
    tags = ["Structural Safety", "IS 875 Part 1 & 2", "Civil Engineering"];
    suggestions = ["Lightweight Soil Mix", "Waterproofing Guide", "Cost & Budget"];
    answer = `**IS 875 & IS 456 Structural Safety Benchmarks for Rooftops:**
- **Standard RCC Slab Capacity:** Typical residential RCC slabs (125mm–150mm M20/M25 concrete) are engineered for **350–450 kg/m²** allowable dead + live load.
- **Extensive Green Roof Dead Load:**
  - *Dry Weight (80mm media + trays):* **~66 kg/m²** (0.65 kN/m²).
  - *Fully Saturated Weight (Worst-case Monsoon):* **~94 kg/m²** (0.92 kN/m²).
- **Safety Factor:** Extensive modular green roofs consume only **~22% to 28%** of the available roof capacity, yielding a **Safety Factor of 3.8x to 4.5x** (Safe under IS 875 Part 1 & 2).
- **Older Buildings (>25 years):** Place modular trays along structural beam and column lines to minimize middle-slab bending moments.`;
  } else if (query.includes("waterproof") || query.includes("leak") || query.includes("seep") || query.includes("damp") || query.includes("root barrier") || query.includes("drain") || query.includes("membrane")) {
    title = "Rooftop Waterproofing & Root Penetration Protection";
    tags = ["Waterproofing", "Root Barrier", "Plumbing Integrity"];
    suggestions = ["7-Layer Architectural Cutaway", "Structural Load", "Smart IoT Irrigation"];
    answer = `**Zero-Leakage Engineering Strategy for Green Roofs:**
1. **Primary Waterproofing Layer:** Continuous, seamless liquid-applied polyurethane (PU) or APP-modified 4mm elastomeric bitumen membrane with high crack-bridging flexibility.
2. **Flood Ponding Test:** Maintain 50mm standing water for 48 hours to certify 100% leak-proof deck before substrate installation.
3. **Heavy-Duty Root Barrier:** 0.8mm high-density polyethylene (HDPE) or TPO root barrier membrane preventing aggressive taproots from touching the underlying slab.
4. **Dimpled Drainage Sheets:** Cup-shaped modular HDPE panels that store 4–6 L/m² emergency water while allowing excess rainwater to exit freely through unobstructed parapet spouts.`;
  } else if (query.includes("irrigation") || query.includes("water") || query.includes("drip") || query.includes("iot") || query.includes("sensor") || query.includes("valve") || query.includes("rainwater") || query.includes("cistern")) {
    title = "Weather-Aware Smart Irrigation & Rainwater Harvesting";
    tags = ["IoT Automation", "Telemetry", "Rainwater Harvesting"];
    suggestions = ["Test Moisture Sensor", "Biosolar Synergy", "Plant Selection"];
    answer = `**Weather-Predictive Irrigation & Rainwater Conservation:**
1. **Weather Forecast Hold:** Server connects to live satellite rain forecasts. If rain $> 15\\text{mm}$ is predicted in 7 days, automated solenoid valves are held in **HELD_OFF mode**, saving up to 160 Liters per irrigation cycle.
2. **Soil Moisture Thresholds:** Substrate moisture sensors maintain optimal root zone moisture (**40%–55%**). If moisture drops below 25%, an automatic 8-minute pulse-drip cycle is triggered.
3. **Rainwater Cistern Co-Location:** Runoff from 650 sq ft roof captures **~48,000 to 65,000 Liters** of clean rainwater annually, enabling 100% municipal water independence.
4. **Zero-Click WhatsApp Daemon:** Automatic background alerts delivered directly to your phone when rain is detected or when cistern fills up.`;
  } else if (query.includes("pest") || query.includes("disease") || query.includes("whitefly") || query.includes("aphid") || query.includes("fungus") || query.includes("caterpillar")) {
    title = "Non-Toxic Organic Pest Management (IPM)";
    tags = ["Botanical Care", "Pest Management", "Organic"];
    suggestions = ["Plant Selection", "Lightweight Soil Mix", "Smart Irrigation"];
    answer = `**Organic Integrated Pest Management for Rooftop Gardens:**
1. **Cultural Prevention:** Good air circulation and free-draining substrate prevent 90% of fungal gnats and root rot.
2. **Companion Planting:** Interplant **Marigold (Tagetes)** and **Tulsi** around corners to naturally repel whiteflies, aphids, and root nematodes.
3. **Organic Neem Oil Spray:** Cold-pressed **Neem Oil (5ml/L + 2ml mild soap emulsifier)** sprayed every 14 days during active growth periods.
4. **Beneficial Predators:** Flowering sedum and portulaca attract native ladybirds and hoverflies that devour soft-bodied pests naturally without synthetic pesticides.`;
  } else if (query.includes("cooling") || query.includes("temperature") || query.includes("heat") || query.includes("uhi") || query.includes("ac") || query.includes("air condition") || query.includes("electricity bill")) {
    title = "Urban Heat Island (UHI) Mitigation & AC Power Savings";
    tags = ["Thermal Dynamics", "UHI Reduction", "Energy Savings"];
    suggestions = ["Biosolar Synergy", "Cost & Budget", "Municipal Rebates"];
    answer = `**Thermal Dynamics & Building Cooling Benefits:**
- **Terrace Deck Temperature Drop:** Dark concrete terraces reach **55°C–65°C** in summer. A green roof living blanket acts as a natural thermal shield, reducing deck surface temperature to **28°C–32°C** (a massive **24°C–32°C reduction**).
- **Indoor Ambient Cooling:** Rooms immediately under the roof experience **3.5°C to 5.0°C lower room temperature**.
- **HVAC Electricity Savings:** Lowers top-floor air conditioning runtime by **18% to 26%**, saving ₹8,000 to ₹14,000 per year in electricity bills.
- **Neighborhood Micro-Climate:** Reduces neighborhood Urban Heat Island (UHI) index by **2.5°C to 4.0°C**.`;
  } else {
    title = "Green Roof AI Advisory & Engineering Consultant";
    tags = ["General Advisory", "Smart Rooftop", "IS 875"];
    suggestions = ["Cost & Budget", "Lightweight Soil Mix", "Biosolar Synergy", "Tax Rebates (BBMP/MCGM)"];
    answer = `**I can assist you with comprehensive rooftop greening intelligence:**
- 🌿 **Plant Selection:** Heat-hardy CAM succulents, sedums, portulacas, and native herbs.
- 🏗️ **Structural Safety:** IS 875 & IS 456 dead/live load verification and safety factor analysis.
- 🧪 **Lightweight Substrate:** Engineered coco-peat, pumice, perlite, and vermiculite recipes.
- ☀️ **Biosolar PV Synergy:** Boosting solar output by +8.5% to +14% through micro-cooling.
- 💰 **Budget & Rebates:** Municipal tax rebates (BBMP, MCGM, GHMC, PMC) and phased ROI payback.
- 🚰 **Smart Irrigation:** IoT automated solenoid valves, weather-hold logic, and rainwater cisterns.

*Type any question or click one of the quick topic chips below!*`;
  }

  return {
    query: body.query || "",
    title,
    tags,
    answer,
    suggestions,
    generatedAt: new Date().toISOString()
  };
}
