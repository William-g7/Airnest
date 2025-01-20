'use client';

import { useCallback, useEffect, useState } from "react";

interface ModalProps {
    label: string;
    close: () => void;
    content: React.ReactElement;
    isOpen: boolean;
}

const Modal: React.FC<ModalProps> = ({
    label,
    content,
    isOpen,
    close
}) => {
    const [showModal, setShowModal] = useState(isOpen);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            setShowModal(true);
        } else {
            setShowModal(false);
            setTimeout(() => {
                setMounted(false);
            }, 300);
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        setShowModal(false);
        setTimeout(() => {
            setMounted(false);
            close();
        }, 300);
    }, [close]);

    if (!mounted) {
        return null;
    }

    return (
        <div className={`
            fixed inset-0 z-50 bg-gray-800/70 flex justify-center items-center
            ${showModal ? 'opacity-100' : 'opacity-0'}
            ${showModal ? 'pointer-events-auto' : 'pointer-events-none'}
            transition-all duration-300 p-6
        `}>
            <div className={`
                relative w-[90%] md:w-[80%] lg:w-[700px] 
                max-h-[90vh] overflow-y-auto 
                bg-white rounded-lg
                transform
                ${showModal ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
                transition-all duration-300
            `}>
                <div className="flex flex-col">
                    <header className="sticky top-0 z-10 bg-white h-[60px] flex items-center p-6 rounded-t justify-center relative border-b">
                        <div
                            onClick={handleClose}
                            className="p-3 absolute left-3 hover:bg-gray-300 rounded-full cursor-pointer"
                        >
                            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </div>

                        <h2 className="text-lg font-bold">{label}</h2>
                    </header>

                    <section className="p-6">
                        {content}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Modal;