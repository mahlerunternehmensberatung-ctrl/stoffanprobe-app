import React from 'react';
import { useTranslation } from 'react-i18next';
import { RALColor } from '../types';

interface ExampleRoomsProps {
  onSelect: (imageUrl: string) => void;
  onSelectWallColor: (color: RALColor) => void;
}

const ExampleRooms: React.FC<ExampleRoomsProps> = ({ onSelect, onSelectWallColor }) => {
  const { t } = useTranslation();

  // Jetzt nutzen wir deine lokalen Bilder aus dem public/examples Ordner
  // Das ist viel schneller und sicherer als externe Links
  const rooms = [
    {
      id: 'living',
      nameKey: 'rooms.livingRoom',
      image: '/examples/wohnzimmer.jpg',
    },
    {
      id: 'bedroom',
      nameKey: 'rooms.bedroom',
      image: '/examples/schlafzimmer.jpg',
    },
    {
      id: 'dining',
      nameKey: 'rooms.diningRoom',
      image: '/examples/esszimmer.jpg',
    },
  ];

  // Gemeinsame Klassen für den goldenen Look
  const cardBaseClasses = "group relative flex flex-col items-center text-left rounded-xl sm:rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden";
  const goldBorderClasses = "border border-[#E6C785]/50 hover:border-[#CDA35E]";

  return (
    <div className="w-full max-w-4xl mx-auto mb-3 sm:mb-12 animate-fade-in">
      <div className="text-center mb-2 sm:mb-6">
        <h3 className="text-xs sm:text-lg font-semibold text-[#532418]">{t('rooms.startWithExample')}</h3>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:gap-4">
        {/* Die 3 Fotokarten */}
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelect(room.image)}
            className={`${cardBaseClasses} ${goldBorderClasses} bg-[#FDFBF7]`}
          >
            <div className="w-full h-14 sm:h-32 overflow-hidden relative">
              <img
                src={room.image}
                alt={t(room.nameKey)}
                loading="lazy"
                width={600}
                height={400}
                className="w-full h-full object-cover"
                onError={(e) => {
                    console.error(`Bild nicht gefunden: ${room.image}`);
                    e.currentTarget.style.opacity = '0.5';
                }}
              />
            </div>

            <div className="p-1 sm:p-3 w-full bg-white relative z-10">
              <span className="block text-[10px] sm:text-sm font-medium text-[#532418] text-center truncate">
                {t(room.nameKey)}
              </span>
            </div>
          </button>
        ))}

        {/* Der RAL-Farben Button - Gold Design */}
        <button
          onClick={() => onSelectWallColor({ code: 'RAL 9010', name: 'Reinweiß', hex: '#FFFFFF' })}
          className={`${cardBaseClasses} ${goldBorderClasses} bg-gradient-to-br from-[#FDFBF7] to-[#F8F4E3]`}
        >
          <div className="w-full h-14 sm:h-32 flex flex-col items-center justify-center p-1 sm:p-4 relative overflow-hidden bg-gradient-to-br from-[#FDFBF7] to-[#F8F4E3]">
             <div className="w-8 h-8 sm:w-14 sm:h-14 grid grid-cols-2 rounded overflow-hidden shadow-sm relative z-10">
                <div className="bg-white"></div>
                <div className="bg-[#FFD700]"></div>
                <div className="bg-[#0f4c81]"></div>
                <div className="bg-[#4b5320]"></div>
             </div>
          </div>

          <div className="p-1 sm:p-3 w-full bg-white text-center relative z-10">
            <span className="block text-[10px] sm:text-sm font-medium text-[#532418] truncate">
              {t('rooms.wallColor')}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ExampleRooms;