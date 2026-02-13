'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string;
}

const Modal: React.FC<ModalProps> = ({ title, open, onClose, children, widthClass = 'w-[90%] md:w-[80%] lg:w-[700px]' }) => {
  const mounted = typeof window !== 'undefined';
  const prevFocus = useRef<HTMLElement | null>(null);

  // ESC 关闭 + body 锁滚动 + 焦点管理
  useEffect(() => {
    if (!open) return;
    prevFocus.current = (document.activeElement as HTMLElement) ?? null;
    const body = document.body;
    const prev = body.style.overflow;
    body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
      prevFocus.current?.focus?.();
    };
  }, [open, onClose]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-gray-800/70 flex justify-center items-center p-6"
          onMouseDown={handleOverlayClick}
          role="presentation"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          aria-hidden={!open}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className={`relative ${widthClass} max-h-[90vh] overflow-y-auto bg-white rounded-lg`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 30, mass: 1.5 } }}
            exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.25 } }}
            onMouseDown={e => e.stopPropagation()}
          >
            <header className="sticky top-0 z-10 bg-white h-[60px] flex items-center p-6 rounded-t justify-center relative border-b">
              <button
                onClick={onClose}
                className="p-3 absolute left-3 hover:bg-gray-200 rounded-full"
                aria-label="Close"
              >
                ✕
              </button>
              <h2 id="modal-title" className="text-lg font-bold">{title}</h2>
            </header>
            <section className="p-6">{children}</section>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
