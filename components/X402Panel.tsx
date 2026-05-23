'use client';

import { useState } from 'react';
import type { PublishResult } from '@/lib/integrations/senso';

type ChallengeShape = {
  x402Version?: number;
  accepts?: Array<{
    scheme: string;
    network: string;
    maxAmountRequired: string;
    asset: string;
    payTo: string;
    description?: string;
  }>;
};

const PRICE_PER_QUERY = 0.01; // USDC
const QUERIES_PER_DAY_LOW = 50;
const QUERIES_PER_DAY_HIGH = 500;

export function X402Panel({ articles }: { articles: PublishResult[] }) {
  const [phase, setPhase] = useState<'idle' | 'challenged' | 'paying' | 'unlocked'>('idle');
  const [challenge, setChallenge] = useState<ChallengeShape | null>(null);
  const [content, setContent] = useState<{ excerpt: string; paidVia: string } | null>(null);

  const featured = articles[0] ?? null;

  async function probe() {
    if (!featured) return;
    const res = await fetch(`/api/query-content?id=${encodeURIComponent(featured.contentId)}`);
    if (res.status === 402) {
      setChallenge(await res.json());
      setPhase('challenged');
    }
  }

  async function simulatePayment() {
    setPhase('paying');
    await new Promise(r => setTimeout(r, 1100));
    setContent({
      excerpt: featured?.markdown.slice(0, 240) ?? '',
      paidVia: 'x402 · 0.01 USDC · base-sepolia',
    });
    setPhase('unlocked');
  }

  if (!featured) return null;

  const accepts = challenge?.accepts?.[0];

  const monthlyLow = (PRICE_PER_QUERY * QUERIES_PER_DAY_LOW * 30 * articles.length).toFixed(0);
  const monthlyHigh = (PRICE_PER_QUERY * QUERIES_PER_DAY_HIGH * 30 * articles.length).toFixed(0);

  return (
    <div className="border border-cyan-500/25 rounded-xl overflow-hidden bg-gradient-to-br from-cyan-500/[0.06] via-zinc-900/40 to-zinc-900/40">
      <div className="px-6 py-4 border-b border-cyan-500/20 flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm uppercase tracking-wide text-zinc-100">YOU earn revenue · agents pay you per read</h2>
          <p className="text-xs text-zinc-300 mt-0.5 max-w-xl">
            Each citeable you publish is paywalled. <span className="text-cyan-300">YOU</span> get paid <span className="text-cyan-300 font-mono">0.01 USDC</span> every time another AI agent reads it. New revenue line + credibility signal back to AI engines.
          </p>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded border border-zinc-700">GET /api/query-content</span>
      </div>

      {/* Revenue projection */}
      <div className="px-6 py-4 border-b border-cyan-500/15 bg-cyan-500/[0.04]">
        <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-200/80 mb-2">Revenue projection · {articles.length} citeable{articles.length === 1 ? '' : 's'} live</div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <RevCell label="per read" value="$0.01" sub="USDC · base-sepolia" />
          <RevCell label="per month (50 reads/day)" value={`$${monthlyLow}`} sub={`${QUERIES_PER_DAY_LOW * 30 * articles.length} reads`} accent />
          <RevCell label="per month (500 reads/day)" value={`$${monthlyHigh}`} sub={`${QUERIES_PER_DAY_HIGH * 30 * articles.length} reads`} accent />
        </div>
        <p className="text-[10px] font-mono text-zinc-400 mt-3 leading-relaxed">
          Compounds: more citeables → more queries you own → more daily reads → more revenue. Settlement automatic, on-chain, 0 manual ops.
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <FlowCard n="1" icon="◌" title="Buyer agent calls your endpoint" sub="without payment headers" active={phase === 'idle'} done={phase !== 'idle'} />
          <FlowCard n="2" icon="⚠" title="HTTP 402 returned" sub="server quotes 0.01 USDC" active={phase === 'challenged'} done={phase === 'paying' || phase === 'unlocked'} />
          <FlowCard n="3" icon="$" title="USDC paid → content unlocked" sub="0.01 USDC lands in YOUR wallet" active={phase === 'paying' || phase === 'unlocked'} done={phase === 'unlocked'} />
        </div>

        {phase === 'idle' && (
          <button
            onClick={probe}
            className="w-full px-4 py-4 rounded-lg border border-cyan-500/40 bg-cyan-500/[0.1] hover:bg-cyan-500/[0.18] text-cyan-100 font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>▶</span> See what happens when an agent calls your endpoint
          </button>
        )}

        {phase === 'challenged' && accepts && (
          <div className="space-y-3">
            <div className="border border-amber-500/30 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-amber-500/[0.1] border-b border-amber-500/20 flex items-baseline justify-between">
                <span className="text-xs font-mono text-amber-100">← HTTP 402 Payment Required</span>
                <span className="text-[10px] font-mono text-amber-400/80">x402 v{challenge?.x402Version ?? 1}</span>
              </div>
              <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono bg-amber-500/[0.03]">
                <Field label="amount" value="0.01 USDC" />
                <Field label="network" value={accepts.network} />
                <Field label="scheme" value={accepts.scheme} />
                <Field label="paid to YOU" value={`${accepts.payTo.slice(0, 6)}…${accepts.payTo.slice(-4)}`} />
              </div>
            </div>
            <button
              onClick={simulatePayment}
              className="w-full px-4 py-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>$</span> Simulate the buyer paying 0.01 USDC
            </button>
            <p className="text-[10px] font-mono text-zinc-400 text-center">
              In production: <span className="text-cyan-300">x402-fetch</span> in the buyer agent auto-signs &amp; retries. UI omitted for the buyer.
            </p>
          </div>
        )}

        {phase === 'paying' && (
          <div className="border border-cyan-500/30 rounded-lg p-5 bg-cyan-500/[0.06] flex items-center gap-3 text-sm">
            <span className="size-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-cyan-100">settling 0.01 USDC on base-sepolia → your wallet…</span>
          </div>
        )}

        {phase === 'unlocked' && content && (
          <div className="border border-emerald-500/30 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-emerald-500/[0.1] border-b border-emerald-500/20 flex items-baseline justify-between">
              <span className="text-xs font-mono text-emerald-100">✓ 200 OK · agent paid · content unlocked</span>
              <span className="text-[10px] font-mono text-emerald-400/80">{content.paidVia}</span>
            </div>
            <pre className="px-4 py-3 text-[11px] font-mono text-emerald-100 whitespace-pre-wrap leading-relaxed bg-emerald-500/[0.02]">
              {content.excerpt}…
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function RevCell({ label, value, sub, accent = false }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">{label}</div>
      <div className={`text-2xl font-mono font-light tabular-nums ${accent ? 'text-cyan-200' : 'text-zinc-100'}`}>{value}</div>
      <div className="text-[10px] font-mono text-zinc-500">{sub}</div>
    </div>
  );
}

function FlowCard({ n, icon, title, sub, active, done }: { n: string; icon: string; title: string; sub: string; active: boolean; done: boolean }) {
  const state = done ? 'done' : active ? 'active' : 'idle';
  const cls = {
    done: 'border-cyan-500/50 bg-cyan-500/[0.1]',
    active: 'border-cyan-500/30 bg-cyan-500/[0.05]',
    idle: 'border-zinc-800 bg-zinc-900/40',
  }[state];
  const iconCls = {
    done: 'bg-cyan-500 text-zinc-950',
    active: 'bg-cyan-500/30 text-cyan-200',
    idle: 'bg-zinc-800 text-zinc-400',
  }[state];

  return (
    <div className={`border rounded-lg p-4 transition-all ${cls}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`size-7 rounded-md flex items-center justify-center text-sm font-mono font-semibold ${iconCls}`}>
          {done ? '✓' : icon}
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">step {n}</span>
      </div>
      <div className={`text-sm font-medium ${done || active ? 'text-zinc-50' : 'text-zinc-300'}`}>{title}</div>
      <div className="text-[11px] text-zinc-400 mt-0.5">{sub}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="text-amber-200 truncate">{value}</div>
    </div>
  );
}
