import { useState, useEffect, useCallback, Fragment } from "react"
import { ALL_DRIVERS, CREW_TABS, BP_GROUPS } from './config/crew.js'
import { ALL_PLANTS, SUBS } from './config/plants.js'
import { getCycleDay, getBPGroup, getBPDrivers, driverBPDay, getBPCalendar, isTueFri } from './utils/rotation.js'
import { buildShorthand } from './utils/shorthand.js'
import { addMinutes } from './config/distances.js'

/* ═══════════════════════════════════════════════════════════════
   Anthropic-Inspired Design System
   Warm earth tones, clean typography, soft depth
   ═══════════════════════════════════════════════════════════════ */
const T = {
  bg:       '#161311',
  surface:  '#1E1A17',
  raised:   '#262220',
  hover:    '#2E2A26',
  border:   '#302B27',
  divider:  '#252119',

  text:     '#EDEBE8',
  text2:    '#B0AAA2',
  text3:    '#7A746E',
  text4:    '#4A4541',

  brand:    '#D4745F',
  brandBg:  'rgba(212,116,95,0.10)',
  brandBd:  'rgba(212,116,95,0.25)',

  amber:    '#D4A03C',
  green:    '#5BA66E',
  red:      '#D45555',
  blue:     '#5B9BC7',

  c507:     '#6BAED6',
  c519:     '#6BBF6B',
  c506:     '#B794D6',
  cBP:      '#D4915F',
  cDump:    '#A8A29E',

  font:     'Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  mono:     '"SF Mono","Fira Code",Menlo,Consolas,monospace',
  r:        '12px',
  rSm:      '8px',
  rXs:      '4px',
  shadow:   '0 2px 8px rgba(0,0,0,0.3),0 0 0 1px rgba(255,255,255,0.02)',
  shadowLg: '0 4px 16px rgba(0,0,0,0.4)',
}

const TAB_CLR  = { ALL:T.brand, "519":T.c519, "507":T.c507, "506":T.c506, BRIDGEPORT:T.cBP, DUMP:T.cDump }
const GRP_CLR  = { A:T.cBP, B:T.amber, C:T.c519 }
const CREW_CLR = { "507":T.c507, "519":T.c519, "506":T.c506, "516":T.cBP, DUMP:T.cDump, BP:T.cBP }

const DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]

/* ── Helpers ── */
function crewMatch(driver, tab, bpDrivers) {
  if (tab === "ALL")         return true
  if (tab === "DUMP")        return driver.crew === "DUMP"
  if (tab === "BRIDGEPORT")  return bpDrivers.includes(driver.name) || driver.fixedBP
  if (tab === "507")         return driver.crew === "507" || driver.name === "Stacey"
  if (tab === "519")         return driver.crew === "519"
  if (tab === "506")         return driver.crew === "506"
  return false
}

function isActualToday(d) {
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

function getDriverColor(driver) {
  return CREW_CLR[driver.crew] || T.text2
}

/* ═══════════════════════════════════════════════════════════════
   Route Step Visualization — parses "→" separated route text
   into color-coded pills for instant visual scanning
   ═══════════════════════════════════════════════════════════════ */
function RouteSteps({ text, driverClr }) {
  const colonIdx = text.indexOf(':')
  if (colonIdx === -1) return <span style={{ color:T.text2, fontFamily:T.mono, fontSize:'11px' }}>{text}</span>

  const rawSteps = text.substring(colonIdx + 1).trim().split('→')

  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:'3px 2px', alignItems:'center' }}>
      {rawSteps.map((raw, i) => {
        const s = raw.trim()
        if (!s) return null
        let fg = driverClr, bg = T.raised
        if (/^Scrap/i.test(s))       { fg='#E87A7A'; bg='rgba(232,122,122,0.08)' }
        else if (s.includes('\u{1F4DE}'))  { fg=T.brand; bg=T.brandBg }
        else if (s.includes('\u{23F0}'))   { fg=T.amber; bg='rgba(212,160,60,0.12)' }
        else if (/POD/i.test(s))     { fg='#D4A03C'; bg='rgba(212,160,60,0.07)' }
        else if (/BP|1\/4/i.test(s)) { fg=T.cBP; bg='rgba(212,145,95,0.08)' }
        else if (/home$/i.test(s))   { fg=T.green; bg='rgba(91,166,110,0.08)' }
        else if (/block/i.test(s))   { fg=T.text2; bg=T.surface }
        else if (/PRELOAD/i.test(s)) { fg=T.blue; bg='rgba(91,155,199,0.08)' }

        return (
          <Fragment key={i}>
            {i > 0 && <span style={{ color:T.text4, fontSize:'8px', margin:'0 1px', userSelect:'none' }}>{'\u2192'}</span>}
            <span style={{
              display:'inline-block', padding:'2px 7px', borderRadius:T.rXs,
              fontSize:'10.5px', fontFamily:T.mono, lineHeight:'1.5',
              color:fg, background:bg,
              border: s.includes('\u{1F4DE}') ? `1px solid ${T.brandBd}` : '1px solid transparent',
            }}>{s}</span>
          </Fragment>
        )
      })}
    </div>
  )
}

/* ── Reusable Components ── */
function Pill({ label, active, color, onClick, small }) {
  return (
    <button onClick={onClick} style={{
      background: active ? `${color}15` : 'transparent',
      border: `1px solid ${active ? `${color}44` : T.border}`,
      color: active ? color : T.text3,
      padding: small ? '4px 10px' : '6px 14px',
      fontSize: small ? '9px' : '10px',
      letterSpacing: '0.5px',
      fontFamily: T.font, fontWeight: active ? 600 : 400,
      borderRadius: '99px', transition: 'all 0.15s ease',
    }}>{label}</button>
  )
}

function Badge({ label, color }) {
  return (
    <span style={{
      fontSize:'8px', fontFamily:T.font, fontWeight:600,
      background:`${color}15`, border:`1px solid ${color}30`, color,
      padding:'2px 8px', borderRadius:'99px', letterSpacing:'0.3px',
      whiteSpace:'nowrap',
    }}>{label}</span>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Main Application
   ═══════════════════════════════════════════════════════════════ */
export default function App() {
  /* ── Date State ── */
  const [today, setToday] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const dp = params.get('date')
    if (dp) { const [y,m,d] = dp.split('-').map(Number); return new Date(y, m-1, d) }
    return new Date()
  })

  useEffect(() => {
    if (!isActualToday(today)) return
    const now = new Date()
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const timer = setTimeout(() => setToday(new Date()), midnight - now)
    return () => clearTimeout(timer)
  }, [today])

  function navigateDay(dir) {
    setToday(prev => {
      const next = new Date(prev)
      next.setDate(next.getDate() + dir)
      while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + dir)
      return next
    })
  }

  /* ── Derived Date Values ── */
  const DAY_STR  = DAYS[today.getDay()].toUpperCase()
  const DATE_STR = `${DAY_STR} ${MONTHS[today.getMonth()]} ${today.getDate()}`
  const cycleDay = getCycleDay(today)
  const BP_TODAY = getBPGroup(cycleDay)
  const BP_DRIVERS_TODAY = getBPDrivers(cycleDay)
  const viewingToday = isActualToday(today)

  /* ── Toggle State ── */
  const [tf,           setTf]           = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('tf') === '1' ? true : isTueFri(new Date())
  })
  const [mhDay,        setMhDay]        = useState(() => new URLSearchParams(window.location.search).get('mh') === '1')
  const [swap519,      setSwap519]      = useState(() => new URLSearchParams(window.location.search).get('swap') === '1')
  const [curtisOffice, setCurtisOffice]  = useState(() => new URLSearchParams(window.location.search).get('curtis') === '1')
  const [down,         setDown]         = useState(() => {
    const d = new URLSearchParams(window.location.search).get('down')
    return d ? new Set(d.split(',')) : new Set()
  })
  const [subOverride,  setSubOverride]  = useState({})
  const [copied,       setCopied]       = useState(null)
  const [crew,         setCrew]         = useState("ALL")
  const [view,         setView]         = useState("ROUTES")

  /* ── Start Time Overrides ── */
  const [startOverrides, setStartOverrides] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const sp = params.get('starts')
    if (!sp) return {}
    const obj = {}
    sp.split(',').forEach(pair => {
      const [name, time] = pair.split(':')
      if (name && time) obj[name] = time.substring(0,2) + ':' + time.substring(2)
    })
    return obj
  })

  function getStart(name, defaultStart) {
    return startOverrides[name] || defaultStart
  }

  function adjustStart(name, defaultStart, delta) {
    const current = getStart(name, defaultStart)
    const next = addMinutes(current, delta)
    setStartOverrides(prev => {
      if (next === defaultStart) { const s = {...prev}; delete s[name]; return s }
      return {...prev, [name]: next}
    })
  }

  useEffect(() => {
    setTf(isTueFri(today))
    setStartOverrides({})
  }, [today])

  /* ── Online Status ── */
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on  = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  /* ── URL State Persistence ── */
  useEffect(() => {
    const params = new URLSearchParams()
    if (tf) params.set('tf', '1')
    if (mhDay) params.set('mh', '1')
    if (swap519) params.set('swap', '1')
    if (curtisOffice) params.set('curtis', '1')
    if (down.size) params.set('down', [...down].join(','))
    if (!viewingToday) {
      const y = today.getFullYear()
      const m = String(today.getMonth()+1).padStart(2,'0')
      const d = String(today.getDate()).padStart(2,'0')
      params.set('date', `${y}-${m}-${d}`)
    }
    if (Object.keys(startOverrides).length) {
      params.set('starts', Object.entries(startOverrides).map(([n,t]) => `${n}:${t.replace(':','')}`).join(','))
    }
    const query = params.toString()
    window.history.replaceState({}, '', query ? `?${query}` : window.location.pathname)
  }, [tf, mhDay, swap519, curtisOffice, down, today, viewingToday, startOverrides])

  /* ── Derived State ── */
  const subMap = {}
  down.forEach(code => { subMap[code] = subOverride[code] || (SUBS[code]?.[0] || "") })

  const anyAudible = down.size > 0 || curtisOffice || mhDay || swap519
  const visible    = ALL_DRIVERS.filter(d => crewMatch(d, crew, BP_DRIVERS_TODAY))
  const tabClr     = TAB_CLR[crew] || T.brand

  function toggleDown(code) {
    setDown(prev => {
      const next = new Set(prev)
      if (next.has(code)) { next.delete(code); setSubOverride(p => { const s={...p}; delete s[code]; return s }) }
      else next.add(code)
      return next
    })
  }

  const copyText = useCallback(function copyText(text, key) {
    let final = text
    const alexisDriver = ALL_DRIVERS.find(d => d.shortDay)
    const alexisName = alexisDriver ? alexisDriver.name : "Alexis"
    if (key === alexisName && down.has("ALEXIS_SHORT")) {
      final = text.replace("/ R2:", "\n-- SHORT DAY -- After R1: 907 scrap block then 516 (skip R2 if short on time)\n\nR2 if time allows: ")
    }

    function fallbackCopy(t, k) {
      const el = document.createElement("textarea")
      el.value = t; el.style.position = "fixed"; el.style.opacity = "0"
      document.body.appendChild(el); el.focus(); el.select()
      try { document.execCommand("copy"); setCopied(k); setTimeout(() => setCopied(null), 2500) }
      catch { alert("Copy failed") }
      document.body.removeChild(el)
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(final)
        .then(() => { setCopied(key); setTimeout(() => setCopied(null), 2500) })
        .catch(() => fallbackCopy(final, key))
    } else { fallbackCopy(final, key) }
  }, [down])

  const shArgs = { tf, mhDay, down, subMap, curtisOffice, swap519, cycleDay, startOverrides }

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily:T.font, background:T.bg, minHeight:'100vh', color:T.text }}>

      {/* ── Banners ── */}
      {!isOnline && (
        <div style={{ background:'rgba(212,85,85,0.08)', borderBottom:`1px solid ${T.red}33`,
          color:T.red, padding:'8px 20px', fontSize:'11px', fontWeight:500, textAlign:'center', letterSpacing:'0.5px' }}>
          OFFLINE — SHOWING CACHED ROUTES
        </div>
      )}
      {!viewingToday && (
        <div style={{ background:T.brandBg, borderBottom:`1px solid ${T.brandBd}`,
          padding:'8px 20px', fontSize:'11px', textAlign:'center',
          display:'flex', justifyContent:'center', alignItems:'center', gap:'16px' }}>
          <span style={{ color:T.brand, fontWeight:500, letterSpacing:'0.5px' }}>VIEWING {DATE_STR}</span>
          <button onClick={() => setToday(new Date())} style={{
            background:T.brandBg, border:`1px solid ${T.brandBd}`, color:T.brand,
            padding:'3px 14px', fontSize:'10px', borderRadius:'99px', fontFamily:T.font, fontWeight:500,
          }}>BACK TO TODAY</button>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{
        background:`linear-gradient(180deg, ${T.surface} 0%, ${T.bg} 100%)`,
        borderBottom:`1px solid ${T.border}`, padding:'16px 20px 14px',
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'12px' }}>
          {/* Left — Brand + Date */}
          <div>
            <div style={{ fontSize:'10px', fontWeight:600, letterSpacing:'3px', color:T.brand, marginBottom:'8px' }}>
              SRM DISPATCH
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'6px' }}>
              <button onClick={() => navigateDay(-1)} style={{
                background:'transparent', border:`1px solid ${T.border}`, color:T.text3,
                width:'30px', height:'30px', borderRadius:'50%', fontSize:'12px', fontFamily:T.font,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>{'\u25C0'}</button>
              <div style={{ fontSize:'22px', fontWeight:700, color:T.text, letterSpacing:'1px' }}>{DATE_STR}</div>
              <button onClick={() => navigateDay(1)} style={{
                background:'transparent', border:`1px solid ${T.border}`, color:T.text3,
                width:'30px', height:'30px', borderRadius:'50%', fontSize:'12px', fontFamily:T.font,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>{'\u25B6'}</button>
            </div>
            <div style={{ fontSize:'11px', color:T.text3, display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
              <Badge label={`GROUP ${BP_TODAY}`} color={GRP_CLR[BP_TODAY]} />
              <span>CYCLE {cycleDay+1}/3</span>
              <span style={{ color:T.text4 }}>{BP_GROUPS[BP_TODAY].join(", ")}</span>
            </div>
            {anyAudible && (
              <div style={{ fontSize:'10px', color:T.red, marginTop:'6px', fontWeight:500 }}>
                {[...down].map(d=>`${d} DOWN`).concat([
                  mhDay?"MH DAY":"", swap519?"519 SWAP":"", curtisOffice?"CURTIS OFFICE":""
                ]).filter(Boolean).join(" \u00b7 ")}
              </div>
            )}
          </div>

          {/* Right — Controls */}
          <div style={{ display:'flex', flexDirection:'column', gap:'8px', alignItems:'flex-end' }}>
            {/* Day Type Toggle */}
            <div style={{
              display:'inline-flex', background:T.surface, borderRadius:'99px',
              border:`1px solid ${T.border}`, overflow:'hidden',
            }}>
              {[["std","MON/WED/THU"],["tf","TUE/FRI"]].map(([m,lbl]) => {
                const active = (m==="tf"&&tf)||(m==="std"&&!tf)
                return (
                  <button key={m} onClick={() => setTf(m==="tf")} style={{
                    background: active ? T.brand : 'transparent',
                    border:'none', color: active ? '#fff' : T.text3,
                    padding:'5px 16px', fontSize:'10px', letterSpacing:'0.5px',
                    fontFamily:T.font, fontWeight: active ? 600 : 400,
                    borderRadius:'99px', transition:'all 0.15s ease',
                  }}>{lbl}</button>
                )
              })}
            </div>
            {/* Action Buttons */}
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', justifyContent:'flex-end' }}>
              <Pill label="MH DAY"  active={mhDay}    color={T.cBP}   onClick={() => setMhDay(p=>!p)}   small />
              <Pill label="519 SWAP" active={swap519}  color={T.c519}  onClick={() => setSwap519(p=>!p)} small />
              <Pill label="CURTIS OFFICE" active={curtisOffice} color={T.amber} onClick={() => setCurtisOffice(p=>!p)} small />
              <Pill label={`AUDIBLES${down.size?` (${down.size})`:""}`}
                    active={view==="AUDIBLES"} color={T.red} onClick={() => setView(v=>v==="AUDIBLES"?"ROUTES":"AUDIBLES")} small />
              <Pill label="BP CALENDAR"
                    active={view==="CALENDAR"} color={T.blue} onClick={() => setView(v=>v==="CALENDAR"?"ROUTES":"CALENDAR")} small />
            </div>
          </div>
        </div>
      </div>

      {/* ── Crew Tabs ── */}
      <div style={{
        background:T.surface, borderBottom:`1px solid ${T.border}`,
        padding:'8px 20px', display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center',
      }}>
        {CREW_TABS.map(t => {
          const col = TAB_CLR[t]
          const active = crew === t
          return (
            <button key={t} onClick={() => { setCrew(t); setView("ROUTES") }} style={{
              background: active ? `${col}15` : 'transparent',
              border: 'none', borderBottom: active ? `2px solid ${col}` : '2px solid transparent',
              color: active ? col : T.text3,
              padding:'6px 16px 8px', fontSize:'10px', letterSpacing:'0.5px',
              fontFamily:T.font, fontWeight: active ? 600 : 400,
              transition:'all 0.15s ease',
            }}>
              {t==="BRIDGEPORT"?`BP \u2014 GROUP ${BP_TODAY}`:t}
            </button>
          )
        })}
        <span style={{ marginLeft:'auto', fontSize:'9px', color:T.text4 }}>TAP CARD TO COPY</span>
      </div>

      {/* ═══ AUDIBLES PANEL ═══ */}
      {view==="AUDIBLES" && (
        <div style={{ padding:'20px', borderBottom:`1px solid ${T.border}`, background:T.surface }}>
          <div style={{ fontSize:'10px', color:T.text3, letterSpacing:'2px', marginBottom:'16px', fontWeight:500 }}>
            MARK PLANTS DOWN — ROUTES AUTO-UPDATE
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'8px', marginBottom:'16px' }}>
            {ALL_PLANTS.map(({ code, name }) => {
              const isDown = down.has(code)
              return (
                <div key={code}>
                  <button onClick={() => toggleDown(code)} style={{
                    width:'100%', background: isDown ? 'rgba(212,85,85,0.06)' : T.raised,
                    border:`1px solid ${isDown ? `${T.red}44` : T.border}`,
                    color: isDown ? T.red : T.text2,
                    padding:'10px 12px', fontSize:'11px', fontFamily:T.font,
                    textAlign:'left', fontWeight: isDown ? 600 : 400,
                    borderRadius: isDown && SUBS[code]?.length ? `${T.rSm} ${T.rSm} 0 0` : T.rSm,
                  }}>
                    <span style={{ marginRight:'6px' }}>{isDown ? '\u{1F534}' : '\u26AA'}</span>{name}
                  </button>
                  {isDown && SUBS[code]?.length > 0 && (
                    <div style={{
                      background:'rgba(212,85,85,0.03)', border:`1px solid ${T.red}22`, borderTop:'none',
                      padding:'8px 10px', display:'flex', gap:'6px', flexWrap:'wrap',
                      borderRadius:`0 0 ${T.rSm} ${T.rSm}`,
                    }}>
                      {SUBS[code].map(s => (
                        <button key={s} onClick={() => setSubOverride(p=>({...p,[code]:s}))} style={{
                          background: subMap[code]===s ? `${T.amber}15` : 'transparent',
                          border:`1px solid ${subMap[code]===s ? `${T.amber}44` : T.border}`,
                          color: subMap[code]===s ? T.amber : T.text3,
                          padding:'3px 10px', fontSize:'10px', fontFamily:T.font, borderRadius:'99px',
                        }}>{'\u2192'}{s}</button>
                      ))}
                    </div>
                  )}
                  {isDown && !SUBS[code]?.length && code !== "ALEXIS_SHORT" && (
                    <div style={{
                      background:'rgba(212,85,85,0.03)', border:`1px solid ${T.red}22`, borderTop:'none',
                      padding:'6px 10px', fontSize:'10px', color:T.red,
                      borderRadius:`0 0 ${T.rSm} ${T.rSm}`,
                    }}>Call Shane for sub</div>
                  )}
                </div>
              )
            })}
          </div>
          {down.size > 0 && (
            <div style={{ background:T.raised, border:`1px solid ${T.red}22`, borderRadius:T.rSm, padding:'14px 16px' }}>
              <div style={{ fontSize:'10px', color:T.red, letterSpacing:'1px', marginBottom:'8px', fontWeight:600 }}>AFFECTED DRIVERS</div>
              {[...down].map(code => {
                const affected = ALL_DRIVERS.filter(d => buildShorthand(d.name, shArgs).includes(code))
                return (
                  <div key={code} style={{ marginBottom:'4px', fontSize:'11px', color:T.text2, display:'flex', gap:'8px', alignItems:'baseline' }}>
                    <span style={{ color:T.red, fontWeight:600 }}>{code} DOWN{subMap[code]?` \u2192 ${subMap[code]}`:""}</span>
                    {!subMap[code] && <span style={{ color:T.amber, fontSize:'10px' }}>NO SUB</span>}
                    {affected.length > 0 && <span style={{ color:T.text3 }}>{affected.map(d=>d.name).join(", ")}</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ BP CALENDAR ═══ */}
      {view==="CALENDAR" && (() => {
        const cal = getBPCalendar(today)
        const weeks = {}
        cal.forEach(d => { if (!weeks[d.weekNum]) weeks[d.weekNum]=[]; weeks[d.weekNum].push(d) })
        return (
          <div style={{ padding:'20px' }}>
            <div style={{ fontSize:'10px', color:T.text3, letterSpacing:'2px', marginBottom:'16px', fontWeight:500 }}>
              BP ROTATION — 3-GROUP CONTINUOUS WEEKDAY CYCLE
            </div>
            <div style={{ display:'flex', gap:'16px', marginBottom:'20px', flexWrap:'wrap' }}>
              {["A","B","C"].map(g => (
                <div key={g} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:GRP_CLR[g] }}/>
                  <span style={{ fontSize:'11px', color:GRP_CLR[g] }}>GROUP {g}: {BP_GROUPS[g].join(", ")}</span>
                </div>
              ))}
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:T.c507 }}/>
                <span style={{ fontSize:'11px', color:T.c507 }}>STACEY + ALEXIS: EVERY DAY</span>
              </div>
            </div>

            {Object.entries(weeks).map(([wk, days]) => (
              <div key={wk} style={{ marginBottom:'20px' }}>
                <div style={{ fontSize:'10px', color:T.text4, letterSpacing:'2px', marginBottom:'8px', fontWeight:500 }}>
                  WEEK {wk}{parseInt(wk)===1?" (CURRENT)":""}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:`repeat(${days.length},1fr)`, gap:'6px' }}>
                  {days.map((d,i) => {
                    const gc = GRP_CLR[d.grp]
                    return (
                      <div key={i} style={{
                        background: d.isToday ? `${gc}10` : T.surface,
                        border:`1px solid ${d.isToday ? `${gc}44` : T.border}`,
                        borderRadius:T.rSm, padding:'12px 10px', textAlign:'center',
                      }}>
                        <div style={{ fontSize:'10px', color: d.isToday ? gc : T.text3, marginBottom:'4px', fontWeight:500 }}>{d.day.toUpperCase()}</div>
                        <div style={{ fontSize:'11px', color:T.text3, marginBottom:'8px' }}>{d.date.getMonth()+1}/{d.date.getDate()}</div>
                        <div style={{ fontSize:'16px', fontWeight:700, color:gc, marginBottom:'6px' }}>GRP {d.grp}</div>
                        <div style={{ fontSize:'9px', lineHeight:'1.7' }}>
                          {BP_GROUPS[d.grp].map(n => <div key={n} style={{ color: d.isToday ? gc : T.text3 }}>{n}</div>)}
                          <div style={{ color:T.c507, marginTop:'3px' }}>Stacey</div>
                          <div style={{ color:T.cBP }}>Alexis</div>
                        </div>
                        {d.isToday && <div style={{ fontSize:'8px', color:gc, marginTop:'6px', fontWeight:700, letterSpacing:'1px' }}>TODAY</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:T.rSm, padding:'16px' }}>
              <div style={{ fontSize:'10px', color:T.text3, letterSpacing:'1px', marginBottom:'8px', fontWeight:500 }}>ROTATION RULES</div>
              <div style={{ fontSize:'11px', color:T.text3, lineHeight:'2' }}>
                5-day week, 3 groups — pattern shifts every week, no two Mondays start the same group<br/>
                Holiday = skip that day, chain continues — no reset<br/>
                Stacey + Alexis anchor BP every day regardless of group<br/>
                No crew hits BP back-to-back days
              </div>
            </div>
          </div>
        )
      })()}

      {/* ═══ DRIVER CARDS ═══ */}
      {view==="ROUTES" && (
        <div style={{ padding:'16px 20px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:'12px' }}>
          {visible.map(driver => {
            const { name } = driver
            const driverClr   = getDriverColor(driver)
            const onBP        = BP_DRIVERS_TODAY.includes(name)
            const isCurtisOff = name === "Curtis" && curtisOffice
            const effectiveStart = getStart(name, driver.start)
            const isOverridden = startOverrides[name] !== undefined
            const shortText   = buildShorthand(name, shArgs)
            const isCopied    = copied === name
            const hasAudible  = [...down].some(d => shortText.includes(d)) || isCurtisOff
            const cardColor   = hasAudible ? T.red : onBP ? T.cBP : driverClr
            const bpInfo      = driverBPDay(name, cycleDay)

            return (
              <div key={name} onClick={() => copyText(shortText, name)} style={{
                background: T.surface,
                border:`1px solid ${T.border}`,
                borderLeft:`3px solid ${cardColor}`,
                borderRadius: T.r,
                boxShadow: T.shadow,
                display:'flex', flexDirection:'column',
                cursor:'pointer', transition:'all 0.15s ease',
                position:'relative', overflow:'hidden',
              }}>
                {/* Success overlay */}
                {isCopied && (
                  <div style={{
                    position:'absolute', inset:0, background:'rgba(91,166,110,0.06)',
                    borderRadius:T.r, pointerEvents:'none', zIndex:1,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <span style={{ background:T.green, color:'#fff', padding:'4px 16px',
                      borderRadius:'99px', fontSize:'11px', fontWeight:600, letterSpacing:'0.5px' }}>COPIED</span>
                  </div>
                )}

                {/* Header */}
                <div style={{
                  padding:'12px 14px 8px',
                  borderBottom:`1px solid ${T.divider}`,
                  display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'4px' }}>
                      <span style={{
                        fontSize:'15px', fontWeight:700, letterSpacing:'0.5px',
                        color: isCurtisOff ? T.amber : hasAudible ? T.red : T.text,
                      }}>{name}</span>
                      {onBP && <Badge label="BP TODAY" color={T.cBP} />}
                      {driver.fixedBP && <Badge label="FIXED BP" color={T.c507} />}
                      {driver.fixed && driver.crew !== "DUMP" && <Badge label="FIXED ROUTE" color={T.text3} />}
                      {driver.shortDay && <Badge label={`${effectiveStart} \u00b7 2 ROUNDS`} color={T.cBP} />}
                      {isCurtisOff && <Badge label="IN OFFICE" color={T.amber} />}
                    </div>
                    <div style={{ fontSize:'9px', color:T.text3, display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center' }}>
                      <span style={{ color:cardColor, fontWeight:500 }}>{onBP?"BRIDGEPORT":driver.crew} CREW</span>

                      {/* Start Time Stepper */}
                      <span style={{
                        display:'inline-flex', alignItems:'center', gap:'2px',
                        border:`1px solid ${isOverridden ? T.amber+'55' : T.border}`,
                        padding:'1px 6px', borderRadius:'99px',
                        background: isOverridden ? `${T.amber}10` : 'transparent',
                      }}>
                        <button onClick={(e) => { e.stopPropagation(); adjustStart(name, driver.start, -15) }}
                          style={{ background:'none', border:'none', color:cardColor, fontSize:'11px', padding:'0 3px', fontFamily:T.font }}>-</button>
                        <span style={{
                          color: isOverridden ? T.amber : T.text2,
                          fontWeight: isOverridden ? 600 : 400,
                          fontFamily:T.mono, fontSize:'10px', minWidth:'30px', textAlign:'center',
                        }}>{effectiveStart}</span>
                        <button onClick={(e) => { e.stopPropagation(); adjustStart(name, driver.start, 15) }}
                          style={{ background:'none', border:'none', color:cardColor, fontSize:'11px', padding:'0 3px', fontFamily:T.font }}>+</button>
                      </span>
                      {isOverridden && (
                        <button onClick={(e) => { e.stopPropagation(); setStartOverrides(p => { const s={...p}; delete s[name]; return s }) }}
                          style={{
                            background:'none', border:`1px solid ${T.text4}`, color:T.text4,
                            fontSize:'8px', padding:'1px 6px', borderRadius:'99px', fontFamily:T.font,
                          }}>RST</button>
                      )}
                      {bpInfo && !bpInfo.fixed && (() => {
                        const col = bpInfo.days===0 ? T.cBP : bpInfo.days===1 ? T.amber : T.text4
                        return <Badge label={bpInfo.days===0?"BP TODAY":bpInfo.days===1?"BP TOMORROW":`BP DAY ${bpInfo.cycleDay} (${bpInfo.groupLabel})`} color={col} />
                      })()}
                      {bpInfo?.fixed && <Badge label="BP EVERY DAY" color={T.cBP} />}
                    </div>
                  </div>
                </div>

                {/* Route Body */}
                <div style={{ padding:'10px 14px', flex:1 }}>
                  {driver.shortDay ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                      {shortText.split(" / ").map((line, i) => (
                        <div key={i} style={{
                          borderLeft:`2px solid ${i===0 ? T.cBP : T.c519}`,
                          paddingLeft:'10px',
                        }}>
                          <div style={{ fontSize:'9px', color:i===0?T.cBP:T.c519, fontWeight:600, marginBottom:'4px', letterSpacing:'0.5px' }}>
                            {i===0 ? 'ROUND 1' : 'ROUND 2'}
                          </div>
                          <RouteSteps text={line} driverClr={i===0?T.cBP:T.c519} />
                          {i===0 && down.has("ALEXIS_SHORT") && (
                            <div style={{ marginTop:'4px' }}>
                              <Badge label="SHORT DAY \u2014 907 scrap block \u2192 516" color={T.amber} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <RouteSteps text={shortText} driverClr={hasAudible ? T.red : cardColor} />
                  )}
                </div>

                {/* Footer */}
                <div style={{ padding:'8px 14px', borderTop:`1px solid ${T.divider}`,
                  display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'9px', color:T.text4 }}>
                    {isCopied ? '\u2713 Copied to clipboard' : 'Tap to copy route'}
                  </span>
                  <span style={{
                    fontSize:'8px', color: isCopied ? T.green : T.text4,
                    background: isCopied ? `${T.green}15` : 'transparent',
                    padding:'2px 8px', borderRadius:'99px',
                    border:`1px solid ${isCopied ? `${T.green}33` : 'transparent'}`,
                    fontWeight: isCopied ? 600 : 400, transition:'all 0.2s ease',
                  }}>{isCopied ? 'SENT' : 'COPY'}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{
        borderTop:`1px solid ${T.divider}`, padding:'12px 20px',
        background:T.surface, display:'flex', gap:'20px', flexWrap:'wrap',
        justifyContent:'space-between', alignItems:'center',
      }}>
        <span style={{ fontSize:'9px', color:T.text4, letterSpacing:'0.5px' }}>
          SRM DISPATCH \u00b7 SRM CONCRETE \u00b7 HAZEL GREEN AL
        </span>
        <span style={{ fontSize:'8px', color:T.text4 }}>
          MH=Mt. Hope \u00b7 RG=Rogers Group \u00b7 MM=Martin Marietta \u00b7 LQ=Lacey Spring \u00b7 BP=Bridgeport
        </span>
        <span style={{ fontSize:'8px', color:T.text4 }}>
          Powered by Claude \u00b7 thebardchat/srm-dispatch
        </span>
      </div>
    </div>
  )
}
