import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { updateGA4Consent } from '../services/analytics';

interface CookieConsentModalProps {
  onClose?: () => void;
  onOpenPrivacyPolicy?: () => void;
}

const CookieConsentModal: React.FC<CookieConsentModalProps> = ({ onClose, onOpenPrivacyPolicy }) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consentDecision = localStorage.getItem('cookie_consent_decision');

    // Bei Stripe-Redirect: Zeige Banner NICHT erneut an
    const urlParams = new URLSearchParams(window.location.search);
    const isStripeRedirect = !!urlParams.get('session_id') || window.location.pathname === '/success';

    if (isStripeRedirect && !onClose) {
      setIsVisible(false);
      return;
    }

    // Zeige Modal wenn:
    // 1. Explizit angefordert über Footer-Link (onClose ist gesetzt)
    // 2. KEINE Entscheidung getroffen wurde (erster Besuch)
    if (onClose) {
      // Footer-Link: sofort zeigen
      setIsVisible(true);
    } else if (!consentDecision) {
      // Erster Besuch: sofort zeigen
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [onClose]);

  const handleAccept = () => {
    updateGA4Consent(true);
    localStorage.setItem('cookie_consent_decision', 'accepted');
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  const handleReject = () => {
    updateGA4Consent(false);
    localStorage.setItem('cookie_consent_decision', 'rejected');
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed left-0 right-0 bottom-0 z-[100] p-2 sm:p-4 animate-slide-up box-border w-full max-w-full">
      <div className="bg-[#FFFFF5] rounded-lg shadow-xl p-3 sm:p-6 w-full max-w-2xl mx-auto max-h-[80vh] overflow-y-auto border border-[#E6C785]/30 box-border">
        <h2 className="text-lg sm:text-2xl font-bold text-[#532418] mb-2 sm:mb-4">
          {t('cookies.title')}
        </h2>

        <div className="mb-3 sm:mb-6">
          <p className="text-sm sm:text-base text-[#67534F] mb-2 sm:mb-4">
            {t('cookies.description')}
          </p>

          {!showDetails ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-4 mb-2 sm:mb-4">
              <ul className="text-xs sm:text-sm text-[#67534F] space-y-1">
                <li><strong>{t('cookies.necessary')}</strong> {t('cookies.necessaryDesc')}</li>
                <li><strong>{t('cookies.analytics')}</strong> {t('cookies.analyticsDesc')}</li>
              </ul>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 space-y-4">
              <div>
                <h3 className="font-semibold text-[#532418] mb-2">
                  {t('cookies.necessaryTitle')}
                </h3>
                <p className="text-sm text-[#67534F]">
                  {t('cookies.necessaryText')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-[#532418] mb-2">
                  {t('cookies.analyticsTitle')}
                </h3>
                <p className="text-sm text-[#67534F] mb-2">
                  {t('cookies.analyticsText')}
                </p>
                <p className="text-xs text-gray-600">
                  <strong>{t('cookies.provider')}</strong> {t('cookies.providerName')}<br />
                  <strong>{t('cookies.purpose')}</strong> {t('cookies.purposeText')}<br />
                  <strong>{t('cookies.legalBasis')}</strong> {t('cookies.legalBasisText')}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs text-blue-800">
                  <strong>{t('cookies.rights')}</strong> {t('cookies.rightsText')}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-[#C8956C] hover:text-[#A67B5B] underline"
          >
            {showDetails ? t('cookies.lessDetails') : t('cookies.moreDetails')}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleReject}
            className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
          >
            {t('cookies.rejectAll')}
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#C8956C] to-[#A67B5B] text-white rounded-lg hover:from-[#A67B5B] hover:to-[#8B6B4B] transition-all font-medium text-sm sm:text-base"
          >
            {t('cookies.acceptAll')}
          </button>
        </div>

        <p className="text-[10px] sm:text-xs text-center text-gray-500 mt-2 sm:mt-4">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (onOpenPrivacyPolicy) {
                onOpenPrivacyPolicy();
              }
            }}
            className="text-[#C8956C] underline"
          >
            {t('cookies.privacyLink')}
          </a>
        </p>
      </div>
    </div>
  );
};

export default CookieConsentModal;
