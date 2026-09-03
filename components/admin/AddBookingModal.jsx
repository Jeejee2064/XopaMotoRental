'use client'
import React from 'react';
import { XCircle } from 'lucide-react';

// Single model/location, so unlike Overland's version there's no
// location/model picker — every booking is the same bike at Panama City.
const AddBookingModal = ({ show, onClose, newBooking, setNewBooking, onSubmit, calculateDays, calculatePrice, riders, setRiders, isSubmitting }) => {
  if (!show) return null;

  const balanceAmount = newBooking.total_price > 0
    ? (parseFloat(newBooking.total_price) - parseFloat(newBooking.down_payment)).toFixed(2)
    : '—';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Add New Booking</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                <input type="text" required value={newBooking.first_name}
                  onChange={(e) => setNewBooking({ ...newBooking, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="John" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                <input type="text" required value={newBooking.last_name}
                  onChange={(e) => setNewBooking({ ...newBooking, last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Doe" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input type="email" required value={newBooking.email}
                  onChange={(e) => setNewBooking({ ...newBooking, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                <input type="tel" required value={newBooking.phone}
                  onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="+1 234 567 8900" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Country *</label>
                <input type="text" required value={newBooking.country}
                  onChange={(e) => setNewBooking({ ...newBooking, country: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="United States" />
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Trip Details</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
                <input type="date" required value={newBooking.start_date}
                  onChange={(e) => setNewBooking({ ...newBooking, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
                <input type="date" required value={newBooking.end_date}
                  onChange={(e) => setNewBooking({ ...newBooking, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Motorcycles *</label>
                <select required value={newBooking.bike_quantity}
                  onChange={(e) => setNewBooking({ ...newBooking, bike_quantity: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent">
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n} Motorcycle{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            {calculateDays() > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Duration:</span> {calculateDays()} days
                  {calculatePrice() > 0 && (
                    <span className="ml-3">
                      <span className="font-semibold">Per-bike rate:</span> ${calculatePrice()}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Pricing (Auto-calculated)</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Total Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input type="number" value={newBooking.total_price}
                    onChange={(e) => setNewBooking({ ...newBooking, total_price: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="100.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Down Payment</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input type="number" value={newBooking.down_payment}
                    onChange={(e) => setNewBooking({ ...newBooking, down_payment: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Security Deposit</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input type="number" value={newBooking.deposit}
                    onChange={(e) => setNewBooking({ ...newBooking, deposit: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="0.00" />
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">Deposit is collected in person at pickup, not charged online.</p>
            {newBooking.total_price > 0 && (
              <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-600">Total Rental:</span><span className="font-bold text-gray-900 ml-2">${newBooking.total_price}</span></div>
                  <div><span className="text-gray-600">Down Payment:</span><span className="font-bold text-green-600 ml-2">${newBooking.down_payment}</span></div>
                  <div><span className="text-gray-600">Balance:</span><span className="font-bold text-blue-600 ml-2">${balanceAmount}</span></div>
                  <div><span className="text-gray-600">Deposit:</span><span className="font-bold text-gray-900 ml-2">${newBooking.deposit}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Status & Payment */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Status & Payment</h3>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Booking Status</label>
              <select value={newBooking.status}
                onChange={(e) => setNewBooking({ ...newBooking, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent">
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="fully paid">Fully Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
              <input type="checkbox" checked={newBooking.paid}
                onChange={(e) => setNewBooking({ ...newBooking, paid: e.target.checked })}
                className="w-4 h-4 rounded text-yellow-400 focus:ring-yellow-400" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Fully paid</p>
                <p className="text-xs text-gray-500">
                  ${newBooking.total_price > 0 ? parseFloat(newBooking.total_price).toFixed(2) : '—'}
                </p>
              </div>
            </label>
          </div>

          {/* Additional Riders */}
          {riders && riders.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Riders</h3>
              <div className="space-y-4">
                {riders.map((rider, idx) => (
                  <div key={idx} className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <p className="text-sm font-bold text-blue-700 mb-3">Rider {idx + 2}</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {[
                        { label: 'First Name', field: 'first_name', placeholder: 'Jane' },
                        { label: 'Last Name', field: 'last_name', placeholder: 'Doe' },
                        { label: 'Email', field: 'email', placeholder: 'jane@example.com' },
                        { label: 'Phone', field: 'phone', placeholder: '+1 234 567 8900' },
                      ].map(({ label, field, placeholder }) => (
                        <div key={field}>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">{label} *</label>
                          <input
                            type={field === 'email' ? 'email' : 'text'}
                            required
                            value={rider[field]}
                            onChange={(e) => {
                              const updated = [...riders];
                              updated[idx] = { ...updated[idx], [field]: e.target.value };
                              setRiders(updated);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                            placeholder={placeholder}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special Requests */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">Special Requests</label>
              <label className="flex items-center gap-2 text-sm font-semibold text-red-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!newBooking.important_note}
                  onChange={(e) => setNewBooking({ ...newBooking, important_note: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-400"
                />
                ⚠️ Important
              </label>
            </div>
            <textarea rows={3} value={newBooking.special_requests}
              onChange={(e) => setNewBooking({ ...newBooking, special_requests: e.target.value })}
              className={'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ' + (newBooking.important_note ? 'border-red-300 bg-red-50' : 'border-gray-300')}
              placeholder="Any special requests or notes..." />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed">
              {isSubmitting ? 'Adding...' : 'Add Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBookingModal;
