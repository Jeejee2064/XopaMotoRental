'use client'

import React, { useMemo, useState, useRef, useEffect } from 'react';

const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const pct = (a, b) => (b === 0 ? null : ((a - b) / b) * 100);

function getDays(start, end) {
  return Math.ceil(Math.abs(new Date(end) - new Date(start)) / 864e5) + 1;
}

const isPaid = (b) => b.status === 'fully paid';
const isPending = (b) => ['confirmed', 'pending'].includes(b.status);

// ─── Stacked bar chart ────────────────────────────────────────────────────────

function MonthBarChart({ paidRevs, pendingRevs, activeMonth, onMonthClick }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      if (chartRef.current) chartRef.current.destroy();

      chartRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: MONTHS_SHORT,
          datasets: [
            {
              label: 'Fully paid',
              data: paidRevs,
              backgroundColor: MONTHS_SHORT.map((_, i) =>
                i === activeMonth ? '#FACC15' : 'rgba(250,204,21,0.55)'
              ),
              borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 4, bottomRight: 4 },
              borderSkipped: 'bottom',
              stack: 'revenue',
            },
            {
              label: 'To be paid',
              data: pendingRevs,
              backgroundColor: MONTHS_SHORT.map((_, i) =>
                i === activeMonth ? 'rgba(156,163,175,0.6)' : 'rgba(156,163,175,0.3)'
              ),
              borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
              borderSkipped: 'top',
              stack: 'revenue',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c) => ' ' + c.dataset.label + ': ' + fmt(c.parsed.y),
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { autoSkip: false, font: { size: 11 } },
              stacked: true,
            },
            y: {
              beginAtZero: true,
              stacked: true,
              ticks: {
                font: { size: 11 },
                callback: (v) =>
                  v >= 1000
                    ? '$' + (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + 'k'
                    : '$' + v,
              },
              grid: { color: 'rgba(136,135,128,0.12)' },
            },
          },
          onClick: (_, elements) => {
            if (elements.length > 0) onMonthClick(elements[0].index);
          },
        },
      });
    });

    return () => { chartRef.current?.destroy(); };
  }, [paidRevs, pendingRevs, activeMonth]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '220px', cursor: 'pointer' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ booking }) {
  if (isPaid(booking)) {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
        Paid
      </span>
    );
  }
  if (booking.status === 'confirmed') {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
        Confirmed
      </span>
    );
  }
  if (booking.status === 'pending') {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
        Pending
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
      {booking.status}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
// Single model/location, so unlike Overland's RevenueTab there's no "revenue
// by model" split to show — every booking here is the same bike.

const RevenueTab = ({ bookings = [] }) => {
  const now = new Date();
  const [curYear, setCurYear] = useState(now.getFullYear());
  const [curMonth, setCurMonth] = useState(now.getMonth());

  const rev = (arr) => arr.reduce((s, b) => s + parseFloat(b.total_price), 0);

  const inMonth = (b, y, m) => {
    const d = new Date(b.start_date);
    return d.getFullYear() === y && d.getMonth() === m;
  };

  const paidBookings = useMemo(() => bookings.filter(isPaid), [bookings]);
  const pendingBookings = useMemo(() => bookings.filter(isPending), [bookings]);

  // ── Month KPIs ──
  const monthPaid = paidBookings.filter(b => inMonth(b, curYear, curMonth));
  const monthPending = pendingBookings.filter(b => inMonth(b, curYear, curMonth));
  const monthAll = bookings.filter(b => inMonth(b, curYear, curMonth) && (isPaid(b) || isPending(b)));

  const prevM = curMonth === 0 ? 11 : curMonth - 1;
  const prevY = curMonth === 0 ? curYear - 1 : curYear;
  const prevPaid = paidBookings.filter(b => inMonth(b, prevY, prevM));

  const monthRev = rev(monthPaid);
  const monthPendRev = rev(monthPending);
  const prevRev = rev(prevPaid);
  const delta = pct(monthRev, prevRev);
  const avg = monthPaid.length > 0 ? monthRev / monthPaid.length : null;

  // ── Chart data (per year) ──
  const paidRevs = useMemo(() =>
    MONTHS_SHORT.map((_, i) =>
      Math.round(rev(paidBookings.filter(b =>
        new Date(b.start_date).getFullYear() === curYear &&
        new Date(b.start_date).getMonth() === i
      )))
    ), [paidBookings, curYear]);

  const pendingRevs = useMemo(() =>
    MONTHS_SHORT.map((_, i) =>
      Math.round(rev(pendingBookings.filter(b =>
        new Date(b.start_date).getFullYear() === curYear &&
        new Date(b.start_date).getMonth() === i
      )))
    ), [pendingBookings, curYear]);

  // ── All-time ──
  const allTimeRev = rev(paidBookings);
  const allTimeAvg = paidBookings.length > 0 ? allTimeRev / paidBookings.length : 0;

  const allMonthMap = {};
  paidBookings.forEach(b => {
    const d = new Date(b.start_date);
    const key = `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
    allMonthMap[key] = (allMonthMap[key] || 0) + parseFloat(b.total_price);
  });
  const bestMonthEntry = Object.entries(allMonthMap).sort((a, b) => b[1] - a[1])[0];

  // ── Years for selector ──
  const years = useMemo(() => {
    const ys = new Set([...paidBookings, ...pendingBookings].map(b => new Date(b.start_date).getFullYear()));
    ys.add(now.getFullYear());
    return [...ys].sort((a, b) => b - a);
  }, [paidBookings, pendingBookings]);

  // ── Nav ──
  const prevMonth = () => {
    if (curMonth === 0) { setCurMonth(11); setCurYear(y => y - 1); }
    else setCurMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (curMonth === 11) { setCurMonth(0); setCurYear(y => y + 1); }
    else setCurMonth(m => m + 1);
  };

  const navBtn = {
    background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '8px',
    width: '32px', height: '32px', cursor: 'pointer', fontSize: '15px',
    color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Revenue</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Earnings = <span className="font-semibold text-gray-500">fully paid</span> only · confirmed bookings shown as pipeline
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
          <button onClick={prevMonth} style={navBtn}>←</button>
          <span className="text-sm font-semibold text-gray-800 min-w-[140px] text-center">
            {MONTHS_LONG[curMonth]} {curYear}
          </span>
          <button onClick={nextMonth} style={navBtn}>→</button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-4 bg-yellow-400">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-yellow-800">Earned this month</p>
          <p className="text-3xl font-black text-yellow-900 leading-none mt-1">{fmt(monthRev)}</p>
          {delta !== null && (
            <p className="text-[11px] font-semibold mt-1 text-yellow-800">
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs last month
            </p>
          )}
        </div>

        <div className="rounded-xl p-4 bg-white border border-gray-100 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Pipeline this month</p>
          <p className="text-3xl font-black text-gray-900 leading-none mt-1">{fmt(monthPendRev)}</p>
          <p className="text-[11px] text-gray-400 mt-1">{monthPending.length} booking{monthPending.length !== 1 ? 's' : ''} to be paid</p>
        </div>

        <div className="rounded-xl p-4 bg-white border border-gray-100 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Avg per booking</p>
          <p className="text-3xl font-black text-gray-900 leading-none mt-1">{avg !== null ? fmt(avg) : '—'}</p>
          <p className="text-[11px] text-gray-400 mt-1">{prevPaid.length > 0 ? `${prevPaid.length} paid last month` : 'no data last month'}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Monthly revenue — click a bar to switch month
          </p>
          <select
            value={curYear}
            onChange={e => setCurYear(Number(e.target.value))}
            className="text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 cursor-pointer outline-none"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-5 mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#FACC15' }} />
            <span className="text-[11px] text-gray-500">Fully paid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(156,163,175,0.55)' }} />
            <span className="text-[11px] text-gray-500">To be paid</span>
          </div>
        </div>
        <MonthBarChart
          paidRevs={paidRevs}
          pendingRevs={pendingRevs}
          activeMonth={curMonth}
          onMonthClick={(i) => setCurMonth(i)}
        />
      </div>

      {/* All bookings this month */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
          All bookings this month
        </p>
        {monthAll.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No bookings this month.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {monthAll.map(b => (
              <div key={b.id} className="flex items-center justify-between py-2.5 gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{b.first_name} {b.last_name}</p>
                  <p className="text-[11px] text-gray-400">
                    {b.start_date} → {b.end_date} · {getDays(b.start_date, b.end_date)}d
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <StatusBadge booking={b} />
                  <span className={`text-sm font-bold tabular-nums ${isPaid(b) ? 'text-gray-900' : 'text-gray-400'}`}>
                    {fmt(parseFloat(b.total_price))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All-time section */}
      <div className="border-t border-gray-200 pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-4">All time</p>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl p-4 bg-gray-900">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Total revenue</p>
            <p className="text-3xl font-black text-yellow-400 leading-none mt-1">{fmt(allTimeRev)}</p>
            <p className="text-[11px] text-gray-500 mt-1">{paidBookings.length} paid bookings</p>
          </div>

          <div className="rounded-xl p-4 bg-white border border-gray-100 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Avg per booking</p>
            <p className="text-3xl font-black text-gray-900 leading-none mt-1">
              {paidBookings.length > 0 ? fmt(allTimeAvg) : '—'}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">across all paid bookings</p>
          </div>

          <div className="rounded-xl p-4 bg-white border border-gray-100 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Best month</p>
            <p className="text-3xl font-black text-gray-900 leading-none mt-1">
              {bestMonthEntry ? fmt(bestMonthEntry[1]) : '—'}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">{bestMonthEntry ? bestMonthEntry[0] : 'no data yet'}</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default RevenueTab;
