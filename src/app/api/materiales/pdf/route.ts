import { NextRequest, NextResponse } from 'next/server';
import { MaterialList } from '@/lib/types/material';

export const runtime = 'nodejs';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function buildHtml(list: MaterialList): string {
  const rows = list.items.map((item) => `
    <tr>
      <td class="qty">${item.cantidad}</td>
      <td class="name">${item.nombre}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
      font-size: 13px;
      color: #111;
      background: #fff;
      padding: 56px 64px;
    }

    .title {
      font-size: 26px;
      font-weight: 600;
      color: #0a0a0a;
      letter-spacing: -0.5px;
      margin-bottom: 6px;
    }

    .date {
      font-size: 11px;
      color: #555;
      letter-spacing: 0.3px;
      margin-bottom: 40px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    thead th {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #333;
      padding: 0 0 10px 0;
      text-align: left;
      border-bottom: 1px solid #222;
    }


    tbody tr { border-bottom: 1px solid #e0e0e0; }
    tbody tr:last-child { border-bottom: none; }

    td {
      padding: 12px 0;
      vertical-align: middle;
    }

    td.qty  { width: 56px; color: #333; font-size: 12px; font-weight: 600; text-align: center; }
    td.name { font-weight: 500; color: #0a0a0a; border-left: 1px solid #ccc; padding-left: 24px; }

    .notes {
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
      font-size: 12px;
      color: #333;
      line-height: 1.6;
    }

    .notes-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #555;
      margin-bottom: 6px;
    }

    .count {
      margin-top: 32px;
      font-size: 11px;
      color: #777;
      text-align: right;
    }
  </style>
</head>
<body>

  <div class="title">Lista de materiales</div>
  <div class="date">${formatDateTime(list.createdAt)}</div>

  <table>
    <thead>
      <tr>
        <th style="text-align:center">Cant.</th>
        <th>Material</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  ${list.notas ? `
  <div class="notes">
    <div class="notes-label">Notas</div>
    ${list.notas}
  </div>` : ''}

  <div class="count">${list.items.length} material${list.items.length !== 1 ? 'es' : ''}</div>

</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const list = await req.json() as MaterialList;

  const chromium = (await import('@sparticuz/chromium')).default;
  const puppeteer = (await import('puppeteer-core')).default;

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(buildHtml(list), { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      printBackground: true,
    });
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="lista-materiales.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}
