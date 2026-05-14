import Anthropic from '@anthropic-ai/sdk';
import { recordAiUsage } from '@/lib/db/queries/ai-usage';
import type { AiUsage } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function callClaude(
  prompt: string,
  analysisType = 'financial_analysis'
): Promise<{ text: string; usage: AiUsage }> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as Anthropic.TextBlock).text)
    .join('');

  const usage = recordAiUsage(
    response.usage.input_tokens,
    response.usage.output_tokens,
    analysisType,
    text
  );

  return { text, usage };
}
