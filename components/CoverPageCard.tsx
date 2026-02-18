import React, { useState } from 'react';
import OptimizedImage from './OptimizedImage';

interface CoverPageCardProps {
    imageUrl: string;
    storyTitle: string;
    childName: string;
    isPaid: boolean;
}

/**
 * Cover Page Card Component
 * 
 * Displays the cover page with:
 * - Full-bleed image
 * - Title text overlay at top (with gradient)
 * - "STARRING [CHILD NAME]" at bottom (with gradient)
 * 
 * Layout matches the AI-generated cover with typography zones.
 */
const CoverPageCard: React.FC<CoverPageCardProps> = ({
    imageUrl,
    storyTitle,
    childName,
    isPaid
}) => {
    // Extract just the adventure title (remove child name if present)
    const displayTitle = storyTitle
        .replace(new RegExp(`${childName}'?s?\\s*`, 'i'), '')
        .replace(/^and the\s+/i, '')
        .replace(/^the\s+/i, '')
        .trim();

    return (
        <div className="relative">
            {/* Watermark overlay for unpaid */}
            {!isPaid && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-black text-white opacity-20 rotate-[-15deg] select-none drop-shadow-lg">
                            PREVIEW
                        </span>
                    </div>
                </div>
            )}

            {/* Cover Card with 1:1 aspect ratio */}
            <div className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
                {/* Cover Label */}
                <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                    <span className="text-xs font-black text-white uppercase tracking-widest">
                        ✨ Your Story Cover ✨
                    </span>
                </div>

                {/* Cover Image with Text Overlays - 1:1 aspect for PDF compatibility */}
                <div className="relative">
                    {/* 1:1 aspect ratio matches PDF page dimensions */}
                    <div className="relative">
                        <OptimizedImage
                            src={imageUrl}
                            alt={`Cover for ${storyTitle} story starring ${childName}`}
                            aspectRatio="1/1"
                            priority={true}
                        />

                        {/* Top Gradient + Title Overlay */}
                        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black/70 via-black/40 to-transparent flex items-start justify-center pt-6 px-4 z-10">
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-heading text-amber-400 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-tight uppercase tracking-wide">
                                {displayTitle || 'The Adventure'}
                            </h2>
                        </div>

                        {/* Bottom Gradient + Starring Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col items-center justify-end pb-6 px-4 z-10">
                            <span className="text-xs font-medium text-gray-300 uppercase tracking-[0.3em] mb-1">
                                Starring
                            </span>
                            <h3 className="text-xl md:text-2xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase tracking-wide">
                                {childName}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoverPageCard;
