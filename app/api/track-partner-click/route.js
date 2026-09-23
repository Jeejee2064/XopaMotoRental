import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { siteConfig, acomodoRentals } from '@/lib/site-config';
import { escapeHtml } from '@/lib/emails/utils';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);

// Known placements of the Acomodo Rentals link. Keeping this as an allowlist
// (rather than trusting whatever string the client sends) means the admin
// email can't be used to inject arbitrary content via the `source` field.
const KNOWN_SOURCES = new Set(['how-it-works-stay']);

export async function POST(request) {
  let source = 'unknown';
  try {
    const body = await request.json();
    if (typeof body?.source === 'string' && KNOWN_SOURCES.has(body.source)) {
      source = body.source;
    }
  } catch {
    // Malformed body — still record the click with source "unknown".
  }

  // Deliberately not logging IP/User-Agent here — this is a best-effort
  // click notification, not visitor analytics, and those are personal data
  // under GDPR that the site's privacy policy doesn't currently disclose.
  const referer = request.headers.get('referer') || 'unknown';
  const timestamp = new Date().toLocaleString('es-PA', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'America/Panama'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif; color:#333; max-width:600px; margin:0 auto;">
      <div style="background:#050507; color:#fff; padding:20px; text-align:center;">
        <h2 style="margin:0;">🔗 Clic vers Acomodo Rentals</h2>
      </div>
      <table cellpadding="10" style="width:100%; border-collapse:collapse;">
        <tr style="background:#F9FAFB;"><td><strong>Site</strong></td><td>${escapeHtml(siteConfig.companyName)}</td></tr>
        <tr><td><strong>Emplacement du lien</strong></td><td>${escapeHtml(source)}</td></tr>
        <tr style="background:#F9FAFB;"><td><strong>Page d'origine</strong></td><td>${escapeHtml(referer)}</td></tr>
        <tr><td><strong>Destination</strong></td><td>${escapeHtml(acomodoRentals.href)}</td></tr>
        <tr style="background:#F9FAFB;"><td><strong>Heure (America/Panama)</strong></td><td>${escapeHtml(timestamp)}</td></tr>
      </table>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [siteConfig.adminNotificationEmail],
      subject: `🔗 Clic vers Acomodo Rentals — ${source}`,
      html
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Partner click tracking email failed:', err);
    // Tracking is best-effort — never surface this as an error to the visitor.
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
