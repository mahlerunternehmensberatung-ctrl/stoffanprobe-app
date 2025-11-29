import React from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-[#FAF1DC] flex flex-col items-center justify-center px-4 py-4 sm:px-6 sm:py-8 overflow-x-hidden w-full max-w-full box-border">
      <div className="max-w-4xl w-full text-center box-border px-0">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-4">
          <img src="/logo.png" alt="Stoffanprobe Logo" className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0" />
          <h1 className="text-xl sm:text-4xl lg:text-5xl font-bold text-[#532418]">
            Stoffanprobe
          </h1>
        </div>
        <p className="text-xs sm:text-xl text-[#67534F] mb-3 sm:mb-6 px-2">
          Professionelle Visualisierungen für Raumausstatter, Polsterer und Handwerker
        </p>

        <div className="bg-[#FFFFF5] rounded-lg shadow-xl p-4 sm:p-8 mb-3 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-[#532418] mb-1 sm:mb-3">
            10 Gratis-Entwürfe sichern
          </h2>
          <p className="text-sm sm:text-lg text-[#67534F] mb-3 sm:mb-4">
            Testen Sie unsere professionelle Visualisierung kostenlos
          </p>

          {/* Demo Video */}
          <div className="flex justify-center mb-3 sm:mb-5">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-48 sm:w-64 rounded-xl shadow-lg border-2 border-[#C8956C]/20"
            >
              <source src="/videos/demo.mp4" type="video/mp4" />
            </video>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-4 mb-3 sm:mb-4">
            <p className="text-green-800 font-semibold text-sm sm:text-base">
              ✓ 0,00 € heute fällig · Bilder bleiben auf Ihrem Gerät
            </p>
          </div>
          <div className="flex gap-2 sm:gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="px-4 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-[#C8956C] to-[#A67B5B] text-white rounded-lg hover:from-[#A67B5B] hover:to-[#8B6B4B] transition-all font-bold text-sm sm:text-lg shadow-lg"
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

        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-4 mt-2 sm:mt-6">
          <div className="flex items-center justify-center gap-1.5 bg-[#FFFFF5] rounded-full px-2.5 py-1 sm:px-4 sm:py-2 shadow-sm">
            <span className="text-[#C8956C] text-xs sm:text-sm">⚡</span>
            <span className="text-[10px] sm:text-sm text-[#532418] font-medium whitespace-nowrap">Schnell & Einfach</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 bg-[#FFFFF5] rounded-full px-2.5 py-1 sm:px-4 sm:py-2 shadow-sm">
            <span className="text-[#C8956C] text-xs sm:text-sm">✨</span>
            <span className="text-[10px] sm:text-sm text-[#532418] font-medium whitespace-nowrap">Auto-Visualisierung</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 bg-[#FFFFF5] rounded-full px-2.5 py-1 sm:px-4 sm:py-2 shadow-sm">
            <span className="text-[#C8956C] text-xs sm:text-sm">🔒</span>
            <span className="text-[10px] sm:text-sm text-[#532418] font-medium whitespace-nowrap">DSGVO-konform</span>
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
