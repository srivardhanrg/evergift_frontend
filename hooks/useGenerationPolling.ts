import { useState, useEffect, useRef, useCallback } from 'react';
import { Storybook } from '../types';
import { api, SHOPIFY_CONFIG, clearPendingCheckout } from '../src/api/client';
import { UnlockPhase } from '../components/UnlockingOverlay';
import {
    trackPurchaseCompleted,
    trackFunnelStep,
} from '../src/services/analytics';
import type { GenerationPhase, LockedPage } from './usePreviewLoader';

interface UseGenerationPollingReturn {
    showUnlocking: boolean;
    unlockProgress: number;
    unlockPhase: UnlockPhase;
    checkoutSuccess: boolean;
    pollingPayment: boolean;
    isPdfReady: boolean;
    pdfPreparationTimeout: boolean;
    /** Start payment polling (called when checkout_success=true detected) */
    startPaymentPolling: (previewId: string) => void;
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

    const isMountedRef = useRef(true);
    const pollingAbortRef = useRef(false);

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

    // If page loaded during generation, verify it's still generating before showing overlay
    useEffect(() => {
        if (initialPhaseState.loadedDuringGeneration && previewId) {
            // Quick check: generation may have completed since the initial load
            const verifyAndPoll = async () => {
                try {
                    const previewData = await api.getPreview(previewId);
                    if (!isMountedRef.current) return;

                    if (previewData.generation_phase === 'complete') {
                        // Already done — just set final state, no overlay
                        console.log('📖 Generation already complete — skipping overlay');
                        setBook(prev => prev ? { ...prev, paymentStatus: 'paid' } : prev);
                        setGenerationPhase('complete');
                        setIsPdfReady(true);
                        return;
                    }

                    if (previewData.generation_phase === 'pages_complete') {
                        // Pages done, PDF still pending — skip to PDF polling
                        console.log('📖 Pages complete — polling for PDF');
                        setBook(prev => prev ? { ...prev, paymentStatus: 'paid' } : prev);
                        setGenerationPhase('pages_complete');
                        setShowUnlocking(true);
                        setUnlockPhase('preparing_pdf');
                        setUnlockProgress(85);
                        pollPdfReady(previewId);
                        return;
                    }

                    if (previewData.generation_phase === 'pdf_failed') {
                        // PDF creation failed — no overlay, show retry state
                        console.log('📖 PDF failed — showing retry option');
                        setBook(prev => prev ? { ...prev, paymentStatus: 'paid' } : prev);
                        setGenerationPhase('pdf_failed');
                        setPdfPreparationTimeout(true);
                        return;
                    }

                    // Still generating — show overlay and poll
                    setShowUnlocking(true);
                    setUnlockPhase('generating');
                    setUnlockProgress(50);
                    pollGenerationComplete(previewId);
                } catch (e) {
                    // If check fails, show overlay as fallback
                    setShowUnlocking(true);
                    setUnlockPhase('generating');
                    setUnlockProgress(50);
                    pollGenerationComplete(previewId);
                }
            };
            verifyAndPoll();
        }
    }, [initialPhaseState.loadedDuringGeneration, previewId]);

    // Detect checkout success from URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const isCheckoutSuccess = urlParams.get('checkout_success') === 'true';

        if (isCheckoutSuccess && previewId) {
            clearPendingCheckout();
            setCheckoutSuccess(true);
            window.history.replaceState({}, '', window.location.pathname);
            startPaymentPolling(previewId);
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

    // --- Poll for generation completion ---
    const pollGenerationComplete = async (id: string) => {
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

                if (previewData.generation_phase === 'complete') {
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

                // Pages are all generated but PDF creation is pending or failed
                if (previewData.generation_phase === 'pages_complete') {
                    console.log('✅ All pages generated! Now waiting for PDF...');
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
            alert('Your book is almost ready! We\'ll email you when it\'s complete.');
        }
    };

    // --- Poll for payment confirmation ---
    const startPaymentPolling = useCallback((id: string) => {
        const poll = async () => {
            // FAST PATH: Check if everything is already complete before showing overlay
            // This handles page refreshes / revisits after generation finished
            try {
                const quickCheck = await api.getPreview(id);
                if (!isMountedRef.current) return;

                if (quickCheck.generation_phase === 'complete' && quickCheck.status === 'purchased') {
                    console.log('⚡ Already complete — skipping overlay entirely');
                    setBook(prev => prev ? { ...prev, paymentStatus: 'paid' } : prev);
                    setGenerationPhase('complete');
                    setIsPdfReady(true);
                    setCheckoutSuccess(false);
                    return;
                }
            } catch (e) {
                // If quick check fails, continue with normal polling
            }

            // NOT complete yet — show overlay and start the full polling pipeline
            setPollingPayment(true);
            setShowUnlocking(true);
            setUnlockPhase('payment');
            setUnlockProgress(5);

            const maxPaymentAttempts = 15;

            for (let i = 0; i < maxPaymentAttempts; i++) {
                if (!isMountedRef.current || pollingAbortRef.current) {
                    console.log('🛑 Payment polling aborted (component unmounted)');
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

                        // Check if generation already complete (fast path)
                        if (previewData.generation_phase === 'complete') {
                            console.log('⚡ Generation already complete during payment check');
                            setGenerationPhase('complete');
                            setIsPdfReady(true);
                            setShowUnlocking(false);
                            return;
                        }

                        setUnlockPhase('generating');
                        setUnlockProgress(30);

                        await pollGenerationComplete(id);
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
                alert('Payment is still processing. Please refresh the page in a moment.');
            }
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
        startPaymentPolling,
        startGenerationPolling,
        handleRetryPdfCheck,
    };
}
