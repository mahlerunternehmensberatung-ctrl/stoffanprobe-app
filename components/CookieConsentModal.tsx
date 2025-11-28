import React, { useState, useEffect } from 'react';
import { updateGA4Consent, hasGA4Consent } from '../services/analytics';

interface CookieConsentModalProps {
  onClose?: () => void;
  onOpenPrivacyPolicy?: () => void;
  trigger?: boolean; // Wenn true, wird das Modal angezeigt (für Auth-Interaktionen)
}

const CookieConsentModal: React.FC<CookieConsentModalProps> = ({ onClose, onOpenPrivacyPolicy, trigger }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Prüfe, ob bereits eine Consent-Entscheidung getroffen wurde
    const consentDecision = localStorage.getItem('cookie_consent_decision');

    // Wenn bereits entschieden wurde, nicht erneut zeigen (außer explizit über Footer)
    if (consentDecision && !onClose) {
      setIsVisible(false);
      return;
    }

    // Bei Stripe-Redirect: Zeige Banner NICHT erneut an
    const urlParams = new URLSearchParams(window.location.search);
    const isStripeRedirect = !!urlParams.get('session_id') || window.location.pathname === '/success';

    if (isStripeRedirect && !onClose) {
      setIsVisible(false);
      return;
    }

    // Zeige Modal nur wenn:
    // 1. Explizit angefordert über Footer-Link (onClose ist gesetzt)
    // 2. Trigger ist true (Auth-Interaktion) UND noch keine Entscheidung getroffen
    if (onClose) {
      // Footer-Link: sofort zeigen
      setIsVisible(true);
    } else if (trigger && !consentDecision) {
      // Auth-Interaktion: mit kurzer Verzögerung zeigen
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [onClose, trigger]);

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
    <div className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4 animate-slide-up">
      <div className="bg-[#FFFFF5] rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-2xl mx-auto max-h-[80vh] overflow-y-auto border border-[#E6C785]/30">
        <h2 className="text-lg sm:text-2xl font-bold text-[#532418] mb-2 sm:mb-4">
          Cookie-Einstellungen
        </h2>

        <div className="mb-3 sm:mb-6">
          <p className="text-sm sm:text-base text-[#67534F] mb-2 sm:mb-4">
            Wir verwenden Cookies zur Analyse und Verbesserung unserer Website.
          </p>

          {!showDetails ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-4 mb-2 sm:mb-4">
              <ul className="text-xs sm:text-sm text-[#67534F] space-y-1">
                <li><strong>Notwendig:</strong> Grundfunktionen (immer aktiv)</li>
                <li><strong>Analytics:</strong> Google Analytics 4 (optional)</li>
              </ul>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 space-y-4">
              <div>
                <h3 className="font-semibold text-[#532418] mb-2">
                  Notwendige Cookies
                </h3>
                <p className="text-sm text-[#67534F]">
                  Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden. 
                  Sie werden normalerweise nur als Reaktion auf Ihre Aktionen gesetzt, z.B. bei der Anmeldung oder beim Ausfüllen von Formularen.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-[#532418] mb-2">
                  Analytics Cookies (Google Analytics 4)
                </h3>
                <p className="text-sm text-[#67534F] mb-2">
                  Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren, 
                  indem Informationen anonym gesammelt und gemeldet werden. Wir verwenden Google Analytics 4 
                  mit IP-Anonymisierung und Consent Mode v2 für DSGVO-Konformität.
                </p>
                <p className="text-xs text-gray-600">
                  <strong>Anbieter:</strong> Google Ireland Limited<br />
                  <strong>Zweck:</strong> Website-Analyse, Statistiken<br />
                  <strong>Rechtsgrundlage:</strong> Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs text-blue-800">
                  <strong>Ihre Rechte:</strong> Sie können Ihre Einwilligung jederzeit widerrufen, 
                  indem Sie die Cookie-Einstellungen in Ihrem Browser ändern oder uns kontaktieren.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-[#C8956C] hover:text-[#A67B5B] underline"
          >
            {showDetails ? 'Weniger Details anzeigen' : 'Mehr Details anzeigen'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleReject}
            className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
          >
            Nur notwendige
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#C8956C] to-[#A67B5B] text-white rounded-lg hover:from-[#A67B5B] hover:to-[#8B6B4B] transition-all font-medium text-sm sm:text-base"
          >
            Alle akzeptieren
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
            Datenschutzerklärung
          </a>
        </p>
      </div>
    </div>
  );
};

export default CookieConsentModal;

