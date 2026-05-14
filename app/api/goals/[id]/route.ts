import { NextRequest, NextResponse } from 'next/server';
import { updateGoal, deleteGoal, getGoalById } from '@/lib/db/queries/goals';
import type { CreateGoalInput } from '@/types';

interface Params { params: { id: string } }

export async function PUT(request: NextRequest, { params }: Params) {
  const id = Number(params.id);
  const body = (await request.json()) as Partial<CreateGoalInput>;
  const updated = updateGoal(id, body);
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export function DELETE(_request: NextRequest, { params }: Params) {
  const id = Number(params.id);
  if (!getGoalById(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  deleteGoal(id);
  return new NextResponse(null, { status: 204 });
}
