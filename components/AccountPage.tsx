import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import Footer from './Footer';

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, refreshUser } = useAuth();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelConfirmed, setCancelConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCancelSubscription = async () => {
    if (!user || !cancelConfirmed) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, action: 'cancel' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler bei der Kündigung');
      }

      setShowCancelModal(false);
      setCancelConfirmed(false);
      setSuccessMessage('Ihr Abo wurde erfolgreich gekündigt.');
      
      // Refresh nach kurzer Verzögerung
      setTimeout(async () => {
        await refreshUser();
      }, 500);
      
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!user) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, action: 'reactivate' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Widerrufen der Kündigung');
      }

      setSuccessMessage('Ihre Kündigung wurde widerrufen. Ihr Abo läuft weiter.');
      
      setTimeout(async () => {
        await refreshUser();
      }, 500);
      
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF1DC] flex items-center justify-center">
        <div className="text-[#532418]">Wird geladen...</div>
      </div>
    );
  }

  // Redirect wenn nicht eingeloggt
  if (!user && !loading) {
    setTimeout(() => navigate('/'), 0);
    return null;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF1DC] flex items-center justify-center">
        <div className="text-[#532418]">Wird geladen...</div>
      </div>
    );
  }

  const getPlanDisplay = () => {
    if (user.plan === 'pro') {
      return 'Pro-Abo (19,90€/Monat)';
    }
    return 'Kostenlos';
  };

  const getTotalCredits = () => {
    const now = new Date();
    let purchasedCredits = user.purchasedCredits ?? 0;
    if (user.purchasedCreditsExpiry && user.purchasedCreditsExpiry < now) {
      purchasedCredits = 0;
    }
    
    const monthlyCredits = user.monthlyCredits ?? 0;
    return monthlyCredits + purchasedCredits;
  };

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
      
      <main className="flex-grow container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* NEU: Button zum Verlassen der Seite */}
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[#532418] font-medium hover:text-[#FF954F] transition-colors mb-6"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Zurück zum Editor
          </button>

          <h1 className="text-3xl sm:text-4xl font-bold text-[#532418] mb-8">
            Mein Konto
          </h1>

          {/* Erfolgs-Meldung */}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
              <span>{successMessage}</span>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-700 hover:text-green-900 font-bold"
              >
                ×
              </button>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#532418] mb-4">Kontoinformationen</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-lg font-semibold text-[#532418]">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">E-Mail</p>
                <p className="text-lg font-semibold text-[#532418]">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#532418] mb-4">Ihr Plan</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Aktueller Plan</p>
                <p className="text-2xl font-bold text-[#532418]">{getPlanDisplay()}</p>
              </div>
              
              {user.plan === 'pro' && (
                <>
                  {user.subscriptionEndsAt ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800 font-medium">Abo wird gekündigt</p>
                      <p className="text-lg font-semibold text-yellow-900">
                        Endet am {formatDate(user.subscriptionEndsAt)}
                      </p>
                      <p className="text-sm text-yellow-700 mt-2">
                        Ihre monatlichen Credits sind bis zu diesem Datum verfügbar.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600">Abo-Status</p>
                      <p className="text-lg font-semibold text-[#532418]">Aktiv</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {user.subscriptionEndsAt ? (
                      // Dieser Button reaktiviert das Abo. Wenn das nicht gewünscht ist, diesen Block entfernen.
                      <button
                        className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium disabled:opacity-50"
                        onClick={handleReactivateSubscription}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Wird verarbeitet...' : 'Kündigung widerrufen'}
                      </button>
                    ) : (
                      <button
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                        onClick={() => setShowCancelModal(true)}
                      >
                        Abo kündigen
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-[#532418] mb-4">Credits</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Verfügbare Credits</p>
                <p className="text-2xl font-bold text-[#532418]">{getTotalCredits()}</p>
              </div>
              <>
                <div>
                  <p className="text-sm text-gray-600">Monatliche Credits</p>
                  <p className="text-lg font-semibold text-[#532418]">{user.monthlyCredits ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gekaufte Credits</p>
                  <p className="text-lg font-semibold text-[#532418]">{user.purchasedCredits ?? 0}</p>
                  {user.purchasedCreditsExpiry && (
                    <p className="text-xs text-gray-500 mt-1">
                      Gültig bis: {user.purchasedCreditsExpiry.toLocaleDateString('de-DE')}
                    </p>
                  )}
                </div>
                {user.plan !== 'pro' && (
                  <div className="mt-4">
                    <button
                      onClick={() => navigate('/pricing')}
                      className="px-6 py-3 bg-[#FF954F] text-white rounded-lg font-semibold hover:bg-[#CC5200] transition-colors"
                    >
                      Credits kaufen
                    </button>
                  </div>
                )}
              </>
            </div>
          </div>
        </div>
      </main>

      <Footer
        onOpenImpressum={() => {}}
        onOpenDatenschutz={() => {}}
        onOpenAgb={() => {}}
        onOpenCookieSettings={() => {}}
      />

      {/* Kündigungs-Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-[#532418] mb-4">
              Abo kündigen
            </h3>

            <div className="space-y-4 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium mb-2">
                  Bitte beachten Sie:
                </p>
                <ul className="text-sm text-red-700 space-y-2 list-disc list-inside">
                  <li>Ihr Abo wird zum Ende der Abrechnungsperiode beendet</li>
                  <li>Monatliche Credits (40/Monat) verfallen</li>
                  <li>Gekaufte Credit-Pakete bleiben bis zu ihrem Ablaufdatum gültig</li>
                  <li>Sie können jederzeit ein neues Abo abschließen</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">💡 Wichtig:</span> Ihre Galerien sind lokal in Ihrem Browser gespeichert.
                  Laden Sie Ihre Bilder herunter, bevor Sie Ihren Browser-Cache leeren.
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cancelConfirmed}
                  onChange={(e) => setCancelConfirmed(e.target.checked)}
                  className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">
                  Ich verstehe, dass meine monatlichen Credits verfallen.
                </span>
              </label>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelConfirmed(false);
                  setError(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                disabled={isProcessing}
              >
                Abbrechen
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={!cancelConfirmed || isProcessing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Wird verarbeitet...' : 'Abo wirklich kündigen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fehler-Anzeige */}
      {error && !showCancelModal && (
        <div className="fixed bottom-5 right-5 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <strong className="font-bold">Fehler!</strong>
          <span className="block sm:inline ml-2">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountPage;