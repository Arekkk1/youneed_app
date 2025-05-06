import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            document.addEventListener('keydown', handleEscape);
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
    };

    return (
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300 ease-in-out" // Increased z-index
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
            onClick={onClose} // Close on backdrop click
        >
            <div
                className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${sizeClasses[size] || sizeClasses.md} transition-transform duration-300 ease-in-out transform scale-95 opacity-0 animate-modal-enter`}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-gray-800"
                        aria-label="Zamknij"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    {children}
                </div>

                {/* Optional Modal Footer (can be added via children if needed) */}
                {/* <div className="flex items-center justify-end p-4 border-t border-gray-200 dark:border-gray-700">
                    ... footer buttons ...
                </div> */}
            </div>
            {/* FIX: Use standard style tag to avoid 'global' attribute warning */}
            <style>{`
                @keyframes modal-enter-keyframes {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .animate-modal-enter {
                    animation: modal-enter-keyframes 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Modal;
