import { C507_NAMES, C519_NAMES, C506_NAMES, BP_GROUPS, C507_ROTA, C506_ROTA, C519_TUE_PLANTS, C507_TUE_PLANTS, BP_FIRST_PLANTS, CONTACTS } from '../config/crew.js'
import { rotaAssign } from './rotation.js'
import { timeToMinutes, getDriveTime, LOAD_TIME, UNLOAD_TIME, QUARRY_CLOSE } from '../config/distances.js'
import { CREW_QUARRY, CREW_DELIVERY_POOLS } from '../config/knowledge.js'

function p(code, down, subMap) {
  return down.has(code) ? (subMap[code] || "?") : code
}

function quarry(mhDay, down, sub) {
  return mhDay ? p("591", down, sub) : p("594", down, sub)
}

// 514 chain rule: sand to 514 → scrap to LQ (516) → RG rock → home plant
function after514(homePlant, down, subMap) {
  return `${p("514",down,subMap)} scrap→LQ→RG rock→${p(homePlant,down,subMap)}`
}

// End-of-shift check: 506/507 driver delivering to 519 near shift end
function endOfShift519(name, crew, startTime, hoursBeforeDelivery, down, subMap) {
  const startMin = timeToMinutes(startTime)
  const currentMin = startMin + (hoursBeforeDelivery * 60)
  const driveToMH = getDriveTime("519", "591")
  const mhTo506 = getDriveTime("591", "506")
  const mhToHome = getDriveTime("591", crew === "507" ? "507" : "506")
  const fullTrip = driveToMH + LOAD_TIME + mhToHome + LOAD_TIME
  const shortTrip = driveToMH + LOAD_TIME + mhTo506 + UNLOAD_TIME

  const homePlant = crew === "507" ? "507" : "506"
  const mh = p("591", down, subMap)

  if (currentMin + fullTrip > QUARRY_CLOSE) {
    return `→${p("519",down,subMap)}→Scrap→${mh} 67s→${p("506",down,subMap)}→POD→${p(homePlant,down,subMap)} home (⏰ short route)`
  }
  return `→${p("519",down,subMap)}→Scrap→${mh} 67s→${p(homePlant,down,subMap)} home`
}

// BP first-rock: rotating MH 67s delivery to a main plant (NOT 518)
function bpFirstRock(name, cycleDay, down, subMap) {
  const group = BP_GROUPS[["A","B","C"][cycleDay % 3]]
  const idx = group.indexOf(name)
  const plantIdx = idx >= 0 ? (idx + cycleDay) % BP_FIRST_PLANTS.length : cycleDay % BP_FIRST_PLANTS.length
  return p(BP_FIRST_PLANTS[plantIdx], down, subMap)
}

function check518(down, subMap) {
  return `📞 518: Shane ${CONTACTS.SHANE} / Anthony ${CONTACTS.ANTHONY}→MM 78s→${p("518",down,subMap)} or DH`
}

// ── Proximity-based plant assignment ──
// Uses CREW_DELIVERY_POOLS to rotate drivers through plants nearest to their hub
function proximityPlant(crewCode, names, name, cycleDay, down, subMap) {
  const pool = CREW_DELIVERY_POOLS[crewCode] || ["511", "513", "506"]
  const idx = names.indexOf(name)
  if (idx === -1) return p(pool[0], down, subMap)
  return p(pool[(idx + cycleDay) % pool.length], down, subMap)
}

// Get multiple plants for multi-round routes (506 crew)
function proximityPlants(crewCode, names, name, cycleDay, count, down, subMap) {
  const pool = CREW_DELIVERY_POOLS[crewCode] || ["511", "513", "506"]
  const idx = names.indexOf(name)
  const start = idx >= 0 ? idx + cycleDay : cycleDay
  const plants = []
  for (let i = 0; i < count; i++) {
    plants.push(p(pool[(start + i) % pool.length], down, subMap))
  }
  return plants
}

export function buildShorthand(name, { tf, mhDay, down, subMap, curtisOffice, swap519, cycleDay, startOverrides, autoPlans }) {
  const mh    = p("591", down, subMap)
  const cher  = p("594", down, subMap)
  const scMH  = `Scrap→${mh}`
  const sc594 = `Scrap→${cher}`
  const qry   = quarry(mhDay, down, subMap)
  const todayBP = new Set([...BP_GROUPS[["A","B","C"][cycleDay % 3]], "Stacey", "Alexis"])
  const onBP  = todayBP.has(name)

  // If auto-plan provided specific assignments, use those
  const planned = autoPlans && autoPlans[name]

  if (name === "CHRIS P") return "CHRIS P: CHER→MSAND→Tupelo Block→APAC Tremont→511→POD→519→PRELOAD"
  if (name === "Tim")     return `Tim: 519→${p("506",down,subMap)} delivery→POD check→PRELOAD 519`

  if (name === "Stacey") {
    const firstRock = bpFirstRock(name, cycleDay, down, subMap)
    return `Stacey: ${scMH} 67s→${firstRock} rock→${check518(down,subMap)}→502 BP 1/4 downs→907 blocks→511 Palmer→POD sand→home`
  }

  if (name === "Alexis") {
    const dest514 = p("514", down, subMap)
    const r1end = dest514 === "514"
      ? `→POD sand→${after514("516", down, subMap)}`
      : `→POD sand→${dest514}`
    const r1 = `R1: 516→RG 67s→${p("507",down,subMap)}→MM 67s→${p("513",down,subMap)}${r1end}`
    const r2 = `R2: 516→RG 67s→${p("507",down,subMap)}→MM 67s→${p("511",down,subMap)}→POD sand→516`
    return `Alexis: ${r1} / ${r2}`
  }

  // Curtis (506/Decatur) — scrap to MH
  if (name === "Curtis") {
    if (curtisOffice) return "Curtis: IN OFFICE — 525 needs coverage"
    if (onBP) {
      const firstRock = bpFirstRock(name, cycleDay, down, subMap)
      return `Curtis: ${scMH} 67s→${firstRock} rock→${check518(down,subMap)}→502 BP 1/4 downs→907 blocks→${cher} 67s→${p("506",down,subMap)} rock→POD sand→home`
    }
    return `Curtis: ${scMH} 67s→${p("525",down,subMap)} rock→home`
  }

  // ── TUESDAY/FRIDAY OVERRIDES ──

  if (tf && C519_NAMES.includes(name)) {
    const idx = C519_NAMES.indexOf(name)
    const tuePlant = p(C519_TUE_PLANTS[(idx + cycleDay) % C519_TUE_PLANTS.length], down, subMap)
    return `${name}: Scrap→${mh} 67s→${tuePlant}→${check518(down,subMap)}→502 BP 1/4 downs→907 blocks→POD sand→519`
  }

  if (tf && C507_NAMES.includes(name)) {
    const idx = C507_NAMES.indexOf(name)
    const tuePlant = p(C507_TUE_PLANTS[(idx + cycleDay) % C507_TUE_PLANTS.length], down, subMap)
    if (tuePlant === "514") {
      return `${name}: 502 BP 1/4 downs→907 blocks→POD sand→${after514("507", down, subMap)}→507 home`
    }
    if (tuePlant === "519") {
      const start = (startOverrides && startOverrides[name]) || "05:00"
      return `${name}: 502 BP 1/4 downs→907 blocks→POD sand${endOfShift519(name, "507", start, 8, down, subMap)}`
    }
    return `${name}: 502 BP 1/4 downs→907 blocks→POD sand→${tuePlant}→loop→507 home`
  }

  // ── BP ROTATION (non-Tuesday/Friday) ──
  if (onBP) {
    const firstRock = bpFirstRock(name, cycleDay, down, subMap)
    const postBP =
      C507_NAMES.includes(name)
        ? `→${mh} 67s→${p(rotaAssign(C507_NAMES,name,C507_ROTA,cycleDay),down,subMap)} rock→POD sand→home`
      : C519_NAMES.includes(name)
        ? `→${cher} 67s→${proximityPlant("519", C519_NAMES, name, cycleDay, down, subMap)} rock→POD→home`
        : `→${mh} 67s→${p(rotaAssign(C506_NAMES,name,C506_ROTA,cycleDay),down,subMap)} rock→POD sand→home`
    return `${name}: ${scMH} 67s→${firstRock} rock→${check518(down,subMap)}→502 BP 1/4 downs→907 blocks${postBP}`
  }

  // ── STANDARD ROUTES (non-BP, non-Tuesday/Friday) ──

  // 519 (Muscle Shoals) — scrap to Cherokee (594), rock OUT of Cherokee to plants by proximity
  if (C519_NAMES.includes(name)) {
    const plant = planned
      ? p(planned[0], down, subMap)
      : proximityPlant("519", C519_NAMES, name, cycleDay, down, subMap)

    if (swap519) {
      const plant2 = planned && planned[1]
        ? p(planned[1], down, subMap)
        : proximityPlant("519", C519_NAMES, name, cycleDay + 1, down, subMap)
      return `${name}: ${sc594} 67s→${plant} rock→${qry} scrap→${plant2} rock→${qry} loop`
    }
    return `${name}: ${sc594} 67s→${plant} rock→POD sand→home`
  }

  // 507 (HSV) — scrap to MH (591), rock spread to plants by proximity
  if (C507_NAMES.includes(name)) {
    const plant = planned
      ? p(planned[0], down, subMap)
      : proximityPlant("507", C507_NAMES, name, cycleDay, down, subMap)

    // 514 chain rule
    if (plant === "514") {
      return `${name}: ${scMH} 67s→${p("511",down,subMap)} rock→POD sand→${after514("507", down, subMap)}→507 home`
    }
    return `${name}: ${scMH} 67s→${plant} rock→POD sand→home`
  }

  // 506 (Decatur) — scrap to MH (591), 2 rounds, rock spread by proximity
  if (C506_NAMES.includes(name)) {
    const plants = planned
      ? planned.map(c => p(c, down, subMap))
      : proximityPlants("506", C506_NAMES, name, cycleDay, 3, down, subMap)

    const r1 = plants[0] || "511"
    const sandPlant = plants[1] || "513"
    const r2 = plants[2] || "506"

    if (name === "Kenny") return `${name}: ${scMH} 67s→${r1} rock→POD sand→${p("519",down,subMap)} scrap→${qry} repeat`
    if (name === "Jimmy") return `${name}: ${scMH} 67s→${p("513",down,subMap)} rock→POD sand→${p("511",down,subMap)}→POD→511 repeat`

    // 514 chain rule on r1
    if (r1 === "514") return `${name}: ${scMH} 67s→${p("511",down,subMap)} rock→POD sand→${after514("506", down, subMap)}→506 home`

    // 514 chain on mid-sand
    if (sandPlant === "514") return `${name}: ${scMH} 67s→${r1} rock→POD sand→${after514("506", down, subMap)}→506 home`

    // 514 chain on r2
    if (r2 === "514") return `${name}: ${scMH} 67s→${r1} rock→POD sand→${sandPlant}→${mh} 67s→${p("511",down,subMap)} rock→POD sand→${after514("506", down, subMap)}→506 home`

    return `${name}: ${scMH} 67s→${r1} rock→POD sand→${sandPlant}→${mh} 67s→${r2} rock→POD sand→home`
  }

  return `${name}: route TBD`
}
