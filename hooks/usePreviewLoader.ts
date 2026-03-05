import { useState, useEffect } from 'react';
import { Storybook } from '../types';
import { api } from '../src/api/client';

export interface LockedPage {
    page_number: number;
    story_text: string;
}

export type GenerationPhase =
    | 'preview'
    | 'generating_full'
    | 'pages_complete'
    | 'generating_pdf'
    | 'complete'
    | 'pdf_failed'
    // Physical order phases
    | 'preparing_print'
    | 'submitting_print'
    | 'print_submitted'
    | 'print_failed';

export interface InitialPhaseState {
    /** Page loaded while generation was in progress */
    loadedDuringGeneration: boolean;
    /** Page loaded with generation already complete */
    loadedComplete: boolean;
}

interface UsePreviewLoaderReturn {
    book: Storybook | null;
    setBook: React.Dispatch<React.SetStateAction<Storybook | null>>;
    loading: boolean;
    integrityError: boolean;
    isExpired: boolean;
    lockedPages: LockedPage[];
    setLockedPages: React.Dispatch<React.SetStateAction<LockedPage[]>>;
    generationPhase: GenerationPhase;
    setGenerationPhase: React.Dispatch<React.SetStateAction<GenerationPhase>>;
    initialPhaseState: InitialPhaseState;
}

/**
 * Hook to load preview data from the API and map it to the Storybook type.
 * Handles initial data fetch, cover/page mapping, locked pages, and generation phase detection.
 */
export function usePreviewLoader(previewId: string | undefined): UsePreviewLoaderReturn {
    const [book, setBook] = useState<Storybook | null>(null);
    const [loading, setLoading] = useState(true);
    const [integrityError, setIntegrityError] = useState(false);
    const [isExpired, setIsExpired] = useState(false);
    const [lockedPages, setLockedPages] = useState<LockedPage[]>([]);
    const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('preview');
    const [initialPhaseState, setInitialPhaseState] = useState<InitialPhaseState>({
        loadedDuringGeneration: false,
        loadedComplete: false,
    });

    useEffect(() => {
        const loadBook = async () => {
            if (!previewId) return;
            try {
                const previewData = await api.getPreview(previewId);

                if (previewData) {
                    // Get cover URL and story title from API
                    const coverUrl = previewData.cover_url ||
                        previewData.preview_pages.find((p: any) => p.page_number === 0 || p.is_cover)?.image_url;
                    const storyTitle = previewData.story_title || `${previewData.child_name}'s Adventure`;

                    // Filter out cover page (page 0) from regular pages
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
                        paymentStatus: previewData.status === 'purchased' ? 'paid' : 'pending',
                        createdAt: new Date().toISOString()
                    };

                    setBook(mappedBook);

                    // Store locked pages
                    if (previewData.locked_pages) {
                        setLockedPages(previewData.locked_pages.map((lp: any) => ({
                            page_number: lp.page_number,
                            story_text: lp.story_text
                        })));
                    }

                    const phase = previewData.generation_phase || 'preview';
                    setGenerationPhase(phase);

                    // Detect what state the page loaded in, so the parent can trigger overlays/polling
                    // Physical phases included so page refresh during physical flow correctly restarts polling
                    const inProgressPhases: GenerationPhase[] = [
                        'generating_full', 'pages_complete', 'generating_pdf', 'pdf_failed',
                        'preparing_print', 'submitting_print',  // physical order in-flight phases
                    ];
                    if (inProgressPhases.includes(phase) && previewData.status === 'purchased') {
                        console.log('🔄 Page loaded during generation/print - auto-starting overlay');
                        setInitialPhaseState({ loadedDuringGeneration: true, loadedComplete: false });
                    }

                    // Both digital (complete) and physical (print_submitted/print_failed) are "done" states
                    // print_failed means PDF is ready but Lulu submission failed - user can still see all pages
                    if ((phase === 'complete' || phase === 'print_submitted' || phase === 'print_failed') && previewData.status === 'purchased') {
                        console.log('📖 Page loaded with complete/submitted order');
                        setInitialPhaseState({ loadedDuringGeneration: false, loadedComplete: true });
                    }

                    if (mappedBook.pages.length === 0) {
                        setIntegrityError(true);
                    }
                }
            } catch (error: any) {
                console.error("Failed to load book:", error);
                if (error.code === 'PREVIEW_EXPIRED' ||
                    error.message?.toLowerCase().includes('expired') ||
                    error.status === 410) {
                    setIsExpired(true);
                } else {
                    setIntegrityError(true);
                }
            } finally {
                setLoading(false);
            }
        };
        loadBook();
    }, [previewId]);

    return {
        book,
        setBook,
        loading,
        integrityError,
        isExpired,
        lockedPages,
        setLockedPages,
        generationPhase,
        setGenerationPhase,
        initialPhaseState,
    };
}
