import React, { useState } from 'react';
import { Lock, Sparkles, Flame, BookOpen, Package } from 'lucide-react';

/**
 * Enhanced Locked Page Card with FOMO-inducing design
 * 
 * Features:
 * - Same size as generated pages (max-w-lg, aspect-[5/4])
 * - Blurred magical background with floating sparkles
 * - Peek animation on hover (blur briefly reduces)
 * - Social proof ("X parents peeked")
 * - Curiosity-driving teaser text
 * - Lock icon with wobble animation
 */

interface EnhancedLockedPageCardProps {
    pageNumber: number;
    teaserText: string;
    childName: string;
    isHottest?: boolean;
}

// Child-personalized curiosity hooks for each locked page
const getPersonalizedHook = (pageNumber: number, childName: string): string => {
    const hooks: Record<number, string> = {
        6: `${childName} makes a surprising discovery...`,
        7: `A new friend joins ${childName}'s journey...`,
        8: `${childName}'s courage is put to the test...`,
        9: `${childName}'s most magical moment yet...`,
        10: `The heartwarming finale ${childName} deserves...`,
    };
    return hooks[pageNumber] || `${childName}'s adventure continues...`;
};

const EnhancedLockedPageCard: React.FC<EnhancedLockedPageCardProps> = ({
    pageNumber,
    teaserText,
    childName,
    isHottest = false,
}) => {
    const [isHovering, setIsHovering] = useState(false);

    const personalizedHook = getPersonalizedHook(pageNumber, childName);

    return (
        <div
            className="bg-white rounded-2xl shadow-md overflow-hidden mx-auto max-w-lg group"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Page Header - Same as generated pages */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Page {pageNumber}
                </span>
                <span className="flex items-center space-x-1 text-purple-500">
                    <Lock className={`w-4 h-4 transition-transform duration-300 ${isHovering ? 'animate-wobble' : ''}`} />
                    <span className="text-xs font-bold">LOCKED</span>
                </span>
            </div>

            {/* Blurred Content Area - 5:4 aspect ratio (same as generated) */}
            <div className="relative bg-gradient-to-br from-purple-900 via-indigo-800 to-pink-900 overflow-hidden">
                <div className="aspect-[5/4] flex items-center justify-center relative">

                    {/* Animated background shapes */}
                    <div className="absolute inset-0 overflow-hidden">
                        {/* Large blurred orbs */}
                        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
                        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-pink-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />

                        {/* Magical silhouette placeholder */}
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 transition-all duration-300 ${isHovering ? 'opacity-60' : 'opacity-80'}`} />
                    </div>

                    {/* Floating sparkle particles */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1.5 h-1.5 bg-yellow-300 rounded-full animate-float-up"
                                style={{
                                    left: `${10 + (i * 12)}%`,
                                    animationDelay: `${i * 0.4}s`,
                                    animationDuration: `${2 + (i % 3)}s`,
                                }}
                            />
                        ))}
                    </div>

                    {/* Center content */}
                    <div className={`relative z-10 text-center transition-all duration-300 ${isHovering ? 'scale-105' : 'scale-100'}`}>
                        {/* Glowing lock icon */}
                        <div className="relative mb-4">
                            <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl animate-pulse" />
                            <div className={`relative w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-lg transition-all duration-300 ${isHovering ? 'bg-white/20' : ''}`}>
                                <Lock className={`w-8 h-8 text-white transition-transform duration-300 ${isHovering ? 'scale-90' : ''}`} />
                            </div>
                        </div>

                        {/* Mystery message */}
                        <div className="bg-black/40 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                            <p className="text-white/90 text-sm font-medium mb-1">
                                🔮 {personalizedHook}
                            </p>
                            <p className={`text-yellow-300 text-xs flex items-center justify-center gap-1 transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-70'}`}>
                                <Sparkles className="w-3 h-3" />
                                <span>{isHovering ? 'So close...' : 'Unlock to reveal'}</span>
                                <Sparkles className="w-3 h-3" />
                            </p>
                        </div>
                    </div>

                    {/* Hottest page badge - personalized */}
                    {isHottest && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg animate-pulse">
                            <Flame className="w-3 h-3" />
                            <span>{childName}'s Best Moment!</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Text Section - Same height as generated pages */}
            <div className="p-4 bg-white border-t border-gray-50">
                {/* Teaser text */}
                <p className="text-sm text-gray-600 leading-relaxed text-center italic mb-3">
                    "{teaserText}"
                </p>

                {/* Page-specific personalized message */}
                <div className="flex items-center justify-center gap-2 text-xs text-purple-500">
                    <Sparkles className="w-3 h-3" />
                    <span className="font-medium">
                        {pageNumber === 10
                            ? `${childName}'s grand finale awaits!`
                            : `Crafted just for ${childName}`}
                    </span>
                </div>
            </div>
        </div>
    );
};

/**
 * LockedPagesSection - Full section with all locked pages + unlock CTA
 */
interface LockedPagesSectionProps {
    lockedPages: Array<{
        page_number: number;
        story_text: string;
    }>;
    childName: string;
    onUnlock: () => void;        // Digital PDF checkout
    onPhysical?: () => void;    // Physical printed book checkout
    price?: string;
    physicalPrice?: string;
    isLoading?: boolean;
    isPhysicalLoading?: boolean;
    daysRemaining?: number;
}

export const LockedPagesSection: React.FC<LockedPagesSectionProps> = ({
    lockedPages,
    childName,
    onUnlock,
    onPhysical,
    price = "$19",
    physicalPrice = "$29",
    isLoading = false,
    isPhysicalLoading = false,
    daysRemaining = 7
}) => {

    if (!lockedPages || lockedPages.length === 0) return null;

    return (
        <div className="space-y-6">
            {/* Section Divider */}
            <div className="relative py-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-dashed border-purple-200" />
                </div>
                <div className="relative flex justify-center">
                    <div className="bg-white px-6 py-3 rounded-full border-2 border-purple-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5 text-purple-500" />
                            <span className="font-bold text-purple-700">5 Pages Locked</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Locked Pages - Single Column, Same Size as Generated */}
            <div className="space-y-6">
                {lockedPages.map((page, index) => (
                    <EnhancedLockedPageCard
                        key={page.page_number}
                        pageNumber={page.page_number}
                        teaserText={page.story_text}
                        childName={childName}
                        isHottest={page.page_number === 9} // Page 9 is the climax
                    />
                ))}
            </div>

            {/* Big Unlock CTA */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>

                <div className="relative z-10">
                    <div className="text-5xl mb-4">🎁</div>

                    <h3 className="text-white text-2xl font-bold mb-2">
                        Unlock {childName}'s Complete Adventure
                    </h3>

                    <p className="text-white/80 text-sm mb-6 max-w-sm mx-auto">
                        5 more magical pages await — choose how you want to keep them forever
                    </p>

                    {/* Two purchase options side by side */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch max-w-sm mx-auto">

                        {/* Digital PDF */}
                        <button
                            onClick={onUnlock}
                            disabled={isLoading || isPhysicalLoading}
                            className="flex-1 bg-white text-purple-600 px-6 py-4 rounded-2xl font-bold hover:bg-gray-50 hover:scale-105 transition-all shadow-xl disabled:opacity-50 flex flex-col items-center justify-center gap-1"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <BookOpen className="w-5 h-5 mb-1" />
                            )}
                            <span className="text-base">Digital PDF</span>
                            <span className="text-purple-400 text-xs font-normal">Download instantly · {price}</span>
                        </button>

                        {/* Printed Book */}
                        {onPhysical && (
                            <button
                                onClick={onPhysical}
                                disabled={isLoading || isPhysicalLoading}
                                className="flex-1 bg-amber-50 text-amber-700 border-2 border-amber-300 px-6 py-4 rounded-2xl font-bold hover:bg-amber-100 hover:scale-105 transition-all shadow-xl disabled:opacity-50 flex flex-col items-center justify-center gap-1"
                            >
                                {isPhysicalLoading ? (
                                    <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Package className="w-5 h-5 mb-1" />
                                )}
                                <span className="text-base">Printed Book</span>
                                <span className="text-amber-500 text-xs font-normal">Ships to your door · {physicalPrice}</span>
                            </button>
                        )}
                    </div>

                    {/* Value messaging */}
                    <div className="flex items-center justify-center gap-4 mt-5 text-white/70 text-xs">
                        <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-yellow-300" />
                            <span>Personalized for {childName}</span>
                        </span>
                        <span>•</span>
                        <span>All 10 pages unlocked instantly</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedLockedPageCard;
