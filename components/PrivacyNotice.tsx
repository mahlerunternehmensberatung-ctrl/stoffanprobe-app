import React from 'react';

interface PrivacyNoticeProps {
  className?: string;
}

const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({ className = '' }) => {
  return (
    <div className={`bg-blue-50/80 border border-blue-200 rounded-lg p-2 sm:p-3 ${className}`}>
      <p className="text-[10px] sm:text-xs text-blue-800 text-center">
        🔒 Bilder werden nur temporär für die Verarbeitung gespeichert und automatisch gelöscht
      </p>
    </div>
  );
};

export default PrivacyNotice;
