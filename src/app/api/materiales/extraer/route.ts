import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface ExtractedItem {
  nombre: string;
  cantidad: number;
  unidad: string;
}

const SYSTEM_PROMPT = `Eres un asistente que extrae listas de materiales de plomería/tubería (PVC, CPVC, cobre, etc.) a partir de texto libre, normalmente copiado de un chat de WhatsApp entre plomeros.

Reglas:
- Cada línea del texto suele describir un material: cantidad + nombre/descripción (medida, tipo, material).
- Extrae "cantidad" como número (si no hay número explícito, usa 1).
- Extrae "unidad": usa "pieza" salvo que el texto indique otra unidad (m, kg, l, rollo, caja, etc.).
- "nombre" debe conservar la descripción completa y relevante del material (medida, tipo), limpia de la cantidad y de emojis/relleno.
- Ignora líneas que no sean materiales (saludos, precios totales, comentarios sueltos).
- Responde ÚNICAMENTE JSON válido con esta forma exacta: {"items": [{"nombre": string, "cantidad": number, "unidad": string}]}`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GROQ_API_KEY no configurada en el servidor.' },
      { status: 500 }
    );
  }

  let texto: string;
  try {
    const body = await req.json();
    texto = typeof body?.texto === 'string' ? body.texto.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  if (!texto) {
    return NextResponse.json({ error: 'Falta el texto a procesar.' }, { status: 400 });
  }

  let groqRes: Response;
  try {
    groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: texto },
        ],
      }),
    });
  } catch {
    return NextResponse.json({ error: 'No se pudo contactar a Groq.' }, { status: 502 });
  }

  if (!groqRes.ok) {
    const detail = await groqRes.text().catch(() => '');
    return NextResponse.json(
      { error: `Groq respondió con error (${groqRes.status}).`, detail },
      { status: 502 }
    );
  }

  const data = await groqRes.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    return NextResponse.json({ error: 'Respuesta vacía de Groq.' }, { status: 502 });
  }

  let parsed: { items?: unknown };
  try {
    parsed = JSON.parse(content);
  } catch {
    return NextResponse.json({ error: 'Groq devolvió un JSON inválido.' }, { status: 502 });
  }

  const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
  const items: ExtractedItem[] = rawItems
    .map((raw): ExtractedItem | null => {
      if (!raw || typeof raw !== 'object') return null;
      const r = raw as Record<string, unknown>;
      const nombre = typeof r.nombre === 'string' ? r.nombre.trim() : '';
      if (!nombre) return null;
      const cantidadNum = Number(r.cantidad);
      const cantidad = Number.isFinite(cantidadNum) && cantidadNum > 0 ? cantidadNum : 1;
      const unidad = typeof r.unidad === 'string' && r.unidad.trim() ? r.unidad.trim() : 'pieza';
      return { nombre, cantidad, unidad };
    })
    .filter((i): i is ExtractedItem => i !== null);

  if (items.length === 0) {
    return NextResponse.json(
      { error: 'No se detectaron materiales en el texto.' },
      { status: 422 }
    );
  }

  return NextResponse.json({ items });
}
