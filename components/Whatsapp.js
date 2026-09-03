'use client';
import React, { useEffect, useRef, useState } from 'react';
import { siteConfig } from '@/lib/site-config';

const WhatsApp = () => {
  const lottieRef = useRef(null);
  const [lottie, setLottie] = useState(null);

  useEffect(() => {
    import('lottie-web').then((Lottie) => {
      setLottie(Lottie.default);
    });
  }, []);

  useEffect(() => {
    if (!lottie || !lottieRef.current) return;

    const animation = lottie.loadAnimation({
      container: lottieRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/Phone.json',
    });

    return () => animation.destroy();
  }, [lottie]);

  return (
    <a
      href={siteConfig.whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-6 right-6 z-[1000] w-16 h-16 rounded-full hover:scale-110 transition-transform duration-300"
    >
      <div ref={lottieRef} className="w-full h-full" style={{ clipPath: 'inset(0 0 20% 0)' }} />
      <div className="absolute inset-0 rounded-full bg-jaune opacity-0 group-hover:opacity-20 group-hover:animate-ping" />
    </a>
  );
};

export default WhatsApp;
