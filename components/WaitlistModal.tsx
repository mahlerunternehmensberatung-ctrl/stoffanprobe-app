import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addToWaitlist } from '../services/waitlistService';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
}

const WaitlistModal: React.FC<WaitlistModalProps> = ({ isOpen, onClose, feature }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError(t('waitlist.errorRequired'));
      return;
    }

    // Einfache E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('waitlist.errorInvalid'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addToWaitlist(email.trim().toLowerCase(), feature);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setEmail('');
        setIsSuccess(false);
      }, 2500);
    } catch (err) {
      console.error('Error adding to waitlist:', err);
      setError(t('waitlist.errorGeneric'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setEmail('');
    setError(null);
    setIsSuccess(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-[#FFFFF5] rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl animate-fade-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={t('common.close')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isSuccess ? (
          // Success Screen
          <div className="text-center py-6">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-[#532418] mb-2">
              {t('waitlist.successTitle')}
            </h2>
            <p className="text-[#67534F]">
              {t('waitlist.successMessage')}
            </p>
          </div>
        ) : (
          // Form
          <>
            <div className="text-center mb-6">
              <span className="inline-block text-[10px] font-bold text-[#C8956C] bg-[#C8956C]/10 px-2 py-0.5 rounded-full uppercase tracking-wider mb-2">
                {t('comingSoon.badge')}
              </span>
              <h2 className="text-xl font-bold text-[#532418] mb-2">
                {t('waitlist.title')}
              </h2>
              <p className="text-sm text-[#67534F]">
                {t('waitlist.subtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="waitlist-email" className="block text-sm font-medium text-[#532418] mb-2">
                  {t('waitlist.emailLabel')}
                </label>
                <input
                  type="email"
                  id="waitlist-email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder={t('waitlist.emailPlaceholder')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#C8956C] focus:border-[#C8956C] transition-shadow text-sm"
                  disabled={isSubmitting}
                />
                {error && (
                  <p className="text-red-500 text-xs mt-2">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-[#C8956C] to-[#A67B5B] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t('common.processing') : t('waitlist.submit')}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                {t('waitlist.privacy')}
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default WaitlistModal;
