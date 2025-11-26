import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Session, Variant, CustomerData, RALColor } from './types';
import { saveSession, getSession, getAllSessions, searchSessions } from './services/dbService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import { NextIcon } from './components/Icon';
import ImageModal from './components/ImageModal';
import SaveSessionModal from './components/SaveSessionModal';
import Footer from './components/Footer';
import LegalModal from './components/LegalModal';
import { impressumText, datenschutzText, agbText } from './legalTexts';
import Workspace from './components/Workspace';
import ColorPickerModal from './components/ColorPickerModal';
import LandingPage from './components/LandingPage';
import RegisterModal from './components/RegisterModal';
import LoginModal from './components/LoginModal';
import PaywallModal from './components/PaywallModal';
import CookieConsentModal from './components/CookieConsentModal';
import PricingPage from './components/PricingPage';
import SuccessPage from './components/SuccessPage';
import { useAuth } from './context/AuthContext';
import { logoutUser } from './services/authService';
import { decrementCredits } from './services/userService';
import { trackPageView, trackEvent } from './services/analytics';
import { v4 as uuidv4 } from 'uuid';


const App: React.FC = () => {
  // Auth Context - User und Credits werden live abonniert
  const { user, loading: isAuthLoading, refreshUser } = useAuth();
  
  // UI State
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showPaywallModal, setShowPaywallModal] = useState<boolean>(false);
  const [showCookieSettings, setShowCookieSettings] = useState<boolean>(false);

  // App State
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionsList, setSessionsList] = useState<SessionSummary[]>([]);
  const [showSessionList, setShowSessionList] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [modalVariant, setModalVariant] = useState<Variant | null>(null);
  const [showImpressum, setShowImpressum] = useState(false);
  const [showDatenschutz, setShowDatenschutz] = useState(false);
  const [showAgb, setShowAgb] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);

  // Check for MediaDevices support for Speech Recognition API
  const isSpeechRecognitionSupported = useMemo(() => 
    !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition)
  , []);

  type SessionSummary = Omit<Session, 'originalImage' | 'patternImage' | 'variants' | 'brandingLogo' | 'consentData'> & { consentData?: Session['consentData'] }

  // Prüfe ob es der erste Besuch ist
  const [isFirstVisit, setIsFirstVisit] = useState<boolean | null>(null);

  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('stoffanprobe_has_visited');
    setIsFirstVisit(!hasVisitedBefore);
    if (!hasVisitedBefore) {
      localStorage.setItem('stoffanprobe_has_visited', 'true');
    }
  }, []);

  // Prüfe ob User von Stripe-Redirect kommt (success Parameter)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const sessionId = urlParams.get('session_id');
    
    // Wenn von Stripe-Redirect: Setze isFirstVisit auf false, damit keine Landing Page angezeigt wird
    if (success === 'true' && sessionId) {
      localStorage.setItem('stoffanprobe_has_visited', 'true');
      setIsFirstVisit(false);
    }
  }, []);

  // Prüfe auf erfolgreiche Stripe-Zahlung (URL-Parameter)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const sessionId = urlParams.get('session_id');

    if (success === 'true' && sessionId && user) {
      // User-Daten werden automatisch über AuthContext aktualisiert (Realtime)
      // URL-Parameter entfernen
      window.history.replaceState({}, document.title, window.location.pathname);
      // Track erfolgreiche Zahlung
      trackEvent('purchase', {
        transaction_id: sessionId,
        value: 29.00,
        currency: 'EUR',
      });
      // Optional: Manuell refreshen (normalerweise nicht nötig, da Realtime)
      refreshUser();
    }
  }, [user]);

  // Pageview-Tracking
  useEffect(() => {
    trackPageView(window.location.pathname);
  }, []);

  // Track wichtige Events
  const handleUserRegistration = useCallback(() => {
    trackEvent('sign_up', {
      method: 'email',
    });
  }, []);

  const handleUserLogin = useCallback(() => {
    trackEvent('login', {
      method: 'email',
    });
  }, []);

  const handleImageGeneration = useCallback(() => {
    trackEvent('generate_image', {
      user_plan: user?.plan || 'free',
    });
  }, [user]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      setSession(null);
      // User wird automatisch über AuthContext auf null gesetzt
    } catch (err: any) {
      setError(err.message || 'Fehler beim Abmelden');
    }
  };

  const handleDecrementCredits = useCallback(async () => {
    if (!user) return;
    try {
      await decrementCredits(user.uid);
      // Credits werden automatisch über AuthContext Realtime-Subscription aktualisiert
      // Optional: Manuell refreshen (normalerweise nicht nötig)
      refreshUser();
    } catch (err: any) {
      throw err; // Weiterwerfen, damit Workspace den Fehler behandeln kann
    }
  }, [user, refreshUser]);

  const fetchSessions = useCallback(async (query: string = '') => {
    const sessions = query ? await searchSessions(query) : await getAllSessions();
    setSessionsList(sessions);
  }, []);

  useEffect(() => {
    if(showSessionList) {
        fetchSessions(searchQuery);
    }
  }, [showSessionList, fetchSessions]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = window.setTimeout(() => {
        if(showSessionList) {
            fetchSessions(searchQuery);
        }
    }, 300); // 300ms debounce

    return () => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
    };
  }, [searchQuery, showSessionList, fetchSessions]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const updateSession = (updater: (prev: Session) => Session) => {
    setSession(prev => {
        if (!prev) return null;
        const newSession = updater(prev);
        saveSession(newSession);
        return newSession;
    });
  };

  const createNewSession = (params?: { wallColor?: RALColor; originalImage?: string; patternImage?: string; consentData?: any; customerData?: CustomerData; imageType?: import('./types').ImageType }): Session => {
    const now = new Date();
    
    // Ensure that if customerData exists, it has the required salesCategories array
    const finalCustomerData = params?.customerData 
      ? { salesCategories: [], ...params.customerData } 
      : undefined;

    const newSession: Session = {
        id: uuidv4(),
        name: `Sitzung vom ${now.toLocaleDateString('de-DE')}`,
        createdAt: now,
        updatedAt: now,
        originalImage: params?.originalImage || '',
        patternImage: params?.patternImage || '',
        variants: [],
        wallColor: params?.wallColor,
        consentData: params?.consentData,
        customerData: finalCustomerData,
        imageType: params?.imageType,
    };
    saveSession(newSession);
    fetchSessions();
    setSession(newSession);
    return newSession;
  };

  const handleSelectWallColor = (color: RALColor) => {
    if (session) {
      updateSession(s => ({ ...s, wallColor: color }));
    } else {
      createNewSession({ wallColor: color });
    }
    setShowColorPicker(false);
  };

  const handleLoadSession = async (id: string) => {
    setIsAppLoading(true);
    const loadedSession = await getSession(id);
    if(loadedSession) {
        setSession(loadedSession);
    }
    setShowSessionList(false);
    setSearchQuery('');
    setIsAppLoading(false);
  }

  const handleNewSession = () => {
    setSession(null);
    setShowSessionList(false);
  }

  const handleDeleteVariant = (variantId: string) => {
    if (!session) return;
    updateSession(prev => ({
        ...prev,
        variants: prev.variants.filter(v => v.id !== variantId),
    }));
    if (modalVariant?.id === variantId) {
        setModalVariant(null);
    }
  };

  const handleDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEmail = (imageUrl: string) => {
    const subject = "stoffanprobe.de Visualisierung";
    const body = `Hallo,\n\nanbei eine Visualisierung von stoffanprobe.de.\n\n(Um das Bild zu senden, laden Sie es bitte zuerst herunter und fügen Sie es als Anhang Ihrer E-Mail hinzu.)`;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const handleSaveSessionDetails = (details: { name: string; customerData: CustomerData; notes: string }) => {
    if (!session) return;
    updateSession(prev => ({
        ...prev,
        name: details.name,
        // Ensure that salesCategories is always an array, even if updating from an older session
        customerData: {
            ...(prev.customerData || {}),
            ...details.customerData,
            salesCategories: details.customerData.salesCategories || [],
        } as CustomerData,
        notes: details.notes,
    }));
    fetchSessions(); // Refresh list to show updated data
    setIsSaveModalOpen(false);
  };

  // React Hooks müssen IMMER vor allen bedingten Returns stehen
  const navigate = useNavigate();
  const location = useLocation();

  // Routing für Pricing und Success Pages - VOR Auth-Loading-Check, damit diese Seiten auch ohne Login erreichbar sind
  if (location.pathname === '/pricing') {
    return <PricingPage />;
  }

  if (location.pathname === '/success') {
    return <SuccessPage />;
  }

  // Zeige Loading, während Auth-Status oder First-Visit geprüft wird
  if (isAuthLoading || isFirstVisit === null) {
    return (
      <div className="min-h-screen bg-[#FAF1DC] flex items-center justify-center">
        <Spinner message="Wird geladen..." />
      </div>
    );
  }

  // Zeige Landing Page nur beim ersten Besuch, wenn nicht eingeloggt und auf Home
  // NICHT anzeigen wenn User von Stripe-Redirect kommt (session_id Parameter vorhanden)
  const urlParams = new URLSearchParams(window.location.search);
  const isStripeRedirect = urlParams.get('success') === 'true' || urlParams.get('session_id');
  
  if (!user && isFirstVisit && location.pathname === '/' && !isStripeRedirect) {
    return (
      <div className="min-h-screen bg-[#FAF1DC]">
        <LandingPage 
          onGetStarted={() => setShowRegisterModal(true)} 
          onLogin={() => setShowLoginModal(true)}
        />
        {showRegisterModal && (
          <RegisterModal
            onClose={() => setShowRegisterModal(false)}
            onSuccess={() => {
              setShowRegisterModal(false);
              handleUserRegistration();
              // User wird durch Auth-State-Change automatisch geladen
            }}
          />
        )}
        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onSuccess={() => {
              setShowLoginModal(false);
              handleUserLogin();
              // User wird durch Auth-State-Change automatisch geladen
            }}
            onShowRegister={() => {
              setShowLoginModal(false);
              setShowRegisterModal(true);
            }}
          />
        )}
        <CookieConsentModal onOpenPrivacyPolicy={() => setShowDatenschutz(true)} />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#FAF1DC] text-[#67534F] flex flex-col">
      <Header 
        onNewSession={handleNewSession} 
        onShowSessions={() => setShowSessionList(true)} 
        onSaveSession={() => setIsSaveModalOpen(true)} 
        hasSession={!!session}
        user={user}
        onLogout={handleLogout}
        onLogin={() => setShowLoginModal(true)}
        onShowPaywall={() => setShowPaywallModal(true)}
      />
      
      {/* Login Modal für ausgeloggte User */}
      {!user && showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setShowLoginModal(false);
            handleUserLogin();
            // User wird durch Auth-State-Change automatisch geladen
          }}
          onShowRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
        />
      )}
      
      {/* Register Modal für ausgeloggte User */}
      {!user && showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onSuccess={() => {
            setShowRegisterModal(false);
            handleUserRegistration();
            // User wird durch Auth-State-Change automatisch geladen
          }}
        />
      )}
      
      {isAppLoading && <Spinner message="Sitzung wird geladen..." />}
      
      <Workspace
        session={session}
        setSession={setSession}
        updateSession={updateSession}
        setModalVariant={setModalVariant}
        setError={setError}
        isSpeechRecognitionSupported={isSpeechRecognitionSupported}
        fetchSessions={fetchSessions}
        onShowSessions={() => setShowSessionList(true)}
        onCreateSession={createNewSession}
        onSelectWallColor={() => setShowColorPicker(true)}
        user={user}
        onShowPaywall={() => setShowPaywallModal(true)}
        onDecrementCredits={handleDecrementCredits}
        onImageGenerated={handleImageGeneration}
      />

      <Footer
        onOpenImpressum={() => setShowImpressum(true)}
        onOpenDatenschutz={() => setShowDatenschutz(true)}
        onOpenAgb={() => setShowAgb(true)}
        onOpenCookieSettings={() => setShowCookieSettings(true)}
      />

      {showImpressum && (
        <LegalModal
          title="Impressum"
          text={impressumText}
          onClose={() => setShowImpressum(false)}
        />
      )}
      {showDatenschutz && (
        <LegalModal
          title="Datenschutzerklärung"
          text={datenschutzText}
          onClose={() => setShowDatenschutz(false)}
        />
      )}
      {showAgb && (
        <LegalModal
          title="AGB"
          text={agbText}
          onClose={() => setShowAgb(false)}
        />
      )}

      {modalVariant && (
        <ImageModal
          variant={modalVariant}
          originalImageUrl={session?.originalImage}
          onClose={() => setModalVariant(null)}
          onDelete={handleDeleteVariant}
          onDownload={handleDownload}
          onEmail={handleEmail}
        />
      )}

      {isSaveModalOpen && session && (
        <SaveSessionModal
            session={session}
            onClose={() => setIsSaveModalOpen(false)}
            onSave={handleSaveSessionDetails}
            isSpeechRecognitionSupported={isSpeechRecognitionSupported}
        />
      )}
      
      {showColorPicker && (
        <ColorPickerModal
          onClose={() => setShowColorPicker(false)}
          onSelect={handleSelectWallColor}
        />
      )}

      {showSessionList && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => { setShowSessionList(false); setSearchQuery(''); }}>
              <div className="bg-[#FFFFF5] rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                  <h2 className="text-2xl font-bold text-[#532418] mb-4">Sitzung fortsetzen</h2>
                  <div className="mb-4">
                      <input
                          type="search"
                          placeholder="🔍 Name, E-Mail oder Projekttitel eingeben"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF954F] transition-all"
                      />
                  </div>
                  <div className="overflow-y-auto">
                    {sessionsList.length > 0 ? (
                      <ul className="space-y-3">
                        {sessionsList.map(s => (
                            <li key={s.id} onClick={() => handleLoadSession(s.id)}
                                className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md hover:bg-yellow-50 transition-all cursor-pointer flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-semibold text-[#532418]">
                                        {s.name}
                                        {s.consentData?.timestamp ? (
                                            <span className="text-green-600 font-bold ml-2" title="Einwilligung vorhanden">●</span>
                                        ) : (
                                            <span className="text-red-600 font-bold ml-2" title="Keine Einwilligung">●</span>
                                        )}
                                    </p>
                                    <p className="text-sm text-gray-600 truncate">
                                        {s.customerData?.customerName && <span className="font-medium">{s.customerData.customerName}</span>}
                                        {s.customerData?.email && <span className="text-gray-500"> - {s.customerData.email}</span>}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Zuletzt geändert: {new Date(s.updatedAt).toLocaleString('de-DE')}
                                    </p>
                                </div>
                                <NextIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            </li>
                        ))}
                      </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-8">
                            {searchQuery ? `Keine Sitzungen für "${searchQuery}" gefunden.` : 'Keine gespeicherten Sitzungen gefunden.'}
                        </p>
                    )}
                  </div>
                  <button onClick={() => { setShowSessionList(false); setSearchQuery(''); }} className="mt-6 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 self-center">
                      Schließen
                  </button>
              </div>
          </div>
      )}

      {showPaywallModal && (
        <PaywallModal
          onClose={() => setShowPaywallModal(false)}
          onUpgradeSuccess={() => {
            setShowPaywallModal(false);
            // User-Daten neu laden nach Upgrade
            refreshUser();
            // Track Paywall-Interaktion
            trackEvent('view_paywall', {
              user_plan: 'free',
            });
          }}
          user={user}
        />
      )}

      <CookieConsentModal 
        onClose={showCookieSettings ? () => setShowCookieSettings(false) : undefined}
        onOpenPrivacyPolicy={() => {
          if (showCookieSettings) {
            setShowCookieSettings(false);
          }
          setShowDatenschutz(true);
        }}
      />

      {error && (
        <div className="fixed bottom-5 right-5 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in" role="alert">
          <strong className="font-bold">Fehler!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

    </div>
  );
};

export default App;