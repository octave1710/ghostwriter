# SPEC.md — GhostWriter

**Agentic Engineering Hack · NYC · build window 11:00→16:30 ET · solo · 3-min demo**

---

## 1. The problem (one sentence)

Every GEO/AEO tool today only *monitors* how AI engines describe a brand and *recommends*
fixes — the result is indirect, slow, and impossible to measure — so brands never know if
anything actually changed.

## 2. The solution

GhostWriter is an autonomous agent that **closes the loop**. Point it at a brand. It:

1. **Monitors** how AI engines (ChatGPT/Gemini/Perplexity-style answers) describe the brand
   vs competitors, using live open-web data.
2. **Detects the gap** — the queries where the brand is absent, wrong, or out-cited.
3. **Acts** — generates grounded, fact-anchored content and **publishes it as a citeable
   source** that AI engines can find and cite.
4. **Measures** — tracks the brand's *narrative-control* score (share of AI answers sourced
   from the brand's own ground truth) before vs after, over time.
5. **Monetizes** — exposes the published content behind an agent payment rail, so other
   agents pay a micro-fee per query to access the verified source.

All five steps run autonomously from a single trigger.

## 3. Sponsor mapping (the 5 verbs of the brief)

| Brief verb | Sponsor | What it does in GhostWriter |
|---|---|---|
| **monitor** | **Nimble** | Query open web + AI-engine answers about brand & competitors; return structured JSON of who's cited |
| **publish** | **Senso.ai** | Compile ground truth → generate grounded content → publish citeable to cited.md |
| **measure** | **ClickHouse** | Store narrative-control / citation-rate time series; compute before/after delta |
| **observe** | **Datadog** | LLM Observability SDK traces every agent step: latency, token cost, decisions, reliability |
| **transact** | **x402** | Middleware paywalls the "query published content" endpoint; agents pay per request |

> Minimum required is 3 sponsors. We target 5. If x402 or Datadog runs long, they are the
> first to be cut — the core monitor→publish→measure loop (Nimble+Senso+ClickHouse) is the
> non-negotiable 3.

## 4. Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Next.js dashboard (Vercel)                              │
│  - Input: brand, target queries, competitor URLs         │
│  - Output: gap card · published citeable URL · chart     │
│  - Datadog trace panel · x402 demo widget                │
└───────────────┬─────────────────────────────────────────┘
                │ POST /api/deploy-agent
                ▼
┌─────────────────────────────────────────────────────────┐
│  Agent loop  (/lib/agent/loop.ts) — Claude API           │
│  plan → call tool → act → record → repeat                │
│  [every step wrapped in a Datadog LLM Obs span]          │
└──┬──────────┬───────────┬──────────────┬─────────────────┘
   ▼          ▼           ▼              ▼
 Nimble     Senso     ClickHouse      x402
(monitor) (publish)  (measure)     (transact)
```

## 5. MVP scope (what we actually build in ~4h)

### In scope
1. **Input form**: brand name, 3–5 target queries, 1–2 competitor URLs, one **Deploy Agent** button.
2. **Autonomous agent loop**: monitor (Nimble) → detect gap → generate + publish grounded content (Senso → cited.md) → record narrative-control metric (ClickHouse). Runs to completion on one click.
3. **Dashboard output**: the detected gap, the live published citeable URL (clickable), and a before/after narrative-control chart from ClickHouse.
4. **Datadog "proof" panel**: the agent's trace (steps, latency, cost) + a simple reliability indicator.
5. **x402 paywall** on the `/api/query-content` endpoint + a tiny "agent pays to read" demo. *(Build LAST. Cut without guilt if behind.)*

### Explicitly OUT of scope
- ❌ Real lead / traffic attribution from AI search → **v2 business moat, mention in pitch only**
- ❌ Auth, login, multi-user, multi-brand
- ❌ Real scheduled cron (the loop is autonomous once triggered; you trigger it manually in the demo)
- ❌ Mobile responsive
- ❌ Durable persistence beyond the demo session (seed a "before" snapshot in ClickHouse)
- ❌ Handling every brand/edge case — it must work for ONE rehearsed demo brand

## 6. The autonomy contract (this is 20% of the score)

Once **Deploy Agent** is clicked, zero human input until the result. The loop must:
- decide which queries to check (not hardcoded clicks),
- call Nimble, interpret results, decide there's a gap,
- call Senso to publish, capture the URL,
- write the metric to ClickHouse,
- return a structured result the UI renders.

In the demo you click once and **narrate while it runs itself**. That narration is the pitch.

## 7. Data model (ClickHouse — keep it tiny)

```sql
CREATE TABLE narrative_control (
  brand        String,
  query        String,
  ts           DateTime,
  cited        UInt8,        -- was the brand cited in the AI answer? 0/1
  source_owned UInt8,        -- was the citation from brand's own ground truth? 0/1
  run_id       String
) ENGINE = MergeTree ORDER BY (brand, ts);
```
Narrative-control score = `sum(source_owned) / count()` per run. Plot it before vs after.
Seed the "before" rows at setup; the live run inserts the "after" rows.

## 8. Demo brand (pick + pre-rehearse ONE)

Use a real, plausible brand with genuine GEO gaps so the gap detection is believable.
A mid-size B2B SaaS or DTC brand works well (not a giant like Apple — too well-covered).
Pre-decide the brand, the 5 queries, and the 2 competitors tonight/this morning so the
demo is deterministic. Fake-but-realistic > real-but-flaky.

## 9. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Senso publish flow unfamiliar | High | High | Run the Senso Hello-World CLI at SETUP (before 11:00); it auto-does research→KB→publish. Know it cold. |
| Live AI-engine query slow/flaky | Med | High | Seed the "before" snapshot; live run only produces "after". Cache Nimble responses. |
| Datadog SDK eats time | Med | Med | Wire it during Scaffold on a hello-world call; don't leave it for the end. |
| x402 over-runs | Med | Low | It's the last/cuttable feature. Stub a "paid ✓" UI state if real settlement is flaky. |
| Demo breaks live | Med | High | Record a perfect screencast at ~15:45. Switch to it without apologizing. |
| Scope creep into attribution | High | High | Hard rule in CLAUDE.md. Narrative-control is the metric. Full stop. |

## 10. Definition of done (16:30)

- [ ] One click runs the full autonomous loop to a rendered result
- [ ] A real cited.md URL is published and opens in a browser
- [ ] The narrative-control chart shows a before→after lift
- [ ] The Datadog trace panel shows the agent's steps
- [ ] (Bonus) An agent pays via x402 to read the content
- [ ] Public GitHub repo pushed
- [ ] 3-min demo recording uploaded to Devpost
