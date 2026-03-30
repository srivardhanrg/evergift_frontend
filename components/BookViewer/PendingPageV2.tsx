import React, { useEffect, useState } from 'react';
import type { BookPageInfoV2 } from '../../types/book.types';

/**
 * PendingPageV2 - Enhanced loading state for pages waiting to be generated
 *
 * Shows a visually engaging loading state while a page is queued but not yet started.
 * Used in both desktop flipbook and mobile scroll viewer.
 *
 * Features:
 * - Rotating messages (different for cover vs regular pages) with fade transitions
 * - Animated gradient shimmer background cycling through colors
 * - Paintbrush emoji with double pulse ring animation
 * - Floating particle effects (reused from GeneratingPageV2)
 */

interface PendingPageV2Props {
  page: BookPageInfoV2;
}

/**
 * Get display label for a page based on its index.
 * Cover (index 0) shows "Cover", others show "Page {index}"
 */
function getPageLabel(index: number): string {
  if (index === 0) return 'Cover';
  return `Page ${index}`;
}

// Cover-specific messages - shown when page.index === 0
const COVER_MESSAGES = [
  "✨ Designing your magical cover...",
  "🎨 Painting your personalized masterpiece...",
  "🌟 Creating your story's grand entrance...",
  "📖 Preparing your book's first impression...",
];

// Regular page messages - shown for all other pages
const PAGE_MESSAGES = [
  "✨ Your page is coming next...",
  "🪄 Getting ready to create magic...",
  "🎨 Preparing your next adventure...",
  "⭐ Almost time for this page...",
];

const PendingPageV2: React.FC<PendingPageV2Props> = ({ page }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Determine if this is the cover page
  const isCover = page.pageType === 'cover' || page.index === 0;
  const messages = isCover ? COVER_MESSAGES : PAGE_MESSAGES;

  // Rotate messages every 3 seconds with fade transitions
  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setIsVisible(false);

      // Wait for fade, then change message and fade in
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
        setIsVisible(true);
      }, 300); // 300ms fade duration
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden animate-gradient-shimmer">
      {/* Animated gradient background - cycles through colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 animate-gradient-shimmer" />

      {/* Floating sparkle particles - reused from GeneratingPageV2 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-yellow-300 rounded-full animate-bounce"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 30}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${2.5 + (i % 3)}s`,
              opacity: 0.6 + (i % 3) * 0.15,
            }}
          />
        ))}
      </div>

      {/* Page indicator badge */}
      <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1">
        <span className="text-purple-600 text-xs font-medium">
          {getPageLabel(page.index)}
        </span>
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        {/* Paintbrush emoji with double pulse rings */}
        <div className="relative mb-6">
          {/* Outer pulse ring - slow sonar ping */}
          <div className="absolute inset-0 -inset-8 border-4 border-purple-300/40 rounded-full animate-ping" style={{ animationDuration: '2s' }} />

          {/* Inner pulse ring - faster pulse */}
          <div className="absolute inset-0 -inset-4 border-3 border-pink-300/50 rounded-full animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />

          {/* Paintbrush emoji container */}
          <div className="relative w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-5xl animate-pulse" role="img" aria-label="paintbrush">
              🎨
            </span>
          </div>
        </div>

        {/* Rotating message with fade transition */}
        <div className="text-center">
          <p
            className={`text-gray-600 font-medium text-sm transition-opacity duration-300 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {messages[messageIndex]}
          </p>
          <p className="text-gray-400 text-xs mt-1">Please wait a moment</p>
        </div>
      </div>

      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-purple-200/40 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-pink-200/40 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 border-purple-200/40 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-pink-200/40 rounded-br-lg" />
    </div>
  );
};

export default PendingPageV2;
