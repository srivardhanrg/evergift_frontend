import React, { useState } from 'react';
import { X, Book, Check, Sparkles } from 'lucide-react';
import { PHYSICAL_BOOK_SOFTCOVER_PRICE, PHYSICAL_BOOK_HARDCOVER_PRICE } from '../constants';

interface CoverSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCover: (coverType: 'softcover' | 'hardcover') => Promise<void>;
  previewId: string;
}

const CoverSelectionModal: React.FC<CoverSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectCover,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCover, setSelectedCover] = useState<'softcover' | 'hardcover' | null>(null);

  if (!isOpen) return null;

  const handleSelectCover = async (coverType: 'softcover' | 'hardcover') => {
    setSelectedCover(coverType);
    setIsProcessing(true);
    try {
      await onSelectCover(coverType);
    } catch (error) {
      console.error('Error selecting cover:', error);
      setIsProcessing(false);
      setSelectedCover(null);
    }
  };

  const softcoverFeatures = [
    'Lightweight & flexible',
    'Perfect for everyday reading',
    'Glossy laminated cover',
    'Saddle-stitch binding',
    '24 vibrant interior pages'
  ];

  const hardcoverFeatures = [
    'Premium & durable',
    'Perfect gift quality',
    'Rigid protective cover',
    'Perfect bound',
    '24 vibrant interior pages'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Mobile: Bottom Sheet | Desktop: Centered Modal */}
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        {/* Header - Compact on mobile */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
          <div className="flex-1">
            <h2 className="text-lg sm:text-2xl font-heading font-bold text-gray-900">Choose Your Book Type</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">Select the perfect cover for your personalized storybook</p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="ml-2 p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          </button>
        </div>

        {/* Content - Mobile-optimized spacing */}
        <div className="p-4 sm:p-6">
          {/* Cards - Stacked on mobile, side-by-side on desktop */}
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-6">
            {/* Softcover Card */}
            <button
              onClick={() => !isProcessing && handleSelectCover('softcover')}
              disabled={isProcessing}
              className={`relative border-2 rounded-2xl p-4 sm:p-6 transition-all text-left ${
                selectedCover === 'softcover' && isProcessing
                  ? 'border-blue-500 bg-blue-50 shadow-lg scale-[0.98]'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-lg active:scale-[0.98]'
              } disabled:opacity-50`}
            >
              {/* Processing Indicator */}
              {selectedCover === 'softcover' && isProcessing && (
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                  <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600"></div>
                </div>
              )}

              {/* Header - Compact on mobile */}
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <Book className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 truncate">Softcover</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Classic Quality</p>
                </div>
              </div>

              {/* Price - More prominent */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                    ${(PHYSICAL_BOOK_SOFTCOVER_PRICE / 100).toFixed(0)}
                  </span>
                  <span className="text-sm text-gray-500">USD</span>
                </div>
              </div>

              {/* Features - Compact on mobile */}
              <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                {softcoverFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA - Touch-friendly on mobile */}
              <div className={`w-full py-2.5 sm:py-3 px-4 rounded-xl font-semibold text-center transition-colors text-sm sm:text-base ${
                isProcessing
                  ? 'bg-gray-200 text-gray-500'
                  : 'bg-blue-600 text-white'
              }`}>
                {selectedCover === 'softcover' && isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </span>
                ) : (
                  'Select Softcover'
                )}
              </div>
            </button>

            {/* Hardcover Card */}
            <button
              onClick={() => !isProcessing && handleSelectCover('hardcover')}
              disabled={isProcessing}
              className={`relative border-2 rounded-2xl p-4 sm:p-6 transition-all text-left ${
                selectedCover === 'hardcover' && isProcessing
                  ? 'border-purple-500 bg-purple-50 shadow-lg scale-[0.98]'
                  : 'border-gray-200 hover:border-purple-300 hover:shadow-lg active:scale-[0.98]'
              } disabled:opacity-50`}
            >
              {/* Processing Indicator */}
              {selectedCover === 'hardcover' && isProcessing && (
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                  <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-purple-600"></div>
                </div>
              )}

              {/* Premium Badge - Responsive */}
              <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>PREMIUM</span>
              </div>

              {/* Header - Compact on mobile */}
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="bg-purple-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <Book className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-xl font-bold text-gray-900 truncate">Hardcover</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Premium Quality</p>
                </div>
              </div>

              {/* Price - More prominent */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-bold text-purple-600">
                    ${(PHYSICAL_BOOK_HARDCOVER_PRICE / 100).toFixed(0)}
                  </span>
                  <span className="text-sm text-gray-500">USD</span>
                </div>
              </div>

              {/* Features - Compact on mobile */}
              <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                {hardcoverFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA - Touch-friendly on mobile */}
              <div className={`w-full py-2.5 sm:py-3 px-4 rounded-xl font-semibold text-center transition-colors text-sm sm:text-base ${
                isProcessing
                  ? 'bg-gray-200 text-gray-500'
                  : 'bg-purple-600 text-white'
              }`}>
                {selectedCover === 'hardcover' && isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </span>
                ) : (
                  'Select Hardcover'
                )}
              </div>
            </button>
          </div>

          {/* Additional Info - Compact on mobile */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100">
            <p className="text-xs sm:text-sm text-gray-600 text-center leading-relaxed">
              <span className="inline-block mr-2">📦</span>
              <span className="font-medium">Free shipping</span> on all orders
              <span className="hidden sm:inline"> • </span>
              <br className="sm:hidden" />
              <span className="inline-block mr-2 sm:ml-0">✨</span>
              <span className="font-medium">Professionally printed</span>
              <span className="hidden sm:inline"> • </span>
              <br className="sm:hidden" />
              <span className="inline-block mr-2 sm:ml-0">🎁</span>
              <span className="font-medium">Gift-ready quality</span>
            </p>
          </div>

          {/* Bottom spacer for mobile pull-down gesture */}
          <div className="h-4 sm:h-0" />
        </div>
      </div>
    </div>
  );
};

export default CoverSelectionModal;
