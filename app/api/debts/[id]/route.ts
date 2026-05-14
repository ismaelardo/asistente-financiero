import { NextRequest, NextResponse } from 'next/server';
import { updateDebt, deleteDebt, getDebtById } from '@/lib/db/queries/debts';
import type { CreateDebtInput } from '@/types';

interface Params { params: { id: string } }

export async function PUT(request: NextRequest, { params }: Params) {
  const id = Number(params.id);
  const body = (await request.json()) as Partial<CreateDebtInput>;
  const updated = updateDebt(id, body);
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export function DELETE(_request: NextRequest, { params }: Params) {
  const id = Number(params.id);
  if (!getDebtById(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  deleteDebt(id);
  return new NextResponse(null, { status: 204 });
}
