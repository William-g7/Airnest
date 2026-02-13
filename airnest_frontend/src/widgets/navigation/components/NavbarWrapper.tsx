'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--nav-h',        scrolled ? '70px' : '80px');
    root.style.setProperty('--search-height', scrolled ? '40px' : '48px');
    root.style.setProperty('--nav-padding',   scrolled ? '0.5rem' : '1rem');
  }, [scrolled]);

  return (
    <motion.div
      style={{ height: 'var(--nav-h)' }}
      animate={{
        boxShadow:     scrolled ? '0 4px 10px rgba(0,0,0,.1)' : '0 1px 3px rgba(0,0,0,.05)',
        backdropFilter:scrolled ? 'blur(8px)'       : 'blur(0)',
        backgroundColor:scrolled ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,1)',
      }}
      transition={{ duration: 0.25 }}
      className="w-full fixed top-0 left-0 right-0 z-50"
    >
      {children}
    </motion.div>
  );
}
