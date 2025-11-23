import React from 'react';
import { UserPlusIcon } from './Icon';
import { glassHeaderButton } from '../glass';

interface HeaderProps {
    onNewSession: () => void;
    onShowSessions: () => void;
    onSaveSession: () => void;
    hasSession: boolean;
}

const Header: React.FC<HeaderProps> = ({ onNewSession, onShowSessions, onSaveSession, hasSession }) => {
  return (
    <header className="bg-[#FAF1DC]/90 backdrop-blur-md sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 min-h-[3.5rem]">
          <div className="flex items-center flex-shrink-0">
             <span className="font-bold text-lg sm:text-xl lg:text-2xl text-[#532418]">stoffanprobe.de</span>
          </div>
          {hasSession && (
              <div className="flex items-center flex-wrap gap-1 sm:gap-2 justify-end">
                 <button onClick={onSaveSession} className={`${glassHeaderButton} flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2`}>
                     <UserPlusIcon className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Kundendaten speichern</span><span className="sm:hidden">Speichern</span>
                 </button>
                 <button onClick={onShowSessions} className={`${glassHeaderButton} text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2`}>
                     <span className="hidden sm:inline">Sitzung fortsetzen</span><span className="sm:hidden">Fortsetzen</span>
                 </button>
                 <button 
                    onClick={onNewSession}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-[#FF954F] rounded-md hover:bg-[#CC5200] transition-colors">
                     <span className="hidden sm:inline">Neue Sitzung</span><span className="sm:hidden">Neu</span>
                 </button>
              </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;