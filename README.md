<div align="center">

# GhostWriter

**The first autonomous GEO agent that closes the loop.**

Monitor AI search · detect citation gaps · publish grounded citeables · measure the lift · monetize via agent payments — all in one trigger.

[![live demo](https://img.shields.io/badge/live-ghostwriter--taupe--omega.vercel.app-10b981?style=flat-square)](https://ghostwriter-taupe-omega.vercel.app)
[![pitch deck](https://img.shields.io/badge/slides-reveal.js-3b82f6?style=flat-square)](https://ghostwriter-taupe-omega.vercel.app/slides.html)
[![status](https://img.shields.io/badge/status-live-10b981?style=flat-square)](https://ghostwriter-taupe-omega.vercel.app)
[![sponsors](https://img.shields.io/badge/sponsors-6-a78bfa?style=flat-square)](#how-it-works)
[![license](https://img.shields.io/badge/license-MIT-3f3f46?style=flat-square)](LICENSE)

Built solo at the **Agentic Engineering Hack · NYC** · May 2026.

</div>

---

## The problem

AI engines (ChatGPT, Perplexity, Gemini, Claude, Google AI Overview) now decide who gets cited when consumers ask for product recommendations. Brands have no direct way to fix what AI says about them.

Every GEO/AEO tool today only **monitors** how AI describes a brand and **recommends** fixes. The result is **indirect, slow, unmeasurable**. You wait weeks and never know if anything moved.

## The solution

GhostWriter closes the loop in one autonomous trigger:

1. **Monitor** AI search — Nimble pulls the same SERP that AI engines train on
2. **Detect** citation gaps — gpt-4o reasons over per-query brand vs competitor data
3. **Publish** grounded citeables — Senso pushes auto-generated markdown to cited.md
4. **Expand** coverage — agent suggests 5 more high-value queries + publishes citeables for them
5. **Measure** the narrative-control lift — ClickHouse stores the before/after time series
6. **Verify** the fix landed — re-queries the open web to confirm propagation
7. **Monetize** every read — x402 paywall on /api/query-content; agents pay USDC to read

Every step traced by Datadog LLM Observability.

## How it works

Six sponsor tools, one autonomous loop:

| Verb | Sponsor | What it does |
|---|---|---|
| **monitor** | [Nimble](https://nimbleway.com) | Live SERP from the same indexes AI engines train on |
| **publish** | [Senso.ai](https://senso.ai) | Publishes grounded citeables to cited.md via `/org/content-engine/publish` |
| **reason** | [OpenAI](https://openai.com) | gpt-4o for ground truth + gpt-4o-mini for routing + query expansion |
| **measure** | [ClickHouse Cloud](https://clickhouse.cloud) | MergeTree table for narrative-control time series |
| **observe** | [Datadog](https://datadoghq.com) | LLM Observability — every span and token traced |
| **transact** | [x402](https://x402.org) | HTTP-native USDC payments on Base Sepolia |

```
                 ┌─────────────────────────────┐
                 │   /api/deploy-agent         │   ← one POST trigger
                 └──────────────┬──────────────┘
                                │
                 ┌──────────────▼──────────────┐
                 │   lib/agent/loop.ts         │
                 │   runAgent()                │
                 └──┬──────┬───────┬──────┬────┘
                    │      │       │      │
             monitor│  gen │publish│insert│
                    │      │       │      │
       ┌────────────▼┐ ┌───▼──┐ ┌──▼───┐ ┌▼──────────┐
       │  Nimble    │ │OpenAI│ │Senso │ │ClickHouse │
       │  /v1/search│ │      │ │ /v1  │ │  Mini     │
       └────────────┘ └──────┘ └──────┘ └───────────┘
                    │      │       │      │
                    └──────┴───┬───┴──────┘
                               │
                 ┌─────────────▼──────────────┐
                 │  Datadog LLM Obs           │
                 │  workflow + tool + llm     │
                 └────────────────────────────┘

[paywall]
  /api/query-content  ── withX402 ──► cited.md content
                       0.01 USDC · base-sepolia · payTo: brand wallet
```

## Demo

**Live:** https://ghostwriter-taupe-omega.vercel.app

1. Form pre-loaded with **Resend** + 5 queries + competitors (SendGrid, Postmark)
2. Click **▶ Deploy Agent**
3. ~10 seconds end-to-end:
   - Hero card: `3/5 cited → 5/5 cited` (projected)
   - Section 01: monitoring matrix + competitive standing
   - Section 02: published citeables (clickable cited.md URLs) + narrative-control trend
   - Section 03: 5 strategic queries to ALSO own → publish in one click
   - Section 04: BEFORE/AFTER AI engine response (gpt-4o simulating ChatGPT)
   - Section 05: 4-signal verification (article live · brand in article · brand in SERP · URL indexed)
   - Section 06: x402 revenue projection + interactive 402 challenge demo
   - Section 07: next-step optimizations beyond publishing
4. Expand the collapsed **Datadog LLM Observability trace** to see every span.

## Stack

- **Next.js 16** App Router on **Vercel** with auto-deploy from GitHub
- **TypeScript** end-to-end
- **Tailwind v4** + **recharts** for the dashboard
- **OpenAI** Node SDK (gpt-4o-mini routing, gpt-4o for content + simulation)
- **Nimble** SERP API (`POST /v1/search`)
- **Senso CLI** + REST (`POST /v1/org/content-engine/publish` → cited.md)
- **ClickHouse Cloud** Mini tier with `@clickhouse/client`
- **Datadog `dd-trace` 5.x** LLM Obs SDK in agentless mode
- **x402-next** `withX402(handler, recipient, ...)` middleware for the paywall
- **viem** for the EOA wallet generation

## Running locally

```bash
# 1. Install
pnpm install

# 2. Provision sponsor accounts (see SETUP.md) and fill .env
cp .env.example .env
# Edit .env with your keys

# 3. Add cited.md as a publish destination once (org-scoped)
senso destinations add --domain cited.md --name "Cited.md" --type citeables
# Copy the returned publisher_id into SENSO_CITED_MD_PUBLISHER_ID

# 4. Seed the historical baseline (optional — gives the chart a 'before' shape)
pnpm tsx --env-file=.env scripts/seed-before.ts

# 5. Smoke-test the loop from the CLI
pnpm tsx --env-file=.env scripts/run-agent.ts

# 6. Run the dashboard
pnpm run dev
# → http://localhost:3000
```

## Project layout

```
app/
  page.tsx                       static shell — hydrates client-side
  api/
    deploy-agent/route.ts        POST: runs the full loop
    suggest-queries/route.ts     POST: gpt-4o suggests 5 strategic queries
    publish-additional/route.ts  POST: publishes citeables for selected queries
    verify-citation/route.ts     POST: 4-signal verification of a citeable
    narrative-control/route.ts   GET: time series for the chart
    query-content/route.ts       GET: paywalled content (withX402)
    health/route.ts              GET: hello-world Datadog span

components/
  Dashboard.tsx                  main client component
  MonitoringPanel.tsx            per-query × brand citation matrix
  CompetitiveLeaderboard.tsx     horizontal bar chart with ghost projection
  PublishedArticles.tsx          expandable cards with markdown preview
  NarrativeChart.tsx             recharts line+area chart with reference line
  AIResponsePanel.tsx            BEFORE/AFTER AI engine response
  AIEngineLogos.tsx              inline SVG logos for ChatGPT/Perplexity/Gemini/...
  QuerySuggestionsPanel.tsx      strategic query suggestions + bulk publish
  VerificationPanel.tsx          4-signal verification with aggregate badges
  X402Panel.tsx                  revenue projection + interactive 402 demo
  OptimizationsPanel.tsx         actionable recommendations beyond publishing
  TracePanel.tsx                 Datadog LLM Obs spans visualization

lib/
  agent/loop.ts                  the orchestrator (workflow/tool/llm spans)
  integrations/
    nimble.ts                    open-web monitor
    senso.ts                     cited.md publisher (lookup-or-create prompt)
    clickhouse.ts                narrative_control storage
    datadog.ts                   dd-trace init at startup
    openai.ts                    model registry
    x402.ts                      config

scripts/
  run-agent.ts                   CLI runner — Resend demo input
  seed-before.ts                 seeds 30 historical rows for the chart baseline

public/
  slides.html                    reveal.js pitch deck (served at /slides.html)

instrumentation.ts               Next.js hook that boots dd-trace
middleware.ts                    (none — paywall is via withX402 route wrapper)
```

## Business model

Every grounded citeable is paywalled via **x402** on Base Sepolia. Every time another AI agent reads the source, **$0.01 USDC** lands in the brand's wallet.

| Citeables live | Reads/day | Monthly revenue |
|---|---|---|
| 1 | 50 | $15 |
| 1 | 500 | $150 |
| 10 | 500 | $1,500 |
| 100 | 1,000 | **$30,000** |

Compounds with every new citeable. Compounds with every new query expanded. New revenue line + credibility signal back to AI engines.

## Hard scope discipline (lessons learned)

- **No traffic attribution.** That's v2. We measure narrative-control (share of AI answers sourced from your own ground truth) before vs after.
- **3 sponsors is the floor.** We shipped with 6.
- **The loop is autonomous.** One click. No "next step" buttons.

See [`CLAUDE.md`](CLAUDE.md), [`SPEC.md`](SPEC.md), [`BATTLE_KIT.md`](BATTLE_KIT.md), [`DEMO_NOTES.md`](DEMO_NOTES.md) for the full build kit.

## License

MIT.

---

<div align="center">

🤖 Co-built with [Claude Code](https://claude.com/claude-code).  
Pitch deck powered by [reveal.js](https://revealjs.com).

</div>
