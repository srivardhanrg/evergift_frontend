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

      {/* Removed: Generation progress and debug info for cleaner UX */}
    </div>
  );
};

export default BookViewerV2;
