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

  return (
    <div className="border border-cyan-500/20 rounded-xl overflow-hidden bg-gradient-to-br from-cyan-500/[0.04] via-zinc-900/40 to-zinc-900/40">
      <div className="px-6 py-4 border-b border-cyan-500/20 flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm uppercase tracking-wide text-zinc-200">Agent payment rail</h2>
          <p className="text-xs text-zinc-400 mt-0.5 max-w-xl">
            Other AI agents pay <span className="text-cyan-300 font-mono">0.01 USDC</span> per query to read your verified citeables. Real <span className="text-cyan-300">x402</span> protocol on <span className="text-cyan-300">Base Sepolia</span>.
          </p>
        </div>
        <span className="text-[10px] font-mono text-zinc-600 px-2 py-0.5 rounded border border-zinc-800">GET /api/query-content</span>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <FlowCard
            n="1"
            icon="◌"
            title="Agent calls endpoint"
            sub="without payment headers"
            active={phase === 'idle'}
            done={phase !== 'idle'}
          />
          <FlowCard
            n="2"
            icon="⚠"
            title="HTTP 402 returned"
            sub="server demands USDC payment"
            active={phase === 'challenged'}
            done={phase === 'paying' || phase === 'unlocked'}
          />
          <FlowCard
            n="3"
            icon="✓"
            title="Pay → unlock"
            sub="USDC settles on-chain → content"
            active={phase === 'paying' || phase === 'unlocked'}
            done={phase === 'unlocked'}
          />
        </div>

        {phase === 'idle' && (
          <button
            onClick={probe}
            className="w-full px-4 py-4 rounded-lg border border-cyan-500/40 bg-cyan-500/[0.08] hover:bg-cyan-500/[0.15] text-cyan-100 font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>▶</span> Simulate an agent calling your endpoint
          </button>
        )}

        {phase === 'challenged' && accepts && (
          <div className="space-y-3">
            <div className="border border-amber-500/30 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-amber-500/[0.08] border-b border-amber-500/20 flex items-baseline justify-between">
                <span className="text-xs font-mono text-amber-200">← HTTP 402 Payment Required</span>
                <span className="text-[10px] font-mono text-amber-500/70">x402 v{challenge?.x402Version ?? 1}</span>
              </div>
              <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono bg-amber-500/[0.02]">
                <Field label="amount" value="0.01 USDC" />
                <Field label="network" value={accepts.network} />
                <Field label="scheme" value={accepts.scheme} />
                <Field label="payTo" value={`${accepts.payTo.slice(0, 6)}…${accepts.payTo.slice(-4)}`} />
              </div>
            </div>
            <button
              onClick={simulatePayment}
              className="w-full px-4 py-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>$</span> Pay 0.01 USDC &amp; unlock
            </button>
            <p className="text-[10px] font-mono text-zinc-500 text-center">
              In production: <span className="text-cyan-400">x402-fetch</span> auto-signs &amp; retries. UI omitted for the buyer.
            </p>
          </div>
        )}

        {phase === 'paying' && (
          <div className="border border-cyan-500/30 rounded-lg p-5 bg-cyan-500/[0.05] flex items-center gap-3 text-sm">
            <span className="size-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-cyan-100">settling on base-sepolia…</span>
          </div>
        )}

        {phase === 'unlocked' && content && (
          <div className="border border-emerald-500/30 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-emerald-500/[0.08] border-b border-emerald-500/20 flex items-baseline justify-between">
              <span className="text-xs font-mono text-emerald-200">← 200 OK · content unlocked</span>
              <span className="text-[10px] font-mono text-emerald-500/70">{content.paidVia}</span>
            </div>
            <pre className="px-4 py-3 text-[11px] font-mono text-emerald-100/90 whitespace-pre-wrap leading-relaxed bg-emerald-500/[0.02]">
              {content.excerpt}…
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function FlowCard({ n, icon, title, sub, active, done }: { n: string; icon: string; title: string; sub: string; active: boolean; done: boolean }) {
  const state = done ? 'done' : active ? 'active' : 'idle';
  const cls = {
    done: 'border-cyan-500/50 bg-cyan-500/[0.08]',
    active: 'border-cyan-500/30 bg-cyan-500/[0.04]',
    idle: 'border-zinc-800 bg-zinc-900/40',
  }[state];
  const iconCls = {
    done: 'bg-cyan-500 text-zinc-950',
    active: 'bg-cyan-500/30 text-cyan-200',
    idle: 'bg-zinc-800 text-zinc-500',
  }[state];

  return (
    <div className={`border rounded-lg p-4 transition-all ${cls}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`size-7 rounded-md flex items-center justify-center text-sm font-mono font-semibold ${iconCls}`}>
          {done ? '✓' : icon}
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">step {n}</span>
      </div>
      <div className={`text-sm font-medium ${done || active ? 'text-zinc-100' : 'text-zinc-400'}`}>{title}</div>
      <div className="text-[11px] text-zinc-500 mt-0.5">{sub}</div>
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
