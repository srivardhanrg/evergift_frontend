import React, { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import type { BookPageInfoV2, BookStructureV2, BookStyle } from '../../types/book.types';
import LockedPageV2 from './LockedPageV2';
import GeneratingPageV2 from './GeneratingPageV2';

/**
 * DesktopFlipbookViewer - Realistic page-flip book viewer for desktop
 *
 * Uses react-pageflip for realistic page turn animations.
 *
 * Features:
 * - Realistic 3D page flip animations
 * - Left/right navigation buttons
 * - Page shadows and depth effects
 * - Shows page states (generating, locked, available)
 * - Watermark overlay for unpaid previews
 */

// Page component that react-pageflip requires (must use forwardRef)
const Page = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  ({ children, className = '' }, ref) => {
    return (
      <div ref={ref} className={`page bg-white ${className}`}>
        {children}
      </div>
    );
  }
);

Page.displayName = 'Page';

interface DesktopFlipbookViewerProps {
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

export interface FlipbookRef {
  flipNext: () => void;
  flipPrev: () => void;
  flipToPage: (page: number) => void;
}

const DesktopFlipbookViewer = forwardRef<FlipbookRef, DesktopFlipbookViewerProps>(
  (
    {
      bookStructure,
      childName,
      theme,
      style,
      isPurchased,
      currentPage,
      generationProgress,
      onPageChange,
      onPurchaseClick,
    },
    ref
  ) => {
    const bookRef = useRef<any>(null);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      flipNext: () => {
        if (bookRef.current) {
          bookRef.current.pageFlip().flipNext();
        }
      },
      flipPrev: () => {
        if (bookRef.current) {
          bookRef.current.pageFlip().flipPrev();
        }
      },
      flipToPage: (page: number) => {
        if (bookRef.current) {
          bookRef.current.pageFlip().flip(page);
        }
      },
    }));

    // Get pages to display
    const visiblePages = bookStructure.pages.filter((page) => {
      if (page.isGenerating) return true;
      if (page.isLocked) return true;
      if (page.imageUrl) return true;
      return false;
    });

    // Handle page flip
    const handleFlip = useCallback(
      (e: { data: number }) => {
        const pageIndex = e.data;
        if (pageIndex >= 0 && pageIndex < visiblePages.length) {
          const page = visiblePages[pageIndex];
          if (page) {
            onPageChange(page.index);
          }
        }
      },
      [visiblePages, onPageChange]
    );

    // Navigation functions
    const goToPrevious = () => {
      if (bookRef.current) {
        bookRef.current.pageFlip().flipPrev();
      }
    };

    const goToNext = () => {
      if (bookRef.current) {
        bookRef.current.pageFlip().flipNext();
      }
    };

    // Calculate flipbook dimensions (10x10 inch at reasonable DPI for web)
    const pageWidth = 500;
    const pageHeight = 500;

    // Render a single page content
    const renderPageContent = (page: BookPageInfoV2) => {
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
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Watermark for unpaid previews */}
            {!isPurchased && page.isPreview && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="text-white/15 text-6xl font-bold rotate-[-30deg] select-none tracking-wider">
                  PREVIEW
                </div>
              </div>
            )}
            {/* Page number indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/30 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
              Page {page.index + 1}
            </div>
          </div>
        );
      }

      // Placeholder
      return (
        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Page {page.index + 1}</div>
        </div>
      );
    };

    const currentVisibleIndex = visiblePages.findIndex((p) => p.index === currentPage);
    const canGoPrev = currentVisibleIndex > 0;
    const canGoNext = currentVisibleIndex < visiblePages.length - 1;

    return (
      <div className="relative flex flex-col items-center">
        {/* Flipbook container */}
        <div
          className="relative shadow-2xl rounded-lg overflow-hidden"
          style={{
            perspective: '1500px',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Book shadow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10 pointer-events-none z-10" />

          <HTMLFlipBook
            ref={bookRef}
            width={pageWidth}
            height={pageHeight}
            size="fixed"
            minWidth={300}
            maxWidth={600}
            minHeight={300}
            maxHeight={600}
            showCover={true}
            mobileScrollSupport={false}
            onFlip={handleFlip}
            className="flipbook"
            style={{}}
            startPage={currentVisibleIndex >= 0 ? currentVisibleIndex : 0}
            drawShadow={true}
            flippingTime={600}
            useMouseEvents={true}
            clickEventForward={true}
            usePortrait={false}
            startZIndex={0}
            autoSize={false}
            maxShadowOpacity={0.5}
            showPageCorners={true}
            disableFlipByClick={false}
          >
            {visiblePages.map((page) => (
              <Page key={page.index}>{renderPageContent(page)}</Page>
            ))}
          </HTMLFlipBook>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center gap-6 mt-6">
          {/* Previous button */}
          <button
            onClick={goToPrevious}
            disabled={!canGoPrev}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              canGoPrev
                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Page indicator */}
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {visiblePages.slice(0, 13).map((page, i) => (
                <button
                  key={page.index}
                  onClick={() => {
                    if (bookRef.current) {
                      bookRef.current.pageFlip().flip(i);
                    }
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    page.index === currentPage
                      ? 'bg-purple-600 scale-125'
                      : page.isLocked
                      ? 'bg-gray-300'
                      : 'bg-purple-200 hover:bg-purple-300'
                  }`}
                  aria-label={`Go to page ${page.index + 1}`}
                />
              ))}
              {visiblePages.length > 13 && (
                <span className="flex items-center text-gray-400 text-xs ml-2">
                  <Lock className="w-3 h-3 mr-1" />+{bookStructure.lockedPageCount}
                </span>
              )}
            </div>
            <span className="text-gray-600 font-medium">
              {currentVisibleIndex + 1} / {visiblePages.length}
            </span>
          </div>

          {/* Next button */}
          <button
            onClick={goToNext}
            disabled={!canGoNext}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              canGoNext
                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Locked pages indicator */}
        {!isPurchased && bookStructure.lockedPageCount > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              <Lock className="w-4 h-4 inline mr-1" />
              {bookStructure.lockedPageCount} pages locked
            </p>
            {onPurchaseClick && (
              <button
                onClick={onPurchaseClick}
                className="mt-2 text-purple-600 hover:text-purple-700 font-medium text-sm hover:underline"
              >
                Unlock full storybook
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);

DesktopFlipbookViewer.displayName = 'DesktopFlipbookViewer';

export default DesktopFlipbookViewer;
