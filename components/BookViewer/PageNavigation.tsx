import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onGoToPage: (page: number) => void;
  isFirstPage: boolean;
  isLastPage: boolean;
}

const PageNavigation: React.FC<PageNavigationProps> = ({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onGoToPage,
  isFirstPage,
  isLastPage,
}) => {
  // Generate page dots (show max 12 dots to avoid clutter)
  const maxDots = 12;
  const showDots = totalPages <= maxDots;

  const renderDots = () => {
    if (!showDots) return null;

    return Array.from({ length: totalPages }, (_, i) => (
      <button
        key={i}
        onClick={() => onGoToPage(i)}
        className={`page-dot transition-all duration-200 ${
          i === currentPage ? 'active' : ''
        }`}
        style={{
          width: i === currentPage ? '12px' : '8px',
          height: i === currentPage ? '12px' : '8px',
          borderRadius: '50%',
          background: i === currentPage ? '#7c3aed' : '#ddd',
          border: 'none',
          cursor: 'pointer',
          transform: i === currentPage ? 'scale(1.3)' : 'scale(1)',
        }}
        aria-label={`Go to page ${i + 1}`}
      />
    ));
  };

  return (
    <div className="page-navigation flex items-center justify-center gap-4 mt-6 flex-wrap">
      {/* Previous button */}
      <button
        onClick={onPrev}
        disabled={isFirstPage}
        className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-all ${
          isFirstPage
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
        }`}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Prev</span>
      </button>

      {/* Page dots */}
      {showDots && (
        <div className="flex items-center gap-2 px-2">
          {renderDots()}
        </div>
      )}

      {/* Page counter */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-600">
          Page
        </span>
        <span className="text-sm font-bold text-primary">
          {currentPage + 1}
        </span>
        <span className="text-sm text-gray-400">
          of {totalPages}
        </span>
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={isLastPage}
        className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-all ${
          isLastPage
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
        }`}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default PageNavigation;
