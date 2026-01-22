/**
 * API Client for Magictales Backend
 *
 * Shopify Integration:
 * - In Shopify (*.myshopify.com): API calls go through Shopify App Proxy at /apps/zelavo/api/*
 * - In development: Vite proxies /proxy/api/* to local backend
 *
 * The App Proxy is configured as:
 * - Prefix: apps
 * - Subpath: zelavo/api
 * - Proxy URL: https://your-backend.com/proxy/api
 */

import type {
    PhotoUploadResponse,
    PreviewCreateRequest,
    JobStartResponse,
    JobStatusResponse,
    PreviewResponse,
    DownloadResponse,
    ErrorResponse,
} from '../types/api.types';
import { JobStatus } from '../types/api.types';

// ==================
// Configuration
// ==================

/**
 * Check if Shopify test mode is enabled for local development
 * Set VITE_SHOPIFY_TEST_MODE=true in .env to test Shopify flow locally
 */
const isShopifyTestMode = (): boolean => {
    if (typeof window === 'undefined') return false;
    // Check for test mode flag (set via Vite define or URL param)
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('shopify_test') === 'true' ||
        (window as any).__SHOPIFY_TEST_MODE__ === true;
};

/**
 * Detect if running inside Shopify storefront (or test mode)
 */
export const isShopifyEnvironment = (): boolean => {
    if (typeof window === 'undefined') return false;
    // Real Shopify OR test mode
    return window.location.hostname.endsWith('myshopify.com') || isShopifyTestMode();
};

/**
 * Get API base URL based on environment
 * - Shopify: /apps/zelavo/api (goes through Shopify App Proxy)
 * - Development: /proxy/api (Vite proxies to local backend)
 */
const getApiBase = (): string => {
    // In test mode, still use local proxy
    if (isShopifyTestMode()) {
        return '/proxy/api';
    }
    return isShopifyEnvironment() ? '/apps/zelavo/api' : '/proxy/api';
};

/**
 * Get direct backend URL for file uploads.
 * Shopify App Proxy doesn't support multipart/form-data, so we need to 
 * upload directly to the backend via the URL injected in the Liquid template.
 * 
 * The Liquid template should include: data-backend-url="https://your-backend.com"
 * For local dev, falls back to /proxy/api
 */
const getDirectApiBase = (): string => {
    if (typeof document !== 'undefined') {
        const appElement = document.getElementById('zelavo-app');
        const backendUrl = appElement?.dataset.backendUrl;
        if (backendUrl) {
            return `${backendUrl}/api`;
        }
    }
    // Fallback for local development
    return '/proxy/api';
};

const API_BASE = getApiBase();
const DIRECT_API_BASE = getDirectApiBase();

/**
 * Get Shopify customer context from Liquid-injected data attributes
 * The Liquid template should inject: <div id="zelavo-app" data-customer-id="..." data-customer-email="...">
 */
export const getShopifyCustomerContext = (): { customerId: string | null; customerEmail: string | null; shopDomain: string | null } => {
    if (typeof document === 'undefined') {
        return { customerId: null, customerEmail: null, shopDomain: null };
    }

    const appElement = document.getElementById('zelavo-app');
    if (!appElement) {
        return { customerId: null, customerEmail: null, shopDomain: null };
    }

    return {
        customerId: appElement.dataset.customerId || null,
        customerEmail: appElement.dataset.customerEmail || null,
        shopDomain: appElement.dataset.shopDomain || null,
    };
};

/**
 * Check if user is logged into Shopify
 */
export const isShopifyCustomerLoggedIn = (): boolean => {
    const { customerId } = getShopifyCustomerContext();
    return !!customerId && customerId !== 'null' && customerId !== '';
};

// ==================
// Helper Functions
// ==================

class ApiError extends Error {
    constructor(
        message: string,
        public code: string,
        public details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * Get or create a session ID for guest users
 * Exported for use in AuthModal and other components
 */
export const getOrCreateSessionId = (): string => {
    if (typeof localStorage === 'undefined') {
        return `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    let sessionId = localStorage.getItem('magictales_session_id');
    if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('magictales_session_id', sessionId);
    }
    return sessionId;
};

/**
 * Build headers for API requests, including Shopify customer context when available
 */
function buildHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
        ...additionalHeaders,
    };

    // Add Shopify customer ID header if available (for tracking/linking)
    const { customerId, customerEmail } = getShopifyCustomerContext();
    if (customerId) {
        headers['X-Shopify-Customer-Id'] = customerId;
    }
    if (customerEmail) {
        headers['X-Shopify-Customer-Email'] = customerEmail;
    }

    // Always add session ID - needed for linking guest creations after login
    headers['X-Session-Id'] = getOrCreateSessionId();

    return headers;
}


async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorData: any = null;
        try {
            errorData = await response.json();
        } catch {
            // Response was not JSON
        }

        // Handle standard ErrorResponse format: { error: { code, message } }
        if (errorData?.error?.code) {
            throw new ApiError(
                errorData.error.message,
                errorData.error.code,
                errorData.error.details
            );
        }

        // Handle FastAPI HTTPException format: { detail: { code, message } } or { detail: "string" }
        if (errorData?.detail) {
            if (typeof errorData.detail === 'object' && errorData.detail.code) {
                throw new ApiError(
                    errorData.detail.message || 'Request failed',
                    errorData.detail.code,
                    errorData.detail
                );
            } else if (typeof errorData.detail === 'string') {
                throw new ApiError(
                    errorData.detail,
                    'REQUEST_FAILED'
                );
            }
        }

        throw new ApiError(
            `Request failed with status ${response.status}`,
            'REQUEST_FAILED'
        );
    }

    return response.json();
}

// ==================
// API Methods
// ==================

/**
 * Upload a child's photo for face validation.
 * Uses DIRECT_API_BASE because Shopify App Proxy doesn't support multipart/form-data.
 */
export async function uploadPhoto(file: File): Promise<PhotoUploadResponse> {
    const formData = new FormData();
    formData.append('photo', file);

    // Use direct backend URL for file uploads (bypasses Shopify App Proxy)
    const response = await fetch(`${DIRECT_API_BASE}/upload-photo`, {
        method: 'POST',
        headers: buildHeaders(),
        body: formData,
    });

    return handleResponse<PhotoUploadResponse>(response);
}

/**
 * Create a new preview generation job
 */
export async function createPreview(
    request: PreviewCreateRequest
): Promise<JobStartResponse> {
    // Use DIRECT_API_BASE to bypass Shopify App Proxy 500 errors
    const response = await fetch(`${DIRECT_API_BASE}/preview`, {
        method: 'POST',
        headers: buildHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(request),
    });

    return handleResponse<JobStartResponse>(response);
}

/**
 * Get the status of a generation job
 */
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
    const response = await fetch(`${DIRECT_API_BASE}/status/${jobId}`, {
        headers: buildHeaders(),
    });
    return handleResponse<JobStatusResponse>(response);
}

/**
 * Get preview data for display
 */
export async function getPreview(previewId: string): Promise<PreviewResponse> {
    const response = await fetch(`${DIRECT_API_BASE}/preview/${previewId}`, {
        headers: buildHeaders(),
    });
    return handleResponse<PreviewResponse>(response);
}

/**
 * Get download links for a completed order
 */
export async function getDownload(orderId: string): Promise<DownloadResponse> {
    const response = await fetch(`${DIRECT_API_BASE}/download/${orderId}`, {
        headers: buildHeaders(),
    });
    return handleResponse<DownloadResponse>(response);
}

/**
 * Retry a failed generation job
 * Returns a new job_id to poll for status
 */
export async function retryJob(jobId: string): Promise<JobStartResponse> {
    const response = await fetch(`${DIRECT_API_BASE}/preview/${jobId}/retry`, {
        method: 'POST',
        headers: buildHeaders(),
    });
    return handleResponse<JobStartResponse>(response);
}

// ==================
// My Creations API
// ==================

export interface CreationItem {
    preview_id: string;
    child_name: string;
    theme: string;
    cover_url: string | null;
    status: string;
    payment_status: 'paid' | 'unpaid';
    created_at: string;
    expires_at: string;
    days_remaining: number;
    job_id: string | null;
}

export interface MyCreationsResponse {
    creations: CreationItem[];
    total: number;
    can_create_more: boolean;
}

export interface LinkSessionResponse {
    linked_count: number;
    message: string;
}

export interface CreationCountResponse {
    count: number;
    limit: number | null;
    can_create: boolean;
}

/**
 * Get user's creation history
 */
export async function getMyCreations(): Promise<MyCreationsResponse> {
    const response = await fetch(`${DIRECT_API_BASE}/my-creations`, {
        headers: buildHeaders(),
    });
    return handleResponse<MyCreationsResponse>(response);
}

/**
 * Link guest session to logged-in user
 * Called after login to migrate guest creations
 */
export async function linkSession(): Promise<LinkSessionResponse> {
    const response = await fetch(`${DIRECT_API_BASE}/link-session`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({}),
    });
    return handleResponse<LinkSessionResponse>(response);
}

/**
 * Get count of creations to check guest limit
 */
export async function getCreationCount(): Promise<{ count: number }> {
    const response = await fetch(`${DIRECT_API_BASE}/creation-count`, {
        headers: buildHeaders(),
    });
    return handleResponse<{ count: number }>(response);
}

// ==================
// Polling Helpers
// ==================

interface PollOptions {
    /** Interval between polls in ms (default: 2000) */
    interval?: number;
    /** Maximum time to wait in ms (default: 300000 = 5 minutes) */
    timeout?: number;
    /** Callback for progress updates */
    onProgress?: (progress: number, step?: string) => void;
}

/**
 * Poll a job until completion or failure
 */
export async function pollJobUntilComplete(
    jobId: string,
    options: PollOptions = {}
): Promise<JobStatusResponse> {
    const { interval = 2000, timeout = 300000, onProgress } = options;
    const startTime = Date.now();

    while (true) {
        const status = await getJobStatus(jobId);

        // Report progress
        if (onProgress) {
            onProgress(status.progress, status.current_step);
        }

        // Check terminal states
        if (status.status === JobStatus.COMPLETED) {
            return status;
        }

        if (status.status === JobStatus.FAILED) {
            throw new ApiError(
                status.error || 'Job failed',
                'JOB_FAILED',
                { can_retry: status.can_retry }
            );
        }

        // Check timeout
        if (Date.now() - startTime > timeout) {
            throw new ApiError(
                'Job timed out waiting for completion',
                'JOB_TIMEOUT'
            );
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, interval));
    }
}

// ==================
// Shopify Cart Integration
// ==================

/**
 * Shopify product configuration
 * UPDATE THIS with your actual Shopify product variant ID
 */
export const SHOPIFY_CONFIG = {
    // The numeric variant ID of your "Personalized StoryGift Storybook" product
    // Store: storygift-2061.myshopify.com
    PRODUCT_VARIANT_ID: 51852877529364, // Correct Variant ID
    PRODUCT_PRICE: 599, // Price in INR
    CURRENCY_SYMBOL: '₹',
};

// ==================
// Checkout Tracking (Fallback for when Shopify ignores return_to)
// ==================

const PENDING_CHECKOUT_KEY = 'magictales_pending_checkout';
const CHECKOUT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface PendingCheckout {
    previewId: string;
    timestamp: number;
}

/**
 * Store pending checkout info before redirecting to Shopify
 * This allows us to detect checkout completion even if return_to is ignored
 */
export function setPendingCheckout(previewId: string): void {
    if (typeof localStorage === 'undefined') return;

    const data: PendingCheckout = {
        previewId,
        timestamp: Date.now(),
    };
    localStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(data));
    console.log('[Checkout] Stored pending checkout:', previewId);
}

/**
 * Get pending checkout if it exists and hasn't expired
 */
export function getPendingCheckout(): PendingCheckout | null {
    if (typeof localStorage === 'undefined') return null;

    const stored = localStorage.getItem(PENDING_CHECKOUT_KEY);
    if (!stored) return null;

    try {
        const data: PendingCheckout = JSON.parse(stored);

        // Check if checkout has expired (30 min timeout)
        if (Date.now() - data.timestamp > CHECKOUT_TIMEOUT_MS) {
            clearPendingCheckout();
            return null;
        }

        return data;
    } catch {
        clearPendingCheckout();
        return null;
    }
}

/**
 * Clear pending checkout (call after successful redirect or timeout)
 */
export function clearPendingCheckout(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(PENDING_CHECKOUT_KEY);
    console.log('[Checkout] Cleared pending checkout');
}

/**
 * Add the storybook to Shopify cart with preview_id as line item property
 * This allows the webhook to link the order to the specific preview
 *
 * In test mode, calls the backend mock cart endpoint instead
 */
export async function addToShopifyCart(previewId: string): Promise<{ success: boolean; error?: string; errorCode?: string; testOrderId?: string }> {
    // In test mode, call our backend mock endpoint
    if (isShopifyTestMode()) {
        console.log('[Shopify Test] Using mock cart endpoint for testing');
        try {
            const response = await fetch(`${API_BASE}/test/cart/add`, {
                method: 'POST',
                headers: buildHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    preview_id: previewId,
                    variant_id: SHOPIFY_CONFIG.PRODUCT_VARIANT_ID || 'test-variant',
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Shopify Test] Mock cart failed:', errorText);
                return { success: false, error: 'Failed to add to cart' };
            }

            const data = await response.json();
            console.log('[Shopify Test] Mock cart success:', data);
            return { success: true, testOrderId: data.order_id };
        } catch (error) {
            console.error('[Shopify Test] Mock cart error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    // Real Shopify environment
    if (!isShopifyEnvironment()) {
        console.warn('[Shopify Cart] Not in Shopify environment, cannot add to cart');
        return { success: false, error: 'Not in Shopify environment' };
    }

    if (SHOPIFY_CONFIG.PRODUCT_VARIANT_ID === 0) {
        console.error('[Shopify Cart] PRODUCT_VARIANT_ID not configured!');
        return { success: false, error: 'Product not configured' };
    }

    try {
        const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: [{
                    id: SHOPIFY_CONFIG.PRODUCT_VARIANT_ID,
                    quantity: 1,
                    properties: {
                        '_preview_id': previewId, // Underscore prefix hides from customer but available to backend
                        'Child\'s Story': 'Personalized Storybook', // Visible to customer
                    }
                }]
            }),
        });

        if (!response.ok) {
            // S-2 FIX: Parse Shopify error response for specific error handling
            let errorMessage = 'Failed to add to cart';
            let errorCode = 'CART_ERROR';

            try {
                const errorData = await response.json();
                console.error('[Shopify Cart] Error response:', errorData);

                if (errorData.description) {
                    const desc = errorData.description.toLowerCase();

                    if (desc.includes('sold out') || desc.includes('out of stock')) {
                        errorMessage = 'This product is currently unavailable';
                        errorCode = 'OUT_OF_STOCK';
                    } else if (desc.includes('not found') || desc.includes('does not exist')) {
                        errorMessage = 'Product configuration error. Please contact support.';
                        errorCode = 'VARIANT_NOT_FOUND';
                    } else if (desc.includes('limit')) {
                        errorMessage = 'Cart quantity limit reached';
                        errorCode = 'QUANTITY_LIMIT';
                    } else {
                        errorMessage = errorData.description;
                    }
                }
            } catch (parseError) {
                // If response is not JSON, use status text
                const errorText = await response.text();
                console.error('[Shopify Cart] Non-JSON error:', errorText);
                errorMessage = `Cart error (${response.status})`;
            }

            return { success: false, error: errorMessage, errorCode };
        }

        console.log('[Shopify Cart] Successfully added to cart with preview_id:', previewId);
        return { success: true };
    } catch (error) {
        console.error('[Shopify Cart] Network error:', error);
        return { success: false, error: 'Network error. Please check your connection.', errorCode: 'NETWORK_ERROR' };
    }
}

/**
 * Redirect to Shopify checkout with return URL
 * After checkout completion, user returns to preview page with ?checkout_success=true
 *
 * IMPORTANT: Shopify sometimes ignores return_to parameter.
 * We store pending checkout in localStorage as a fallback.
 * When user returns to the app (via My Creations or any page), we detect
 * the pending checkout and redirect them to the preview page.
 */
export function redirectToShopifyCheckout(previewId: string, testOrderId?: string): void {
    // Store pending checkout BEFORE redirecting (fallback for when return_to is ignored)
    setPendingCheckout(previewId);

    if (isShopifyTestMode() && testOrderId) {
        // In test mode, redirect to our test checkout simulation
        window.location.href = `/preview/${testOrderId}?checkout_success=true`;
        return;
    }

    if (isShopifyEnvironment()) {
        // Redirect to checkout with return URL that brings user back to preview
        const returnUrl = encodeURIComponent(`/apps/zelavo/preview/${previewId}?checkout_success=true`);
        window.location.href = `/checkout?return_to=${returnUrl}`;
    } else {
        console.warn('[Shopify] Not in Shopify environment, cannot redirect to checkout');
    }
}

/**
 * Add to cart and immediately redirect to checkout (Buy Now flow)
 * In test mode, simulates the entire payment flow
 */
export async function buyNowWithShopify(previewId: string): Promise<void> {
    const result = await addToShopifyCart(previewId);
    if (result.success) {
        if (isShopifyTestMode()) {
            // In test mode, trigger the test webhook and show success
            console.log('[Shopify Test] Triggering test payment webhook...');
            try {
                const webhookResponse = await fetch(`${API_BASE}/test/simulate-payment`, {
                    method: 'POST',
                    headers: buildHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({
                        preview_id: previewId,
                        order_id: result.testOrderId || `test-order-${Date.now()}`,
                    }),
                });

                if (webhookResponse.ok) {
                    const data = await webhookResponse.json();
                    console.log('[Shopify Test] Payment simulation complete:', data);
                    // Redirect to preview with success message
                    window.location.href = `/preview/${previewId}?payment_success=true&order_id=${data.order_id}`;
                    return;
                }
            } catch (error) {
                console.error('[Shopify Test] Payment simulation failed:', error);
            }
        }
        redirectToShopifyCheckout(previewId, result.testOrderId);
    } else {
        throw new ApiError(result.error || 'Failed to add to cart', 'CART_ERROR');
    }
}

// ==================
// Export API object for convenience
// ==================

export const api = {
    uploadPhoto,
    createPreview,
    getJobStatus,
    getPreview,
    getDownload,
    retryJob,
    pollJobUntilComplete,
    ApiError,
    // Shopify integration
    isShopifyEnvironment,
    getShopifyCustomerContext,
    isShopifyCustomerLoggedIn,
    addToShopifyCart,
    redirectToShopifyCheckout,
    buyNowWithShopify,
    SHOPIFY_CONFIG,
    // Checkout tracking (fallback for Shopify redirect issues)
    setPendingCheckout,
    getPendingCheckout,
    clearPendingCheckout,
    // My Creations
    getMyCreations,
    linkSession,
    getCreationCount,
};

export default api;
