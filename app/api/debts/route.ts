import { NextRequest, NextResponse } from 'next/server';
import { getDebts, createDebt } from '@/lib/db/queries/debts';
import type { CreateDebtInput } from '@/types';

export function GET() {
  return NextResponse.json(getDebts());
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateDebtInput;
  const debt = createDebt(body);
  return NextResponse.json(debt, { status: 201 });
}
