import { formatDate } from './utils';

export function generateCompanyEmailHTML(booking, motorcycles, modelLabel, shortageWarning) {
  const motorcyclesList = motorcycles.length
    ? motorcycles.map((m) => `• ${m.name} (${modelLabel})`).join('<br>')
    : '<span style="color:#DC2626;">⚠️ Ninguna moto asignada — asignación manual requerida.</span>';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
        .container { background: #ffffff; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: ${shortageWarning ? '#7C3AED' : '#F80293'}; color: white; padding: 26px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; text-transform: uppercase; }
        .alert-badge { display: inline-block; background: #E6F802; color: #050507; padding: 6px 14px; font-weight: bold; margin-top: 10px; }
        .content { padding: 26px; }
        .info-box { background: #F9FAFB; border-left: 4px solid #E6F802; padding: 18px; margin: 18px 0; }
        .info-box h3 { margin-top: 0; color: #050507; font-size: 15px; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0; }
        .detail-item { padding: 8px; background: white; border: 1px solid #E5E7EB; }
        .detail-label { font-size: 11px; color: #6B7280; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }
        .detail-value { font-size: 15px; color: #050507; font-weight: 500; }
        .payment-summary { background: #fff8e1; border: 2px solid #E6F802; padding: 18px; margin: 18px 0; }
        .payment-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0e68c; font-size: 16px; font-weight: bold; }
        .shortage-alert { background: #F5F3FF; border: 2px solid #7C3AED; padding: 18px; margin: 18px 0; }
        .shortage-alert h3 { color: #7C3AED; margin-top: 0; }
        .footer { background: #050507; color: white; padding: 18px; text-align: center; font-size: 12px; }
        .timestamp { background: #E5E7EB; padding: 10px; text-align: center; font-size: 12px; color: #6B7280; margin-bottom: 18px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Nueva reserva — ${modelLabel}</h1>
          <div class="alert-badge">${shortageWarning ? '⚠️ FALTA DE MOTOS DISPONIBLES' : 'PAGADA'}</div>
        </div>

        <div class="content">
          <div class="timestamp">
            📅 Recibida: ${new Date().toLocaleString('es-PA', { dateStyle: 'full', timeStyle: 'short' })}
          </div>

          ${shortageWarning ? `
          <div class="shortage-alert">
            <h3>⚠️ Faltan motos por asignar</h3>
            <p>Solo se pudieron asignar automáticamente <strong>${motorcycles.length}</strong> de <strong>${booking.bike_quantity}</strong> moto(s). Asigna el resto manualmente lo antes posible.</p>
          </div>` : ''}

          <div class="info-box">
            <h3>Cliente</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">Nombre completo</div>
                <div class="detail-value">${booking.first_name} ${booking.last_name}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">ID de reserva</div>
                <div class="detail-value" style="font-family: monospace; font-size: 12px;">${booking.id}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Correo</div>
                <div class="detail-value" style="font-size: 13px;"><a href="mailto:${booking.email}">${booking.email}</a></div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Teléfono</div>
                <div class="detail-value"><a href="tel:${booking.phone}">${booking.phone || 'No indicado'}</a></div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Moto</div>
                <div class="detail-value" style="font-size: 13px;">${booking.bike_quantity} × ${modelLabel}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Punto de entrega</div>
                <div class="detail-value" style="font-size: 13px;">${booking.pickup_location || 'Panama City'}</div>
              </div>
            </div>
          </div>

          <div class="info-box">
            <h3>Periodo</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-label">Retiro</div>
                <div class="detail-value">${formatDate(booking.start_date)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Devolución</div>
                <div class="detail-value">${formatDate(booking.end_date)}</div>
              </div>
            </div>
          </div>

          <div class="info-box">
            <strong>🏍️ Motos asignadas:</strong><br>
            ${motorcyclesList}
          </div>

          <div class="payment-summary">
            <div class="payment-row">
              <span>Total pagado en línea:</span>
              <span>$${Number(booking.total_price).toFixed(2)}</span>
            </div>
            <div class="payment-row" style="border-bottom: none;">
              <span>Depósito a cobrar en la entrega:</span>
              <span>$${Number(booking.deposit || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0;"><strong>XOPA Moto Rental</strong> — Notificación automática</p>
          <p style="margin: 8px 0 0 0; opacity: 0.7;">No responder a este correo.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
