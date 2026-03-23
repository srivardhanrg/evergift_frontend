import React, { useState } from 'react';
import { Loader2, Lock, Sparkles } from 'lucide-react';

export type PageCardState = 'completed' | 'generating' | 'pending';

export interface BookPageCardProps {
    pageNumber: number;
    state: PageCardState;
    imageUrl?: string;
    storyText?: string;
    className?: string;
    /** Custom generating message to display */
    generatingMessage?: string;
    /** If true, this is the cover page (uses "Cover" label instead of "Page X") */
    isCover?: boolean;
}

/**
 * Reusable card component for displaying book pages in different states.
 * Matches the PDF layout: 80% image, 20% text section (5:4 aspect ratio for image)
 * 
 * Used in both GenerationFeed (during creation) and PreviewStory (after completion).
 * 
 * UNIFIED: Same size everywhere for consistent UX.
 */
const BookPageCard: React.FC<BookPageCardProps> = ({
    pageNumber,
    state,
    imageUrl,
    storyText,
    className = '',
    generatingMessage = "Creating magic...",
    isCover = false
}) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Dynamic label based on isCover
    const pageLabel = isCover ? 'Cover' : `Page ${pageNumber}`;

    // Reset loading state when URL changes
    React.useEffect(() => {
        setImageLoaded(false);
        setImageError(false);
    }, [imageUrl]);

    // Completed Page: Full white card with image and text matching PDF layout
    if (state === 'completed') {
        return (
            <div
                className={`bg-white rounded-2xl shadow-md overflow-hidden mx-auto max-w-lg ${className}`}
            >
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-black text-gray-600 uppercase tracking-widest">
                        {pageLabel}
                    </span>
                    <span className="text-xs font-bold text-green-500 flex items-center space-x-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>Created</span>
                    </span>
                </div>

                {/* Image Section - 5:4 aspect ratio (matches 80% of 10x10 page) */}
                <div className="relative bg-gray-100">
                    <div className="aspect-[5/4]">
                        {imageUrl ? (
                            <>
                                {/* Loading skeleton - shown until image loads */}
                                {!imageLoaded && !imageError && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                                    </div>
                                )}
                                <img
                                    src={imageUrl}
                                    alt={storyText ? `Illustration: ${storyText.substring(0, 100)}...` : `Illustration for ${pageLabel}`}
                                    className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                                        }`}
                                    onLoad={() => setImageLoaded(true)}
                                    onError={() => setImageError(true)}
                                    loading="eager"
                                    decoding="async"
                                    style={{ visibility: imageLoaded ? 'visible' : 'hidden' }}
                                />
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <span>Image loading...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Text Section - Fixed height matching PDF's 20% area */}
                <div className="p-4 bg-gradient-to-b from-white to-gray-50/50 border-t border-gray-100">
                    <p className="text-sm text-gray-800 leading-relaxed font-medium text-center line-clamp-2">
                        {storyText || 'Story text loading...'}
                    </p>
                    {storyText && storyText.length > 100 && (
                        <p className="text-xs text-gray-400 text-center mt-1.5 italic">...continues in full book</p>
                    )}
                </div>
            </div>
        );
    }

    // Generating Page: Active card with animated skeleton
    if (state === 'generating') {
        return (
            <div
                className={`bg-white rounded-2xl shadow-lg ring-2 ring-purple-400 overflow-hidden mx-auto max-w-lg ${className}`}
            >
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-black text-purple-500 uppercase tracking-widest">
                        {pageLabel}
                    </span>
                    <span className="flex items-center space-x-1 text-purple-500">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-xs font-bold">Creating...</span>
                    </span>
                </div>

                {/* Animated Skeleton Image - 5:4 aspect ratio */}
                <div className="relative bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 overflow-hidden">
                    <div className="aspect-[5/4] flex items-center justify-center">
                        {/* Animated background */}
                        <div className="absolute inset-0">
                            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-200/50 rounded-full blur-2xl animate-pulse" />
                            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-pink-200/50 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
                            <div className="absolute top-1/2 right-1/3 w-28 h-28 bg-orange-200/50 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
                        </div>

                        {/* Center content */}
                        <div className="relative text-center z-10">
                            <div className="relative">
                                <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3 animate-pulse" />
                                <div className="absolute inset-0 bg-purple-400/20 blur-xl rounded-full" />
                            </div>
                            <div className="flex items-center justify-center space-x-2 text-purple-600 font-bold">
                                <span className="text-lg">✨</span>
                                <span className="text-sm">{pageLabel}</span>
                            </div>
                            <p className="text-purple-500 text-sm mt-2 max-w-[200px] animate-pulse">
                                {generatingMessage}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Skeleton Text with shimmer */}
                <div className="p-4 space-y-2 bg-white border-t border-gray-50">
                    <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full w-full animate-pulse"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full w-4/5 mx-auto animate-pulse"></div>
                </div>
            </div>
        );
    }

    // Pending Page: Dimmed card waiting for its turn
    return (
        <div
            className={`bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 opacity-40 overflow-hidden mx-auto max-w-lg ${className}`}
        >
            <div className="px-4 py-3 border-b border-gray-100">
                <span className="text-xs font-black text-gray-600 uppercase tracking-widest">
                    {pageLabel}
                </span>
            </div>

            {/* Locked Content - 5:4 aspect ratio */}
            <div className="relative bg-gray-100/50">
                <div className="aspect-[5/4] flex items-center justify-center">
                    <div className="text-center text-gray-400">
                        <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="font-bold text-xs">Waiting in queue...</p>
                    </div>
                </div>
            </div>

            {/* Placeholder Text */}
            <div className="p-4 bg-gray-50 border-t border-gray-100">
                <div className="h-3 bg-gray-200/50 rounded-full w-3/4 mx-auto"></div>
            </div>
        </div>
    );
};

export default BookPageCard;
