import { C507_NAMES, C519_NAMES, C506_NAMES, BP_GROUPS, C507_ROTA, C506_ROTA, C519_TUE_PLANTS, C507_TUE_PLANTS, BP_FIRST_PLANTS, CONTACTS } from '../config/crew.js'
import { rotaAssign } from './rotation.js'
import { timeToMinutes, getDriveTime, LOAD_TIME, UNLOAD_TIME, QUARRY_CLOSE } from '../config/distances.js'

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
// Returns modified route suffix based on time remaining before quarry close
// hoursBeforeDelivery = estimated hours of work before reaching 519
function endOfShift519(name, crew, startTime, hoursBeforeDelivery, down, subMap) {
  const startMin = timeToMinutes(startTime)
  const currentMin = startMin + (hoursBeforeDelivery * 60)
  const driveToMH = getDriveTime("519", "591")
  const mhTo506 = getDriveTime("591", "506")
  const mhToHome = getDriveTime("591", crew === "507" ? "507" : "506")
  const fullTrip = driveToMH + LOAD_TIME + mhToHome + LOAD_TIME  // MH scrap + 67 + home
  const shortTrip = driveToMH + LOAD_TIME + mhTo506 + UNLOAD_TIME // MH scrap + 67→506 + POD

  const homePlant = crew === "507" ? "507" : "506"
  const mh = p("591", down, subMap)

  if (currentMin + fullTrip > QUARRY_CLOSE) {
    // Tight on time: MH 67→506 (closer) then POD→home
    return `→${p("519",down,subMap)}→Scrap→${mh} 67s→${p("506",down,subMap)}→POD→${p(homePlant,down,subMap)} home (⏰ short route)`
  }
  // Enough time: MH 67→home plant
  return `→${p("519",down,subMap)}→Scrap→${mh} 67s→${p(homePlant,down,subMap)} home`
}

// BP first-rock: rotating MH 67s delivery to a main plant (NOT 518)
// Then 518 check: MM 78s→518 if they can hold it, otherwise deadhead to BP
function bpFirstRock(name, cycleDay, down, subMap) {
  const group = BP_GROUPS[["A","B","C"][cycleDay % 3]]
  const idx = group.indexOf(name)
  // Rotating drivers get index-based rotation; Stacey/Curtis use cycleDay directly
  const plantIdx = idx >= 0 ? (idx + cycleDay) % BP_FIRST_PLANTS.length : cycleDay % BP_FIRST_PLANTS.length
  return p(BP_FIRST_PLANTS[plantIdx], down, subMap)
}

function check518(down, subMap) {
  return `📞 518: Shane ${CONTACTS.SHANE} / Anthony ${CONTACTS.ANTHONY}→MM 78s→${p("518",down,subMap)} or DH`
}

export function buildShorthand(name, { tf, mhDay, down, subMap, curtisOffice, swap519, cycleDay, startOverrides }) {
  const mh    = p("591", down, subMap)
  const scMH  = `Scrap→${mh}`
  const sc594 = `Scrap→${p("594", down, subMap)}`
  const qry   = quarry(mhDay, down, subMap)
  const todayBP = new Set([...BP_GROUPS[["A","B","C"][cycleDay % 3]], "Stacey", "Alexis"])
  const onBP  = todayBP.has(name)

  if (name === "CHRIS P") return "CHRIS P: CHER→MSAND→Tupelo Block→APAC Tremont→511→POD→519→PRELOAD"
  if (name === "Tim")     return `Tim: 519→${p("506",down,subMap)} delivery→POD check→PRELOAD 519`

  if (name === "Stacey") {
    const firstRock = bpFirstRock(name, cycleDay, down, subMap)
    return `Stacey: ${scMH} 67s→${firstRock} rock→${check518(down,subMap)}→502 BP 1/4 downs→907 blocks→511 Palmer→POD sand→home`
  }

  if (name === "Alexis") {
    const dest514 = p("514", down, subMap)
    // If Alexis ends R1 at 514, chain rule: scrap→LQ→RG→home
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
      return `Curtis: ${scMH} 67s→${firstRock} rock→${check518(down,subMap)}→502 BP 1/4 downs→907 blocks→${p("594",down,subMap)} 67s→${p("506",down,subMap)} rock→POD sand→home`
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
    // 514 chain rule
    if (tuePlant === "514") {
      return `${name}: 502 BP 1/4 downs→907 blocks→POD sand→${after514("507", down, subMap)}→507 home`
    }
    // 519 end-of-shift check
    if (tuePlant === "519") {
      const start = (startOverrides && startOverrides[name]) || "05:00"
      // Prior work before reaching 519: drive to 502 (~45min), 4 quarry loads of 1/4
      // downs (~4hrs round-trip each), 907 blocks (~1.5hrs), POD sand load + drive to 519 (~1.25hrs)
      // Total ~8hrs realistic for full BP day before 519 delivery
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
        ? `→${mh} 67s→${p("519",down,subMap)} rock→POD→home`
        : `→${mh} 67s→${p(rotaAssign(C506_NAMES,name,C506_ROTA,cycleDay),down,subMap)} rock→POD sand→home`
    return `${name}: ${scMH} 67s→${firstRock} rock→${check518(down,subMap)}→502 BP 1/4 downs→907 blocks${postBP}`
  }

  // ── STANDARD ROUTES (non-BP, non-Tuesday/Friday) ──

  // 519 (Muscle Shoals) — scrap to Cherokee (594), NOT MH
  if (C519_NAMES.includes(name)) {
    if (swap519) return `${name}: ${sc594} 67s→${p("519",down,subMap)} rock→${qry} scrap→${p("519",down,subMap)} rock→${qry} loop`
    return `${name}: ${sc594} 67s→${p("519",down,subMap)} rock→POD sand→home`
  }

  // 507 (HSV) — scrap to MH (591)
  if (C507_NAMES.includes(name)) {
    const sub = p(rotaAssign(C507_NAMES,name,C507_ROTA,cycleDay), down, subMap)
    // 514 chain rule
    if (sub === "514") {
      return `${name}: ${scMH} 67s→${p("511",down,subMap)} rock→POD sand→${after514("507", down, subMap)}→507 home`
    }
    return `${name}: ${scMH} 67s→${sub} rock→POD sand→home`
  }

  // 506 (Decatur) — scrap to MH (591), 2 rounds (close to MH 30min + POD 10min)
  if (C506_NAMES.includes(name)) {
    const idx = C506_NAMES.indexOf(name)
    const r1raw = C506_ROTA[(idx + cycleDay) % C506_ROTA.length]
    const r1 = p(r1raw, down, subMap)

    if (name === "Kenny") return `${name}: ${scMH} 67s→${r1} rock→POD sand→${p("519",down,subMap)} scrap→${qry} repeat`
    if (name === "Jimmy") return `${name}: ${scMH} 67s→${p("513",down,subMap)} rock→POD sand→${p("511",down,subMap)}→POD→511 repeat`

    // 514 chain rule on r1 — takes you home
    if (r1 === "514") return `${name}: ${scMH} 67s→${p("511",down,subMap)} rock→POD sand→${after514("506", down, subMap)}→506 home`

    // Round 2 plants from rotation
    const sandRaw = C506_ROTA[(idx + cycleDay + 1) % C506_ROTA.length]
    const sandPlant = p(sandRaw, down, subMap)
    const r2raw = C506_ROTA[(idx + cycleDay + 2) % C506_ROTA.length]
    const r2 = p(r2raw, down, subMap)

    // 514 chain on mid-sand delivery — takes you home, skip round 2
    if (sandPlant === "514") return `${name}: ${scMH} 67s→${r1} rock→POD sand→${after514("506", down, subMap)}→506 home`

    // 514 chain on r2
    if (r2 === "514") return `${name}: ${scMH} 67s→${r1} rock→POD sand→${sandPlant}→${mh} 67s→${p("511",down,subMap)} rock→POD sand→${after514("506", down, subMap)}→506 home`

    return `${name}: ${scMH} 67s→${r1} rock→POD sand→${sandPlant}→${mh} 67s→${r2} rock→POD sand→home`
  }

  return `${name}: route TBD`
}
