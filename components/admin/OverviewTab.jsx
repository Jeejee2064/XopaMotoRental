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
    },
    {
      label: 'Pending',
      value: stats.pendingBookings,
      icon: AlertCircle,
      accent: 'jaune',
    },
    {
      label: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(0)}`,
      icon: DollarSign,
      highlight: true,
    },
    {
      label: 'Unread Messages',
      value: stats.unreadMessages,
      icon: MessageSquare,
      accent: 'red',
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
            className={`p-6 rounded-xl border ${
              stat.highlight ? 'bg-jaune border-jaune' : 'bg-[#131316] border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${stat.highlight ? 'text-noir/60' : 'text-white/40'}`}>{stat.label}</p>
                <p className={`text-4xl font-heading font-black mt-1 ${
                  stat.highlight ? 'text-noir' : stat.accent === 'red' ? 'text-red-400' : 'text-white'
                }`}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                stat.highlight ? 'bg-noir/10' : stat.accent === 'red' ? 'bg-red-500/10' : 'bg-jaune/10'
              }`}>
                <stat.icon className={stat.highlight ? 'text-noir' : stat.accent === 'red' ? 'text-red-400' : 'text-jaune'} size={24} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-[#131316] p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">Recent Bookings</h3>
          <div className="space-y-3">
            {bookings.slice(0, 5).map(booking => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-white">{booking.first_name} {booking.last_name}</p>
                  <p className="text-sm text-white/40">{booking.start_date} - {booking.end_date}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  booking.status === 'fully paid' ? 'bg-green-500/15 text-green-400' :
                  booking.status === 'confirmed' ? 'bg-white/10 text-white' :
                  booking.status === 'pending' ? 'bg-jaune/15 text-jaune' :
                  booking.status === 'cancelled' ? 'bg-red-500/15 text-red-400' :
                  'bg-white/10 text-white/60'
                }`}>
                  {booking.status}
                </span>
              </div>
            ))}
            {bookings.length === 0 && (
              <p className="text-sm text-white/30 text-center py-4">No bookings yet.</p>
            )}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-[#131316] p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">Recent Messages</h3>
          <div className="space-y-3">
            {messages.slice(0, 5).map(msg => (
              <div key={msg.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${msg.status === 'unread' ? 'bg-red-400' : 'bg-white/20'}`}></div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{msg.name}</p>
                  <p className="text-sm text-white/40 truncate">{msg.message}</p>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-sm text-white/30 text-center py-4">No messages yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
