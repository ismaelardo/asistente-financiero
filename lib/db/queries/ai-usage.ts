import { getDb } from '../index';
import type { AiUsage, MonthlyUsageSummary } from '@/types';

// Haiku pricing: $0.80 per million input tokens, $4.00 per million output tokens
const PRICE_INPUT = 0.8 / 1_000_000;
const PRICE_OUTPUT = 4.0 / 1_000_000;

export function recordAiUsage(
  tokensInput: number,
  tokensOutput: number,
  analysisType: string,
  responseText: string
): AiUsage {
  const db = getDb();
  const now = new Date().toISOString();
  const month = now.substring(0, 7);
  const costUsd = tokensInput * PRICE_INPUT + tokensOutput * PRICE_OUTPUT;

  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO ai_usage (timestamp, tokens_input, tokens_output, cost_usd, analysis_type, month, response_text)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(now, tokensInput, tokensOutput, costUsd, analysisType, month, responseText);

  return getAiUsageById(lastInsertRowid as number)!;
}

export function getAiUsageById(id: number): AiUsage | undefined {
  return getDb().prepare('SELECT * FROM ai_usage WHERE id = ?').get(id) as AiUsage | undefined;
}

export function getMonthlyUsageSummary(month: string): MonthlyUsageSummary {
  const result = getDb()
    .prepare(
      `SELECT
         month,
         COALESCE(SUM(tokens_input),  0) as total_tokens_input,
         COALESCE(SUM(tokens_output), 0) as total_tokens_output,
         COALESCE(SUM(cost_usd),      0) as total_cost_usd
       FROM ai_usage
       WHERE month = ?
       GROUP BY month`
    )
    .get(month) as MonthlyUsageSummary | undefined;

  return result ?? {
    month,
    total_tokens_input: 0,
    total_tokens_output: 0,
    total_cost_usd: 0,
  };
}

export function getRecentAnalyses(limit = 5): AiUsage[] {
  return getDb()
    .prepare(
      `SELECT * FROM ai_usage
       WHERE response_text IS NOT NULL
       ORDER BY timestamp DESC
       LIMIT ?`
    )
    .all(limit) as AiUsage[];
}
