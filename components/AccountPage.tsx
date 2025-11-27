import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import Footer from './Footer';

// Gold-Styles (konsistent mit PricingPage)
const goldGradient = "bg-gradient-to-br from-[#E6C785] via-[#CDA35E] to-[#B08642]";
const goldTextGradient = "bg-clip-text text-transparent bg-gradient-to-br from-[#B08642] to-[#8C6A30]";

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
    <div className="min-h-screen bg-[#FAF1DC] flex flex-col font-sans">
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

          {/* Zurück-Button mit Gold-Hover */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[#532418] font-medium hover:text-[#B08642] transition-colors mb-6"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Zurück zum Editor
          </button>

          <h1 className="text-3xl sm:text-4xl font-bold text-[#532418] mb-8">
            Mein Konto
          </h1>

          {/* Erfolgs-Meldung mit Gold-Design */}
          {successMessage && (
            <div className="bg-[#FDFBF7] border border-[#E6C785] text-[#8C6A30] px-4 py-3 rounded-2xl mb-6 flex justify-between items-center shadow-sm">
              <span className="font-medium">{successMessage}</span>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-[#B08642] hover:text-[#8C6A30] font-bold text-xl"
              >
                ×
              </button>
            </div>
          )}

          {/* Kontoinformationen - Gold Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E6C785]/30 p-6 mb-6 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold text-[#532418] mb-4">Kontoinformationen</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#8C6A30] font-medium">Name</p>
                <p className="text-lg font-semibold text-[#532418]">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#8C6A30] font-medium">E-Mail</p>
                <p className="text-lg font-semibold text-[#532418]">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Plan-Box - Gold Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E6C785]/30 p-6 mb-6 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold text-[#532418] mb-4">Ihr Plan</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#8C6A30] font-medium">Aktueller Plan</p>
                <p className={`text-2xl font-extrabold ${goldTextGradient}`}>{getPlanDisplay()}</p>
              </div>

              {user.plan === 'pro' && (
                <>
                  {user.subscriptionEndsAt ? (
                    <div className="bg-[#FEF7ED] border border-[#E6C785] rounded-xl p-4">
                      <p className="text-sm text-[#B08642] font-bold">⚠️ Abo wird gekündigt</p>
                      <p className="text-lg font-semibold text-[#8C6A30] mt-1">
                        Endet am {formatDate(user.subscriptionEndsAt)}
                      </p>
                      <p className="text-sm text-[#B08642]/80 mt-2">
                        Ihre monatlichen Credits sind bis zu diesem Datum verfügbar.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-[#8C6A30] font-medium">Abo-Status</p>
                      <p className="text-lg font-semibold text-green-600">✓ Aktiv</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-[#E6C785]/30">
                    {user.subscriptionEndsAt ? (
                      <button
                        className={`px-6 py-3 ${goldGradient} text-white rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all transform disabled:opacity-50 disabled:transform-none`}
                        onClick={handleReactivateSubscription}
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Wird verarbeitet...' : '↩ Kündigung widerrufen'}
                      </button>
                    ) : (
                      <button
                        className="px-6 py-3 bg-red-50 text-red-600 border border-red-200 rounded-full hover:bg-red-100 transition-colors font-medium"
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

          {/* Credits-Box - Gold Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E6C785]/30 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold text-[#532418] mb-4">Credits</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#8C6A30] font-medium">Verfügbare Credits</p>
                <p className={`text-4xl font-extrabold ${goldTextGradient}`}>{getTotalCredits()}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E6C785]/30">
                <div>
                  <p className="text-sm text-[#8C6A30] font-medium">Monatliche Credits</p>
                  <p className="text-2xl font-bold text-[#532418]">{user.monthlyCredits ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-[#8C6A30] font-medium">Gekaufte Credits</p>
                  <p className="text-2xl font-bold text-[#532418]">{user.purchasedCredits ?? 0}</p>
                  {user.purchasedCreditsExpiry && (
                    <p className="text-xs text-[#B08642]/70 mt-1">
                      Gültig bis: {user.purchasedCreditsExpiry.toLocaleDateString('de-DE')}
                    </p>
                  )}
                </div>
              </div>

              {user.plan !== 'pro' && (
                <div className="mt-4 pt-4 border-t border-[#E6C785]/30">
                  <button
                    onClick={() => navigate('/pricing')}
                    className={`px-8 py-3 ${goldGradient} text-white rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all transform`}
                  >
                    Credits kaufen
                  </button>
                </div>
              )}
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

      {/* Kündigungs-Modal - Gold Design */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-[#E6C785]/30">
            <h3 className="text-xl font-bold text-[#532418] mb-4">
              Abo kündigen
            </h3>

            <div className="space-y-4 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-800 font-bold mb-2">
                  ⚠️ Bitte beachten Sie:
                </p>
                <ul className="text-sm text-red-700 space-y-2 list-disc list-inside">
                  <li>Ihr Abo wird zum Ende der Abrechnungsperiode beendet</li>
                  <li>Monatliche Credits (40/Monat) verfallen</li>
                  <li>Gekaufte Credit-Pakete bleiben bis zu ihrem Ablaufdatum gültig</li>
                  <li>Sie können jederzeit ein neues Abo abschließen</li>
                </ul>
              </div>

              <div className="bg-[#FDFBF7] border border-[#E6C785]/50 rounded-xl p-4">
                <p className="text-sm text-[#8C6A30]">
                  <span className="font-bold">💡 Wichtig:</span> Ihre Galerien sind lokal in Ihrem Browser gespeichert.
                  Laden Sie Ihre Bilder herunter, bevor Sie Ihren Browser-Cache leeren.
                </p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cancelConfirmed}
                  onChange={(e) => setCancelConfirmed(e.target.checked)}
                  className="mt-1 h-4 w-4 text-[#B08642] border-[#E6C785] rounded focus:ring-[#CDA35E]"
                />
                <span className="text-sm text-[#67534F]">
                  Ich verstehe, dass meine monatlichen Credits verfallen.
                </span>
              </label>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-xl">
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
                className="flex-1 px-4 py-3 bg-gray-100 text-[#67534F] rounded-full hover:bg-gray-200 transition-colors font-medium"
                disabled={isProcessing}
              >
                Abbrechen
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={!cancelConfirmed || isProcessing}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Wird verarbeitet...' : 'Abo kündigen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fehler-Anzeige */}
      {error && !showCancelModal && (
        <div className="fixed bottom-5 right-5 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-2xl shadow-lg z-50">
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
