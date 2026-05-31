'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

/**
 * A reusable "are you sure?" confirmation popup for destructive actions.
 * Controlled via `open`; renders a centered modal above everything else
 * (z-[80], so it layers over bottom sheets which use z-50/60).
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center px-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          {/* Backdrop — tap to cancel */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />

          {/* Dialog */}
          <motion.div
            className="relative w-full max-w-[320px] bg-surface dark:bg-surface-dark rounded-3xl border border-border dark:border-border-dark p-5 shadow-xl"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-coral/15 flex items-center justify-center mb-3">
                <AlertTriangle size={22} className="text-coral" />
              </div>
              <h2 className="text-[16px] font-bold font-display text-text dark:text-text-dark">{title}</h2>
              {message && (
                <p className="text-[13px] text-muted dark:text-muted-dark mt-1.5 leading-snug">{message}</p>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <motion.button
                onClick={onCancel}
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-3 rounded-2xl bg-surface-2 dark:bg-surface-2-dark text-text dark:text-text-dark text-[14px] font-semibold"
              >
                {cancelLabel}
              </motion.button>
              <motion.button
                onClick={onConfirm}
                whileTap={{ scale: 0.97 }}
                className="flex-1 py-3 rounded-2xl bg-coral text-white text-[14px] font-semibold"
              >
                {confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
