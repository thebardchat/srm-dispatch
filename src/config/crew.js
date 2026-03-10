export const BP_GROUPS = {
  A: ["Marcus", "Brittany", "Charlie", "Kenny"],
  B: ["Eboni", "Deletra", "Bryant", "Jimmy"],
  C: ["Roberto", "Jonathon", "Jamie", "Eddie"],
}

export const FIXED_BP = ["Stacey", "Alexis"]

export const C507_NAMES = ["Marcus", "Brittany", "Eboni", "Deletra"]
export const C519_NAMES = ["Charlie", "Bryant", "Jamie", "Eddie"]
export const C506_NAMES = ["Kenny", "Jimmy", "Roberto", "Jonathon"]

export const C507_ROTA = ["506", "511", "513", "507", "514"]
export const C506_ROTA = ["511", "513", "514", "506"]

export const DED_POOL = [...C507_NAMES, ...C519_NAMES, ...C506_NAMES]

// Tuesday/Friday plant assignments — each driver gets one, rotates by cycleDay
export const C519_TUE_PLANTS = ["511", "506", "513", "507"]   // 519 crew delivers MH 67s to these
export const C507_TUE_PLANTS = ["516", "514", "519", "513"]   // 507 crew delivers POD sand to these

// BP first-rock delivery — MH 67s goes to one of these FIRST (not 518), rotates by driver index + cycleDay
export const BP_FIRST_PLANTS = ["506", "513", "511", "507"]

// Contacts for 518 Scottsboro material check
export const CONTACTS = {
  SHANE:   "256-402-5176",
  ANTHONY: "256-924-4328",
}

export const ALL_DRIVERS = [
  { name: "CHRIS P", crew: "DUMP",  color: "#FFD700", bg: "#2a2200", start: "04:00", fixed: true },
  { name: "Tim",     crew: "DUMP",  color: "#BCAAA4", bg: "#1a1210", start: "05:00", fixed: true },
  { name: "Marcus",  crew: "507",   color: "#4FC3F7", bg: "#0a1a22", start: "05:00", noPreload: true },
  { name: "Brittany",crew: "507",   color: "#4FC3F7", bg: "#0a1a22", start: "05:00", noPreload: true },
  { name: "Eboni",   crew: "507",   color: "#4FC3F7", bg: "#0a1a22", start: "05:00", noPreload: true },
  { name: "Deletra", crew: "507",   color: "#4FC3F7", bg: "#0a1a22", start: "04:00", noPreload: true },
  { name: "Charlie", crew: "519",   color: "#A5D6A7", bg: "#0a1a0f", start: "04:15", noPreload: true },
  { name: "Bryant",  crew: "519",   color: "#A5D6A7", bg: "#0a1a0f", start: "04:30", noPreload: true },
  { name: "Jamie",   crew: "519",   color: "#A5D6A7", bg: "#0a1a0f", start: "04:30", noPreload: true },
  { name: "Eddie",   crew: "519",   color: "#A5D6A7", bg: "#0a1a0f", start: "04:00", noPreload: true },
  { name: "Kenny",   crew: "506",   color: "#CE93D8", bg: "#1a0a22", start: "05:00", noPreload: true },
  { name: "Jimmy",   crew: "506",   color: "#CE93D8", bg: "#1a0a22", start: "05:00", noPreload: true },
  { name: "Roberto", crew: "506",   color: "#CE93D8", bg: "#1a0a22", start: "04:00", noPreload: true },
  { name: "Jonathon",crew: "506",   color: "#CE93D8", bg: "#1a0a22", start: "04:15", noPreload: true },
  { name: "Stacey",  crew: "507",   color: "#4FC3F7", bg: "#001a22", start: "04:00", fixedBP: true },
  { name: "Alexis",  crew: "516",    color: "#FF7043", bg: "#220a00", start: "08:00", noPreload: true, fixed: true, shortDay: true },
]

export const CREW_TABS   = ["ALL", "519", "507", "506", "BRIDGEPORT", "DUMP"]
export const CREW_COLORS = {
  ALL: "#FF6F00", "519": "#A5D6A7", "507": "#4FC3F7",
  "506": "#CE93D8", BRIDGEPORT: "#FF7043", DUMP: "#BCAAA4",
}
