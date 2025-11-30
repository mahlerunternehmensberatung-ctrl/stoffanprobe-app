import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (stars: number, comment?: string) => Promise<void>;
  onRemindLater: () => void;
  onDecline: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onRemindLater,
  onDecline,
}) => {
  const { t } = useTranslation();
  const [stars, setStars] = useState<number>(0);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  if (!isOpen) return null;

  const handleStarClick = (rating: number) => {
    setStars(rating);
  };

  const handleSubmit = async () => {
    if (stars === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(stars, comment.trim() || undefined);
      setShowThankYou(true);
      // Nach 2 Sekunden schließen
      setTimeout(() => {
        onClose();
        setShowThankYou(false);
        setStars(0);
        setComment('');
      }, 2500);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemindLater = () => {
    onRemindLater();
    onClose();
  };

  const handleClose = () => {
    onDecline();
    onClose();
  };

  // Google Review URL - ersetze mit deiner echten URL
  const googleReviewUrl = 'https://g.page/r/stoffanprobe/review';

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-[#FFFFF5] rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={t('common.close')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {showThankYou ? (
          // Thank You Screen
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🙏</div>
            <h2 className="text-2xl font-bold text-[#532418] mb-2">
              {t('feedback.thankYouTitle')}
            </h2>
            <p className="text-[#67534F]">
              {t('feedback.thankYouMessage')}
            </p>
          </div>
        ) : stars === 0 ? (
          // Initial View - Star Rating
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-[#532418] mb-2">
              {t('feedback.title')}
            </h2>
            <p className="text-[#67534F] mb-6">
              {t('feedback.subtitle')}
            </p>

            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-1 transition-transform hover:scale-110"
                  aria-label={`${star} ${t('feedback.stars')}`}
                >
                  <svg
                    className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors ${
                      star <= (hoveredStar || stars)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                    viewBox="0 0 24 24"
                    fill={star <= (hoveredStar || stars) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Remind Later Button */}
            <button
              onClick={handleRemindLater}
              className="text-sm text-[#67534F] hover:text-[#532418] underline transition-colors"
            >
              {t('feedback.remindLater')}
            </button>
          </div>
        ) : (
          // After Star Selection - Comment Form
          <div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-[#532418] mb-2">
                {stars >= 4 ? t('feedback.highRatingTitle') : t('feedback.lowRatingTitle')}
              </h2>

              {/* Show selected stars */}
              <div className="flex justify-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-6 h-6 ${
                      star <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    }`}
                    viewBox="0 0 24 24"
                    fill={star <= stars ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
            </div>

            {/* Comment Textarea */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#532418] mb-2">
                {t('feedback.commentLabel')} <span className="text-gray-400">({t('feedback.optional')})</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('feedback.commentPlaceholder')}
                className="w-full h-24 rounded-xl border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-[#C8956C] focus:border-[#C8956C] transition-shadow resize-none"
              />
            </div>

            {/* Google Review Prompt for High Ratings */}
            {stars >= 4 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-[#532418] mb-2">
                  {t('feedback.googleReviewPrompt')}
                </p>
                <a
                  href={googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#C8956C] hover:text-[#A67B5B] transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {t('feedback.googleReviewButton')}
                </a>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-[#C8956C] to-[#A67B5B] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('common.processing') : t('feedback.submit')}
            </button>

            {/* Change Rating */}
            <button
              onClick={() => setStars(0)}
              className="w-full mt-3 text-sm text-[#67534F] hover:text-[#532418] transition-colors"
            >
              {t('feedback.changeRating')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
