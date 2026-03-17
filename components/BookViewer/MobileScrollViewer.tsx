import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import type { BookPageInfoV2, BookStructureV2, BookStyle } from '../../types/book.types';
import LockedPageV2 from './LockedPageV2';
import GeneratingPageV2 from './GeneratingPageV2';

/**
 * MobileScrollViewer - Horizontal scroll book viewer for mobile devices
 *
 * Features:
 * - Touch-friendly horizontal scrolling with snap
 * - Page indicator dots
 * - Left/right navigation arrows
 * - Shows page states (generating, locked, available)
 * - Watermark overlay for unpaid previews
 */

interface MobileScrollViewerProps {
  bookStructure: BookStructureV2;
  childName: string;
  theme: string;
  style: BookStyle;
  isPurchased: boolean;
  currentPage: number;
  generationProgress: number;
  onPageChange: (pageIndex: number) => void;
  onPurchaseClick?: () => void;
}

const MobileScrollViewer: React.FC<MobileScrollViewerProps> = ({
  bookStructure,
  childName,
  theme,
  style,
  isPurchased,
  currentPage,
  generationProgress,
  onPageChange,
  onPurchaseClick,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [visiblePage, setVisiblePage] = useState(currentPage);

  // Get pages to display (filter out pages without images unless they're generating/locked)
  const visiblePages = bookStructure.pages.filter((page) => {
    // Always show generating pages
    if (page.isGenerating) return true;
    // Always show locked pages (they have the lock overlay)
    if (page.isLocked) return true;
    // Show pages with images
    if (page.imageUrl) return true;
    // Hide pages without images that aren't generating
    return false;
  });

  // Scroll to page when currentPage changes externally
  useEffect(() => {
    if (scrollContainerRef.current) {
      const pageWidth = scrollContainerRef.current.clientWidth;
      const targetIndex = visiblePages.findIndex((p) => p.index === currentPage);
      if (targetIndex >= 0) {
        scrollContainerRef.current.scrollTo({
          left: targetIndex * pageWidth,
          behavior: 'smooth',
        });
      }
    }
  }, [currentPage, visiblePages]);

  // Handle scroll events to update visible page
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const pageWidth = container.clientWidth;
      const scrollPosition = container.scrollLeft;
      const newIndex = Math.round(scrollPosition / pageWidth);

      if (newIndex >= 0 && newIndex < visiblePages.length) {
        const newPage = visiblePages[newIndex];
        if (newPage && newPage.index !== visiblePage) {
          setVisiblePage(newPage.index);
          onPageChange(newPage.index);
        }
      }
    }
  }, [visiblePages, visiblePage, onPageChange]);

  // Navigation functions
  const goToPrevious = () => {
    const currentIndex = visiblePages.findIndex((p) => p.index === visiblePage);
    if (currentIndex > 0) {
      const prevPage = visiblePages[currentIndex - 1];
      onPageChange(prevPage.index);
    }
  };

  const goToNext = () => {
    const currentIndex = visiblePages.findIndex((p) => p.index === visiblePage);
    if (currentIndex < visiblePages.length - 1) {
      const nextPage = visiblePages[currentIndex + 1];
      onPageChange(nextPage.index);
    }
  };

  const currentVisibleIndex = visiblePages.findIndex((p) => p.index === visiblePage);
  const canGoPrev = currentVisibleIndex > 0;
  const canGoNext = currentVisibleIndex < visiblePages.length - 1;

  // Render a single page
  const renderPage = (page: BookPageInfoV2) => {
    // Generating state
    if (page.isGenerating) {
      return (
        <GeneratingPageV2
          page={page}
          progress={generationProgress}
          stepDescription="Creating your magical page..."
        />
      );
    }

    // Locked state
    if (page.isLocked) {
      return (
        <LockedPageV2
          page={page}
          totalLockedPages={bookStructure.lockedPageCount}
          onPurchaseClick={onPurchaseClick}
          childName={childName}
          compact
        />
      );
    }

    // Regular page with image
    if (page.imageUrl) {
      return (
        <div className="relative w-full h-full">
          <img
            src={page.imageUrl}
            alt={`Page ${page.index + 1}`}
            className="w-full h-full object-contain"
            loading="lazy"
          />
          {/* Watermark for unpaid previews */}
          {!isPurchased && page.isPreview && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="text-white/20 text-4xl font-bold rotate-[-30deg] select-none">
                PREVIEW
              </div>
            </div>
          )}
        </div>
      );
    }

    // Placeholder for pages without images
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Page {page.index + 1}</div>
      </div>
    );
  };

  return (
    <div className="relative w-full">
      {/* Scroll container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {visiblePages.map((page) => (
          <div
            key={page.index}
            className="flex-shrink-0 w-full snap-center"
            style={{ aspectRatio: '1/1' }}
          >
            <div className="w-full h-full bg-white shadow-lg overflow-hidden">
              {renderPage(page)}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {canGoPrev && (
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
      )}
      {canGoNext && (
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-6 h-6 text-gray-700" />
        </button>
      )}

      {/* Page indicator */}
      <div className="flex justify-center items-center gap-3 mt-4">
        {/* Page dots */}
        <div className="flex gap-1.5">
          {visiblePages.slice(0, 13).map((page, i) => (
            <button
              key={page.index}
              onClick={() => onPageChange(page.index)}
              className={`w-2 h-2 rounded-full transition-all ${
                page.index === visiblePage
                  ? 'bg-purple-600 w-4'
                  : page.isLocked
                  ? 'bg-gray-300'
                  : 'bg-purple-200 hover:bg-purple-300'
              }`}
              aria-label={`Go to page ${page.index + 1}`}
            />
          ))}
          {visiblePages.length > 13 && (
            <>
              <span className="text-gray-400 text-xs">...</span>
              <span className="text-gray-400 text-xs flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {bookStructure.lockedPageCount}
              </span>
            </>
          )}
        </div>

        {/* Page counter */}
        <div className="text-sm text-gray-500 font-medium">
          {currentVisibleIndex + 1} / {visiblePages.length}
        </div>
      </div>
    </div>
  );
};

export default MobileScrollViewer;
