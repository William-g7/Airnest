'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface NavbarWrapperProps {
    children: React.ReactNode;
}

const NavbarWrapper = ({ children }: NavbarWrapperProps) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 50;
            if (isScrolled !== scrolled) {
                setScrolled(isScrolled);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [scrolled]);

    return (
        <div
            className={`navbar-container transition-all duration-300 ${scrolled ? 'scrolled' : ''}`}
            style={{
                '--logo-scale': scrolled ? '0.9' : '1',
                '--nav-padding': scrolled ? '0.5rem' : '1rem',
                '--search-height': scrolled ? '40px' : '48px',
            } as React.CSSProperties}
        >
            <motion.div
                initial={false}
                animate={{
                    height: scrolled ? '70px' : '80px',
                    boxShadow: scrolled
                        ? '0 4px 10px rgba(0, 0, 0, 0.1)'
                        : '0 1px 3px rgba(0, 0, 0, 0.05)',
                    backdropFilter: scrolled ? 'blur(8px)' : 'blur(0px)',
                    backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 1)'
                }}
                transition={{ duration: 0.3 }}
                className="w-full fixed top-0 left-0 right-0 z-20 navbar-blur navbar-fallback bg-white"
            >
                {children}
            </motion.div>
        </div>
    );
};

export default NavbarWrapper; 