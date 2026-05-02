import { NextRequest, NextResponse } from 'next/server';
import { getListById, updateList, deleteList } from '@/lib/db/materials';
import { CreateListInput } from '@/lib/types/material';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const list = getListById(id);
  if (!list) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(list);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json() as Partial<CreateListInput>;

  const updated = updateList(id, {
    ...(body.cliente !== undefined && { cliente: body.cliente.trim() }),
    ...(body.telefono !== undefined && { telefono: body.telefono.trim() }),
    ...(body.fecha !== undefined && { fecha: body.fecha }),
    ...(body.notas !== undefined && { notas: body.notas.trim() }),
    ...(body.items !== undefined && { items: body.items }),
  });

  if (!updated) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const deleted = deleteList(id);
  if (!deleted) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  return NextResponse.json({ success: true });
}
