import React, { useEffect, useState } from 'react';
import { Sparkles, Wand2, Palette, Stars } from 'lucide-react';
import type { GeneratingPageProps } from '../../types/book.types';

/**
 * GeneratingPageV2 - Loading state for pages being AI-generated
 *
 * Shows an animated loading state while an AI page is being generated.
 * Used in both desktop flipbook and mobile scroll viewer.
 *
 * Features:
 * - Animated magic wand icon
 * - Progress indicator
 * - Step description
 * - Floating particle effects
 */

/**
 * Get display label for a page based on its index.
 * Cover (index 0) shows "Cover", others show "Page {index}"
 */
function getPageLabel(index: number): string {
  if (index === 0) return 'Cover';
  return `Page ${index}`;
}

const GeneratingPageV2: React.FC<GeneratingPageProps> = ({
  page,
  progress,
  stepDescription = 'Creating your magical page...',
}) => {
  const [dots, setDots] = useState('');

  // Animate dots for loading text
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Get page-specific message
  const getPageMessage = (): string => {
    if (page.pageType === 'cover') {
      return 'Painting your personalized cover';
    }
    if (page.pageType === 'generated') {
      const aiPageNum = Math.floor((page.index - 4) / 2) + 1;
      const messages = [
        'Bringing characters to life',
        'Adding magical details',
        'Creating the perfect scene',
        'Weaving story magic',
        'Painting with imagination',
      ];
      return messages[(aiPageNum - 1) % messages.length];
    }
    return 'Preparing your page';
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />

        {/* Moving light beams */}
        <div
          className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-transparent via-purple-400/20 to-transparent animate-pulse"
          style={{ animationDuration: '2s' }}
        />
        <div
          className="absolute top-0 right-1/3 w-0.5 h-full bg-gradient-to-b from-transparent via-pink-400/20 to-transparent animate-pulse"
          style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}
        />
        <div
          className="absolute top-0 left-1/2 w-0.5 h-full bg-gradient-to-b from-transparent via-blue-400/20 to-transparent animate-pulse"
          style={{ animationDuration: '3s', animationDelay: '1s' }}
        />
      </div>

      {/* Floating sparkle particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-yellow-300 rounded-full animate-float-up"
            style={{
              left: `${8 + i * 8}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + (i % 4)}s`,
              opacity: 0.6 + (i % 3) * 0.15,
            }}
          />
        ))}
      </div>

      {/* Page indicator */}
      <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
        <Wand2 className="w-3 h-3 text-yellow-300 animate-pulse" />
        <span className="text-white/90 text-xs font-medium">
          {getPageLabel(page.index)}
        </span>
      </div>

      {/* Progress badge */}
      <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full px-3 py-1">
        <span className="text-white text-xs font-bold">{progress}%</span>
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        {/* Animated icon container */}
        <div className="relative mb-6">
          {/* Pulsing ring */}
          <div className="absolute inset-0 border-4 border-purple-400/30 rounded-full animate-ping" />
          <div
            className="absolute inset-0 border-2 border-pink-400/40 rounded-full animate-ping"
            style={{ animationDelay: '0.5s' }}
          />

          {/* Main icon */}
          <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
            <Wand2 className="w-10 h-10 text-white animate-bounce" />

            {/* Orbiting sparkles */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
              <Sparkles className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 text-yellow-300" />
            </div>
            <div
              className="absolute inset-0 animate-spin"
              style={{ animationDuration: '4s', animationDirection: 'reverse' }}
            >
              <Stars className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 text-pink-300" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="text-center">
          <p className="text-white font-semibold text-lg mb-2">
            {getPageMessage()}
            {dots}
          </p>
          <p className="text-white/70 text-sm">{stepDescription}</p>
        </div>

        {/* Story snippet preview (if available) */}
        {page.storyText && (
          <div className="mt-4 max-w-xs mx-auto">
            <p className="text-white/60 text-sm italic leading-relaxed animate-fade-in">
              "{page.storyText.substring(0, 80)}..."
            </p>
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-6 w-48">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-white/50 text-xs">Creating magic</span>
            <span className="text-white/50 text-xs">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-white/20 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-white/20 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-white/20 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-white/20 rounded-br-lg" />
    </div>
  );
};

export default GeneratingPageV2;
