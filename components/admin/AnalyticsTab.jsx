'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Users, MousePointerClick, TrendingUp } from 'lucide-react';
import { getAnalyticsSummary } from '@/lib/supabase/analytics';

const JAUNE = '#E6F802';
const CYAN = '#02D6FC';

const RANGES = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 }
];

const fmtInt = (n) => new Intl.NumberFormat('en-US').format(n);
const fmtDay = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── KPI card ──────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, accent }) {
  return (
    <div className={`rounded-xl p-4 border ${accent ? 'bg-jaune border-jaune' : 'bg-[#131316] border-white/10'}`}>
      <div className="flex items-center gap-2">
        <Icon size={14} className={accent ? 'text-noir/60' : 'text-white/35'} />
        <p className={`text-[11px] font-semibold uppercase tracking-widest ${accent ? 'text-noir/60' : 'text-white/35'}`}>{label}</p>
      </div>
      <p className={`text-3xl font-heading font-black leading-none mt-2 ${accent ? 'text-noir' : 'text-white'}`}>{value}</p>
    </div>
  );
}

// ─── Page views line chart ───────────────────────────────────────────────────

function PageViewsChart({ data }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      if (chartRef.current) chartRef.current.destroy();

      const gradient = ctx.createLinearGradient(0, 0, 0, 220);
      gradient.addColorStop(0, 'rgba(230,248,2,0.25)');
      gradient.addColorStop(1, 'rgba(230,248,2,0)');

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map((d) => fmtDay(d.date)),
          datasets: [
            {
              label: 'Page views',
              data: data.map((d) => d.count),
              borderColor: JAUNE,
              backgroundColor: gradient,
              borderWidth: 2,
              tension: 0.3,
              fill: true,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: JAUNE,
              pointHoverBorderColor: '#050507',
              pointHoverBorderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1a1a1e',
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              titleColor: '#fff',
              bodyColor: '#e6e6e6',
              callbacks: { label: (c) => ` ${c.parsed.y} view${c.parsed.y === 1 ? '' : 's'}` }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { autoSkip: true, maxTicksLimit: 10, font: { size: 11 }, color: 'rgba(255,255,255,0.45)' }
            },
            y: {
              beginAtZero: true,
              ticks: { font: { size: 11 }, color: 'rgba(255,255,255,0.35)', precision: 0 },
              grid: { color: 'rgba(255,255,255,0.06)' }
            }
          }
        }
      });
    });

    return () => { chartRef.current?.destroy(); };
  }, [data]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '220px' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}

// ─── Funnel ───────────────────────────────────────────────────────────────

function Funnel({ title, steps }) {
  const max = Math.max(1, ...steps.map((s) => s.count));
  return (
    <div className="bg-[#131316] rounded-2xl border border-white/10 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/35 mb-4">{title}</p>
      <div className="space-y-3">
        {steps.map((step, i) => {
          const widthPct = Math.max(4, (step.count / max) * 100);
          const prev = i > 0 ? steps[i - 1].count : null;
          const dropPct = prev ? (prev === 0 ? null : Math.round((step.count / prev) * 100)) : null;
          return (
            <div key={step.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white/70">{step.label}</span>
                <span className="text-sm font-bold text-white tabular-nums">
                  {fmtInt(step.count)}
                  {dropPct !== null && <span className="text-white/35 font-normal"> · {dropPct}%</span>}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${widthPct}%`, background: i === 0 ? 'rgba(255,255,255,0.3)' : JAUNE }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Simple ranked list ─────────────────────────────────────────────────────

function RankedList({ title, rows, renderLabel, emptyLabel }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="bg-[#131316] rounded-2xl border border-white/10 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/35 mb-4">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-white/30 py-4 text-center">{emptyLabel}</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((row) => (
            <div key={row.key}>
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="text-sm text-white/80 truncate">{renderLabel(row.key)}</span>
                <span className="text-sm font-bold text-white tabular-nums flex-shrink-0">{fmtInt(row.count)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(row.count / max) * 100}%`, background: CYAN }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────

const AnalyticsTab = () => {
  const [rangeDays, setRangeDays] = useState(30);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAnalyticsSummary(rangeDays)
      .then((data) => { if (!cancelled) setSummary(data); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [rangeDays]);

  const conversionRate = useMemo(() => {
    if (!summary?.mainFunnel?.length) return null;
    const visits = summary.mainFunnel[0]?.count || 0;
    const confirmed = summary.mainFunnel[summary.mainFunnel.length - 1]?.count || 0;
    if (visits === 0) return null;
    return ((confirmed / visits) * 100).toFixed(1);
  }, [summary]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-heading font-black text-white tracking-wide">Analytics</h2>
          <p className="text-xs text-white/35 mt-0.5">Traffic, link clicks and sales funnel — no PII, no IP tracking</p>
        </div>
        <div className="flex items-center gap-1 bg-[#131316] border border-white/10 rounded-xl p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setRangeDays(r.days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                rangeDays === r.days ? 'bg-jaune text-noir' : 'text-white/50 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="py-16 text-center">
          <div className="w-10 h-10 border-4 border-jaune border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-white/35 text-sm">Loading analytics...</p>
        </div>
      )}

      {!loading && error && (
        <div className="py-10 text-center bg-[#131316] rounded-2xl border border-white/10">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && summary && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard icon={Eye} label="Page views" value={fmtInt(summary.totals.pageViews)} accent />
            <KpiCard icon={Users} label="Unique visitors" value={fmtInt(summary.totals.uniqueVisitors)} />
            <KpiCard icon={MousePointerClick} label="Link clicks" value={fmtInt(summary.totals.linkClicks)} />
            <KpiCard icon={TrendingUp} label="Visit → booking rate" value={conversionRate !== null ? `${conversionRate}%` : '—'} />
          </div>

          {/* Page views chart */}
          <div className="bg-[#131316] rounded-2xl border border-white/10 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/35 mb-4">
              Page views — last {rangeDays} days
            </p>
            <PageViewsChart data={summary.pageViewsByDay} />
          </div>

          {/* Funnels */}
          <div className="grid md:grid-cols-2 gap-4">
            <Funnel title="Sales funnel" steps={summary.mainFunnel} />
            <Funnel title="Deposit hold funnel" steps={summary.depositFunnel} />
          </div>

          {/* Ranked lists */}
          <div className="grid md:grid-cols-3 gap-4">
            <RankedList
              title="Top pages"
              rows={summary.topPages.map((p) => ({ key: p.path, count: p.count }))}
              renderLabel={(path) => path}
              emptyLabel="No page views yet."
            />
            <RankedList
              title="Top referrers"
              rows={summary.topReferrers.map((r) => ({ key: r.referrer, count: r.count }))}
              renderLabel={(host) => host}
              emptyLabel="No referrer data yet."
            />
            <RankedList
              title="Most clicked links"
              rows={summary.topLinkClicks.map((l) => ({ key: l.href, count: l.count }))}
              renderLabel={(href) => href}
              emptyLabel="No link clicks yet."
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsTab;
