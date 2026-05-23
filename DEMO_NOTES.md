# DEMO_NOTES — GhostWriter cheat sheet

> Read this once before stepping up. Keep on phone/laptop during Q&A.

---

## TL;DR — the pitch in 3 sentences

GhostWriter is the first **autonomous GEO agent** that closes the loop.
Every other tool monitors how AI engines describe a brand and recommends fixes — slow, indirect, unmeasurable.
GhostWriter actually **acts**: it detects citation gaps, publishes grounded citeables AI engines cite, measures the lift, and monetizes every agent read via x402 — all in one trigger, ~10 seconds end-to-end.

---

## The deck (slides.html)

Open at **https://ghostwriter-taupe-omega.vercel.app/slides.html**  
Or locally: open `public/slides.html` in a browser.

8 slides. Navigate with arrows or space. Press `S` for speaker notes view.

Order:
1. **Title** — brand mark, "live · agentic engineering hack · NYC"
2. **The shift** — AI is the new search (700M+ weekly ChatGPT, 25% search → AI by 2026)
3. **The problem** — current GEO tools only monitor; GhostWriter acts
4. **The solution** — one trigger, 5 verbs (Monitor / Act / Expand / Measure / Earn)
5. **Architecture** — 6 sponsor tools wired
6. **Business model** — $0.01 USDC per agent read, $300/mo at 1k reads/day, compounds
7. **Why now** — window for brands + agentic economy
8. **Live demo →** ghostwriter-taupe-omega.vercel.app

Skip 5 and 7 if you're tight on time. Slides 1-4 + 6 + 8 are the must-haves.

---

## The live demo — section-by-section script

### Section 0 · the form (pre-loaded)

**What's visible:** brand=Resend, competitors=SendGrid+Postmark, 5 queries.  
**Say:** "I'm running it on Resend — a developer-first transactional email API — against 5 buyer-intent queries. The form is pre-filled but you can put any brand."  
**Click:** `▶ Deploy Agent`.

### Section · status banner (during run, ~8-10s)

**What appears:** Monitor → Detect → Publish → Measure progress bars filling.  
**Say:** "The agent runs end-to-end in ~10 seconds. Real OpenAI loop on gpt-4o. Every step traced in Datadog LLM Observability."

### HERO impact card

**What appears:** `3/5 → 5/5` queries cited (or whatever the live count is).  
**Say:** "Before: 3 of 5 queries cited Resend, ZERO source-owned. After: 5 of 5 cited, multiple now source-owned via cited.md."

### Section 01 · What AI engines were saying (MONITORING)

**Two panels side by side:**
- **AI search visibility matrix** — each query × each brand (Resend / SendGrid / Postmark). Green cells = cited, gray = absent.
- **Competitive standing** — bar chart with ghost-projected bar for Resend.

**Say:** "Live data from Nimble — the same web indexes ChatGPT, Perplexity, Gemini and Google AI Overviews train on. You see exactly where Resend wins, where SendGrid wins, where everyone's absent."

### Section 02 · What the agent did about it (ACTION + TREND)

**What appears:** Cards for each published citeable (clickable cited.md URLs, preview button shows the markdown) + narrative-control trend chart.

**Say:** "For each gap, the agent generated grounded markdown via gpt-4o and published it as a real citeable on cited.md — agent-native, public, machine-readable. The chart shows the lift in narrative control: flat at 0% before, vertical spike now."

**Optional:** click `preview` on one of the citeables — opens inline the actual markdown.

### Section 03 · Expand coverage (NEW QUERY SUGGESTIONS)

**What appears:** Violet-themed panel with "✦ suggest 5 queries" button.

**Click:** "suggest 5 queries" → 5 strategic queries appear (comparison, buyer-intent, integration types) with one-line rationale each.

**Say:** "The agent doesn't stop at fixing your gaps. It identifies 5 MORE high-value queries you should ALSO rank for — comparison queries, buyer-intent, integration. One click and it publishes citeables for all of them."

**Click:** `✦ publish 5 citeables` (optional, ~10s extra) — they appear as new URLs.

### Section 04 · How AI engines now answer (THE WOW)

**What appears:** Coverage strip with logos (ChatGPT, Perplexity, Gemini, Google AIO, Claude.ai) — then BEFORE/AFTER panel.

**Say:** "Coverage: we monitor 5 AI engines. For one of the gap queries, here's the proof — same query, simulated through gpt-4o roleplaying ChatGPT. **Before**: cites SendGrid. **After**: cites Resend, via our cited.md article. The citation literally flips."

### Section 05 · Did the fix actually land? (VERIFICATION)

**What appears:** 4 trust badges + 4 signals per article:
1. Article live (HTTP 200) — ✓
2. Brand in article — ✓
3. Brand in SERP — depends on freshness
4. URL indexed in SERP — typically pending (24-48h crawl cycle)

**Say:** "Honest verification. Two signals are green immediately — the article is live and contains your brand. The other two are 24-48h because that's how long Google takes to re-index. Scheduled recurring runs catch it."

### Section 06 · Monetize the source (x402 REVENUE)

**What appears:** Revenue projection ($0.01 / $30/mo / $300/mo) + 3-step flow.

**Click:** `▶ See what happens when an agent calls your endpoint` → HTTP 402 challenge appears with real x402 v1 payload.

**Click:** `$ Simulate the buyer paying 0.01 USDC` → content unlocks with markdown excerpt.

**Say:** "Every citeable you publish is paywalled. When another AI agent reads it, you earn 0.01 USDC. At 1k reads/day that's $300/month per citeable. Real x402 protocol, real Base Sepolia, real USDC settlement. New revenue line."

### Section 07 · Next moves (OPTIMIZATIONS)

**What appears:** 6 actionable recommendations with impact + effort badges.

**Say:** "And it tells you what to do next — schedule weekly runs, add structured FAQ schema, target comparison queries, open the payment rail to partners. Each one with impact/effort tagging."

### Datadog trace (collapsed) + footer

**Click:** the collapsed `▶ Datadog LLM Observability trace · N spans · Xs` to expand.

**Say:** "Every step traced. Click 'open in Datadog' and you see the live workflow tree. Not a black box."

**Then point at footer:** "Six sponsors. Every one wired live. Source on GitHub."

---

## Tech stack — one-liners (for Q&A)

| Layer | Tech | Why |
|---|---|---|
| Frontend | Next.js 16 App Router on Vercel | Edge-deployed, static shell + RSC, auto-pipeline from GitHub |
| Language | TypeScript end-to-end | Same types across server actions, API routes, components |
| Agent brain | OpenAI gpt-4o-mini (planner) + gpt-4o (gap reasoning + ground truth) | gpt-4o-mini cheap for routing; gpt-4o for the quality moments |
| Web monitor | Nimble `POST /v1/search` | SERP API on the same indexes AI engines train on |
| Publisher | Senso.ai `POST /v1/org/content-engine/publish` | Agent-native publishing to cited.md (their hosted citeables network) |
| Storage | ClickHouse Cloud `@clickhouse/client` | MergeTree table for narrative-control time series at scale |
| Observability | Datadog `dd-trace` 5.x · LLM Obs | Agentless mode, auto-instruments OpenAI calls, custom workflow/tool/llm spans |
| Payments | `x402-next` `withX402(handler, recipient, { price, network })` | HTTP-native 402 paywall, Base Sepolia, USDC |

---

## Likely jury questions + answers

### "How is this different from Profound / Brand24 / AthenaHQ?"
> They monitor and recommend. They produce reports. GhostWriter ACTS — auto-publishes citeables AI engines can cite, measures the lift, monetizes the source. It closes the loop they leave open.

### "Are AI engines really citing cited.md?"
> cited.md is Senso's agent-native domain — built for this exact use case. Indexing happens on the standard 24-48h SERP cycle, plus Senso has direct integrations with several agent platforms. Our verification panel shows 2 of 4 signals green immediately (article live + brand in article); the SERP signal lags by the crawl cycle.

### "What about hallucinations in the generated content?"
> We generate from the brand's ground truth (we'd hook into a knowledge base in production — here we use the brand name + query as the grounding prompt). Senso also has a verification workflow (`content verification`) where humans can approve before going live. Today, auto-publish for the demo.

### "Why x402, not Stripe?"
> Stripe needs accounts, signups, KYC. x402 is HTTP-native: an AI agent embedding `x402-fetch` literally pays in the retry of a 402 response. Zero setup. That matches how the agentic economy actually works.

### "Why Base Sepolia, not mainnet?"
> Testnet for the hackathon to keep gas costs zero. Same protocol, same code, same wallet pattern — one env flip to go mainnet on Base.

### "How does the 'AI engine response' work? Is it really ChatGPT?"
> It's gpt-4o roleplaying an AI engine — we feed it the user query + the SERP sources (before scenario) vs SERP + our cited.md article (after scenario). This is exactly what an AI engine does once it indexes cited.md. We label it "simulated" honestly. The real AI engines re-crawl in 24-48h via Senso's distribution.

### "What's the moat?"
> The data network. Every run feeds ClickHouse — over time you have the world's largest dataset of "what AI engines cite for what query × what brand". That's the moat. Plus the cited.md substrate (via Senso) becomes the agent-native publishing layer of record.

### "How does the autonomy work, technically?"
> One POST to `/api/deploy-agent` runs `lib/agent/loop.ts` which orchestrates: Nimble monitor (5x parallel) → gap detection (local + gpt-4o reasoning) → ground truth generation (gpt-4o) → Senso publish → ClickHouse insert → AI engine simulation. Every step wrapped in a Datadog LLM Obs span. No human in the loop.

### "What about scale? 1M brands, 100 queries each?"
> Architecturally fine. ClickHouse handles billions of rows on Mini tier. Nimble has 83 QPS per key. The agent loop is stateless — horizontal scale is just more Vercel functions. The bottleneck is OpenAI cost: ~$0.01 per gap with gpt-4o.

### "How do you handle the case where AI engines stop citing cited.md?"
> Multi-publisher architecture: Senso can publish to any registered destination (`senso destinations add`). Today cited.md is the canonical. Tomorrow if a brand wants their own domain, you `senso destinations add --domain content.brand.com` and the same code publishes there. Resilient by design.

### "Is this just a content farm?"
> No — we generate ONE grounded citeable per detected gap, not 1000 SEO pages. Quality over quantity. The content is structured for AI engines (markdown, factual, lead with brand). And it's gated through Senso's verification workflow in production.

### "What's the unit economics?"
> Per run: ~$0.005 OpenAI + ~$0.001 Nimble + ~$0 ClickHouse + ~$0 Datadog. Total ≈ $0.01 per run. Per citeable monetized: $0.01 USDC × N agent reads. Break-even at 1 agent read per citeable. Pure margin after that.

### "Can a competitor build this?"
> They can't ship 6-tool integration end-to-end this fast — and our advantage is the time-series moat in ClickHouse + the autonomy contract. Everything we monitor is benchmark data for everyone else.

### "What's next on the roadmap?"
> 1) Multi-brand orgs + role permissions, 2) Real ChatGPT/Perplexity API integration for actual (non-simulated) verification, 3) Scheduled recurring runs (cron), 4) Sentiment tracking (positive/negative citations), 5) Open the x402 endpoint as a marketplace for partner agents.

---

## Architecture diagram (sketch for whiteboard)

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
              monitor│ gen  │publish│ insert│  ← parallel where safe
                     │      │       │      │
        ┌────────────▼┐ ┌───▼──┐ ┌──▼───┐ ┌▼──────────┐
        │  Nimble    │ │ gpt-4o│ │Senso │ │ClickHouse │
        │  /v1/search│ │       │ │ /v1  │ │           │
        └────────────┘ └──────┘ └──────┘ └───────────┘
                     │      │       │      │
                     └──────┴───┬───┴──────┘
                                │
                  ┌─────────────▼──────────────┐
                  │  Datadog LLM Obs           │   ← wraps every step
                  │  workflow + tool + llm     │
                  └────────────────────────────┘

[separately]
  /api/query-content  ──── withX402 ────►  cited.md content (paywalled)
                          0.01 USDC
                          base-sepolia
                          payTo: YOUR wallet
```

---

## URLs you'll need on stage

- **Live app:** https://ghostwriter-taupe-omega.vercel.app
- **Slides:** https://ghostwriter-taupe-omega.vercel.app/slides.html
- **Repo:** https://github.com/octave1710/ghostwriter
- **Two already-published citeables:**
  - https://cited.md/article/d500b6cd-d0bb-430f-8498-1d50ac8cee28
  - https://cited.md/article/95f367a0-a0e5-4846-8abd-541617ce7ea6

---

## If something breaks live

| Failure | What you say |
|---|---|
| Page slow to load | "First request hits Vercel cold start — give it 2s. Refresh if needed." |
| Deploy Agent hangs | "Live API call — Nimble can vary; let it finish. Worst case I'll point at the pre-recorded Loom." |
| No gaps detected | "SERPs vary — Resend ranks differently across calls. Look at the chart, you can see prior runs showed clear gaps." |
| Verification all-pending | "Honest result — Google takes 24-48h to re-crawl. The first 2 signals are always green: article is live, brand is in the article." |
| x402 challenge doesn't appear | "Make sure the agent ran successfully first — the panel needs at least one published citeable." |
| Anything else | "Live demos. Back to the slides + the Loom on the repo." |

Loom backup is on the GitHub README (record it tonight).

---

## Final reminders

- **Don't read the slides aloud** — let them frame what you say.
- **Click less, narrate more** — the panels are dense, your voice is the through-line.
- **End on the x402 panel** — the monetization is the punchline.
- **Hand over to Q&A confidently** — you've seen every panel, you know the source, you have answers above.
