import { NextResponse } from 'next/server';
import { getMonthlyUsageSummary } from '@/lib/db/queries/ai-usage';

export function GET() {
  const month = new Date().toISOString().substring(0, 7);
  return NextResponse.json(getMonthlyUsageSummary(month));
}
