import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Lock, Sparkles, Loader2 } from 'lucide-react';
import type { BookPageInfoV2, BookStructureV2, BookStyle } from '../../types/book.types';
import LockedPageV2 from './LockedPageV2';
import GeneratingPageV2 from './GeneratingPageV2';

/**
 * Get display label for a page based on its index.
 * Cover (index 0) shows "Cover", others show "Page {index}"
 */
function getPageLabel(index: number): string {
  if (index === 0) return 'Cover';
  return `Page ${index}`;
}

/** Single page image with skeleton loading.
 * Uses absolute inset-0 so it fills the relative-positioned page container
 * without depending on a height:100% chain that may not resolve in all contexts.
 */
const MobilePageImage: React.FC<{
  imageUrl: string;
  pageIndex: number;
  isPurchased: boolean;
  isPreview?: boolean;
}> = ({ imageUrl, pageIndex, isPurchased, isPreview }) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Handle cached images: onLoad won't fire if browser already has image
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50" />
      )}
      <img
        ref={imgRef}
        src={imageUrl}
        alt={`Page ${pageIndex + 1}`}
        className="absolute inset-0 w-full h-full object-contain"
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.25s ease-out' }}
        loading={pageIndex <= 2 ? 'eager' : 'lazy'}
        // @ts-ignore
        fetchpriority={pageIndex === 0 ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
      {!isPurchased && isPreview && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="text-white/20 text-4xl font-bold rotate-[-30deg] select-none">PREVIEW</div>
        </div>
      )}
    </>
  );
};

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
  const [showClosingAnimation, setShowClosingAnimation] = useState(false);
  const hasShownClosingRef = useRef(false);
  // Track last user touch so auto-advance doesn't interrupt active swiping
  const lastUserTouchTimeRef = useRef<number>(0);

  // Get pages to display
  // Show ALL preview pages during generation (they'll render appropriate states)
  // For locked pages, only show if purchased or if showing locked indicator
  const firstPendingAiPage = bookStructure.pages.find(
    p => (p.pageType === 'ai_page' || p.pageType === 'cover') && !p.isGenerated
  );
  const maxVisibleIndex = firstPendingAiPage ? firstPendingAiPage.index : 999;

  const visiblePages = bookStructure.pages.filter((page) => {
    // Hide the plain white end_page (index 24) — blank filler, not shown to users
    if (page.pageType === 'end_page') return false;

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

  // Record last user touch so auto-advance can check before scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const onTouchStart = () => { lastUserTouchTimeRef.current = Date.now(); };
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    return () => container.removeEventListener('touchstart', onTouchStart);
  }, []);

  // Scroll to page when currentPage changes externally (visiblePages intentionally excluded
  // to avoid re-firing on every generation tick when pages array reference changes)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Auto-advance to newly generated page (forward-only)
  const prevCompletedRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    // Build a set of currently completed page indices
    const completedIndices = new Set(
      bookStructure.pages
        .filter(p => p.imageUrl && !p.isLocked && !p.isGenerating)
        .map(p => p.index)
    );

    // Diff against previous snapshot to find truly new pages
    const newIndices = [...completedIndices].filter(i => !prevCompletedRef.current.has(i));

    if (newIndices.length > 0 && prevCompletedRef.current.size > 0) {
      // Pick the highest-index newly completed page so we always advance forward
      const highestNewIndex = Math.max(...newIndices);
      const pageIndex = visiblePages.findIndex(p => p.index === highestNewIndex);

      if (pageIndex >= 0 && scrollContainerRef.current) {
        setTimeout(() => {
          if (Date.now() - lastUserTouchTimeRef.current < 3000) return;
          const container = scrollContainerRef.current!;
          const targetLeft = pageIndex * container.clientWidth;
          // Forward-only guard — never scroll left of current position during generation
          if (targetLeft <= container.scrollLeft) return;
          container.scrollTo({ left: targetLeft, behavior: 'smooth' });
          if ('vibrate' in navigator) navigator.vibrate(100);
        }, 800);
      }
    }

    prevCompletedRef.current = completedIndices;
  }, [bookStructure.pages, visiblePages]);

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
          // Trigger "The End" closing animation when reaching back cover (purchased users, once only)
          if (newPage.pageType === 'back_cover' && isPurchased && !hasShownClosingRef.current) {
            hasShownClosingRef.current = true;
            setShowClosingAnimation(true);
            setTimeout(() => setShowClosingAnimation(false), 1800);
          }
        }
      }
    }
  }, [visiblePages, visiblePage, onPageChange, isPurchased]);

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
  const activeSpreadIndex = spreads.findIndex(spread => spread.some(p => p.index === visiblePage));

  // Render a single page
  // Render a single page content based on page state
  const renderPage = (page: BookPageInfoV2) => {
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
          compact
        />
      );
    }

    // 3. Has image - render the actual page content
    if (page.imageUrl) {
      return <MobilePageImage imageUrl={page.imageUrl} pageIndex={page.index} isPurchased={isPurchased} isPreview={page.isPreview} />;
    }

    // 4. Filler page without URL - show themed loading state
    // Filler pages (dedication, intro, text) are processed at ~90% progress
    if (page.isFiller) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="relative mb-3">
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin mx-auto" />
              <Sparkles className="w-4 h-4 text-pink-400 absolute -top-1 -right-1 animate-pulse" />
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
        <div className="text-center px-4">
          <Sparkles className="w-8 h-8 text-purple-300 mx-auto mb-2 opacity-50" />
          <p className="text-gray-500 font-medium text-sm mb-1">Waiting for magic...</p>
          <p className="text-gray-400 text-xs">{getPageLabel(page.index)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full">
      {/* "The End" book-closing animation overlay (purchased users only, plays once) */}
      {showClosingAnimation && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center animate-book-close-overlay"
          style={{ background: 'rgba(15, 5, 30, 0.92)' }}
        >
          <div className="animate-the-end-text text-center select-none">
            <div className="text-5xl mb-4">✨</div>
            <div className="text-white font-heading font-bold" style={{ fontSize: '2rem' }}>The End</div>
          </div>
        </div>
      )}

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
            <div className="relative w-full h-full bg-white shadow-lg overflow-hidden">
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

      {/* Segmented Progress Bar */}
      <div className="flex items-center gap-1 mt-4 w-full px-3">
        {spreads.map((spread, i) => {
          const isActive = i === activeSpreadIndex;
          const isGenerating = spread.some(p => p.isGenerating);
          const isPast = i < activeSpreadIndex;
          const hasContent = spread.some(p => p.imageUrl && !p.isGenerating);
          return (
            <button
              key={i}
              onClick={() => onPageChange(spread[0].index)}
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
};

export default MobileScrollViewer;
