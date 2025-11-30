import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserPlusIcon } from './Icon';
import { glassHeaderButton } from '../glass';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../services/adminService';

// Das korrekte Logout-Icon
const LogoutIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
  </svg>
);

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
  const { t } = useTranslation();
  const { logout } = useAuth();
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Gold-Verlauf für Buttons/Badges (angepasst an das Logo)
  // Ein edler Verlauf von hellem Gold zu etwas dunklerem Bronze
  const goldGradient = "bg-gradient-to-br from-[#E6C785] via-[#CDA35E] to-[#B08642]";
  const goldText = "text-[#B08642]";

  // Berechne verfügbare Credits
  const getTotalCredits = () => {
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

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await logout();
      navigate('/');
    }
  };

  return (
    <header className="bg-[#FAF1DC]/90 backdrop-blur-md sticky top-0 z-40 shadow-sm w-full">
      <div className="w-full px-2 pr-3 sm:px-4 lg:px-8 box-border">
        <div className="flex items-center justify-between h-14 sm:h-16 min-h-[3.5rem] gap-1 sm:gap-2">
          {/* LOGO BEREICH - Text auf Mobile ausblenden */}
          <div className="flex items-center flex-shrink-0 cursor-pointer min-w-0" onClick={() => navigate('/')}>
             <img src="/logo.png" alt={t('common.appName')} className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 object-contain drop-shadow-sm" />
             <span className="hidden sm:block font-bold text-xl lg:text-2xl text-[#532418] tracking-tight ml-2">{t('common.appName')}</span>
             <span className="ml-1.5 sm:ml-2 text-[9px] sm:text-[10px] font-semibold text-gray-500 bg-gray-200/80 px-1.5 py-0.5 rounded tracking-wide uppercase">
               BETA
             </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0 mr-2 sm:mr-0">
            {user ? (
              <>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Credits-Anzeige - kompakter auf Mobile */}
                  <div className="bg-white/80 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-sm flex items-center gap-1 border border-[#E6C785]/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${goldText}`} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span className="text-xs sm:text-sm font-bold text-[#532418]">{displayCredits}</span>
                  </div>
                  {user.plan === 'pro' && (
                    <span className={`text-[10px] sm:text-xs ${goldGradient} text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-semibold shadow-sm tracking-wide border border-white/20`}>
                      {t('header.proBadge')}
                    </span>
                  )}
                </div>

                {/* Account Avatar mit Dropdown-Menü */}
                <div className="relative flex-shrink-0 z-50" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={handleAccountClick}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${goldGradient} text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-md border-2 border-white flex-shrink-0 cursor-pointer pointer-events-auto`}
                    aria-label={t('header.accountMenu')}
                    aria-expanded={showAccountDropdown}
                  >
                    <span className="text-sm font-bold">{getInitials()}</span>
                  </button>

                  {showAccountDropdown && (
                    <div className="absolute right-0 mt-2 min-w-[180px] bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 overflow-hidden animate-fade-in-up">
                      <button
                        onClick={() => handleMenuItemClick(() => navigate('/account'))}
                        className="w-full text-left px-4 py-2.5 text-sm text-[#67534F] hover:bg-yellow-50 transition-colors whitespace-nowrap flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        {t('header.myAccount')}
                      </button>
                      <button
                        onClick={() => handleMenuItemClick(() => navigate('/pricing'))}
                        className="w-full text-left px-4 py-2.5 text-sm text-[#67534F] hover:bg-yellow-50 transition-colors whitespace-nowrap flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t('header.buyCredits')}
                      </button>
                      {isAdmin(user?.email) && (
                        <button
                          onClick={() => handleMenuItemClick(() => navigate('/admin'))}
                          className="w-full text-left px-4 py-2.5 text-sm text-[#532418] hover:bg-yellow-50 transition-colors whitespace-nowrap flex items-center gap-2 font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                          </svg>
                          Admin Dashboard
                        </button>
                      )}
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => handleMenuItemClick(handleLogout)}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap flex items-center gap-2"
                      >
                        <LogoutIcon className="w-4 h-4" />
                        {t('header.logout')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Ausgeloggt: Anmelden-Button mit Gold-Verlauf
              onLogin && (
                <button
                  onClick={onLogin}
                  className={`px-5 py-2 text-sm sm:text-base font-bold text-white ${goldGradient} rounded-full hover:opacity-90 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
                >
                  {t('auth.login')}
                </button>
              )
            )}

            {/* Session Buttons - leicht angepasst für Harmonie */}
            {hasSession && (
              <div className="flex items-center flex-wrap gap-1 sm:gap-2 justify-end">
                 <button onClick={onSaveSession} className={`${glassHeaderButton} flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 hover:border-[#CDA35E]/50`}>
                     <UserPlusIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#B08642]" /> <span>{t('header.saveSession')}</span>
                 </button>
                 <button onClick={onShowSessions} className={`${glassHeaderButton} text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 hover:border-[#CDA35E]/50`}>
                     <span>{t('header.continueSession')}</span>
                 </button>
                 <button
                    onClick={onNewSession}
                    className={`px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white ${goldGradient} rounded-md hover:opacity-90 transition-all shadow-sm`}>
                     <span className="hidden sm:inline">{t('header.newSession')}</span><span className="sm:hidden">{t('header.newSessionShort')}</span>
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
