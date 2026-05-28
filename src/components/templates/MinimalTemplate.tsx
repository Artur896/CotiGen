import { QuotationData } from '@/lib/types';
import { PlumbingQuotation } from '@/lib/types/plumbing';

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

export function MinimalTemplate({ data }: { data: QuotationData }) {
  const q = data.quotation as PlumbingQuotation;
  const showPrices = q.showPrices !== false;
  const total = q.isManualTotal && q.manualTotalValue != null ? q.manualTotalValue : q.total;
  const items = q.materials.filter((m) => m.description.trim());
  const alcances = (q.alcances ?? []).filter((a) => a.trim());

  return (
    <div
      style={{
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        background: '#ffffff',
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        padding: '14mm 14mm 10mm',
        boxSizing: 'border-box',
        color: '#111827',
        fontSize: '10pt',
        lineHeight: '1.5',
      }}
    >
      {/* ── TOP HEADER ───────────────────────────────────────── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10mm' }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'top' }}>
              <div style={{ fontSize: '22pt', fontWeight: 800, letterSpacing: '-0.5px', color: '#111827' }}>
                COTIZACIÓN
              </div>
              <div style={{ fontSize: '11pt', color: '#6b7280', marginTop: '2px', fontWeight: 500 }}>
                {data.quotationNumber}
              </div>
            </td>
            <td style={{ verticalAlign: 'top', textAlign: 'right' }}>
              <div style={{ fontSize: '9pt', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Fecha
              </div>
              <div style={{ fontSize: '10pt', color: '#374151', fontWeight: 600, marginTop: '2px' }}>
                {data.date}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── DIVIDER ──────────────────────────────────────────── */}
      <div style={{ borderTop: '2px solid #111827', marginBottom: '8mm' }} />

      {/* ── CLIENTE ──────────────────────────────────────────── */}
      {q.client?.name && (
        <div
          style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '5mm 6mm',
            marginBottom: '8mm',
          }}
        >
          <div style={{ fontSize: '7.5pt', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '3px' }}>
            PARA
          </div>
          <div style={{ fontSize: '12pt', fontWeight: 700, color: '#111827' }}>{q.client.name}</div>
          {q.client.phone && (
            <div style={{ fontSize: '9pt', color: '#6b7280', marginTop: '2px' }}>{q.client.phone}</div>
          )}
          {q.client.address && (
            <div style={{ fontSize: '9pt', color: '#6b7280' }}>{q.client.address}</div>
          )}
        </div>
      )}

      {/* ── DESCRIPCIÓN ──────────────────────────────────────── */}
      {q.descripcion && (
        <div style={{ marginBottom: '7mm' }}>
          <div style={{ fontSize: '7.5pt', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
            DESCRIPCIÓN DEL TRABAJO
          </div>
          <div style={{ fontSize: '9.5pt', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
            {q.descripcion}
          </div>
        </div>
      )}

      {/* ── ALCANCES ─────────────────────────────────────────── */}
      {alcances.length > 0 && (
        <div style={{ marginBottom: '7mm' }}>
          <div style={{ fontSize: '7.5pt', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '5px' }}>
            ALCANCES
          </div>
          {alcances.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', marginBottom: '3px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#374151', marginTop: '6px', flexShrink: 0 }} />
              <div style={{ fontSize: '9.5pt', color: '#374151', lineHeight: '1.5' }}>{a}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── CONCEPTOS ────────────────────────────────────────── */}
      {items.length > 0 && (
        <div style={{ marginBottom: '8mm' }}>
          <div style={{ fontSize: '7.5pt', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
            CONCEPTOS
          </div>

          {/* Table header */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', fontSize: '8pt', fontWeight: 700, color: '#6b7280', padding: '5px 0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Descripción
                </th>
                <th style={{ textAlign: 'center', fontSize: '8pt', fontWeight: 700, color: '#6b7280', padding: '5px 8px', textTransform: 'uppercase', letterSpacing: '0.4px', width: '50px' }}>
                  Cant.
                </th>
                {showPrices && (
                  <>
                    <th style={{ textAlign: 'right', fontSize: '8pt', fontWeight: 700, color: '#6b7280', padding: '5px 8px', textTransform: 'uppercase', letterSpacing: '0.4px', width: '90px' }}>
                      P. Unit.
                    </th>
                    <th style={{ textAlign: 'right', fontSize: '8pt', fontWeight: 700, color: '#6b7280', padding: '5px 0', textTransform: 'uppercase', letterSpacing: '0.4px', width: '90px' }}>
                      Total
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: '1px solid #f3f4f6',
                    background: i % 2 === 1 ? '#fafafa' : '#ffffff',
                  }}
                >
                  <td style={{ padding: '7px 0', fontSize: '9.5pt', color: '#111827', fontWeight: 500 }}>
                    {item.description}
                  </td>
                  <td style={{ padding: '7px 8px', fontSize: '9.5pt', color: '#374151', textAlign: 'center' }}>
                    {item.quantity}
                  </td>
                  {showPrices && (
                    <>
                      <td style={{ padding: '7px 8px', fontSize: '9.5pt', color: '#374151', textAlign: 'right' }}>
                        {fmt(item.unitPrice)}
                      </td>
                      <td style={{ padding: '7px 0', fontSize: '9.5pt', color: '#111827', fontWeight: 600, textAlign: 'right' }}>
                        {fmt(item.quantity * item.unitPrice)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TOTAL ────────────────────────────────────────────── */}
      <div style={{ borderTop: '2px solid #111827', paddingTop: '5mm', marginBottom: '8mm' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ fontSize: '12pt', fontWeight: 800, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                TOTAL
              </td>
              <td style={{ textAlign: 'right', fontSize: '16pt', fontWeight: 800, color: '#111827' }}>
                {fmt(total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── NOTAS ────────────────────────────────────────────── */}
      {q.notas && (
        <div
          style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            padding: '4mm 5mm',
            marginBottom: '6mm',
          }}
        >
          <div style={{ fontSize: '7.5pt', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
            NOTAS
          </div>
          <div style={{ fontSize: '9pt', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
            {q.notas}
          </div>
        </div>
      )}

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '8mm',
          borderTop: '1px solid #e5e7eb',
          fontSize: '8pt',
          color: '#9ca3af',
          textAlign: 'center',
          lineHeight: '1.6',
        }}
      >
        <div>Esta cotización es válida por 15 días naturales a partir de la fecha de emisión.</div>
        <div style={{ marginTop: '2px' }}>Para aceptar, responda a este documento o contáctenos directamente.</div>
      </div>
    </div>
  );
}
