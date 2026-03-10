import { useState, useEffect, useCallback } from "react"
import { ALL_DRIVERS, CREW_TABS, CREW_COLORS, BP_GROUPS, FIXED_BP } from './config/crew.js'
import { ALL_PLANTS, SUBS } from './config/plants.js'
import { getCycleDay, getBPGroup, getBPDrivers, driverBPDay, getBPCalendar, isTueFri } from './utils/rotation.js'
import { buildShorthand } from './utils/shorthand.js'

const DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]
const GRP_COLOR = { A:"#FF7043", B:"#FFD700", C:"#A5D6A7" }

function crewMatch(driver, tab, bpDrivers) {
  if (tab === "ALL")         return true
  if (tab === "DUMP")        return driver.crew === "DUMP"
  if (tab === "BRIDGEPORT")  return bpDrivers.includes(driver.name) || driver.fixedBP
  if (tab === "507")         return driver.crew === "507" || driver.name === "Stacey"
  if (tab === "519")         return driver.crew === "519"
  if (tab === "506")         return driver.crew === "506"
  return false
}

export default function App() {
  // BUG 1 FIX: today is state, refreshes at midnight
  const [today, setToday] = useState(() => new Date())

  useEffect(() => {
    const now = new Date()
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const ms = midnight - now
    const timer = setTimeout(() => setToday(new Date()), ms)
    return () => clearTimeout(timer)
  }, [today])

  // Derived date values — recalculate when today changes
  const DAY_STR  = DAYS[today.getDay()].toUpperCase()
  const DATE_STR = `${DAY_STR} ${MONTHS[today.getMonth()]} ${today.getDate()}`
  const cycleDay = getCycleDay(today)
  const BP_TODAY = getBPGroup(cycleDay)
  const BP_DRIVERS_TODAY = getBPDrivers(cycleDay)

  // FEATURE 2: Read initial state from URL
  const [tf,           setTf]           = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('tf') === '1' ? true : isTueFri(new Date())
  })
  const [mhDay,        setMhDay]        = useState(() => new URLSearchParams(window.location.search).get('mh') === '1')
  const [swap519,      setSwap519]      = useState(() => new URLSearchParams(window.location.search).get('swap') === '1')
  const [curtisOffice, setCurtisOffice] = useState(() => new URLSearchParams(window.location.search).get('curtis') === '1')
  const [down,         setDown]         = useState(() => {
    const d = new URLSearchParams(window.location.search).get('down')
    return d ? new Set(d.split(',')) : new Set()
  })
  const [subOverride,  setSubOverride]  = useState({})
  const [copied,       setCopied]       = useState(null)
  const [crew,         setCrew]         = useState("ALL")
  const [view,         setView]         = useState("ROUTES")

  // FEATURE 5: Offline indicator
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on  = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  // FEATURE 2: Write state to URL on change
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

  const subMap = {}
  down.forEach(code => { subMap[code] = subOverride[code] || (SUBS[code]?.[0] || "") })

  const anyAudible = down.size > 0 || curtisOffice || mhDay || swap519
  const crewColor  = CREW_COLORS[crew] || "#FF6F00"
  const visible    = ALL_DRIVERS.filter(d => crewMatch(d, crew, BP_DRIVERS_TODAY))

  function toggleDown(code) {
    setDown(prev => {
      const next = new Set(prev)
      if (next.has(code)) { next.delete(code); setSubOverride(p => { const s={...p}; delete s[code]; return s }) }
      else next.add(code)
      return next
    })
  }

  // BUG 2 FIX: Clipboard fallback for HTTP
  const copyText = useCallback(function copyText(text, key) {
    let final = text
    const alexisDriver = ALL_DRIVERS.find(d => d.shortDay)
    const alexisName = alexisDriver ? alexisDriver.name : "Alexis"
    if (key === alexisName && down.has("ALEXIS_SHORT")) {
      final = text.replace("/ R2:", "\n⚡ SHORT DAY — After R1 → 907 scrap block → 516 (skip R2 if short on time)\n\nR2 if time allows: ")
    }

    function fallbackCopy(t, k) {
      const el = document.createElement("textarea")
      el.value = t
      el.style.position = "fixed"
      el.style.opacity = "0"
      document.body.appendChild(el)
      el.focus()
      el.select()
      try {
        document.execCommand("copy")
        setCopied(k)
        setTimeout(() => setCopied(null), 2500)
      } catch {
        alert("Copy failed — long press the route text to copy manually")
      }
      document.body.removeChild(el)
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(final)
        .then(() => { setCopied(key); setTimeout(() => setCopied(null), 2500) })
        .catch(() => fallbackCopy(final, key))
    } else {
      fallbackCopy(final, key)
    }
  }, [down])

  const shArgs = { tf, mhDay, down, subMap, curtisOffice, swap519, cycleDay }

  return (
    <div style={{ fontFamily:"'Courier New',Courier,monospace", background:"#0a0a0a", minHeight:"100vh", color:"#e0e0e0" }}>

      {/* ── OFFLINE BANNER ── */}
      {!isOnline && (
        <div style={{ background:"#1a0808", border:"1px solid #FF5252", color:"#FF5252",
          padding:"4px 16px", fontSize:"9px", letterSpacing:"2px", textAlign:"center" }}>
          OFFLINE — SHOWING CACHED ROUTES
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ background:"#111", borderBottom:`2px solid ${anyAudible?"#FF5252":crewColor}`, padding:"10px 16px" }}>
        <div style={{ fontSize:"9px", letterSpacing:"4px", color:anyAudible?"#FF5252":crewColor, marginBottom:"3px" }}>SRM DISPATCH / MASTER TOOL</div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"8px" }}>
          <div>
            <div style={{ fontSize:"18px", fontWeight:"bold", color:"#fff", letterSpacing:"2px" }}>ALL CREWS — {DATE_STR}</div>
            <div style={{ fontSize:"10px", color:"#555", marginTop:"2px" }}>
              BP GROUP {BP_TODAY} · CYCLE {cycleDay+1}/3 · {BP_GROUPS[BP_TODAY].join(", ")}
            </div>
            {anyAudible && (
              <div style={{ fontSize:"10px", color:"#FF5252", marginTop:"3px" }}>
                {[...down].map(d=>`${d} DOWN`).concat([
                  mhDay?"MH DAY":"",
                  swap519?"519 SWAP":"",
                  curtisOffice ? `${ALL_DRIVERS.find(d => d.officeMode)?.name || "Curtis"} OFFICE` : ""
                ]).filter(Boolean).join(" · ")}
              </div>
            )}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:"5px", alignItems:"flex-end" }}>
            <div style={{ display:"flex" }}>
              {[["std","MON/WED/THU"],["tf","TUE/FRI"]].map(([m,lbl]) => (
                <button key={m} onClick={() => setTf(m==="tf")}
                  style={{ background:((m==="tf"&&tf)||(m==="std"&&!tf))?"#1a1a00":"transparent",
                    border:`1px solid ${((m==="tf"&&tf)||(m==="std"&&!tf))?"#FF6F00":"#333"}`,
                    color:((m==="tf"&&tf)||(m==="std"&&!tf))?"#FF6F00":"#555",
                    padding:"4px 12px", fontSize:"9px", letterSpacing:"1px", cursor:"pointer", fontFamily:"inherit" }}>{lbl}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", justifyContent:"flex-end" }}>
              {[
                { key:"mh",  label:"MH DAY",        active:mhDay,        fn:()=>setMhDay(p=>!p),        ac:"#F48FB1" },
                { key:"519", label:"519 SWAP",       active:swap519,      fn:()=>setSwap519(p=>!p),      ac:"#A5D6A7" },
                { key:"cur", label:`${ALL_DRIVERS.find(d=>d.officeMode)?.name||"Curtis"} OFFICE`.toUpperCase(), active:curtisOffice, fn:()=>setCurtisOffice(p=>!p), ac:"#FFCC02" },
                { key:"aud", label:`AUDIBLES${down.size?` (${down.size})`:""}`,
                              active:view==="AUDIBLES", fn:()=>setView(v=>v==="AUDIBLES"?"ROUTES":"AUDIBLES"), ac:"#FF5252" },
                { key:"cal", label:"BP CALENDAR",    active:view==="CALENDAR", fn:()=>setView(v=>v==="CALENDAR"?"ROUTES":"CALENDAR"), ac:"#80DEEA" },
              ].map(({key,label,active,fn,ac}) => (
                <button key={key} onClick={fn}
                  style={{ background:active?`${ac}22`:"transparent", border:`1px solid ${active?ac:"#252525"}`,
                    color:active?ac:"#555", padding:"4px 10px", fontSize:"9px", letterSpacing:"1px",
                    cursor:"pointer", fontFamily:"inherit", fontWeight:active?"bold":"normal" }}>{label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CREW TABS ── */}
      <div style={{ background:"#111", borderBottom:"1px solid #1a1a1a", padding:"7px 16px", display:"flex", gap:"4px", flexWrap:"wrap" }}>
        {CREW_TABS.map(t => {
          const col = CREW_COLORS[t]
          return (
            <button key={t} onClick={() => { setCrew(t); setView("ROUTES") }}
              style={{ background:crew===t?`${col}22`:"transparent", border:`1px solid ${crew===t?col:"#252525"}`,
                color:crew===t?col:"#444", padding:"4px 14px", fontSize:"9px", letterSpacing:"1px",
                cursor:"pointer", fontFamily:"inherit", fontWeight:crew===t?"bold":"normal" }}>
              {t==="BRIDGEPORT"?`BP — GROUP ${BP_TODAY}`:t}
            </button>
          )
        })}
        <span style={{ marginLeft:"auto", fontSize:"9px", color:"#1e1e1e", alignSelf:"center" }}>TAP COPY → SEND</span>
      </div>

      {/* ── AUDIBLES PANEL ── */}
      {view==="AUDIBLES" && (
        <div style={{ padding:"14px 16px", borderBottom:"1px solid #1a1a1a", background:"#0d0d0d" }}>
          <div style={{ fontSize:"9px", color:"#444", letterSpacing:"3px", marginBottom:"12px" }}>MARK PLANTS DOWN — ROUTES AUTO-UPDATE</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:"6px", marginBottom:"12px" }}>
            {ALL_PLANTS.map(({ code, name }) => {
              const isDown = down.has(code)
              return (
                <div key={code}>
                  <button onClick={() => toggleDown(code)}
                    style={{ width:"100%", background:isDown?"#1a0808":"#0f0f0f",
                      border:`1px solid ${isDown?"#FF5252":"#252525"}`, color:isDown?"#FF5252":"#777",
                      padding:"7px 10px", fontSize:"10px", cursor:"pointer", fontFamily:"inherit",
                      textAlign:"left", fontWeight:isDown?"bold":"normal" }}>
                    {isDown?"🔴 ":"⚪ "}{name}
                  </button>
                  {isDown && SUBS[code]?.length > 0 && (
                    <div style={{ background:"#120808", border:"1px solid #FF525222", borderTop:"none", padding:"6px 8px", display:"flex", gap:"4px", flexWrap:"wrap" }}>
                      {SUBS[code].map(s => (
                        <button key={s} onClick={() => setSubOverride(p=>({...p,[code]:s}))}
                          style={{ background:subMap[code]===s?"#1a1a00":"transparent",
                            border:`1px solid ${subMap[code]===s?"#FFD700":"#333"}`,
                            color:subMap[code]===s?"#FFD700":"#555",
                            padding:"2px 8px", fontSize:"9px", cursor:"pointer", fontFamily:"inherit" }}>→{s}
                        </button>
                      ))}
                    </div>
                  )}
                  {isDown && !SUBS[code]?.length && (
                    <div style={{ background:"#120808", border:"1px solid #FF525222", borderTop:"none", padding:"5px 8px", fontSize:"9px", color:"#FF5252" }}>📞 Call Shane</div>
                  )}
                </div>
              )
            })}
          </div>
          {down.size > 0 && (
            <div style={{ background:"#120808", border:"1px solid #FF525233", padding:"10px 14px" }}>
              <div style={{ fontSize:"9px", color:"#FF5252", letterSpacing:"2px", marginBottom:"6px" }}>AFFECTED DRIVERS</div>
              {[...down].map(code => {
                const affected = ALL_DRIVERS.filter(d => buildShorthand(d.name, shArgs).includes(code))
                return (
                  <div key={code} style={{ marginBottom:"4px", fontSize:"10px", color:"#888" }}>
                    <span style={{ color:"#FF5252", fontWeight:"bold" }}>{code} DOWN{subMap[code]?` → ${subMap[code]}`:" ⚠️ NO SUB"}</span>
                    {affected.length > 0 && <span style={{ color:"#555", marginLeft:"8px" }}>{affected.map(d=>d.name).join(", ")}</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── BP CALENDAR ── */}
      {view==="CALENDAR" && (() => {
        const cal = getBPCalendar(today)
        const weeks = {}
        cal.forEach(d => { if (!weeks[d.weekNum]) weeks[d.weekNum]=[]; weeks[d.weekNum].push(d) })
        return (
          <div style={{ padding:"16px" }}>
            <div style={{ fontSize:"9px", color:"#444", letterSpacing:"3px", marginBottom:"14px" }}>BP ROTATION — 3-GROUP CONTINUOUS WEEKDAY CYCLE</div>
            <div style={{ display:"flex", gap:"12px", marginBottom:"16px", flexWrap:"wrap" }}>
              {["A","B","C"].map(g => (
                <div key={g} style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                  <div style={{ width:"10px", height:"10px", borderRadius:"2px", background:GRP_COLOR[g] }}/>
                  <span style={{ fontSize:"10px", color:GRP_COLOR[g], letterSpacing:"1px" }}>GROUP {g}: {BP_GROUPS[g].join(", ")}</span>
                </div>
              ))}
              <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                <div style={{ width:"10px", height:"10px", borderRadius:"2px", background:"#4FC3F7" }}/>
                <span style={{ fontSize:"10px", color:"#4FC3F7" }}>STACEY + ALEXIS: EVERY DAY</span>
              </div>
            </div>
            {Object.entries(weeks).map(([wk, days]) => (
              <div key={wk} style={{ marginBottom:"16px" }}>
                <div style={{ fontSize:"9px", color:"#333", letterSpacing:"3px", marginBottom:"6px", borderBottom:"1px solid #1a1a1a", paddingBottom:"4px" }}>
                  WEEK {wk}{parseInt(wk)===1?" (CURRENT)":""}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:`repeat(${days.length},1fr)`, gap:"4px" }}>
                  {days.map((d,i) => (
                    <div key={i} style={{ background:d.isToday?`${GRP_COLOR[d.grp]}22`:"#0f0f0f",
                      border:`2px solid ${d.isToday?GRP_COLOR[d.grp]:"#1a1a1a"}`, padding:"10px 8px", textAlign:"center" }}>
                      <div style={{ fontSize:"9px", color:d.isToday?GRP_COLOR[d.grp]:"#444", marginBottom:"4px" }}>{d.day.toUpperCase()}</div>
                      <div style={{ fontSize:"10px", color:"#555", marginBottom:"8px" }}>{d.date.getMonth()+1}/{d.date.getDate()}</div>
                      <div style={{ fontSize:"14px", fontWeight:"bold", color:GRP_COLOR[d.grp], marginBottom:"4px" }}>GRP {d.grp}</div>
                      <div style={{ fontSize:"8px", lineHeight:"1.6" }}>
                        {BP_GROUPS[d.grp].map(n => <div key={n} style={{ color:d.isToday?GRP_COLOR[d.grp]:"#444" }}>{n}</div>)}
                        <div style={{ color:"#4FC3F7", marginTop:"2px" }}>Stacey</div>
                        <div style={{ color:"#FF7043" }}>Alexis</div>
                      </div>
                      {d.isToday && <div style={{ fontSize:"8px", color:GRP_COLOR[d.grp], marginTop:"4px" }}>TODAY</div>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ background:"#0f0f0f", border:"1px solid #1a1a1a", padding:"12px 14px", marginTop:"4px" }}>
              <div style={{ fontSize:"9px", color:"#333", letterSpacing:"2px", marginBottom:"6px" }}>ROTATION RULES</div>
              <div style={{ fontSize:"10px", color:"#444", lineHeight:"2" }}>
                ✓ 5-day week · 3 groups → pattern shifts every week — no two Mondays start the same group<br/>
                ✓ Holiday = skip that day, chain continues — no reset<br/>
                ✓ Stacey + Alexis anchor BP every day regardless of group<br/>
                ✓ No crew hits BP back-to-back days
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── DRIVER CARDS ── */}
      {view==="ROUTES" && (
        <div style={{ padding:"12px 16px", display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"10px" }}>
          {visible.map(driver => {
            const { name, color, bg } = driver
            const onBP        = BP_DRIVERS_TODAY.includes(name)
            const isCurtisOff = driver.officeMode && curtisOffice
            const shortText   = buildShorthand(name, shArgs)
            const isCopied    = copied === name
            const hasAudible  = [...down].some(d => shortText.includes(d)) || isCurtisOff
            const effectiveColor = onBP ? "#FF7043" : hasAudible ? "#FF5252" : color
            const bpInfo      = driverBPDay(name, cycleDay)

            return (
              <div key={name} style={{ background:isCurtisOff?"#1a1000":bg,
                border:`1px solid ${effectiveColor}33`, borderTop:`3px solid ${effectiveColor}`,
                display:"flex", flexDirection:"column" }}>

                <div style={{ padding:"9px 12px 7px", borderBottom:`1px solid ${effectiveColor}22`,
                  display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
                      <div style={{ fontSize:"17px", fontWeight:"bold", letterSpacing:"2px",
                        color:isCurtisOff?"#FFCC02":hasAudible?"#FF5252":"#fff" }}>{name}</div>
                      {onBP && <span style={{ fontSize:"8px", background:"#FF704322", border:"1px solid #FF704344", color:"#FF7043", padding:"1px 6px" }}>BP TODAY</span>}
                      {driver.fixedBP && <span style={{ fontSize:"8px", background:"#4FC3F722", border:"1px solid #4FC3F744", color:"#4FC3F7", padding:"1px 6px" }}>FIXED BP</span>}
                      {driver.shortDay && <span style={{ fontSize:"8px", background:"#FF704322", border:"1px solid #FF704344", color:"#FF7043", padding:"1px 6px" }}>{driver.start} · PARKS 516 · 2 ROUNDS</span>}
                      {isCurtisOff && <span style={{ fontSize:"8px", background:"#FFCC0222", border:"1px solid #FFCC0244", color:"#FFCC02", padding:"1px 6px" }}>IN OFFICE</span>}
                    </div>
                    <div style={{ fontSize:"8px", color:effectiveColor, letterSpacing:"1px", marginTop:"2px", display:"flex", gap:"6px", flexWrap:"wrap" }}>
                      <span>{onBP?"BRIDGEPORT":driver.crew} CREW · {driver.start}</span>
                      {bpInfo && !bpInfo.fixed && (() => {
                        const col = bpInfo.days===0?"#FF7043":bpInfo.days===1?"#FFD700":"#444"
                        return <span style={{ color:col, border:`1px solid ${col}33`, padding:"0 5px" }}>
                          BP {bpInfo.days===0?"TODAY ▶":bpInfo.days===1?"TOMORROW":`DAY ${bpInfo.cycleDay} (${bpInfo.groupLabel})`}
                        </span>
                      })()}
                      {bpInfo?.fixed && <span style={{ color:"#FF7043", border:"1px solid #FF704333", padding:"0 5px" }}>BP EVERY DAY</span>}
                    </div>
                  </div>
                  <button onClick={() => copyText(shortText, name)}
                    style={{ background:isCopied?"#1a3a1a":"#151515", border:`1px solid ${isCopied?"#4CAF50":effectiveColor}`,
                      color:isCopied?"#4CAF50":effectiveColor, padding:"4px 10px", fontSize:"9px",
                      cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                    {isCopied?"✓":"📋"}
                  </button>
                </div>

                <div style={{ padding:"9px 12px", flex:1 }}>
                  {driver.shortDay ? (
                    <div>
                      {shortText.split(" / ").map((line, i) => (
                        <div key={i} style={{ fontSize:"11px", lineHeight:"1.8", wordBreak:"break-word",
                          color:i===0?"#FF7043":"#A5D6A7",
                          borderLeft:`2px solid ${i===0?"#FF7043":"#A5D6A7"}`,
                          paddingLeft:"8px", marginBottom:"4px" }}>
                          {line}
                          {i===0 && down.has("ALEXIS_SHORT") && (
                            <span style={{ color:"#FFD700", marginLeft:"8px", fontSize:"10px" }}>⚡ SHORT → 907 scrap block → 516</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize:"11px", color:hasAudible?"#FF9060":effectiveColor,
                      lineHeight:"1.6", wordBreak:"break-word" }}>{shortText}</div>
                  )}
                </div>

                <div style={{ padding:"6px 12px", borderTop:`1px solid ${effectiveColor}11` }}>
                  <button onClick={() => copyText(shortText, name)}
                    style={{ width:"100%", background:isCopied?"#0a1a0a":"transparent",
                      border:`1px solid ${isCopied?"#4CAF5044":effectiveColor+"33"}`,
                      color:isCopied?"#4CAF50":effectiveColor, padding:"7px", fontSize:"9px",
                      letterSpacing:"2px", cursor:"pointer", fontFamily:"inherit" }}>
                    {isCopied?"✓ COPIED":`COPY → SEND TO ${name.toUpperCase()}`}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ borderTop:"1px solid #141414", padding:"6px 16px", fontSize:"8px", color:"#1e1e1e", background:"#090909", display:"flex", gap:"16px", flexWrap:"wrap" }}>
        <span>SRM DISPATCH // HAZEL GREEN AL // thebardchat/srm-dispatch</span>
        <span>RG=Rogers Group · MM=Martin Marietta · LQ=516 Lacey Spring · MH=591 Mt. Hope · BP=Bridgeport</span>
      </div>
    </div>
  )
}
