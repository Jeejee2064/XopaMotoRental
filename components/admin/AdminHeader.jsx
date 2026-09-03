'use client'
import React from 'react';

const AdminHeader = ({ onRefresh, onLogout }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">XOPA Moto Rental</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-yellow-400 text-gray-900 font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
            >
              Refresh Data
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
