import React from 'react';

interface PrivacyNoticeProps {
  className?: string;
}

const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ className = '' }) => {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-blue-900 mb-1">
            Datenschutz-Modus aktiv
          </h4>
          <p className="text-xs text-blue-800">
            Ihre Bilder werden <strong>temporär</strong> in unserem geschützten Datentresor gespeichert, 
            nur für die KI-Verarbeitung verwendet und <strong>automatisch gelöscht</strong> nach der Generierung. 
            Keine dauerhafte Speicherung ohne Ihre explizite Zustimmung.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyNotice;

