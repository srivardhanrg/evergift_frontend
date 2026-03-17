/**
 * usePreviewStateMachineV2 - State machine for 26-page book preview lifecycle
 *
 * This is the V2 version that works with the new 26-page book structure.
 * It fetches from the /preview/{id}/v2 endpoint and manages:
 * - Book structure with all 26 pages
 * - Generation progress tracking
 * - Purchase state
 * - PDF/physical order state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  PreviewResponseV2,
  BookStructureV2,
  BookPageInfoV2,
  PreviewStatus,
  GenerationPhase,
  BookStyle,
} from '../types/book.types';
import { api } from '../src/api/client';
import { showToast } from '../src/components/Toast';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Machine states for the V2 preview lifecycle
 */
export type MachineStateV2 =
  | 'idle'                // Initial state
  | 'loading'             // Fetching preview data
  | 'preview_ready'       // Preview pages available (pre-payment)
  | 'confirming_payment'  // Post-checkout, confirming payment
  | 'generating_locked'   // Generating locked pages (post-payment)
  | 'complete_digital'    // All pages + PDF ready
  | 'complete_physical'   // Physical order submitted
  | 'error'               // Error state
  | 'expired';            // Preview expired

/**
 * Return type of the hook
 */
export interface UsePreviewStateMachineV2Return {
  // Core state
  machineState: MachineStateV2;
  previewResponse: PreviewResponseV2 | null;
  bookStructure: BookStructureV2 | null;

  // UI state
  loading: boolean;
  error: string | null;

  // Book data
  storyTitle: string;
  childName: string;
  theme: string;
  style: BookStyle;
  isPurchased: boolean;
  generationPhase: GenerationPhase;

  // Progress
  generationProgress: number;
  pagesGenerated: number;
  currentGeneratingPage: number | null;

  // Completion
  pdfUrl: string | null;
  isPdfReady: boolean;

  // Days remaining
  daysRemaining: number;

  // Purchase info
  purchasePrice: string;
  checkoutUrl: string;

  // Actions
  refresh: () => void;
}

// =============================================================================
// POLLING CONFIGURATION
// =============================================================================

const POLL_INTERVAL_MS = 3000; // Poll every 3 seconds during generation
const MAX_POLL_TIME_MS = 10 * 60 * 1000; // Max 10 minutes of polling

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Transform API response (snake_case) to frontend types (camelCase)
 */
function transformPreviewResponse(data: Record<string, unknown>): PreviewResponseV2 {
  const bookStructure = data.book_structure as Record<string, unknown>;
  const pages = (bookStructure.pages as Array<Record<string, unknown>>).map((p) => ({
    index: p.index as number,
    pageType: p.page_type as string,
    imageUrl: p.image_url as string | null,
    storyText: p.story_text as string | null,
    isPreview: p.is_preview as boolean,
    isLocked: p.is_locked as boolean,
    isFiller: p.is_filler as boolean,
    isGenerating: p.is_generating as boolean,
    isGenerated: p.is_generated as boolean,
    requiresTextOverlay: p.requires_text_overlay as boolean,
    textPageNumber: p.text_page_number as number | null,
  })) as BookPageInfoV2[];

  return {
    previewId: data.preview_id as string,
    status: data.status as PreviewStatus,
    generationPhase: data.generation_phase as GenerationPhase,
    storyTitle: data.story_title as string,
    childName: data.child_name as string,
    theme: data.theme as string,
    style: data.style as BookStyle,
    bookStructure: {
      totalPages: bookStructure.total_pages as number,
      previewBoundary: bookStructure.preview_boundary as number,
      previewPageCount: bookStructure.preview_page_count as number,
      lockedPageCount: bookStructure.locked_page_count as number,
      pages,
      generationProgress: bookStructure.generation_progress as number,
      currentGeneratingPage: bookStructure.current_generating_page as number | null,
      pagesGenerated: bookStructure.pages_generated as number,
      totalAiPages: bookStructure.total_ai_pages as number,
      fillerPagesReady: bookStructure.filler_pages_ready as boolean,
    },
    coverUrl: data.cover_url as string | null,
    previewPages: [],
    lockedPages: null,
    totalPages: data.total_pages as number,
    previewPagesCount: data.preview_pages_count as number,
    lockedPagesCount: data.locked_pages_count as number,
    expiresAt: data.expires_at as string,
    daysRemaining: data.days_remaining as number,
    purchase: data.purchase as {
      price: number;
      currency: string;
      priceFormatted: string;
      checkoutUrl: string;
    },
    pdfUrl: data.pdf_url as string | null,
    testingMode: data.testing_mode as boolean | undefined,
    analyzedFeatures: data.analyzed_features as string | undefined,
    generationModel: data.generation_model as string | undefined,
  };
}

/**
 * Check if checkout was just completed (from URL params)
 */
function checkCheckoutSuccess(): boolean {
  const hash = window.location.hash;
  return hash.includes('checkout_success=true');
}

// =============================================================================
// THE HOOK
// =============================================================================

export function usePreviewStateMachineV2(previewId: string): UsePreviewStateMachineV2Return {
  // State
  const [machineState, setMachineState] = useState<MachineStateV2>('idle');
  const [previewResponse, setPreviewResponse] = useState<PreviewResponseV2 | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup
  const pollIntervalRef = useRef<number | null>(null);
  const pollStartTimeRef = useRef<number | null>(null);

  // Cleanup polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    pollStartTimeRef.current = null;
  }, []);

  // Fetch preview data
  const fetchPreview = useCallback(async (): Promise<PreviewResponseV2 | null> => {
    try {
      const response = await api.get(`/preview/${previewId}/v2`);

      if (response.success && response.data) {
        return transformPreviewResponse(response.data as Record<string, unknown>);
      }

      throw new Error(response.error?.message || 'Failed to load preview');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load preview';
      setError(errorMessage);
      return null;
    }
  }, [previewId]);

  // Determine machine state from preview response
  const updateMachineState = useCallback(
    (preview: PreviewResponseV2) => {
      const { status, generationPhase, pdfUrl } = preview;

      // Check for expiration
      const expiresAt = new Date(preview.expiresAt);
      if (expiresAt < new Date()) {
        setMachineState('expired');
        stopPolling();
        return;
      }

      // Determine state based on status and phase
      if (status === 'failed') {
        setMachineState('error');
        setError('Preview generation failed');
        stopPolling();
        return;
      }

      if (status === 'purchased') {
        // Purchased - check generation phase
        if (generationPhase === 'complete' && pdfUrl) {
          setMachineState('complete_digital');
          stopPolling();
        } else if (
          generationPhase === 'print_submitted' ||
          generationPhase === 'print_failed'
        ) {
          setMachineState('complete_physical');
          stopPolling();
        } else {
          // Still generating
          setMachineState('generating_locked');
        }
      } else if (status === 'ready') {
        // Check if just completed checkout
        if (checkCheckoutSuccess()) {
          setMachineState('confirming_payment');
        } else {
          setMachineState('preview_ready');
          stopPolling(); // No polling needed for preview
        }
      } else if (status === 'generating') {
        // Still generating initial preview
        setMachineState('loading');
      } else {
        setMachineState('preview_ready');
        stopPolling();
      }
    },
    [stopPolling]
  );

  // Start polling for generation updates
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return; // Already polling

    pollStartTimeRef.current = Date.now();

    pollIntervalRef.current = window.setInterval(async () => {
      // Check timeout
      if (
        pollStartTimeRef.current &&
        Date.now() - pollStartTimeRef.current > MAX_POLL_TIME_MS
      ) {
        stopPolling();
        setError('Generation is taking longer than expected. Please refresh.');
        showToast({
          type: 'warning',
          message: 'Generation timeout. Please refresh the page.',
        });
        return;
      }

      const preview = await fetchPreview();
      if (preview) {
        setPreviewResponse(preview);
        updateMachineState(preview);
      }
    }, POLL_INTERVAL_MS);
  }, [fetchPreview, updateMachineState, stopPolling]);

  // Initial load
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setMachineState('loading');
      const preview = await fetchPreview();

      if (!mounted) return;

      if (preview) {
        setPreviewResponse(preview);
        updateMachineState(preview);

        // Start polling if needed
        if (
          preview.status === 'purchased' &&
          preview.generationPhase !== 'complete' &&
          !preview.pdfUrl
        ) {
          startPolling();
        }
      } else {
        setMachineState('error');
      }
    };

    init();

    return () => {
      mounted = false;
      stopPolling();
    };
  }, [previewId, fetchPreview, updateMachineState, startPolling, stopPolling]);

  // Manual refresh
  const refresh = useCallback(async () => {
    setMachineState('loading');
    setError(null);
    const preview = await fetchPreview();
    if (preview) {
      setPreviewResponse(preview);
      updateMachineState(preview);
    } else {
      setMachineState('error');
    }
  }, [fetchPreview, updateMachineState]);

  // Derived values
  const bookStructure = previewResponse?.bookStructure || null;
  const loading = machineState === 'loading' || machineState === 'idle';
  const isPurchased =
    previewResponse?.status === 'purchased' ||
    machineState === 'generating_locked' ||
    machineState === 'complete_digital' ||
    machineState === 'complete_physical';

  return {
    // Core state
    machineState,
    previewResponse,
    bookStructure,

    // UI state
    loading,
    error,

    // Book data
    storyTitle: previewResponse?.storyTitle || '',
    childName: previewResponse?.childName || '',
    theme: previewResponse?.theme || '',
    style: (previewResponse?.style as BookStyle) || 'photorealistic',
    isPurchased,
    generationPhase: previewResponse?.generationPhase || 'preview',

    // Progress
    generationProgress: bookStructure?.generationProgress || 0,
    pagesGenerated: bookStructure?.pagesGenerated || 0,
    currentGeneratingPage: bookStructure?.currentGeneratingPage || null,

    // Completion
    pdfUrl: previewResponse?.pdfUrl || null,
    isPdfReady: !!previewResponse?.pdfUrl,

    // Days remaining
    daysRemaining: previewResponse?.daysRemaining || 0,

    // Purchase info
    purchasePrice: previewResponse?.purchase?.priceFormatted || '₹599',
    checkoutUrl: previewResponse?.purchase?.checkoutUrl || '',

    // Actions
    refresh,
  };
}

export default usePreviewStateMachineV2;
