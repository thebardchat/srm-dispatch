import { C507_NAMES, C519_NAMES, C506_NAMES, BP_GROUPS, C507_ROTA, C506_ROTA } from '../config/crew.js'
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

  if (onBP) {
    const postBP =
      C507_NAMES.includes(name)
        ? `→${qry} 67s→${p(rotaAssign(C507_NAMES,name,C507_ROTA,cycleDay),down,subMap)} rock→POD sand→home`
      : C519_NAMES.includes(name)
        ? tf
          ? `→${p("591",down,subMap)} 67s→${p("507",down,subMap)} rock→MM 67s→${p("518",down,subMap)}→POD sand→519`
          : `→${qry} 67s→${p("519",down,subMap)} rock→POD→home`
        : `→${qry} 67s→${p(rotaAssign(C506_NAMES,name,C506_ROTA,cycleDay),down,subMap)} rock→POD sand→home`
    return `${name}: ${sc} 67s→518 stage→502 BP 1/4 downs→907 blocks${postBP}`
  }

  if (C519_NAMES.includes(name)) {
    if (swap519) return `${name}: ${sc} 67s→${p("519",down,subMap)} rock→${qry} scrap→${p("519",down,subMap)} rock→${qry} loop`
    if (tf) return `${name}: ${sc} 67s→${p("507",down,subMap)} rock→MM 67s→${p("518",down,subMap)}→502 BP 1/4 downs→907→POD sand→519`
    return `${name}: ${sc} 67s→${p("519",down,subMap)} rock→POD sand→home`
  }

  if (C507_NAMES.includes(name)) {
    const sub = p(rotaAssign(C507_NAMES,name,C507_ROTA,cycleDay), down, subMap)
    if (tf) return `${name}: ${sc} 67s→${p("519",down,subMap)} rock×2→${sub} rock→POD sand→home`
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
