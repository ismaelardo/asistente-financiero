import { NextRequest, NextResponse } from 'next/server';
import { getGoals, createGoal } from '@/lib/db/queries/goals';
import type { CreateGoalInput } from '@/types';

export function GET() {
  return NextResponse.json(getGoals());
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateGoalInput;
  const goal = createGoal(body);
  return NextResponse.json(goal, { status: 201 });
}
