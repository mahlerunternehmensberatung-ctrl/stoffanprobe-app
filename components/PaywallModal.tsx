import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { getCurrentUser } from '../services/authService';
import { User } from '../types';

interface PaywallModalProps {
  onClose: () => void;
  onUpgradeSuccess?: () => void;
  user?: User | null;
}

const PaywallModal: React.FC<PaywallModalProps> = ({ onClose, onUpgradeSuccess, user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);

    if (!user) {
      setError('Bitte melden Sie sich an.');
      setIsLoading(false);
      return;
    }

    try {
      // Firebase Auth Token holen
      const firebaseUser = getCurrentUser();
      if (!firebaseUser) {
        throw new Error('Nicht angemeldet');
      }

      const idToken = await firebaseUser.getIdToken();

      // Stripe Checkout Session erstellen
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Fehler beim Erstellen der Checkout-Session');
      }

      const { sessionId } = await response.json();

      // Stripe Checkout öffnen
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
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#FFFFF5] rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#532418]">Upgrade auf Pro</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <p className="text-lg text-[#67534F] mb-4">
            Ihre Gratis-Phase ist beendet. Jetzt upgraden für unlimitierten Zugriff!
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-[#532418] mb-2">Pro-Plan Vorteile:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-[#67534F]">
              <li>Unlimitierte Entwürfe</li>
              <li>Alle Premium-Features</li>
              <li>Prioritärer Support</li>
              <li>Keine Wasserzeichen</li>
            </ul>
          </div>

          <div className="text-center mb-4">
            <p className="text-3xl font-bold text-[#532418]">29,00 €</p>
            <p className="text-sm text-gray-600">pro Monat</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Später
          </button>
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-[#C8956C] text-white rounded-lg hover:bg-[#A67B5B] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Wird geladen...' : 'Jetzt upgraden'}
          </button>
        </div>

        <p className="text-xs text-center text-gray-500 mt-4">
          Ihre Daten werden sicher über Stripe verarbeitet.
        </p>
      </div>
    </div>
  );
};

export default PaywallModal;

