import { useState, useCallback, useRef } from 'react';
import { Storybook } from '../types';
import { api, SHOPIFY_CONFIG, isShopifyCustomerLoggedIn } from '../src/api/client';
import { hasChosenGuestMode } from '../components/AuthModal';
import {
    trackPdfDownloadStarted,
    trackPdfDownloadCompleted,
    trackPdfDownloadFailed,
    trackFunnelStep,
} from '../src/services/analytics';
import type { GenerationPhase } from './usePreviewLoader';

interface UsePdfDownloadReturn {
    isGeneratingPDF: boolean;
    /** Whether the download is being retried automatically */
    isRetrying: boolean;
    /** Initiate download — triggers auth modal check then fetches PDF */
    handleDownloadClick: () => void;
    /** Direct download execution (called after auth modal approval) */
    performDownload: () => void;
    /** Trigger PDF regeneration for missing/failed PDFs */
    handleRegeneratePdf: () => void;
}

/** Delay helper */
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Hook for PDF download logic:
 * - Auth modal gating for downloads
 * - Blob-based cross-origin download with fallback
 * - Auto-retry with backoff for "generating" status
 * - 15s timeout on download spinner
 * - PDF regeneration trigger for missing PDFs
 * - Friendly filename generation
 * - Analytics tracking
 */
export function usePdfDownload(
    book: Storybook | null,
    integrityError: boolean,
    generationPhase: GenerationPhase,
    isPdfReady: boolean,
    onAuthRequired: (action: 'download') => void,
): UsePdfDownloadReturn {
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const abortRef = useRef(false);

    const performDownload = useCallback(async () => {
        if (!book || integrityError) return;

        if (!isPdfReady) {
            alert('Your PDF is still being prepared. Please wait a moment and the download button will activate automatically when ready.');
            return;
        }

        setIsGeneratingPDF(true);
        abortRef.current = false;
        trackPdfDownloadStarted(book.id);

        // 15s timeout to prevent infinite spinner
        const timeoutId = setTimeout(() => {
            abortRef.current = true;
        }, 15000);

        try {
            if (book.paymentStatus !== 'paid') {
                alert('Please purchase to download the full PDF.');
                return;
            }

            // Retry loop: try up to 3 times for "generating" status
            const maxRetries = 3;
            const retryDelayMs = 5000;

            for (let attempt = 0; attempt < maxRetries; attempt++) {
                if (abortRef.current) break;

                if (attempt > 0) {
                    setIsRetrying(true);
                    await wait(retryDelayMs);
                    if (abortRef.current) break;
                }

                const downloadData = await api.getDownload(book.id);

                if (downloadData.status === 'ready' && downloadData.downloads?.pdf) {
                    // Success — download the PDF
                    const childNameClean = book.childName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
                    const themeName = (book.theme || 'Story')
                        .replace('storygift_', '')
                        .replace(/_/g, ' ')
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join('_');
                    const pdfFilename = `${childNameClean}_${themeName}_Storybook.pdf`;

                    try {
                        const response = await fetch(downloadData.downloads.pdf.url);
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);

                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = pdfFilename;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        const fileSizeMb = blob.size / (1024 * 1024);
                        trackPdfDownloadCompleted(book.id, fileSizeMb);
                        trackFunnelStep('download_complete', { file_size_mb: fileSizeMb });

                        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                    } catch (fetchError) {
                        console.warn('Blob download failed, using direct link:', fetchError);
                        trackPdfDownloadCompleted(book.id);
                        window.open(downloadData.downloads.pdf.url, '_blank');
                    }
                    return; // Success — exit retry loop
                }

                if (downloadData.status === 'pdf_missing') {
                    // PDF file is missing from R2 — offer to regenerate
                    trackPdfDownloadFailed(book.id, 'pdf_missing');
                    alert('Your story pages are ready, but the PDF file needs to be recreated. Click the "Retry PDF" button to regenerate it.');
                    return;
                }

                if (downloadData.status === 'generating') {
                    // Still generating — will retry if attempts remain
                    console.log(`📄 PDF not ready yet (attempt ${attempt + 1}/${maxRetries})`);
                    if (attempt === maxRetries - 1) {
                        // Last attempt — give up gracefully
                        trackPdfDownloadFailed(book.id, 'pdf_generating_timeout');
                        alert('Your PDF is still being prepared. This usually takes 2-3 minutes after payment. Please refresh the page and try again in a moment.');
                        return;
                    }
                    continue; // Retry
                }

                if (downloadData.status === 'not_purchased') {
                    alert('Please purchase to download the full PDF.');
                    return;
                }

                if (downloadData.status === 'failed') {
                    trackPdfDownloadFailed(book.id, 'generation_failed');
                    alert('Book generation failed. Please contact support for assistance.');
                    return;
                }

                // Unknown status
                throw new Error(`Unexpected download status: ${downloadData.status}`);
            }

            // If we exited due to timeout
            if (abortRef.current) {
                trackPdfDownloadFailed(book.id, 'download_timeout');
                alert('Download is taking longer than expected. Please refresh the page and try again.');
            }

        } catch (e: any) {
            console.error(e);
            trackPdfDownloadFailed(book.id, e.code || 'unknown_error');

            if (generationPhase !== 'complete') {
                alert("Your book pages are still being generated. This usually takes 1-2 minutes after payment. Please wait and the download button will activate automatically!");
            } else if (e.message?.includes('404') || e.code === 'NOT_FOUND') {
                alert("PDF file not found. Your book is being prepared - please refresh the page in 30 seconds. If this persists after 5 minutes, contact support and we'll help immediately!");
            } else {
                alert("Failed to download PDF. Please check your internet connection and try again. If the problem persists, refresh the page.");
            }
        } finally {
            clearTimeout(timeoutId);
            setIsGeneratingPDF(false);
            setIsRetrying(false);
        }
    }, [book, integrityError, isPdfReady, generationPhase]);

    const handleDownloadClick = useCallback(() => {
        if (!book || integrityError) return;

        if (!isShopifyCustomerLoggedIn() && !hasChosenGuestMode()) {
            onAuthRequired('download');
            return;
        }

        performDownload();
    }, [book, integrityError, performDownload, onAuthRequired]);

    const handleRegeneratePdf = useCallback(async () => {
        if (!book) return;

        try {
            setIsGeneratingPDF(true);
            const result = await api.regeneratePdf(book.id);

            if (result.status === 'already_ready') {
                // PDF exists — just download it
                performDownload();
                return;
            }

            if (result.status === 'regenerating' || result.status === 'already_generating') {
                alert('PDF is being regenerated. This usually takes 30-60 seconds. The download button will activate when ready.');
            }
        } catch (e: any) {
            console.error('PDF regeneration failed:', e);
            alert('Failed to start PDF regeneration. Please try again or contact support.');
        } finally {
            setIsGeneratingPDF(false);
        }
    }, [book, performDownload]);

    return {
        isGeneratingPDF,
        isRetrying,
        handleDownloadClick,
        performDownload,
        handleRegeneratePdf,
    };
}
