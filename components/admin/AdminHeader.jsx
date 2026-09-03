'use client'
import React from 'react';

const AdminHeader = ({ onRefresh, onLogout }) => {
  return (
    <header className="bg-noir border-b border-jaune/20 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-heading font-black text-white tracking-wide">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gris/50 mt-0.5">XOPA Moto Rental</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-jaune text-noir font-bold rounded-lg hover:brightness-95 transition-colors"
            >
              Refresh Data
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-white/5 border border-white/10 text-gris font-semibold rounded-lg hover:bg-white/10 hover:text-white transition-colors"
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
