import React from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-[#FAF1DC] flex flex-col items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#532418] mb-6">
          stoffanprobe.de
        </h1>
        <p className="text-xl sm:text-2xl text-[#67534F] mb-8">
          Professionelle Visualisierungen für Raumausstatter, Polsterer und Handwerker
        </p>
        
        <div className="bg-[#FFFFF5] rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-[#532418] mb-4">
            10 Gratis-Entwürfe sichern
          </h2>
          <p className="text-lg text-[#67534F] mb-6">
            Testen Sie unsere KI-gestützte Visualisierung kostenlos
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-semibold">
              ✓ 0,00 € heute fällig
            </p>
            <p className="text-sm text-green-700 mt-1">
              Ihre Daten werden sicher in unserem Datentresor gespeichert (DSGVO-konform)
            </p>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-[#FF954F] text-white rounded-lg hover:bg-[#CC5200] transition-colors font-bold text-lg shadow-lg"
            >
              Jetzt starten
            </button>
            {onLogin && (
              <button
                onClick={onLogin}
                className="px-8 py-4 bg-white text-[#FF954F] border-2 border-[#FF954F] rounded-lg hover:bg-[#FF954F] hover:text-white transition-colors font-bold text-lg shadow-lg"
              >
                Anmelden
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-[#FFFFF5] rounded-lg p-6 shadow-md">
            <h3 className="font-bold text-[#532418] mb-2">Schnell & Einfach</h3>
            <p className="text-sm text-[#67534F]">
              Laden Sie Ihr Raumfoto hoch und erhalten Sie in Sekunden professionelle Visualisierungen
            </p>
          </div>
          <div className="bg-[#FFFFF5] rounded-lg p-6 shadow-md">
            <h3 className="font-bold text-[#532418] mb-2">KI-gestützt</h3>
            <p className="text-sm text-[#67534F]">
              Moderne KI-Technologie für realistische und überzeugende Ergebnisse
            </p>
          </div>
          <div className="bg-[#FFFFF5] rounded-lg p-6 shadow-md">
            <h3 className="font-bold text-[#532418] mb-2">DSGVO-konform</h3>
            <p className="text-sm text-[#67534F]">
              Ihre Daten werden sicher gespeichert und geschützt
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

