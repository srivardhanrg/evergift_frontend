/**
 * Book Structure Converter - Transforms V2 API response to frontend BookStructureV2
 *
 * V2 API format (from /preview/{id}/v2):
 * {
 *   "book_structure": {
 *     "total_pages": 26,
 *     "preview_boundary": 12,
 *     "pages": [
 *       { "index": 0, "page_type": "cover", "image_url": "...", "is_generating": false, "is_generated": true, ... },
 *       { "index": 1, "page_type": "dedication", "image_url": "...", ... },
 *       ...
 *     ],
 *     "generation_progress": 50,
 *     "current_generating_page": 6,
 *     "pages_generated": 3,
 *     "total_ai_pages": 11,
 *     "filler_pages_ready": true
 *   }
 * }
 *
 * Frontend format (BookStructureV2):
 * {
 *   totalPages: 26,
 *   pages: [
 *     { index: 0, pageType: "cover", imageUrl: "...", isLocked: false, ... },
 *     ...
 *   ]
 * }
 */

import type {
  BookStructureV2,
  BookPageInfoV2,
  PageTypeV2,
  GenerationPhase,
} from '../../types/book.types';

// Map backend page_type to frontend PageTypeV2
const PAGE_TYPE_MAP: Record<string, PageTypeV2> = {
  'cover': 'cover',
  'dedication': 'dedication',
  'intro': 'intro_1', // Will be handled specially
  'generated': 'ai_page',
  'text': 'text_page',
  'end': 'end_page',
  'back_cover': 'back_cover',
};

// Map of index to page type (fallback if not in API response)
// NEW ORDER: Text on LEFT, AI on RIGHT
const INDEX_TO_PAGE_TYPE: Record<number, PageTypeV2> = {
  0: 'cover',
  1: 'dedication',
  2: 'intro_1',
  3: 'intro_2',
  4: 'text_page',  // Text page 1 (LEFT)
  5: 'ai_page',    // AI page 1 (RIGHT)
  6: 'text_page',  // Text page 2 (LEFT)
  7: 'ai_page',    // AI page 2 (RIGHT)
  8: 'text_page',  // Text page 3 (LEFT)
  9: 'ai_page',    // AI page 3 (RIGHT)
  10: 'text_page', // Text page 4 (LEFT)
  11: 'ai_page',   // AI page 4 (RIGHT)
  12: 'text_page', // Text page 5 (LEFT)
  13: 'ai_page',   // AI page 5 (RIGHT)
  14: 'text_page', // Text page 6 (LEFT)
  15: 'ai_page',   // AI page 6 (RIGHT)
  16: 'text_page', // Text page 7 (LEFT)
  17: 'ai_page',   // AI page 7 (RIGHT)
  18: 'text_page', // Text page 8 (LEFT)
  19: 'ai_page',   // AI page 8 (RIGHT)
  20: 'text_page', // Text page 9 (LEFT)
  21: 'ai_page',   // AI page 9 (RIGHT)
  22: 'text_page', // Text page 10 (LEFT)
  23: 'ai_page',   // AI page 10 (RIGHT)
  24: 'end_page',
  25: 'back_cover',
};

// Text pages map to theme page numbers (1-10) - NEW ORDER
const TEXT_PAGE_TO_THEME_PAGE: Record<number, number> = {
  4: 1,   // Text page 1
  6: 2,   // Text page 2
  8: 3,   // Text page 3
  10: 4,  // Text page 4
  12: 5,  // Text page 5
  14: 6,  // Text page 6
  16: 7,  // Text page 7
  18: 8,  // Text page 8
  20: 9,  // Text page 9
  22: 10, // Text page 10
};

// AI pages (for counting generated pages) - NEW ORDER
const AI_PAGE_INDICES = [0, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23];

// Filler pages (non-AI generated) - NEW ORDER
const FILLER_PAGE_INDICES = [1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 25];

// Preview boundary (pages 0-13 are preview, 14-25 are locked)
const PREVIEW_BOUNDARY = 13;

/**
 * Map backend page type string to frontend PageTypeV2
 */
function mapPageType(backendType: string, index: number): PageTypeV2 {
  // Handle intro pages specially (intro1, intro2)
  if (backendType === 'intro') {
    return index === 2 ? 'intro_1' : 'intro_2';
  }
  return PAGE_TYPE_MAP[backendType] || INDEX_TO_PAGE_TYPE[index] || 'ai_page';
}

/**
 * Convert V2 API book_structure response to frontend BookStructureV2 format
 *
 * This handles both:
 * 1. V2 API format: { total_pages, pages: [...], ... }
 * 2. Raw JSONB format: { "0": {...}, "4": {...}, ... } (fallback for compatibility)
 */
export function convertBackendBookStructureToV2(
  backendData: any,
  generationPhase: GenerationPhase
): BookStructureV2 {
  const isPurchased = backendData.paymentStatus === 'paid';

  // Get book_structure from backend data
  // Can be either:
  // 1. V2 API response: backendData.bookStructure = { total_pages, pages: [...] }
  // 2. Raw dict: backendData.bookStructure = { "0": {...}, "4": {...} }
  const bookStructure = backendData.bookStructure || {};

  // Detect if this is V2 API format (has 'pages' array) or raw dict format
  const isV2ApiFormat = Array.isArray(bookStructure.pages);

  let pages: BookPageInfoV2[] = [];
  let pagesGenerated = 0;
  let generationProgress = 0;
  let currentGeneratingPage: number | null = null;
  let fillerPagesReady = false;

  if (isV2ApiFormat) {
    // V2 API FORMAT: Use the structured response directly
    console.log('[BookStructureConverter] Using V2 API format');

    const apiPages = bookStructure.pages || [];
    pagesGenerated = bookStructure.pages_generated || 0;
    generationProgress = bookStructure.generation_progress || 0;
    currentGeneratingPage = bookStructure.current_generating_page ?? null;
    fillerPagesReady = bookStructure.filler_pages_ready || false;

    // Convert each page from API format to frontend format
    pages = apiPages.map((apiPage: any): BookPageInfoV2 => {
      const index = apiPage.index;
      const pageType = mapPageType(apiPage.page_type, index);
      const textPageNumber = TEXT_PAGE_TO_THEME_PAGE[index] || null;

      return {
        index,
        pageType,
        imageUrl: apiPage.image_url || null,
        storyText: apiPage.story_text || null,
        isPreview: apiPage.is_preview ?? (index <= PREVIEW_BOUNDARY),
        isLocked: apiPage.is_locked ?? (!isPurchased && index > PREVIEW_BOUNDARY),
        isFiller: apiPage.is_filler ?? FILLER_PAGE_INDICES.includes(index),
        isGenerating: apiPage.is_generating || false,
        isGenerated: apiPage.is_generated || false,
        requiresTextOverlay: apiPage.requires_text_overlay ?? (textPageNumber !== null),
        textPageNumber,
      };
    });

    // Ensure we have all 26 pages (fill in missing ones)
    if (pages.length < 26) {
      const existingIndices = new Set(pages.map(p => p.index));
      for (let i = 0; i < 26; i++) {
        if (!existingIndices.has(i)) {
          const textPageNumber = TEXT_PAGE_TO_THEME_PAGE[i] || null;
          pages.push({
            index: i,
            pageType: INDEX_TO_PAGE_TYPE[i] || 'ai_page',
            imageUrl: null,
            storyText: null,
            isPreview: i <= PREVIEW_BOUNDARY,
            isLocked: !isPurchased && i > PREVIEW_BOUNDARY,
            isFiller: FILLER_PAGE_INDICES.includes(i),
            isGenerating: false,
            isGenerated: false,
            requiresTextOverlay: textPageNumber !== null,
            textPageNumber,
          });
        }
      }
      // Sort by index
      pages.sort((a, b) => a.index - b.index);
    }

  } else {
    // RAW DICT FORMAT (LEGACY): { "0": {...}, "4": {...} }
    console.log('[BookStructureConverter] Using raw dict format (legacy)');

    const storyTexts = backendData.storyTexts || {};
    const fillerPagesProcessed = backendData.fillerPagesProcessed || {};

    for (let index = 0; index < 26; index++) {
      const pageData = bookStructure[index.toString()] || bookStructure[index] || {};
      const pageType = INDEX_TO_PAGE_TYPE[index];
      const isPreview = index <= PREVIEW_BOUNDARY;
      const isLocked = !isPurchased && index > PREVIEW_BOUNDARY;
      const isAiPage = AI_PAGE_INDICES.includes(index);
      const isFiller = FILLER_PAGE_INDICES.includes(index);
      const textPageNumber = TEXT_PAGE_TO_THEME_PAGE[index] || null;

      pages.push({
        index,
        pageType,
        imageUrl: pageData.url || null,
        storyText: textPageNumber ? (storyTexts[index.toString()] || storyTexts[index] || null) : null,
        isPreview,
        isLocked,
        isFiller,
        isGenerating: pageData.is_generating || false,
        isGenerated: pageData.is_generated || false,
        requiresTextOverlay: textPageNumber !== null,
        textPageNumber,
      });
    }

    // Count generated AI pages
    pagesGenerated = pages.filter(
      (p) => AI_PAGE_INDICES.includes(p.index) && p.isGenerated
    ).length;

    // Check if all filler pages are ready
    fillerPagesReady = FILLER_PAGE_INDICES.every(
      (idx) => fillerPagesProcessed[idx.toString()] === true || fillerPagesProcessed[idx] === true
    );

    // Calculate generation progress (NEW ORDER)
    if (generationPhase === 'complete') {
      generationProgress = 100;
    } else if (generationPhase === 'generating_remaining' || generationPhase === 'generating_pdf') {
      const lockedAiPages = [15, 17, 19, 21, 23];  // NEW ORDER
      const lockedGenerated = pages.filter(
        (p) => lockedAiPages.includes(p.index) && p.isGenerated
      ).length;
      generationProgress = 50 + (lockedGenerated / lockedAiPages.length) * 50;
    } else {
      const previewAiPages = [0, 5, 7, 9, 11, 13];  // NEW ORDER
      const previewGenerated = pages.filter(
        (p) => previewAiPages.includes(p.index) && p.isGenerated
      ).length;
      generationProgress = (previewGenerated / previewAiPages.length) * 50;
    }

    // Find currently generating page
    currentGeneratingPage = pages.find((p) => p.isGenerating)?.index || null;
  }

  return {
    totalPages: 26,
    previewBoundary: PREVIEW_BOUNDARY,
    previewPageCount: 14,  // Fixed: 14 preview pages (0-13)
    lockedPageCount: 12,    // Fixed: 12 locked pages (14-25)
    pages,
    generationProgress: Math.round(generationProgress),
    currentGeneratingPage,
    pagesGenerated,
    totalAiPages: AI_PAGE_INDICES.length,
    fillerPagesReady,
  };
}
