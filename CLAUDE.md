# CLAUDE.md — SRM DISPATCH
**Repo:** https://github.com/thebardchat/srm-dispatch  
**Last Updated:** March 2026  
**Maintainer:** Shane (thebardchat)  
**Status:** ✅ PRODUCTION — Daily use by SRM dispatch team, Hazel Green AL

---

## ⚠️ REPO BOUNDARIES — READ FIRST

This repo is **SEPARATE** from `shanebrain-core`. Do NOT mix them.

| Repo | Purpose | Location |
|------|---------|----------|
| `thebardchat/srm-dispatch` | Dispatch tool — THIS REPO | GitHub only |
| `shanebrain-core` | Personal AI ecosystem | `D:\Angel_Cloud\shanebrain-core\` |

**Never** import shanebrain-core code into this project.  
**Never** move this project into shanebrain-core directories.  
**Integration** between them happens via webhook/API only (see Integration section below).

---

## 🏗️ PROJECT OVERVIEW

React + Vite dispatch management tool for SRM Concrete North Alabama.  
Manages 18 dump truck drivers across multiple concrete plant crews.  
Primary use: Shane generates and copy-pastes daily routes to each driver via text.

**What it does:**
- Displays daily routes per driver based on crew, day type (Mon/Wed/Thu vs Tue/Fri), and plant status
- Tracks Bridgeport (BP) group rotation — 3-group (A/B/C) continuous weekday cycle
- Marks plants down and auto-substitutes alternate plants in routes
- One-tap copy per driver → paste into text message
- BP Calendar view showing 4-week rotation ahead

---

## 📁 FILE STRUCTURE

```
srm-dispatch/
├── CLAUDE.md                   ← YOU ARE HERE
├── index.html                  ← Vite entry
├── package.json                ← React 18 + Vite 5
├── vite.config.js
└── src/
    ├── App.jsx                 ← Main component (all UI + state)
    ├── config/
    │   ├── crews.js            ← ALL_DRIVERS, CREW_TABS, CREW_COLORS, BP_GROUPS
    │   └── plants.js           ← ALL_PLANTS, SUBS (substitution map)
    └── utils/
        ├── rotation.js         ← BP cycle logic (getCycleDay, getBPGroup, etc.)
        └── shorthand.js        ← buildShorthand() — generates route text per driver
```

---

## 🧠 CORE LOGIC — UNDERSTAND BEFORE TOUCHING

### Bridgeport (BP) Rotation
- 3 groups: A, B, C — rotate through weekdays continuously
- No reset on holidays — chain just skips that day and continues
- Stacey + Alexis anchor BP **every** day regardless of group
- `getCycleDay(date)` → 0, 1, or 2 (maps to group A, B, C)
- `getBPGroup(cycleDay)` → "A", "B", or "C"
- `getBPDrivers(cycleDay)` → array of driver names on BP today

### Day Types
- `tf = true` → Tuesday/Friday mode (different plant schedule)
- `tf = false` → Monday/Wednesday/Thursday mode
- Auto-detects from `isTueFri(date)` on load

### buildShorthand(driverName, args)
This is the heart of the app. It returns the full route text string for a driver.  
`args` = `{ tf, mhDay, down, subMap, curtisOffice, swap519, cycleDay }`  
If a plant code appears in `down`, this function should substitute via `subMap`.

### State flags (App.jsx)
| Flag | What it does |
|------|-------------|
| `tf` | Tue/Fri day type toggle |
| `mhDay` | Mt. Hope (591) special day mode |
| `swap519` | 519 crew swap override |
| `curtisOffice` | Curtis in office (no driving today) |
| `down` | Set of plant codes marked as down |
| `subOverride` | Manual sub selection per down plant |

---

## 🐛 KNOWN BUGS — FIX THESE

### BUG 1: Stale `TODAY` constant (CRITICAL)
**File:** `src/App.jsx` lines 3–11  
**Problem:** `const TODAY = new Date()` is module-level. If the tab stays open past midnight, all date logic (BP group, day type, date display) is wrong.

**Fix:**
```jsx
// Replace module-level TODAY with state
export default function App() {
  const [today, setToday] = useState(new Date())

  useEffect(() => {
    // Refresh at midnight
    const now = new Date()
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now
    const timer = setTimeout(() => setToday(new Date()), msUntilMidnight)
    return () => clearTimeout(timer)
  }, [today])

  // Replace all TODAY references with today (lowercase)
}
```
**Also update:** `cycleDay`, `BP_TODAY`, `BP_DRIVERS_TODAY`, `DAY_STR`, `DATE_STR` to derive from `today` state, not `TODAY` constant.

---

### BUG 2: Clipboard silently fails on HTTP
**File:** `src/App.jsx` — `copyText()` function  
**Problem:** `navigator.clipboard.writeText()` requires HTTPS or localhost. On local network HTTP (e.g., `http://192.168.x.x`) it silently fails — driver sees nothing happen.

**Fix:**
```jsx
function copyText(text, key) {
  let final = text
  if (key === "Alexis" && down.has("ALEXIS_SHORT")) {
    final = text.replace("/ R2:", "\n⚡ SHORT DAY — After R1 → 907 scrap block → 516 (skip R2 if short on time)\n\nR2 if time allows: ")
  }
  
  const doWrite = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(final)
        .then(() => { setCopied(key); setTimeout(() => setCopied(null), 2500) })
        .catch(() => fallbackCopy(final, key))
    } else {
      fallbackCopy(final, key)
    }
  }

  const fallbackCopy = (text, key) => {
    const el = document.createElement("textarea")
    el.value = text
    el.style.position = "fixed"
    el.style.opacity = "0"
    document.body.appendChild(el)
    el.focus()
    el.select()
    try {
      document.execCommand("copy")
      setCopied(key)
      setTimeout(() => setCopied(null), 2500)
    } catch {
      alert("Copy failed — long press the route text to copy manually")
    }
    document.body.removeChild(el)
  }

  doWrite()
}
```

---

### BUG 3: Hardcoded driver names in App.jsx (MAINTENANCE DEBT)
**File:** `src/App.jsx`  
**Problem:** `"Alexis"`, `"Stacey"`, `"Curtis"` are hardcoded throughout component logic. When drivers change, bugs are hard to find.

**Fix:** Add special flags to driver objects in `src/config/crews.js`:
```js
// In ALL_DRIVERS array:
{ name: "Alexis",  crew: "DUMP", start: "08:00", specialLogic: "SHORT_DAY",  fixedBP: true  }
{ name: "Stacey",  crew: "507",  start: "XX:XX", specialLogic: null,          fixedBP: true  }
{ name: "Curtis",  crew: "DUMP", start: "XX:XX", specialLogic: "OFFICE_MODE", fixedBP: false }
```
Then in `App.jsx`, reference `driver.specialLogic` and `driver.fixedBP` instead of `name === "Alexis"`.

---

## 🚀 FEATURES TO BUILD

### FEATURE 1: PWA (Progressive Web App) — HIGHEST PRIORITY
Lets Shane install the app on his phone and dispatch truck tablet. Works offline.

**Install:**
```bash
npm install vite-plugin-pwa --save-dev
```

**`vite.config.js`:**
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'SRM Dispatch',
        short_name: 'SRM',
        description: 'SRM Concrete North Alabama — Daily Dispatch Tool',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [{
          urlPattern: /^https:\/\/fonts\./,
          handler: 'CacheFirst'
        }]
      }
    })
  ]
})
```

**Create icons:** `public/icon-192.png` and `public/icon-512.png`  
Simple dark background + "SRM" text is enough.

---

### FEATURE 2: URL State Persistence
Encode key state into URL params so dispatch config survives refresh and can be shared.

**Add to App.jsx:**
```jsx
// On mount — read from URL
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('tf') === '1') setTf(true)
  if (params.get('mh') === '1') setMhDay(true)
  if (params.get('swap') === '1') setSwap519(true)
  if (params.get('curtis') === '1') setCurtisOffice(true)
  const downParam = params.get('down')
  if (downParam) setDown(new Set(downParam.split(',')))
}, [])

// On state change — write to URL
useEffect(() => {
  const params = new URLSearchParams()
  if (tf) params.set('tf', '1')
  if (mhDay) params.set('mh', '1')
  if (swap519) params.set('swap', '1')
  if (curtisOffice) params.set('curtis', '1')
  if (down.size) params.set('down', [...down].join(','))
  const query = params.toString()
  window.history.replaceState({}, '', query ? `?${query}` : window.location.pathname)
}, [tf, mhDay, swap519, curtisOffice, down])
```

---

### FEATURE 3: ShaneBrain Webhook Integration
When a plant is marked DOWN, POST to N8N on Pulsar0100 → logs to Weaviate.  
**This is the bridge between srm-dispatch and shanebrain-core — API only, no code sharing.**

```jsx
// In toggleDown() — after updating state:
async function logAudibleToShaneBrain(code, isDown) {
  try {
    await fetch('http://192.168.100.1:5678/webhook/dispatch-audible', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plant: code,
        status: isDown ? 'DOWN' : 'RESTORED',
        timestamp: new Date().toISOString(),
        date: DATE_STR,
        sub: subMap[code] || null
      })
    })
  } catch {
    // Silent fail — dispatch tool works without ShaneBrain
  }
}
```

**N8N webhook on Pulsar0100** (`192.168.100.1:5678`) receives this and stores to Weaviate `CrisisLog` class.  
Set up N8N flow separately — srm-dispatch never depends on it being alive.

---

### FEATURE 4: Midnight Auto-Refresh
Part of BUG 1 fix. After fixing `TODAY` to use state, add this effect to auto-refresh the date + recalculate BP group at midnight without requiring page reload.

(Code already shown in BUG 1 fix above.)

---

### FEATURE 5: Offline Indicator
Show a banner when the network is down so Shane knows routes came from cache.

```jsx
const [isOnline, setIsOnline] = useState(navigator.onLine)

useEffect(() => {
  const on  = () => setIsOnline(true)
  const off = () => setIsOnline(false)
  window.addEventListener('online', on)
  window.addEventListener('offline', off)
  return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
}, [])

// In header JSX:
{!isOnline && (
  <div style={{ background:"#1a0808", border:"1px solid #FF5252", color:"#FF5252",
    padding:"4px 16px", fontSize:"9px", letterSpacing:"2px", textAlign:"center" }}>
    ⚠️ OFFLINE — SHOWING CACHED ROUTES
  </div>
)}
```

---

## 🔧 DEV COMMANDS

```bash
# Clone
git clone https://github.com/thebardchat/srm-dispatch.git
cd srm-dispatch

# Install
npm install

# Dev server
npm run dev
# Opens at http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🚢 DEPLOYMENT

### Option A: GitHub Pages (Recommended — Free)
```bash
npm install gh-pages --save-dev
```

**Add to `package.json`:**
```json
"homepage": "https://thebardchat.github.io/srm-dispatch",
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}
```

```bash
npm run deploy
```

App lives at: `https://thebardchat.github.io/srm-dispatch`  
Shane bookmarks this on his phone → installs as PWA.

### Option B: Cloudflare Pages (Better performance, still free)
1. Connect repo at `https://dash.cloudflare.com`
2. Build command: `npm run build`
3. Build output: `dist`
4. Auto-deploys on every push to `main`

---

## 📋 IMPLEMENTATION ORDER

Work through these in order. Each one is independent — commit after each.

- [ ] **1. Fix BUG 1** — Replace module-level `TODAY` with `useState` + midnight refresh `useEffect`
- [ ] **2. Fix BUG 2** — Add clipboard fallback (`execCommand` for HTTP)
- [ ] **3. Fix BUG 3** — Move `Alexis`/`Stacey`/`Curtis` special logic to `crews.js` config flags
- [ ] **4. FEATURE 2** — URL state persistence (survives refresh, shareable)
- [ ] **5. FEATURE 1** — PWA setup (`vite-plugin-pwa`, icons, manifest)
- [ ] **6. FEATURE 5** — Offline banner
- [ ] **7. FEATURE 3** — ShaneBrain webhook (fire-and-forget, silent fail)
- [ ] **8. Deploy** — GitHub Pages or Cloudflare Pages

---

## 🚫 DO NOT

- Do NOT add a backend/server to this project — it's intentionally static
- Do NOT add a database — state lives in the URL and config files
- Do NOT use localStorage or sessionStorage — not supported in this environment
- Do NOT add authentication — internal tool, LAN/VPN access is security enough
- Do NOT bloat dependencies — current stack (React + Vite) is the whole point
- Do NOT rename or move this repo — it stays at `thebardchat/srm-dispatch`
- Do NOT merge into shanebrain-core — these are separate concerns

---

## 🔗 ECOSYSTEM POSITION

```
shanebrain-core (Pulsar0100 / Pi5)
    └── N8N webhook listener at :5678
            ↑
            │ POST (fire-and-forget, optional)
            │
    srm-dispatch (GitHub / PWA)
    Static React app — no server dependency
```

srm-dispatch is a **leaf node** in the ShaneBrain ecosystem.  
It sends data out (optional webhook) but never depends on ShaneBrain being alive.  
Dispatch always works, connected or not.

---

## 👷 CONTEXT FOR CLAUDE CODE

- Shane is the sole developer — blue-collar dispatcher who code
- Real operational tool — bugs affect 18 real drivers starting at 06:00
- ADHD workflow — short focused commits, one feature at a time
- Monorepo style preferred — keep everything in `/src` unless there's a strong reason not to
- No TypeScript — plain JavaScript is correct for this project
- Inline styles throughout App.jsx are intentional — don't refactor to CSS modules unless asked
- The dark courier-font terminal aesthetic is intentional — do not change it
- Test by running `npm run dev` and checking routes look correct for today's date and BP group

---

*SRM Dispatch // Hazel Green AL // thebardchat/srm-dispatch*  
*"File structure first. Action over theory."*
