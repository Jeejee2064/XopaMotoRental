'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllBookings } from '@/lib/supabase/bookings';
import { getAllMessages } from '@/lib/supabase/messages';
import { getRentalPriceForDays } from '@/lib/pricing';

import AdminHeader from '@/components/admin/AdminHeader';
import AdminNavigation from '@/components/admin/AdminNavigation';
import OverviewTab from '@/components/admin/OverviewTab';
import BookingsTab from '@/components/admin/BookingsTab';
import MessagesTab from '@/components/admin/MessagesTab';
import CalendarTab from '@/components/admin/CalendarTab';
import MotorcyclesTab from '@/components/admin/MotorcyclesTab';
import BookingDetailModal from '@/components/admin/BookingDetailModal';
import AddBookingModal from '@/components/admin/AddBookingModal';
import BookingLinkGeneratorTab from '@/components/admin/BookingLinkGeneratorTab';
import RevenueTab from '@/components/admin/RevenueTab';

const EMPTY_BOOKING = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  country: '',
  start_date: '',
  end_date: '',
  bike_quantity: 1,
  total_price: 0,
  down_payment: 0,
  deposit: 0,
  special_requests: '',
  important_note: false,
  hear_about_us: 'walk-in',
  status: 'confirmed',
  paid: false,
};

const AdminDashboardClient = () => {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('calendar');
  const [bookings, setBookings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddBooking, setShowAddBooking] = useState(false);

  const [newBooking, setNewBooking] = useState(EMPTY_BOOKING);
  const [newBookingRiders, setNewBookingRiders] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  const withConfirm = (msg, onConfirm) => setConfirmModal({ msg, onConfirm });

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsData, messagesData] = await Promise.all([getAllBookings(), getAllMessages()]);
      setBookings(bookingsData || []);
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      notify('Error loading data. Check the service role key.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin-logout', { method: 'POST' });
    } finally {
      router.push('/admin');
    }
  };

  const refreshSelectedBooking = async (bookingId) => {
    try {
      const freshBookings = await getAllBookings();
      const updatedBooking = freshBookings.find(b => b.id === bookingId);
      if (updatedBooking) setSelectedBooking(updatedBooking);
      setBookings(freshBookings);
    } catch (error) {
      console.error('Error refreshing booking:', error);
    }
  };

  const handleBookingUpdate = async () => {
    if (selectedBooking) await refreshSelectedBooking(selectedBooking.id);
    await loadData();
  };

  const handlePaymentToggle = async (bookingId, newPaidStatus) => {
    try {
      const updates = newPaidStatus
        ? { paid: true, status: 'fully paid', payment_status: 'paid' }
        : { paid: false };
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update payment');
      await refreshSelectedBooking(bookingId);
      await loadData();
      notify('Payment marked as fully paid!');
    } catch (error) {
      notify('Error updating payment: ' + error.message, 'error');
    }
  };

  const stats = {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    totalRevenue: bookings.filter(b => b.paid).reduce((sum, b) => sum + parseFloat(b.total_price), 0),
    unreadMessages: messages.filter(m => m.status === 'unread').length,
    avgBookingValue: bookings.length > 0
      ? bookings.reduce((sum, b) => sum + parseFloat(b.total_price), 0) / bookings.length
      : 0,
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      await refreshSelectedBooking(bookingId);
      await loadData();
      notify('Status updated successfully!');
    } catch (error) {
      notify('Error updating status: ' + error.message, 'error');
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    withConfirm('Delete this booking? This cannot be undone.', async () => {
      try {
        const res = await fetch(`/api/admin/bookings/${bookingId}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete booking');
        await loadData();
        setSelectedBooking(null);
        notify('Booking deleted.');
      } catch (error) {
        notify('Error deleting booking: ' + error.message, 'error');
      }
    });
  };

  const handleMarkMessageRead = async (messageId) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'read' } : m));
    try {
      const res = await fetch(`/api/admin/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark as read');
    } catch (e) {
      notify('Error: ' + e.message, 'error');
      await loadData();
    }
  };
  const handleMarkMessageReplied = async (messageId, notes) => {
    try {
      const res = await fetch(`/api/admin/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markReplied', adminNotes: notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark as replied');
      await loadData();
      setSelectedMessage(null);
      notify('Message marked as replied!');
    } catch (e) {
      notify('Error: ' + e.message, 'error');
    }
  };
  const handleDeleteMessage = async (messageId) => {
    withConfirm('Delete this message?', async () => {
      try {
        const res = await fetch(`/api/admin/messages/${messageId}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete message');
        await loadData();
        setSelectedMessage(null);
        notify('Message deleted.');
      } catch (e) {
        notify('Error: ' + e.message, 'error');
      }
    });
  };

  const handleAddBooking = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newBooking, riders: newBookingRiders }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add booking');

      await loadData();
      setShowAddBooking(false);
      setNewBooking(EMPTY_BOOKING);
      setNewBookingRiders([]);
      notify('Booking added successfully!');
    } catch (error) {
      console.error('Error adding booking:', error);
      notify('Error adding booking: ' + error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDays = () => {
    if (!newBooking.start_date || !newBooking.end_date) return 0;
    const start = new Date(newBooking.start_date);
    const end = new Date(newBooking.end_date);
    return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculatePrice = () => getRentalPriceForDays(calculateDays());

  useEffect(() => {
    if (newBooking.start_date && newBooking.end_date) {
      const rentalPrice = calculatePrice();
      const totalRentalPrice = rentalPrice * newBooking.bike_quantity;
      const downPayment = totalRentalPrice;
      setNewBooking(prev => ({
        ...prev,
        total_price: totalRentalPrice,
        down_payment: downPayment,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newBooking.start_date, newBooking.end_date, newBooking.bike_quantity]);

  useEffect(() => {
    const riderCount = Math.max(0, newBooking.bike_quantity - 1);
    setNewBookingRiders(prev =>
      Array.from({ length: riderCount }, (_, i) =>
        prev[i] || { first_name: '', last_name: '', email: '', phone: '' }
      )
    );
  }, [newBooking.bike_quantity]);

  const handleMessageClick = (msg) => {
    setSelectedMessage(msg);
    if (msg.status === 'unread') handleMarkMessageRead(msg.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-noir flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-jaune border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gris/50">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-noir">
      <AdminHeader onRefresh={loadData} onLogout={handleLogout} />
      <AdminNavigation activeTab={activeTab} setActiveTab={setActiveTab} stats={stats} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'bookings' && (
          <BookingsTab
            bookings={bookings}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onViewDetails={setSelectedBooking}
            onAddBooking={() => setShowAddBooking(true)}
          />
        )}
        {activeTab === 'calendar' && <CalendarTab />}
        {activeTab === 'overview' && <OverviewTab stats={stats} bookings={bookings} messages={messages} />}
        {activeTab === 'messages' && (
          <MessagesTab
            messages={messages}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onMessageClick={handleMessageClick}
            onMarkRead={handleMarkMessageRead}
            onMarkReplied={handleMarkMessageReplied}
            onDeleteMessage={handleDeleteMessage}
          />
        )}
        {activeTab === 'motorcycles' && <MotorcyclesTab />}
        {activeTab === 'revenue' && <RevenueTab bookings={bookings} />}
        {activeTab === 'link-generator' && <BookingLinkGeneratorTab />}
      </main>

      <BookingDetailModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onStatusUpdate={handleStatusUpdate}
        onDelete={handleDeleteBooking}
        onPaymentToggle={handlePaymentToggle}
        onUpdate={handleBookingUpdate}
        notify={notify}
      />

      <AddBookingModal
        show={showAddBooking}
        onClose={() => { setShowAddBooking(false); setNewBooking(EMPTY_BOOKING); setNewBookingRiders([]); }}
        newBooking={newBooking}
        setNewBooking={setNewBooking}
        onSubmit={handleAddBooking}
        calculateDays={calculateDays}
        calculatePrice={calculatePrice}
        riders={newBookingRiders}
        setRiders={setNewBookingRiders}
        isSubmitting={isSubmitting}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold transition-all border ${
          toast.type === 'error' ? 'bg-red-500/95 border-red-400/30 text-white' : 'bg-jaune border-jaune text-noir'
        }`}>
          {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-4">
          <div className="bg-[#141417] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <p className="text-white font-semibold mb-6 text-center">{confirmModal.msg}</p>
            <div className="flex gap-3">
              <button
                onClick={async () => { const fn = confirmModal.onConfirm; setConfirmModal(null); await fn(); }}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardClient;
