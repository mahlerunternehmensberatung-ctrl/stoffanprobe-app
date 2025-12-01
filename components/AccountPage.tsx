import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import Footer from './Footer';

// Gold-Styles (konsistent mit PricingPage)
const goldGradient = "bg-gradient-to-br from-[#E6C785] via-[#CDA35E] to-[#B08642]";
const goldTextGradient = "bg-clip-text text-transparent bg-gradient-to-br from-[#B08642] to-[#8C6A30]";

const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
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
        throw new Error(data.error || t('errors.cancellationFailed'));
      }

      setShowCancelModal(false);
      setCancelConfirmed(false);
      setSuccessMessage(t('account.cancelSuccess'));

      setTimeout(async () => {
        await refreshUser();
      }, 500);

    } catch (err: any) {
      setError(err.message || t('errors.generic'));
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
        throw new Error(data.error || t('errors.reactivationFailed'));
      }

      setSuccessMessage(t('account.reactivateSuccess'));

      setTimeout(async () => {
        await refreshUser();
      }, 500);

    } catch (err: any) {
      setError(err.message || t('errors.generic'));
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(i18n.language === 'de' ? 'de-DE' : 'en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF1DC] flex items-center justify-center">
        <div className="text-[#532418]">{t('common.loading')}</div>
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
        <div className="text-[#532418]">{t('common.loading')}</div>
      </div>
    );
  }

  const getPlanDisplay = () => {
    if (user.plan === 'pro') {
      return t('account.proPlan');
    }
    if (user.plan === 'home') {
      return t('account.homePlan');
    }
    return t('account.freePlan');
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
            {t('account.backToEditor')}
          </button>

          <h1 className="text-3xl sm:text-4xl font-bold text-[#532418] mb-8">
            {t('account.title')}
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
            <h2 className="text-xl font-bold text-[#532418] mb-4">{t('account.accountInfo')}</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#8C6A30] font-medium">{t('account.name')}</p>
                <p className="text-lg font-semibold text-[#532418]">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#8C6A30] font-medium">{t('auth.email')}</p>
                <p className="text-lg font-semibold text-[#532418]">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Plan-Box - Gold Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E6C785]/30 p-6 mb-6 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold text-[#532418] mb-4">{t('account.yourPlan')}</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#8C6A30] font-medium">{t('account.currentPlan')}</p>
                <p className={`text-2xl font-extrabold ${goldTextGradient}`}>{getPlanDisplay()}</p>
              </div>

              {(user.plan === 'pro' || user.plan === 'home') && (
                <>
                  {user.subscriptionEndsAt ? (
                    <div className="bg-[#FEF7ED] border border-[#E6C785] rounded-xl p-4">
                      <p className="text-sm text-[#B08642] font-bold">{t('account.cancellationPending')}</p>
                      <p className="text-lg font-semibold text-[#8C6A30] mt-1">
                        {t('account.endsAt', { date: formatDate(user.subscriptionEndsAt) })}
                      </p>
                      <p className="text-sm text-[#B08642]/80 mt-2">
                        {t('account.monthlyCreditsNote')}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-[#8C6A30] font-medium">{t('account.subscriptionStatus')}</p>
                      <p className="text-lg font-semibold text-green-600">{t('account.active')}</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-[#E6C785]/30">
                    {user.subscriptionEndsAt ? (
                      <button
                        className={`px-6 py-3 ${goldGradient} text-white rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all transform disabled:opacity-50 disabled:transform-none`}
                        onClick={handleReactivateSubscription}
                        disabled={isProcessing}
                      >
                        {isProcessing ? t('common.processing') : t('account.reactivate')}
                      </button>
                    ) : (
                      <button
                        className="px-6 py-3 bg-red-50 text-red-600 border border-red-200 rounded-full hover:bg-red-100 transition-colors font-medium"
                        onClick={() => setShowCancelModal(true)}
                      >
                        {t('account.cancelSubscription')}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Credits-Box - Gold Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E6C785]/30 p-6 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-bold text-[#532418] mb-4">{t('account.credits')}</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#8C6A30] font-medium">{t('account.availableCredits')}</p>
                <p className={`text-4xl font-extrabold ${goldTextGradient}`}>{getTotalCredits()}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E6C785]/30">
                <div>
                  <p className="text-sm text-[#8C6A30] font-medium">{t('account.monthlyCredits')}</p>
                  <p className="text-2xl font-bold text-[#532418]">{user.monthlyCredits ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-[#8C6A30] font-medium">{t('account.purchasedCredits')}</p>
                  <p className="text-2xl font-bold text-[#532418]">{user.purchasedCredits ?? 0}</p>
                  {user.purchasedCreditsExpiry && (
                    <p className="text-xs text-[#B08642]/70 mt-1">
                      {t('account.validUntil')} {user.purchasedCreditsExpiry.toLocaleDateString(i18n.language === 'de' ? 'de-DE' : 'en-US')}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#E6C785]/30">
                <button
                  onClick={() => navigate('/pricing')}
                  className={`px-8 py-3 ${goldGradient} text-white rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all transform`}
                >
                  {user.plan === 'free' ? t('account.upgradePlan') : t('account.buyCredits')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Kündigungs-Modal - Gold Design */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-[#E6C785]/30">
            <h3 className="text-xl font-bold text-[#532418] mb-4">
              {t('account.cancelTitle')}
            </h3>

            <div className="space-y-4 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-800 font-bold mb-2">
                  {t('account.cancelWarningHeader')}
                </p>
                <ul className="text-sm text-red-700 space-y-2 list-disc list-inside">
                  <li>{t('account.cancelWarning1')}</li>
                  <li>{t('account.cancelWarning2')}</li>
                  <li>{t('account.cancelWarning3')}</li>
                  <li>{t('account.cancelWarning4')}</li>
                </ul>
              </div>

              <div className="bg-[#FDFBF7] border border-[#E6C785]/50 rounded-xl p-4">
                <p className="text-sm text-[#8C6A30]">
                  <span className="font-bold">{t('account.importantHeader')}</span> {t('account.importantNote')}
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
                  {t('account.cancelConfirmation')}
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
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={!cancelConfirmed || isProcessing}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? t('common.processing') : t('account.cancelConfirmButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fehler-Anzeige */}
      {error && !showCancelModal && (
        <div className="fixed bottom-5 right-5 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-2xl shadow-lg z-50">
          <strong className="font-bold">{t('errors.errorTitle')}</strong>
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
