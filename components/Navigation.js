'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '../navigation';
import LocaleSwitcher from './LocaleSwitcher';

const Navigation = () => {
  const t = useTranslations('Navigation');
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: t('navFleet'), href: '/fleet' },
    { name: t('navHowItWorks'), href: '/how-it-works' },
    { name: t('navPricing'), href: '/pricing' },
    { name: t('navContact'), href: '/contact' }
  ];

  const toggleMenu = () => setIsOpen((v) => !v);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-noir border-b-2 border-cyan">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center h-10 lg:h-12" onClick={() => setIsOpen(false)}>
            <Image
              src="/logo.png"
              alt={t('logoAlt')}
              width={280}
              height={120}
              className="h-full w-auto object-contain"
              priority
            />
          </Link>

          {/* Right side: nav links (desktop), book button (tablet+desktop), mobile toggle */}
          <div className="flex items-center gap-4 lg:gap-6">
            {/* Desktop Navigation links — lg and up only */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2 text-gris font-heading font-bold uppercase tracking-wide hover:text-jaune transition-colors duration-150"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Language switcher — separated from the nav links with a divider */}
            <div className="hidden lg:block pl-4 lg:pl-6 border-l border-gris/20">
              <LocaleSwitcher />
            </div>

            {/* Book button — pinned to the far right, visible from tablet up, stays right-aligned even while nav links are collapsed behind the burger */}
            <Link
              href="/booking"
              className="hidden md:inline-block px-6 py-3 bg-cyan text-noir font-heading font-bold uppercase tracking-wide hover:bg-jaune hover:text-noir transition-colors duration-150"
            >
              {t('bookNowBtn')}
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-gris"
              onClick={toggleMenu}
              aria-label={isOpen ? t('closeMenu') : t('openMenu')}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-noir border-t border-cyan/40 px-6 py-6 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={toggleMenu}
              className="py-3 text-gris font-heading font-bold uppercase tracking-wide hover:text-jaune transition-colors duration-150"
            >
              {item.name}
            </Link>
          ))}
          <div className="py-3">
            <LocaleSwitcher />
          </div>
          <Link
            href="/booking"
            onClick={toggleMenu}
            className="mt-2 text-center px-6 py-4 bg-cyan text-noir font-heading font-bold uppercase tracking-wide"
          >
            {t('bookYourTripBtn')}
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
