/**
 * User-friendly error message mapping.
 * Transforms technical error codes into friendly, actionable messages.
 */

export interface FriendlyError {
    title: string;
    message: string;
    suggestion?: string;
    icon: string;
}

/**
 * Map of error codes to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, FriendlyError> = {
    // Photo/Face validation errors
    'no_face_detected': {
        title: "We couldn't find a face",
        message: "Make sure the photo clearly shows your child's face.",
        suggestion: "Try a photo where your child is looking at the camera with good lighting.",
        icon: "👤"
    },
    'multiple_faces': {
        title: "Too many faces detected",
        message: "We found more than one person in the photo.",
        suggestion: "Please upload a photo with only your child in it.",
        icon: "👥"
    },
    'face_too_small': {
        title: "Face is too far away",
        message: "Your child's face needs to be bigger in the photo.",
        suggestion: "Try a closer photo or crop the image to focus on your child's face.",
        icon: "🔍"
    },
    'face_angle_invalid': {
        title: "Face angle isn't quite right",
        message: "We need a front-facing photo for the best results.",
        suggestion: "Make sure your child is looking directly at the camera.",
        icon: "📐"
    },
    'image_blurry': {
        title: "Photo is a bit blurry",
        message: "A clearer photo will help create better storybook images.",
        suggestion: "Try a photo taken in good lighting without motion blur.",
        icon: "📷"
    },
    'face_processing_error': {
        title: "Couldn't process the photo",
        message: "Something went wrong analyzing the image.",
        suggestion: "Try uploading a different photo.",
        icon: "⚠️"
    },
    'INVALID_IMAGE_FORMAT': {
        title: "Unsupported image format",
        message: "We support JPEG, PNG, GIF, and WebP images.",
        suggestion: "Please upload a photo in one of these formats.",
        icon: "🖼️"
    },

    // File upload errors
    'FILE_TOO_LARGE': {
        title: "Photo is too large",
        message: "Please upload an image smaller than 10MB.",
        suggestion: "You can resize the image or take a new photo.",
        icon: "📦"
    },

    // Generation errors
    'IMAGE_GENERATION_FAILED': {
        title: "Story creation hit a snag",
        message: "Our magic wands need a moment to recharge.",
        suggestion: "Please try again in a few moments.",
        icon: "🪄"
    },
    'JOB_FAILED': {
        title: "The story couldn't be created",
        message: "Something unexpected happened during generation.",
        suggestion: "You can retry or try with a different photo.",
        icon: "😢"
    },
    'JOB_TIMEOUT': {
        title: "This is taking longer than expected",
        message: "The story generation timed out.",
        suggestion: "Please try again - our wizards are working faster now!",
        icon: "⏰"
    },

    // Rate limiting
    'RATE_LIMIT_EXCEEDED': {
        title: "Slow down there, adventurer!",
        message: "You've been creating stories too quickly.",
        suggestion: "Please wait a moment before trying again.",
        icon: "🚦"
    },
    'GUEST_LIMIT_REACHED': {
        title: "You've created 3 stories!",
        message: "Sign in to continue making magical stories.",
        suggestion: "Your existing previews will be saved.",
        icon: "🎉"
    },

    // Network/server errors
    'NETWORK_ERROR': {
        title: "Connection problem",
        message: "We couldn't reach our magical servers.",
        suggestion: "Please check your internet connection and try again.",
        icon: "📡"
    },
    'REQUEST_FAILED': {
        title: "Something went wrong",
        message: "The request couldn't be completed.",
        suggestion: "Please try again in a few moments.",
        icon: "⚠️"
    },
    'STORAGE_ERROR': {
        title: "Storage hiccup",
        message: "We had trouble saving your photo.",
        suggestion: "Please try uploading again.",
        icon: "💾"
    },

    // Preview/Order errors
    'PREVIEW_NOT_FOUND': {
        title: "Story not found",
        message: "We couldn't find this story preview.",
        suggestion: "It may have expired or the link might be incorrect.",
        icon: "🔎"
    },
    'PREVIEW_EXPIRED': {
        title: "Preview has expired",
        message: "Story previews are available for 7 days.",
        suggestion: "Create a new story to start a fresh adventure!",
        icon: "📆"
    },
    'ORDER_NOT_FOUND': {
        title: "Order not found",
        message: "We couldn't find this order.",
        suggestion: "Please check your order confirmation email.",
        icon: "📋"
    },

    // Cart/Payment errors
    'CART_ERROR': {
        title: "Cart trouble",
        message: "We couldn't add the storybook to your cart.",
        suggestion: "Please refresh the page and try again.",
        icon: "🛒"
    },
    'OUT_OF_STOCK': {
        title: "Temporarily unavailable",
        message: "This product is currently out of stock.",
        suggestion: "Please check back soon!",
        icon: "📦"
    },
    'VARIANT_NOT_FOUND': {
        title: "Product configuration issue",
        message: "There's a problem with the product setup.",
        suggestion: "Please contact support for assistance.",
        icon: "⚙️"
    },
};

/**
 * Default error for unknown error codes
 */
const DEFAULT_ERROR: FriendlyError = {
    title: "Oops! Something went wrong",
    message: "An unexpected error occurred.",
    suggestion: "Please try again or contact support if the problem persists.",
    icon: "😅"
};

/**
 * Get a user-friendly error message for an error code
 */
export function getFriendlyError(code: string | undefined, fallbackMessage?: string): FriendlyError {
    if (code && ERROR_MESSAGES[code]) {
        return ERROR_MESSAGES[code];
    }

    // If no matching code but we have a fallback message, use it
    if (fallbackMessage) {
        return {
            ...DEFAULT_ERROR,
            message: fallbackMessage,
        };
    }

    return DEFAULT_ERROR;
}

/**
 * Format an error for display (combines title and message)
 */
export function formatErrorMessage(code: string | undefined, fallbackMessage?: string): string {
    const friendly = getFriendlyError(code, fallbackMessage);
    return `${friendly.icon} ${friendly.title}: ${friendly.message}`;
}

/**
 * Check if an error code indicates a photo-related issue
 */
export function isPhotoError(code: string | undefined): boolean {
    const photoErrorCodes = [
        'no_face_detected',
        'multiple_faces',
        'face_too_small',
        'face_angle_invalid',
        'image_blurry',
        'face_processing_error',
        'INVALID_IMAGE_FORMAT',
        'FILE_TOO_LARGE',
    ];
    return code ? photoErrorCodes.includes(code) : false;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(code: string | undefined): boolean {
    const retryableCodes = [
        'IMAGE_GENERATION_FAILED',
        'JOB_FAILED',
        'JOB_TIMEOUT',
        'NETWORK_ERROR',
        'REQUEST_FAILED',
        'STORAGE_ERROR',
    ];
    return code ? retryableCodes.includes(code) : true;
}
