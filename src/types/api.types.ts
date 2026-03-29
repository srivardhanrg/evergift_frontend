/**
 * API Type Definitions
 * 
 * These interfaces mirror the backend Pydantic schemas for type safety
 * across the frontend-backend boundary.
 */

// ==================
// Enums
// ==================

// Backend themes - these are the actual values accepted by the API
export enum Theme {
    // Primary StoryGift themes
    STORYGIFT_MAGIC_CASTLE = 'storygift_magic_castle',
    STORYGIFT_ENCHANTED_FOREST = 'storygift_enchanted_forest',
    // New premium themes
    STORYGIFT_COSMIC_DREAMER = 'storygift_cosmic_dreamer',
    STORYGIFT_MIGHTY_GUARDIAN = 'storygift_mighty_guardian',
    STORYGIFT_OCEAN_EXPLORER = 'storygift_ocean_explorer',
    STORYGIFT_BIRTHDAY_MAGIC = 'storygift_birthday_magic',
    // Newest premium themes (Safari & Dream Weaver)
    STORYGIFT_SAFARI_ADVENTURE = 'storygift_safari_adventure',
    // STORYGIFT_DREAM_WEAVER = 'storygift_dream_weaver',  // REMOVED
    STORYGIFT_SECRET_AGENT = 'storygift_secret_agent',
    // Legacy themes
    MAGIC_CASTLE = 'magic_castle',
}

export enum BookStyle {
    PHOTOREALISTIC = 'photorealistic',
    // CARTOON_3D = 'cartoon_3d', // V1: Removed - photorealistic only
}

export enum JobStatus {
    QUEUED = 'queued',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

export enum PreviewStatus {
    PENDING = 'pending',
    VALIDATING = 'validating',
    GENERATING = 'generating',
    ACTIVE = 'active',
    COMPLETED = 'completed',
    FAILED = 'failed',
    EXPIRED = 'expired',
    PURCHASED = 'purchased',
}


// ==================
// Request Types
// ==================

export interface PreviewCreateRequest {
    photo_urls: string[];
    child_name: string;
    child_age: number;
    child_gender: 'male' | 'female';
    theme: Theme;
    // style?: BookStyle; // V1: Removed - backend defaults to photorealistic
    session_id?: string;
    customer_email?: string;
}

// ==================
// Response Types
// ==================

export interface PhotoData {
    photo_id: string;
    photo_url: string;
    upload_order: number;
    face_valid: boolean;
    face_count: number;
    quality_score: number;
}

export interface PhotoUploadResponse {
    photos: PhotoData[];
    valid_photo_urls: string[];
    total_uploaded: number;
    valid_count: number;
    has_valid_photos: boolean;
    message: string;
}

export interface JobStartResponse {
    job_id: string;
    preview_id: string;
    status: JobStatus;
    estimated_time_seconds: number;
    message: string;
}

export interface JobStatusResponse {
    job_id: string;
    status: JobStatus;
    progress: number;
    current_step?: string;
    preview_id?: string;
    redirect_url?: string;
    error?: string;
    can_retry: boolean;
}

export interface PageData {
    page_number: number;
    image_url: string;
    story_text: string;
    is_watermarked?: boolean;
    is_locked?: boolean;
    /** V2: Original book index (0-25) for debugging/tracking */
    book_index?: number;
}

export interface PreviewResponse {
    preview_id: string;
    status: PreviewStatus;
    story_title: string;
    child_name: string;
    theme: Theme;
    style: BookStyle;
    cover_url?: string;
    preview_pages: PageData[];
    locked_pages?: PageData[];
    total_pages: number;
    preview_pages_count: number;
    locked_pages_count: number;
    expires_at: string;
    days_remaining: number;
    generation_phase?: 'preview' | 'generating_full' | 'pages_complete' | 'generating_pdf' | 'complete' | 'pdf_failed' | 'preparing_print' | 'submitting_print' | 'print_submitted' | 'print_failed';
    purchase: {
        price: number;
        currency: string;
        discount?: number;
    };
}

export interface DownloadResponse {
    status: 'generating' | 'ready' | 'failed' | 'pdf_missing' | 'not_purchased';
    downloads?: {
        pdf: {
            url: string;
            filename: string;
            size_mb?: number;
            expires_in_seconds: number;
        };
        images?: Array<{
            page: number;
            url: string;
            filename: string;
        }>;
    };
    progress?: number;
    message?: string;
    expires_at?: string;
    days_remaining?: number;
}

export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
}
