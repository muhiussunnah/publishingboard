'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, subtitle, children, footer, maxWidth = 640 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(30,22,16,.42)', backdropFilter: 'blur(3px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
        >
          <motion.div
            className="card w-full overflow-hidden flex flex-col"
            style={{ maxWidth, maxHeight: '92dvh', boxShadow: 'var(--shadow-lg)' }}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b" style={{ borderColor: 'var(--line)' }}>
              <div>
                <h2 className="font-display text-[22px] leading-tight" style={{ color: 'var(--ink)' }}>{title}</h2>
                {subtitle && <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-muted)' }}>{subtitle}</p>}
              </div>
              <button onClick={onClose} aria-label="Close" className="shrink-0 grid place-items-center w-9 h-9 rounded-full transition hover:bg-[var(--bg-2)]" style={{ color: 'var(--ink-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto">{children}</div>
            {footer && (
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t bg-[var(--bg)]" style={{ borderColor: 'var(--line)' }}>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
