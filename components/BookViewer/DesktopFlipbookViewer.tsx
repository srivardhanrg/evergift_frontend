import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight, Lock, Sparkles, Loader2 } from 'lucide-react';
import type { BookPageInfoV2, BookStructureV2, BookStyle } from '../../types/book.types';
import LockedPageV2 from './LockedPageV2';
import GeneratingPageV2 from './GeneratingPageV2';

// CRITICAL: Import react-pageflip CSS for proper positioning
import 'page-flip/src/Style/stPageFlip.css';

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
// CRITICAL: Must have explicit dimensions for react-pageflip to work correctly
const Page = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  ({ children, className = '' }, ref) => {
    return (
      <div
        ref={ref}
        className={`page bg-white ${className}`}
        style={{
          width: '500px',
          height: '500px',
          overflow: 'hidden'
        }}
      >
        {children}
      </div>
    );
  }
);

Page.displayName = 'Page';

/**
 * Get display label for a page based on its index.
 * Cover (index 0) shows "Cover", others show "Page {index}"
 */
function getPageLabel(index: number): string {
  if (index === 0) return 'Cover';
  return `Page ${index}`;
}

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
    const [showCoverView, setShowCoverView] = React.useState(true);
    const hasOpenedBookRef = useRef(false);
    const prevPageRef = useRef(currentPage); // Track previous page for detecting navigation back to cover

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

    // Get pages to display - MUST be declared before useEffect that uses it
    // Show ALL preview pages during generation (they'll render appropriate states)
    // For locked pages, only show if purchased or if showing locked indicator
    const filteredPages = bookStructure.pages.filter((page) => {
      // Always show preview pages (indices 0-12) - they're part of the free preview
      if (page.isPreview) return true;
      // For locked pages (indices 13-25):
      // - Show if purchased (user has access)
      // - Show if has imageUrl (already generated)
      // - Show to indicate locked state for purchase CTA
      if (page.isLocked) return isPurchased || page.imageUrl || true;
      // Show any page with content
      if (page.imageUrl) return true;
      return true;
    });

    // NEW ORDER: Pages are already in correct order from backend (Text on LEFT, AI on RIGHT)
    // DESKTOP ONLY: Insert blank page after cover for proper book opening UX
    const visiblePages = React.useMemo(() => {
      const pages = [...filteredPages];

      // Find cover page (index 0)
      const coverIndex = pages.findIndex(p => p.index === 0);

      if (coverIndex >= 0) {
        // Insert blank page object after cover (desktop view only)
        const blankPage: BookPageInfoV2 = {
          index: -1,  // Virtual page, negative index to avoid conflicts
          page_type: 'blank' as any,
          image_url: null,
          story_text: null,
          is_preview: true,
          is_locked: false,
          is_filler: false,
          is_generating: false,
          is_generated: true,
          requires_text_overlay: false,
          text_page_number: null
        };

        pages.splice(coverIndex + 1, 0, blankPage);
      }

      return pages;
    }, [filteredPages]);

    // Auto-flip to newly generated page
    const prevCompletedRef = useRef<number>(0);
    useEffect(() => {
      const completedCount = visiblePages.filter(
        p => p.imageUrl && !p.isLocked && !p.isGenerating
      ).length;

      if (completedCount > prevCompletedRef.current && prevCompletedRef.current > 0) {
        // A new page completed — auto-flip to it!
        const newPageIndex = visiblePages.findIndex(
          (p, i) => p.imageUrl && !p.isGenerating && i >= prevCompletedRef.current
        );

        if (newPageIndex >= 0 && bookRef.current) {
          setTimeout(() => {
            if (bookRef.current) {
              bookRef.current.pageFlip().flip(newPageIndex);
            }
          }, 2500); // 2.5s delay for better user experience - gives time to appreciate the new page
        }
      }

      prevCompletedRef.current = completedCount;
    }, [visiblePages]);

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
      // If in cover view, transition to flipbook
      if (showCoverView && isViewingCover) {
        handleOpenBook();
        return;
      }

      if (bookRef.current) {
        bookRef.current.pageFlip().flipNext();
      }
    };

    // Calculate flipbook dimensions (10x10 inch at reasonable DPI for web)
    const pageWidth = 500;
    const pageHeight = 500;

    // Render a single page content based on page state
    const renderPageContent = (page: BookPageInfoV2) => {
      // 0. Blank page (virtual page for book opening UX)
      if (page.page_type === 'blank' || page.index === -1) {
        return <div className="w-full h-full bg-white" />;
      }

      // 1. Generating state - AI page currently being created
      if (page.isGenerating) {
        return (
          <GeneratingPageV2
            page={page}
            progress={generationProgress}
            stepDescription="Creating your magical page..."
          />
        );
      }

      // 2. Locked state - pages 13-25 for unpurchased users
      if (page.isLocked && !isPurchased) {
        return (
          <LockedPageV2
            page={page}
            totalLockedPages={bookStructure.lockedPageCount}
            onPurchaseClick={onPurchaseClick}
            childName={childName}
          />
        );
      }

      // 3. Has image - render the actual page content
      if (page.imageUrl) {
        return (
          <div className="relative w-full h-full overflow-hidden">
            <img
              src={page.imageUrl}
              alt={`Page ${page.index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
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
              {getPageLabel(page.index)}
            </div>
          </div>
        );
      }

      // 4. Filler page without URL - show themed loading state
      // Filler pages (dedication, intro, text) are processed at ~90% progress
      if (page.isFiller) {
        return (
          <div className="w-full h-full bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
            <div className="text-center px-6">
              <div className="relative mb-4">
                <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
                <Sparkles className="w-5 h-5 text-pink-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <p className="text-purple-600 font-medium text-sm mb-1">Adding magical touches...</p>
              <p className="text-purple-400 text-xs">{getPageLabel(page.index)}</p>
            </div>
          </div>
        );
      }

      // 5. AI page pending - not yet started generating
      // Shows for AI pages that are queued but not actively generating
      return (
        <div className="w-full h-full bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="text-center px-6">
            <Sparkles className="w-10 h-10 text-purple-300 mx-auto mb-3 opacity-50" />
            <p className="text-gray-500 font-medium text-sm mb-1">Waiting for magic...</p>
            <p className="text-gray-400 text-xs">{getPageLabel(page.index)}</p>
          </div>
        </div>
      );
    };

    const currentVisibleIndex = visiblePages.findIndex((p) => p.index === currentPage);
    const canGoPrev = currentVisibleIndex > 0;
    const canGoNext = currentVisibleIndex < visiblePages.length - 1;

    // Check if we're viewing the cover (page 0)
    const isViewingCover = currentPage === 0;

    // Handle opening the book (transitioning from cover view to flipbook)
    const handleOpenBook = useCallback(() => {
      setShowCoverView(false);
      hasOpenedBookRef.current = true;
      // Auto-flip to next page after a short delay
      setTimeout(() => {
        if (bookRef.current) {
          bookRef.current.pageFlip().flipNext();
        }
      }, 300);
    }, []);

    // Handle cover view state changes based on navigation
    useEffect(() => {
      // Case 1: User navigated AWAY from cover (opened the book)
      if (!isViewingCover && showCoverView) {
        setShowCoverView(false);
        hasOpenedBookRef.current = true;
      }

      // Case 2: User navigated BACK to cover from another page (closing the book)
      // This happens when clicking "previous" from page 1
      if (isViewingCover && prevPageRef.current > 0 && hasOpenedBookRef.current) {
        // Reset to show full-screen cover view with closing animation
        setShowCoverView(true);
        hasOpenedBookRef.current = false;
      }

      // Update previous page reference
      prevPageRef.current = currentPage;
    }, [isViewingCover, showCoverView, currentPage]);

    // If showing cover view and on page 0, show full-screen cover with smooth animation
    const coverPage = visiblePages.find(p => p.index === 0);
    if (showCoverView && !hasOpenedBookRef.current && isViewingCover && coverPage && coverPage.imageUrl) {
      return (
        <div className="relative flex flex-col items-center">
          {/* Full-screen centered cover view with entrance animation */}
          <div className="relative shadow-2xl rounded-lg overflow-hidden hover:scale-105 transition-all duration-700 animate-book-close">
            <img
              src={coverPage.imageUrl}
              alt="Book Cover"
              className="w-full h-full object-cover"
              style={{ width: '500px', height: '500px' }}
            />
            {/* Watermark for unpaid previews */}
            {!isPurchased && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="text-white/15 text-6xl font-bold rotate-[-30deg] select-none tracking-wider">
                  PREVIEW
                </div>
              </div>
            )}
            {/* "Open Book" button overlay with fade-in animation */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in-up">
              <button
                onClick={handleOpenBook}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center gap-2"
              >
                <span>Open Book</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            {/* Page label */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/30 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
              Cover
            </div>
          </div>
        </div>
      );
    }

    // COVER GENERATION LOADING STATE - Show popup overlay while cover is being generated
    // This prevents showing the blank book with "Waiting for magic..." text
    if (isViewingCover && coverPage && (!coverPage.imageUrl || coverPage.isGenerating)) {
      return (
        <div className="relative flex flex-col items-center justify-center" style={{ minHeight: '600px' }}>
          {/* Loading Popup Overlay */}
          <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md text-center animate-fade-in">
            {/* Magical Loading Spinner */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              {/* Outer spinning ring */}
              <div className="absolute inset-0 border-4 border-purple-200 rounded-full animate-spin"
                   style={{ borderTopColor: '#9333ea', animationDuration: '1.5s' }} />
              {/* Inner pulsing glow */}
              <div className="absolute inset-2 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse" />
              {/* Center sparkle icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-purple-500 animate-pulse" />
              </div>
            </div>

            {/* Loading Text */}
            <h3 className="text-2xl font-heading font-bold text-gray-800 mb-3">
              Creating Your Magical Cover ✨
            </h3>
            <p className="text-gray-600 mb-2">
              We're painting a beautiful cover just for <span className="font-semibold text-purple-600">{childName}</span>
            </p>
            <p className="text-gray-500 text-sm">
              This usually takes 10-15 seconds...
            </p>

            {/* Decorative dots */}
            <div className="flex justify-center gap-2 mt-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative flex flex-col items-center">
        {/* Flipbook container */}
        <div
          className={`relative shadow-2xl rounded-lg overflow-visible transition-all duration-500 ${
            isViewingCover ? 'scale-105' : ''
          }`}
          style={{
            perspective: '1500px',
            transformStyle: 'preserve-3d',
            minHeight: `${pageHeight}px`,
            height: `${pageHeight}px`,
            width: `${pageWidth * 2}px`, // Open book = 2 pages wide
            maxWidth: '100%',
            // Center the cover page when viewing it
            ...(isViewingCover && {
              marginLeft: 'auto',
              marginRight: 'auto',
            }),
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
          {/* Overlay Navigation Arrows - Premium Design */}
          {canGoPrev && (
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-white/50 flex items-center justify-center hover:bg-white hover:scale-110 hover:shadow-xl transition-all duration-200"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
          )}
          {canGoNext && (
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-white/50 flex items-center justify-center hover:bg-white hover:scale-110 hover:shadow-xl transition-all duration-200"
              aria-label="Next page"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          )}
        </div>

        {/* Minimal Page Indicator - Below Book */}
        <div className="flex items-center justify-center gap-4 mt-6">
          {/* Page dots */}
          <div className="flex gap-1.5">
            {visiblePages
              .filter(page => page.index !== 0) // Exclude cover only
              .slice(0, 13) // Show first 13 pages (not including cover)
              .map((page) => {
                // Find the actual index in visiblePages array for navigation
                const actualIndex = visiblePages.findIndex(p => p.index === page.index);
                return (
                  <button
                    key={page.index}
                    onClick={() => {
                      if (bookRef.current && actualIndex >= 0) {
                        bookRef.current.pageFlip().flip(actualIndex);
                      }
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      page.index === currentPage
                        ? 'bg-purple-600 w-4'
                        : page.isLocked
                        ? 'bg-gray-300'
                        : 'bg-purple-200 hover:bg-purple-300'
                    }`}
                    aria-label={`Go to page ${page.index + 1}`}
                  />
                );
              })}
            {visiblePages.length > 14 && (
              <span className="flex items-center text-gray-400 text-xs ml-2">
                <Lock className="w-3 h-3 mr-1" />+{bookStructure.lockedPageCount}
              </span>
            )}
          </div>
          {/* Page counter */}
          <span className="text-gray-600 text-sm font-medium">
            {currentVisibleIndex >= 0 ? currentVisibleIndex + 1 : 1} / {visiblePages.length}
          </span>
        </div>
      </div>
    );
  }
);

DesktopFlipbookViewer.displayName = 'DesktopFlipbookViewer';

export default DesktopFlipbookViewer;
