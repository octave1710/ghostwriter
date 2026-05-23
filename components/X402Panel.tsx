'use client';

import { useState } from 'react';
import type { PublishResult } from '@/lib/integrations/senso';

type ChallengeShape = {
  x402Version?: number;
  error?: string;
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
  const [phase, setPhase] = useState<'idle' | 'challenged' | 'paying' | 'unlocked' | 'error'>('idle');
  const [challenge, setChallenge] = useState<ChallengeShape | null>(null);
  const [content, setContent] = useState<{ excerpt: string; paidVia: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const featured = articles[0] ?? null;

  async function probe() {
    setPhase('idle');
    setError(null);
    setChallenge(null);
    setContent(null);
    if (!featured) return;

    try {
      const res = await fetch(`/api/query-content?id=${encodeURIComponent(featured.contentId)}`);
      if (res.status === 402) {
        setChallenge(await res.json());
        setPhase('challenged');
      } else if (res.ok) {
        const data = await res.json();
        setContent({ excerpt: data.excerpt, paidVia: data.paidVia });
        setPhase('unlocked');
      } else {
        setError(`unexpected ${res.status}`);
        setPhase('error');
      }
    } catch (err) {
      setError((err as Error).message);
      setPhase('error');
    }
  }

  // Simulated payment — would be replaced by x402-fetch / x402-axios in a real buyer agent.
  async function simulatePayment() {
    setPhase('paying');
    await new Promise(r => setTimeout(r, 900));
    setContent({
      excerpt: featured?.markdown.slice(0, 320) ?? '',
      paidVia: 'x402 · 0.01 USDC · base-sepolia · (simulated tx)',
    });
    setPhase('unlocked');
  }

  if (!featured) return null;

  const accepts = challenge?.accepts?.[0];

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/40">
      <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <h2 className="text-sm uppercase tracking-wide text-zinc-300">Agent payment rail · x402</h2>
          <span className="text-xs font-mono text-zinc-500">{'GET /api/query-content'}</span>
        </div>
        <p className="text-sm text-zinc-400">
          Other agents pay a micro-fee per query to access verified GhostWriter sources. Real x402 paywall on Base Sepolia testnet.
        </p>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <Step
            label="01 · probe"
            active={phase === 'idle'}
            done={phase !== 'idle' && phase !== 'error'}
            sub="agent hits the URL without payment"
          />
          <Step
            label="02 · 402 challenge"
            active={phase === 'challenged'}
            done={phase === 'paying' || phase === 'unlocked'}
            sub="server returns payment requirements"
          />
          <Step
            label="03 · pay + unlock"
            active={phase === 'paying' || phase === 'unlocked'}
            done={phase === 'unlocked'}
            sub="0.01 USDC settles → content"
          />
        </div>

        {phase === 'idle' && (
          <button
            onClick={probe}
            className="w-full px-4 py-3 rounded-md border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-100 font-mono text-sm transition-colors"
          >
            simulate agent → curl /api/query-content?id={featured.contentId.slice(0, 8)}…
          </button>
        )}

        {phase === 'challenged' && challenge && (
          <div className="space-y-3">
            <div className="border border-amber-500/30 rounded-lg p-4 bg-amber-500/[0.04]">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300">HTTP 402 · Payment Required</span>
                <span className="text-[10px] font-mono text-amber-500/60">x402 v{challenge.x402Version ?? 1}</span>
              </div>
              {accepts && (
                <div className="space-y-1 text-[11px] font-mono text-amber-100">
                  <div>scheme: <span className="text-amber-300">{accepts.scheme}</span></div>
                  <div>network: <span className="text-amber-300">{accepts.network}</span></div>
                  <div>price: <span className="text-amber-300">{accepts.maxAmountRequired} (atomic units)</span></div>
                  <div>payTo: <span className="text-amber-300 truncate inline-block max-w-[60ch]">{accepts.payTo}</span></div>
                  {accepts.description && <div className="text-amber-100/70 pt-1 italic">{accepts.description}</div>}
                </div>
              )}
            </div>
            <button
              onClick={simulatePayment}
              className="w-full px-4 py-3 rounded-md bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-sm transition-colors"
            >
              Pay 0.01 USDC and unlock content
            </button>
            <p className="text-[10px] font-mono text-zinc-600 text-center">
              In a real agent, x402-fetch or x402-axios auto-signs &amp; retries — no UI prompt. We simulate the settlement here to keep the flow visible.
            </p>
          </div>
        )}

        {phase === 'paying' && (
          <div className="border border-cyan-500/30 rounded-lg p-4 bg-cyan-500/[0.04] text-sm font-mono text-cyan-100 flex items-center gap-3">
            <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
            settling on base-sepolia…
          </div>
        )}

        {phase === 'unlocked' && content && (
          <div className="border border-emerald-500/30 rounded-lg p-4 bg-emerald-500/[0.04] space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-300">200 OK · content unlocked</span>
              <span className="text-[10px] font-mono text-emerald-500/70">{content.paidVia}</span>
            </div>
            <pre className="text-[11px] font-mono text-emerald-100/90 whitespace-pre-wrap leading-relaxed">{content.excerpt}…</pre>
          </div>
        )}

        {phase === 'error' && (
          <p className="text-sm font-mono text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}

function Step({ label, active, done, sub }: { label: string; active: boolean; done: boolean; sub: string }) {
  const cls = done
    ? 'border-cyan-500/40 bg-cyan-500/[0.08] text-cyan-100'
    : active
      ? 'border-cyan-500/30 bg-cyan-500/[0.04] text-cyan-200'
      : 'border-zinc-800 bg-zinc-900/40 text-zinc-500';
  return (
    <div className={`border rounded-lg p-3 ${cls}`}>
      <div className="text-[10px] uppercase tracking-wider">{label}</div>
      <div className="text-[10px] text-zinc-500 mt-1 leading-snug">{sub}</div>
    </div>
  );
}
