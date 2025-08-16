'use client';

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  label: string;
  close: () => void;
  content: React.ReactElement;
  isOpen: boolean;
}

const Modal = ({ label, content, isOpen, close }: ModalProps) => {
  const handleClose = useCallback(() => {
    close();
  }, [close]);

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeInOut', delay: 0.1 },
    },
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 1.5,
        delay: 0.1,
      },
    },
    exit: {
      opacity: 0,
      y: 20,
      scale: 0.95,
      transition: {
        duration: 0.25,
        ease: [0.32, 0.72, 0, 1],
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-gray-800/70 flex justify-center items-center p-6"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleClose}
        >
          <motion.div
            className="relative w-[90%] md:w-[80%] lg:w-[700px] max-h-[90vh] overflow-y-auto bg-white rounded-lg"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <header className="sticky top-0 z-10 bg-white h-[60px] flex items-center p-6 rounded-t justify-center relative border-b">
                <motion.div
                  onClick={handleClose}
                  className="p-3 absolute left-3 hover:bg-gray-300 rounded-full cursor-pointer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </motion.div>

                <h2 className="text-lg font-bold">{label}</h2>
              </header>

              <section className="p-6">{content}</section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
