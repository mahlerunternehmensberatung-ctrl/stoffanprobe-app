import React, { useState } from 'react';
import { loginUser } from '../services/authService';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
  onShowRegister: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onSuccess, onShowRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email.trim()) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return;
    }
    if (!formData.password) {
      setError('Bitte geben Sie Ihr Passwort ein.');
      return;
    }

    setIsLoading(true);
    try {
      await loginUser(formData.email, formData.password);
      // Kurze Verzögerung damit Firebase Auth-State Zeit hat sich zu aktualisieren
      await new Promise(resolve => setTimeout(resolve, 500));
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#FFFFF5] rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-[#532418]">Anmelden</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-[#C8956C] italic mb-4">Du siehst es. Du fühlst es.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#67534F] mb-1">
              E-Mail
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8956C]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#67534F] mb-1">
              Passwort
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8956C]"
              required
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-gradient-to-r from-[#C8956C] to-[#A67B5B] text-white rounded-lg hover:from-[#A67B5B] hover:to-[#8B6B4B] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-[#67534F]">
            Noch kein Konto?{' '}
            <button
              onClick={onShowRegister}
              className="text-[#C8956C] underline hover:text-[#A67B5B]"
            >
              Jetzt registrieren
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;

