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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={20} />
        <input
          type="text"
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-lg focus:ring-2 focus:ring-jaune focus:border-transparent outline-none"
        />
      </div>

      {/* Messages List */}
      <div className="grid gap-4">
        {filteredMessages.map(msg => (
          <div
            key={msg.id}
            className={`bg-[#131316] p-6 rounded-xl border-2 cursor-pointer transition-all hover:border-white/20 ${
              msg.status === 'unread' ? 'border-jaune/50' : 'border-white/10'
            }`}
            onClick={() => onMessageClick(msg)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white">{msg.name}</h3>
                  {msg.status === 'unread' && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">New</span>
                  )}
                </div>
                <p className="text-sm text-white/40">{msg.email}</p>
                {msg.phone && <p className="text-sm text-white/40">{msg.phone}</p>}
              </div>
              <span className="text-sm text-white/30">
                {new Date(msg.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-white/70 mb-3">{msg.message}</p>
            <div className="flex gap-2">
              {msg.status === 'unread' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onMarkRead(msg.id); }}
                  className="px-3 py-1 bg-jaune/15 text-jaune rounded-lg text-sm font-semibold hover:bg-jaune/25"
                >
                  Mark as Read
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkReplied(msg.id);
                }}
                className="px-3 py-1 bg-green-500/15 text-green-400 rounded-lg text-sm font-semibold hover:bg-green-500/25"
              >
                Mark as Replied
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteMessage(msg.id);
                }}
                className="px-3 py-1 bg-red-500/15 text-red-400 rounded-lg text-sm font-semibold hover:bg-red-500/25"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {filteredMessages.length === 0 && (
          <p className="text-sm text-white/30 text-center py-8">No messages yet.</p>
        )}
      </div>
    </div>
  );
};

export default MessagesTab;
