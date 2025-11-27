import React, { useState, useEffect } from 'react';
import { updateGA4Consent, hasGA4Consent } from '../services/analytics';

interface CookieConsentModalProps {
  onClose?: () => void;
  onOpenPrivacyPolicy?: () => void;
}

const CookieConsentModal: React.FC<CookieConsentModalProps> = ({ onClose, onOpenPrivacyPolicy }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Prüfe, ob bereits eine Consent-Entscheidung getroffen wurde
    const consentDecision = localStorage.getItem('cookie_consent_decision');

    // Bei Stripe-Redirect: Zeige Banner NICHT erneut an
    // (der User hat vorher bereits zugestimmt, localStorage könnte verzögert laden)
    const urlParams = new URLSearchParams(window.location.search);
    const isStripeRedirect = !!urlParams.get('session_id') || window.location.pathname === '/success';

    if (isStripeRedirect && !onClose) {
      // Bei Stripe-Redirect: Banner nicht zeigen (auch wenn consent fehlt)
      // Der User hat vor dem Redirect bereits entschieden
      setIsVisible(false);
      return;
    }

    // Zeige Modal nur, wenn noch keine Entscheidung getroffen wurde
    // Oder wenn explizit angefordert (z.B. über Footer-Link)
    if (!consentDecision || onClose) {
      // Kurze Verzögerung für bessere UX (nur beim ersten Mal)
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, consentDecision ? 0 : 1000);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#FFFFF5] rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-[#532418] mb-4">
          Cookie-Einstellungen
        </h2>

        <div className="mb-6">
          <p className="text-[#67534F] mb-4">
            Wir verwenden Cookies und ähnliche Technologien, um unsere Website zu analysieren und zu verbessern. 
            Sie können selbst entscheiden, ob Sie diese zulassen möchten.
          </p>

          {!showDetails ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-[#532418] mb-2">
                Was sind Cookies?
              </h3>
              <p className="text-sm text-[#67534F] mb-2">
                Cookies sind kleine Textdateien, die auf Ihrem Gerät gespeichert werden. 
                Wir verwenden sie für:
              </p>
              <ul className="list-disc list-inside text-sm text-[#67534F] space-y-1">
                <li><strong>Notwendige Cookies:</strong> Für die Grundfunktionen der Website (immer aktiv)</li>
                <li><strong>Analytics:</strong> Google Analytics 4 zur Analyse des Nutzerverhaltens (optional)</li>
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
            className="text-sm text-[#FF954F] hover:text-[#CC5200] underline"
          >
            {showDetails ? 'Weniger Details anzeigen' : 'Mehr Details anzeigen'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleReject}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Nur notwendige Cookies
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-6 py-3 bg-[#FF954F] text-white rounded-lg hover:bg-[#CC5200] transition-colors font-medium"
          >
            Alle Cookies akzeptieren
          </button>
        </div>

        <p className="text-xs text-center text-gray-500 mt-4">
          Durch Klicken auf "Alle Cookies akzeptieren" stimmen Sie der Verwendung von Analytics-Cookies zu.
          <br />
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              if (onOpenPrivacyPolicy) {
                onOpenPrivacyPolicy();
              }
            }}
            className="text-[#FF954F] underline"
          >
            Weitere Informationen in unserer Datenschutzerklärung
          </a>
        </p>
      </div>
    </div>
  );
};

export default CookieConsentModal;

