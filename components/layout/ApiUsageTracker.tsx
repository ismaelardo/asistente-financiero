'use client';
import { useEffect, useState } from 'react';
import ProgressBar from '@/components/ui/ProgressBar';
import type { MonthlyUsageSummary } from '@/types';

const MONTHLY_LIMIT_USD = 2.0;

export default function ApiUsageTracker() {
  const [data, setData] = useState<MonthlyUsageSummary | null>(null);

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/ai-usage');
      if (res.ok) setData(await res.json());
    } catch {
      // silently ignore network errors
    }
  };

  useEffect(() => {
    fetchUsage();
    // refresh every 30 s so it stays current after an analysis
    const id = setInterval(fetchUsage, 30_000);
    return () => clearInterval(id);
  }, []);

  if (!data) return null;

  const pct = Math.min(100, (data.total_cost_usd / MONTHLY_LIMIT_USD) * 100);
  const color: 'blue' | 'yellow' | 'red' =
    pct >= 80 ? 'red' : pct >= 60 ? 'yellow' : 'blue';
  const totalTokens = data.total_tokens_input + data.total_tokens_output;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-xs font-medium text-gray-500">API IA este mes</p>
        {pct >= 80 && (
          <span className="text-xs text-red-500 font-medium">!</span>
        )}
      </div>

      <ProgressBar value={pct} color={color} height="sm" />

      <div className="flex justify-between text-xs text-gray-400">
        <span>${data.total_cost_usd.toFixed(2)} USD</span>
        <span>/${MONTHLY_LIMIT_USD.toFixed(2)}</span>
      </div>

      <p className="text-xs text-gray-400">
        {(totalTokens / 1000).toFixed(1)}k tokens
      </p>
    </div>
  );
}
