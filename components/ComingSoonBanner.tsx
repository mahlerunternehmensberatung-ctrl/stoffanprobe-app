import React from 'react';
import { useNavigate } from 'react-router-dom';

const ComingSoonBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-gradient-to-r from-[#F8F4E3] to-[#FAF1DC] border-t border-b border-[#E6C785]/30 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="inline-block text-[10px] sm:text-xs font-bold text-[#C8956C] bg-[#C8956C]/10 px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            Coming Soon
          </span>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[#532418]">
            Die Zukunft der Raumgestaltung
          </h3>
          <p className="text-sm text-[#C8956C] italic mt-2">
            Du siehst es. Du fühlst es.
          </p>
        </div>

        {/* Two Product Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
          {/* Stoffberater Pro */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-[#E6C785]/20">
            <p className="text-xs text-[#67534F] mb-1">Für Raumausstatter</p>
            <h4 className="text-base sm:text-lg font-bold text-[#532418] mb-2">
              Ihr personalisierter Berater
            </h4>
            <p className="text-xs sm:text-sm text-[#67534F] mb-3">
              Echtzeit-Beratung direkt im Kundenraum
            </p>
          </div>

          {/* Innenarchitektin Pro */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-[#E6C785]/20">
            <p className="text-xs text-[#67534F] mb-1">Für Interior Designer</p>
            <h4 className="text-base sm:text-lg font-bold text-[#532418] mb-2">
              Ihre personalisierte Innenarchitektin
            </h4>
            <p className="text-xs sm:text-sm text-[#67534F] mb-3">
              Technische Zeichnungen aus Fotos
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/stoffberater-pro')}
            className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white bg-gradient-to-br from-[#E6C785] via-[#CDA35E] to-[#B08642] rounded-lg hover:opacity-90 transition-all shadow-md hover:shadow-lg"
          >
            Ich will dabei sein
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonBanner;
