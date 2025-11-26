import React, { useState, useEffect } from 'react';
import { ConsentData } from '../types';

interface PrivateConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (consentData: ConsentData) => void;
}

const PrivateConsentModal: React.FC<PrivateConsentModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConsent(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    if (!consent) return;

    const consentData: ConsentData = {
      accepted: true,
      signature: null,
      timestamp: new Date(),
    };
    onConfirm(consentData);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-[#FFFFF5] rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#532418]">Bildrechte bestätigen</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl font-bold" aria-label="Schließen">
            &times;
          </button>
        </div>
        <p className="mb-6 text-sm text-gray-600">
          Bitte bestätigen Sie, dass Sie die Rechte an diesem Bild besitzen.
        </p>
        <div className="space-y-4">
          <label className="flex items-start p-4 bg-[#FAF1DC] rounded-md cursor-pointer hover:bg-opacity-80">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-[#FF954F] focus:ring-[#CC5200]"
            />
            <span className="ml-3 text-sm text-gray-800">
              Ich bestätige, dass ich die Rechte an diesem Bild besitze.
            </span>
          </label>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!consent}
            className="px-6 py-2 text-sm font-medium text-white bg-[#FF954F] rounded-md hover:bg-[#CC5200] transition-colors disabled:bg-[#C8B6A6] disabled:cursor-not-allowed"
          >
            Bestätigen & Weiter
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivateConsentModal;

