import React, { useState } from 'react';
import { registerUser } from '../services/authService';

interface RegisterModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptPrivacy: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      setError('Bitte geben Sie Ihren Vornamen ein.');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Bitte geben Sie Ihren Nachnamen ein.');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return false;
    }
    if (!formData.acceptTerms) {
      setError('Bitte akzeptieren Sie die AGB.');
      return false;
    }
    if (!formData.acceptPrivacy) {
      setError('Bitte akzeptieren Sie die Datenschutzerklärung.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // registerUser erstellt automatisch:
      // 1. User in Firebase Auth
      // 2. User-Dokument in Firestore mit credits: 10, plan: "free"
      await registerUser(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );

      // Erfolg: Auth Context wird automatisch aktualisiert
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#532418]">10 Gratis-Entwürfe sichern</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>✓ Message Match:</strong> Sie erhalten 10 kostenlose Entwürfe zur Registrierung.
            <br />
            <span className="text-xs mt-1 block">0,00 € heute fällig</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#67534F] mb-1">
              Vorname *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF954F]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#67534F] mb-1">
              Nachname *
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF954F]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#67534F] mb-1">
              E-Mail *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF954F]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#67534F] mb-1">
              Passwort *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF954F]"
              required
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Mindestens 6 Zeichen</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#67534F] mb-1">
              Passwort bestätigen *
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF954F]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                className="mt-1 mr-2"
                required
              />
              <span className="text-sm text-[#67534F]">
                Ich akzeptiere die <a href="#" className="text-[#FF954F] underline">AGB</a> *
              </span>
            </label>
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={formData.acceptPrivacy}
                onChange={(e) => setFormData({ ...formData, acceptPrivacy: e.target.checked })}
                className="mt-1 mr-2"
                required
              />
              <span className="text-sm text-[#67534F]">
                Ich akzeptiere die <a href="#" className="text-[#FF954F] underline">Datenschutzerklärung</a> *
              </span>
            </label>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-[#FF954F] text-white rounded-lg hover:bg-[#CC5200] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Wird registriert...' : 'Kostenlos registrieren'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;

