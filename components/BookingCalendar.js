'use client';
import { useEffect, useState } from 'react';
import { DateRange } from 'react-date-range';
import { es, enUS, fr } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';
import { checkBikesAvailabilityRangeByModel, getFleetSize } from '@/lib/supabase/bookings';
import { siteConfig } from '@/lib/site-config';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const DATE_FNS_LOCALES = { es, en: enUS, fr };

// Xopa has one model/location, so — unlike Overland's Coronado/Panama City
// branching — this always checks the same (model, location) pair, and the
// bike count comes from the real fleet size in `motorcycles`, not a
// hardcoded fallback.
export default function BookingCalendar({ onDateRangeChange }) {
  const t = useTranslations('calendar');
  const locale = useLocale();
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [maxBikes, setMaxBikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [selectedRange, setSelectedRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection'
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const [data, fleetSize] = await Promise.all([
          checkBikesAvailabilityRangeByModel(siteConfig.fleet.model, siteConfig.fleet.location),
          getFleetSize(siteConfig.fleet.model, siteConfig.fleet.location)
        ]);
        setAvailabilityMap(data || {});
        setMaxBikes(fleetSize || 0);
      } catch (err) {
        console.error('BookingCalendar availability error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, []);

  const isSelected = (day) => {
    const start = selectedRange?.startDate;
    const end = selectedRange?.endDate;
    if (!start || !end) return false;
    const d = new Date(day).setHours(0, 0, 0, 0);
    return d >= new Date(start).setHours(0, 0, 0, 0) && d <= new Date(end).setHours(0, 0, 0, 0);
  };

  const customDayContent = (day) => {
    // Availability tiers reuse Overland's exact colors (green/yellow/orange/red on
    // dark text, white text on red) — a flat gray tile with just an opacity ramp
    // (8%/16%/26%/36% white) read as one indistinguishable dark blob, especially
    // for "only 1 left" / "fully booked". Selected stays Xopa's cyan since that's
    // already the one accent that pops against the dark theme.
    // react-date-range's own stylesheet ships `.rdrDayNumber span { color: #1d2429 }`,
    // which beats a plain Tailwind class on specificity and blanks the digits on our
    // dark background — the `!` important-modifier is what actually wins that fight.
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, '0');
    const d = String(day.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;

    const booked = availabilityMap[key] || 0;
    const remaining = maxBikes - booked;

    let bgColor, textColor;
    if (isSelected(day)) {
      bgColor = 'bg-cyan';
      textColor = '!text-noir font-bold';
    } else if (remaining === maxBikes) {
      bgColor = 'bg-green-200';
      textColor = '!text-gray-900';
    } else if (remaining >= 2) {
      bgColor = 'bg-yellow-200';
      textColor = '!text-gray-900';
    } else if (remaining === 1) {
      bgColor = 'bg-orange-300';
      textColor = '!text-gray-900';
    } else {
      bgColor = 'bg-red-400';
      textColor = '!text-white';
    }

    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center p-[3px] md:p-1">
        <div className={`absolute inset-[3px] md:inset-1 rounded-md pointer-events-none ${bgColor}`} />
        <span className={`relative z-10 ${isMobile ? 'text-xs' : 'text-sm'} font-semibold ${textColor}`}>{day.getDate()}</span>
      </div>
    );
  };

  const handleRangeChange = (item) => {
    setSelectedRange(item.selection);
    if (onDateRangeChange) onDateRangeChange(item.selection);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-noir border border-gris/20 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gris/30 border-t-jaune mb-3" />
            <p className="text-gris text-base">{t('loading')}</p>
          </div>
        ) : (
          <div className="rdr-dark-theme flex justify-center items-center p-3 md:p-4">
            <DateRange
              ranges={[selectedRange]}
              onChange={handleRangeChange}
              moveRangeOnFirstSelection={false}
              minDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
              rangeColors={['#02D6FC']}
              locale={DATE_FNS_LOCALES[locale] || es}
              dayContentRenderer={customDayContent}
              months={isMobile ? 1 : 2}
              direction={isMobile ? 'vertical' : 'horizontal'}
              showDateDisplay={false}
              fixedHeight={true}
              preventSnapRefocus={true}
            />
          </div>
        )}

        <div className="bg-noir border-t border-gris/20 px-3 md:px-4 py-3">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-2">
            <LegendItem color="bg-cyan" label={t('selectedPeriod')} />
            <LegendItem color="bg-green-200" label={t('allAvailable')} />
            <LegendItem color="bg-yellow-200" label={t('twoThreeLeft')} />
            <LegendItem color="bg-orange-300" label={t('oneLeft')} />
            <LegendItem color="bg-red-400" label={t('fullyBooked')} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-1.5 p-1.5">
      <span className={`w-3 h-3 ${color} border border-white/15 rounded-sm flex-shrink-0`} />
      <span className="text-gris text-xs font-medium">{label}</span>
    </div>
  );
}
