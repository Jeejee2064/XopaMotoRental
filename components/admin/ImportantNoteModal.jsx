'use client'
import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

// Small popup used by the bookings list and the calendar to surface a
// booking's important note without opening the full detail view.
const ImportantNoteModal = ({ note, onClose }) => {
  if (!note && note !== '') return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-[#141417] rounded-xl shadow-2xl w-full max-w-md relative p-6 border-2 border-red-500/30" onClick={(e) => e.stopPropagation()}>
        <button
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <h3 className="text-lg font-bold mb-4 text-red-400 flex items-center gap-2 pr-6">
          <AlertTriangle size={20} />
          Important Note
        </h3>
        <p className="text-white/90 bg-red-500/10 border border-red-500/20 rounded-lg p-4 whitespace-pre-wrap">
          {note || 'No note text.'}
        </p>
      </div>
    </div>
  );
};

export default ImportantNoteModal;
