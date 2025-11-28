import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import Footer from './Footer';
import Spinner from './Spinner';

const SuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: isAuthLoading, refreshUser } = useAuth();
  const sessionId = searchParams.get('session_id');
  const [hasRefreshed, setHasRefreshed] = useState(false);

  // Immer stoffanprobe_has_visited setzen, auch wenn User ausgeloggt
  // (damit nach App-Rückkehr keine Landing-Page erscheint)
  useEffect(() => {
    localStorage.setItem('stoffanprobe_has_visited', 'true');
  }, []);

  useEffect(() => {
    // User-Daten aktualisieren nach erfolgreicher Zahlung
    if (sessionId && user && !hasRefreshed) {
      // Warte kurz, damit Webhook verarbeitet werden kann
      const timer = setTimeout(() => {
        refreshUser();
        setHasRefreshed(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [sessionId, user, refreshUser, hasRefreshed]);

  // Warte auf Auth-State nach Stripe-Redirect (kann kurz dauern)
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#FAF1DC] flex items-center justify-center">
        <Spinner message="Wird geladen..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF1DC] flex flex-col">
      <Header 
        onNewSession={() => navigate('/')}
        onShowSessions={() => navigate('/')}
        onSaveSession={() => navigate('/')}
        hasSession={false}
        user={user}
        onLogin={() => navigate('/')}
        onShowPaywall={() => {}}
      />
      
      <main className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="mb-6">
            <svg
              className="w-20 h-20 mx-auto text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-[#532418] mb-4">
            Zahlung erfolgreich!
          </h1>
          
          <p className="text-gray-600 mb-8">
            Vielen Dank für Ihren Kauf. Ihre Credits wurden Ihrem Konto hinzugefügt.
            {sessionId && (
              <span className="block mt-2 text-sm text-gray-500">
                Session ID: {sessionId}
              </span>
            )}
          </p>
          
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-[#C8956C] text-white rounded-lg font-semibold text-lg hover:bg-[#A67B5B] transition-colors"
          >
            Zur App zurückkehren
          </button>
        </div>
      </main>

      <Footer
        onOpenImpressum={() => {}}
        onOpenDatenschutz={() => {}}
        onOpenAgb={() => {}}
        onOpenCookieSettings={() => {}}
      />
    </div>
  );
};

export default SuccessPage;

