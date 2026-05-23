# SETUP.md — do this BEFORE 11:00 (not during the build)

Two buckets: (A) sponsor accounts/keys the *product* needs, and (B) Claude Code
skills/plugins that make *you* faster. Do A fully. Do B minimally — see the warning.

---

## A. Sponsor accounts + API keys (the product's fuel)

Get every key into `.env.local` this morning so the build never stalls on signup.

| Sponsor | Get | Docs to open now |
|---|---|---|
| **Nimble** | API key (Account Settings → API Keys). Test one scrape/SERP call. | nimbleway.com · github.com/Nimbleway/agent-skills (their MCP) |
| **Senso.ai** | API key + run the Hello-World CLI once (it auto research→KB→publish→GEO monitor). KNOW THIS COLD. | docs.senso.ai (Hello World guide) · senso.ai/cited-md |
| **ClickHouse** | ClickHouse Cloud account (free $300 credits). Spin up an instance. Note host/user/pass. | clickhouse.com/cloud |
| **Datadog** | Account + API key. Locate the LLM Observability SDK for your language. | datadoghq.com (LLM Observability) |
| **x402** | A wallet (EVM or Solana testnet) + the x402 middleware SDK (Node/Python). Last priority. | docs.cdp.coinbase.com/x402 · QuickNode x402 quickstart |
| **Claude API** | Your key (the agent brain). | console.anthropic.com |

`.env.example` to drop in the repo:
```
ANTHROPIC_API_KEY=
NIMBLE_API_KEY=
SENSO_API_KEY=
CLICKHOUSE_HOST=
CLICKHOUSE_USER=
CLICKHOUSE_PASSWORD=
DATADOG_API_KEY=
DATADOG_SITE=datadoghq.com
X402_WALLET_PRIVATE_KEY=
X402_FACILITATOR_URL=
```

**Senso = your single biggest time-saver.** Their CLI does most of the publish loop
automatically. But the prize warns "ingestion alone won't qualify" — so your differentiator
is the autonomous Nimble monitoring + ClickHouse measurement *around* it, not the CLI itself.
Run the Hello-World now so you're not learning it at 13:00.

---

## B. Claude Code skills/plugins to import — MINIMAL, on purpose

**How it works** (verified): a *plugin* bundles skills/agents/hooks/MCP servers. You add a
marketplace (a GitHub repo) once, then install plugins from it. Skills then activate
automatically when their trigger context appears; commands fire on `/slash`.

```bash
# Add a marketplace (GitHub repo), then install a plugin from it:
/plugin marketplace add <github-owner/repo>
/plugin install <plugin-name>@<marketplace-name>
/reload-plugins        # activate after installing
```
The official Anthropic marketplace (`claude-plugins-official`) is available by default.
Manual skill install also works: unzip a SKILL.md folder into `.claude/skills/` (this repo)
or `~/.claude/skills/` (all projects).

### ⚠️ Read this before importing anything

You asked for code-review, design, and token-optimization skills. Honest call for a **solo
4-hour sprint**:

- **Token optimization → skip it today.** It's premature optimization. Your bottleneck is
  shipping a working demo, not token cost. Don't add cognitive load for a non-problem.
- **Heavy design systems → skip.** A good Tailwind prompt + dark mode gets you a clean demo
  faster than wiring a design plugin. The frontend-design guidance below is enough.
- **Every plugin you add injects context and can fire stray triggers.** In a 4h build, a
  noisy toolbox slows you down. Install **at most 2**, this morning, and `/reload-plugins`
  before 11:00. Never install plugins mid-build.

### The 2 worth it (install now, test once)

1. **A code-review agent.** Anthropic ships an automated PR-review plugin (multi-agent,
   confidence-scored to cut false positives) in the official plugin set. Install it and run it
   ONCE near 15:00 as a safety pass over the core loop — not continuously.
   - Browse: `code.claude.com/docs` (Discover plugins) or `claudemarketplaces.com`.
2. **A git/commit helper** (e.g. `commit-commands@anthropics-claude-code`) so commits + the
   final public-repo push are one command. Saves real minutes at submission.

That's it. Resist the rest until after the hackathon.

### MCP note (don't confuse the two layers)

- **MCP in Claude Code** = tools that help *Claude help you code* (e.g. Nimble's MCP so Claude
  can pull live web data while building/testing). Optional, nice for testing the monitor step.
- **APIs in GhostWriter's code** = what the *product* calls at runtime. This is the real
  integration that the judges score. Don't conflate them — the product must call the APIs in
  code, not rely on your editor's MCP.

If you want the Nimble MCP for testing: `/plugin marketplace add Nimbleway/agent-skills` then
install their plugin, authenticate via `/mcp`. Optional — only if it saves time, not as a yak-shave.

---

## C. Frontend design guidance (no plugin needed)

For a projector demo: **dark background, white text** (light themes wash out). Browser zoom
≥125%. One accent color for the "gap/citation" highlights. Big numbers for the
narrative-control score. Generous spacing. No clutter — the judge reads it from 3–10m away.
Tailwind utility classes only; don't hand-roll CSS under time pressure.

---

## D. Logistics (you already know, but)

- Arrive **before 9:00** at Datadog, 620 8th Ave — capacity hits ~9:45, QR code doesn't
  guarantee entry.
- **Government photo ID required** or security can turn you away.
- Laptop charged + charger, HDMI/USB-C adapter, headphones, water.
- Bookmark the Devpost submission page. Public GitHub repo + 3-min recording are required.
