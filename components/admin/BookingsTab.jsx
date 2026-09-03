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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="fully paid">Fully Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button
            onClick={onAddBooking}
            className="px-6 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors flex items-center gap-2"
          >
            <Package size={20} />
            Add Booking
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bikes</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {filteredBookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-gray-50">

                    {/* Customer */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {booking.first_name} {booking.last_name}
                        </p>
                        {booking.important_note && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setNoteBooking(booking); }}
                            title="Important note — click to view"
                            className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 border border-red-300 text-xs font-bold rounded-full hover:bg-red-200 transition"
                          >
                            <AlertTriangle size={12} />
                            Important
                          </button>
                        )}
                      </div>
                      <a
                        href={'mailto:' + booking.email}
                        className="text-sm text-blue-500 hover:text-blue-700 hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail size={12} />
                        {booking.email}
                      </a>
                    </td>

                    {/* Dates */}
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
                    </td>

                    {/* Bikes */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {booking.bike_quantity}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ${parseFloat(booking.total_price).toFixed(0)}
                    </td>

                    {/* Payment */}
                    <td className="px-6 py-4">
                      <span
                        title="Payment status"
                        className={'inline-block px-2 py-0.5 rounded-full text-xs font-semibold ' + (
                          booking.payment_status === 'paid' ? 'bg-green-100 text-green-700'
                          : booking.payment_status === 'failed' ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-500'
                        )}
                      >
                        {booking.payment_status === 'paid' ? 'Paid' : booking.payment_status === 'failed' ? 'Failed' : 'Pending'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={'px-3 py-1 rounded-full text-xs font-semibold ' + (
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700'
                        : booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                        : booking.status === 'cancelled' ? 'bg-red-100 text-red-700'
                        : booking.status === 'fully paid' ? 'bg-blue-100 text-blue-700'
                        : 'bg-blue-100 text-blue-700'
                      )}>
                        {booking.status}
                      </span>
                      {booking.assignment_shortage && (
                        <span className="ml-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700" title="Not enough motorcycles could be assigned automatically — needs manual reassignment">
                          ⚠ Needs Review
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onViewDetails(booking)}
                        className="text-yellow-600 hover:text-yellow-700 font-semibold text-sm"
                      >
                        View
                      </button>
                    </td>

                  </tr>
                ))}
                {filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">
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
