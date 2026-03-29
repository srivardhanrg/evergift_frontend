/**
 * usePreviewStateMachine - Production-grade state machine for preview lifecycle
 *
 * ARCHITECTURE:
 * This is the SINGLE source of truth for all preview-related state.
 * It replaces both usePreviewLoader and useGenerationPolling with one unified hook
 * that prevents race conditions by design.
 *
 * STATE MACHINE DESIGN:
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │                                                                              │
 * │  ┌──────┐    ┌─────────┐                                                    │
 * │  │ IDLE │───►│ LOADING │                                                    │
 * │  └──────┘    └────┬────┘                                                    │
 * │                   │                                                          │
 * │         ┌─────────┼─────────────────────────────┐                           │
 * │         │         │                             │                           │
 * │         ▼         ▼                             ▼                           │
 * │  ┌────────────┐ ┌───────────────────┐ ┌─────────────────┐                  │
 * │  │PREVIEW_ONLY│ │CONFIRMING_PAYMENT │ │RESUMING_PROGRESS│                  │
 * │  │(pre-payment)│ │(checkout_success) │ │(refresh during) │                  │
 * │  └────────────┘ └─────────┬─────────┘ └────────┬────────┘                  │
 * │                           │                     │                           │
 * │                           ▼                     │                           │
 * │                 ┌───────────────────┐◄──────────┘                           │
 * │                 │ POLLING_GENERATION│                                       │
 * │                 │  (pages 6-10)     │                                       │
 * │                 └─────────┬─────────┘                                       │
 * │                           │                                                  │
 * │            ┌──────────────┼──────────────┐                                  │
 * │            │              │              │                                  │
 * │            ▼              ▼              ▼                                  │
 * │    ┌────────────┐ ┌────────────┐ ┌─────────────────┐                       │
 * │    │POLLING_PDF │ │POLLING_PRINT│ │ ERROR          │                       │
 * │    │ (digital)  │ │ (physical)  │ │                │                       │
 * │    └──────┬─────┘ └──────┬─────┘ └─────────────────┘                       │
 * │           │              │                                                  │
 * │           ▼              ▼                                                  │
 * │    ┌────────────┐ ┌────────────┐                                           │
 * │    │  COMPLETE  │ │  COMPLETE  │                                           │
 * │    │  DIGITAL   │ │  PHYSICAL  │                                           │
 * │    └────────────┘ └────────────┘                                           │
 * │                                                                              │
 * └──────────────────────────────────────────────────────────────────────────────┘
 *
 * KEY GUARANTEES:
 * 1. Only ONE state transition path is active at any time
 * 2. Book state is updated atomically at well-defined points
 * 3. No competing useEffects that could overwrite each other
 * 4. Explicit handling of all edge cases (refresh, timeout, network errors)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Storybook, StoryPage } from '../types';
import {
    api,
    SHOPIFY_CONFIG,
    clearPendingCheckout,
    getFullStatus,
    FullStatusResponse
} from '../src/api/client';
import { UnlockPhase } from '../components/UnlockingOverlay';
import {
    trackPurchaseCompleted,
    trackFunnelStep,
} from '../src/services/analytics';
import { showToast } from '../src/components/Toast';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Machine states - explicit and exhaustive
 */
export type MachineState =
    | 'idle'                    // Initial state
    | 'loading'                 // Fetching initial preview data
    | 'preview_only'            // Pre-payment: showing preview + locked pages
    | 'confirming_payment'      // Post-checkout: waiting for payment confirmation
    | 'polling_generation'      // Generating pages 6-10
    | 'polling_pdf'             // Waiting for PDF to be ready (digital)
    | 'polling_print'           // Waiting for Lulu submission (physical)
    | 'complete_digital'        // Done: PDF ready for download
    | 'complete_physical'       // Done: Print job submitted
    | 'error';                  // Error state

/**
 * Backend generation phase values
 */
export type GenerationPhase =
    | 'preview'
    | 'generating_full'
    | 'pages_complete'
    | 'generating_pdf'
    | 'complete'
    | 'pdf_failed'
    | 'preparing_print'
    | 'submitting_print'
    | 'print_submitted'
    | 'print_failed';

/**
 * Locked page structure (for pre-payment UI)
 */
export interface LockedPage {
    page_number: number;
    story_text: string;
}

/**
 * Return type of the hook - everything the UI needs
 */
export interface UsePreviewStateMachineReturn {
    // Core state
    machineState: MachineState;
    book: Storybook | null;
    generationPhase: GenerationPhase;

    // UI state
    loading: boolean;
    integrityError: boolean;
    isExpired: boolean;
    lockedPages: LockedPage[];

    // Overlay state
    showOverlay: boolean;
    overlayProgress: number;
    overlayPhase: UnlockPhase;

    // PDF/completion state
    isPdfReady: boolean;
    pdfPreparationTimeout: boolean;

    // Order info
    orderType: 'digital' | 'physical' | null;
    printOrderStatus: FullStatusResponse['print_order'] | null;

    // Actions
    retryPdfCheck: () => void;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse checkout_success from URL hash (HashRouter format)
 */
function parseCheckoutSuccessFromUrl(): boolean {
    const hashParts = window.location.hash.split('?');
    const hashQuery = hashParts.length > 1 ? hashParts[1] : '';
    const urlParams = new URLSearchParams(hashQuery);
    return urlParams.get('checkout_success') === 'true';
}

/**
 * Clean checkout params from URL without reload
 */
function cleanCheckoutParamsFromUrl(): void {
    const hashParts = window.location.hash.split('?');
    const cleanHash = hashParts[0];
    window.history.replaceState({}, '', window.location.pathname + cleanHash);
}

/**
 * Map backend generation_phase to overlay UnlockPhase
 */
function mapToUnlockPhase(phase: GenerationPhase): UnlockPhase {
    switch (phase) {
        case 'generating_full':
            return 'generating';
        case 'pages_complete':
        case 'generating_pdf':
        case 'pdf_failed':
            return 'preparing_pdf';
        case 'complete':
            return 'complete';
        case 'preparing_print':
            return 'preparing_print';
        case 'submitting_print':
            return 'submitting_print';
        case 'print_submitted':
        case 'print_failed':
            return 'print_submitted';
        default:
            return 'generating';
    }
}

/**
 * Build Storybook object from API preview data (V2 format with book_structure)
 */
function buildBookFromPreviewData(previewData: any, paymentStatus: 'pending' | 'paid' = 'paid'): Storybook {
    const coverUrl = previewData.cover_url ||
        previewData.preview_pages?.find((p: any) => p.page_number === 0 || p.is_cover)?.image_url;
    const storyTitle = previewData.story_title || `${previewData.child_name}'s Adventure`;

    const storyPages = (previewData.preview_pages || []).filter(
        (p: any) => p.page_number > 0 && !p.is_cover
    );

    return {
        id: previewData.preview_id,
        userId: 'current-user',
        childName: previewData.child_name,
        childAge: previewData.child_age || 5,
        childGender: previewData.child_gender || 'Adventurer',
        theme: previewData.theme as any,
        coverUrl: coverUrl || '',
        storyTitle: storyTitle,
        pages: storyPages.map((p: any): StoryPage => ({
            pageNumber: p.page_number,
            text: p.story_text,
            imagePrompt: 'Generated story',
            imageUrl: p.image_url
        })),
        paymentStatus,
        createdAt: new Date().toISOString(),

        // V2 26-page book structure fields
        bookStructure: previewData.book_structure,
        fillerPagesProcessed: previewData.filler_pages_processed,
        storyTexts: previewData.story_texts,
        generationPhase: previewData.generation_phase,
        currentGeneratingPage: previewData.current_generating_page
    };
}

// =============================================================================
// MAIN HOOK
// =============================================================================

export function usePreviewStateMachine(previewId: string | undefined): UsePreviewStateMachineReturn {
    // =========================================================================
    // STATE DECLARATIONS
    // =========================================================================

    // Machine state - the single source of truth for what we're doing
    const [machineState, setMachineState] = useState<MachineState>('idle');

    // Book data
    const [book, setBook] = useState<Storybook | null>(null);
    const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('preview');
    const [lockedPages, setLockedPages] = useState<LockedPage[]>([]);

    // Loading/error states
    const [loading, setLoading] = useState(true);
    const [integrityError, setIntegrityError] = useState(false);
    const [isExpired, setIsExpired] = useState(false);

    // Overlay states
    const [showOverlay, setShowOverlay] = useState(false);
    const [overlayProgress, setOverlayProgress] = useState(0);
    const [overlayPhase, setOverlayPhase] = useState<UnlockPhase>('payment');

    // PDF/completion states
    const [isPdfReady, setIsPdfReady] = useState(false);
    const [pdfPreparationTimeout, setPdfPreparationTimeout] = useState(false);

    // Order info
    const [orderType, setOrderType] = useState<'digital' | 'physical' | null>(null);
    const [printOrderStatus, setPrintOrderStatus] = useState<FullStatusResponse['print_order'] | null>(null);

    // Refs for cleanup and abort control
    const isMountedRef = useRef(true);
    const abortRef = useRef(false);

    // Track if we've started the state machine to prevent re-entry
    const hasStartedRef = useRef(false);

    // =========================================================================
    // POLLING FUNCTIONS
    // =========================================================================

    /**
     * Poll for PDF readiness (digital orders)
     * Called after pages are complete
     */
    const pollPdfReady = useCallback(async (): Promise<boolean> => {
        if (!previewId) return false;

        const maxAttempts = 90; // 3 minutes max
        console.log('📄 [StateMachine] Starting PDF polling...');

        for (let i = 0; i < maxAttempts; i++) {
            if (!isMountedRef.current || abortRef.current) {
                console.log('🛑 [StateMachine] PDF polling aborted');
                return false;
            }

            setOverlayProgress(85 + Math.min(i * 0.16, 14));

            try {
                const downloadData = await api.getDownload(previewId);

                if (downloadData.status === 'ready' && downloadData.downloads?.pdf?.url) {
                    console.log('✅ [StateMachine] PDF is ready!');
                    return true;
                }

                if (downloadData.status === 'pdf_missing') {
                    console.log('⚠️ [StateMachine] PDF missing on R2');
                    return false;
                }

                console.log(`⏳ [StateMachine] PDF not ready (attempt ${i + 1}/${maxAttempts})`);
            } catch (e) {
                console.log(`⏳ [StateMachine] PDF check failed (attempt ${i + 1}/${maxAttempts})`);
            }

            await new Promise(r => setTimeout(r, 2000));
        }

        console.warn('⚠️ [StateMachine] PDF polling timeout');
        return false;
    }, [previewId]);

    /**
     * Poll for physical order completion (Lulu submission)
     */
    const pollPhysicalOrder = useCallback(async (): Promise<'submitted' | 'failed' | 'timeout'> => {
        if (!previewId) return 'timeout';

        const maxAttempts = 120; // 4 minutes
        console.log('📦 [StateMachine] Starting physical order polling...');

        for (let i = 0; i < maxAttempts; i++) {
            if (!isMountedRef.current || abortRef.current) {
                console.log('🛑 [StateMachine] Physical order polling aborted');
                return 'timeout';
            }

            try {
                const fullStatus = await getFullStatus(previewId);

                if (!isMountedRef.current || abortRef.current) return 'timeout';

                if (fullStatus.print_order) {
                    setPrintOrderStatus(fullStatus.print_order);
                }

                const phase = fullStatus.generation_phase;
                setOverlayPhase(mapToUnlockPhase(phase as GenerationPhase));

                if (phase === 'preparing_print') {
                    setOverlayProgress(75 + Math.min(i * 0.3, 10));
                } else if (phase === 'submitting_print') {
                    setOverlayProgress(88 + Math.min(i * 0.2, 8));
                } else if (phase === 'print_submitted') {
                    console.log('✅ [StateMachine] Physical order submitted!');
                    setOverlayProgress(100);
                    return 'submitted';
                } else if (phase === 'print_failed') {
                    console.log('⚠️ [StateMachine] Print submission failed');
                    return 'failed';
                }

                console.log(`📦 [StateMachine] Physical order phase: ${phase} (attempt ${i + 1}/${maxAttempts})`);
            } catch (e) {
                console.error('[StateMachine] Physical order polling error:', e);
            }
            await new Promise(r => setTimeout(r, 2000));
        }

        return 'timeout';
    }, [previewId]);

    /**
     * Poll for generation completion (pages 6-10)
     * Returns the final phase when complete
     */
    const pollGeneration = useCallback(async (isPhysical: boolean): Promise<GenerationPhase | null> => {
        if (!previewId) return null;

        const maxAttempts = 120; // 4 minutes (5 pages @ ~30-40s each)
        console.log(`📖 [StateMachine] Starting generation polling (isPhysical: ${isPhysical})...`);

        for (let i = 0; i < maxAttempts; i++) {
            if (!isMountedRef.current || abortRef.current) {
                console.log('🛑 [StateMachine] Generation polling aborted');
                return null;
            }

            try {
                const previewData = await api.getPreviewV2(previewId);

                if (!isMountedRef.current || abortRef.current) return null;

                setOverlayProgress(30 + (i * 0.9));
                const phase = previewData.generation_phase as GenerationPhase;
                setGenerationPhase(phase);

                // CRITICAL: Update book with current pages on every poll
                // This ensures incremental page display
                const updatedBook = buildBookFromPreviewData(previewData, 'paid');
                if (updatedBook.pages.length > 0) {
                    setBook(updatedBook);
                    setLockedPages([]);
                }

                // Check for completion conditions
                if (phase === 'complete' && !isPhysical) {
                    console.log('✅ [StateMachine] Generation complete (digital)');
                    return 'complete';
                }

                if (phase === 'pages_complete' && !isPhysical) {
                    console.log('✅ [StateMachine] Pages complete (digital), waiting for PDF');
                    return 'pages_complete';
                }

                const physicalReadyPhases = ['pages_complete', 'preparing_print', 'submitting_print', 'print_submitted'];
                if (isPhysical && physicalReadyPhases.includes(phase)) {
                    console.log(`✅ [StateMachine] Generation ready for physical order, phase: ${phase}`);
                    return phase;
                }

                if (phase === 'pdf_failed') {
                    console.log('⚠️ [StateMachine] PDF creation failed');
                    return 'pdf_failed';
                }

                if (phase === 'print_failed') {
                    console.log('⚠️ [StateMachine] Print submission failed');
                    return 'print_failed';
                }

                console.log(`⏳ [StateMachine] Generation phase: ${phase} (attempt ${i + 1}/${maxAttempts})`);
            } catch (e) {
                console.error('[StateMachine] Generation polling error:', e);
            }
            await new Promise(r => setTimeout(r, 2000));
        }

        console.warn('⚠️ [StateMachine] Generation polling timeout');
        return null;
    }, [previewId]);

    /**
     * Poll for payment confirmation
     * Returns true when payment is confirmed
     */
    const pollPaymentConfirmation = useCallback(async (): Promise<{ confirmed: boolean; isPhysical: boolean }> => {
        if (!previewId) return { confirmed: false, isPhysical: false };

        const maxAttempts = 15;
        console.log('💳 [StateMachine] Starting payment confirmation polling...');

        for (let i = 0; i < maxAttempts; i++) {
            if (!isMountedRef.current || abortRef.current) {
                console.log('🛑 [StateMachine] Payment polling aborted');
                return { confirmed: false, isPhysical: false };
            }

            setOverlayProgress(5 + (i * 1.7));

            try {
                const previewData = await api.getPreviewV2(previewId);

                if (!isMountedRef.current || abortRef.current) {
                    return { confirmed: false, isPhysical: false };
                }

                if (previewData.status === 'purchased' || previewData.generation_phase !== 'preview') {
                    console.log('✅ [StateMachine] Payment confirmed!');

                    // Track analytics
                    trackPurchaseCompleted(
                        previewId,
                        SHOPIFY_CONFIG.PRODUCT_PRICE,
                        SHOPIFY_CONFIG.CURRENCY,
                        previewData.theme || 'unknown'
                    );
                    trackFunnelStep('purchase_complete', {
                        preview_id: previewId,
                        price: SHOPIFY_CONFIG.PRODUCT_PRICE,
                        currency: SHOPIFY_CONFIG.CURRENCY,
                    });

                    // Get order type from DB (authoritative source)
                    let isPhysical = false;
                    try {
                        const fullStatus = await getFullStatus(previewId);
                        isPhysical = fullStatus.order_type === 'physical';
                        setOrderType(fullStatus.order_type as 'digital' | 'physical');
                        console.log(`[StateMachine] Order type from DB: ${fullStatus.order_type}`);
                    } catch (e) {
                        console.warn('[StateMachine] Could not get order type from DB');
                    }

                    return { confirmed: true, isPhysical };
                }

                console.log(`⏳ [StateMachine] Waiting for payment (attempt ${i + 1}/${maxAttempts})`);
            } catch (e) {
                console.error('[StateMachine] Payment polling error:', e);
            }
            await new Promise(r => setTimeout(r, 2000));
        }

        console.warn('⚠️ [StateMachine] Payment confirmation timeout');
        return { confirmed: false, isPhysical: false };
    }, [previewId]);

    // =========================================================================
    // MAIN STATE MACHINE ORCHESTRATOR
    // =========================================================================

    /**
     * The main orchestrator function that runs the entire state machine
     * This is called ONCE on mount and handles all state transitions
     */
    const runStateMachine = useCallback(async () => {
        if (!previewId || hasStartedRef.current) return;
        hasStartedRef.current = true;

        console.log('🚀 [StateMachine] Starting...');

        // =================================================================
        // PHASE 1: Initial Load
        // =================================================================
        setMachineState('loading');
        setLoading(true);

        // Check if this is a checkout return BEFORE fetching data
        const isCheckoutSuccess = parseCheckoutSuccessFromUrl();
        if (isCheckoutSuccess) {
            console.log('💳 [StateMachine] Checkout success detected');
            clearPendingCheckout();
            cleanCheckoutParamsFromUrl();
        }

        // Fetch initial preview data
        let previewData: any;
        try {
            previewData = await api.getPreviewV2(previewId);

            if (!isMountedRef.current || abortRef.current) return;

            console.log(`📖 [StateMachine] Preview loaded, phase: ${previewData.generation_phase}, status: ${previewData.status}`);
        } catch (error: any) {
            console.error('[StateMachine] Failed to load preview:', error);

            if (error.code === 'PREVIEW_EXPIRED' ||
                error.message?.toLowerCase().includes('expired') ||
                error.status === 410) {
                setIsExpired(true);
            } else {
                setIntegrityError(true);
            }
            setMachineState('error');
            setLoading(false);
            return;
        }

        // Build initial book state
        const initialPaymentStatus = previewData.status === 'purchased' ? 'paid' : 'pending';
        const initialBook = buildBookFromPreviewData(previewData, initialPaymentStatus);

        // V2 format uses book_structure.pages, legacy uses preview_pages
        // Check both - pass if either has content OR if pages exist but are still generating
        const hasLegacyPages = initialBook.pages.length > 0;
        const hasV2Pages = initialBook.bookStructure?.pages?.length > 0;

        // For V2, count pages with actual image URLs (not null)
        const v2PagesWithImages = initialBook.bookStructure?.pages?.filter(
            p => p.imageUrl !== null && p.imageUrl !== undefined && p.imageUrl !== ''
        ).length || 0;

        // During generation, book_structure exists but images may be null
        // Only show error if we have NO structure AND NO legacy pages
        if (!hasLegacyPages && !hasV2Pages) {
            console.error('[StateMachine] No pages in preview (checked both legacy and V2 formats)');
            setIntegrityError(true);
            setMachineState('error');
            setLoading(false);
            return;
        }

        // If we have V2 structure but no images yet, we're still generating - that's OK
        console.log('[StateMachine] Pages found', {
            legacyPages: initialBook.pages.length,
            v2Pages: initialBook.bookStructure?.pages?.length || 0,
            v2PagesWithImages: v2PagesWithImages
        });

        setBook(initialBook);
        setGenerationPhase(previewData.generation_phase || 'preview');

        // Set locked pages if in preview phase
        if (previewData.locked_pages) {
            setLockedPages(previewData.locked_pages.map((lp: any) => ({
                page_number: lp.page_number,
                story_text: lp.story_text
            })));
        }

        // Pre-set completion flags BEFORE setLoading(false) to eliminate the
        // "Creating your book..." flash on return visits to already-complete books.
        // Guard: only for purchased + non-checkout-redirect (return visits).
        const earlyPhase = previewData.generation_phase as GenerationPhase;
        const earlyIsPurchased = previewData.status === 'purchased';
        if (earlyIsPurchased && !isCheckoutSuccess) {
            if (earlyPhase === 'complete' || earlyPhase === 'pdf_failed') {
                setIsPdfReady(true);
            }
            if (earlyPhase === 'print_submitted') {
                setOverlayPhase('print_submitted');
            }
            if (earlyPhase === 'print_failed') {
                setIsPdfReady(true);
            }
        }

        setLoading(false);

        // =================================================================
        // PHASE 2: Determine Entry Point
        // =================================================================
        const phase = previewData.generation_phase as GenerationPhase;
        const isPurchased = previewData.status === 'purchased';

        // Resolve order type early
        let resolvedOrderType: 'digital' | 'physical' | null = null;
        if (isPurchased || isCheckoutSuccess) {
            try {
                const fullStatus = await getFullStatus(previewId);
                resolvedOrderType = fullStatus.order_type as 'digital' | 'physical' | null;
                if (resolvedOrderType) {
                    setOrderType(resolvedOrderType);
                }
                if (fullStatus.print_order) {
                    setPrintOrderStatus(fullStatus.print_order);
                }
            } catch (e) {
                console.warn('[StateMachine] Could not resolve order type');
            }
        }
        const isPhysical = resolvedOrderType === 'physical';

        // -----------------------------------------------------------------
        // ENTRY POINT 1: Checkout Success (post-payment redirect)
        // -----------------------------------------------------------------
        if (isCheckoutSuccess) {
            console.log('🎯 [StateMachine] Entry: Checkout success flow');

            // Show overlay and start payment confirmation
            setShowOverlay(true);
            setOverlayPhase('payment');
            setOverlayProgress(5);
            setMachineState('confirming_payment');

            // Check if already complete (fast path)
            try {
                const fullStatus = await getFullStatus(previewId);

                if (fullStatus.is_complete && !isPhysical) {
                    console.log('⚡ [StateMachine] Fast path: Already complete');
                    const freshData = await api.getPreviewV2(previewId);
                    setBook(buildBookFromPreviewData(freshData, 'paid'));
                    setGenerationPhase('complete');
                    setIsPdfReady(true);
                    setShowOverlay(false);
                    setMachineState('complete_digital');
                    return;
                }

                if (fullStatus.generation_phase === 'print_submitted' && isPhysical) {
                    console.log('⚡ [StateMachine] Fast path: Physical order already submitted');
                    const freshData = await api.getPreviewV2(previewId);
                    setBook(buildBookFromPreviewData(freshData, 'paid'));
                    setGenerationPhase('print_submitted');
                    setShowOverlay(false);
                    setMachineState('complete_physical');
                    return;
                }
            } catch (e) {
                console.warn('[StateMachine] Fast path check failed, continuing with polling');
            }

            // Poll for payment confirmation
            const { confirmed, isPhysical: confirmedIsPhysical } = await pollPaymentConfirmation();

            if (!isMountedRef.current || abortRef.current) return;

            if (!confirmed) {
                setShowOverlay(false);
                showToast('Payment is still processing. Please refresh the page.', 'info', 6000);
                setMachineState('error');
                return;
            }

            // Payment confirmed - transition to generation polling
            setOverlayPhase('generating');
            setOverlayProgress(30);
            setMachineState('polling_generation');

            // Poll for generation
            const finalPhase = await pollGeneration(confirmedIsPhysical);

            if (!isMountedRef.current || abortRef.current) return;

            if (!finalPhase) {
                // Timeout - don't show error, just hide overlay
                // User can refresh to see current state
                setShowOverlay(false);
                showToast('Your book is still being created. Check back in a moment!', 'info', 6000);
                return;
            }

            // Handle final states
            if (finalPhase === 'pdf_failed') {
                setShowOverlay(false);
                setPdfPreparationTimeout(true);
                setMachineState('error');
                return;
            }

            if (confirmedIsPhysical) {
                // Physical order - poll for print submission
                setOverlayPhase('preparing_print');
                setOverlayProgress(70);
                setMachineState('polling_print');

                const printResult = await pollPhysicalOrder();

                if (!isMountedRef.current || abortRef.current) return;

                // Ensure we have final book state
                const freshData = await api.getPreviewV2(previewId);
                setBook(buildBookFromPreviewData(freshData, 'paid'));

                if (printResult === 'submitted') {
                    setGenerationPhase('print_submitted');
                    setOverlayPhase('print_submitted');
                    setOverlayProgress(100);
                    setMachineState('complete_physical');

                    setTimeout(() => {
                        if (isMountedRef.current) {
                            setShowOverlay(false);
                            showToast('Your printed book order has been submitted! You\'ll receive tracking info soon.', 'success', 8000);
                        }
                    }, 3000);
                } else if (printResult === 'failed') {
                    setGenerationPhase('print_failed');
                    setIsPdfReady(true); // PDF is still available
                    setShowOverlay(false);
                    setMachineState('complete_physical');
                    showToast('Print order failed. Your PDF is ready for download.', 'error', 8000);
                } else {
                    // Timeout
                    setShowOverlay(false);
                    showToast('Your print order is processing. Check back soon!', 'info', 6000);
                    setMachineState('complete_physical');
                }
            } else {
                // Digital order - poll for PDF
                setOverlayPhase('preparing_pdf');
                setOverlayProgress(85);
                setMachineState('polling_pdf');

                const pdfReady = await pollPdfReady();

                if (!isMountedRef.current || abortRef.current) return;

                // Ensure we have final book state
                const freshData = await api.getPreviewV2(previewId);
                setBook(buildBookFromPreviewData(freshData, 'paid'));

                if (pdfReady) {
                    setIsPdfReady(true);
                    setOverlayPhase('complete');
                    setOverlayProgress(100);
                    setGenerationPhase('complete');
                    setMachineState('complete_digital');

                    setTimeout(() => {
                        if (isMountedRef.current) {
                            setShowOverlay(false);
                        }
                    }, 2000);
                } else {
                    setShowOverlay(false);
                    setPdfPreparationTimeout(true);
                    setMachineState('error');
                }
            }
            return;
        }

        // -----------------------------------------------------------------
        // ENTRY POINT 2: Resume In-Progress Generation (page refresh)
        // -----------------------------------------------------------------
        const inProgressPhases: GenerationPhase[] = [
            'generating_full', 'pages_complete', 'generating_pdf',
            'preparing_print', 'submitting_print'
        ];

        if (isPurchased && inProgressPhases.includes(phase)) {
            console.log(`🎯 [StateMachine] Entry: Resuming in-progress generation (phase: ${phase})`);

            setShowOverlay(true);
            setOverlayPhase(mapToUnlockPhase(phase));
            setMachineState('polling_generation');

            // Determine progress based on current phase
            if (phase === 'generating_full') {
                setOverlayProgress(50);
            } else if (phase === 'pages_complete' || phase === 'generating_pdf') {
                setOverlayProgress(85);
            } else {
                setOverlayProgress(70);
            }

            // If pages are already complete, update book first
            if (phase !== 'generating_full') {
                const freshData = await api.getPreviewV2(previewId);
                setBook(buildBookFromPreviewData(freshData, 'paid'));
            }

            // Continue polling from current state
            if (isPhysical && ['preparing_print', 'submitting_print'].includes(phase)) {
                // Already in print phase - poll for completion
                setMachineState('polling_print');
                const printResult = await pollPhysicalOrder();

                if (!isMountedRef.current || abortRef.current) return;

                const freshData = await api.getPreviewV2(previewId);
                setBook(buildBookFromPreviewData(freshData, 'paid'));

                if (printResult === 'submitted') {
                    setGenerationPhase('print_submitted');
                    setShowOverlay(false);
                    setMachineState('complete_physical');
                } else if (printResult === 'failed') {
                    setIsPdfReady(true);
                    setShowOverlay(false);
                    setMachineState('complete_physical');
                } else {
                    setShowOverlay(false);
                    setMachineState('complete_physical');
                }
            } else if (!isPhysical && (phase === 'pages_complete' || phase === 'generating_pdf')) {
                // Pages done, poll for PDF
                setMachineState('polling_pdf');
                const pdfReady = await pollPdfReady();

                if (!isMountedRef.current || abortRef.current) return;

                const freshData = await api.getPreviewV2(previewId);
                setBook(buildBookFromPreviewData(freshData, 'paid'));

                if (pdfReady) {
                    setIsPdfReady(true);
                    setGenerationPhase('complete');
                    setShowOverlay(false);
                    setMachineState('complete_digital');
                } else {
                    setShowOverlay(false);
                    setPdfPreparationTimeout(true);
                }
            } else {
                // Still generating pages - poll for generation then PDF/print
                const finalPhase = await pollGeneration(isPhysical);

                if (!isMountedRef.current || abortRef.current) return;

                if (!finalPhase) {
                    setShowOverlay(false);
                    return;
                }

                if (isPhysical) {
                    setMachineState('polling_print');
                    const printResult = await pollPhysicalOrder();

                    if (!isMountedRef.current || abortRef.current) return;

                    const freshData = await api.getPreviewV2(previewId);
                    setBook(buildBookFromPreviewData(freshData, 'paid'));

                    setShowOverlay(false);
                    setMachineState('complete_physical');

                    if (printResult === 'submitted') {
                        setGenerationPhase('print_submitted');
                    } else if (printResult === 'failed') {
                        setIsPdfReady(true);
                    }
                } else {
                    setMachineState('polling_pdf');
                    const pdfReady = await pollPdfReady();

                    if (!isMountedRef.current || abortRef.current) return;

                    const freshData = await api.getPreviewV2(previewId);
                    setBook(buildBookFromPreviewData(freshData, 'paid'));

                    if (pdfReady) {
                        setIsPdfReady(true);
                        setGenerationPhase('complete');
                    } else {
                        setPdfPreparationTimeout(true);
                    }
                    setShowOverlay(false);
                    setMachineState('complete_digital');
                }
            }
            return;
        }

        // -----------------------------------------------------------------
        // ENTRY POINT 3: Already Complete (page refresh after completion)
        // -----------------------------------------------------------------
        const completePhases: GenerationPhase[] = ['complete', 'print_submitted', 'print_failed'];

        if (isPurchased && completePhases.includes(phase)) {
            console.log(`🎯 [StateMachine] Entry: Already complete (phase: ${phase})`);

            if (phase === 'complete') {
                setIsPdfReady(true);
                setMachineState('complete_digital');
            } else {
                if (phase === 'print_failed') {
                    setIsPdfReady(true); // PDF still available
                }
                setMachineState('complete_physical');
            }
            return;
        }

        // -----------------------------------------------------------------
        // ENTRY POINT 4: PDF Failed (can retry)
        // -----------------------------------------------------------------
        if (isPurchased && phase === 'pdf_failed') {
            console.log('🎯 [StateMachine] Entry: PDF failed state');
            setPdfPreparationTimeout(true);
            setMachineState('error');
            return;
        }

        // -----------------------------------------------------------------
        // ENTRY POINT 5: Preview Generation In Progress (pre-payment)
        // -----------------------------------------------------------------
        if (!isPurchased && previewData.status === 'generating' && generation_phase === 'preview') {
            console.log('🎯 [StateMachine] Entry: Preview still generating (polling for completion)');

            setMachineState('preview_only');

            // Poll for preview completion
            const maxAttempts = 60; // 2 minutes (60 * 2 seconds)
            for (let i = 0; i < maxAttempts; i++) {
                if (!isMountedRef.current || abortRef.current) {
                    console.log('🛑 [StateMachine] Preview generation polling aborted');
                    return;
                }

                try {
                    const currentPreview = await api.getPreviewV2(previewId);

                    if (!isMountedRef.current || abortRef.current) return;

                    // Update book with latest pages
                    const updatedBook = buildBookFromPreviewData(currentPreview, 'pending');
                    setBook(updatedBook);
                    setGenerationPhase(currentPreview.generation_phase || 'preview');

                    // Check if generation completed
                    if (currentPreview.status === 'active' && currentPreview.generation_phase === 'preview') {
                        console.log('✅ [StateMachine] Preview generation completed');
                        return;
                    }

                    console.log(`⏳ [StateMachine] Preview generating (attempt ${i + 1}/${maxAttempts})`);
                } catch (e) {
                    console.error('[StateMachine] Preview generation polling error:', e);
                }

                await new Promise(r => setTimeout(r, 2000)); // Poll every 2 seconds
            }

            console.log('✅ [StateMachine] Preview generation polling complete (timeout or finished)');
            return;
        }

        // -----------------------------------------------------------------
        // ENTRY POINT 6: Preview Only (pre-payment, already complete)
        // -----------------------------------------------------------------
        console.log('🎯 [StateMachine] Entry: Preview only (pre-payment)');
        setMachineState('preview_only');

    }, [previewId, pollPaymentConfirmation, pollGeneration, pollPdfReady, pollPhysicalOrder]);

    // =========================================================================
    // EFFECTS
    // =========================================================================

    // Mount/unmount tracking
    useEffect(() => {
        isMountedRef.current = true;
        abortRef.current = false;

        return () => {
            isMountedRef.current = false;
            abortRef.current = true;
        };
    }, []);

    // Run state machine on mount
    useEffect(() => {
        if (previewId && !hasStartedRef.current) {
            runStateMachine();
        }
    }, [previewId, runStateMachine]);

    // =========================================================================
    // ACTIONS
    // =========================================================================

    const retryPdfCheck = useCallback(() => {
        if (!previewId) return;

        setPdfPreparationTimeout(false);
        setShowOverlay(true);
        setOverlayPhase('preparing_pdf');
        setOverlayProgress(85);
        setMachineState('polling_pdf');

        pollPdfReady().then(ready => {
            if (!isMountedRef.current) return;

            if (ready) {
                setIsPdfReady(true);
                setOverlayPhase('complete');
                setOverlayProgress(100);
                setMachineState('complete_digital');

                setTimeout(() => {
                    if (isMountedRef.current) {
                        setShowOverlay(false);
                    }
                }, 2000);
            } else {
                setShowOverlay(false);
                setPdfPreparationTimeout(true);
                setMachineState('error');
            }
        });
    }, [previewId, pollPdfReady]);

    // =========================================================================
    // RETURN
    // =========================================================================

    return {
        // Core state
        machineState,
        book,
        generationPhase,

        // UI state
        loading,
        integrityError,
        isExpired,
        lockedPages,

        // Overlay state
        showOverlay,
        overlayProgress,
        overlayPhase,

        // PDF/completion state
        isPdfReady,
        pdfPreparationTimeout,

        // Order info
        orderType,
        printOrderStatus,

        // Actions
        retryPdfCheck,
    };
}
