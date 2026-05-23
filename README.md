# GhostWriter

> Autonomous GEO agent. One trigger, full loop:
> **monitor → detect gap → publish citeable → measure narrative-control lift.**

Built solo at the **Agentic Engineering Hack · NYC**.

🟢 Live demo: <https://ghostwriter-taupe-omega.vercel.app>

---

## Why this exists

Every GEO/AEO tool today **monitors** how AI engines describe a brand and **recommends** fixes.
The result is indirect, slow, and impossible to measure — so brands never know if anything actually changed.

GhostWriter closes the loop: it **acts**, and the result is **direct + measurable**.

| Step | What happens | Sponsor tool |
|---|---|---|
| **Monitor** | Query open web + AI engines for how the brand is cited | **Nimble** |
| **Detect** | Find queries where the brand is absent, wrong, or out-cited | **OpenAI (gpt-4o)** |
| **Publish** | Generate grounded markdown + push as a citeable to cited.md | **Senso.ai** |
| **Measure** | Store narrative-control time series; compute before→after lift | **ClickHouse Cloud** |
| **Observe** | Every step traced (latency, model cost, decisions) | **Datadog LLM Obs** |
| **Transact** | Other agents pay a micro-fee to read the published source *(Phase 4 — optional)* | **x402** |

All five orchestrated by a single OpenAI-driven loop in [`lib/agent/loop.ts`](lib/agent/loop.ts).

---

## The demo (3 minutes)

1. Open the dashboard. Form pre-filled with **Resend** + 5 queries + 2 competitors (SendGrid, Postmark).
2. Click **Deploy Agent**.
3. Watch the loop run itself:
   - "Monitoring AI engines via Nimble…"
   - "Detecting citation gaps…"
   - "Publishing grounded citeables to cited.md…"
   - "Recording narrative-control metrics in ClickHouse…"
4. ~15 seconds later, three cards appear:
   - **Gaps detected** (e.g. 2 of 5 queries)
   - **Citeables published** with clickable cited.md URLs
   - **Narrative control** % (this run)
5. The chart re-renders with a new data point — visible **before → after lift**.
6. The **Datadog trace panel** below shows every span (kind, duration, model, URL). One click opens the live Datadog LLM Observability UI.

That's the entire pitch. The autonomy + the measurable delta is the thing.

---

## Stack

- **Next.js 16** (App Router) on **Vercel**, deployed via GitHub auto-pipeline
- **TypeScript** end-to-end
- **OpenAI** Node SDK (`gpt-4o-mini` planner, `gpt-4o` for grounded content)
- **Nimble** SERP API (`POST /v1/search`)
- **Senso.ai** content engine (`POST /v1/org/content-engine/publish` → cited.md)
- **ClickHouse Cloud** (Mini tier) with `@clickhouse/client`
- **Datadog `dd-trace` 5.x** LLM Observability SDK, agentless mode
- **Tailwind v4** + **recharts** for the dashboard
- Skills via **gstack** during the build (`/qa`, `/plan-eng-review`, etc.)

---

## Project layout

```
app/
  page.tsx                       — server component, seeds initial chart
  api/
    deploy-agent/route.ts        — POST: runs the loop
    narrative-control/route.ts   — GET: time series for the chart
    health/route.ts              — hello-world Datadog span
components/
  Dashboard.tsx                  — form, phase progression, result cards
  NarrativeChart.tsx             — recharts line chart
  TracePanel.tsx                 — Datadog proof panel
lib/
  agent/loop.ts                  — the orchestrator (workflow + per-step spans)
  integrations/
    nimble.ts                    — open-web monitor
    senso.ts                     — cited.md publisher (lookup-or-create prompt)
    clickhouse.ts                — narrative_control storage
    datadog.ts                   — dd-trace init at startup
    openai.ts                    — model registry
    x402.ts                      — config only (Phase 4)
scripts/
  run-agent.ts                   — CLI runner with the Resend demo input
  seed-before.ts                 — seeds 30 historical rows for the chart baseline
instrumentation.ts               — Next.js hook that boots dd-trace
```

---

## Running locally

```bash
# 1. Install
pnpm install

# 2. Provision sponsor accounts (see SETUP.md) and fill .env (use .env.example)
cp .env.example .env
# Edit .env with your keys

# 3. Add cited.md as a publish destination once (org-scoped)
senso destinations add --domain cited.md --name "Cited.md" --type citeables
# Capture the returned publisher_id and put it in SENSO_CITED_MD_PUBLISHER_ID

# 4. Seed the historical baseline
pnpm tsx --env-file=.env scripts/seed-before.ts

# 5. Smoke-test the loop from the CLI
pnpm tsx --env-file=.env scripts/run-agent.ts

# 6. Run the dashboard
pnpm run dev
# → http://localhost:3000
```

---

## Hard scope discipline

- **No real lead/traffic attribution.** That's v2. We measure narrative-control (share of AI answers sourced from your own ground truth) before vs after.
- **3 sponsor tools is the floor.** We ship with 5 (+1 if x402 lands).
- **The loop is autonomous.** One click. No "next step" buttons.

See [`CLAUDE.md`](CLAUDE.md), [`SPEC.md`](SPEC.md), [`BATTLE_KIT.md`](BATTLE_KIT.md) for the full build kit.

---

## License

MIT.

🤖 Co-built with [Claude Code](https://claude.com/claude-code).
