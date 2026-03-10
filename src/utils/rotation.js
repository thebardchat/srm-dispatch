import { BP_GROUPS, DED_POOL, FIXED_BP } from '../config/crew.js'

const BASE = new Date("2026-03-09")
BASE.setHours(0,0,0,0)

export function getCycleDay(d = new Date()) {
  const target = new Date(d)
  target.setHours(0,0,0,0)
  let wd = 0
  const cur = new Date(BASE)
  while (cur < target) {
    cur.setDate(cur.getDate() + 1)
    if (cur.getDay() !== 0 && cur.getDay() !== 6) wd++
  }
  return wd % 3
}

export function getBPGroup(cycleDay) {
  return ["A","B","C"][cycleDay]
}

export function getBPDrivers(cycleDay) {
  return [...BP_GROUPS[getBPGroup(cycleDay)], ...FIXED_BP]
}

export function rotaAssign(list, name, rota, cycle) {
  const idx = list.indexOf(name)
  if (idx === -1) return rota[0]
  return rota[(idx + cycle) % rota.length]
}

export function getDedicatedDriver(weekdayNum, bpSet) {
  for (let offset = 0; offset < DED_POOL.length; offset++) {
    const cand = DED_POOL[(weekdayNum + offset) % DED_POOL.length]
    if (!bpSet.has(cand)) return cand
  }
  return null
}

export function getBPCalendar(fromDate = new Date()) {
  const DNAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
  const MNAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const days = []
  const today = new Date(fromDate)
  today.setHours(0,0,0,0)
  let cd = getCycleDay(today)
  let weekdayCount = 0
  const cur = new Date(today)
  while (days.length < 15) {
    if (cur.getDay() !== 0 && cur.getDay() !== 6) {
      const grpIdx = cd % 3
      const grp = ["A","B","C"][grpIdx]
      days.push({
        date:     new Date(cur),
        label:    `${DNAMES[cur.getDay()]} ${MNAMES[cur.getMonth()]} ${cur.getDate()}`,
        day:      DNAMES[cur.getDay()],
        grp, grpIdx,
        isToday:  cur.toDateString() === today.toDateString(),
        weekNum:  Math.floor(weekdayCount / 5) + 1,
      })
      cd++
      weekdayCount++
    }
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

export function driverBPDay(name, cycleDay) {
  if (name === "Stacey" || name === "Alexis") return { label:"EVERY DAY", days:0, fixed:true }
  if (name === "CHRIS P" || name === "Tim")   return null
  const groupIdx = Object.entries(BP_GROUPS).findIndex(([,members]) => members.includes(name))
  if (groupIdx === -1) return null
  const daysAway = (groupIdx - cycleDay + 3) % 3
  return {
    label:      daysAway===0 ? "TODAY" : daysAway===1 ? "TOMORROW" : "IN 2 DAYS",
    cycleDay:   groupIdx + 1,
    groupLabel: ["A","B","C"][groupIdx],
    days:       daysAway,
  }
}

export function isTueFri(d = new Date()) {
  return d.getDay() === 2 || d.getDay() === 5
}
