export const ALL_PLANTS = [
  { code: "506",          name: "506 Decatur" },
  { code: "507",          name: "507 Stringfield" },
  { code: "508",          name: "508 Nick Fitcheard" },
  { code: "511",          name: "511 Palmer" },
  { code: "513",          name: "513 Greenbrier" },
  { code: "514",          name: "514 Arab" },
  { code: "516",          name: "516 Lacey Spring" },
  { code: "518",          name: "518 Scottsboro" },
  { code: "519",          name: "519 Muscle Shoals" },
  { code: "525",          name: "525 Cullman" },
  { code: "502",          name: "502 Bridgeport" },
  { code: "591",          name: "591 Mt. Hope" },
  { code: "594",          name: "594 Cherokee RQ" },
  { code: "POD",          name: "POD Decatur Sand" },
  { code: "907",          name: "907 Palmer Block" },
  { code: "MM",           name: "MM Martin Marietta" },
  { code: "RG",           name: "RG Rogers Group" },
  { code: "ALEXIS_SHORT", name: "Alexis — Short Day" },
]

export const OUTSIDE_SAND = new Set(["507", "508", "525", "518"])
export const OUTSIDE_ROCK = new Set(["516"])
export const SAND_TARGETS = ["519", "506", "511", "513", "514", "516"]

export const SUBS = {
  "506": ["511","513","508"],
  "507": ["508","511","513"],
  "508": ["507","511","513"],
  "511": ["513","506","507"],
  "513": ["511","506","507"],
  "514": ["516","519","513"],
  "516": ["514","519","513"],
  "519": ["514","516","511"],
  "525": ["514","516","519"],
  "591": ["594"],
  "594": ["591"],
  "POD": [], "502": [], "907": [], "RG": [], "MM": [], "ALEXIS_SHORT": [],
}
