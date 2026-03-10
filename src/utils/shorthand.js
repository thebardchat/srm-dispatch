import { C507_NAMES, C519_NAMES, C506_NAMES, BP_GROUPS, C507_ROTA, C506_ROTA, C519_TUE_PLANTS, C507_TUE_PLANTS, CONTACTS } from '../config/crew.js'
import { rotaAssign } from './rotation.js'

function p(code, down, subMap) {
  return down.has(code) ? (subMap[code] || "?") : code
}

function quarry(mhDay, down, sub) {
  return mhDay ? p("591", down, sub) : p("594", down, sub)
}

export function buildShorthand(name, { tf, mhDay, down, subMap, curtisOffice, swap519, cycleDay }) {
  const sc  = `Scrap→${quarry(mhDay, down, subMap)}`
  const qry = quarry(mhDay, down, subMap)
  const allBP = new Set([...Object.values(BP_GROUPS).flat(), "Stacey", "Alexis"])
  const onBP  = allBP.has(name)

  if (name === "CHRIS P") return "CHRIS P: CHER→MSAND→Tupelo Block→APAC Tremont→511→POD→519→PRELOAD"
  if (name === "Tim")     return `Tim: 519→${p("506",down,subMap)} delivery→POD check→PRELOAD 519`

  if (name === "Stacey")  return `Stacey: ${sc} 67s→518 stage→502 BP 1/4 downs→907 blocks→511 Palmer→POD sand→home`

  if (name === "Alexis") {
    const r1 = `R1: 516→RG 67s→${p("507",down,subMap)}→MM 67s→${p("513",down,subMap)}→POD sand→${p("514",down,subMap)}`
    const r2 = `R2: 516→RG 67s→${p("507",down,subMap)}→MM 67s→${p("511",down,subMap)}→POD sand→516`
    return `Alexis: ${r1} / ${r2}`
  }

  if (name === "Curtis") {
    if (curtisOffice) return "Curtis: IN OFFICE — 525 needs coverage"
    if (onBP) return `Curtis: ${sc} 67s→518 stage→502 BP 1/4 downs→907 blocks→${p("594",down,subMap)} 67s→${p("506",down,subMap)} rock→POD sand→home`
    return `Curtis: ${sc} 67s→${p("525",down,subMap)} rock→home`
  }

  // ── TUESDAY/FRIDAY OVERRIDES ──
  // 519 crew: MH scrap + 67s → spread to plants → call re: 518 → BP
  // 507 crew: start at BP → blocks → POD spread → loop → home 507
  // These include BP stops already, so they override the generic BP rotation

  if (tf && C519_NAMES.includes(name)) {
    const idx = C519_NAMES.indexOf(name)
    const tuePlant = p(C519_TUE_PLANTS[(idx + cycleDay) % C519_TUE_PLANTS.length], down, subMap)
    return `${name}: Scrap→${p("591",down,subMap)} 67s→${tuePlant}→📞 518 check: Shane ${CONTACTS.SHANE} / Anthony ${CONTACTS.ANTHONY}→MM 67 or DH→502 BP 1/4 downs→907 blocks→POD sand→519`
  }

  if (tf && C507_NAMES.includes(name)) {
    const idx = C507_NAMES.indexOf(name)
    const tuePlant = p(C507_TUE_PLANTS[(idx + cycleDay) % C507_TUE_PLANTS.length], down, subMap)
    return `${name}: 502 BP 1/4 downs→907 blocks→POD sand→${tuePlant}→loop→507 home`
  }

  // ── BP ROTATION (non-Tuesday/Friday) ──
  if (onBP) {
    const postBP =
      C507_NAMES.includes(name)
        ? `→${qry} 67s→${p(rotaAssign(C507_NAMES,name,C507_ROTA,cycleDay),down,subMap)} rock→POD sand→home`
      : C519_NAMES.includes(name)
        ? `→${qry} 67s→${p("519",down,subMap)} rock→POD→home`
        : `→${qry} 67s→${p(rotaAssign(C506_NAMES,name,C506_ROTA,cycleDay),down,subMap)} rock→POD sand→home`
    return `${name}: ${sc} 67s→518 stage→502 BP 1/4 downs→907 blocks${postBP}`
  }

  // ── STANDARD ROUTES (non-BP, non-Tuesday/Friday) ──
  if (C519_NAMES.includes(name)) {
    if (swap519) return `${name}: ${sc} 67s→${p("519",down,subMap)} rock→${qry} scrap→${p("519",down,subMap)} rock→${qry} loop`
    return `${name}: ${sc} 67s→${p("519",down,subMap)} rock→POD sand→home`
  }

  if (C507_NAMES.includes(name)) {
    const sub = p(rotaAssign(C507_NAMES,name,C507_ROTA,cycleDay), down, subMap)
    return `${name}: ${sc} 67s→${sub} rock→POD sand→home`
  }

  if (C506_NAMES.includes(name)) {
    const assigned = rotaAssign(C506_NAMES, name, C506_ROTA, cycleDay)
    const sub = p(assigned, down, subMap)
    if (name === "Kenny") return `${name}: ${sc} 67s→${sub} rock→POD sand→${p("519",down,subMap)} scrap→${qry} repeat`
    if (name === "Jimmy") return `${name}: ${sc} 67s→${p("513",down,subMap)} rock→POD sand→${p("511",down,subMap)}→POD→511 repeat`
    if (assigned === "514") return `${name}: ${sc} 67s→${p("511",down,subMap)} rock→POD sand→${sub} scrap→LQ→RG 67s→${p("507",down,subMap)}→MM 67s→${p("511",down,subMap)}→POD sand→home`
    return `${name}: ${sc} 67s→${sub} rock→POD sand→${p("507",down,subMap)}→MM 67s→${p("511",down,subMap)}→POD sand→home`
  }

  return `${name}: route TBD`
}
