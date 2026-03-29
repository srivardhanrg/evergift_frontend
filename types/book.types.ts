/**
 * Type definitions for 26-page book viewer (V2)
 *
 * Book Structure:
 * - 26 total pages (indices 0-25)
 * - Cover at index 0 (AI-generated)
 * - Dedication at index 1 (filler + text overlay)
 * - Intro pages at indices 2-3 (filler, no text)
 * - Alternating generated/text pages for the story
 * - End page and back cover at indices 24-25
 *
 * Preview shows pages 0-12 (13 pages)
 * Locked pages are 13-25 (13 pages)
 */

// Page types for the 26-page structure
// These values are produced by bookStructureConverter.ts
export type PageTypeV2 =
  | 'cover'       // Index 0: AI-generated cover with child's face
  | 'dedication'  // Index 1: Filler with personalized text overlay
  | 'intro_1'     // Index 2: Intro filler page 1 (no text)
  | 'intro_2'     // Index 3: Intro filler page 2 (no text)
  | 'ai_page'     // AI-generated story pages (indices 4,6,8,10,12,14,16,18,20,22)
  | 'text_page'   // Text overlay pages (indices 5,7,9,11,13,15,17,19,21,23)
  | 'end_page'    // Index 24: End page filler
  | 'back_cover'  // Index 25: Back cover filler
  // Legacy compatibility aliases
  | 'intro'       // Maps to intro_1 or intro_2
  | 'generated'   // Maps to ai_page
  | 'text';       // Maps to text_page

// Legacy page type for backward compatibility
export type PageType = 'cover' | 'generated' | 'constant' | 'back_cover';

export interface TextConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  font: string;
  fontSize: number;
  lineHeight: number;
  color: string;
  nameColor: string;
  background: string;
  borderRadius?: number;
  padding?: number;
  textAlign?: 'left' | 'center' | 'right';
  dropCap?: boolean;
  dropCapColor?: string;
}

export interface PageConfig {
  pageNumber: number;
  pageType: PageType;
  templateUrl?: string;
  storyText?: string;
  textConfig?: TextConfig;
}

export interface GeneratedPage {
  pageNumber: number;
  imageUrl: string;
}

export interface ThemeConfig {
  theme: string;
  themeTitle: string;
  totalPages: number;
  pages: PageConfig[];
  fonts?: FontConfig[];
}

export interface FontConfig {
  name: string;
  url: string;
  weight: number;
}

export interface BookViewerProps {
  previewId: string;
  childName: string;
  theme: string;
  coverUrl: string;
  generatedPages: GeneratedPage[];
  isPaid: boolean;
  onPageChange?: (page: number) => void;
}

export interface BookPage {
  pageNumber: number;
  type: PageType;
  content: GeneratedPageContent | TemplatePageContent;
}

export interface GeneratedPageContent {
  imageUrl: string;
  showWatermark: boolean;
}

export interface TemplatePageContent {
  templateUrl: string;
  storyText?: string;
  textConfig?: TextConfig;
  childName: string;
  showWatermark: boolean;
}

// ==========================================
// V2 Book Structure Types (26-page)
// ==========================================

/**
 * Information about a single page in the 26-page book structure.
 * Maps to BookPageInfo from backend schemas.
 */
export interface BookPageInfoV2 {
  index: number;          // 0-25
  pageType: PageTypeV2;
  imageUrl: string | null;
  storyText: string | null;
  isPreview: boolean;     // True for pages 0-12
  isLocked: boolean;      // True for pages 13-25 (until purchased)
  isFiller: boolean;      // True for non-AI pages
  isGenerating: boolean;  // True if currently being AI-generated
  isGenerated: boolean;   // True if AI generation complete
  requiresTextOverlay: boolean;
  textPageNumber: number | null; // For text pages, 1-10
}

/**
 * Complete 26-page book structure.
 * Maps to BookStructureResponse from backend schemas.
 */
export interface BookStructureV2 {
  totalPages: number;        // 26
  previewBoundary: number;   // 12 (last preview page index)
  previewPageCount: number;  // 13
  lockedPageCount: number;   // 13
  pages: BookPageInfoV2[];   // All 26 pages

  // Generation progress
  generationProgress: number;           // 0-100
  currentGeneratingPage: number | null; // Index of page being generated
  pagesGenerated: number;               // AI pages generated so far
  totalAiPages: number;                 // 11 (cover + 10 story)

  // Filler status
  fillerPagesReady: boolean;
}

/**
 * V2 Preview response with 26-page book structure.
 * Maps to PreviewResponseV2 from backend schemas.
 */
export interface PreviewResponseV2 {
  previewId: string;
  status: PreviewStatus;
  generationPhase: GenerationPhase;

  // Story metadata
  storyTitle: string;
  childName: string;
  theme: string;
  style: BookStyle;

  // Book structure
  bookStructure: BookStructureV2;

  // Legacy fields (backward compatibility)
  coverUrl: string | null;
  previewPages: LegacyPageData[];
  lockedPages: LegacyPageData[] | null;
  totalPages: number;
  previewPagesCount: number;
  lockedPagesCount: number;

  // Expiration
  expiresAt: string;
  daysRemaining: number;

  // Purchase
  purchase: PurchaseInfo;

  // PDF
  pdfUrl: string | null;

  // Metadata
  testingMode?: boolean;
  analyzedFeatures?: string;
  generationModel?: string;
}

/**
 * Legacy page data for backward compatibility.
 */
export interface LegacyPageData {
  pageNumber: number;
  imageUrl: string;
  storyText: string;
  isWatermarked: boolean;
  isLocked: boolean;
  isCover: boolean;
}

/**
 * Preview status enum.
 */
export type PreviewStatus =
  | 'generating'
  | 'ready'
  | 'purchased'
  | 'failed'
  | 'expired';

/**
 * Generation phase enum.
 */
export type GenerationPhase =
  | 'preview'          // Only first 5 AI pages generated
  | 'generating_full'  // Remaining pages being generated (post-payment)
  | 'complete';        // All pages and PDF ready

/**
 * Book style enum.
 * V1: Only photorealistic style is supported. Cartoon style removed for simplification.
 */
export type BookStyle = 'photorealistic'; // | 'cartoon_3d' - Removed for v1

/**
 * Purchase information.
 */
export interface PurchaseInfo {
  price: number;
  currency: string;
  priceFormatted: string;
  checkoutUrl: string;
}

/**
 * Generation progress response for polling.
 * Maps to GenerationProgressResponse from backend schemas.
 */
export interface GenerationProgressV2 {
  jobId: string;
  status: JobStatus;
  progress: number;              // 0-100
  previewId: string | null;

  // Page-level progress
  currentPhase: GenerationProgressPhase;
  currentPageIndex: number | null;
  currentPageType: string | null;
  pagesCompleted: number[];
  totalAiPagesInPhase: number;
  aiPagesCompleted: number;

  // Filler status
  fillerPagesProcessed: boolean;

  // Display helpers
  stepDescription: string;
  estimatedSecondsRemaining: number | null;

  // Completion
  redirectUrl: string | null;
  error: string | null;
  canRetry: boolean;
}

/**
 * Generation progress phase.
 */
export type GenerationProgressPhase =
  | 'initializing'
  | 'analyzing_face'
  | 'generating_cover'
  | 'generating_pages'
  | 'processing_fillers'
  | 'complete';

/**
 * Job status enum.
 */
export type JobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

// ==========================================
// V2 Book Viewer Props
// ==========================================

/**
 * Props for the V2 book viewer component.
 */
export interface BookViewerV2Props {
  previewId: string;
  childName: string;
  theme: string;
  style: BookStyle;
  bookStructure: BookStructureV2;
  isPurchased: boolean;
  generationPhase: GenerationPhase;
  onPageChange?: (pageIndex: number) => void;
  onPurchaseClick?: () => void;
}

/**
 * Props for individual page components.
 */
export interface PageComponentProps {
  page: BookPageInfoV2;
  childName: string;
  theme: string;
  isPurchased: boolean;
}

/**
 * Props for locked page overlay.
 */
export interface LockedPageProps {
  page: BookPageInfoV2;
  totalLockedPages: number;
  onPurchaseClick?: () => void;
}

/**
 * Props for generating page animation.
 */
export interface GeneratingPageProps {
  page: BookPageInfoV2;
  progress: number;
  stepDescription?: string;
}

// ==========================================
// Page Index Constants
// ==========================================

/**
 * AI-generated page indices in the 26-page book.
 */
export const AI_PAGE_INDICES = [0, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22] as const;

/**
 * Preview AI page indices (visible before purchase).
 */
export const PREVIEW_AI_INDICES = [0, 4, 6, 8, 10, 12] as const;

/**
 * Locked AI page indices (visible after purchase).
 */
export const LOCKED_AI_INDICES = [14, 16, 18, 20, 22] as const;

/**
 * Text page indices (filler with story text overlay).
 */
export const TEXT_PAGE_INDICES = [5, 7, 9, 11, 13, 15, 17, 19, 21, 23] as const;

/**
 * Preview boundary - pages 0-12 are preview, 13-25 are locked.
 */
export const PREVIEW_BOUNDARY = 12;

/**
 * Total pages in the book.
 */
export const TOTAL_PAGES = 26;
