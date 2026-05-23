# CLAUDE.md — GhostWriter (Agentic Engineering Hack, NYC)

> This file is read automatically by Claude Code on every session. It is the
> single source of truth for what we're building, the rules, and the guardrails.
> Read `SPEC.md` for the full product spec. Read `BATTLE_KIT.md` for timeline + pitch.

---

## What we're building (one line)

**GhostWriter** — an autonomous agent that closes the GEO loop: it monitors how AI
engines describe a brand, detects where the brand is NOT cited on the open web,
**generates and publishes grounded citeable content**, measures the narrative-control
lift, and lets agents pay to access the content via payment rails.

It is NOT a monitoring dashboard. It is NOT a reco engine. Every competitor in this
category stops at "monitor + recommend" and produces results that are indirect and
unmeasurable. GhostWriter **acts** and the result is **direct + measurable**. That is
the entire point. Do not let the build drift back into "just monitoring".

## Why this wins (the judging grid — 20% each)

| Criterion | How GhostWriter scores |
|---|---|
| **Autonomy** | The full loop runs on one trigger, no manual clicks between steps |
| **Idea** | Solves the #1 unsolved gap in GEO/AEO: direct, measurable action |
| **Technical** | A real 5-tool agent orchestration loop, not a wrapper |
| **Tool Use** | Uses 5 sponsor tools/rails: Nimble + Senso + ClickHouse + Datadog + x402 |
| **Presentation** | One clean 3-min story: monitor → act → measure → prove → transact |

## The stack (decided — do not re-litigate)

- **Frontend / host:** Next.js (App Router) + Vercel. One dashboard page.
- **Agent brain:** OpenAI API (gpt-4o / gpt-4o-mini) — plan → call tool → act → record. *(Swapped from Claude on build morning for cost reasons; no judging impact since Anthropic is not a counted sponsor.)*
- **Web data (monitor):** Nimble API / MCP — query open web + AI engines re: brand/competitors.
- **Publish:** Senso.ai — generate grounded citeable content → publish to cited.md.
- **Measure:** ClickHouse Cloud — store narrative-control / citation-rate over time.
- **Observe:** Datadog LLM Observability SDK — trace every agent step (latency, cost, decisions).
- **Transact:** x402 middleware — paywall the "query published content" endpoint.

## Build order (phases — never skip, never reorder)

1. **Scaffold** (~30m): Next.js deployed blank on Vercel + env vars wired. Prove the pipeline.
2. **Core loop** (~90m): the agent loop working in isolation — monitor (Nimble) → detect gap → publish (Senso) → record metric (ClickHouse). Ugly is fine. Must run end-to-end ONCE.
3. **Dashboard** (~75m): UI shows gap detected + published citeable URL + before/after narrative-control chart.
4. **Polish** (~45m): dark mode, the Datadog "proof" panel, realistic seed data, the x402 paywall (LAST, cut without guilt if time).
5. **Demo prep** (~60m, LOCKED): record backup screencast, rehearse 3×, submit.

## Hard rules (non-negotiable)

- **NO real lead/traffic attribution.** That's the v2 business moat, not the hackathon build. We measure **narrative control / citation rate** (before vs after) as the demoable proxy. If you catch yourself building attribution, STOP.
- **Autonomy is the demo.** The loop must run by itself once triggered. No "click next step". This is 20% of the score.
- **3+ sponsor tools is mandatory** (judging criterion), we target 5. Every integration must be VISIBLE in the demo, not just in the code.
- **Scope gate:** before adding ANY feature not in SPEC.md, ask: will the judge see it in the 3-min demo? Does the demo work without it? Can it be built in <20 min? If any answer is no → don't build it.
- **The 2-hour warning:** at 14:30, STOP adding features. Polish + demo prep only.
- **Seed don't scrape-live-for-everything:** pre-seed ClickHouse with a "before" snapshot so the live run only has to produce the "after". Live scraping of everything = broken demo.
- **No previous code reused.** Repo must be fresh (hackathon rule). Boilerplate/scaffold generated today is fine; no lifting from past GEO Monitor projects.

## Conventions

- TypeScript everywhere. Keep files small and single-purpose.
- All secrets in `.env` (gitignored, never commit). `.env.example` lists the keys.
- One agent loop module (`/lib/agent/loop.ts`) — the orchestration lives here, isolated and testable.
- Each sponsor integration is its own module under `/lib/integrations/` so a broken one can be stubbed fast.
- Commit every ~30 min. Working code only on `main`.

## Demo target (what must be true at 16:30)

A judge watches you click **Deploy Agent** once. The agent autonomously: finds that
"BrandX" is cited in 1/5 AI answers, publishes a grounded citeable to a live cited.md
URL, and the narrative-control chart climbs. You flip to the Datadog trace ("here's the
proof it's not a black box"), then show an agent paying via x402 to read the content.
3 minutes. Tight. Rehearsed. Backup video ready.
