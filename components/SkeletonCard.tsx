import React from 'react';

/**
 * Skeleton loading card for creation cards.
 * Mimics the CreationCard layout for smooth loading transitions.
 */
const SkeletonCard: React.FC = () => {
    return (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse">
            {/* Image skeleton */}
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer" />
            </div>

            {/* Content skeleton */}
            <div className="p-4 space-y-3">
                {/* Title skeleton */}
                <div className="h-5 bg-gray-200 rounded-full w-3/4" />

                {/* Theme badge skeleton */}
                <div className="h-4 bg-gray-100 rounded-full w-1/2" />

                {/* Status/date skeleton */}
                <div className="flex items-center justify-between pt-2">
                    <div className="h-4 bg-gray-100 rounded-full w-1/3" />
                    <div className="h-4 bg-gray-100 rounded-full w-1/4" />
                </div>
            </div>
        </div>
    );
};

/**
 * Grid of skeleton cards for loading state.
 */
interface SkeletonGridProps {
    count?: number;
    className?: string;
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({
    count = 6,
    className = ''
}) => {
    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
};

/**
 * Skeleton for a single book page (used in PreviewStory).
 */
export const SkeletonBookPage: React.FC<{ withHeader?: boolean }> = ({ withHeader = true }) => {
    return (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse max-w-lg mx-auto">
            {withHeader && (
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="h-3 bg-gray-200 rounded-full w-16" />
                    <div className="h-3 bg-gray-100 rounded-full w-12" />
                </div>
            )}

            {/* Image skeleton - 5:4 aspect ratio */}
            <div className="aspect-[5/4] bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer" />
            </div>

            {/* Text skeleton */}
            <div className="p-4 space-y-2">
                <div className="h-3 bg-gray-200 rounded-full w-full" />
                <div className="h-3 bg-gray-200 rounded-full w-4/5 mx-auto" />
            </div>
        </div>
    );
};

/**
 * Inline skeleton for text loading.
 */
export const SkeletonText: React.FC<{ width?: string; height?: string; className?: string }> = ({
    width = 'w-full',
    height = 'h-4',
    className = ''
}) => {
    return (
        <div className={`${width} ${height} bg-gray-200 rounded-full animate-pulse ${className}`} />
    );
};

export default SkeletonCard;
