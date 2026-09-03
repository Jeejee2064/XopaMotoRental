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

  const inputClass = 'w-full px-4 py-2 bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-lg focus:ring-2 focus:ring-jaune focus:border-transparent outline-none';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#131316] border border-white/10 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-heading font-black text-white">Add New Booking</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <XCircle size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">

          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Customer Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">First Name *</label>
                <input type="text" required value={newBooking.first_name}
                  onChange={(e) => setNewBooking({ ...newBooking, first_name: e.target.value })}
                  className={inputClass}
                  placeholder="John" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Last Name *</label>
                <input type="text" required value={newBooking.last_name}
                  onChange={(e) => setNewBooking({ ...newBooking, last_name: e.target.value })}
                  className={inputClass}
                  placeholder="Doe" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Email *</label>
                <input type="email" required value={newBooking.email}
                  onChange={(e) => setNewBooking({ ...newBooking, email: e.target.value })}
                  className={inputClass}
                  placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Phone *</label>
                <input type="tel" required value={newBooking.phone}
                  onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })}
                  className={inputClass}
                  placeholder="+1 234 567 8900" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-white/60 mb-2">Country *</label>
                <input type="text" required value={newBooking.country}
                  onChange={(e) => setNewBooking({ ...newBooking, country: e.target.value })}
                  className={inputClass}
                  placeholder="United States" />
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Trip Details</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Start Date *</label>
                <input type="date" required value={newBooking.start_date}
                  onChange={(e) => setNewBooking({ ...newBooking, start_date: e.target.value })}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">End Date *</label>
                <input type="date" required value={newBooking.end_date}
                  onChange={(e) => setNewBooking({ ...newBooking, end_date: e.target.value })}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Motorcycles *</label>
                <select required value={newBooking.bike_quantity}
                  onChange={(e) => setNewBooking({ ...newBooking, bike_quantity: parseInt(e.target.value) })}
                  className={inputClass}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n} className="bg-[#131316]">{n} Motorcycle{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            {calculateDays() > 0 && (
              <div className="mt-3 p-3 bg-jaune/10 border border-jaune/25 rounded-lg">
                <p className="text-sm text-white/80">
                  <span className="font-semibold text-jaune">Duration:</span> {calculateDays()} days
                  {calculatePrice() > 0 && (
                    <span className="ml-3">
                      <span className="font-semibold text-jaune">Per-bike rate:</span> ${calculatePrice()}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Pricing (Auto-calculated)</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Total Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                  <input type="number" value={newBooking.total_price}
                    onChange={(e) => setNewBooking({ ...newBooking, total_price: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-jaune focus:border-transparent outline-none"
                    placeholder="100.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Down Payment</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                  <input type="number" value={newBooking.down_payment}
                    onChange={(e) => setNewBooking({ ...newBooking, down_payment: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-jaune focus:border-transparent outline-none"
                    placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">Security Deposit</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
                  <input type="number" value={newBooking.deposit}
                    onChange={(e) => setNewBooking({ ...newBooking, deposit: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-jaune focus:border-transparent outline-none"
                    placeholder="0.00" />
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-white/30">Deposit is collected in person at pickup, not charged online.</p>
            {newBooking.total_price > 0 && (
              <div className="mt-3 p-4 bg-green-500/10 border border-green-500/25 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-white/50">Total Rental:</span><span className="font-bold text-white ml-2">${newBooking.total_price}</span></div>
                  <div><span className="text-white/50">Down Payment:</span><span className="font-bold text-green-400 ml-2">${newBooking.down_payment}</span></div>
                  <div><span className="text-white/50">Balance:</span><span className="font-bold text-jaune ml-2">${balanceAmount}</span></div>
                  <div><span className="text-white/50">Deposit:</span><span className="font-bold text-white ml-2">${newBooking.deposit}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Status & Payment */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Status & Payment</h3>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white/60 mb-2">Booking Status</label>
              <select value={newBooking.status}
                onChange={(e) => setNewBooking({ ...newBooking, status: e.target.value })}
                className={inputClass}>
                <option value="pending" className="bg-[#131316]">Pending</option>
                <option value="confirmed" className="bg-[#131316]">Confirmed</option>
                <option value="fully paid" className="bg-[#131316]">Fully Paid</option>
                <option value="cancelled" className="bg-[#131316]">Cancelled</option>
              </select>
            </div>

            <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
              <input type="checkbox" checked={newBooking.paid}
                onChange={(e) => setNewBooking({ ...newBooking, paid: e.target.checked })}
                className="w-4 h-4 rounded text-jaune focus:ring-jaune" />
              <div>
                <p className="text-sm font-semibold text-white">Fully paid</p>
                <p className="text-xs text-white/40">
                  ${newBooking.total_price > 0 ? parseFloat(newBooking.total_price).toFixed(2) : '—'}
                </p>
              </div>
            </label>
          </div>

          {/* Additional Riders */}
          {riders && riders.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Additional Riders</h3>
              <div className="space-y-4">
                {riders.map((rider, idx) => (
                  <div key={idx} className="p-4 border border-white/10 rounded-lg bg-white/5">
                    <p className="text-sm font-bold text-jaune mb-3">Rider {idx + 2}</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {[
                        { label: 'First Name', field: 'first_name', placeholder: 'Jane' },
                        { label: 'Last Name', field: 'last_name', placeholder: 'Doe' },
                        { label: 'Email', field: 'email', placeholder: 'jane@example.com' },
                        { label: 'Phone', field: 'phone', placeholder: '+1 234 567 8900' },
                      ].map(({ label, field, placeholder }) => (
                        <div key={field}>
                          <label className="block text-sm font-semibold text-white/60 mb-1">{label} *</label>
                          <input
                            type={field === 'email' ? 'email' : 'text'}
                            required
                            value={rider[field]}
                            onChange={(e) => {
                              const updated = [...riders];
                              updated[idx] = { ...updated[idx], [field]: e.target.value };
                              setRiders(updated);
                            }}
                            className={inputClass}
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
              <label className="block text-sm font-semibold text-white/60">Special Requests</label>
              <label className="flex items-center gap-2 text-sm font-semibold text-red-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!newBooking.important_note}
                  onChange={(e) => setNewBooking({ ...newBooking, important_note: e.target.checked })}
                  className="w-4 h-4 rounded text-red-500 focus:ring-red-400"
                />
                ⚠️ Important
              </label>
            </div>
            <textarea rows={3} value={newBooking.special_requests}
              onChange={(e) => setNewBooking({ ...newBooking, special_requests: e.target.value })}
              className={'w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-jaune focus:border-transparent outline-none text-white placeholder-white/25 ' + (newBooking.important_note ? 'border border-red-500/30 bg-red-500/10' : 'border border-white/10 bg-white/5')}
              placeholder="Any special requests or notes..." />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 px-6 py-3 border border-white/10 text-white/70 font-semibold rounded-lg hover:bg-white/5">
              Cancel
            </button>
            <button type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-jaune text-noir font-bold rounded-lg hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed">
              {isSubmitting ? 'Adding...' : 'Add Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBookingModal;
