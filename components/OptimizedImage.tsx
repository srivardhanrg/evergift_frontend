import React, { useState, useRef, useEffect } from 'react';

/**
 * Preload a critical image to improve LCP (Largest Contentful Paint).
 * Call this early (e.g., in useEffect) for above-the-fold images.
 */
export function preloadImage(src: string, fetchPriority: 'high' | 'low' = 'high'): void {
    if (typeof document === 'undefined' || !src) return;

    // Check if already preloaded
    const existingLink = document.querySelector(`link[href="${src}"][rel="preload"]`);
    if (existingLink) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    // @ts-ignore - fetchpriority is valid on link elements
    link.fetchpriority = fetchPriority;

    document.head.appendChild(link);
}

/**
 * Preload multiple images (e.g., for a carousel or gallery).
 * Only preloads the first few for performance.
 */
export function preloadImages(srcs: string[], limit: number = 3): void {
    srcs.slice(0, limit).forEach((src, index) => {
        preloadImage(src, index === 0 ? 'high' : 'low');
    });
}

interface OptimizedImageProps {
    src: string;
    alt: string;
    className?: string;
    /** Aspect ratio for the placeholder (e.g., "4/3", "5/4", "1/1") */
    aspectRatio?: string;
    /** Custom Tailwind classes for the container */
    containerClassName?: string;
    /** Whether to use a blur-up effect (recommended for hero images) */
    useBlurUp?: boolean;
    /** Callback when image loads successfully */
    onLoad?: () => void;
    /** Callback when image fails to load */
    onError?: () => void;
    /** Priority loading (eager) for above-the-fold images */
    priority?: boolean;
    /** Image width hint for responsive sizing (improves LCP) */
    width?: number;
    /** Image height hint for responsive sizing */
    height?: number;
    /** Sizes attribute for responsive images */
    sizes?: string;
    /** Fetch priority for critical images (high for LCP images) */
    fetchPriority?: 'high' | 'low' | 'auto';
}

/**
 * OptimizedImage Component
 * 
 * Provides a smooth image loading experience with:
 * - Skeleton placeholder while loading (prevents layout shift)
 * - Fade-in transition when image loads (prevents jarring appearance)
 * - Error state handling
 * - Optional blur-up effect for premium feel
 * 
 * Prevents the "vertical loading" artifact by hiding the image until fully loaded.
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
    src,
    alt,
    className = '',
    aspectRatio = '4/3',
    containerClassName = '',
    useBlurUp = false,
    onLoad,
    onError,
    priority = false,
    width,
    height,
    sizes,
    fetchPriority,
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // Reset state when src changes
    useEffect(() => {
        setIsLoaded(false);
        setHasError(false);
    }, [src]);

    // Check if image is already cached (for instant display)
    useEffect(() => {
        if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
            setIsLoaded(true);
        }
    }, [src]);

    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };

    const handleError = () => {
        setHasError(true);
        onError?.();
    };

    return (
        <div
            className={`relative overflow-hidden bg-gray-100 ${containerClassName}`}
            style={{ aspectRatio }}
        >
            {/* Animated skeleton placeholder - visible while loading */}
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 animate-pulse">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer" />
                </div>
            )}

            {/* Error state */}
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <div className="text-center text-gray-400">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs">Failed to load</span>
                    </div>
                </div>
            )}

            {/* Actual image - hidden until loaded, then fades in */}
            {!hasError && (
                <img
                    ref={imgRef}
                    src={src}
                    alt={alt}
                    className={`
            w-full h-full object-cover
            transition-opacity duration-300 ease-out
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            ${className}
          `}
                    onLoad={handleLoad}
                    onError={handleError}
                    loading={priority ? 'eager' : 'lazy'}
                    decoding="async"
                    // Responsive sizing hints for better LCP
                    width={width}
                    height={height}
                    sizes={sizes}
                    // Fetch priority for critical images (LCP optimization)
                    // @ts-ignore - fetchpriority is valid HTML attribute
                    fetchpriority={fetchPriority || (priority ? 'high' : undefined)}
                    // Prevent partially loaded image from showing
                    style={{ visibility: isLoaded ? 'visible' : 'hidden' }}
                />
            )}

            {/* Optional blur-up overlay for extra smooth transition */}
            {useBlurUp && !isLoaded && !hasError && (
                <div className="absolute inset-0 backdrop-blur-sm bg-white/30" />
            )}
        </div>
    );
};

export default OptimizedImage;
