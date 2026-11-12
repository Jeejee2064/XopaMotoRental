import BookingDetailPage from '@/components/admin/booking/BookingDetailPage';

// Dedicated admin page per booking. Already behind the admin session guard
// (proxy.js protects everything under /admin/ok), and every API it calls
// re-checks the session cookie.
export default async function AdminBookingPage({ params }) {
  const { id } = await params;
  return <BookingDetailPage id={id} />;
}
