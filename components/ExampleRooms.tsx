import React from 'react';
import { RALColor } from '../types';

interface ExampleRoomsProps {
  onSelect: (imageUrl: string) => void;
  onSelectWallColor: (color: RALColor) => void;
}

const ExampleRooms: React.FC<ExampleRoomsProps> = ({ onSelect, onSelectWallColor }) => {
  
  // Jetzt nutzen wir deine lokalen Bilder aus dem public/examples Ordner
  // Das ist viel schneller und sicherer als externe Links
  const rooms = [
    {
      id: 'living',
      name: 'Wohnzimmer',
      image: '/examples/wohnzimmer.jpg', 
    },
    {
      id: 'bedroom',
      name: 'Schlafzimmer',
      image: '/examples/schlafzimmer.jpg',
    },
    {
      id: 'dining',
      name: 'Esszimmer',
      image: '/examples/esszimmer.jpg',
    },
  ];

  // Gemeinsame Klassen für den goldenen Look
  const cardBaseClasses = "group relative flex flex-col items-center text-left rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden";
  const goldBorderClasses = "border-2 border-[#E6C785]/50 hover:border-[#CDA35E]";

  return (
    <div className="w-full max-w-6xl mx-auto mb-4 sm:mb-12 animate-fade-in">
      <div className="text-center mb-3 sm:mb-6">
        <h3 className="text-sm sm:text-lg font-semibold text-[#532418]">Oder mit einem Beispiel starten:</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-6">
        {/* Die 3 Fotokarten */}
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelect(room.image)}
            className={`${cardBaseClasses} ${goldBorderClasses} bg-[#FDFBF7]`}
          >
            <div className="w-full h-20 sm:h-40 overflow-hidden relative">
              <img
                src={room.image}
                alt={room.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => {
                    // Fallback, falls ein Bildname doch mal nicht stimmt
                    console.error(`Bild nicht gefunden: ${room.image}`);
                    e.currentTarget.style.opacity = '0.5';
                }}
              />
              {/* Subtiler Gold-Schimmer beim Hovern */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#B08642]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="p-2 sm:p-4 w-full bg-white relative z-10">
              <span className="block text-xs sm:text-base font-semibold text-[#532418] group-hover:text-[#B08642] transition-colors text-center">
                {room.name}
              </span>
            </div>
          </button>
        ))}

        {/* Der RAL-Farben Button - Gold Design */}
        <button
          onClick={() => onSelectWallColor({ code: 'RAL 9010', name: 'Reinweiß', hex: '#FFFFFF' })}
          className={`${cardBaseClasses} ${goldBorderClasses} bg-gradient-to-br from-[#FDFBF7] to-[#F8F4E3]`}
        >
          <div className="w-full h-20 sm:h-40 flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden">
             <div className="absolute inset-0 bg-[#E6C785]/10 group-hover:bg-[#E6C785]/20 transition-colors duration-300"></div>

             <div className="w-10 h-10 sm:w-20 sm:h-20 grid grid-cols-2 rounded-lg overflow-hidden shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 relative z-10 ring-1 ring-white/50">
                <div className="bg-white"></div>
                <div className="bg-[#FFD700]"></div>
                <div className="bg-[#0f4c81]"></div>
                <div className="bg-[#4b5320]"></div>
             </div>
          </div>

          <div className="p-2 sm:p-4 w-full bg-white text-center relative z-10 border-t border-[#E6C785]/20">
            <span className="block text-xs sm:text-base font-semibold text-[#532418] group-hover:text-[#B08642] transition-colors">
              Wandfarbe (RAL)
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ExampleRooms;