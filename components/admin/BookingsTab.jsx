'use client'
import React, { useState } from 'react';
import { Search, Package, Mail, AlertTriangle } from 'lucide-react';
import ImportantNoteModal from '@/components/admin/ImportantNoteModal';

// Single model/location, so unlike Overland's version there's no
// location/model filter column, and payment is a single pass/fail status
// (Xopa charges the full rental total online, no AUTH/balance split).
const BookingsTab = ({
  bookings,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  onViewDetails,
  onAddBooking,
}) => {
  const [noteBooking, setNoteBooking] = useState(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredBookings = bookings.filter(booking => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      booking.first_name.toLowerCase().includes(term) ||
      booking.last_name.toLowerCase().includes(term) ||
      booking.email.toLowerCase().includes(term) ||
      (booking.booking_riders || []).some(r =>
        `${r.first_name} ${r.last_name}`.toLowerCase().includes(term) ||
        (r.email || '').toLowerCase().includes(term) ||
        (r.phone || '').toLowerCase().includes(term)
      );
    const matchesFilter = filterStatus === 'all' || booking.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <div className="space-y-6">
        <div className="flex gap-4 items-center flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={20} />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-lg focus:ring-2 focus:ring-jaune focus:border-transparent outline-none"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-jaune outline-none"
          >
            <option value="all" className="bg-[#131316]">All Status</option>
            <option value="pending" className="bg-[#131316]">Pending</option>
            <option value="confirmed" className="bg-[#131316]">Confirmed</option>
            <option value="fully paid" className="bg-[#131316]">Fully Paid</option>
            <option value="cancelled" className="bg-[#131316]">Cancelled</option>
          </select>

          <button
            onClick={onAddBooking}
            className="px-6 py-2 bg-jaune text-noir font-bold rounded-lg hover:brightness-95 transition-colors flex items-center gap-2"
          >
            <Package size={20} />
            Add Booking
          </button>
        </div>

        <div className="bg-[#131316] rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">Bikes</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filteredBookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-white/[0.03]">

                    {/* Customer */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">
                          {booking.first_name} {booking.last_name}
                        </p>
                        {booking.important_note && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setNoteBooking(booking); }}
                            title="Important note — click to view"
                            className="flex items-center gap-1 px-2 py-0.5 bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold rounded-full hover:bg-red-500/25 transition"
                          >
                            <AlertTriangle size={12} />
                            Important
                          </button>
                        )}
                      </div>
                      <a
                        href={'mailto:' + booking.email}
                        className="text-sm text-jaune/80 hover:text-jaune hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail size={12} />
                        {booking.email}
                      </a>
                    </td>

                    {/* Dates */}
                    <td className="px-6 py-4 text-sm text-white/50 whitespace-nowrap">
                      {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
                    </td>

                    {/* Bikes */}
                    <td className="px-6 py-4 text-sm text-white/50">
                      {booking.bike_quantity}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 text-sm font-semibold text-white">
                      ${parseFloat(booking.total_price).toFixed(0)}
                    </td>

                    {/* Payment */}
                    <td className="px-6 py-4">
                      <span
                        title="Payment status"
                        className={'inline-block px-2 py-0.5 rounded-full text-xs font-semibold ' + (
                          booking.payment_status === 'paid' ? 'bg-green-500/15 text-green-400'
                          : booking.payment_status === 'failed' ? 'bg-red-500/15 text-red-400'
                          : 'bg-white/10 text-white/50'
                        )}
                      >
                        {booking.payment_status === 'paid' ? 'Paid' : booking.payment_status === 'failed' ? 'Failed' : 'Pending'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={'px-3 py-1 rounded-full text-xs font-semibold ' + (
                        booking.status === 'fully paid' ? 'bg-green-500/15 text-green-400'
                        : booking.status === 'confirmed' ? 'bg-white/10 text-white'
                        : booking.status === 'pending' ? 'bg-jaune/15 text-jaune'
                        : booking.status === 'cancelled' ? 'bg-red-500/15 text-red-400'
                        : 'bg-white/10 text-white/60'
                      )}>
                        {booking.status}
                      </span>
                      {booking.assignment_shortage && (
                        <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400" title="Not enough motorcycles could be assigned automatically — needs manual reassignment">
                          ⚠ Needs Review
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onViewDetails(booking)}
                        className="text-jaune hover:text-jaune/80 font-semibold text-sm"
                      >
                        View
                      </button>
                    </td>

                  </tr>
                ))}
                {filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-white/30">
                      No bookings match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {noteBooking && (
        <ImportantNoteModal note={noteBooking.special_requests} onClose={() => setNoteBooking(null)} />
      )}
    </>
  );
};

export default BookingsTab;
