/**
 * Google Analytics 4 Service mit Consent Mode v2
 * DSGVO-konform: Lädt GA4 nur nach expliziter Zustimmung
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    google_consent_mode?: {
      default: {
        analytics_storage: 'granted' | 'denied';
        ad_storage: 'granted' | 'denied';
      };
    };
  }
}

const GA4_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '';

/**
 * Initialisiert Google Analytics 4 mit Consent Mode v2
 * Wird aufgerufen, BEVOR der User eine Entscheidung getroffen hat
 */
export const initializeGA4ConsentMode = () => {
  if (!GA4_MEASUREMENT_ID) {
    console.warn('GA4_MEASUREMENT_ID nicht konfiguriert');
    return;
  }

  // Consent Mode v2 Defaults (verweigert, bis Zustimmung gegeben wird)
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }

  // Setze Default-Consent auf "denied"
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
  });

  // Lade GA4 Script (aber noch nicht aktiv)
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialisiere gtag
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA4_MEASUREMENT_ID, {
    anonymize_ip: true, // IP-Anonymisierung für DSGVO
  });
};

/**
 * Aktualisiert den Consent-Status und aktiviert/deaktiviert GA4
 */
export const updateGA4Consent = (granted: boolean) => {
  if (!window.gtag) {
    console.warn('gtag nicht initialisiert');
    return;
  }

  window.gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
    ad_storage: granted ? 'granted' : 'denied',
  });

  // Speichere Consent-Präferenz
  localStorage.setItem('ga4_consent', granted ? 'granted' : 'denied');
};

/**
 * Sendet ein Event an GA4 (nur wenn Consent gegeben wurde)
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (!window.gtag) {
    return;
  }

  const consent = localStorage.getItem('ga4_consent');
  if (consent !== 'granted') {
    return; // Kein Tracking ohne Consent
  }

  window.gtag('event', eventName, eventParams);
};

/**
 * Sendet eine Pageview an GA4
 */
export const trackPageView = (path: string) => {
  if (!window.gtag) {
    return;
  }

  const consent = localStorage.getItem('ga4_consent');
  if (consent !== 'granted') {
    return; // Kein Tracking ohne Consent
  }

  window.gtag('config', GA4_MEASUREMENT_ID, {
    page_path: path,
  });
};

/**
 * Prüft, ob Consent bereits gegeben wurde
 */
export const hasGA4Consent = (): boolean => {
  return localStorage.getItem('ga4_consent') === 'granted';
};

/**
 * Setzt Consent zurück (für Testing)
 */
export const resetGA4Consent = () => {
  localStorage.removeItem('ga4_consent');
  if (window.gtag) {
    updateGA4Consent(false);
  }
};

