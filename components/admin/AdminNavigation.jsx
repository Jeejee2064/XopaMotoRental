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
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        {/* allow horizontal scroll on small screens */}
        <nav className="flex gap-8 overflow-x-auto no-scrollbar py-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-yellow-400 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <tab.icon size={20} />

              <span className="font-semibold">{tab.label}</span>

              {tab.badge > 0 && (
                <span
                  className={`ml-2 text-white text-xs px-2 py-0.5 rounded-full ${
                    tab.id === 'messages' ? 'bg-red-500' : 'bg-yellow-500'
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
