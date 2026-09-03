'use client'
import React, { useState, useEffect } from 'react';
import { XCircle, Edit2, Save, X, Bike, Mail } from 'lucide-react';
import {
  getBookingMotorcycles,
  getAvailableMotorcyclesForEdit,
} from '@/lib/supabase/bookings-admin-helpers';

// Re-sends the same confirmation email the customer got when the booking was
// first paid — handy when they lost it, or when an admin-created booking
// never went through the PagueloFacil webhook that normally triggers it.
function SendConfirmationMailButton({ booking, notify }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/resend-confirmation`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(true);
      notify(`Confirmation email sent to ${data.sentTo} recipient${data.sentTo > 1 ? 's' : ''}`);
    } catch (e) {
      notify('Error: ' + e.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      onClick={handleSend}
      disabled={sending}
      className={
        'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50 ' +
        (sent
          ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
          : 'bg-blue-500 text-white hover:bg-blue-600')
      }
    >
      <Mail size={16} />
      {sending ? 'Sending…' : sent ? '✅ Confirmation Sent' : 'Send Confirmation Email'}
    </button>
  );
}

const BookingDetailModal = ({ booking, onClose, onStatusUpdate, onDelete, onPaymentToggle, onUpdate, notify: notifyProp }) => {
  const notify = notifyProp || ((msg, type) => (type === 'error' ? alert('Error: ' + msg) : alert(msg)));
  const [isEditing, setIsEditing] = useState(false);
  const [editedBooking, setEditedBooking] = useState(null);
  const [assignedMotorcycles, setAssignedMotorcycles] = useState([]);
  const [availableMotorcycles, setAvailableMotorcycles] = useState([]);
  const [motorcycleSelections, setMotorcycleSelections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingMotorcycle, setSavingMotorcycle] = useState(false);

  useEffect(() => {
    if (booking) {
      setEditedBooking({ ...booking });
      loadMotorcycleData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking]);

  useEffect(() => {
    if (editedBooking && isEditing) loadAvailableMotorcycles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedBooking?.start_date, editedBooking?.end_date, isEditing]);

  useEffect(() => {
    if (booking && assignedMotorcycles) initializeMotorcycleSelections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking, assignedMotorcycles]);

  const loadMotorcycleData = async () => {
    if (!booking) return;
    setLoading(true);
    try {
      const assigned = await getBookingMotorcycles(booking.id);
      setAssignedMotorcycles(assigned);
    } catch (error) {
      console.error('Error loading motorcycle data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMotorcycleSelections = () => {
    if (!booking) return;
    // booking_motorcycles has no surrogate id (its key is booking_id +
    // motorcycle_id), so the motorcycle_id itself doubles as the "which
    // assignment row to replace" identifier when swapping bikes below.
    const slots = [];
    for (let i = 0; i < booking.bike_quantity; i++) {
      const assignment = assignedMotorcycles[i];
      slots.push({
        index: i,
        assignmentId: assignment?.motorcycle_id || null,
        motorcycleId: assignment?.motorcycle_id || '',
        motorcycleName: assignment?.motorcycles?.name || '',
      });
    }
    setMotorcycleSelections(slots);
  };

  const loadAvailableMotorcycles = async () => {
    if (!editedBooking?.start_date || !editedBooking?.end_date) return;
    try {
      const available = await getAvailableMotorcyclesForEdit(editedBooking.start_date, editedBooking.end_date, booking.id);
      setAvailableMotorcycles(available);
    } catch (error) {
      console.error('Error loading available motorcycles:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: editedBooking.first_name,
          last_name: editedBooking.last_name,
          email: editedBooking.email,
          phone: editedBooking.phone,
          country: editedBooking.country,
          start_date: editedBooking.start_date,
          end_date: editedBooking.end_date,
          bike_quantity: editedBooking.bike_quantity,
          total_price: editedBooking.total_price,
          down_payment: editedBooking.down_payment,
          deposit: editedBooking.deposit,
          special_requests: editedBooking.special_requests,
          important_note: editedBooking.important_note,
          hear_about_us: editedBooking.hear_about_us,
          payment_status: editedBooking.payment_status,
          webhook_received: editedBooking.webhook_received,
          paid: editedBooking.paid,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save booking');
      setIsEditing(false);
      if (onUpdate) await onUpdate();
      notify('Booking updated successfully!');
    } catch (error) {
      console.error('Error saving booking:', error);
      notify('Error saving booking: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMotorcycleChange = async (_slotIndex, newMotorcycleId, oldAssignmentId) => {
    setSavingMotorcycle(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/motorcycles`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldAssignmentId, newMotorcycleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update motorcycle');
      await loadMotorcycleData();
      notify('Motorcycle updated successfully!');
    } catch (error) {
      console.error('Error updating motorcycle:', error);
      notify('Error updating motorcycle: ' + error.message, 'error');
    } finally {
      setSavingMotorcycle(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedBooking(prev => ({ ...prev, [field]: value }));
  };

  const calculateDuration = () => {
    if (!editedBooking?.start_date || !editedBooking?.end_date) return 0;
    const start = new Date(editedBooking.start_date + 'T00:00:00');
    const end = new Date(editedBooking.end_date + 'T00:00:00');
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  if (!booking || !editedBooking) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
              {editedBooking.important_note && (
                <span className="inline-block mt-1 text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-300">
                  ⚠️ Important
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <button onClick={() => { setIsEditing(true); loadAvailableMotorcycles(); }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  <Edit2 size={18} /> Edit
                </button>
              ) : (
                <>
                  <button onClick={handleSave} disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50">
                    <Save size={18} /> {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => { setIsEditing(false); setEditedBooking({ ...booking }); }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                    <X size={18} /> Cancel
                  </button>
                </>
              )}
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* Customer Info */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">Customer Information</h3>
              {!isEditing && (
                <SendConfirmationMailButton booking={editedBooking} notify={notify} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'First Name', field: 'first_name', type: 'text' },
                { label: 'Last Name', field: 'last_name', type: 'text' },
                { label: 'Email', field: 'email', type: 'email' },
                { label: 'Phone', field: 'phone', type: 'tel' },
                { label: 'Country', field: 'country', type: 'text' },
              ].map(({ label, field, type }) => (
                <div key={field}>
                  <p className="text-sm text-gray-500 mb-1">{label}</p>
                  {isEditing ? (
                    <input type={type} value={editedBooking[field] || ''}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
                  ) : (
                    <p className="font-semibold">{editedBooking[field]}</p>
                  )}
                </div>
              ))}
              <div>
                <p className="text-sm text-gray-500 mb-1">How did you hear about us?</p>
                {isEditing ? (
                  <select value={editedBooking.hear_about_us || ''}
                    onChange={(e) => handleFieldChange('hear_about_us', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400">
                    <option value="">Select...</option>
                    <option value="walk-in">Walk-in</option>
                    <option value="google">Google</option>
                    <option value="social-media">Social Media</option>
                    <option value="referral">Referral</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className="font-semibold capitalize">{editedBooking.hear_about_us || 'N/A'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Riders */}
          {booking.booking_riders?.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Additional Riders</h3>
              <div className="space-y-3">
                {booking.booking_riders.map((rider) => (
                  <div key={rider.id} className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs font-bold text-blue-600 mb-2">Rider {rider.rider_index}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">Name: </span><span className="font-semibold">{rider.first_name} {rider.last_name}</span></div>
                      <div><span className="text-gray-500">Email: </span><a href={`mailto:${rider.email}`} className="text-blue-600 hover:underline font-semibold">{rider.email || '—'}</a></div>
                      <div><span className="text-gray-500">Phone: </span><a href={`https://wa.me/${(rider.phone || '').replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-semibold">{rider.phone || '—'}</a></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trip Details */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Trip Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Start Date</p>
                {isEditing ? (
                  <input type="date" value={editedBooking.start_date}
                    onChange={(e) => handleFieldChange('start_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
                ) : (
                  <p className="font-semibold">{editedBooking.start_date}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">End Date</p>
                {isEditing ? (
                  <input type="date" value={editedBooking.end_date}
                    onChange={(e) => handleFieldChange('end_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
                ) : (
                  <p className="font-semibold">{editedBooking.end_date}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Duration</p>
                <p className="font-semibold">{calculateDuration()} day{calculateDuration() !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Bike Quantity</p>
                {isEditing ? (
                  <input type="number" min="1" value={editedBooking.bike_quantity}
                    onChange={(e) => handleFieldChange('bike_quantity', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
                ) : (
                  <p className="font-semibold">{editedBooking.bike_quantity}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Pickup Location</p>
                <p className="font-semibold">{editedBooking.pickup_location || 'Panama City'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <p className="font-semibold capitalize">{editedBooking.status}</p>
              </div>
            </div>
          </div>

          {/* Assigned Motorcycles */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Bike size={20} />
              Assigned Motorcycles
            </h3>
            {loading ? (
              <div className="text-center py-4 text-gray-500">Loading motorcycles...</div>
            ) : (
              <div className="space-y-3">
                {motorcycleSelections.map((slot, index) => (
                  <div key={slot.index}>
                    <p className="text-sm text-gray-500 mb-1">Motorcycle {index + 1}</p>
                    {isEditing ? (
                      <select value={slot.motorcycleId}
                        onChange={(e) => handleMotorcycleChange(slot.index, e.target.value, slot.assignmentId)}
                        disabled={savingMotorcycle}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 disabled:opacity-50">
                        <option value="">Select a motorcycle...</option>
                        {slot.motorcycleId && slot.motorcycleName && (
                          <option value={slot.motorcycleId}>{slot.motorcycleName} (Current)</option>
                        )}
                        {availableMotorcycles
                          .filter(m => m.id !== slot.motorcycleId)
                          .map((moto) => (
                            <option key={moto.id} value={moto.id}>{moto.name}</option>
                          ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg">
                        <Bike size={18} className="text-blue-600" />
                        <span className="font-semibold text-gray-900">
                          {slot.motorcycleName || 'Not assigned'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {motorcycleSelections.length === 0 && (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                    No motorcycle slots available
                  </div>
                )}
                {isEditing && availableMotorcycles.length === 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    ⚠️ No available bikes for this date range.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Pricing</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Total Price', field: 'total_price' },
                  { label: 'Down Payment', field: 'down_payment' },
                  { label: 'Security Deposit (at pickup)', field: 'deposit' },
                ].map(({ label, field }) => (
                  <div key={field}>
                    <p className="text-sm text-gray-500 mb-1">{label}</p>
                    {isEditing ? (
                      <input type="number" step="0.01" value={editedBooking[field]}
                        onChange={(e) => handleFieldChange(field, parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" />
                    ) : (
                      <p className="font-semibold">${editedBooking[field]}</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-900 font-bold">Payment Status</span>
                {isEditing ? (
                  <select
                    value={editedBooking.payment_status || 'pending'}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleFieldChange('payment_status', val);
                      handleFieldChange('webhook_received', val === 'paid');
                      handleFieldChange('paid', val === 'paid');
                    }}
                    className="px-2 py-1 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="paid">✅ Paid</option>
                    <option value="failed">❌ Failed</option>
                  </select>
                ) : (
                  <span className={'font-bold ' + (editedBooking.paid ? 'text-green-600' : 'text-red-600')}>
                    {editedBooking.paid ? 'PAID' : editedBooking.payment_status === 'failed' ? 'FAILED' : 'PENDING'}
                  </span>
                )}
              </div>
              {!editedBooking.paid && (
                <div className="pt-2">
                  <button onClick={() => onPaymentToggle(editedBooking.id, true)}
                    className="w-full px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors">
                    Mark as Fully Paid
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">Special Requests</h3>
              {isEditing && (
                <label className="flex items-center gap-2 text-sm font-semibold text-red-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!editedBooking.important_note}
                    onChange={(e) => handleFieldChange('important_note', e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-400"
                  />
                  ⚠️ Important
                </label>
              )}
            </div>
            {isEditing ? (
              <textarea value={editedBooking.special_requests || ''}
                onChange={(e) => handleFieldChange('special_requests', e.target.value)}
                rows={4}
                className={'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 ' + (editedBooking.important_note ? 'border-red-300 bg-red-50' : 'border-gray-300')}
                placeholder="Enter any special requests..." />
            ) : (
              <p className={'p-4 rounded-lg ' + (editedBooking.important_note ? 'bg-red-50 border border-red-200 text-red-900 font-medium' : 'bg-gray-50 text-gray-700')}>
                {editedBooking.special_requests || 'No special requests'}
              </p>
            )}
          </div>

          {/* Actions */}
          {!isEditing && (
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <select
                onChange={(e) => onStatusUpdate(editedBooking.id, e.target.value)}
                value={editedBooking.status}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="fully paid">Fully Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                onClick={() => onDelete(editedBooking.id)}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;
