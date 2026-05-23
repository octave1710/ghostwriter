# BATTLE_KIT.md — your day, on one page

Build window **11:00 → 16:30** ET. Submission **16:30**. Finalist presentations **17:00**.
Solo. 3-minute demo. Keep this open on your phone.

---

## ⏱️ Timeline (minute-by-minute)

| Time | Phase | Task | Done = |
|---|---|---|---|
| 9:00–9:45 | — | Arrive, ID, seat, power, WiFi. Re-run SETUP key checks. | Every key in `.env.local`, blank Vercel deploy works |
| 9:45–11:00 | — | Keynote + opening. Listen for any rule/track tweak → **paste it to me in chat**. Run Senso Hello-World. | You know Senso cold |
| 11:00–11:30 | **1 Scaffold** | Next.js + Vercel blank deploy, `/lib/integrations/` stubs, `.env.example`, one dashboard route. Wire Datadog on a hello call. | Blank app live, Datadog span shows up |
| 11:30–13:00 | **2 Core loop** | Agent loop: Nimble monitor → detect gap → Senso publish → ClickHouse metric. Each step a Datadog span. | One full run logs end-to-end in console |
| 13:00–13:30 | 🍕 | Lunch. Eat. Solo = a bad call at 15:00 sinks you; fuel up. | Brain still works |
| 13:30–14:30 | **3 Dashboard** | Input form + Deploy button → run loop → render gap + live cited.md URL + before/after chart. Dark mode. | Click once → result renders |
| 14:30–15:30 | **4 Polish** | Datadog proof panel, realistic seed data, loading states. THEN x402 paywall if ahead. | Demo looks intentional |
| 15:30–16:30 | **5 Demo prep** 🔒 | **Feature freeze.** Seed clean run, rehearse 3×, record backup screencast, push public repo, write README, submit. | Submitted with 10 min to spare |

**Halfway checkpoint (≈13:00):** is the core loop running? If NO → cut x402 + Datadog now,
simplify to Nimble+Senso+ClickHouse only, protect the 3-sponsor minimum.

**Submit early.** Late submissions may be cut off. Target 16:20, not 16:30.

---

## 🎤 Pitch script (3 min — hits all 5 criteria)

> Dark slides or the live app. Big text. Speak slower than feels natural. ~80% of the slot.

**[HOOK · 15s]**
"Every brand is now described by AI — ChatGPT, Gemini, Perplexity. Most are described wrong.
And every GEO tool on the market does the same thing: it *monitors* and *recommends*. Then
you wait weeks, and you can never prove it worked."

**[PROBLEM · 20s]**
"That's the gap. Monitoring is passive. Recommendations are long-term. The result is
invisible. Nobody closes the loop between 'AI is misrepresenting you' and 'here's the
measurable fix, done automatically.'"

**[SOLUTION · 15s]**
"GhostWriter is an autonomous agent that closes it. You point it at a brand. It monitors,
acts, and measures — by itself. Watch."

**[DEMO · 90s — narrate while it runs itself]**
- *Click Deploy Agent.* "One click. No more input from me from here."
- "It's querying the open web in real time with Nimble — and it just found that BrandX is
  cited in only 1 of 5 AI answers. Its competitor, 4 of 5."
- "Now it's generating grounded, fact-anchored content and publishing it as a citeable
  source with Senso — here's the live URL, an endpoint agents can actually cite." *(open it)*
- "And here's the part nobody else does — it *measures*: narrative-control, the share of AI
  answers sourced from the brand's own truth, tracked in ClickHouse. Watch it climb." *(chart)*
- "Is it a black box? No." *(flip to Datadog)* "Every step is traced — latency, cost,
  decisions, a reliability score. You can audit exactly how the agent thinks."
- *(if x402 built)* "And it monetizes itself — here's another agent paying a micro-fee via
  x402 to read the verified source."

**[SO WHAT · 20s]**
"GhostWriter is the first GEO agent with a *direct, measurable* result and a built-in revenue
model. Today it measures narrative control. The v2 — the business — wires this straight to
real lead and traffic attribution from AI search."

**[CLOSER · 10s]**
"GhostWriter. AI decides what your brand is. Now you write the source it reads."

---

## 🛡️ Demo survival rules

1. Pre-load everything. App open, warmed up, demo brand pre-entered. Zero loading screens you can avoid.
2. Realistic data only. A plausible mid-size brand, real-looking numbers. Never "Competitor A".
3. Backup screencast recorded at ~15:45. If live breaks: "Here's the recording of our test run" — switch in 5s, no apology.
4. Never apologize mid-demo. Narrate past glitches: "and the analysis appears — there it is."
5. Browser zoom ≥125%, dark mode. Judges sit far back.
6. Time it. 3-min slot → rehearse to ~2:30. Leave room for fumbles.

---

## 🧠 Anticipated judge questions

| They ask | You answer |
|---|---|
| "How is this different from existing GEO tools?" | "They monitor and recommend. We're the only one that *acts* — publishes a citeable source — and *measures* the lift. Closed loop, autonomous." |
| "How autonomous is it really?" | "One trigger runs the whole loop — it decides what to check, detects the gap, publishes, and records the metric with no human in between. You saw one click." |
| "How do you measure impact?" | "Narrative control: the share of AI answers sourced from the brand's own ground truth, before vs after, in ClickHouse. v2 ties it to real lead attribution." |
| "Did you build all this today?" | "Yes — fresh repo. I pre-configured API keys and learned the Senso CLI this morning to maximize the 4 build hours." |
| "What's the business model?" | "B2B SaaS for brands, plus the x402 layer — agents pay per query to read verified sources. As AI search grows, that's a real metered revenue stream." |
| "What's the limitation?" | "Today it measures narrative control, not yet end-to-end revenue attribution — that's the v2 moat. And it's tuned for one brand in the demo, not multi-tenant yet." |

---

## ✅ Submission checklist (Devpost)

- [ ] Public GitHub repo pushed, README explains setup + names the 5 sponsor tools used
- [ ] 3-minute demo recording uploaded
- [ ] All Devpost fields filled (inspiration, what it does, how built, sponsors used, challenges)
- [ ] Sponsor tracks: explicitly call out Nimble, ClickHouse, Senso (each has its own prize)
- [ ] Submitted by 16:20

---

## 🆘 If you're stuck during the build

Open the chat and tell me: what broke, the error, and minutes remaining. I'll triage core vs
cuttable and give you the smallest path back to a working demo. Also ping me if Claude Code
does something you don't understand — I'll translate. You've got this. 🥊
