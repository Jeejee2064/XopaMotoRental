'use client'
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, MessageSquare, AlertCircle } from 'lucide-react';

const OverviewTab = ({ stats, bookings, messages }) => {
  const statCards = [
    {
      label: 'Total Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Pending',
      value: stats.pendingBookings,
      icon: AlertCircle,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      valueColor: 'text-yellow-600'
    },
    {
      label: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(0)}`,
      icon: DollarSign,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      valueColor: 'text-green-600'
    },
    {
      label: 'Unread Messages',
      value: stats.unreadMessages,
      icon: MessageSquare,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
      valueColor: 'text-red-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${stat.valueColor || 'text-gray-900'}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={stat.iconColor} size={24} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Bookings</h3>
          <div className="space-y-3">
            {bookings.slice(0, 5).map(booking => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{booking.first_name} {booking.last_name}</p>
                  <p className="text-sm text-gray-500">{booking.start_date} - {booking.end_date}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {booking.status}
                </span>
              </div>
            ))}
            {bookings.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No bookings yet.</p>
            )}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Messages</h3>
          <div className="space-y-3">
            {messages.slice(0, 5).map(msg => (
              <div key={msg.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${msg.status === 'unread' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{msg.name}</p>
                  <p className="text-sm text-gray-500 truncate">{msg.message}</p>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No messages yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
