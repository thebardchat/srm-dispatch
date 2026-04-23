import { getCycleDay, getBPGroup } from "./src/utils/rotation.js"
import { buildShorthand } from "./src/utils/shorthand.js"
import { ALL_DRIVERS, BP_GROUPS, C507_NAMES, C506_NAMES, C507_TUE_PLANTS, C506_ROTA } from "./src/config/crew.js"
import { rotaAssign } from "./src/utils/rotation.js"

const tue = new Date(2026, 2, 17)
const cycleDay = getCycleDay(tue)

console.log("=== 514 CHAIN RULE TESTS ===")
console.log("")

// Find which 507 driver gets 514 on this Tuesday
C507_NAMES.forEach((name, idx) => {
  const plant = C507_TUE_PLANTS[(idx + cycleDay) % C507_TUE_PLANTS.length]
  if (plant === "514") {
    const args = { tf: true, mhDay: false, down: new Set(), subMap: {}, curtisOffice: false, swap519: false, cycleDay, startOverrides: {} }
    console.log("507 driver assigned 514 on Tue:")
    console.log("  " + buildShorthand(name, args))
    console.log("  Should contain: scrap→LQ→RG rock→507")
  }
})

// Test 506 crew with assigned 514
console.log("")
console.log("506 driver assigned 514 (non-Tue):")
// Find a cycleDay where a 506 driver gets 514
for (let cd = 0; cd < 3; cd++) {
  C506_NAMES.forEach(name => {
    const assigned = rotaAssign(C506_NAMES, name, C506_ROTA, cd)
    if (assigned === "514") {
      const args = { tf: false, mhDay: false, down: new Set(), subMap: {}, curtisOffice: false, swap519: false, cycleDay: cd, startOverrides: {} }
      console.log(`  [cycle ${cd+1}] ${buildShorthand(name, args)}`)
      console.log("  Should contain: scrap→LQ→RG rock→506")
    }
  })
}

// Test Alexis 514 chain
console.log("")
console.log("Alexis (delivers to 514 in R1):")
const alexisArgs = { tf: false, mhDay: false, down: new Set(), subMap: {}, curtisOffice: false, swap519: false, cycleDay: 0, startOverrides: {} }
console.log("  " + buildShorthand("Alexis", alexisArgs))

console.log("")
console.log("=== END-OF-SHIFT 519 TESTS ===")
console.log("")

// Find which 507 driver gets 519 on this Tuesday
C507_NAMES.forEach((name, idx) => {
  const plant = C507_TUE_PLANTS[(idx + cycleDay) % C507_TUE_PLANTS.length]
  if (plant === "519") {
    // Early start — should have enough time
    const earlyArgs = { tf: true, mhDay: false, down: new Set(), subMap: {}, curtisOffice: false, swap519: false, cycleDay, startOverrides: { [name]: "04:00" } }
    console.log(`${name} assigned 519, start 04:00 (early):`)
    console.log("  " + buildShorthand(name, earlyArgs))

    // Late start — should trigger short route
    const lateArgs = { tf: true, mhDay: false, down: new Set(), subMap: {}, curtisOffice: false, swap519: false, cycleDay, startOverrides: { [name]: "07:00" } }
    console.log(`${name} assigned 519, start 07:00 (late):`)
    console.log("  " + buildShorthand(name, lateArgs))
  }
})

console.log("")
console.log("=== DATE NAV TEST ===")
const fri = new Date(2026, 2, 13) // Friday
const nextDay = new Date(fri)
nextDay.setDate(nextDay.getDate() + 1)
while (nextDay.getDay() === 0 || nextDay.getDay() === 6) nextDay.setDate(nextDay.getDate() + 1)
console.log(`Friday Mar 13 → next workday: ${nextDay.toDateString()} (should be Monday)`)
