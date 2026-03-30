import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { ChevronLeft, ChevronRight, Lock, Sparkles, Loader2 } from 'lucide-react';
import type { BookPageInfoV2, BookStructureV2, BookStyle } from '../../types/book.types';
import LockedPageV2 from './LockedPageV2';
import GeneratingPageV2 from './GeneratingPageV2';
import PendingPageV2 from './PendingPageV2';

// CRITICAL: Import react-pageflip CSS for proper positioning
import 'page-flip/src/Style/stPageFlip.css';
import '../../styles/bookViewer.css';

/**
 * Desktop page image with skeleton loading.
 * Renders directly into the parent's position:relative context (no extra wrapper div
 * that could break height:100% chains in react-pageflip's absolute-positioned pages).
 */
const DesktopPageImage: React.FC<{ src: string; pageIndex: number }> = ({ src, pageIndex }) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Handle cached images: onLoad won't fire if the browser already has the image
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  return (
    <>
      {!loaded && (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50"
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={`Page ${pageIndex + 1}`}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.25s ease-out',
        }}
        loading={pageIndex <= 2 ? 'eager' : 'lazy'}
        // @ts-ignore
        fetchpriority={pageIndex === 0 ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </>
  );
};

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
    const [showClosingAnimation, setShowClosingAnimation] = useState(false);
    const [isCoverHovered, setIsCoverHovered] = useState(false);
    const hasShownClosingRef = useRef(false);
    // Track last user interaction so auto-flip doesn't interrupt active page turns
    const lastUserInteractionTimeRef = useRef<number>(0);

    const handleUserInteraction = useCallback(() => {
      lastUserInteractionTimeRef.current = Date.now();
    }, []);

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
    const firstPendingAiPage = bookStructure.pages.find(
      p => (p.pageType === 'ai_page' || p.pageType === 'cover') && !p.isGenerated
    );
    const maxVisibleIndex = firstPendingAiPage ? firstPendingAiPage.index : 999;

    const filteredPages = bookStructure.pages.filter((page) => {
      // Hide the plain white end_page (index 24) — it's a blank filler, not shown to users
      if (page.pageType === 'end_page') return false;

      // Only show pages sequentially up to the current active AI page
      if (page.index > maxVisibleIndex) return false;

      // Always show preview pages (indices 0-12) - they're part of the free preview
      if (page.isPreview) return true;
      // For locked pages (indices 13-25):
      // - Show if purchased (user has access)
      // - Show if has imageUrl (already generated)
      // - Show to indicate locked state for purchase CTA
      if (page.isLocked) return isPurchased || page.imageUrl || page.index === 14 || page.index === 15;
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
          pageType: 'blank' as any,
          imageUrl: null,
          storyText: null,
          isPreview: true,
          isLocked: false,
          isFiller: false,
          isGenerating: false,
          isGenerated: true,
          requiresTextOverlay: false,
          textPageNumber: null
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
            // Don't interrupt if user interacted with the book in the last 5 seconds
            if (Date.now() - lastUserInteractionTimeRef.current < 5000) return;
            if (bookRef.current) {
              bookRef.current.pageFlip().flip(newPageIndex);
            }
          }, 2500);
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
            // Trigger "The End" closing animation when reaching back cover (purchased users, once only)
            if (page.pageType === 'back_cover' && isPurchased && !hasShownClosingRef.current) {
              hasShownClosingRef.current = true;
              setShowClosingAnimation(true);
              setTimeout(() => setShowClosingAnimation(false), 1800);
            }
          }
        }
      },
      [visiblePages, onPageChange, isPurchased]
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

    // Render a single page content based on page state
    const renderPageContent = (page: BookPageInfoV2) => {
      // 0. Blank page (virtual page for book opening UX)
      if (page.pageType === ('blank' as any) || page.index === -1) {
        return <div className="w-full h-full bg-white" />;
      }

      // 1. Generating state - AI page currently being created
      if (page.isGenerating) {
        if (page.index === 0) {
          return (
            <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 max-w-md text-center animate-fade-in mx-4">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 border-4 border-purple-200 rounded-full animate-spin"
                       style={{ borderTopColor: '#9333ea', animationDuration: '1.5s' }} />
                  <div className="absolute inset-2 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-purple-500 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-2xl font-heading font-bold text-gray-800 mb-3">
                  Creating Your Magical Cover ✨
                </h3>
                <p className="text-gray-600 mb-2">
                  We're painting a beautiful cover just for <span className="font-semibold text-purple-600">{childName}</span>
                </p>
                <p className="text-gray-500 text-sm">
                  This usually takes 10-15 seconds...
                </p>
              </div>
            </div>
          );
        }
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
          <div
            className="relative w-full h-full overflow-hidden"
            onMouseEnter={page.index === 0 ? () => setIsCoverHovered(true) : undefined}
            onMouseLeave={page.index === 0 ? () => setIsCoverHovered(false) : undefined}
          >
            <DesktopPageImage src={page.imageUrl} pageIndex={page.index} />
            {/* Cover: hover-reveal vignette + ghost button */}
            {page.index === 0 && (
              <>
                {/* Dark vignette — fades in on hover */}
                <div
                  className="absolute inset-x-0 bottom-0 pointer-events-none transition-opacity duration-400"
                  style={{
                    top: '40%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
                    opacity: isCoverHovered ? 1 : 0,
                  }}
                />
                {/* Ghost button (always visible, small) — becomes full on hover */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-auto z-50">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (bookRef.current) bookRef.current.pageFlip().flipNext();
                    }}
                    className="flex items-center gap-2 rounded-full font-bold transition-all duration-400"
                    style={{
                      padding: isCoverHovered ? '10px 28px' : '7px 18px',
                      fontSize: isCoverHovered ? '1rem' : '0.8rem',
                      background: isCoverHovered
                        ? 'linear-gradient(to right, #9333ea, #ec4899)'
                        : 'rgba(255,255,255,0.18)',
                      backdropFilter: 'blur(8px)',
                      border: isCoverHovered ? '1.5px solid transparent' : '1.5px solid rgba(255,255,255,0.5)',
                      color: '#fff',
                      boxShadow: isCoverHovered
                        ? '0 8px 32px rgba(147,51,234,0.45)'
                        : '0 2px 12px rgba(0,0,0,0.25)',
                    }}
                  >
                    <span>Open Book</span>
                    <ChevronRight style={{ width: isCoverHovered ? '20px' : '14px', height: isCoverHovered ? '20px' : '14px', transition: 'all 0.4s' }} />
                  </button>
                </div>
              </>
            )}
            
            {/* Watermark for unpaid previews */}
            {!isPurchased && page.isPreview && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="text-white/15 text-6xl font-bold rotate-[-30deg] select-none tracking-wider">
                  PREVIEW
                </div>
              </div>
            )}
            {/* Page number indicator */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/30 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
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
      return <PendingPageV2 page={page} />;
    };

    const currentVisibleIndex = visiblePages.findIndex((p) => p.index === currentPage);
    const canGoPrev = currentVisibleIndex > 0;
    const canGoNext = currentVisibleIndex < visiblePages.length - 1;

    // Stable indicator values
    const displayTotal = isPurchased ? bookStructure.totalPages : bookStructure.previewPageCount;
    const displayPosition = currentVisibleIndex >= 0 ? currentVisibleIndex + 1 : 1;

    // Segmented progress bar — group pages into spreads (pairs)
    const indicatorPages = (isPurchased
      ? bookStructure.pages.filter(p => p.pageType !== 'end_page')
      : bookStructure.pages.filter(p => p.isPreview)
    ).sort((a, b) => a.index - b.index);
    const spreads: BookPageInfoV2[][] = [];
    for (let i = 0; i < indicatorPages.length; i += 2) {
      spreads.push(indicatorPages.slice(i, Math.min(i + 2, indicatorPages.length)));
    }
    const lockedSpreadCount = isPurchased
      ? 0
      : Math.ceil(bookStructure.pages.filter(p => p.isLocked && p.pageType !== 'end_page').length / 2);
    const activeSpreadIndex = spreads.findIndex(spread => spread.some(p => p.index === currentPage));

    // Check if we're viewing the cover (page 0)
    const isViewingCover = currentVisibleIndex === 0;
    // Check if we're viewing the back cover (last page, pageType = 'back_cover')
    const isViewingBackCover = visiblePages[currentVisibleIndex]?.pageType === 'back_cover';

    return (
      <div className="relative flex flex-col items-center justify-center w-full overflow-hidden">
        {/* Flipbook container */}
        <div
          className="relative rounded-lg overflow-visible transition-transform duration-[600ms] ease-out"
          onMouseDown={handleUserInteraction}
          onTouchStart={handleUserInteraction}
          style={{
            transform: isViewingCover
              ? `translateX(-${pageWidth / 2}px)`
              : isViewingBackCover
              ? `translateX(${pageWidth / 2}px)`
              : 'translateX(0)',
            perspective: '1500px',
            transformStyle: 'preserve-3d',
            minHeight: `${pageHeight}px`,
            height: `${pageHeight}px`,
            width: `${pageWidth * 2}px`, // Open book = 2 pages wide
            maxWidth: '100%',
          }}
        >
          {/* Dynamic book shadow — resizes to only cover visible pages (no shadow bleed under cover/backcover masks) */}
          <div
            className="absolute top-0 rounded-lg shadow-2xl pointer-events-none"
            style={{
              left: isViewingCover ? `${pageWidth}px` : '0',
              width: (isViewingCover || isViewingBackCover) ? `${pageWidth}px` : `${pageWidth * 2}px`,
              height: '100%',
              transition: 'left 600ms ease-out, width 600ms ease-out',
            }}
          />
          {/* Book spine gradient effect */}
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
            swipeDistance={50}
            disableFlipByClick={false}
          >
            {visiblePages.map((page) => (
              <Page key={page.index}>{renderPageContent(page)}</Page>
            ))}
          </HTMLFlipBook>
          {/* Cover mask: hides the blank virtual page on the left when viewing cover */}
          {isViewingCover && (
            <div
              className="absolute top-0 left-0 h-full bg-gray-50 z-30 pointer-events-none"
              style={{ width: `${pageWidth}px` }}
            />
          )}
          {/* Back cover mask: hides the empty page slot on the right when viewing back cover */}
          {isViewingBackCover && (
            <div
              className="absolute top-0 right-0 h-full bg-gray-50 z-30 pointer-events-none"
              style={{ width: `${pageWidth}px` }}
            />
          )}

          {/* "The End" book-closing animation overlay (purchased users only, plays once) */}
          {showClosingAnimation && (
            <div
              className="absolute inset-0 z-50 flex flex-col items-center justify-center animate-book-close-overlay"
              style={{ background: 'rgba(15, 5, 30, 0.92)' }}
            >
              <div className="animate-the-end-text text-center select-none">
                <div className="text-6xl mb-5">✨</div>
                <div className="text-white font-heading font-bold" style={{ fontSize: '2.5rem' }}>The End</div>
              </div>
            </div>
          )}

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

        {/* Segmented Progress Bar */}
        <div className="flex items-center gap-1 mt-5 w-full max-w-[520px] px-3">
          {spreads.map((spread, i) => {
            const isActive = i === activeSpreadIndex;
            const isGenerating = spread.some(p => p.isGenerating);
            const isPast = i < activeSpreadIndex;
            const hasContent = spread.some(p => p.imageUrl && !p.isGenerating);
            return (
              <button
                key={i}
                onClick={() => {
                  const targetIndex = visiblePages.findIndex(p => p.index === spread[0].index);
                  if (bookRef.current && targetIndex >= 0) bookRef.current.pageFlip().flip(targetIndex);
                }}
                className="flex-1 min-w-0 rounded-full cursor-pointer transition-all duration-300"
                style={{
                  height: isActive ? '6px' : '4px',
                  background: isActive
                    ? 'linear-gradient(to right, #9333ea, #ec4899)'
                    : isGenerating
                    ? '#f9a8d4'
                    : isPast || hasContent
                    ? '#c4b5fd'
                    : '#e5e7eb',
                  boxShadow: isActive ? '0 0 8px rgba(147,51,234,0.4)' : 'none',
                }}
                aria-label={`Go to spread ${i + 1}`}
              />
            );
          })}
          {/* Locked zone — proportional width, clickable to purchase */}
          {lockedSpreadCount > 0 && (
            <button
              onClick={onPurchaseClick}
              className="flex items-center gap-1 min-w-0 group"
              style={{ flex: lockedSpreadCount }}
              aria-label="Unlock full story"
            >
              <div className="flex-1 h-1 rounded-full bg-gray-200 group-hover:bg-gray-300 transition-colors min-w-0" />
              <Lock className="w-3 h-3 text-gray-400 group-hover:text-purple-400 flex-shrink-0 transition-colors" />
            </button>
          )}
          {/* Page counter */}
          <span className="text-gray-500 text-xs font-medium ml-2 whitespace-nowrap flex-shrink-0">
            {displayPosition}/{displayTotal}
          </span>
        </div>
      </div>
    );
  }
);

DesktopFlipbookViewer.displayName = 'DesktopFlipbookViewer';

export default DesktopFlipbookViewer;
