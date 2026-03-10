# srm-dispatch
# SRM DISPATCH
**SRM Concrete North Alabama — Daily Dispatch Tool**  
`thebardchat/srm-dispatch` · Hazel Green, AL

---

```
███████╗██████╗ ███╗   ███╗
██╔════╝██╔══██╗████╗ ████║
███████╗██████╔╝██╔████╔██║
╚════██║██╔══██╗██║╚██╔╝██║
███████║██║  ██║██║ ╚═╝ ██║
╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝
DISPATCH // HAZEL GREEN AL
```

---

## WHAT IT IS

A local-first, static React app that generates and delivers daily routes for 18 dump truck drivers across SRM's North Alabama concrete plant fleet. Built by a dispatcher, for dispatchers — no fluff, no login, no cloud dependency.

One tap copies a driver's full route. You paste it into a text. Done.

---

## WHAT IT DOES

- **Daily route generation** per driver based on crew, day type, and plant availability
- **Bridgeport rotation** — 3-group (A/B/C) continuous weekday cycle, auto-calculated
- **Audible system** — mark any plant DOWN, routes auto-update with substitutions
- **One-tap copy** per driver → paste directly into text message
- **BP Calendar** — 4-week rotation view so you know who's at Bridgeport every day
- **Day type toggle** — Mon/Wed/Thu vs Tue/Fri schedule in one click
- **Special modes** — MH Day, 519 Swap, Curtis Office, Alexis Short Day

---

## STACK

| | |
|---|---|
| Framework | React 18 |
| Build | Vite 5 |
| Styling | Inline styles (intentional) |
| State | `useState` only — no Redux, no context |
| Backend | None — fully static |
| Database | None — config files are the source of truth |

No server. No database. No login. Runs anywhere a browser runs.

---

## PROJECT STRUCTURE

```
srm-dispatch/
├── index.html
├── package.json
├── vite.config.js
├── CLAUDE.md               ← AI assistant context (Claude Code)
├── README.md               ← You are here
└── src/
    ├── App.jsx             ← All UI + state logic
    ├── config/
    │   ├── crews.js        ← Driver list, crew assignments, BP groups
    │   └── plants.js       ← Plant list + substitution map
    └── utils/
        ├── rotation.js     ← BP cycle math (getCycleDay, getBPGroup)
        └── shorthand.js    ← buildShorthand() — route text per driver
```

---

## QUICK START

```bash
git clone https://github.com/thebardchat/srm-dispatch.git
cd srm-dispatch
npm install
npm run dev
```

Opens at `http://localhost:5173`

```bash
# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## HOW THE BP ROTATION WORKS

Bridgeport runs a **3-group continuous weekday cycle** — Groups A, B, and C rotating through every working day.

- The cycle never resets — holidays are skipped, not restarted
- `getCycleDay(date)` returns `0`, `1`, or `2` (maps to A, B, C)
- Stacey and Alexis anchor BP **every day** regardless of group
- No crew hits Bridgeport on back-to-back days

The BP Calendar view shows 4 weeks ahead so you can plan around it.

---

## AUDIBLE SYSTEM

Mark a plant **DOWN** in the Audibles panel:

1. Hit **⚠️ AUDIBLES** button
2. Tap the plant that's down
3. Select the sub plant (auto-populated from substitution map)
4. Every affected driver's route updates instantly
5. Red warning banner appears at top

No sub available → shows **📞 Call Shane**

---

## DAY TYPES

| Toggle | Schedule |
|--------|----------|
| MON/WED/THU | Standard plant rotation |
| TUE/FRI | Alternate schedule (different plant assignments) |

Auto-detects on load. Override manually with the toggle in the header.

---

## CREW TABS

| Tab | Who |
|-----|-----|
| ALL | Every driver |
| DUMP | Dump crew |
| BRIDGEPORT | Today's BP group + Stacey + Alexis |
| 507 | Plant 507 crew + Stacey |
| 519 | Plant 519 crew |
| 506 | Plant 506 crew |

---

## PLANT CODES

| Code | Plant |
|------|-------|
| RG | Rogers Group |
| MM | Martin Marietta |
| LQ | 516 Lacey Spring |
| MH | 591 Mt. Hope |
| BP | Bridgeport |

---

## CONTRIBUTING

This is an internal operations tool. Issues and PRs from the SRM team are welcome.

If you're adding a driver or changing plant assignments, edit `src/config/crews.js` and `src/config/plants.js` — not `App.jsx`.

Before touching rotation logic in `src/utils/rotation.js`, verify the output against the physical BP calendar. The math has to be right — this runs real trucks.

---

## DEPLOYMENT

### GitHub Pages
```bash
npm install gh-pages --save-dev
```
Add to `package.json`:
```json
"homepage": "https://thebardchat.github.io/srm-dispatch",
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}
```
```bash
npm run deploy
```

### Cloudflare Pages
Connect repo at `dash.cloudflare.com` → build command `npm run build` → output dir `dist`  
Auto-deploys on every push to `main`.

---

## ECOSYSTEM

This tool is a **standalone leaf node** in the broader ShaneBrain ecosystem.

```
shanebrain-core (local AI cluster)
        ↑
        │ optional webhook — fire-and-forget
        │
srm-dispatch (static PWA)
```

srm-dispatch optionally POSTs audible events to ShaneBrain for logging — but it **never depends on ShaneBrain being alive**. Dispatch works with or without the cluster running.

See `CLAUDE.md` for full integration details and the complete fix/feature backlog.

---

## LICENSE

Internal operations tool — SRM Concrete North Alabama.

---

*Built by Shane · SRM Dispatch · Hazel Green AL*  
*"File structure first. Action over theory."*
