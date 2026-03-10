// Drive times in MINUTES between plants (one-way, loaded truck, highway speeds)
// Shane: update these as you learn real times. Format: "FROM-TO": minutes
// If a pair is missing, getDriveTime returns DEFAULT_DRIVE (30 min)

const TIMES = {
  // ── MH (591) hub ──
  "591-507": 70,    // MH to Stringfield
  "591-506": 30,    // MH to Decatur
  "591-511": 40,    // MH to Palmer
  "591-513": 35,    // MH to Greenbrier
  "591-514": 80,    // MH to Arab
  "591-516": 80,    // MH to Lacey Spring
  "591-518": 320,    // MH to Scottsboro
  "591-519": 20,    // MH to Muscle Shoals
  "591-525": 45,    // MH to Cullman
  "591-594": 40,    // MH to Cherokee RQ (close)
  "591-502": 360,    // MH to Bridgeport
  "591-907": 45,    // MH to Palmer Block

  // ── BP (502) hub ──
  "502-518": 25,    // Bridgeport to Scottsboro
  "502-907": 200,    // Bridgeport to Palmer Block
  "502-511": 200,    // Bridgeport to Palmer
  "502-594": 390,    // Bridgeport to Cherokee

  // ── Scottsboro (518) ──
  "518-907": 200,    // Scottsboro to Palmer Block
  "518-502": 25,    // Scottsboro to Bridgeport

  // ── POD / Sand ──
  "POD-506": 10,    // POD Decatur Sand to Decatur (close)
  "POD-507": 75,    // POD to Stringfield
  "POD-511": 20,    // POD to Palmer
  "POD-513": 15,    // POD to Greenbrier
  "POD-514": 85,    // POD to Arab
  "POD-516": 85,    // POD to Lacey Spring
  "POD-519": 55,    // POD to Muscle Shoals
  "POD-525": 45,    // POD to Cullman

  // ── Cross-plant ──
  "506-507": 70,    // Decatur to Stringfield
  "506-511": 30,    // Decatur to Palmer
  "506-513": 20,    // Decatur to Greenbrier
  "506-519": 50,    // Decatur to Muscle Shoals
  "507-511": 25,    // Stringfield to Palmer
  "507-513": 40,    // Stringfield to Greenbrier
  "507-519": 75,    // Stringfield to Muscle Shoals
  "511-513": 10,    // Palmer to Greenbrier
  "514-516": 25,    // Arab to Lacey Spring (LQ)
  "516-RG":  1,    // Lacey Spring to Rogers Group
  "RG-507":  25,    // Rogers Group to Stringfield
  "RG-511":  35,    // Rogers Group to Palmer
  "RG-513":  45,    // Rogers Group to Greenbrier
  "514-RG":  20,    // Arab to Rogers Group
  "507-MM":  1,    // Stringfield to Martin Marietta
  "MM-511":  25,    // Martin Marietta to Palmer
  "MM-513":  30,    // Martin Marietta to Greenbrier
  "519-507": 75,    // Muscle Shoals to Stringfield
  "519-506": 50,    // Muscle Shoals to Decatur
  "594-518": 420,    // Cherokee to Scottsboro
  "594-506": 55,    // Cherokee to Decatur
  "594-507": 95,    // Cherokee to Stringfield
  "594-511": 75,    // Cherokee to Palmer
  "594-513": 65,    // Cherokee to Greenbrier
  "594-514": 100,    // Cherokee to Arab
  "594-519": 30,    // Cherokee to Muscle Shoals
  "525-506": 30,    // Cullman to Decatur
}

const DEFAULT_DRIVE = 30  // fallback if pair not found

export const LOAD_TIME    = 20   // minutes to load at quarry/plant
export const UNLOAD_TIME  = 15   // minutes to unload/dump
export const SCRAP_TIME   = 15   // minutes for scrap pickup
export const QUARRY_CLOSE = 960  // 4:00 PM in minutes (16 * 60)
export const END_OF_SHIFT_BUFFER = 90  // minutes before quarry close = "near end"

export function getDriveTime(from, to) {
  if (from === to) return 0
  return TIMES[`${from}-${to}`] || TIMES[`${to}-${from}`] || DEFAULT_DRIVE
}

export function timeToMinutes(str) {
  const [h, m] = str.split(":").map(Number)
  return h * 60 + m
}

export function minutesToTime(m) {
  const h = Math.floor(m / 60)
  const mins = m % 60
  return `${String(h).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

export function addMinutes(timeStr, delta) {
  let m = timeToMinutes(timeStr) + delta
  if (m < 180) m = 180    // clamp to 03:00
  if (m > 480) m = 480    // clamp to 08:00
  return minutesToTime(m)
}

// Estimate total minutes for a sequence of stops
// stops = ["591", "518", "502", "907"] etc.
export function estimateRouteTime(stops) {
  let total = 0
  for (let i = 0; i < stops.length - 1; i++) {
    total += getDriveTime(stops[i], stops[i + 1])
    total += UNLOAD_TIME
  }
  return total
}

// Can the driver reach a quarry before 4pm?
export function canReachQuarry(currentMinutes, fromPlant, quarryPlant) {
  const arrival = currentMinutes + getDriveTime(fromPlant, quarryPlant)
  return arrival < QUARRY_CLOSE
}

// Is this driver near end of shift?
export function isNearEndOfShift(startMinutes, elapsedMinutes) {
  const current = startMinutes + elapsedMinutes
  return current >= (QUARRY_CLOSE - END_OF_SHIFT_BUFFER)
}
