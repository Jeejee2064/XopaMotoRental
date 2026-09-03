'use client'
import React, { useState, useEffect } from 'react';
import { Bike, Power, AlertTriangle, Pencil, Check, X } from 'lucide-react';
import { getAllMotorcycles } from '@/lib/supabase/bookings';

async function patchMotorcycle(motorcycleId, updates) {
  const res = await fetch(`/api/admin/motorcycles/${motorcycleId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update motorcycle');
  return data.motorcycle;
}

const MotorcyclesTab = () => {
  const [motorcycles, setMotorcycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingKm, setEditingKm] = useState(null); // motorcycle id currently being edited
  const [kmDraft, setKmDraft] = useState('');
  const [savingKm, setSavingKm] = useState(false);

  useEffect(() => {
    loadMotorcycles();
  }, []);

  const loadMotorcycles = async () => {
    setLoading(true);
    try {
      const data = await getAllMotorcycles();
      setMotorcycles(data || []);
    } catch (error) {
      console.error('Error loading motorcycles:', error);
      alert('Error loading motorcycles: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (motorcycleId, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'enable' : 'disable';
    if (confirm(`Are you sure you want to ${action} this motorcycle?`)) {
      try {
        await patchMotorcycle(motorcycleId, { is_available: newStatus });
        await loadMotorcycles();
        alert(`Motorcycle ${newStatus ? 'enabled' : 'disabled'} successfully!`);
      } catch (error) {
        console.error('Error updating motorcycle availability:', error);
        alert('Error updating motorcycle: ' + error.message);
      }
    }
  };

  const startEditKm = (motorcycle) => {
    setEditingKm(motorcycle.id);
    setKmDraft(motorcycle.km ?? '');
  };

  const cancelEditKm = () => {
    setEditingKm(null);
    setKmDraft('');
  };

  const saveKm = async (motorcycleId) => {
    const value = parseInt(kmDraft, 10);
    if (isNaN(value) || value < 0) {
      alert('Please enter a valid number of kilometers.');
      return;
    }
    setSavingKm(true);
    try {
      await patchMotorcycle(motorcycleId, { km: value });
      await loadMotorcycles();
      setEditingKm(null);
      setKmDraft('');
    } catch (error) {
      console.error('Error saving km:', error);
      alert('Error saving km: ' + error.message);
    } finally {
      setSavingKm(false);
    }
  };

  const handleKmKeyDown = (e, motorcycleId) => {
    if (e.key === 'Enter') saveKm(motorcycleId);
    if (e.key === 'Escape') cancelEditKm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading motorcycles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Fleet Status</h3>
          <div className="text-sm text-gray-500">
            Total: {motorcycles.length} | Available: {motorcycles.filter(m => m.is_available).length}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {motorcycles.map(motorcycle => (
            <div
              key={motorcycle.id}
              className={`p-6 rounded-xl border-2 transition-all ${
                motorcycle.is_available
                  ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-400'
                  : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 opacity-75'
              }`}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <Bike size={32} className="text-gray-900" />
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  motorcycle.is_available
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}>
                  {motorcycle.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>

              {/* Name */}
              <h4 className="text-lg font-bold text-gray-900 mb-1">
                {motorcycle.name || `Motorcycle ${motorcycle.id}`}
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                {motorcycle.is_available ? 'Ready for rental' : 'Out of service'}
              </p>

              {/* KM field */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Odometer</p>
                {editingKm === motorcycle.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      autoFocus
                      value={kmDraft}
                      onChange={(e) => setKmDraft(e.target.value)}
                      onKeyDown={(e) => handleKmKeyDown(e, motorcycle.id)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                      placeholder="km"
                    />
                    <button
                      onClick={() => saveKm(motorcycle.id)}
                      disabled={savingKm}
                      className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={cancelEditKm}
                      className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditKm(motorcycle)}
                    className="group flex items-center gap-2 w-full px-3 py-1.5 bg-white/70 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-all"
                  >
                    <span className="text-sm font-semibold text-gray-800 flex-1 text-left">
                      {motorcycle.km != null
                        ? `${motorcycle.km.toLocaleString()} km`
                        : <span className="text-gray-400 font-normal">— set km</span>
                      }
                    </span>
                    <Pencil size={12} className="text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                  </button>
                )}
              </div>

              {/* Toggle button */}
              <button
                onClick={() => handleToggleAvailability(motorcycle.id, motorcycle.is_available)}
                className={`w-full px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                  motorcycle.is_available
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {motorcycle.is_available ? (
                  <><AlertTriangle size={16} /> Mark Unavailable</>
                ) : (
                  <><Power size={16} /> Mark Available</>
                )}
              </button>
            </div>
          ))}
        </div>

        {motorcycles.length === 0 && (
          <div className="text-center py-12">
            <Bike size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No motorcycles found in the system.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MotorcyclesTab;
