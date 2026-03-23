import React, { useState } from 'react';
import { X, Book, Check } from 'lucide-react';
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
    '24 interior pages'
  ];

  const hardcoverFeatures = [
    'Premium & durable',
    'Perfect gift quality',
    'Rigid protective cover',
    'Perfect bound',
    '24 interior pages'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Choose Your Book Type</h2>
            <p className="text-sm text-gray-600 mt-1">Select the perfect cover for your personalized storybook</p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Softcover Card */}
            <div
              className={`relative border-2 rounded-xl p-6 transition-all cursor-pointer ${
                selectedCover === 'softcover' && isProcessing
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
              }`}
              onClick={() => !isProcessing && handleSelectCover('softcover')}
            >
              {selectedCover === 'softcover' && isProcessing && (
                <div className="absolute top-4 right-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Book className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Softcover</h3>
                  <p className="text-sm text-gray-600">Classic & Affordable</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-3xl font-bold text-blue-600">
                  ${(PHYSICAL_BOOK_SOFTCOVER_PRICE / 100).toFixed(0)}
                </div>
                <p className="text-sm text-gray-600">USD</p>
              </div>

              <ul className="space-y-3 mb-6">
                {softcoverFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={isProcessing}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {selectedCover === 'softcover' && isProcessing ? 'Processing...' : 'Select Softcover'}
              </button>
            </div>

            {/* Hardcover Card */}
            <div
              className={`relative border-2 rounded-xl p-6 transition-all cursor-pointer ${
                selectedCover === 'hardcover' && isProcessing
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300 hover:shadow-lg'
              }`}
              onClick={() => !isProcessing && handleSelectCover('hardcover')}
            >
              {selectedCover === 'hardcover' && isProcessing && (
                <div className="absolute top-4 right-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Book className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Hardcover</h3>
                  <p className="text-sm text-gray-600">Premium Quality</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-3xl font-bold text-purple-600">
                  ${(PHYSICAL_BOOK_HARDCOVER_PRICE / 100).toFixed(0)}
                </div>
                <p className="text-sm text-gray-600">USD</p>
              </div>

              <ul className="space-y-3 mb-6">
                {hardcoverFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                disabled={isProcessing}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  isProcessing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {selectedCover === 'hardcover' && isProcessing ? 'Processing...' : 'Select Hardcover'}
              </button>

              {/* Premium Badge */}
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                PREMIUM
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              📦 Free shipping on all orders • ✨ Professionally printed • 🎁 Gift-ready quality
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverSelectionModal;
