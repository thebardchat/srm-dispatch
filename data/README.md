# SRM Operational Data Files

Operational data files for SRM Concrete dispatch system. Do not modify source code — data folder only.

## Files

| File | Description |
|------|-------------|
| `Default_Pickup_Locations.csv` | Standard pickup locations for concrete plant loads — maps plant codes to full addresses used in route planning |
| `SRM_Dump_Truck_Locations.csv` | Driver-to-parking-location mapping for all 19 active dump truck drivers — used to assign morning start points |
| `SCHEDULE_WITH_KEY.csv` | Full dispatch schedule with route keys — includes driver assignments, plant codes, load times, and job site destinations |
| `Abbreviation_Key.csv` | Reference table for all abbreviations used in dispatch communications (plant codes, job codes, driver shorthand) |
| `srm_location.csv` | SRM facility and job site coordinate data — latitude/longitude pairs for map routing |

## Usage

These files feed the dispatch scheduling engine. Load order: Abbreviation_Key → Default_Pickup_Locations → SRM_Dump_Truck_Locations → SCHEDULE_WITH_KEY.

---

Built by Shane Brazelton + Claude Anthropic | ShaneBrain Ecosystem, Hazel Green AL
