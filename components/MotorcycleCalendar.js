'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, ExternalLink, AlertTriangle } from 'lucide-react';
import { getMotorcycleCalendarWithPhone, getAllMotorcycles } from '@/lib/supabase/bookings';
import ImportantNoteModal from '@/components/admin/ImportantNoteModal';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  addMonths,
  isWithinInterval,
} from 'date-fns';

const MOTORCYCLE_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', bar: 'bg-blue-500', text: 'text-blue-800' },
  { bg: 'bg-green-50', border: 'border-green-200', bar: 'bg-green-500', text: 'text-green-800' },
  { bg: 'bg-purple-50', border: 'border-purple-200', bar: 'bg-purple-500', text: 'text-purple-800' },
  { bg: 'bg-orange-50', border: 'border-orange-200', bar: 'bg-orange-500', text: 'text-orange-800' },
];

const LEFT_COLUMN_WIDTH = 200;
const MIN_CELL_WIDTH = 28;

const parseLocalDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
};

export default function MotorcycleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [motorcycles, setMotorcycles] = useState([]);
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colorMap, setColorMap] = useState({});
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [noteBooking, setNoteBooking] = useState(null);
  const [cellWidth, setCellWidth] = useState(40);
  const containerRef = useRef(null);

  const recalcCellWidth = useCallback(() => {
    if (!containerRef.current) return;
    const available = containerRef.current.offsetWidth - LEFT_COLUMN_WIDTH;
    const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) }).length;
    setCellWidth(Math.max(MIN_CELL_WIDTH, Math.floor(available / days)));
  }, [currentDate]);

  useEffect(() => {
    recalcCellWidth();
    window.addEventListener('resize', recalcCellWidth);
    return () => window.removeEventListener('resize', recalcCellWidth);
  }, [recalcCellWidth]);

  useEffect(() => {
    if (!loading) recalcCellWidth();
  }, [loading, recalcCellWidth]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const startStr = format(monthStart, 'yyyy-MM-dd');
      const endStr = format(monthEnd, 'yyyy-MM-dd');

      const [bikes, bookings] = await Promise.all([
        getAllMotorcycles(),
        getMotorcycleCalendarWithPhone(startStr, endStr),
      ]);

      setMotorcycles(bikes || []);
      setCalendarData(bookings || []);

      const map = {};
      (bikes || []).forEach((b, i) => {
        map[b.id] = MOTORCYCLE_COLORS[i % MOTORCYCLE_COLORS.length];
      });
      setColorMap(map);
    } catch (err) {
      console.error('Error loading calendar', err);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => setCurrentDate(addMonths(currentDate, -1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const monthName = format(currentDate, 'MMMM yyyy');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const gridColumns = `${LEFT_COLUMN_WIDTH}px repeat(${daysInMonth.length}, ${cellWidth}px)`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{monthName}</h2>
        <div className="flex items-center gap-2">
          <select
            value={currentDate.getMonth()}
            onChange={(e) => {
              const d = new Date(currentDate);
              d.setMonth(parseInt(e.target.value));
              setCurrentDate(d);
            }}
            className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 cursor-pointer"
          >
            {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <select
            value={currentDate.getFullYear()}
            onChange={(e) => {
              const d = new Date(currentDate);
              d.setFullYear(parseInt(e.target.value));
              setCurrentDate(d);
            }}
            className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 cursor-pointer"
          >
            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 1 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            Today
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight size={22} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div ref={containerRef} className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
        <div style={{ display: 'grid', gridTemplateColumns: gridColumns }}>
          {/* Header Row */}
          <div className="sticky left-0 bg-gray-50 border-r border-b-2 border-gray-300 font-semibold text-sm py-3 px-3 z-20">
            Motorcycle
          </div>
          {daysInMonth.map((d) => {
            const isToday = isSameDay(d, new Date());
            return (
              <div
                key={format(d, 'yyyy-MM-dd')}
                className={`text-center text-xs py-2 border-r border-b-2 border-gray-300 ${
                  isToday ? 'bg-yellow-50 font-bold' : 'bg-gray-50'
                }`}
              >
                <div className={`font-semibold ${isToday ? 'text-yellow-700' : 'text-gray-900'}`}>
                  {format(d, 'd')}
                </div>
                <div className={`text-[10px] ${isToday ? 'text-yellow-600' : 'text-gray-500'}`}>
                  {format(d, 'EEE')}
                </div>
              </div>
            );
          })}

          {/* Motorcycle Rows */}
          {motorcycles.map((bike) => {
            const bookings = calendarData
              .filter((b) => {
                if (b.motorcycle_id !== bike.id) return false;
                const start = parseLocalDate(b.start_date);
                const end = parseLocalDate(b.end_date);
                return (
                  isWithinInterval(start, { start: monthStart, end: monthEnd }) ||
                  isWithinInterval(end, { start: monthStart, end: monthEnd }) ||
                  (start <= monthStart && end >= monthEnd)
                );
              })
              .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

            const color = colorMap[bike.id];

            return (
              <React.Fragment key={bike.id}>
                <div className="relative col-span-full flex">
                  {/* Left Column */}
                  <div
                    className={`sticky left-0 ${color.bg} ${color.border} border-r border-b px-3 py-3 font-medium text-gray-800 z-10 flex items-center`}
                    style={{ width: LEFT_COLUMN_WIDTH }}
                  >
                    {bike.name}
                  </div>

                  {/* Day cells */}
                  {daysInMonth.map((day) => (
                    <div
                      key={format(day, 'yyyy-MM-dd')}
                      className="h-14 border-b border-r border-gray-100"
                      style={{ width: cellWidth }}
                    />
                  ))}

                  {/* Booking Bars */}
                  <div className="absolute top-0 left-0 h-14 w-full pointer-events-none">
                    <div className="relative h-full" style={{ marginLeft: LEFT_COLUMN_WIDTH }}>
                      {bookings.map((b) => {
                        const bookingStart = parseLocalDate(b.start_date);
                        const bookingEnd = parseLocalDate(b.end_date);
                        const visibleStart = bookingStart < monthStart ? monthStart : bookingStart;
                        const visibleEnd = bookingEnd > monthEnd ? monthEnd : bookingEnd;

                        const startIdx = daysInMonth.findIndex((d) => isSameDay(d, visibleStart));
                        const endIdx = daysInMonth.findIndex((d) => isSameDay(d, visibleEnd));

                        const leftPos = (startIdx === -1 ? 0 : startIdx) * cellWidth + 2;
                        const width =
                          ((endIdx === -1 ? daysInMonth.length - 1 : endIdx) -
                            (startIdx === -1 ? 0 : startIdx) + 1) * cellWidth - 4;

                        return (
                          <div
                            key={`${b.id ?? b.booking_id}-${b.motorcycle_id}-${b.start_date}`}
                            className={`absolute top-2 rounded-md px-2 flex items-center justify-center ${color.bar} text-white text-xs font-medium shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-pointer pointer-events-auto`}
                            style={{ left: `${leftPos}px`, width: `${width}px`, height: '40px' }}
                            onClick={() => setSelectedBooking({ ...b, motorcycle_name: bike.name })}
                          >
                            {b.important_note && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setNoteBooking(b); }}
                                title="Important note — click to view"
                                className="mr-1 flex-shrink-0 bg-white/90 text-red-600 rounded-full p-0.5 hover:bg-white transition"
                              >
                                <AlertTriangle size={12} />
                              </button>
                            )}
                            <span className="truncate">
                              {b.display_name || b.customer_name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-50 border border-yellow-300 rounded"></div>
          <span>Today</span>
        </div>
        {motorcycles.map((bike) => {
          const color = colorMap[bike.id];
          return (
            <div key={bike.id} className="flex items-center gap-2">
              <div className={`w-3 h-3 ${color.bar} rounded`}></div>
              <span>{bike.name}</span>
            </div>
          );
        })}
      </div>

      {/* Booking Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
              onClick={() => setSelectedBooking(null)}
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-4 text-gray-900 border-b pb-3">
              Booking Details
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold text-gray-600">Rider:</span>{' '}
                <span className="font-medium text-gray-900">{selectedBooking.display_name || selectedBooking.customer_name}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Motorcycle:</span>{' '}
                <span className="font-medium text-gray-900">{selectedBooking.motorcycle_name}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Period:</span>{' '}
                <span className="font-medium text-gray-900">
                  {format(parseLocalDate(selectedBooking.start_date), 'MMM d, yyyy')} –{' '}
                  {format(parseLocalDate(selectedBooking.end_date), 'MMM d, yyyy')}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Duration:</span>{' '}
                <span className="font-medium text-gray-900">
                  {selectedBooking.duration_days || '-'} days
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Phone:</span>{' '}
                <a
                  href={`https://wa.me/${(selectedBooking.phone || '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline"
                >
                  {selectedBooking.phone || '—'}
                </a>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Email:</span>{' '}
                <a href={`mailto:${selectedBooking.display_email}`} className="text-blue-600 hover:underline">
                  {selectedBooking.display_email}
                </a>
              </div>
              <div>
                <span className="font-semibold text-gray-600">Status:</span>{' '}
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    selectedBooking.status === 'confirmed' || selectedBooking.status === 'fully paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {selectedBooking.status}
                </span>
              </div>
              {selectedBooking.important_note && (
                <div>
                  <button
                    onClick={() => setNoteBooking(selectedBooking)}
                    className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 border border-red-300 text-xs font-bold rounded-full hover:bg-red-200 transition"
                  >
                    <AlertTriangle size={12} />
                    Important — click to view note
                  </button>
                </div>
              )}
            </div>

            {/* View Details button */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <a
                href={`/admin/ok/bookings/${selectedBooking.id ?? selectedBooking.booking_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-lg transition-colors text-sm"
              >
                <ExternalLink size={16} />
                View Full Details
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Important Note Modal */}
      {noteBooking && (
        <ImportantNoteModal note={noteBooking.special_requests} onClose={() => setNoteBooking(null)} />
      )}
    </div>
  );
}
