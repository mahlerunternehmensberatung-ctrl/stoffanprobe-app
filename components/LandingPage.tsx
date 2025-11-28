import React from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-[#FAF1DC] flex flex-col items-center justify-center px-3 py-4 sm:px-4 sm:py-8">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-[#532418] mb-1 sm:mb-4">
          stoffanprobe.de
        </h1>
        <p className="text-sm sm:text-xl text-[#67534F] mb-3 sm:mb-6">
          Professionelle Visualisierungen für Raumausstatter, Polsterer und Handwerker
        </p>

        <div className="bg-[#FFFFF5] rounded-lg shadow-xl p-4 sm:p-8 mb-3 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-[#532418] mb-1 sm:mb-3">
            10 Gratis-Entwürfe sichern
          </h2>
          <p className="text-sm sm:text-lg text-[#67534F] mb-2 sm:mb-4">
            Testen Sie unsere professionelle Visualisierung kostenlos
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-4 mb-3 sm:mb-4">
            <p className="text-green-800 font-semibold text-sm sm:text-base">
              ✓ 0,00 € heute fällig · Bilder bleiben auf Ihrem Gerät
            </p>
          </div>
          <div className="flex gap-2 sm:gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="px-4 sm:px-8 py-2 sm:py-3 bg-[#C8956C] text-white rounded-lg hover:bg-[#A67B5B] transition-colors font-bold text-sm sm:text-lg shadow-lg"
            >
              Jetzt starten
            </button>
            {onLogin && (
              <button
                onClick={onLogin}
                className="px-4 sm:px-8 py-2 sm:py-3 bg-white text-[#C8956C] border-2 border-[#C8956C] rounded-lg hover:bg-[#C8956C] hover:text-white transition-colors font-bold text-sm sm:text-lg shadow-lg"
              >
                Anmelden
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 mt-2 sm:mt-6">
          <div className="flex items-center justify-center gap-2 bg-[#FFFFF5] rounded-full px-3 py-1.5 sm:px-4 sm:py-2 shadow-sm">
            <span className="text-[#C8956C] text-sm">⚡</span>
            <span className="text-xs sm:text-sm text-[#532418] font-medium">Schnell & Einfach</span>
          </div>
          <div className="flex items-center justify-center gap-2 bg-[#FFFFF5] rounded-full px-3 py-1.5 sm:px-4 sm:py-2 shadow-sm">
            <span className="text-[#C8956C] text-sm">✨</span>
            <span className="text-xs sm:text-sm text-[#532418] font-medium">Automatische Visualisierung</span>
          </div>
          <div className="flex items-center justify-center gap-2 bg-[#FFFFF5] rounded-full px-3 py-1.5 sm:px-4 sm:py-2 shadow-sm">
            <span className="text-[#C8956C] text-sm">🔒</span>
            <span className="text-xs sm:text-sm text-[#532418] font-medium">DSGVO-konform</span>
          </div>
        </div>

        <p className="text-[10px] sm:text-xs text-[#67534F] mt-3 sm:mt-6 opacity-60">
          Hinweis: Visualisierungen dienen der Veranschaulichung. Farben und Proportionen können vom Endergebnis abweichen.
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
