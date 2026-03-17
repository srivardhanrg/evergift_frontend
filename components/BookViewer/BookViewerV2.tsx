import React, { useState, useCallback, useRef } from 'react';
import type { BookViewerV2Props } from '../../types/book.types';
import { useResponsive } from '../../hooks/useResponsive';
import MobileScrollViewer from './MobileScrollViewer';
import DesktopFlipbookViewer, { FlipbookRef } from './DesktopFlipbookViewer';

/**
 * BookViewerV2 - Unified book viewer for the 26-page structure
 *
 * Automatically switches between:
 * - Mobile: Horizontal scroll viewer with touch gestures
 * - Desktop: Realistic flipbook with page-turn animations
 *
 * Props:
 * - bookStructure: Complete 26-page structure from API
 * - childName: Child's name for personalization
 * - theme: Story theme
 * - style: Art style (photorealistic/cartoon_3d)
 * - isPurchased: Whether user has purchased
 * - generationPhase: Current generation phase
 * - onPageChange: Callback when page changes
 * - onPurchaseClick: Callback when user wants to purchase
 */

const BookViewerV2: React.FC<BookViewerV2Props> = ({
  previewId,
  childName,
  theme,
  style,
  bookStructure,
  isPurchased,
  generationPhase,
  onPageChange,
  onPurchaseClick,
}) => {
  const { isMobile } = useResponsive();
  const [currentPage, setCurrentPage] = useState(0);
  const flipbookRef = useRef<FlipbookRef>(null);

  // Handle page change from child components
  const handlePageChange = useCallback(
    (pageIndex: number) => {
      setCurrentPage(pageIndex);
      onPageChange?.(pageIndex);
    },
    [onPageChange]
  );

  // Calculate generation progress
  const generationProgress = bookStructure.generationProgress || 0;

  // Show loading state if no pages available
  const hasVisiblePages = bookStructure.pages.some(
    (p) => p.imageUrl || p.isGenerating || p.isLocked
  );

  if (!hasVisiblePages) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your magical storybook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="book-viewer-v2">
      {/* Mobile View */}
      {isMobile ? (
        <MobileScrollViewer
          bookStructure={bookStructure}
          childName={childName}
          theme={theme}
          style={style}
          isPurchased={isPurchased}
          currentPage={currentPage}
          generationProgress={generationProgress}
          onPageChange={handlePageChange}
          onPurchaseClick={onPurchaseClick}
        />
      ) : (
        /* Desktop View */
        <DesktopFlipbookViewer
          ref={flipbookRef}
          bookStructure={bookStructure}
          childName={childName}
          theme={theme}
          style={style}
          isPurchased={isPurchased}
          currentPage={currentPage}
          generationProgress={generationProgress}
          onPageChange={handlePageChange}
          onPurchaseClick={onPurchaseClick}
        />
      )}

      {/* Generation progress indicator (shown during generation) */}
      {generationPhase !== 'complete' && generationProgress > 0 && generationProgress < 100 && (
        <div className="mt-6">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Creating your storybook...</span>
              <span>{generationProgress}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {bookStructure.pagesGenerated} of {bookStructure.totalAiPages} pages generated
            </p>
          </div>
        </div>
      )}

      {/* Stats for debugging (only in development) */}
      {import.meta.env.DEV && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs text-gray-600 max-w-md mx-auto">
          <h4 className="font-bold mb-2">Debug Info:</h4>
          <ul className="space-y-1">
            <li>Preview ID: {previewId}</li>
            <li>Current Page: {currentPage}</li>
            <li>Generation Phase: {generationPhase}</li>
            <li>Is Purchased: {isPurchased ? 'Yes' : 'No'}</li>
            <li>
              Pages: {bookStructure.previewPageCount} preview /{' '}
              {bookStructure.lockedPageCount} locked
            </li>
            <li>AI Pages: {bookStructure.pagesGenerated} / {bookStructure.totalAiPages}</li>
            <li>Filler Ready: {bookStructure.fillerPagesReady ? 'Yes' : 'No'}</li>
            <li>View: {isMobile ? 'Mobile Scroll' : 'Desktop Flipbook'}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default BookViewerV2;
