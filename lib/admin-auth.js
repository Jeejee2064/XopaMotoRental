// Admin session helpers — cookie-based, HMAC-signed session token.
//
// Ported from Overland Motorcycles' lib/admin-auth.js. Xopa has a single
// admin role (unlike Overland's admin/coronado split, which exists there to
// scope a second location's staff to their own bookings) — Xopa is one
// location/one model for now, so there's nothing to scope. The `role` field
// is kept in the token shape anyway so a second scoped role can be added
// later without a token-format migration.
export const ADMIN_SESSION_COOKIE = 'admin_session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

// Constant-time string comparison for password checks — avoids leaking how many
// leading characters matched via response timing. Implemented manually (not via
// Node's crypto.timingSafeEqual) because this module is also imported by proxy.js
// middleware, which runs on the Edge runtime and only has the Web Crypto API
// (crypto.subtle) available — no Node `crypto` module, and no crypto.subtle
// equivalent for this either. The XOR-accumulate loop always runs to completion
// regardless of where a mismatch occurs, so it doesn't leak timing either.
export function safeCompare(a = '', b = '') {
  const bufA = new TextEncoder().encode(String(a));
  const bufB = new TextEncoder().encode(String(b));
  const maxLen = Math.max(bufA.length, bufB.length, 1);
  let diff = bufA.length ^ bufB.length;
  for (let i = 0; i < maxLen; i++) {
    diff |= (bufA[i] ?? 0) ^ (bufB[i] ?? 0);
  }
  return diff === 0;
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function getKey() {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(process.env.PSWD_ADMIN),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

export async function createAdminSessionToken(role = 'admin') {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const key = await getKey();
  const payload = `${expiresAt}.${role}`;
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return { token: `${payload}.${toHex(signature)}`, maxAge: SESSION_DURATION_MS / 1000 };
}

export async function verifyAdminSessionToken(token) {
  if (!token) return { valid: false, role: null };

  const [expiresAt, role, signatureHex] = token.split('.');
  if (!expiresAt || !role || !signatureHex) return { valid: false, role: null };
  if (role !== 'admin') return { valid: false, role: null };
  if (Date.now() > Number(expiresAt)) return { valid: false, role: null };

  const key = await getKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${expiresAt}.${role}`));
  const valid = toHex(signature) === signatureHex;
  return { valid, role: valid ? role : null };
}
