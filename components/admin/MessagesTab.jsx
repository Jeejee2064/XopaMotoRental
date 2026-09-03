'use client'
import React from 'react';
import { Search } from 'lucide-react';

const MessagesTab = ({ messages, searchTerm, setSearchTerm, onMessageClick, onMarkRead, onMarkReplied, onDeleteMessage }) => {
  const filteredMessages = messages.filter(msg =>
    msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
        />
      </div>

      {/* Messages List */}
      <div className="grid gap-4">
        {filteredMessages.map(msg => (
          <div
            key={msg.id}
            className={`bg-white p-6 rounded-xl shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
              msg.status === 'unread' ? 'border-yellow-400' : 'border-gray-200'
            }`}
            onClick={() => onMessageClick(msg)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">{msg.name}</h3>
                  {msg.status === 'unread' && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">New</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{msg.email}</p>
                {msg.phone && <p className="text-sm text-gray-500">{msg.phone}</p>}
              </div>
              <span className="text-sm text-gray-400">
                {new Date(msg.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-700 mb-3">{msg.message}</p>
            <div className="flex gap-2">
              {msg.status === 'unread' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onMarkRead(msg.id); }}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200"
                >
                  Mark as Read
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkReplied(msg.id);
                }}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-200"
              >
                Mark as Replied
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteMessage(msg.id);
                }}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {filteredMessages.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No messages yet.</p>
        )}
      </div>
    </div>
  );
};

export default MessagesTab;
