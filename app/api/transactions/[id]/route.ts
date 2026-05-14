import { NextRequest, NextResponse } from 'next/server';
import { updateTransaction, deleteTransaction, getTransactionById } from '@/lib/db/queries/transactions';
import type { CreateTransactionInput } from '@/types';

interface Params { params: { id: string } }

export async function PUT(request: NextRequest, { params }: Params) {
  const id = Number(params.id);
  const body = (await request.json()) as Partial<CreateTransactionInput>;
  const updated = updateTransaction(id, body);
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export function DELETE(_request: NextRequest, { params }: Params) {
  const id = Number(params.id);
  if (!getTransactionById(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  deleteTransaction(id);
  return new NextResponse(null, { status: 204 });
}
