import React from 'react';
import { Session } from '../types';

interface CustomerDataBannerProps {
  session: Session;
}

/**
 * Dezenter Hinweis während der Session - zeigt nur ungesicherte Bilder-Zähler
 * Die eigentliche Warnung kommt beim Verlassen über CustomerDataExitModal
 */
const CustomerDataBanner: React.FC<CustomerDataBannerProps> = ({ session }) => {
  // Prüfe ob Kundenbilder mit Einwilligung vorhanden sind
  const isCustomerSession = session.imageType === 'commercial' && session.consentData?.accepted;

  if (!isCustomerSession) return null;

  // Zähle ungesicherte Bilder
  const unsavedCount = session.variants.filter(v => !v.isDownloaded).length;
  const totalCount = session.variants.length;
  const savedCount = totalCount - unsavedCount;

  // Alle gesichert - zeige grünen Status
  if (unsavedCount === 0 && totalCount > 0) {
    return (
      <div className="flex items-center justify-center gap-2 mb-4 py-2 px-4 bg-green-50 border border-green-200 rounded-lg">
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm text-green-700">
          Alle {totalCount} Kundenbilder gesichert
        </span>
      </div>
    );
  }

  // Ungesicherte Bilder vorhanden - zeige dezenten Hinweis
  if (unsavedCount > 0) {
    return (
      <div className="flex items-center justify-center gap-2 mb-4 py-2 px-4 bg-amber-50 border border-amber-200 rounded-lg">
        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-sm text-amber-700">
          {unsavedCount} {unsavedCount === 1 ? 'Kundenbild' : 'Kundenbilder'} noch nicht gesichert
          {savedCount > 0 && <span className="text-amber-600/70"> ({savedCount} bereits gesichert)</span>}
        </span>
      </div>
    );
  }

  return null;
};

export default CustomerDataBanner;
