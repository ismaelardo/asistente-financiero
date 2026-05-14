import { NextRequest, NextResponse } from 'next/server';
import {
  getTransactions,
  createTransaction,
  getMonthlyTotals,
  getCategoryBreakdown,
  getCurrentMonthTotals,
} from '@/lib/db/queries/transactions';
import type { CreateTransactionInput, TransactionFilters } from '@/types';

export function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;

  // Aggregated views
  if (p.get('summary') === 'monthly') {
    return NextResponse.json(getMonthlyTotals(Number(p.get('months') ?? 6)));
  }
  if (p.get('summary') === 'categories') {
    const month = p.get('month') ?? new Date().toISOString().substring(0, 7);
    return NextResponse.json(getCategoryBreakdown(month));
  }
  if (p.get('summary') === 'current-month') {
    const month = p.get('month') ?? new Date().toISOString().substring(0, 7);
    return NextResponse.json(getCurrentMonthTotals(month));
  }

  const filters: TransactionFilters = {
    month:    p.get('month')    ?? undefined,
    category: (p.get('category') as TransactionFilters['category']) ?? undefined,
    type:     (p.get('type')     as TransactionFilters['type'])     ?? undefined,
    page:     p.get('page')     ? Number(p.get('page'))     : 1,
    pageSize: p.get('pageSize') ? Number(p.get('pageSize')) : 20,
  };

  return NextResponse.json(getTransactions(filters));
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateTransactionInput;
  const transaction = createTransaction(body);
  return NextResponse.json(transaction, { status: 201 });
}
