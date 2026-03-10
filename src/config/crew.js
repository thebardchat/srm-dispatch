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

export const ALL_DRIVERS = [
  { name: "CHRIS P", crew: "DUMP",  color: "#FFD700", bg: "#2a2200", start: "04:00", fixed: true },
  { name: "Tim",     crew: "DUMP",  color: "#BCAAA4", bg: "#1a1210", start: "04:00" },
  { name: "Marcus",  crew: "507",   color: "#4FC3F7", bg: "#0a1a22", start: "06:00" },
  { name: "Brittany",crew: "507",   color: "#4FC3F7", bg: "#0a1a22", start: "05:00" },
  { name: "Eboni",   crew: "507",   color: "#4FC3F7", bg: "#0a1a22", start: "05:00" },
  { name: "Deletra", crew: "507",   color: "#4FC3F7", bg: "#0a1a22", start: "04:00" },
  { name: "Charlie", crew: "519",   color: "#A5D6A7", bg: "#0a1a0f", start: "04:30" },
  { name: "Bryant",  crew: "519",   color: "#A5D6A7", bg: "#0a1a0f", start: "04:30" },
  { name: "Jamie",   crew: "519",   color: "#A5D6A7", bg: "#0a1a0f", start: "05:00" },
  { name: "Eddie",   crew: "519",   color: "#A5D6A7", bg: "#0a1a0f", start: "05:00" },
  { name: "Kenny",   crew: "506",   color: "#CE93D8", bg: "#1a0a22", start: "05:00" },
  { name: "Jimmy",   crew: "506",   color: "#CE93D8", bg: "#1a0a22", start: "05:00" },
  { name: "Roberto", crew: "506",   color: "#CE93D8", bg: "#1a0a22", start: "04:00" },
  { name: "Jonathon",crew: "506",   color: "#CE93D8", bg: "#1a0a22", start: "04:15" },
  { name: "Curtis",  crew: "506",   color: "#FFCC02", bg: "#1a1600", start: "04:00" },
  { name: "Stacey",  crew: "507",   color: "#4FC3F7", bg: "#001a22", start: "05:00", fixedBP: true },
  { name: "Alexis",  crew: "BP",    color: "#FF7043", bg: "#220a00", start: "08:00", noPreload: true, fixedBP: true },
]

export const CREW_TABS   = ["ALL", "519", "507", "506", "BRIDGEPORT", "DUMP"]
export const CREW_COLORS = {
  ALL: "#FF6F00", "519": "#A5D6A7", "507": "#4FC3F7",
  "506": "#CE93D8", BRIDGEPORT: "#FF7043", DUMP: "#BCAAA4",
}
