import React, { useState } from 'react';
import { Lock, Sparkles, Crown } from 'lucide-react';
import type { BookPageInfoV2, LockedPageProps } from '../../types/book.types';

/**
 * LockedPageV2 - Locked page overlay for 26-page book viewer
 *
 * Used in both desktop flipbook and mobile scroll viewer
 * to display locked pages (indices 13-25) before purchase.
 *
 * Features:
 * - Blurred magical background
 * - Lock icon with pulse animation
 * - Page number indicator
 * - Unlock CTA button
 */

/**
 * Get display label for a page based on its index.
 * Cover (index 0) shows "Cover", others show "Page {index}"
 */
function getPageLabel(index: number): string {
  if (index === 0) return 'Cover';
  return `Page ${index}`;
}

interface LockedPageV2Props extends LockedPageProps {
  childName?: string;
  compact?: boolean; // For mobile view
}

const LockedPageV2: React.FC<LockedPageV2Props> = ({
  page,
  totalLockedPages,
  onPurchaseClick,
  childName = 'your child',
  compact = false,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  // Get personalized teaser based on page type
  const getTeaser = (): string => {
    if (page.pageType === 'text') {
      return page.storyText?.slice(0, 60) + '...' || 'More story awaits...';
    }
    if (page.pageType === 'generated') {
      const aiPageNum = Math.floor((page.index - 4) / 2) + 1;
      return `${childName}'s adventure continues in scene ${aiPageNum}...`;
    }
    if (page.pageType === 'end_page') {
      return `${childName}'s magical ending...`;
    }
    if (page.pageType === 'back_cover') {
      return 'The perfect keepsake...';
    }
    return 'More magic awaits...';
  };

  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br from-purple-900 via-indigo-800 to-pink-900 overflow-hidden ${
        compact ? 'rounded-lg' : 'rounded-none'
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-pink-500/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-24 h-24 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '0.5s' }}
        />
      </div>

      {/* Floating sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-float-up opacity-60"
            style={{
              left: `${15 + i * 14}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2.5 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      {/* Page indicator */}
      <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
        <Lock className="w-3 h-3 text-white/80" />
        <span className="text-white/90 text-xs font-medium">
          {getPageLabel(page.index)}
        </span>
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        {/* Glowing lock icon */}
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl animate-pulse" />
          <div
            className={`relative ${compact ? 'w-12 h-12' : 'w-16 h-16'} bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-lg transition-transform duration-300 ${
              isHovering ? 'scale-110' : ''
            }`}
          >
            <Lock
              className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} text-white transition-transform duration-300 ${
                isHovering ? 'scale-90' : ''
              }`}
            />
          </div>
        </div>

        {/* Simple unlock message */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl px-6 py-4 max-w-xs text-center border border-white/10">
          <p className="text-white text-base font-medium">
            Purchase to unlock full storybook
          </p>
        </div>
      </div>

      {/* Badge for special pages */}
      {page.pageType === 'end_page' && (
        <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          Grand Finale!
        </div>
      )}
    </div>
  );
};

export default LockedPageV2;
