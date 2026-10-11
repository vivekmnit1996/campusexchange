import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

export const RejectCancelModal = ({
  isOpen,
  onClose,
  title = 'Reject/Cancel Reservation',
  actionType = 'reject', // 'reject' | 'cancel'
  onConfirm,
  loading = false,
}) => {
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setValidationError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setValidationError('Please provide a reason explaining why you cannot complete this hand-off.');
      return;
    }
    if (trimmed.length > 500) {
      setValidationError('Reason cannot exceed 500 characters.');
      return;
    }
    setValidationError('');
    onConfirm(trimmed);
  };

  const confirmButtonLabel =
    actionType === 'reject' ? 'Confirm Rejection' : 'Confirm Cancellation';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-pop-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-[#121522] border-3 border-black rounded-3xl shadow-brutal-xl p-6 sm:p-7 space-y-4 z-10 text-black dark:text-white">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">⚠️</span>
            <h3 className="text-base font-display font-black text-black dark:text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black shadow-brutal-sm hover:bg-[#FF6B97] hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-bold text-black/75 dark:text-slate-300">
          The other student will receive this explanation so they know why the exchange was not completed.
        </p>

        {validationError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase text-black dark:text-white">
                Reason (Required) *
              </label>
              <span className="text-[10px] font-mono text-black/50 dark:text-slate-400">
                {reason.length} / 500
              </span>
            </div>
            <textarea
              required
              rows={4}
              maxLength={500}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (validationError) setValidationError('');
              }}
              placeholder="Briefly explain why you cannot complete this hand-off."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#1A1E30] border-2 border-black text-black dark:text-white font-medium shadow-brutal-sm focus:bg-[#FEFCE8] dark:focus:bg-[#252A42] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2.5 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-[#1A1E30] text-black dark:text-white border-2 border-black font-display font-bold text-xs shadow-brutal-xs hover:bg-slate-300 transition cursor-pointer"
            >
              Go Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#FF6B97] hover:bg-[#FF2A85] text-white border-2 border-black font-display font-black text-xs shadow-brutal flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : confirmButtonLabel}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
