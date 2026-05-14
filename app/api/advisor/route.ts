import { NextResponse } from 'next/server';
import { callClaude } from '@/lib/anthropic/client';
import { buildFinancialAnalysisPrompt } from '@/lib/anthropic/prompts';
import { getLastNMonthsMetrics } from '@/lib/db/queries/transactions';
import { getDebts } from '@/lib/db/queries/debts';
import { getGoals } from '@/lib/db/queries/goals';
import { getRecentAnalyses } from '@/lib/db/queries/ai-usage';
import type { AiUsage } from '@/types';

export async function GET() {
  return NextResponse.json(getRecentAnalyses(5));
}

export async function POST() {
  try {
    const monthlyMetrics = getLastNMonthsMetrics(3);
    const debts = getDebts();
    const goals = getGoals();

    const prompt = buildFinancialAnalysisPrompt({ monthlyMetrics, debts, goals });
    const { text, usage } = await callClaude(prompt);

    return NextResponse.json({ text, usage } satisfies { text: string; usage: AiUsage });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
