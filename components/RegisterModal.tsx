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
      await registerUser(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#FFFFF5] rounded-lg shadow-xl w-full max-w-md max-h-[95vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex justify-between items-center p-4 sm:p-6 pb-2 sm:pb-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg sm:text-2xl font-bold text-[#532418]">10 Gratis-Entwürfe sichern</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 pt-2 sm:pt-4">
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs sm:text-sm text-green-800">
              <strong>✓</strong> 10 kostenlose Entwürfe · 0,00 € heute fällig
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Vorname & Nachname nebeneinander auf Mobile */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#67534F] mb-1">
                  Vorname *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8956C]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#67534F] mb-1">
                  Nachname *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8956C]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#67534F] mb-1">
                E-Mail *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8956C]"
                required
              />
            </div>

            {/* Passwörter nebeneinander */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#67534F] mb-1">
                  Passwort *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8956C]"
                  required
                  minLength={6}
                  placeholder="Min. 6 Zeichen"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[#67534F] mb-1">
                  Bestätigen *
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8956C]"
                  required
                  placeholder="Wiederholen"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                  className="mr-2 flex-shrink-0"
                  required
                />
                <span className="text-xs sm:text-sm text-[#67534F]">
                  Ich akzeptiere die <a href="#" className="text-[#C8956C] underline hover:text-[#A67B5B]">AGB</a> *
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.acceptPrivacy}
                  onChange={(e) => setFormData({ ...formData, acceptPrivacy: e.target.checked })}
                  className="mr-2 flex-shrink-0"
                  required
                />
                <span className="text-xs sm:text-sm text-[#67534F]">
                  Ich akzeptiere die <a href="#" className="text-[#C8956C] underline hover:text-[#A67B5B]">Datenschutzerklärung</a> *
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Footer with Button - Fixed at bottom */}
        <div className="p-4 sm:p-6 pt-2 sm:pt-4 border-t border-gray-100 flex-shrink-0">
          <button
            type="submit"
            disabled={isLoading}
            onClick={handleSubmit}
            className="w-full px-4 py-3 bg-gradient-to-r from-[#C8956C] to-[#A67B5B] text-white rounded-lg hover:from-[#A67B5B] hover:to-[#8B6B4B] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Wird registriert...' : 'Kostenlos registrieren'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
