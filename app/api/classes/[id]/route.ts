import { NextRequest, NextResponse } from 'next/server';
import { updateClass, toggleClassPaid, deleteClass, getClassById } from '@/lib/db/queries/classes';
import type { CreateClassInput } from '@/types';

interface Params { params: { id: string } }

export async function PUT(request: NextRequest, { params }: Params) {
  const id = Number(params.id);
  const body = (await request.json()) as Partial<CreateClassInput>;

  // Toggling paid is a dedicated operation — it manages the linked transaction
  if ('paid' in body && Object.keys(body).length === 1) {
    const updated = toggleClassPaid(id);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  }

  const updated = updateClass(id, body);
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export function DELETE(_request: NextRequest, { params }: Params) {
  const id = Number(params.id);
  if (!getClassById(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  deleteClass(id);
  return new NextResponse(null, { status: 204 });
}
