'use client'
import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

// Small popup used by the bookings list and the calendar to surface a
// booking's important note without opening the full detail view.
const ImportantNoteModal = ({ note, onClose }) => {
  if (!note && note !== '') return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative p-6 border-2 border-red-300" onClick={(e) => e.stopPropagation()}>
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <h3 className="text-lg font-bold mb-4 text-red-700 flex items-center gap-2 pr-6">
          <AlertTriangle size={20} />
          Important Note
        </h3>
        <p className="text-gray-800 bg-red-50 border border-red-200 rounded-lg p-4 whitespace-pre-wrap">
          {note || 'No note text.'}
        </p>
      </div>
    </div>
  );
};

export default ImportantNoteModal;
