import { NextRequest, NextResponse } from 'next/server';
import {
  getClasses,
  getClassesByDateRange,
  createClass,
  getMonthlyClassSummary,
  getWeeklyClassIncome,
  getUniqueStudents,
} from '@/lib/db/queries/classes';
import type { CreateClassInput } from '@/types';

export function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;

  if (p.get('summary') === 'monthly') {
    const month    = p.get('month') ?? new Date().toISOString().substring(0, 7);
    const uperOnly = p.get('uper') === '1';
    return NextResponse.json(getMonthlyClassSummary(month, uperOnly));
  }
  if (p.get('summary') === 'weekly-income') {
    return NextResponse.json(getWeeklyClassIncome(Number(p.get('weeks') ?? 4)));
  }
  if (p.get('summary') === 'students') {
    return NextResponse.json(getUniqueStudents());
  }

  const start = p.get('start');
  const end = p.get('end');
  if (start && end) {
    return NextResponse.json(getClassesByDateRange(start, end));
  }
  const uperOnly = p.get('uper') === '1';
  return NextResponse.json(getClasses(uperOnly));
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateClassInput;
  const session = createClass(body);
  return NextResponse.json(session, { status: 201 });
}
