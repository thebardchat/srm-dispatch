# CLAUDE.md — srm-dispatch
### Claude Code Context File · thebardchat/srm-dispatch · v1.0

---

## What This Repo Is

Daily dispatch planning tool for SRM Concrete's North Alabama triaxle dump truck fleet. Browser-based, no backend, built to run on the Pi or serve statically on GitHub Pages.

Built by a working dispatcher for a working dispatcher. Every feature solves a real daily problem.

---

## Operator Context

- **Dispatcher:** Shane — sole dispatcher, sole provider, ADHD brain
- **Fleet:** 14 active triaxle drivers
- **Quarries:** Cherokee · Mt. Hope · Bridgeport
- **System:** AUJS Classic for aggregate orders (scale sync issues with new AU system — Classic stays until resolved)
- **Dispatch Manager:** Curtis (promoted from driver — not in active route pool)

**Active Drivers:**
Marcus, Brittany, Eboni, Deletra, Stacey, Alexis, Kenny, Charlie, Jamie, Bryant, Jonathon, Jimmy, Eddie, Roberto

---

## Hardware Context

| Device | Role | Address |
|--------|------|---------|
| **Raspberry Pi 5 (16GB)** | Local dev + hosting | `100.67.120.6` Tailscale / `10.0.0.42` LAN |
| **Pironman 5-MAX** | NVMe RAID chassis | — |
| **Pulsar0100** | N8N / dev workstation | `100.81.70.117` |

**Project Path:** `/mnt/shanebrain-raid/shanebrain-core/srm-dispatch/`

---

## Tech Stack

- **Vanilla JavaScript** — no framework overhead
- **Vite** — build tooling
- **Static HTML/CSS** — deploy anywhere, zero dependencies
- **No backend, no auth, no cloud calls**

---

## Business Logic Rules (Do Not Break)

| Rule | Reason |
|------|--------|
| Zone rotation must be tracked across days | Driver fairness — prevents same drivers always getting bad zones |
| Bridgeport hauls are premium runs | Longer distance = different pay tier, assign fairly |
| Scrap runs rotate | No driver owns the scrap run permanently |
| POD scheduling is separate from zone work | Different billing logic |
| Preload assignments set the day's pace | Get these right first |

---

## Design Constraints

- **ADHD-aware:** One screen. What do I do next is always obvious.
- **Mobile-friendly:** Shane uses this on his phone in the yard
- **Offline-capable:** Must work with no internet on Pi LAN
- **Print-friendly:** Drivers need a physical sheet sometimes

---

## Constitutional Alignment

Governed by [ShaneTheBrain Constitution](https://github.com/thebardchat/constitution/blob/main/CONSTITUTION.md).

Before any feature ships:
- [ ] Works offline on Pi
- [ ] One-action UX (no multi-step friction)
- [ ] Printable output option
- [ ] Fairness logic intact

---

## Ecosystem Position

```
srm-dispatch
  └── Runs on Pi 5 · served on LAN + GitHub Pages
  └── Feeds driver data into ShaneBrain planning layer
  └── Part of Angel Cloud ops infrastructure (future)
```

---

## Credits

- **Claude (Anthropic)** — Co-built this entire tool · [claude.ai](https://claude.ai)
- **Raspberry Pi 5 + Pironman 5-MAX** — The hardware behind the operation

---

*Last updated: March 2026 · thebardchat/srm-dispatch · v1.0*
