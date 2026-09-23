export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('es-PA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Values interpolated into email HTML (request headers, client-supplied
// fields) are untrusted — escape them so a crafted User-Agent/referer can't
// break the markup in the admin's inbox.
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
