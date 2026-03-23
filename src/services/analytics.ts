/**
 * StoryGift Analytics Service
 * Comprehensive tracking for user behavior, conversions, and technical performance
 */

import posthog from 'posthog-js';

// PostHog Configuration
const POSTHOG_KEY = 'phc_db4ABVGCQ72tac7tYXvnPjqZHNgBuIyjY6sysBBRyYE';
const POSTHOG_HOST = 'https://us.i.posthog.com';

// API Cost Tracking (estimated costs per operation)
const API_COSTS = {
    FACE_DETECTION: 0.01,           // Face detection API call
    IMAGE_GENERATION: 0.04,         // Per image generation (Flux/SD)
    FACE_SWAP: 0.03,                // Face swap operation
    STORY_GENERATION: 0.02,         // Text generation for story
    PDF_GENERATION: 0.01,           // PDF compilation
    STORAGE_UPLOAD: 0.001,          // R2/S3 upload per MB
    STORAGE_DOWNLOAD: 0.0005,       // R2/S3 download per MB
};

// Session tracking
let sessionStartTime: number | null = null;
let currentSessionId: string | null = null;

/**
 * Initialize PostHog Analytics
 */
export const initAnalytics = (): void => {
    if (typeof window === 'undefined') return;

    posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        // Capture pageviews automatically
        capture_pageview: true,
        // Capture pageleaves for session duration
        capture_pageleave: true,
        // Enable session recordings
        disable_session_recording: false,
        // Respect Do Not Track
        respect_dnt: true,
        // Mask sensitive inputs
        mask_all_text: false,
        mask_all_element_attributes: false,
        // Performance tracking
        capture_performance: true,
        // Autocapture clicks
        autocapture: true,
        // Persistence
        persistence: 'localStorage+cookie',
        // Load toolbar for debugging (disable in production if needed)
        loaded: (posthog) => {
            if (process.env.NODE_ENV === 'development') {
                console.log('[Analytics] PostHog initialized');
            }
        },
    });

    // Start session tracking
    sessionStartTime = Date.now();
    currentSessionId = generateSessionId();

    // Track initial page load performance
    trackPageLoadPerformance();
};

/**
 * Generate unique session ID
 */
const generateSessionId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Identify user (call after authentication)
 */
export const identifyUser = (userId: string, properties?: Record<string, any>): void => {
    posthog.identify(userId, {
        ...properties,
        first_seen: new Date().toISOString(),
    });
};

/**
 * Reset user identity (call on logout)
 */
export const resetUser = (): void => {
    posthog.reset();
};

// ===================
// PAGE VIEW TRACKING
// ===================

export const trackPageView = (pageName: string, properties?: Record<string, any>): void => {
    posthog.capture('$pageview', {
        page_name: pageName,
        session_id: currentSessionId,
        ...properties,
    });
};

// ===================
// THEME TRACKING
// ===================

export const trackThemeViewed = (themeId: string, themeName: string, position: number): void => {
    posthog.capture('theme_viewed', {
        theme_id: themeId,
        theme_name: themeName,
        position: position,
        timestamp: Date.now(),
    });
};

export const trackThemeSelected = (
    themeId: string,
    themeName: string,
    timeToSelectMs?: number
): void => {
    posthog.capture('theme_selected', {
        theme_id: themeId,
        theme_name: themeName,
        time_to_select_ms: timeToSelectMs,
        timestamp: Date.now(),
    });
};

// ===================
// STORY CREATION FLOW
// ===================

export const trackPhotoUploadStarted = (): void => {
    posthog.capture('photo_upload_started', {
        timestamp: Date.now(),
    });
};

export const trackPhotoUploadCompleted = (
    fileSizeBytes: number,
    durationMs: number
): void => {
    posthog.capture('photo_upload_completed', {
        file_size_bytes: fileSizeBytes,
        file_size_mb: (fileSizeBytes / (1024 * 1024)).toFixed(2),
        duration_ms: durationMs,
        timestamp: Date.now(),
    });

    // Track storage cost
    trackApiCost('storage_upload', fileSizeBytes / (1024 * 1024));
};

export const trackPhotoUploadFailed = (errorType: string, errorMessage?: string): void => {
    posthog.capture('photo_upload_failed', {
        error_type: errorType,
        error_message: errorMessage,
        timestamp: Date.now(),
    });
};

export const trackFaceDetectionSuccess = (facesDetected: number = 1): void => {
    posthog.capture('face_detection_success', {
        faces_detected: facesDetected,
        timestamp: Date.now(),
    });

    // Track API cost
    trackApiCost('face_detection', 1);
};

export const trackFaceDetectionFailed = (
    errorCode: string,
    errorMessage: string
): void => {
    posthog.capture('face_detection_failed', {
        error_code: errorCode,
        error_message: errorMessage,
        timestamp: Date.now(),
    });

    // Still track API cost for failed attempts
    trackApiCost('face_detection', 1);
};

export const trackChildDetailsEntered = (
    ageGroup: string,
    gender: string
): void => {
    posthog.capture('child_details_entered', {
        age_group: ageGroup,
        gender: gender,
        timestamp: Date.now(),
    });
};

export const trackArtStyleSelected = (style: 'photorealistic' | '3d_cartoon'): void => {
    posthog.capture('art_style_selected', {
        art_style: style,
        timestamp: Date.now(),
    });
};

// ===================
// PREVIEW GENERATION
// ===================

export const trackPreviewGenerationStarted = (
    themeId: string,
    artStyle: string
): void => {
    posthog.capture('preview_generation_started', {
        theme_id: themeId,
        art_style: artStyle,
        timestamp: Date.now(),
    });
};

export const trackPreviewGenerationProgress = (
    pageNumber: number,
    totalPages: number,
    percentComplete: number
): void => {
    posthog.capture('preview_generation_progress', {
        page_number: pageNumber,
        total_pages: totalPages,
        percent_complete: percentComplete,
        timestamp: Date.now(),
    });

    // Track API costs for each page generated
    trackApiCost('image_generation', 1);
    trackApiCost('face_swap', 1);
    trackApiCost('story_generation', 1);
};

export const trackPreviewGenerationCompleted = (
    durationMs: number,
    pagesCount: number,
    themeId: string
): void => {
    posthog.capture('preview_generation_completed', {
        duration_ms: durationMs,
        duration_seconds: Math.round(durationMs / 1000),
        pages_count: pagesCount,
        theme_id: themeId,
        timestamp: Date.now(),
    });
};

export const trackPreviewGenerationFailed = (
    errorType: string,
    errorMessage: string,
    pageNumber?: number
): void => {
    posthog.capture('preview_generation_failed', {
        error_type: errorType,
        error_message: errorMessage,
        page_number: pageNumber,
        timestamp: Date.now(),
    });
};

// ===================
// PREVIEW ENGAGEMENT
// ===================

export const trackPreviewPageViewed = (
    pageNumber: number,
    isLocked: boolean,
    timeOnPageMs?: number
): void => {
    posthog.capture('preview_page_viewed', {
        page_number: pageNumber,
        is_locked: isLocked,
        time_on_page_ms: timeOnPageMs,
        timestamp: Date.now(),
    });
};

export const trackLockedPageClicked = (pageNumber: number): void => {
    posthog.capture('locked_page_clicked', {
        page_number: pageNumber,
        timestamp: Date.now(),
    });
};

export const trackPreviewScrollDepth = (
    maxScrollPercent: number,
    totalPagesViewed: number
): void => {
    posthog.capture('preview_scroll_depth', {
        max_scroll_percent: maxScrollPercent,
        total_pages_viewed: totalPagesViewed,
        timestamp: Date.now(),
    });
};

// ===================
// PURCHASE FLOW
// ===================

export const trackPurchaseInitiated = (
    price: number,
    currency: string,
    themeId: string,
    previewId: string
): void => {
    posthog.capture('purchase_initiated', {
        price: price,
        currency: currency,
        theme_id: themeId,
        preview_id: previewId,
        timestamp: Date.now(),
    });
};

export const trackPurchaseCompleted = (
    orderId: string,
    price: number,
    currency: string,
    themeId: string
): void => {
    posthog.capture('purchase_completed', {
        order_id: orderId,
        price: price,
        currency: currency,
        theme_id: themeId,
        revenue: price, // For revenue tracking
        timestamp: Date.now(),
    });

    // Track PDF generation cost
    trackApiCost('pdf_generation', 1);
};

export const trackPurchaseFailed = (
    errorType: string,
    errorMessage?: string
): void => {
    posthog.capture('purchase_failed', {
        error_type: errorType,
        error_message: errorMessage,
        timestamp: Date.now(),
    });
};

export const trackCartAbandoned = (
    price: number,
    currency: string,
    themeId: string,
    timeOnCheckoutMs: number
): void => {
    posthog.capture('cart_abandoned', {
        price: price,
        currency: currency,
        theme_id: themeId,
        time_on_checkout_ms: timeOnCheckoutMs,
        timestamp: Date.now(),
    });
};

// ===================
// DOWNLOAD TRACKING
// ===================

export const trackPdfDownloadStarted = (previewId: string): void => {
    posthog.capture('pdf_download_started', {
        preview_id: previewId,
        timestamp: Date.now(),
    });
};

export const trackPdfDownloadCompleted = (
    previewId: string,
    fileSizeMb?: number
): void => {
    posthog.capture('pdf_download_completed', {
        preview_id: previewId,
        file_size_mb: fileSizeMb,
        timestamp: Date.now(),
    });

    // Track storage download cost
    if (fileSizeMb) {
        trackApiCost('storage_download', fileSizeMb);
    }
};

export const trackPdfDownloadFailed = (
    previewId: string,
    errorType: string
): void => {
    posthog.capture('pdf_download_failed', {
        preview_id: previewId,
        error_type: errorType,
        timestamp: Date.now(),
    });
};

// ===================
// API COST TRACKING
// ===================

type ApiCostType = keyof typeof API_COSTS;

export const trackApiCost = (
    operationType: ApiCostType | string,
    quantity: number = 1
): void => {
    const costPerUnit = API_COSTS[operationType as ApiCostType] || 0;
    const totalCost = costPerUnit * quantity;

    posthog.capture('api_cost_incurred', {
        operation_type: operationType,
        quantity: quantity,
        cost_per_unit: costPerUnit,
        total_cost: totalCost,
        currency: 'USD',
        timestamp: Date.now(),
    });
};

export const trackTotalJobCost = (
    jobId: string,
    breakdown: {
        faceDetection?: number;
        imageGeneration?: number;
        faceSwap?: number;
        storyGeneration?: number;
        pdfGeneration?: number;
        storage?: number;
    }
): void => {
    const totalCost =
        (breakdown.faceDetection || 0) * API_COSTS.FACE_DETECTION +
        (breakdown.imageGeneration || 0) * API_COSTS.IMAGE_GENERATION +
        (breakdown.faceSwap || 0) * API_COSTS.FACE_SWAP +
        (breakdown.storyGeneration || 0) * API_COSTS.STORY_GENERATION +
        (breakdown.pdfGeneration || 0) * API_COSTS.PDF_GENERATION +
        (breakdown.storage || 0) * API_COSTS.STORAGE_UPLOAD;

    posthog.capture('job_cost_total', {
        job_id: jobId,
        breakdown: breakdown,
        total_cost_usd: totalCost.toFixed(4),
        timestamp: Date.now(),
    });
};

// ===================
// TECHNICAL PERFORMANCE
// ===================

export const trackPageLoadPerformance = (): void => {
    if (typeof window === 'undefined' || !window.performance) return;

    // Wait for page to fully load
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.navigationStart;
            const firstByte = perfData.responseStart - perfData.navigationStart;

            posthog.capture('page_load_performance', {
                page_load_time_ms: pageLoadTime,
                dom_content_loaded_ms: domContentLoaded,
                time_to_first_byte_ms: firstByte,
                page_url: window.location.pathname,
                timestamp: Date.now(),
            });
        }, 0);
    });
};

export const trackApiResponseTime = (
    endpoint: string,
    method: string,
    durationMs: number,
    statusCode: number,
    success: boolean
): void => {
    posthog.capture('api_response_time', {
        endpoint: endpoint,
        method: method,
        duration_ms: durationMs,
        status_code: statusCode,
        success: success,
        timestamp: Date.now(),
    });
};

export const trackApiError = (
    endpoint: string,
    errorCode: string | number,
    errorMessage: string,
    method?: string
): void => {
    posthog.capture('api_error', {
        endpoint: endpoint,
        error_code: errorCode,
        error_message: errorMessage,
        method: method,
        timestamp: Date.now(),
    });
};

export const trackClientError = (
    errorType: string,
    errorMessage: string,
    componentName?: string,
    stackTrace?: string
): void => {
    posthog.capture('client_error', {
        error_type: errorType,
        error_message: errorMessage,
        component_name: componentName,
        stack_trace: stackTrace?.substring(0, 500), // Limit stack trace length
        page_url: window.location.pathname,
        timestamp: Date.now(),
    });
};

// ===================
// USER ENGAGEMENT
// ===================

export const trackSessionDuration = (): void => {
    if (!sessionStartTime) return;

    const duration = Date.now() - sessionStartTime;
    posthog.capture('session_duration', {
        duration_ms: duration,
        duration_seconds: Math.round(duration / 1000),
        session_id: currentSessionId,
        timestamp: Date.now(),
    });
};

export const trackScrollDepth = (pageUrl: string, maxDepthPercent: number): void => {
    posthog.capture('scroll_depth', {
        page_url: pageUrl,
        max_depth_percent: maxDepthPercent,
        timestamp: Date.now(),
    });
};

export const trackElementClicked = (
    elementName: string,
    elementType: string,
    pageUrl: string,
    additionalProps?: Record<string, any>
): void => {
    posthog.capture('element_clicked', {
        element_name: elementName,
        element_type: elementType,
        page_url: pageUrl,
        ...additionalProps,
        timestamp: Date.now(),
    });
};

// ===================
// EMAIL CAPTURE
// ===================

export const trackEmailCaptureShown = (context: string): void => {
    posthog.capture('email_capture_shown', {
        context: context,
        timestamp: Date.now(),
    });
};

export const trackEmailCaptureSubmitted = (context: string): void => {
    posthog.capture('email_capture_submitted', {
        context: context,
        timestamp: Date.now(),
    });
};

export const trackEmailCaptureDismissed = (context: string): void => {
    posthog.capture('email_capture_dismissed', {
        context: context,
        timestamp: Date.now(),
    });
};

// ===================
// AUTH TRACKING
// ===================

export const trackAuthModalShown = (context: string): void => {
    posthog.capture('auth_modal_shown', {
        context: context,
        timestamp: Date.now(),
    });
};

export const trackAuthMethodSelected = (method: 'login' | 'signup' | 'guest'): void => {
    posthog.capture('auth_method_selected', {
        method: method,
        timestamp: Date.now(),
    });
};

export const trackLoginSuccess = (method: string): void => {
    posthog.capture('login_success', {
        method: method,
        timestamp: Date.now(),
    });
};

export const trackLoginFailed = (method: string, errorMessage?: string): void => {
    posthog.capture('login_failed', {
        method: method,
        error_message: errorMessage,
        timestamp: Date.now(),
    });
};

// ===================
// FEATURE FLAGS (for A/B testing)
// ===================

export const getFeatureFlag = (flagName: string): boolean | string | undefined => {
    return posthog.getFeatureFlag(flagName);
};

export const trackFeatureFlagCalled = (flagName: string, value: any): void => {
    posthog.capture('$feature_flag_called', {
        $feature_flag: flagName,
        $feature_flag_response: value,
    });
};

// ===================
// FUNNEL HELPERS
// ===================

/**
 * Track complete story creation funnel step
 */
export const trackFunnelStep = (
    step: 'landing' | 'theme_selected' | 'photo_uploaded' | 'face_detected' |
          'details_entered' | 'generation_started' | 'preview_ready' |
          'purchase_started' | 'purchase_complete' | 'download_complete',
    properties?: Record<string, any>
): void => {
    const stepOrder = {
        landing: 1,
        theme_selected: 2,
        photo_uploaded: 3,
        face_detected: 4,
        details_entered: 5,
        generation_started: 6,
        preview_ready: 7,
        purchase_started: 8,
        purchase_complete: 9,
        download_complete: 10,
    };

    posthog.capture('funnel_step', {
        step_name: step,
        step_number: stepOrder[step],
        ...properties,
        timestamp: Date.now(),
    });
};

// ===================
// CLEANUP
// ===================

/**
 * Call this before page unload to track session end
 */
export const trackSessionEnd = (): void => {
    trackSessionDuration();
    posthog.capture('session_ended', {
        session_id: currentSessionId,
        timestamp: Date.now(),
    });
};

// Set up automatic session end tracking
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', trackSessionEnd);
}

// Export PostHog instance for advanced usage
export { posthog };

// Default export
export default {
    initAnalytics,
    identifyUser,
    resetUser,
    trackPageView,
    trackThemeSelected,
    trackPhotoUploadCompleted,
    trackFaceDetectionSuccess,
    trackFaceDetectionFailed,
    trackPreviewGenerationStarted,
    trackPreviewGenerationCompleted,
    trackPurchaseInitiated,
    trackPurchaseCompleted,
    trackApiCost,
    trackApiError,
};
