/**
 * Book Structure Converter - Transforms backend book_structure to frontend BookStructureV2
 *
 * Backend format (book_structure JSONB):
 * {
 *   "0": { "type": "generated", "url": "...", "is_locked": false, "is_generated": true },
 *   "1": { "type": "filler", "url": "...", "is_locked": false },
 *   ...
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

// Map of index to page type
const INDEX_TO_PAGE_TYPE: Record<number, PageTypeV2> = {
  0: 'cover',
  1: 'dedication',
  2: 'intro_1',
  3: 'intro_2',
  4: 'ai_page',
  5: 'text_page',
  6: 'ai_page',
  7: 'text_page',
  8: 'ai_page',
  9: 'text_page',
  10: 'ai_page',
  11: 'text_page',
  12: 'ai_page',
  13: 'text_page',
  14: 'ai_page',
  15: 'text_page',
  16: 'ai_page',
  17: 'text_page',
  18: 'ai_page',
  19: 'text_page',
  20: 'ai_page',
  21: 'text_page',
  22: 'ai_page',
  23: 'text_page',
  24: 'end_page',
  25: 'back_cover',
};

// Text pages map to theme page numbers (1-10)
const TEXT_PAGE_TO_THEME_PAGE: Record<number, number> = {
  5: 1,
  7: 2,
  9: 3,
  11: 4,
  13: 5,
  15: 6,
  17: 7,
  19: 8,
  21: 9,
  23: 10,
};

// AI pages (for counting generated pages)
const AI_PAGE_INDICES = [0, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

// Filler pages (non-AI generated)
const FILLER_PAGE_INDICES = [1, 2, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 24, 25];

// Preview boundary (pages 0-12 are preview, 13-25 are locked)
const PREVIEW_BOUNDARY = 12;

/**
 * Convert backend book structure to V2 format
 */
export function convertBackendBookStructureToV2(
  backendData: any,
  generationPhase: GenerationPhase
): BookStructureV2 {
  const bookStructure = backendData.bookStructure || {};
  const storyTexts = backendData.storyTexts || {};
  const fillerPagesProcessed = backendData.fillerPagesProcessed || {};
  const isPurchased = backendData.paymentStatus === 'paid';

  // Build pages array
  const pages: BookPageInfoV2[] = [];

  for (let index = 0; index < 26; index++) {
    const pageData = bookStructure[index.toString()] || {};
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
      storyText: textPageNumber ? storyTexts[index.toString()] || null : null,
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
  const pagesGenerated = pages.filter(
    (p) => AI_PAGE_INDICES.includes(p.index) && p.isGenerated
  ).length;

  // Check if all filler pages are ready
  const fillerPagesReady = FILLER_PAGE_INDICES.every(
    (idx) => fillerPagesProcessed[idx.toString()] === true
  );

  // Calculate generation progress
  let generationProgress = 0;
  if (generationPhase === 'complete') {
    generationProgress = 100;
  } else if (generationPhase === 'generating_remaining' || generationPhase === 'generating_pdf') {
    // Post-payment: 50% + (remaining AI pages / total AI pages) * 50%
    const lockedAiPages = [14, 16, 18, 20, 22]; // 5 locked AI pages
    const lockedGenerated = pages.filter(
      (p) => lockedAiPages.includes(p.index) && p.isGenerated
    ).length;
    generationProgress = 50 + (lockedGenerated / lockedAiPages.length) * 50;
  } else {
    // Preview generation: (preview AI pages / total preview AI pages) * 50%
    const previewAiPages = [0, 4, 6, 8, 10, 12]; // 6 preview AI pages
    const previewGenerated = pages.filter(
      (p) => previewAiPages.includes(p.index) && p.isGenerated
    ).length;
    generationProgress = (previewGenerated / previewAiPages.length) * 50;
  }

  // Find currently generating page
  const currentGeneratingPage =
    pages.find((p) => p.isGenerating)?.index || null;

  return {
    totalPages: 26,
    previewBoundary: PREVIEW_BOUNDARY,
    previewPageCount: 13,
    lockedPageCount: 13,
    pages,
    generationProgress: Math.round(generationProgress),
    currentGeneratingPage,
    pagesGenerated,
    totalAiPages: AI_PAGE_INDICES.length,
    fillerPagesReady,
  };
}
