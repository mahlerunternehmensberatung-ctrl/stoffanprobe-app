import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Session, Variant, PresetType, CustomerData, ConsentData, RALColor, VisualizationMode, ImageType } from '../types';
import { saveSession } from '../services/dbService';
import { generateVisualization } from '../services/aiService';
import { getCurrentUser } from '../services/authService';
import { dismissHomeConsent, markHomeInfoShown } from '../services/userService';
import { incrementImagesGenerated } from '../services/feedbackService';
import ImageUploader from './ImageUploader';
import Gallery from './Gallery';
import PresetButtons from './PresetButtons';
import LoadingOverlay from './LoadingOverlay';
import { SaveIcon, DiscardIcon, NextIcon, PencilIcon } from './Icon';
import ConsentModal from './ConsentModal';
import ImageTypeSelectionModal from './ImageTypeSelectionModal';
import PrivateConsentModal from './PrivateConsentModal';
import HomeInfoModal from './HomeInfoModal';
import FeedbackModal from './FeedbackModal';
import ExampleRooms from './ExampleRooms';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';
import VariantCard from './VariantCard';
import { glassBase, glassButton } from '../glass';
import SpeechButton from './SpeechButton';
import { useLiveTranscription } from '../hooks/useLiveTranscription';
import PrivacyNotice from './PrivacyNotice';
import CustomerDataBanner from './CustomerDataBanner';
import { useFeedbackTrigger } from '../hooks/useFeedbackTrigger';

interface WorkspaceProps {
  session: Session | null;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  updateSession: (updater: (prev: Session) => Session) => void;
  setModalVariant: (variant: Variant | null) => void;
  setError: (error: string | null) => void;
  isSpeechRecognitionSupported: boolean;
  fetchSessions: (query?: string) => void;
  onShowSessions: () => void;
  onCreateSession: (params?: { wallColor?: RALColor; originalImage?: string; patternImage?: string; consentData?: any; customerData?: any; imageType?: ImageType }) => Session;
  onSelectWallColor: () => void;
  user?: import('../types').User | null;
  onShowPaywall?: () => void;
  onDecrementCredits?: () => Promise<void>;
  onImageGenerated?: () => void;
  onShowLogin?: () => void;
  onRefreshUser?: () => void;
  hasSavedSessions?: boolean;
}

const Workspace: React.FC<WorkspaceProps> = ({
  session,
  setSession,
  updateSession,
  setModalVariant,
  setError,
  isSpeechRecognitionSupported,
  fetchSessions,
  onShowSessions,
  onCreateSession,
  onSelectWallColor,
  user,
  onShowPaywall,
  onDecrementCredits,
  onImageGenerated,
  onShowLogin,
  onRefreshUser,
  hasSavedSessions
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetType | null>(null);
  const [textHint, setTextHint] = useState('');
  const [pendingVariant, setPendingVariant] = useState<Variant | null>(null);
  const [showNextStep, setShowNextStep] = useState<boolean>(false);
  const [consentState, setConsentState] = useState<{ isOpen: boolean; tempImageDataUrl: string | null }>({ isOpen: false, tempImageDataUrl: null });
  const [showImageTypeSelection, setShowImageTypeSelection] = useState<boolean>(false);
  const [showPrivateConsent, setShowPrivateConsent] = useState<boolean>(false);
  const [showHomeInfo, setShowHomeInfo] = useState<boolean>(false);
  const [tempImageDataUrl, setTempImageDataUrl] = useState<string | null>(null);
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode | null>(null);
  // Privacy Mode: Speichere Storage-Pfade für temporäre Bilder
  const [tempImagePaths, setTempImagePaths] = useState<{ room?: string; pattern?: string }>({});

  // Home-Abo: Prüfe ob Info-Hinweis angezeigt werden soll
  const isHomeUser = user?.plan === 'home';
  const isProUser = user?.plan === 'pro';

  // Feedback-System Hook
  const {
    showFeedbackModal,
    triggerFeedbackCheck,
    handleFeedbackSubmit,
    handleRemindLater,
    handleDecline: handleFeedbackDecline,
    closeFeedbackModal,
  } = useFeedbackTrigger(user, onRefreshUser);

  // Zeige Home-Info-Hinweis beim ersten Mal für Home-User
  useEffect(() => {
    if (isHomeUser && user && !user.homeInfoShown) {
      setShowHomeInfo(true);
    }
  }, [isHomeUser, user]);

  const handleTranscript = useCallback((text: string) => {
      // Append text with space if there's existing text
      setTextHint(prev => {
        if (prev.trim() && text.trim()) {
          return prev + text;
        }
        return prev + text;
      });
  }, []);

  const handleSpeechError = useCallback((err: string) => {
      setError(err);
  }, [setError]);

  const { isListening, start: startSpeechToText, stop: stopSpeechToText } = useLiveTranscription({
      onTranscript: handleTranscript,
      onError: handleSpeechError
  });

  useEffect(() => {
    if (session?.wallColor) {
        setVisualizationMode('creativeWallColor');
    }
  }, [session?.wallColor]);

  // Auto-dismiss success toast after 3 seconds
  useEffect(() => {
    if (showNextStep) {
      const timer = setTimeout(() => {
        setShowNextStep(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showNextStep]);

  const handleRoomImageUpload = (imageDataUrl: string, consentData?: ConsentData, customerData?: CustomerData, imageType?: ImageType) => {
    setShowNextStep(false);
    setTextHint(''); // Hinweisfeld zurücksetzen
    // Privacy Mode: Session nur im State, NICHT automatisch speichern
    setSession(prev => {
      if (prev) {
        return { 
            ...prev, 
            originalImage: imageDataUrl, 
            consentData: consentData || prev.consentData,
            customerData: customerData || prev.customerData,
            imageType: imageType || prev.imageType,
         };
      }
      return onCreateSession({ originalImage: imageDataUrl, consentData, customerData, imageType });
    });
  };

  const handleRoomImageSelect = (imageDataUrl: string) => {
    if (!imageDataUrl) {
      if(session) setSession(prev => prev ? {...prev, originalImage: ''} : null);
      setTextHint(""); // Reset
      return;
    }

    // Home-User: Immer "private" - kein Bildtyp-Dialog
    if (isHomeUser) {
      // Prüfe ob Consent bereits dauerhaft bestätigt wurde
      if (user?.homeConsentDismissed) {
        // Direkt hochladen ohne Dialog
        const autoConsent: ConsentData = {
          accepted: true,
          signature: null,
          timestamp: new Date(),
        };
        handleRoomImageUpload(imageDataUrl, autoConsent, undefined, 'private');
      } else {
        // Zeige Consent-Dialog mit "Nicht mehr anzeigen" Option
        setTempImageDataUrl(imageDataUrl);
        setShowPrivateConsent(true);
      }
      return;
    }

    // Pro-User: Normale Logik mit Bildtyp-Auswahl
    // Wenn imageType bereits in der Session gesetzt ist, verwende es direkt
    if (session?.imageType) {
      if (session.imageType === 'private') {
        setTempImageDataUrl(imageDataUrl);
        setShowPrivateConsent(true);
      } else {
        setConsentState({ isOpen: true, tempImageDataUrl: imageDataUrl });
      }
    } else {
      // Zeige Auswahl-Modal
      setTempImageDataUrl(imageDataUrl);
      setShowImageTypeSelection(true);
    }
  };

  const handleImageTypeSelect = (imageType: ImageType) => {
    setShowImageTypeSelection(false);
    // Speichere imageType in der Session
    if (session) {
      updateSession(prev => ({ ...prev, imageType }));
    } else {
      // Wenn keine Session existiert, erstelle eine mit imageType
      const newSession = onCreateSession({ imageType });
      setSession(newSession);
    }
    
    // Zeige entsprechendes Consent-Modal
    if (imageType === 'private') {
      setShowPrivateConsent(true);
    } else {
      setConsentState({ isOpen: true, tempImageDataUrl: tempImageDataUrl });
    }
  };

  const handlePrivateConsentConfirm = async (consentData: ConsentData, dontShowAgain?: boolean) => {
    setShowPrivateConsent(false);

    // Wenn Home-User "Nicht mehr anzeigen" gewählt hat, speichere das
    if (isHomeUser && dontShowAgain && user) {
      try {
        await dismissHomeConsent(user.uid);
        if (onRefreshUser) onRefreshUser();
      } catch (err) {
        console.error('Error saving home consent preference:', err);
      }
    }

    if (tempImageDataUrl) {
      handleRoomImageUpload(tempImageDataUrl, consentData, undefined, 'private');
      setTempImageDataUrl(null);
    }
  };
  
  const handleConsentConfirm = (consentData: ConsentData, customerData: CustomerData) => {
    setConsentState({ isOpen: false, tempImageDataUrl: null });
    if (consentState.tempImageDataUrl) {
        handleRoomImageUpload(consentState.tempImageDataUrl, consentData, customerData, 'commercial');
    }
  };
  
  const handleExampleRoomSelect = (imageDataUrl: string) => {
    handleRoomImageUpload(imageDataUrl);
  };

  const handlePatternImageUpload = (imageDataUrl: string) => {
    setShowNextStep(false);
    setVisualizationMode('pattern');
    setSelectedPreset(null);
    setTextHint(""); // Auch hier löschen
    // Privacy Mode: Session nur im State, NICHT automatisch speichern
    if(session) {
      setSession(prev => prev ? {...prev, wallColor: undefined} : null);
    }
    
    if (!imageDataUrl && session) {
      setSession(prev => prev ? {...prev, patternImage: ''} : null);
      return;
    }
    if (session) {
      setSession(prev => prev ? {...prev, patternImage: imageDataUrl} : null);
    } else {
      setSession(onCreateSession({ patternImage: imageDataUrl }));
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!session) return;

    if (!session.originalImage) {
      setError(t('errors.uploadRoomImage'));
      return;
    }

    if (!visualizationMode) {
      setError(t('errors.selectArea'));
      return;
    }

    if (visualizationMode === "pattern" && (!session.patternImage || !selectedPreset)) {
      setError(t('errors.patternAndArea'));
      return;
    }

    // Credit-Check: Prüfe ob User Credits hat (gleiche Berechnung wie im Header)
    if (user) {
      // Berechne verfügbare Credits (monthlyCredits + purchasedCredits, abgelaufene berücksichtigen)
        const now = new Date();
        let purchasedCredits = user.purchasedCredits ?? 0;
        if (user.purchasedCreditsExpiry && user.purchasedCreditsExpiry < now) {
          purchasedCredits = 0;
        }
        const monthlyCredits = user.monthlyCredits ?? 0;
        const totalCredits = monthlyCredits + purchasedCredits;
        
        if (totalCredits <= 0) {
          // Zeige Paywall-Modal
          if (onShowPaywall) {
            onShowPaywall();
          } else {
            setError(t('errors.noCredits'));
          }
          return;
        }
    }
    
    setIsLoading(true);
    setError(null);
    setPendingVariant(null);
    setShowNextStep(false);

    try {
        // Prüfe ob User angemeldet ist
        const firebaseUser = getCurrentUser();
        if (!firebaseUser) {
          // Fallback, sollte eigentlich durch UI abgefangen sein
          throw new Error('Nicht angemeldet');
        }

        // Generiere Bild direkt mit Base64 Data URLs (KEIN Firebase Storage)
        const newVariantImage = await generateVisualization({
            roomImage: session.originalImage, // Base64 Data URL direkt verwenden
            mode: visualizationMode,
            patternImage: session.patternImage, // Base64 Data URL direkt verwenden
            preset: selectedPreset,
            wallColor: session.wallColor,
            textHint: textHint
        });
        
        // Nur wenn Generierung erfolgreich war: Credit-Abzug
        // WICHTIG: Credit-Abzug NUR wenn Bild erfolgreich generiert wurde
        // Credits werden für ALLE User abgezogen (Free und Pro)
        if (user && onDecrementCredits) {
          try {
            await onDecrementCredits();
          } catch (creditError) {
            // Wenn Credit-Abzug fehlschlägt, werfe Fehler weiter
            // Das generierte Bild wird nicht gespeichert
            throw new Error(t('errors.creditDeduction'));
          }
        }
        
        const presetForVariant: Variant['preset'] = visualizationMode === 'pattern' && selectedPreset ? selectedPreset : 'Wandfarbe';

        const newVariant: Variant = {
            id: uuidv4(),
            preset: presetForVariant,
            imageUrl: newVariantImage,
            createdAt: new Date(),
        };
        setPendingVariant(newVariant);

        // Track erfolgreiche Bildgenerierung
        if (onImageGenerated) {
          onImageGenerated();
        }

        // Erhöhe Bild-Counter und prüfe Feedback-Trigger
        if (user) {
          try {
            await incrementImagesGenerated(user.uid);
            if (onRefreshUser) onRefreshUser();
            // Prüfe nach kurzer Verzögerung ob Feedback-Modal gezeigt werden soll
            setTimeout(() => {
              triggerFeedbackCheck();
            }, 2000);
          } catch (err) {
            console.error('Error incrementing images:', err);
          }
        }
      
    } catch (err) {
      console.error('Error generating variant:', err);
      const errorMessage = (err instanceof Error) ? err.message : t('errors.generic');
      setError(t('errors.visualization', { message: errorMessage }));
      // KEIN Credit-Abzug bei Fehler - Credits bleiben erhalten
    } finally {
      setIsLoading(false);
    }
  }, [session, selectedPreset, textHint, setError, visualizationMode, user, onShowPaywall, onDecrementCredits, onImageGenerated]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerationEnabled) {
      handleGenerate();
    }
  };
  
  const handleSaveVariant = () => {
    if (!pendingVariant) return;
    updateSession(prev => ({
        ...prev,
        variants: [...prev.variants, pendingVariant],
    }));
    setPendingVariant(null);
    setShowNextStep(true);
  };

  const handleDiscardVariant = () => {
    setPendingVariant(null);
    setShowNextStep(false);
  };

  const handleNextPattern = () => {
    if (!session) return;
    updateSession(prev => ({
        ...prev,
        patternImage: '',
    }));
    setShowNextStep(false);
  };

  const handleEmailGallery = () => {
    if (!session || session.variants.length === 0) return;
    const subject = `Ihre stoffanprobe.de Visualisierungen - Sitzung: ${session.name}`;
    const customerName = session.customerData?.customerName ? ` ${session.customerData.customerName}` : '';
    const body = `Hallo${customerName},\n\nanbei finden Sie die Visualisierungen aus unserer gemeinsamen Sitzung.\n\n(Um die Bilder zu senden, laden Sie bitte die Galerie herunter und fügen Sie die Bilder als Anhang Ihrer E-Mail hinzu.)\n\nMit freundlichen Grüßen,\nIhr Team von stoffanprobe.de`;
    const mailtoLink = `mailto:${session.customerData?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const handleDownloadGallery = async () => {
      if (!session || session.variants.length === 0) return;

      setIsLoading(true);

      try {
          const zip = new JSZip();
          const folderName = `stoffanprobe-${session.name.replace(/\s/g, '_') || new Date().toISOString().split('T')[0]}`;
          const folder = zip.folder(folderName);
          if (!folder) throw new Error(t('errors.zipCreation'));

          for (const variant of session.variants) {
              const base64Data = variant.imageUrl.split(',')[1];
              const mimeType = variant.imageUrl.match(/:(.*?);/)?.[1] ?? 'image/png';
              const extension = mimeType.split('/')[1]?.split('+')[0] ?? 'png';
              const filename = `variante-${variant.preset}-${variant.id.substring(0, 4)}.${extension}`;
              folder.file(filename, base64Data, { base64: true });
          }
          
          const content = await zip.generateAsync({ type: 'blob' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(content);
          link.download = `${folderName}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);

      } catch (error) {
          console.error("Fehler beim Erstellen der ZIP-Datei:", error);
          setError(t('errors.zipFile'));
      } finally {
          setIsLoading(false);
      }
  };

  const handleDeleteGallery = () => {
      if (!session || session.variants.length === 0) return;
      const isConfirmed = window.confirm(t('gallery.deleteConfirm'));
      if (isConfirmed) {
          updateSession(prev => ({
              ...prev,
              variants: [],
          }));
      }
  };

  const handleSelectWallColor = () => {
      setVisualizationMode(null);
      if(session) updateSession(s => ({...s, patternImage: ''}));
      onSelectWallColor();
  }

  const showPatternControls = session?.originalImage && session.patternImage;

  // Prüfe ob User Credits hat (gleiche Berechnung wie im Header)
  const hasCredits = user ? (() => {
    if (user.plan === 'pro') return true;
    
    const now = new Date();
    let purchasedCredits = user.purchasedCredits ?? 0;
    if (user.purchasedCreditsExpiry && user.purchasedCreditsExpiry < now) {
      purchasedCredits = 0;
    }
    const monthlyCredits = user.monthlyCredits ?? 0;
    return (monthlyCredits + purchasedCredits) > 0;
  })() : true;
  
  const isGenerationEnabled = !!(session?.originalImage && hasCredits && (
    (visualizationMode === 'pattern' && session.patternImage && selectedPreset) ||
    (visualizationMode === 'creativeWallColor' && session.wallColor) ||
    (visualizationMode === 'exactRAL' && session.wallColor)
  ));
  const actionButtonClasses = "px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all flex items-center justify-center gap-2";

  return (
    <>
      {isLoading && <LoadingOverlay />}
      {session?.originalImage && (
        <div className="container mx-auto px-4 mb-4">
          <PrivacyNotice />
        </div>
      )}
      
      <ImageTypeSelectionModal
        isOpen={showImageTypeSelection}
        onSelect={handleImageTypeSelect}
        onClose={() => {
          setShowImageTypeSelection(false);
          setTempImageDataUrl(null);
        }}
      />
      
      <PrivateConsentModal
        isOpen={showPrivateConsent}
        onClose={() => {
          setShowPrivateConsent(false);
          setTempImageDataUrl(null);
        }}
        onConfirm={handlePrivateConsentConfirm}
        showDontAskAgain={isHomeUser}
      />

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={closeFeedbackModal}
        onSubmit={handleFeedbackSubmit}
        onRemindLater={handleRemindLater}
        onDecline={handleFeedbackDecline}
      />

      <HomeInfoModal
        isOpen={showHomeInfo}
        onClose={async () => {
          setShowHomeInfo(false);
          // Markiere als gesehen in Firestore
          if (user) {
            try {
              await markHomeInfoShown(user.uid);
              if (onRefreshUser) onRefreshUser();
            } catch (err) {
              console.error('Error marking home info shown:', err);
            }
          }
        }}
      />

      <ConsentModal 
        isOpen={consentState.isOpen}
        onClose={() => setConsentState({isOpen: false, tempImageDataUrl: null})}
        onConfirm={handleConsentConfirm}
      />
      
      <main className={`flex-grow container mx-auto p-3 sm:p-6 md:p-6 lg:p-8 overflow-x-hidden transition-opacity duration-300 ${isLoading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        <div className="text-center mb-3 sm:mb-8">
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-[#532418] mb-1 sm:mb-2">{t('workspace.heading')}</h1>
            <p className="text-sm sm:text-lg text-[#67534F] px-2">{t('workspace.subheading')}</p>
        </div>

        {!session && hasSavedSessions && (
          <div className="text-center mb-4 sm:mb-8">
            <button
              onClick={onShowSessions}
              className={glassButton}
            >
              {t('workspace.continueSession')}
            </button>
          </div>
        )}

        {!session?.originalImage && <ExampleRooms onSelect={handleExampleRoomSelect} onSelectWallColor={handleSelectWallColor} />}

        <div className={`mb-3 sm:mb-6 p-2 sm:p-4 ${glassBase}`}>
            <h3 className="text-[10px] sm:text-sm font-semibold text-center text-[#532418] mb-1.5 sm:mb-3">{t('workspace.uploadOwnPhoto')}</h3>
            <div className="flex gap-2 sm:gap-3">
                <ImageUploader
                  onImageSelect={handleRoomImageSelect}
                  imageDataUrl={session?.originalImage}
                  buttonText={t('workspace.selectRoom')}
                />
                
                {session?.wallColor ? (
                   <div className="w-full flex flex-col gap-4 p-4 rounded-3xl bg-white/10">
                      <div className={`p-4 flex items-center gap-4 ${glassBase} rounded-xl`}>
                          <div
                            className="w-12 h-12 rounded-md border-2 border-white/50 shadow"
                            style={{ backgroundColor: session.wallColor.hex }}
                          />
                          <div className="flex-grow">
                            <p className="font-semibold text-[#532418]">{session.wallColor.code}</p>
                            <p className="text-sm text-gray-700">{session.wallColor.name}</p>
                          </div>
                      
                          <div className="flex items-center gap-4">
                             <button
                              className="text-sm font-medium text-[#532418] hover:text-[#C8956C] flex items-center gap-1 transition-colors"
                              onClick={handleSelectWallColor}
                              aria-label={t('common.edit')}
                            >
                              <PencilIcon /> {t('common.edit')}
                            </button>
                            <button
                              className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors"
                              onClick={() => {
                                  updateSession((prev) => ({ ...prev, wallColor: undefined }));
                                  setVisualizationMode(null);
                              }}
                              aria-label="Wandfarbe entfernen"
                            >
                              <DiscardIcon className="h-4 w-4" />
                            </button>
                          </div>
                      </div>

                      <p className="text-sm text-[#532418]/70 italic mt-2">
                        {t('workspace.colorHintPlaceholder')}
                      </p>

                      <form onSubmit={handleFormSubmit} className="relative">
                          <div className="relative flex items-start">
                              <textarea
                                  id="hint-textarea"
                                  placeholder={isListening ? `🎙️ ${t('saveSession.listening')}` : t('workspace.hintPlaceholder')}
                                  value={textHint}
                                  onChange={(e) => setTextHint(e.target.value)}
                                  onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          if (isGenerationEnabled) {
                                            handleGenerate();
                                          }
                                      }
                                  }}
                                  className="w-full h-24 rounded-xl border border-gray-300 p-3 pr-12 sm:pr-14 text-sm focus:ring-2 focus:ring-[#C8956C] focus:border-[#C8956C] transition-shadow resize-none"
                              />
                              {isSpeechRecognitionSupported && (
                                <div className="absolute right-2 top-2 sm:right-3 sm:top-3">
                                  <SpeechButton 
                                      onStart={startSpeechToText}
                                      onStop={stopSpeechToText}
                                      isListening={isListening}
                                  />
                                </div>
                              )}
                          </div>
                          {isListening && (
                                <p className="text-sm text-gray-600 italic mt-2 h-5">
                                    {t('saveSession.listening')}
                                </p>
                          )}
                      </form>

                      {!user && onShowLogin ? (
                        <div className="mt-4 text-center">
                            <button
                                type="button"
                                onClick={onShowLogin}
                                disabled={!isGenerationEnabled}
                                className={`${actionButtonClasses} w-full text-lg bg-gradient-to-br from-[#E6C785] via-[#CDA35E] to-[#B08642] hover:from-[#CDA35E] hover:via-[#B08642] hover:to-[#8C6A30] focus:ring-[#C8956C] disabled:bg-[#C8B6A6] disabled:cursor-not-allowed`}
                            >
                                {t('workspace.loginToGenerate')}
                            </button>
                            <p className="text-xs text-[#67534F] mt-2">
                                {t('workspace.loginRequired')}
                            </p>
                        </div>
                      ) : (
                        <button
                          onClick={handleGenerate}
                          disabled={!isGenerationEnabled || isLoading}
                          className={`${actionButtonClasses} w-full text-lg bg-gradient-to-br from-[#E6C785] via-[#CDA35E] to-[#B08642] hover:from-[#CDA35E] hover:via-[#B08642] hover:to-[#8C6A30] focus:ring-[#C8956C] disabled:bg-[#C8B6A6] disabled:cursor-not-allowed mt-4`}
                        >
                            {t('workspace.generateImage')}
                        </button>
                      )}
                   </div>
                ) : (
                  <ImageUploader
                    onImageSelect={handlePatternImageUpload}
                    imageDataUrl={session?.patternImage}
                    buttonText={t('workspace.selectFabric')}
                  />
                )}
            </div>
        </div>

        {showPatternControls && (
            <section className="mt-8 sm:mt-12 animate-fade-in">
                <div className="text-center mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-semibold text-[#532418] px-2">{t('workspace.step3Title')}</h2>
                </div>

                <div className="flex flex-col items-center gap-6 w-full max-w-4xl mx-auto">

                    <div className="w-full text-center">
                        <p className="text-md text-[#67534F]/90 mb-4">{t('workspace.choosePattern')}</p>
                        <div className="flex flex-wrap justify-center items-start gap-4 w-full">
                            <PresetButtons selectedPreset={selectedPreset} onPresetSelect={setSelectedPreset} />
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
                        <div className="w-full">
                            <form onSubmit={handleFormSubmit} className="relative">
                               <div className="relative flex items-start">
                                    <textarea
                                        id="hint-textarea"
                                        placeholder={isListening ? `🎙️ ${t('saveSession.listening')}` : t('workspace.hintPlaceholder')}
                                        value={textHint}
                                        onChange={(e) => setTextHint(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                if (isGenerationEnabled) {
                                                  handleGenerate();
                                                }
                                            }
                                        }}
                                        className="w-full h-20 sm:h-24 rounded-xl border border-gray-300 p-2 sm:p-3 pr-12 sm:pr-14 text-sm focus:ring-2 focus:ring-[#C8956C] focus:border-[#C8956C] transition-shadow resize-none"
                                    />
                                    {isSpeechRecognitionSupported && (
                                        <div className="absolute right-2 top-2 sm:right-3 sm:top-3">
                                            <SpeechButton 
                                                onStart={startSpeechToText}
                                                onStop={stopSpeechToText}
                                                isListening={isListening}
                                            />
                                        </div>
                                    )}
                               </div>
                               {isListening && (
                                    <p className="text-sm text-gray-600 italic mt-2 h-5">
                                        {t('saveSession.listening')}
                                    </p>
                               )}
                            </form>
                        </div>

                        {!user && onShowLogin ? (
                           <div className="w-full max-w-sm mt-2 text-center">
                                <button
                                    type="button"
                                    onClick={onShowLogin}
                                    disabled={!isGenerationEnabled}
                                    className={`${actionButtonClasses} w-full text-lg bg-gradient-to-br from-[#E6C785] via-[#CDA35E] to-[#B08642] hover:from-[#CDA35E] hover:via-[#B08642] hover:to-[#8C6A30] focus:ring-[#C8956C] disabled:bg-[#C8B6A6] disabled:cursor-not-allowed`}
                                >
                                    {t('workspace.loginToGenerate')}
                                </button>
                                <p className="text-xs text-[#67534F] mt-2">
                                    {t('workspace.loginRequired')}
                                </p>
                           </div>
                        ) : (
                            <button
                                onClick={handleGenerate}
                                disabled={!isGenerationEnabled || isLoading}
                                className={`${actionButtonClasses} w-full max-w-sm mt-2 text-lg bg-gradient-to-br from-[#E6C785] via-[#CDA35E] to-[#B08642] hover:from-[#CDA35E] hover:via-[#B08642] hover:to-[#8C6A30] focus:ring-[#C8956C] disabled:bg-[#C8B6A6] disabled:cursor-not-allowed`}
                            >
                                {t('workspace.generateImage')}
                            </button>
                        )}
                    </div>
                </div>
            </section>
        )}
        
        {pendingVariant && (
             <section className="mt-6 sm:mt-10 animate-fade-in">
                 <div className="text-center mb-3 sm:mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-[#532418]">{t('workspace.result')}</h2>
                </div>
                 <div className="max-w-2xl mx-auto">
                    <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">
                        <img
                            src={pendingVariant.imageUrl}
                            alt={t('workspace.previewAlt', { preset: pendingVariant.preset })}
                            className="w-full h-auto"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 sm:p-4">
                            <p className="text-white text-xs sm:text-sm">{pendingVariant.preset}</p>
                        </div>
                    </div>
                 </div>
                 <div className="flex justify-center items-center gap-3 mt-4">
                     <button onClick={handleDiscardVariant} className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5">
                        <DiscardIcon className="h-4 w-4" /> {t('workspace.discard')}
                     </button>
                     <button onClick={handleSaveVariant} className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-br from-[#E6C785] via-[#CDA35E] to-[#B08642] hover:from-[#CDA35E] hover:via-[#B08642] hover:to-[#8C6A30] rounded-lg shadow-md transition-all flex items-center gap-1.5">
                        <SaveIcon className="h-4 w-4" /> {t('common.save')}
                     </button>
                 </div>
             </section>
        )}

        {showNextStep && (
            <div className="flex justify-center mt-4 animate-fade-in">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('workspace.savedToGallery')}</span>
                    <button
                        onClick={handleNextPattern}
                        className="ml-1 px-2 py-0.5 bg-green-600 text-white hover:bg-green-700 rounded-full text-[10px] font-semibold transition-colors"
                    >
                        {t('workspace.nextPattern')}
                    </button>
                </div>
            </div>
        )}

        {session && session.variants.length > 0 && (
          <section className="mt-12 animate-fade-in">
             {/* DSGVO-Warnung für Kundenbilder */}
             <CustomerDataBanner session={session} />
             <Gallery
                variants={session.variants}
                onVariantSelect={setModalVariant}
                onEmailAll={handleEmailGallery}
                onDownloadAll={handleDownloadGallery}
                onDeleteAll={handleDeleteGallery}
            />
          </section>
        )}
      </main>
    </>
  );
};

export default Workspace;