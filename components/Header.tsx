import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlusIcon, UserIcon } from './Icon';
import { glassHeaderButton } from '../glass';
import { User } from '../types';

interface HeaderProps {
    onNewSession: () => void;
    onShowSessions: () => void;
    onSaveSession: () => void;
    hasSession: boolean;
    user?: User | null;
    onLogout?: () => void;
    onLogin?: () => void;
    onShowPaywall?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onNewSession, 
  onShowSessions, 
  onSaveSession, 
  hasSession,
  user,
  onLogout,
  onLogin,
  onShowPaywall
}) => {
  const navigate = useNavigate();
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Berechne verfügbare Credits
  const getTotalCredits = () => {
    if (user?.plan === 'pro') return '∞';
    
    const now = new Date();
    let purchasedCredits = user?.purchasedCredits ?? 0;
    if (user?.purchasedCreditsExpiry && user.purchasedCreditsExpiry < now) {
      purchasedCredits = 0;
    }
    
    const monthlyCredits = user?.monthlyCredits ?? 0;
    return monthlyCredits + purchasedCredits;
  };
  
  const displayCredits = getTotalCredits();

  // Schließe Dropdown wenn außerhalb geklickt wird
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAccountDropdown(false);
      }
    };

    if (showAccountDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountDropdown]);

  // Initialen aus E-Mail oder Name extrahieren
  const getInitials = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    if (user?.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleAccountClick = () => {
    setShowAccountDropdown(!showAccountDropdown);
  };

  const handleMenuItemClick = (action: () => void) => {
    setShowAccountDropdown(false);
    action();
  };

  return (
    <header className="bg-[#FAF1DC]/90 backdrop-blur-md sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 min-h-[3.5rem]">
          <div className="flex items-center flex-shrink-0">
             <span className="font-bold text-lg sm:text-xl lg:text-2xl text-[#532418]">stoffanprobe.de</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
                    <span className="text-xs sm:text-sm text-[#67534F]">
                      {user.plan === 'pro' ? (
                        <span className="font-bold text-[#532418]">Unbegrenzt</span>
                      ) : (
                        <>
                          <span className="hidden sm:inline">Noch </span>
                          <span className="font-bold text-[#532418]">{displayCredits}</span>
                          <span className="hidden sm:inline"> Bilder (Gratis)</span>
                          <span className="sm:hidden"> Gratis</span>
                        </>
                      )}
                    </span>
                  </div>
                  {user.plan === 'pro' && (
                    <span className="text-xs bg-[#FF954F] text-white px-2 py-1 rounded font-semibold">
                      PRO
                    </span>
                  )}
                </div>
                {/* Account Icon mit Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={handleAccountClick}
                    className="w-10 h-10 rounded-full bg-[#FF954F] text-white flex items-center justify-center hover:bg-[#CC5200] transition-colors shadow-sm"
                    aria-label="Account-Menü"
                  >
                    <span className="text-sm font-semibold">{getInitials()}</span>
                  </button>
                  {showAccountDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        onClick={() => handleMenuItemClick(() => navigate('/account'))}
                        className="w-full text-left px-4 py-2 text-sm text-[#67534F] hover:bg-gray-100 transition-colors"
                      >
                        Mein Konto
                      </button>
                      <button
                        onClick={() => handleMenuItemClick(() => navigate('/pricing'))}
                        className="w-full text-left px-4 py-2 text-sm text-[#67534F] hover:bg-gray-100 transition-colors"
                      >
                        Credits kaufen
                      </button>
                      {onLogout && (
                        <button
                          onClick={() => handleMenuItemClick(onLogout)}
                          className="w-full text-left px-4 py-2 text-sm text-[#67534F] hover:bg-gray-100 transition-colors border-t border-gray-200 mt-1 whitespace-nowrap"
                        >
                          Abmelden
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Ausgeloggt: Anmelden-Button
              onLogin && (
                <button
                  onClick={onLogin}
                  className="px-4 py-2 text-sm sm:text-base font-medium text-white bg-[#FF954F] rounded-md hover:bg-[#CC5200] transition-colors shadow-sm"
                >
                  Anmelden
                </button>
              )
            )}
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
      </div>
    </header>
  );
};

export default Header;