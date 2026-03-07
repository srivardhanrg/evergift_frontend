import { useState, useEffect, useRef, useCallback } from 'react';
import { Storybook } from '../types';
import { api, SHOPIFY_CONFIG, clearPendingCheckout, getFullStatus, FullStatusResponse } from '../src/api/client';
import { UnlockPhase } from '../components/UnlockingOverlay';
import {
    trackPurchaseCompleted,
    trackFunnelStep,
} from '../src/services/analytics';
import type { GenerationPhase, LockedPage } from './usePreviewLoader';
import { showToast } from '../src/components/Toast';

// Map backend generation_phase to frontend UnlockPhase
const mapGenerationPhaseToUnlockPhase = (phase: string): UnlockPhase => {
    switch (phase) {
        case 'generating_full':
            return 'generating';
        case 'pages_complete':
        case 'pdf_failed':
            return 'preparing_pdf';
        case 'complete':
            return 'complete';
        case 'preparing_print':
            return 'preparing_print';
        case 'submitting_print':
            return 'submitting_print';
        case 'print_submitted':
        case 'print_failed':  // Print failed but PDF is ready
            return 'print_submitted';
        default:
            return 'generating';
    }
};

interface UseGenerationPollingReturn {
    showUnlocking: boolean;
    unlockProgress: number;
    unlockPhase: UnlockPhase;
    checkoutSuccess: boolean;
    pollingPayment: boolean;
    isPdfReady: boolean;
    pdfPreparationTimeout: boolean;
    /** Order type: 'digital' or 'physical' */
    orderType: 'digital' | 'physical' | null;
    /** Print order status for physical orders */
    printOrderStatus: FullStatusResponse['print_order'] | null;
    /** Start payment polling (called when checkout_success=true detected) */
    startPaymentPolling: (previewId: string, orderType?: 'digital' | 'physical') => void;
    /** Start generation polling (called when page loads during generating_full) */
    startGenerationPolling: (previewId: string) => void;
    /** Retry PDF readiness check */
    handleRetryPdfCheck: (previewId: string) => void;
}

/**
 * Hook that manages the entire post-payment polling pipeline:
 * 1. Payment confirmation polling (after Shopify checkout redirect)
 * 2. Generation completion polling (pages 6-10 being created)
 * 3. PDF readiness polling (PDF uploaded to R2)
 * 
 * Also manages the UnlockingOverlay state (phase + progress).
 */
export function useGenerationPolling(
    previewId: string | undefined,
    book: Storybook | null,
    setBook: React.Dispatch<React.SetStateAction<Storybook | null>>,
    setLockedPages: React.Dispatch<React.SetStateAction<LockedPage[]>>,
    setGenerationPhase: React.Dispatch<React.SetStateAction<GenerationPhase>>,
    initialPhaseState: { loadedDuringGeneration: boolean; loadedComplete: boolean },
): UseGenerationPollingReturn {
    const [showUnlocking, setShowUnlocking] = useState(false);
    const [unlockProgress, setUnlockProgress] = useState(0);
    const [unlockPhase, setUnlockPhase] = useState<UnlockPhase>('payment');
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);
    const [pollingPayment, setPollingPayment] = useState(false);
    const [isPdfReady, setIsPdfReady] = useState(false);
    const [pdfPreparationTimeout, setPdfPreparationTimeout] = useState(false);
    const [orderType, setOrderType] = useState<'digital' | 'physical' | null>(null);
    const [printOrderStatus, setPrintOrderStatus] = useState<FullStatusResponse['print_order'] | null>(null);

    const isMountedRef = useRef(true);
    const pollingAbortRef = useRef(false);
    // Prevents verifyAndPoll from starting when startPaymentPolling is already active
    const activePollingRef = useRef(false);

    // ==========================================================================
    // CRITICAL HELPER: Fetch full preview data and rebuild book with all pages
    // This ensures pages 6-10 are always loaded after payment, not just metadata.
    // All code paths that complete payment MUST call this instead of just updating paymentStatus.
    // ==========================================================================
    const fetchAndRebuildBook = async (id: string): Promise<any> => {
        console.log('📚 Fetching full preview data to rebuild book with all pages...');
        const previewData = await api.getPreview(id);

        if (!isMountedRef.current) return previewData;

        const coverUrl = previewData.cover_url ||
            previewData.preview_pages.find((p: any) => p.page_number === 0 || p.is_cover)?.image_url;
        const storyTitle = previewData.story_title || `${previewData.child_name}'s Adventure`;
        const storyPages = previewData.preview_pages.filter(
            (p: any) => p.page_number > 0 && !p.is_cover
        );

        const rebuiltBook: Storybook = {
            id: previewData.preview_id,
            userId: 'current-user',
            childName: previewData.child_name,
            childAge: 5,
            childGender: 'Adventurer',
            theme: previewData.theme as unknown as any,
            coverUrl: coverUrl || '',
            storyTitle: storyTitle,
            pages: storyPages.map((p: any) => ({
                pageNumber: p.page_number,
                text: p.story_text,
                imagePrompt: 'Generated story',
                imageUrl: p.image_url
            })),
            paymentStatus: 'paid',
            createdAt: new Date().toISOString()
        };

        setBook(rebuiltBook);
        setLockedPages([]);
        console.log(`📚 Book rebuilt with ${storyPages.length} pages (expected: 10)`);

        // Warn if pages are incomplete - helps catch issues in testing
        if (storyPages.length < 10) {
            console.warn(`⚠️ Book has only ${storyPages.length} pages - expected 10. Backend may still be generating.`);
        }

        return previewData;
    };

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        pollingAbortRef.current = false;
        return () => {
            isMountedRef.current = false;
            pollingAbortRef.current = true;
        };
    }, []);

    // If page loaded with generation already complete, mark PDF as ready
    useEffect(() => {
        if (initialPhaseState.loadedComplete) {
            setIsPdfReady(true);
        }
    }, [initialPhaseState.loadedComplete]);

    // If page loaded during generation, verify it's still generating before showing overlay.
    // Skipped entirely if startPaymentPolling is already running (checkout_success flow).
    useEffect(() => {
        if (initialPhaseState.loadedDuringGeneration && previewId) {
            // Don't start a second polling loop if checkout_success flow is active
            if (activePollingRef.current) return;

            const verifyAndPoll = async () => {
                // CRITICAL: Resolve order_type from DB first — this is the page-refresh path
                // where there's no URL param or localStorage to rely on.
                let isPhysicalRefresh = false;
                try {
                    const fullStatus = await getFullStatus(previewId);
                    if (!isMountedRef.current || activePollingRef.current) return;
                    isPhysicalRefresh = fullStatus.order_type === 'physical';
                    if (fullStatus.order_type) {
                        setOrderType(fullStatus.order_type as 'digital' | 'physical');
                    }
                } catch (e) {
                    // If getFullStatus fails, continue with isPhysicalRefresh = false
                    console.warn('[verifyAndPoll] Could not resolve order_type from DB, defaulting to digital');
                }

                try {
                    const previewData = await api.getPreview(previewId);
                    if (!isMountedRef.current || activePollingRef.current) return;

                    const phase = previewData.generation_phase;

                    // --- Physical order phases ---
                    // CRITICAL: All physical order completion states must rebuild book with all pages
                    // using fetchAndRebuildBook, not just update paymentStatus
                    if (isPhysicalRefresh) {
                        if (phase === 'print_submitted') {
                            // Already submitted — rebuild book with all pages, no polling needed
                            console.log('📦 Refreshed on physical order — print already submitted');
                            await fetchAndRebuildBook(previewId);
                            setGenerationPhase('print_submitted');
                            return;
                        }
                        if (phase === 'print_failed') {
                            // Print failed but PDF is ready — rebuild book with all pages, no overlay
                            console.log('📦 Refreshed on physical order — print failed but PDF ready');
                            await fetchAndRebuildBook(previewId);
                            setGenerationPhase('print_failed');
                            setIsPdfReady(true); // PDF is ready even if print failed
                            return;
                        }
                        if (['preparing_print', 'submitting_print', 'pages_complete'].includes(phase)) {
                            // Pages are ready — rebuild book with all pages then continue polling
                            console.log('📦 Refreshed during physical order — rebuilding book and resuming polling at phase:', phase);
                            await fetchAndRebuildBook(previewId);
                            setShowUnlocking(true);
                            setUnlockPhase('preparing_print');
                            setUnlockProgress(70);
                            pollGenerationComplete(previewId, true);
                            return;
                        }
                        if (phase === 'generating_full') {
                            // Still generating pages — just update payment status and poll
                            // (pages not ready yet, fetchAndRebuildBook would return incomplete data)
                            console.log('📦 Refreshed during physical order generation — resuming polling');
                            setBook(prev => prev ? { ...prev, paymentStatus: 'paid' } : prev);
                            setShowUnlocking(true);
                            setUnlockPhase('generating');
                            setUnlockProgress(50);
                            pollGenerationComplete(previewId, true);
                            return;
                        }
                    }

                    // --- Digital order phases ---
                    if (phase === 'complete') {
                        // Already done — verify PDF then set ready (no full overlay)
                        console.log('📖 Generation already complete — verifying PDF');
                        const coverUrl = previewData.cover_url ||
                            previewData.preview_pages.find((p: any) => p.page_number === 0 || p.is_cover)?.image_url;
                        const storyTitle = previewData.story_title || `${previewData.child_name}'s Adventure`;
                        const storyPages = previewData.preview_pages.filter((p: any) => p.page_number > 0 && !p.is_cover);
                        setBook({
                            id: previewData.preview_id,
                            userId: 'current-user',
                            childName: previewData.child_name,
                            childAge: 5,
                            childGender: 'Adventurer',
                            theme: previewData.theme as unknown as any,
                            coverUrl: coverUrl || '',
                            storyTitle: storyTitle,
                            pages: storyPages.map((p: any) => ({
                                pageNumber: p.page_number,
                                text: p.story_text,
                                imagePrompt: 'Generated story',
                                imageUrl: p.image_url
                            })),
                            paymentStatus: 'paid',
                            createdAt: new Date().toISOString()
                        });
                        setLockedPages([]);
                        setGenerationPhase('complete');
                        setShowUnlocking(true);
                        setUnlockPhase('preparing_pdf');
                        setUnlockProgress(95);
                        pollPdfReady(previewId);
                        return;
                    }

                    if (phase === 'pages_complete') {
                        // Pages done, PDF still pending — update book with all 10 pages then poll PDF
                        console.log('📖 Pages complete — updating book with all pages and polling for PDF');
                        const coverUrl = previewData.cover_url ||
                            previewData.preview_pages.find((p: any) => p.page_number === 0 || p.is_cover)?.image_url;
                        const storyTitle = previewData.story_title || `${previewData.child_name}'s Adventure`;
                        const storyPages = previewData.preview_pages.filter((p: any) => p.page_number > 0 && !p.is_cover);
                        setBook({
                            id: previewData.preview_id,
                            userId: 'current-user',
                            childName: previewData.child_name,
                            childAge: 5,
                            childGender: 'Adventurer',
                            theme: previewData.theme as unknown as any,
                            coverUrl: coverUrl || '',
                            storyTitle: storyTitle,
                            pages: storyPages.map((p: any) => ({
                                pageNumber: p.page_number,
                                text: p.story_text,
                                imagePrompt: 'Generated story',
                                imageUrl: p.image_url
                            })),
                            paymentStatus: 'paid',
                            createdAt: new Date().toISOString()
                        });
                        setLockedPages([]);
                        setGenerationPhase('pages_complete');
                        setShowUnlocking(true);
                        setUnlockPhase('preparing_pdf');
                        setUnlockProgress(85);
                        pollPdfReady(previewId);
                        return;
                    }

                    if (phase === 'pdf_failed') {
                        // PDF creation failed — rebuild book with all pages, show retry state
                        console.log('📖 PDF failed — rebuilding book and showing retry option');
                        await fetchAndRebuildBook(previewId);
                        setGenerationPhase('pdf_failed');
                        setPdfPreparationTimeout(true);
                        return;
                    }

                    // Still generating pages — show overlay and poll
                    setShowUnlocking(true);
                    setUnlockPhase('generating');
                    setUnlockProgress(50);
                    pollGenerationComplete(previewId, isPhysicalRefresh);
                } catch (e) {
                    // If check fails, show overlay as fallback
                    if (!activePollingRef.current) {
                        setShowUnlocking(true);
                        setUnlockPhase('generating');
                        setUnlockProgress(50);
                        pollGenerationComplete(previewId, isPhysicalRefresh);
                    }
                }
            };
            verifyAndPoll();
        }
    }, [initialPhaseState.loadedDuringGeneration, previewId]);


    // Detect checkout success from URL
    // NOTE: With HashRouter, query params appear after the # (e.g., /#/preview/id?checkout_success=true)
    // so we must parse from hash, not window.location.search
    //
    // IMPORTANT: order_type is ALWAYS resolved from the DB (orders table), never from URL params.
    // The Shopify webhook writes order_type BEFORE the user is redirected, so the DB is always
    // correct even when Shopify drops the return_to URL and its query params are lost.
    useEffect(() => {
        const hashParts = window.location.hash.split('?');
        const hashQuery = hashParts.length > 1 ? hashParts[1] : '';
        const urlParams = new URLSearchParams(hashQuery);
        const isCheckoutSuccess = urlParams.get('checkout_success') === 'true';
        // URL order_type is intentionally ignored — DB is the source of truth.
        // Keeping this read only for logging/debugging purposes.
        const urlOrderTypeDebug = urlParams.get('order_type');
        console.log('[Polling] checkout_success detected. URL order_type (debug only):', urlOrderTypeDebug);

        if (isCheckoutSuccess && previewId) {
            clearPendingCheckout();
            setCheckoutSuccess(true);

            // Clean URL by removing query params from hash
            const cleanHash = hashParts[0];
            window.history.replaceState({}, '', window.location.pathname + cleanHash);

            // Mark polling active so verifyAndPoll effect (page-load path) skips itself
            activePollingRef.current = true;

            // Eagerly fetch order_type from DB.
            // Edge case: if webhook hasn't fired yet, order_type may be null —
            // in that case startPaymentPolling(undefined) and let the payment loop
            // re-resolve order_type once payment is confirmed (webhook guaranteed by then).
            getFullStatus(previewId)
                .then(status => {
                    if (!isMountedRef.current) return;
                    const dbOrderType = (status.order_type as 'digital' | 'physical') || undefined;
                    if (dbOrderType) {
                        console.log('[Polling] order_type from DB (eager):', dbOrderType);
                        setOrderType(dbOrderType);
                    } else {
                        console.warn('[Polling] DB order_type null (webhook in flight?) — will resolve after payment confirmation');
                    }
                    startPaymentPolling(previewId, dbOrderType);
                })
                .catch(() => {
                    if (!isMountedRef.current) return;
                    console.warn('[Polling] getFullStatus failed on eager fetch — starting polling without order_type, will resolve at payment confirmation');
                    // Start polling without order_type; the payment-confirmed step will fetch it
                    startPaymentPolling(previewId, undefined);
                });
        }
    }, [previewId]);

    // --- Poll for PDF readiness ---
    const pollPdfReady = async (id: string) => {
        const maxAttempts = 90; // 3 minutes max

        for (let i = 0; i < maxAttempts; i++) {
            if (!isMountedRef.current || pollingAbortRef.current) {
                console.log('🛑 PDF ready polling aborted');
                return;
            }

            setUnlockProgress(85 + Math.min(i * 0.16, 14));

            try {
                const downloadData = await api.getDownload(id);

                if (downloadData.status === 'ready' && downloadData.downloads?.pdf?.url) {
                    console.log('✅ PDF is ready for download!');
                    if (isMountedRef.current) {
                        setIsPdfReady(true);
                        setUnlockPhase('complete');
                        setUnlockProgress(100);

                        setTimeout(() => {
                            if (isMountedRef.current) {
                                setShowUnlocking(false);
                            }
                        }, 2000);
                    }
                    return;
                }

                // PDF file is missing — stop polling, show retry
                if (downloadData.status === 'pdf_missing') {
                    console.log('⚠️ PDF missing on R2 — showing retry option');
                    if (isMountedRef.current) {
                        setShowUnlocking(false);
                        setPdfPreparationTimeout(true);
                    }
                    return;
                }

                console.log(`⏳ PDF not ready yet (attempt ${i + 1}/${maxAttempts}), status: ${downloadData.status}`);
            } catch (e) {
                console.log(`⏳ PDF check failed (attempt ${i + 1}/${maxAttempts}), retrying...`);
            }

            await new Promise(r => setTimeout(r, 2000));
        }

        // Timeout
        console.warn('⚠️ PDF ready timeout after 3 minutes - PDF upload still in progress');
        if (isMountedRef.current) {
            setShowUnlocking(false);
            setPdfPreparationTimeout(true);
        }
    };

    // --- Poll for physical order print submission ---
    const pollPhysicalOrderComplete = async (id: string) => {
        const maxAttempts = 120; // 4 minutes for physical order
        console.log('📦 Starting physical order polling...');

        for (let i = 0; i < maxAttempts; i++) {
            if (!isMountedRef.current || pollingAbortRef.current) {
                console.log('🛑 Physical order polling aborted');
                return;
            }

            try {
                const fullStatus = await getFullStatus(id);

                if (!isMountedRef.current || pollingAbortRef.current) return;

                // Update print order status for UI
                if (fullStatus.print_order) {
                    setPrintOrderStatus(fullStatus.print_order);
                }

                // Map phase to unlock phase and update progress
                const phase = fullStatus.generation_phase;
                setUnlockPhase(mapGenerationPhaseToUnlockPhase(phase));

                // Progress based on phase
                if (phase === 'preparing_print') {
                    setUnlockProgress(75 + Math.min(i * 0.3, 10));
                } else if (phase === 'submitting_print') {
                    setUnlockProgress(88 + Math.min(i * 0.2, 8));
                } else if (phase === 'print_submitted') {
                    console.log('✅ Physical order submitted to Lulu!');
                    setUnlockProgress(100);
                    setUnlockPhase('print_submitted');
                    setGenerationPhase('print_submitted');

                    // Safety: Ensure book has all pages (should already be set, but verify)
                    // This handles edge cases where state might be stale
                    await fetchAndRebuildBook(id);

                    // Show success for a moment then hide overlay
                    setTimeout(() => {
                        if (isMountedRef.current) {
                            setShowUnlocking(false);
                            showToast('Your printed book order has been submitted! You\'ll receive tracking info soon.', 'success', 8000);
                        }
                    }, 3000);
                    return;
                } else if (phase === 'print_failed') {
                    console.log('⚠️ Print submission failed');
                    setGenerationPhase('print_failed');

                    // Safety: Ensure book has all pages
                    await fetchAndRebuildBook(id);
                    setIsPdfReady(true); // PDF is ready even if print failed

                    setShowUnlocking(false);
                    showToast('Print order failed. Your PDF is ready for download. We\'ll retry printing automatically.', 'error', 8000);
                    return;
                }

                console.log(`📦 Physical order phase: ${phase} (attempt ${i + 1}/${maxAttempts})`);
            } catch (e) {
                console.error('Physical order polling error:', e);
            }
            await new Promise(r => setTimeout(r, 2000));
        }

        // Timeout
        if (isMountedRef.current) {
            setShowUnlocking(false);
            showToast('Your print order is processing. Check back soon for tracking info!', 'info', 6000);
        }
    };

    // --- Poll for generation completion ---
    const pollGenerationComplete = async (id: string, isPhysical: boolean = false) => {
        const maxAttempts = 60; // 2 minutes

        for (let i = 0; i < maxAttempts; i++) {
            if (!isMountedRef.current || pollingAbortRef.current) {
                console.log('🛑 Generation polling aborted (component unmounted)');
                return;
            }

            try {
                const previewData = await api.getPreview(id);

                if (!isMountedRef.current || pollingAbortRef.current) return;

                setUnlockProgress(30 + (i * 0.9));
                setGenerationPhase(previewData.generation_phase || 'generating_full');

                // For digital orders: complete means done
                if (previewData.generation_phase === 'complete' && !isPhysical) {
                    console.log('✅ Generation complete! All 10 pages ready.');
                    setUnlockProgress(100);

                    const coverUrl = previewData.cover_url ||
                        previewData.preview_pages.find((p: any) => p.page_number === 0 || p.is_cover)?.image_url;
                    const storyTitle = previewData.story_title || `${previewData.child_name}'s Adventure`;

                    const storyPages = previewData.preview_pages.filter(
                        (p: any) => p.page_number > 0 && !p.is_cover
                    );

                    const mappedBook: Storybook = {
                        id: previewData.preview_id,
                        userId: 'current-user',
                        childName: previewData.child_name,
                        childAge: 5,
                        childGender: 'Adventurer',
                        theme: previewData.theme as unknown as any,
                        coverUrl: coverUrl || '',
                        storyTitle: storyTitle,
                        pages: storyPages.map((p: any) => ({
                            pageNumber: p.page_number,
                            text: p.story_text,
                            imagePrompt: 'Generated story',
                            imageUrl: p.image_url
                        })),
                        paymentStatus: 'paid',
                        createdAt: new Date().toISOString()
                    };
                    setBook(mappedBook);
                    setLockedPages([]);
                    setGenerationPhase('complete');

                    setUnlockPhase('preparing_pdf');
                    setUnlockProgress(85);

                    console.log('⏳ Verifying PDF is ready for download...');
                    await pollPdfReady(previewData.preview_id);
                    return;
                }

                // For physical orders: pages_complete or preparing_print means transition to physical polling.
                // IMPORTANT: update the book with ALL 10 pages NOW so the user sees them immediately
                // without needing to refresh — setBook is only called here, not in pollPhysicalOrderComplete.
                const physicalPhases = ['pages_complete', 'preparing_print', 'submitting_print', 'print_submitted'];
                if (isPhysical && physicalPhases.includes(previewData.generation_phase)) {
                    console.log('📦 Pages complete for physical order — updating book with all pages before print polling...');

                    // Rebuild book with all 10 pages now that they are ready
                    const coverUrl = previewData.cover_url ||
                        previewData.preview_pages.find((p: any) => p.page_number === 0 || p.is_cover)?.image_url;
                    const storyTitle = previewData.story_title || `${previewData.child_name}'s Adventure`;
                    const storyPages = previewData.preview_pages.filter(
                        (p: any) => p.page_number > 0 && !p.is_cover
                    );
                    setBook({
                        id: previewData.preview_id,
                        userId: 'current-user',
                        childName: previewData.child_name,
                        childAge: 5,
                        childGender: 'Adventurer',
                        theme: previewData.theme as unknown as any,
                        coverUrl: coverUrl || '',
                        storyTitle: storyTitle,
                        pages: storyPages.map((p: any) => ({
                            pageNumber: p.page_number,
                            text: p.story_text,
                            imagePrompt: 'Generated story',
                            imageUrl: p.image_url
                        })),
                        paymentStatus: 'paid',
                        createdAt: new Date().toISOString()
                    });
                    setLockedPages([]);

                    console.log(`📦 Book updated with ${storyPages.length} pages — transitioning to physical print polling`);
                    setUnlockPhase('preparing_print');
                    setUnlockProgress(70);
                    await pollPhysicalOrderComplete(id);
                    return;
                }

                // Pages are all generated but PDF creation is pending or failed (digital only)
                // CRITICAL: Must update book with all 10 pages here, not just at 'complete'
                if (previewData.generation_phase === 'pages_complete' && !isPhysical) {
                    console.log('✅ All pages generated! Updating book with all pages before PDF polling...');

                    // Rebuild book with all 10 pages now that they are ready
                    const coverUrl = previewData.cover_url ||
                        previewData.preview_pages.find((p: any) => p.page_number === 0 || p.is_cover)?.image_url;
                    const storyTitle = previewData.story_title || `${previewData.child_name}'s Adventure`;
                    const storyPages = previewData.preview_pages.filter(
                        (p: any) => p.page_number > 0 && !p.is_cover
                    );

                    setBook({
                        id: previewData.preview_id,
                        userId: 'current-user',
                        childName: previewData.child_name,
                        childAge: 5,
                        childGender: 'Adventurer',
                        theme: previewData.theme as unknown as any,
                        coverUrl: coverUrl || '',
                        storyTitle: storyTitle,
                        pages: storyPages.map((p: any) => ({
                            pageNumber: p.page_number,
                            text: p.story_text,
                            imagePrompt: 'Generated story',
                            imageUrl: p.image_url
                        })),
                        paymentStatus: 'paid',
                        createdAt: new Date().toISOString()
                    });
                    setLockedPages([]);

                    console.log(`📖 Book updated with ${storyPages.length} pages — now polling for PDF`);
                    setGenerationPhase('pages_complete');
                    setUnlockPhase('preparing_pdf');
                    setUnlockProgress(85);
                    await pollPdfReady(previewData.preview_id);
                    return;
                }

                if (previewData.generation_phase === 'pdf_failed') {
                    console.log('⚠️ PDF creation failed — showing retry option');
                    setGenerationPhase('pdf_failed');
                    setShowUnlocking(false);
                    setPdfPreparationTimeout(true);
                    return;
                }
            } catch (e) {
                console.error('Generation polling error:', e);
            }
            await new Promise(r => setTimeout(r, 2000));
        }

        if (isMountedRef.current) {
            setShowUnlocking(false);
            showToast('Your book is almost ready! We\'ll email you when it\'s complete.', 'success', 8000);
        }
    };

    // --- Poll for payment confirmation ---
    const startPaymentPolling = useCallback((id: string, passedOrderType?: 'digital' | 'physical') => {
        const poll = async () => {
            // Determine order type from URL or passed parameter
            const isPhysical = passedOrderType === 'physical';
            if (passedOrderType) {
                setOrderType(passedOrderType);
            }

            // FAST PATH: Use getFullStatus — single call returning order_type + is_complete + print_order.
            // This resolves order_type from DB in case the eager fetch in the effect failed or
            // returned null (webhook was still in flight). By now the webhook should be done.
            try {
                const fastStatus = await getFullStatus(id);
                if (!isMountedRef.current) return;

                // Resolve order_type: DB is authoritative. If still null, fall back to passed param.
                const fastIsPhysical =
                    fastStatus.order_type === 'physical' ? true
                        : fastStatus.order_type === 'digital' ? false
                            : isPhysical; // last resort: use what was passed

                // Sync orderType state if DB gave us new info
                if (fastStatus.order_type && fastStatus.order_type !== (fastIsPhysical ? 'physical' : 'digital')) {
                    setOrderType(fastStatus.order_type as 'digital' | 'physical');
                } else if (fastStatus.order_type) {
                    setOrderType(fastStatus.order_type as 'digital' | 'physical');
                }

                // For digital orders: already complete
                // CRITICAL: Must fetch full preview data including pages 6-10
                if (!fastIsPhysical && fastStatus.is_complete) {
                    console.log('⚡ Digital order already complete — fetching all pages and verifying PDF');
                    await fetchAndRebuildBook(id);
                    setGenerationPhase('complete');
                    setCheckoutSuccess(false);
                    setShowUnlocking(true);
                    setUnlockPhase('preparing_pdf');
                    setUnlockProgress(95);
                    await pollPdfReady(id);
                    activePollingRef.current = false;
                    return;
                }

                // For physical orders: already submitted to Lulu
                // CRITICAL: Must fetch full preview data including pages 6-10
                if (fastIsPhysical && fastStatus.generation_phase === 'print_submitted') {
                    console.log('⚡ Physical order already submitted to Lulu — fetching all pages');
                    await fetchAndRebuildBook(id);
                    setCheckoutSuccess(false);
                    setShowUnlocking(true);
                    setUnlockPhase('print_submitted');
                    setUnlockProgress(100);
                    if (fastStatus.print_order) setPrintOrderStatus(fastStatus.print_order);
                    setTimeout(() => {
                        if (isMountedRef.current) setShowUnlocking(false);
                    }, 3000);
                    activePollingRef.current = false;
                    return;
                }

                // For physical orders: print_failed - PDF is ready but Lulu failed
                // CRITICAL: Must fetch full preview data including pages 6-10
                if (fastIsPhysical && fastStatus.generation_phase === 'print_failed') {
                    console.log('⚡ Physical order print failed — fetching all pages (PDF still available)');
                    await fetchAndRebuildBook(id);
                    setCheckoutSuccess(false);
                    setGenerationPhase('print_failed');
                    setIsPdfReady(true);
                    if (fastStatus.print_order) setPrintOrderStatus(fastStatus.print_order);
                    activePollingRef.current = false;
                    return;
                }

                // For physical orders: mid-flight phases (pages generating, preparing_print, etc.)
                // Update isPhysical for the polling loop below
                if (fastIsPhysical !== isPhysical) {
                    // Reassign via closure capture — the loop below uses `isPhysical`
                    // We can't re-assign a const, so we update via a local flag
                    (poll as any).__resolvedIsPhysical = fastIsPhysical;
                }
            } catch (e) {
                // Fast-path failed — continue with normal polling, order_type stays as passed
                console.warn('[Polling] fast-path getFullStatus failed, continuing with polling:', e);
            }

            // Use resolved order type from fast-path if available
            const resolvedIsPhysical: boolean = (poll as any).__resolvedIsPhysical ?? isPhysical;

            // NOT complete yet — show overlay and start the full polling pipeline
            setPollingPayment(true);
            setShowUnlocking(true);
            setUnlockPhase('payment');
            setUnlockProgress(5);

            const maxPaymentAttempts = 15;

            for (let i = 0; i < maxPaymentAttempts; i++) {
                if (!isMountedRef.current || pollingAbortRef.current) {
                    console.log('🛑 Payment polling aborted (component unmounted)');
                    activePollingRef.current = false;
                    return;
                }

                try {
                    const previewData = await api.getPreview(id);

                    if (!isMountedRef.current || pollingAbortRef.current) return;

                    setUnlockProgress(5 + (i * 1.7));

                    if (previewData.status === 'purchased' || previewData.generation_phase !== 'preview') {
                        console.log('✅ Payment confirmed!');

                        trackPurchaseCompleted(
                            id,
                            SHOPIFY_CONFIG.PRODUCT_PRICE,
                            SHOPIFY_CONFIG.CURRENCY,
                            previewData.theme || 'unknown'
                        );
                        trackFunnelStep('purchase_complete', {
                            preview_id: id,
                            price: SHOPIFY_CONFIG.PRODUCT_PRICE,
                            currency: SHOPIFY_CONFIG.CURRENCY,
                        });

                        setBook(prev => prev ? { ...prev, paymentStatus: 'paid' } : prev);
                        setPollingPayment(false);
                        setCheckoutSuccess(false);

                        // CRITICAL: At this moment, payment is confirmed which means the Shopify
                        // webhook HAS fired and written order_type to the DB.
                        // Re-fetch order_type from DB to get the guaranteed correct value.
                        // This resolves any case where: (1) eager fetch got null, (2) URL had no param.
                        let confirmedIsPhysical = resolvedIsPhysical;
                        try {
                            const confirmedStatus = await getFullStatus(id);
                            if (confirmedStatus.order_type) {
                                confirmedIsPhysical = confirmedStatus.order_type === 'physical';
                                setOrderType(confirmedStatus.order_type as 'digital' | 'physical');
                                console.log('[Polling] order_type confirmed from DB at payment:', confirmedStatus.order_type);
                            }
                        } catch (e) {
                            console.warn('[Polling] Could not confirm order_type from DB at payment — using previously resolved value:', confirmedIsPhysical ? 'physical' : 'digital');
                        }

                        // Route through pollGenerationComplete which handles both
                        // digital (generating_full → complete → PDF) and
                        // physical (generating_full → preparing_print → print_submitted)
                        setUnlockPhase('generating');
                        setUnlockProgress(30);

                        await pollGenerationComplete(id, confirmedIsPhysical);
                        activePollingRef.current = false;
                        return;
                    }
                } catch (e) {
                    console.error('Polling error:', e);
                }
                await new Promise(r => setTimeout(r, 2000));
            }

            if (isMountedRef.current) {
                setPollingPayment(false);
                setShowUnlocking(false);
                showToast('Payment is still processing. Please refresh the page in a moment.', 'info', 6000);
            }
            activePollingRef.current = false;
        };

        poll();
    }, []);

    const startGenerationPolling = useCallback((id: string) => {
        setShowUnlocking(true);
        setUnlockPhase('generating');
        setUnlockProgress(50);
        pollGenerationComplete(id);
    }, []);

    const handleRetryPdfCheck = useCallback((id: string) => {
        setPdfPreparationTimeout(false);
        setShowUnlocking(true);
        setUnlockPhase('preparing_pdf');
        setUnlockProgress(85);
        pollPdfReady(id);
    }, []);

    return {
        showUnlocking,
        unlockProgress,
        unlockPhase,
        checkoutSuccess,
        pollingPayment,
        isPdfReady,
        pdfPreparationTimeout,
        orderType,
        printOrderStatus,
        startPaymentPolling,
        startGenerationPolling,
        handleRetryPdfCheck,
    };
}
