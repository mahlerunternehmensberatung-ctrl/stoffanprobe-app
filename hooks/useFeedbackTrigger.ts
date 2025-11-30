import { useState, useCallback, useEffect } from 'react';
import { User } from '../types';
import {
  shouldShowFeedbackModal,
  submitFeedback,
  setFeedbackRemindLater,
  declineFeedback,
  incrementImagesGenerated,
} from '../services/feedbackService';

interface UseFeedbackTriggerResult {
  showFeedbackModal: boolean;
  triggerFeedbackCheck: () => void;
  handleFeedbackSubmit: (stars: number, comment?: string) => Promise<void>;
  handleRemindLater: () => Promise<void>;
  handleDecline: () => Promise<void>;
  closeFeedbackModal: () => void;
}

/**
 * Hook der das Feedback-System steuert
 * Prüft ob Modal gezeigt werden soll und handhabt alle Aktionen
 */
export const useFeedbackTrigger = (
  user: User | null | undefined,
  onRefreshUser?: () => void
): UseFeedbackTriggerResult => {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Prüft ob Feedback-Modal angezeigt werden soll
  const triggerFeedbackCheck = useCallback(() => {
    if (!user) return;

    const shouldShow = shouldShowFeedbackModal(user);
    if (shouldShow) {
      // Kleine Verzögerung damit das Bild erst angezeigt wird
      setTimeout(() => {
        setShowFeedbackModal(true);
      }, 1500);
    }
  }, [user]);

  // Bei Bildgenerierung aufrufen - erhöht Counter und prüft Trigger
  const handleImageGenerated = useCallback(async () => {
    if (!user) return;

    try {
      await incrementImagesGenerated(user.uid);
      // User-Daten aktualisieren
      if (onRefreshUser) {
        onRefreshUser();
      }
    } catch (error) {
      console.error('Error incrementing images:', error);
    }
  }, [user, onRefreshUser]);

  // Feedback absenden
  const handleFeedbackSubmit = useCallback(
    async (stars: number, comment?: string) => {
      if (!user) return;

      await submitFeedback(
        user.uid,
        stars,
        comment,
        user.imagesGenerated ?? 0
      );

      if (onRefreshUser) {
        onRefreshUser();
      }
    },
    [user, onRefreshUser]
  );

  // "Später erinnern" geklickt
  const handleRemindLater = useCallback(async () => {
    if (!user) return;

    await setFeedbackRemindLater(user.uid);
    setShowFeedbackModal(false);

    if (onRefreshUser) {
      onRefreshUser();
    }
  }, [user, onRefreshUser]);

  // Abgelehnt (X geklickt)
  const handleDecline = useCallback(async () => {
    if (!user) return;

    await declineFeedback(user.uid);
    setShowFeedbackModal(false);

    if (onRefreshUser) {
      onRefreshUser();
    }
  }, [user, onRefreshUser]);

  // Modal schließen ohne Aktion
  const closeFeedbackModal = useCallback(() => {
    setShowFeedbackModal(false);
  }, []);

  return {
    showFeedbackModal,
    triggerFeedbackCheck,
    handleFeedbackSubmit,
    handleRemindLater,
    handleDecline,
    closeFeedbackModal,
  };
};
