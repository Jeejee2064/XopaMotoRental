export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('es-PA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
