import { formatDate } from './utils';
import { siteConfig } from '@/lib/site-config';

// Xopa charges the full rental total online (no 50/50 down-payment split like
// Overland — see plan notes) and doesn't process a card-held security
// deposit yet, so this template has no "remaining balance" line; the deposit
// is flagged as collected in person at pickup instead.
//
// Written in Spanish — Xopa's primary market — unlike Overland's English-only
// templates.
export function generateCustomerEmailHTML(booking, motorcycles, modelLabel) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, Helvetica, sans-serif; line-height: 1.5; color: #050507; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f3f3; }
        .email-container { background: #ffffff; overflow: hidden; }
        .header { background: #F80293; color: #ffffff; padding: 36px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.03em; }
        .content { padding: 32px 30px; }
        .intro-text { text-align: center; font-size: 17px; color: #050507; margin-bottom: 26px; }
        .section { margin: 22px 0; padding: 18px; background: #f9f9f9; border-left: 4px solid #E6F802; }
        .section h2 { color: #050507; font-size: 15px; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 0; margin-bottom: 12px; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e5e5; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-weight: 600; color: #666; }
        .detail-value { color: #050507; text-align: right; font-weight: 600; }
        .highlight { background: #E6F802; color: #050507; padding: 3px 10px; font-weight: 700; }
        .warning { background: #fff8e1; border-left: 4px solid #F80293; padding: 18px; margin: 22px 0; }
        .warning ul { margin: 10px 0 0 0; padding-left: 20px; }
        .warning li { margin: 6px 0; }
        .footer { background: #050507; color: #ebebeb; padding: 26px; text-align: center; }
        @media only screen and (max-width: 600px) {
          body { padding: 10px; }
          .header, .content, .footer { padding: 22px 18px; }
          .detail-row { flex-direction: column; gap: 4px; }
          .detail-value { text-align: left; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>🏍️ Reserva confirmada</h1>
        </div>

        <div class="content">
          <div class="intro-text">
            <strong>¡Gracias por tu reserva, ${booking.first_name}!</strong><br>
            Tu ${modelLabel} está lista.<br>
            <span style="font-size: 14px; color: #666; margin-top: 8px; display: block;">
              Casco, llaves, ciudad.
            </span>
          </div>

          <div class="section">
            <h2>Detalles de la reserva</h2>
            <div class="detail-row">
              <span class="detail-label">Referencia:</span>
              <span class="detail-value"><code style="font-size: 11px;">${booking.id}</code></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Nombre:</span>
              <span class="detail-value">${booking.first_name} ${booking.last_name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Moto:</span>
              <span class="detail-value">${booking.bike_quantity} × ${modelLabel}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Punto de entrega:</span>
              <span class="detail-value">${booking.pickup_location || 'Panama City'}</span>
            </div>
          </div>

          <div class="section">
            <h2>Periodo de alquiler</h2>
            <div class="detail-row">
              <span class="detail-label">Retiro:</span>
              <span class="detail-value">${formatDate(booking.start_date)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Devolución:</span>
              <span class="detail-value">${formatDate(booking.end_date)}</span>
            </div>
          </div>

          <div class="section">
            <h2>Pago</h2>
            <div class="detail-row">
              <span class="detail-label">Total del alquiler:</span>
              <span class="detail-value"><span class="highlight">$${Number(booking.total_price).toFixed(2)} PAGADO ✓</span></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Depósito de garantía (en la entrega):</span>
              <span class="detail-value">$${Number(booking.deposit || 0).toFixed(2)}</span>
            </div>
          </div>

          <div class="warning">
            <strong>⚠️ Antes de venir a recoger tu moto</strong>
            <ul>
              <li>Licencia de conducir motos vigente</li>
              <li>Documento de identidad o pasaporte</li>
              <li>Depósito de garantía reembolsable: <strong>$${Number(booking.deposit || 0).toFixed(2)}</strong> (efectivo o tarjeta, en el punto de entrega)</li>
              <li>Llega <strong>15 minutos antes</strong> de la hora acordada</li>
            </ul>
          </div>

          <p style="text-align:center; margin-top: 28px;">
            ¿Alguna duda? Escríbenos por WhatsApp: <a href="${siteConfig.whatsappLink}" style="color:#F80293; font-weight:700;">${siteConfig.phone}</a>
          </p>
        </div>

        <div class="footer">
          <p style="font-weight: 900; font-size: 20px; margin: 0 0 6px 0; color: #E6F802; text-transform: uppercase;">XOPA Moto Rental</p>
          <p style="margin: 0; font-size: 12px; opacity: 0.8;">${siteConfig.address}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
