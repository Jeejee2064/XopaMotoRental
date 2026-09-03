'use client';
import React from 'react';
import { Calendar, MessageSquare, Bike, TrendingUp, Link as LinkIcon } from 'lucide-react';

const AdminNavigation = ({ activeTab, setActiveTab, stats = {} }) => {
  const pending = stats.pendingBookings || 0;
  const unread = stats.unreadMessages || 0;

  const tabs = [
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'bookings', label: 'Bookings', icon: Calendar, badge: pending },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unread },
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'motorcycles', label: 'Motorcycles', icon: Bike },
    { id: 'revenue', label: 'Revenue', icon: TrendingUp },
    { id: 'link-generator', label: 'Links', icon: LinkIcon },
  ];

  return (
    <div className="bg-noir border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        {/* allow horizontal scroll on small screens */}
        <nav className="flex gap-8 overflow-x-auto no-scrollbar py-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-jaune text-jaune'
                  : 'border-transparent text-gris/50 hover:text-white'
              }`}
            >
              <tab.icon size={20} />

              <span className="font-heading uppercase tracking-wide font-bold text-sm">{tab.label}</span>

              {tab.badge > 0 && (
                <span
                  className={`ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    tab.id === 'messages' ? 'bg-red-500 text-white' : 'bg-jaune text-noir'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default AdminNavigation;
