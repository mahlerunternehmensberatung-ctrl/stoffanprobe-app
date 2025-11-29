import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { getCurrentUser } from '../services/authService';
import { User } from '../types';

interface PaywallModalProps {
  onClose: () => void;
  onUpgradeSuccess?: () => void;
  user?: User | null;
}

interface PlanOption {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  priceId: string;
  features: string[];
  buttonText: string;
}

const plans: PlanOption[] = [
  {
    id: 'pro',
    title: 'Für Profis',
    subtitle: 'Für Raumausstatter & Interior Designer',
    price: '19,90',
    priceId: import.meta.env.VITE_STRIPE_PRICE_PRO_ABO || '',
    features: [
      'Kundenräume visualisieren',
      'DSGVO-konformer Workflow',
      '40 Credits/Monat',
    ],
    buttonText: 'Pro wählen',
  },
  {
    id: 'home',
    title: 'Für Zuhause',
    subtitle: 'Für dein Zuhause',
    price: '9,90',
    priceId: import.meta.env.VITE_STRIPE_PRICE_HOME_ABO || '',
    features: [
      'Eigene Räume visualisieren',
      'Schnell & einfach',
      '40 Credits/Monat',
    ],
    buttonText: 'Home wählen',
  },
];

const PaywallModal: React.FC<PaywallModalProps> = ({ onClose, onUpgradeSuccess, user }) => {
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPlan = async (plan: PlanOption) => {
    setLoadingPlanId(plan.id);
    setError(null);

    if (!user) {
      setError('Bitte melden Sie sich an.');
      setLoadingPlanId(null);
      return;
    }

    if (!plan.priceId) {
      setError('Preis-ID nicht konfiguriert. Bitte kontaktieren Sie den Support.');
      setLoadingPlanId(null);
      return;
    }

    try {
      const firebaseUser = getCurrentUser();
      if (!firebaseUser) {
        throw new Error('Nicht angemeldet');
      }

      const idToken = await firebaseUser.getIdToken();

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: user.uid,
          customerEmail: user.email,
          mode: 'subscription',
          planType: plan.id, // 'pro' oder 'home'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Fehler beim Erstellen der Checkout-Session');
      }

      const { sessionId } = await response.json();

      const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
      if (!stripe) {
        throw new Error('Stripe konnte nicht geladen werden.');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'Fehler beim Öffnen des Checkouts');
      }
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      setLoadingPlanId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#FAF1DC] rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#532418]">Abo wählen</h2>
            <p className="text-[#67534F] mt-1">Wähle das passende Abo für deine Bedürfnisse</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#67534F] hover:text-[#532418] text-2xl p-1 -mt-1 -mr-1"
            aria-label="Schließen"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-[#C8956C]/20 hover:shadow-lg hover:border-[#C8956C]/40 transition-all"
            >
              {/* Plan Header */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-[#532418]">{plan.title}</h3>
                <p className="text-sm text-[#67534F]">{plan.subtitle}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className="text-3xl font-bold text-[#532418]">{plan.price}€</span>
                <span className="text-[#67534F]">/Monat</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[#67534F]">
                    <svg
                      className="w-5 h-5 text-[#C8956C] flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={!!loadingPlanId}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all ${
                  loadingPlanId === plan.id
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#C8956C] to-[#A67B5B] hover:opacity-90 hover:shadow-md'
                }`}
              >
                {loadingPlanId === plan.id ? 'Wird geladen...' : plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[#67534F]/70">
            Alle Preise inkl. MwSt. Jederzeit kündbar. Sichere Zahlung via Stripe.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaywallModal;
