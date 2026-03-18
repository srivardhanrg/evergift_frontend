import React, { useState, useCallback, useRef, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { useBookNavigation } from '../../hooks/useBookNavigation';
import { useResponsive } from '../../hooks/useResponsive';
import {
  MOCK_SAFARI_THEME_CONFIG,
  BOOK_CONFIG,
} from '../../constants/bookViewer.constants';
import BookCover from './BookCover';
import GeneratedPage from './GeneratedPage';
import TemplatePage from './TemplatePage';
import PageNavigation from './PageNavigation';
import type { GeneratedPage as GeneratedPageType } from '../../types/book.types';

interface BookViewerProps {
  previewId: string;
  childName: string;
  theme: string;
  coverUrl: string;
  generatedPages: GeneratedPageType[];
  isPaid: boolean;
  onPageChange?: (page: number) => void;
}

// Page wrapper component with forwardRef for react-pageflip
const PageWrapper = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => {
    return (
      <div ref={ref} className="book-page">
        {children}
      </div>
    );
  }
);
PageWrapper.displayName = 'PageWrapper';

const BookViewer: React.FC<BookViewerProps> = ({
  previewId,
  childName,
  theme,
  coverUrl,
  generatedPages,
  isPaid,
  onPageChange,
}) => {
  const { isMobile } = useResponsive();
  const bookRef = useRef<any>(null);
  const [isBookOpen, setIsBookOpen] = useState(false);

  // Use mock theme config for now
  const themeConfig = MOCK_SAFARI_THEME_CONFIG;

  const {
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    isFirstPage,
    isLastPage,
  } = useBookNavigation(themeConfig.totalPages);

  // Handle page flip from react-pageflip
  const handleFlip = useCallback((e: any) => {
    const newPage = e.data;
    goToPage(newPage);
    onPageChange?.(newPage);
  }, [goToPage, onPageChange]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isBookOpen) return;

    if (e.key === 'ArrowLeft') {
      prevPage();
      bookRef.current?.pageFlip()?.flipPrev();
    } else if (e.key === 'ArrowRight') {
      nextPage();
      bookRef.current?.pageFlip()?.flipNext();
    }
  }, [isBookOpen, prevPage, nextPage]);

  // Attach keyboard listeners
  React.useEffect(() => {
    if (isBookOpen && !isMobile) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isBookOpen, isMobile, handleKeyDown]);

  const handleOpenBook = () => {
    setIsBookOpen(true);
  };

  // Build pages array combining generated and template pages
  const buildPages = () => {
    const pages = [];

    // Create a map of generated pages by page number for quick lookup
    const generatedMap = new Map(
      generatedPages.map(p => [p.pageNumber, p.imageUrl])
    );

    for (let i = 0; i < themeConfig.pages.length; i++) {
      const pageConfig = themeConfig.pages[i];
      const pageNumber = pageConfig.pageNumber;

      if (pageConfig.pageType === 'generated') {
        const imageUrl = generatedMap.get(pageNumber);
        if (imageUrl) {
          pages.push(
            <PageWrapper key={`page-${pageNumber}`}>
              <GeneratedPage
                pageNumber={pageNumber}
                imageUrl={imageUrl}
                showWatermark={!isPaid && pageNumber <= BOOK_CONFIG.WATERMARK_PAGE_LIMIT}
              />
            </PageWrapper>
          );
        }
      } else if (pageConfig.pageType === 'constant') {
        pages.push(
          <PageWrapper key={`page-${pageNumber}`}>
            <TemplatePage
              pageNumber={pageNumber}
              templateUrl={pageConfig.templateUrl}
              storyText={pageConfig.storyText}
              textConfig={pageConfig.textConfig}
              childName={childName}
              showWatermark={!isPaid && pageNumber <= BOOK_CONFIG.WATERMARK_PAGE_LIMIT}
            />
          </PageWrapper>
        );
      }
    }

    return pages;
  };

  // Show cover before opening book
  if (!isBookOpen) {
    return (
      <BookCover
        coverUrl={coverUrl}
        childName={childName}
        themeTitle={themeConfig.themeTitle}
        onOpen={handleOpenBook}
      />
    );
  }

  // Render book with react-pageflip
  return (
    <div className="book-viewer-container flex flex-col items-center justify-center min-h-[70vh] p-4">
      <div className="mb-6">
        <HTMLFlipBook
          width={isMobile ? BOOK_CONFIG.PAGE_DIMENSIONS.width : BOOK_CONFIG.PAGE_DIMENSIONS.desktopWidth}
          height={isMobile ? BOOK_CONFIG.PAGE_DIMENSIONS.height : BOOK_CONFIG.PAGE_DIMENSIONS.desktopHeight}
          size="stretch"
          minWidth={300}
          maxWidth={600}
          minHeight={400}
          maxHeight={700}
          showCover={false}
          mobileScrollSupport={true}
          onFlip={handleFlip}
          className="book-flip shadow-2xl"
          ref={bookRef}
          usePortrait={isMobile}
          startPage={0}
          drawShadow={true}
          flippingTime={BOOK_CONFIG.ANIMATION.duration}
          useMouseEvents={true}
          swipeDistance={BOOK_CONFIG.ANIMATION.swipeThreshold}
          showPageCorners={true}
          disableFlipByClick={false}
          startZIndex={0}
          autoSize={true}
          maxShadowOpacity={0.5}
          clickEventForward={true}
          style={{}}
        >
          {buildPages()}
        </HTMLFlipBook>
      </div>

      <PageNavigation
        currentPage={currentPage}
        totalPages={totalPages}
        onPrev={() => {
          prevPage();
          bookRef.current?.pageFlip()?.flipPrev();
        }}
        onNext={() => {
          nextPage();
          bookRef.current?.pageFlip()?.flipNext();
        }}
        onGoToPage={(page) => {
          goToPage(page);
          bookRef.current?.pageFlip()?.flip(page);
        }}
        isFirstPage={isFirstPage}
        isLastPage={isLastPage}
      />

      {/* Keyboard hint for desktop */}
      {!isMobile && (
        <div className="mt-4 text-xs text-gray-400 text-center">
          <kbd className="px-2 py-1 bg-gray-100 rounded">←</kbd>
          {' '}and{' '}
          <kbd className="px-2 py-1 bg-gray-100 rounded">→</kbd>
          {' '}to navigate
        </div>
      )}
    </div>
  );
};

export default BookViewer;
