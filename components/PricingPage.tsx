import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';
import PaywallModal from './PaywallModal';

// Gold-Styles (wie gewünscht)
const goldGradient = "bg-gradient-to-br from-[#E6C785] via-[#CDA35E] to-[#B08642]";
const goldTextGradient = "bg-clip-text text-transparent bg-gradient-to-br from-[#B08642] to-[#8C6A30]";

// Die Pakete mit den NEUEN Variablennamen aus deinem Screenshot
const creditPackages = [
  {
    credits: 10,
    price: '4,90€',
    id: import.meta.env.VITE_STRIPE_PRICE_10_CREDITS,
  },
  {
    credits: 20,
    price: '9,90€',
    id: import.meta.env.VITE_STRIPE_PRICE_20_CREDITS,
  },
  {
    credits: 40,
    price: '19,90€',
    id: import.meta.env.VITE_STRIPE_PRICE_40_CREDITS,
  },
  {
    credits: 100,
    price: '49,00€',
    id: import.meta.env.VITE_STRIPE_PRICE_100_CREDITS,
  },
  {
    credits: 200,
    price: '99,00€',
    id: import.meta.env.VITE_STRIPE_PRICE_200_CREDITS,
  },
  {
    credits: 400,
    price: '199,00€',
    id: import.meta.env.VITE_STRIPE_PRICE_400_CREDITS,
  },
];

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Prüfe ob User ein aktives Abo hat
  const hasActiveSubscription = user?.plan === 'pro' || user?.plan === 'home';

  const handlePurchase = async (priceId: string) => {
    if (!user) {
      navigate('/');
      return;
    }

    // Ohne Abo keine Credits kaufen
    if (!hasActiveSubscription) {
      setShowPaywall(true);
      return;
    }

    if (!priceId) {
        setError(t('errors.priceIdMissing'));
        return;
    }

    setLoadingId(priceId);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.uid,
          customerEmail: user.email,
          mode: 'payment',
        }),
      });

      const { url, error: apiError } = await response.json();
      if (apiError) throw new Error(apiError);

      if (!url) {
        throw new Error(t('errors.checkoutUrl'));
      }

      // Direkte Weiterleitung zur Stripe Checkout URL
      window.location.href = url;

    } catch (err: any) {
      console.error('Purchase error:', err);
      setError(t('errors.checkoutFailed'));
      setLoadingId(null);
    }
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

      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Zurück-Button */}
          <button
            onClick={() => navigate('/')}
            className="mb-6 flex items-center gap-2 text-[#67534F] hover:text-[#532418] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('account.backToEditor')}
          </button>

          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#532418] mb-4">
              {t('pricing.title')}
            </h1>
          <p className="text-[#67534F] text-lg mb-8 max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>

          {/* Hinweis wenn kein aktives Abo */}
          {!hasActiveSubscription && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl max-w-xl mx-auto">
              <p className="text-amber-800 font-medium mb-3">
                {t('pricing.noSubscription')}
              </p>
              <button
                onClick={() => setShowPaywall(true)}
                className={`px-6 py-2 rounded-full font-bold text-white shadow-md transition-all ${goldGradient} hover:opacity-90`}
              >
                {t('pricing.subscribe')}
              </button>
            </div>
          )}

          {error && (
            <div className="mb-8 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {creditPackages.map((pkg) => (
              <div
                key={pkg.credits}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 p-8 border border-[#E6C785]/30 flex flex-col items-center relative"
              >
                <div className="text-center mb-6 w-full">
                  <h3 className="text-2xl font-bold text-[#532418] mb-1">{t('pricing.credits', { count: pkg.credits })}</h3>
                  <p className="text-sm text-[#8C6A30] mb-4 h-5">{t(`pricing.package${pkg.credits}`)}</p>

                  <div className={`text-4xl font-extrabold ${goldTextGradient}`}>
                    {pkg.price}
                  </div>
                </div>

                <button
                  onClick={() => pkg.id && handlePurchase(pkg.id)}
                  disabled={!!loadingId || !pkg.id || !hasActiveSubscription}
                  className={`w-full py-3 px-6 rounded-full font-bold text-white shadow-md transition-all ${
                    !hasActiveSubscription
                      ? 'bg-gray-300 cursor-not-allowed'
                      : loadingId === pkg.id
                        ? 'bg-gray-400 cursor-not-allowed'
                        : `${goldGradient} hover:opacity-90 transform active:scale-95 hover:shadow-lg`
                  }`}
                >
                  {loadingId === pkg.id ? t('common.loading') : t('pricing.purchase')}
                </button>
              </div>
            ))}
          </div>

          {/* Zahlungsmethoden-Hinweis */}
          <div className="mt-10 p-4 bg-white/60 rounded-xl border border-[#E6C785]/30 max-w-2xl mx-auto">
            <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 mb-3">
              {/* Kreditkarte */}
              <div className="flex items-center gap-1 text-gray-600">
                <svg className="w-8 h-6" viewBox="0 0 48 32" fill="currentColor">
                  <rect x="2" y="4" width="44" height="24" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <rect x="2" y="10" width="44" height="6" fill="currentColor" opacity="0.3"/>
                  <rect x="6" y="20" width="10" height="3" rx="1" fill="currentColor" opacity="0.5"/>
                </svg>
              </div>
              {/* PayPal */}
              <div className="text-[#003087] font-bold text-sm">PayPal</div>
              {/* Apple Pay */}
              <div className="text-gray-800 font-semibold text-sm flex items-center">
                <svg className="w-4 h-4 mr-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83"/>
                </svg>
                Pay
              </div>
              {/* Google Pay */}
              <div className="flex items-center text-sm">
                <span className="text-[#4285F4] font-semibold">G</span>
                <span className="text-[#EA4335] font-semibold">o</span>
                <span className="text-[#FBBC05] font-semibold">o</span>
                <span className="text-[#4285F4] font-semibold">g</span>
                <span className="text-[#34A853] font-semibold">l</span>
                <span className="text-[#EA4335] font-semibold">e</span>
                <span className="text-gray-700 font-semibold ml-1">Pay</span>
              </div>
              {/* SEPA */}
              <div className="text-gray-600 font-medium text-sm border border-gray-300 rounded px-2 py-0.5">SEPA</div>
            </div>
            <p className="text-xs sm:text-sm text-[#67534F] text-center">
              <span className="font-medium">{t('pricing.paymentTip')}</span>
            </p>
          </div>

          <div className="mt-6 text-sm text-[#67534F]/70">
            {t('pricing.disclaimer')}
          </div>
          </div>
        </div>
      </main>

      <Footer />

      {showPaywall && (
        <PaywallModal
          onClose={() => setShowPaywall(false)}
          user={user}
        />
      )}
    </div>
  );
};

export default PricingPage;