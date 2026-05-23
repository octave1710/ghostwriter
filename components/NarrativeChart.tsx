'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export type SeriesPoint = {
  run_id: string;
  owned_ratio: number;
  ts: string;
};

export function NarrativeChart({ series }: { series: SeriesPoint[] }) {
  if (!series.length) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-600 font-mono text-sm">
        No data yet. Run the agent or seed the table.
      </div>
    );
  }

  // Convert to chart-friendly shape; mark the most recent run as the "after" point.
  const data = series.map((p, idx) => ({
    label: p.run_id.startsWith('before-') ? `T-${series.length - idx}` : 'NOW',
    ratio: Math.round((p.owned_ratio ?? 0) * 100),
    isLive: !p.run_id.startsWith('before-'),
  }));

  const liveStart = data.findIndex(d => d.isLive);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 8 }}>
        <CartesianGrid stroke="rgb(39 39 42 / 0.6)" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          stroke="rgb(113 113 122)"
          fontSize={11}
          tickLine={false}
          axisLine={{ stroke: 'rgb(39 39 42)' }}
        />
        <YAxis
          stroke="rgb(113 113 122)"
          fontSize={11}
          tickLine={false}
          axisLine={{ stroke: 'rgb(39 39 42)' }}
          domain={[0, 100]}
          tickFormatter={v => `${v}%`}
        />
        <Tooltip
          cursor={{ stroke: 'rgb(52 211 153)', strokeWidth: 1, strokeDasharray: '3 3' }}
          contentStyle={{
            background: 'rgb(24 24 27)',
            border: '1px solid rgb(63 63 70)',
            borderRadius: 6,
            fontFamily: 'ui-monospace, monospace',
            fontSize: 12,
          }}
          formatter={(v) => [`${v}%`, 'narrative control']}
        />
        {liveStart > 0 && (
          <ReferenceLine x={data[liveStart].label} stroke="rgb(52 211 153)" strokeDasharray="2 4" label={{ value: 'agent deployed', position: 'top', fill: 'rgb(52 211 153)', fontSize: 10 }} />
        )}
        <Line
          type="monotone"
          dataKey="ratio"
          stroke="rgb(52 211 153)"
          strokeWidth={2}
          dot={{ r: 3, fill: 'rgb(52 211 153)', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          isAnimationActive
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
