'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { AlertCircle, ChevronRight, ChevronLeft, Edit2, CreditCard, Loader2 } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import BookingCalendar from '@/components/BookingCalendar';
import { checkBikesAvailableByModel, getFleetSize } from '@/lib/supabase/bookings';
import { calculateBookingTotal } from '@/lib/pricing';
import { siteConfig } from '@/lib/site-config';

// Xopa has one model/location today, so this is normally a 4-step flow
// (quantity → dates → details → review+pay) instead of Overland's 5-step one
// (which starts with picking a location, then a model — there's nothing to
// pick here yet). Structured so a second location/model later means
// inserting steps back in, not a rewrite.
//
// With a single physical bike in the fleet, "how many bikes" has only one
// possible answer, so that step is pointless — we check the live fleet size
// on load and skip straight to dates when it's 1. The day a second bike is
// added to `motorcycles`, the step reappears on its own.

const BIKE_QUANTITY_OPTIONS = [1, 2, 3, 4, 5];

const Modal = ({ isOpen, onClose, type, message, t }) => {
  if (!isOpen) return null;
  const title =
    type === 'error' ? t('modalError') : type === 'warning' ? t('modalWarning') : type === 'contact' ? t('modalContact') : t('modalInfo');

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-noir border border-gris/20 max-w-md w-full"
      >
        <div className="p-6 border-b-2 border-cyan flex items-center gap-3">
          <AlertCircle className="text-cyan" size={24} />
          <h3 className="text-xl font-heading font-bold text-white">{title}</h3>
        </div>
        <div className="p-6">
          <p className="text-gris leading-relaxed">{message}</p>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          {type === 'contact' && (
            <a
              href={siteConfig.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-6 py-3 bg-jaune text-noir font-heading font-bold uppercase text-center"
            >
              {t('modalWhatsApp')}
            </a>
          )}
          <button onClick={onClose} className="px-6 py-3 bg-gris/10 text-white font-heading font-bold uppercase">
            {type === 'contact' ? t('modalGoBack') : t('modalClose')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ProgressDots = ({ currentStep, totalSteps }) => (
  <div className="flex items-center justify-center gap-2 mb-8">
    {[...Array(totalSteps)].map((_, index) => {
      const step = index + 1;
      return (
        <div
          key={step}
          className={`h-1.5 w-10 transition-colors duration-300 ${
            step <= currentStep ? 'bg-jaune' : 'bg-gris/20'
          }`}
        />
      );
    })}
  </div>
);

export default function BookingPage() {
  const t = useTranslations('BookingPage');
  const locale = useLocale();

  const [currentStep, setCurrentStep] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bikeQuantity, setBikeQuantity] = useState(1);
  // null while we haven't checked yet — treat as "don't skip" so step 1
  // never flashes and then disappears once the real count comes back.
  const [fleetSize, setFleetSize] = useState(null);
  const skipQuantityStep = fleetSize === 1;
  const [availabilityError, setAvailabilityError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [additionalRiders, setAdditionalRiders] = useState([]);
  const [modal, setModal] = useState({ isOpen: false, type: 'info', message: '' });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    specialRequests: '',
    hearAboutUs: ''
  });

  const showModal = (type, message) => setModal({ isOpen: true, type, message });
  const closeModal = () => setModal({ isOpen: false, type: 'info', message: '' });

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    const [y, m, d] = dateStr.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 12, 0, 0);
  };

  const formatLocalDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    return parseLocalDate(dateStr).toLocaleDateString(locale === 'es' ? 'es-PA' : locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    return Math.ceil(Math.abs(parseLocalDate(endDate) - parseLocalDate(startDate)) / (1000 * 60 * 60 * 24)) + 1;
  };

  const checkAvailability = async (start, end, qty) => {
    try {
      const available = await checkBikesAvailableByModel(start, end, siteConfig.fleet.model, siteConfig.fleet.location);
      if (available < qty) {
        setAvailabilityError(t('availabilityError', { available }));
        return { ok: false, available };
      }
      setAvailabilityError('');
      return { ok: true, available };
    } catch {
      setAvailabilityError(t('availabilityCheckFailed'));
      return { ok: false, available: null };
    }
  };

  const handleDateRangeChange = async (range) => {
    const start = formatLocalDate(range.startDate);
    const end = formatLocalDate(range.endDate);
    setStartDate(start);
    setEndDate(end);
    if (start && end) await checkAvailability(start, end, bikeQuantity);
  };

  const handleBikeQuantitySelect = async (num) => {
    setBikeQuantity(num);
    if (startDate && endDate) await checkAvailability(startDate, endDate, num);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const count = Math.max(0, bikeQuantity - 1);
    setAdditionalRiders((prev) =>
      Array.from({ length: count }, (_, i) => prev[i] || { firstName: '', lastName: '', email: '', phone: '' })
    );
  }, [bikeQuantity]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const size = await getFleetSize(siteConfig.fleet.model, siteConfig.fleet.location);
      if (cancelled) return;
      setFleetSize(size);
      if (size === 1) {
        setBikeQuantity(1);
        setCurrentStep((step) => (step === 1 ? 2 : step));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const days = calculateDays();
  const { rentalPrice, subtotal, tax, cardFee, total } = calculateBookingTotal({ days, bikeQuantity });
  const depositPerBike = 150;
  const totalDeposit = depositPerBike * bikeQuantity;

  const canProceedQuantity = bikeQuantity > 0;
  const canProceedDates = startDate && endDate && days > 0 && !availabilityError;
  const canProceedStep2 =
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.email.trim() &&
    formData.phone.trim() &&
    formData.country.trim() &&
    additionalRiders.every((r) => r.firstName.trim() && r.lastName.trim() && r.email.trim() && r.phone.trim());

  const handleContinueFromDates = async () => {
    if (!canProceedDates) return;
    const { ok, available } = await checkAvailability(startDate, endDate, bikeQuantity);
    if (!ok) {
      showModal('error', available !== null ? t('availabilityErrorSubmit', { available }) : t('availabilityCheckFailed'));
      return;
    }
    setCurrentStep(3);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const available = await checkBikesAvailableByModel(startDate, endDate, siteConfig.fleet.model, siteConfig.fleet.location);
      if (available < bikeQuantity) {
        showModal('error', t('availabilityErrorSubmit', { available }));
        setIsSubmitting(false);
        return;
      }
      const response = await fetch('/api/create-paguelofacil-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          country: formData.country,
          startDate,
          endDate,
          bikeQuantity,
          calculatedDays: days,
          locale,
          specialRequests: formData.specialRequests,
          hearAboutUs: formData.hearAboutUs,
          additionalRiders: additionalRiders.map((r) => ({
            first_name: r.firstName,
            last_name: r.lastName,
            email: r.email,
            phone: r.phone
          }))
        })
      });
      const { url, error } = await response.json();
      if (error) throw new Error(error);
      if (!url) throw new Error(t('missingPaymentUrl'));
      window.location.href = url;
    } catch (error) {
      showModal('error', error.message || t('bookingError'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-noir">
      <Navigation />

      {modal.isOpen && <Modal {...modal} onClose={closeModal} t={t} />}

      <div className="pt-32 pb-20 px-4">
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-2">
            <h1 className="text-4xl md:text-5xl font-heading font-black text-jaune">{t('title')}</h1>
            <p className="text-gris mt-2">{t('subtitle')}</p>
          </div>

          <ProgressDots
            currentStep={skipQuantityStep ? currentStep - 1 : currentStep}
            totalSteps={skipQuantityStep ? 3 : 4}
          />

          <AnimatePresence mode="wait">
            {/* STEP 1 — Quantity (skipped once the fleet is down to one bike) */}
            {currentStep === 1 && !skipQuantityStep && (
              <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="text-2xl font-heading font-bold text-white text-center mb-1">{t('step1Title')}</h2>
                <p className="text-gris text-center text-sm mb-6">{t('step1Subtitle')}</p>

                <div className="mb-6">
                  <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
                    {BIKE_QUANTITY_OPTIONS.map((num) => (
                      <button
                        key={num}
                        onClick={() => handleBikeQuantitySelect(num)}
                        className={`p-3 border-2 transition-colors duration-150 ${
                          bikeQuantity === num ? 'border-jaune bg-jaune/10' : 'border-gris/20 hover:border-gris/40'
                        }`}
                      >
                        <div className="text-2xl font-heading font-black text-jaune">{num}</div>
                        <div className="text-xs text-gris">{num === 1 ? t('bike') : t('bikes')}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setCurrentStep(2)}
                    disabled={!canProceedQuantity}
                    className={`px-8 py-4 font-heading font-bold uppercase text-lg flex items-center gap-2 ${
                      canProceedQuantity ? 'bg-jaune text-noir hover:bg-cyan hover:text-noir' : 'bg-gris/10 text-gris/40 cursor-not-allowed'
                    }`}
                  >
                    {t('stepContinue')} <ChevronRight size={22} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2 — Dates */}
            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="text-2xl font-heading font-bold text-white text-center mb-1">{t('step2Title')}</h2>
                <p className="text-gris text-center text-sm mb-6">{t('step2Subtitle')}</p>

                <BookingCalendar onDateRangeChange={handleDateRangeChange} />

                {availabilityError && (
                  <div className="mt-4 p-3 bg-cyan/10 border border-cyan/50 flex items-start gap-3">
                    <AlertCircle className="text-cyan flex-shrink-0 mt-0.5" size={18} />
                    <p className="text-cyan text-sm">{availabilityError}</p>
                  </div>
                )}

                {days > 0 && !availabilityError && (
                  <div className="mt-4 bg-jaune/10 border border-jaune/30 p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gris">
                        {formatDisplayDate(startDate)} → {formatDisplayDate(endDate)}
                      </div>
                      <div className="text-lg font-bold text-white mt-1">
                        {days} {days === 1 ? t('day') : t('days')} × {bikeQuantity} {bikeQuantity === 1 ? t('bike') : t('bikes')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gris">{t('rentalPrice')}</div>
                      <div className="text-2xl font-heading font-black text-jaune">${subtotal.toFixed(2)}</div>
                    </div>
                  </div>
                )}

                <div className={`mt-6 flex ${skipQuantityStep ? 'justify-end' : 'justify-between'}`}>
                  {!skipQuantityStep && (
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-4 bg-gris/10 text-white font-heading font-bold uppercase flex items-center gap-2"
                    >
                      <ChevronLeft size={20} /> {t('stepBack')}
                    </button>
                  )}
                  <button
                    onClick={handleContinueFromDates}
                    disabled={!canProceedDates}
                    className={`px-8 py-4 font-heading font-bold uppercase text-lg flex items-center gap-2 ${
                      canProceedDates ? 'bg-jaune text-noir hover:bg-cyan hover:text-noir' : 'bg-gris/10 text-gris/40 cursor-not-allowed'
                    }`}
                  >
                    {t('stepContinue')} <ChevronRight size={22} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3 — Personal info */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="text-2xl font-heading font-bold text-white text-center mb-1">{t('step3Title')}</h2>
                <p className="text-gris text-center text-sm mb-6">{t('step3Subtitle')}</p>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {[
                    { label: t('firstName'), name: 'firstName', type: 'text' },
                    { label: t('lastName'), name: 'lastName', type: 'text' },
                    { label: t('email'), name: 'email', type: 'email' }
                  ].map(({ label, name, type }) => (
                    <div key={name}>
                      <label className="block text-xs font-bold text-gris mb-1 uppercase tracking-wide">{label} *</label>
                      <input
                        type={type}
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-3 border-2 border-gris/20 bg-noir text-white outline-none focus:border-jaune transition-colors"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-bold text-gris mb-1 uppercase tracking-wide">{t('phone')} *</label>
                    <PhoneInput
                      international
                      defaultCountry="PA"
                      value={formData.phone}
                      onChange={(value) => handleChange({ target: { name: 'phone', value: value || '' } })}
                      className="phone-input-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gris mb-1 uppercase tracking-wide">{t('country')} *</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-3 border-2 border-gris/20 bg-noir text-white outline-none focus:border-jaune transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gris mb-1 uppercase tracking-wide">{t('hearAboutUs')}</label>
                    <select
                      name="hearAboutUs"
                      value={formData.hearAboutUs}
                      onChange={handleChange}
                      className="w-full px-3 py-3 border-2 border-gris/20 bg-noir text-white outline-none focus:border-jaune transition-colors"
                    >
                      <option value="">{t('selectOption')}</option>
                      <option value="google">{t('hearAboutOption1')}</option>
                      <option value="social">{t('hearAboutOption2')}</option>
                      <option value="friend">{t('hearAboutOption3')}</option>
                      <option value="blog">{t('hearAboutOption4')}</option>
                      <option value="other">{t('hearAboutOption5')}</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gris mb-1 uppercase tracking-wide">{t('specialRequests')}</label>
                    <textarea
                      name="specialRequests"
                      value={formData.specialRequests}
                      onChange={handleChange}
                      rows={3}
                      placeholder={t('specialRequestsPlaceholder')}
                      className="w-full px-3 py-3 border-2 border-gris/20 bg-noir text-white outline-none focus:border-jaune transition-colors resize-none"
                    />
                  </div>
                </div>

                {additionalRiders.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-heading font-bold text-jaune uppercase tracking-wide mb-3">{t('additionalRidersTitle')}</h3>
                    {additionalRiders.map((rider, idx) => (
                      <div key={idx} className="mb-4 p-4 border border-gris/20">
                        <p className="text-xs font-bold text-gris mb-3">
                          {t('riderLabel')} {idx + 2}
                        </p>
                        <div className="grid md:grid-cols-2 gap-3">
                          {[
                            { label: t('firstName'), field: 'firstName', type: 'text' },
                            { label: t('lastName'), field: 'lastName', type: 'text' },
                            { label: t('email'), field: 'email', type: 'email' }
                          ].map(({ label, field, type }) => (
                            <div key={field}>
                              <label className="block text-xs font-bold text-gris mb-1 uppercase tracking-wide">{label} *</label>
                              <input
                                type={type}
                                value={rider[field]}
                                onChange={(e) => {
                                  const updated = [...additionalRiders];
                                  updated[idx] = { ...updated[idx], [field]: e.target.value };
                                  setAdditionalRiders(updated);
                                }}
                                required
                                className="w-full px-3 py-3 border-2 border-gris/20 bg-noir text-white outline-none focus:border-jaune transition-colors"
                              />
                            </div>
                          ))}
                          <div>
                            <label className="block text-xs font-bold text-gris mb-1 uppercase tracking-wide">{t('phone')} *</label>
                            <PhoneInput
                              international
                              defaultCountry="PA"
                              value={rider.phone}
                              onChange={(value) => {
                                const updated = [...additionalRiders];
                                updated[idx] = { ...updated[idx], phone: value || '' };
                                setAdditionalRiders(updated);
                              }}
                              className="phone-input-dark"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-4 bg-gris/10 text-white font-heading font-bold uppercase flex items-center gap-2"
                  >
                    <ChevronLeft size={20} /> {t('stepBack')}
                  </button>
                  <button
                    onClick={() => setCurrentStep(4)}
                    disabled={!canProceedStep2}
                    className={`flex-1 py-4 font-heading font-bold uppercase text-lg flex items-center justify-center gap-2 ${
                      canProceedStep2 ? 'bg-jaune text-noir hover:bg-cyan hover:text-noir' : 'bg-gris/10 text-gris/40 cursor-not-allowed'
                    }`}
                  >
                    {t('stepContinue')} <ChevronRight size={22} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4 — Review + pay */}
            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="text-2xl font-heading font-bold text-white text-center mb-1">{t('step4Title')}</h2>
                <p className="text-gris text-center text-sm mb-6">{t('step4Subtitle')}</p>

                <div className="border border-jaune/30 p-5 md:p-6 mb-6">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gris/20">
                    <h3 className="text-lg font-heading font-bold text-white">
                      {t('summaryMotorcycles')} & {t('summaryDates')}
                    </h3>
                    <button
                      onClick={() => setCurrentStep(skipQuantityStep ? 2 : 1)}
                      className="text-jaune text-xs flex items-center gap-1 hover:text-cyan"
                    >
                      <Edit2 size={14} /> {t('stepChange')}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 pb-4 border-b border-gris/20">
                    <div>
                      <div className="text-xs text-gris">{t('summaryLocation')}</div>
                      <div className="text-sm font-bold text-jaune">{siteConfig.fleet.location}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gris">{t('summaryModel')}</div>
                      <div className="text-sm font-bold text-jaune">SPI {siteConfig.fleet.model}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gris">{t('summaryMotorcycles')}</div>
                      <div className="text-xl font-heading font-black text-jaune">{bikeQuantity}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gris">{t('summaryDuration')}</div>
                      <div className="text-xl font-heading font-black text-jaune">
                        {days} {t('days')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-gris/20">
                    <h3 className="text-base font-heading font-bold text-white">{t('summaryContact')}</h3>
                    <button onClick={() => setCurrentStep(3)} className="text-jaune text-xs flex items-center gap-1 hover:text-cyan">
                      <Edit2 size={14} /> {t('stepChange')}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4 pb-4 border-b border-gris/20">
                    <div>
                      <span className="text-gris">{t('firstName')}: </span>
                      <span className="text-white font-semibold">
                        {formData.firstName} {formData.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gris">{t('email')}: </span>
                      <span className="text-white font-semibold">{formData.email}</span>
                    </div>
                    <div>
                      <span className="text-gris">{t('phone')}: </span>
                      <span className="text-white font-semibold">{formData.phone}</span>
                    </div>
                    <div>
                      <span className="text-gris">{t('country')}: </span>
                      <span className="text-white font-semibold">{formData.country}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-heading font-bold text-jaune mb-3">{t('summaryPaymentTitle')}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gris">{t('summaryRentalCost')}</span>
                      <span className="text-white font-bold">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gris/70">{t('summaryTax')}</span>
                      <span className="text-gris">+${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs pb-2 border-b border-gris/20">
                      <span className="text-gris/70">{t('summaryCardFee')}</span>
                      <span className="text-gris">+${cardFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 bg-jaune/10 px-3">
                      <span className="font-bold text-jaune">{t('summaryTotal')}</span>
                      <span className="text-xl font-heading font-black text-jaune">${total.toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="text-gris/70 text-xs mt-3">{t('depositNote', { amount: totalDeposit.toFixed(2) })}</p>
                </div>

                <div className="border border-gris/20 p-4 mb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-1 w-5 h-5 flex-shrink-0"
                    />
                    <span className="text-gris text-sm leading-relaxed">
                      {t('agreement.prefix')}{' '}
                      <a href="/terms" target="_blank" className="text-jaune underline font-semibold">
                        {t('agreement.terms')}
                      </a>{' '}
                      {t('agreement.and')}{' '}
                      <a href="/privacy" target="_blank" className="text-jaune underline font-semibold">
                        {t('agreement.privacy')}
                      </a>
                      {t('agreement.suffix')}
                    </span>
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-4 bg-gris/10 text-white font-heading font-bold uppercase flex items-center gap-2"
                  >
                    <ChevronLeft size={20} /> {t('stepBack')}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!acceptedTerms || isSubmitting}
                    className={`flex-1 py-4 font-heading font-bold uppercase text-lg flex items-center justify-center gap-2 ${
                      acceptedTerms && !isSubmitting ? 'bg-cyan text-noir hover:bg-jaune hover:text-noir' : 'bg-gris/10 text-gris/40 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" /> {t('processing')}
                      </>
                    ) : (
                      <>
                        <CreditCard size={20} /> {t('stepPayment')} (${total.toFixed(2)})
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Footer />
    </div>
  );
}
