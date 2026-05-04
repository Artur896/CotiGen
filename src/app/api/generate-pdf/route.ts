import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/lib/pdf';
import { QuotationData } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const data: QuotationData = await req.json();

    const [{ getTemplate }, { renderToStaticMarkup }] = await Promise.all([
      import('@/lib/renderer'),
      import('react-dom/server'),
    ]);

    const componentHtml = renderToStaticMarkup(getTemplate(data));
    
    // Full HTML with Tailwind CDN for styles in Puppeteer
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; }
            .font-serif { font-family: 'DM+Serif+Display', serif; }
            .font-sans { font-family: 'Outfit', sans-serif; }
            @page { margin: 0; }
          </style>
        </head>
        <body class="bg-white">
          ${componentHtml}
        </body>
      </html>
    `;

    const pdfBuffer = await generatePDF(fullHtml);

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="cotizacion-${data.quotationNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error Generando PDF:', error);
    return NextResponse.json({ error: 'Fallo al generar PDF', details: error.message }, { status: 500 });
  }
}
