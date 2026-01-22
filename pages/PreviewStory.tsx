import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Storybook } from '../types';
import { STORYBOOK_PRICE, THEMES } from '../constants';
import {
  Sparkles,
  CheckCircle,
  Download,
  Loader2,
  AlertTriangle,
  ShoppingCart,
  PartyPopper,
  ArrowLeft
} from 'lucide-react';
import * as storage from '../services/storageService';
import {
  api,
  buyNowWithShopify,
  SHOPIFY_CONFIG,
  isShopifyEnvironment,
  isShopifyCustomerLoggedIn,
  clearPendingCheckout,
} from '../src/api/client';
import BookPageCard from '../components/BookPageCard';
import CoverPageCard from '../components/CoverPageCard';
import OptimizedImage from '../components/OptimizedImage';
import AuthModal, { hasChosenGuestMode } from '../components/AuthModal';
import { LockedPagesSection } from '../components/LockedPageCard';
import UnlockingOverlay from '../components/UnlockingOverlay';

// Responsive CSS to override Shopify theme conflicts
const PreviewResponsiveStyles = () => (
  <style>{`
    #sg-desktop-back { display: none !important; }
    #sg-mobile-back { display: block !important; }
    @media (min-width: 768px) {
      #sg-desktop-back { display: block !important; }
      #sg-mobile-back { display: none !important; }
    }
  `}</style>
);

const PreviewStory: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState<Storybook | null>(null);
  const [integrityError, setIntegrityError] = useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'download' | 'payment' | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [pollingPayment, setPollingPayment] = useState(false);

  // NEW: Locked pages state for 5-page preview mode
  const [lockedPages, setLockedPages] = useState<Array<{ page_number: number; story_text: string }>>([]);
  const [generationPhase, setGenerationPhase] = useState<'preview' | 'generating_full' | 'complete'>('preview');

  // NEW: Unlocking overlay state
  const [showUnlocking, setShowUnlocking] = useState(false);
  const [unlockProgress, setUnlockProgress] = useState(0);
  const [customerEmail, setCustomerEmail] = useState('');

  // Ref to track if component is mounted (for cleanup)
  const isMountedRef = useRef(true);
  const pollingAbortRef = useRef<boolean>(false);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    isMountedRef.current = true;
    pollingAbortRef.current = false;

    return () => {
      isMountedRef.current = false;
      pollingAbortRef.current = true;
    };
  }, []);

  useEffect(() => {
    const loadBook = async () => {
      if (!id) return;
      try {
        const previewData = await api.getPreview(id);

        // Map API response to frontend Storybook type
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

          // Store locked pages and generation phase
          if (previewData.locked_pages) {
            setLockedPages(previewData.locked_pages.map((lp: any) => ({
              page_number: lp.page_number,
              story_text: lp.story_text
            })));
          }

          const phase = previewData.generation_phase || 'preview';
          setGenerationPhase(phase);

          // AUTO-START: If page loads and generation is in progress, show overlay and poll
          if (phase === 'generating_full' && previewData.status === 'purchased') {
            console.log('🔄 Page loaded during generation - auto-starting overlay');
            setShowUnlocking(true);
            setUnlockProgress(60);
            // Will poll in separate effect
          }

          if (mappedBook.pages.length === 0) {
            setIntegrityError(true);
          }
        }
      } catch (error) {
        console.error("Failed to load book:", error);
        setIntegrityError(true);
      } finally {
        setLoading(false);
      }
    };
    loadBook();
  }, [id]);

  // Detect checkout success from URL and poll for payment status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isCheckoutSuccess = urlParams.get('checkout_success') === 'true';

    if (isCheckoutSuccess && id) {
      // Clear any pending checkout since we're now processing it
      clearPendingCheckout();

      setCheckoutSuccess(true);
      // Clean URL without reload
      window.history.replaceState({}, '', window.location.pathname);

      // Start polling for payment confirmation
      pollPaymentStatus(id);
    }
  }, [id]);

  // AUTO-POLL: Start polling when page loads in generating_full phase (e.g., after refresh)
  useEffect(() => {
    if (showUnlocking && generationPhase === 'generating_full' && id && !pollingPayment) {
      console.log('🔄 Auto-starting generation poll on page load');
      pollGenerationComplete(id);
    }
  }, [showUnlocking, generationPhase, id]);

  // Poll backend until payment confirmed AND generation complete
  const pollPaymentStatus = async (previewId: string) => {
    setPollingPayment(true);
    setShowUnlocking(true);
    setUnlockProgress(10);

    const maxPaymentAttempts = 15; // 30 seconds for payment confirmation

    // Phase 1: Poll for payment confirmation
    for (let i = 0; i < maxPaymentAttempts; i++) {
      // Check if component unmounted or polling was aborted
      if (!isMountedRef.current || pollingAbortRef.current) {
        console.log('🛑 Payment polling aborted (component unmounted)');
        return;
      }

      try {
        const previewData = await api.getPreview(previewId);

        // Check again after async call
        if (!isMountedRef.current || pollingAbortRef.current) return;

        setUnlockProgress(10 + (i * 3)); // Progress 10-55%

        if (previewData.status === 'purchased' || previewData.generation_phase !== 'preview') {
          console.log('✅ Payment confirmed!');
          setBook(prev => prev ? { ...prev, paymentStatus: 'paid' } : prev);
          setPollingPayment(false);
          setCheckoutSuccess(false);
          setUnlockProgress(60);

          // Phase 2: Poll for generation completion
          await pollGenerationComplete(previewId);
          return;
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    // Timeout - only update state if still mounted
    if (isMountedRef.current) {
      setPollingPayment(false);
      setShowUnlocking(false);
      alert('Payment is still processing. Please refresh the page in a moment.');
    }
  };

  // Poll for remaining page generation to complete
  const pollGenerationComplete = async (previewId: string) => {
    const maxAttempts = 60; // 2 minutes

    for (let i = 0; i < maxAttempts; i++) {
      // Check if component unmounted or polling was aborted
      if (!isMountedRef.current || pollingAbortRef.current) {
        console.log('🛑 Generation polling aborted (component unmounted)');
        return;
      }

      try {
        const previewData = await api.getPreview(previewId);

        // Check again after async call
        if (!isMountedRef.current || pollingAbortRef.current) return;

        setUnlockProgress(60 + (i * 0.6)); // Progress 60-96%
        setGenerationPhase(previewData.generation_phase || 'generating_full');

        if (previewData.generation_phase === 'complete') {
          console.log('✅ Generation complete! All 10 pages ready.');
          setUnlockProgress(100);

          // Get cover and story title for display
          const coverUrl = previewData.cover_url ||
            previewData.preview_pages.find((p: any) => p.page_number === 0 || p.is_cover)?.image_url;
          const storyTitle = previewData.story_title || `${previewData.child_name}'s Adventure`;

          // Filter out cover page from regular pages
          const storyPages = previewData.preview_pages.filter(
            (p: any) => p.page_number > 0 && !p.is_cover
          );

          // Reload all pages (now including 6-10 with hi-res)
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
          setLockedPages([]); // Clear locked pages
          setGenerationPhase('complete');

          // Hide overlay after brief celebration
          setTimeout(() => {
            if (isMountedRef.current) {
              setShowUnlocking(false);
            }
          }, 1500);
          return;
        }
      } catch (e) {
        console.error('Generation polling error:', e);
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    // Still not complete - show message but hide overlay (only if mounted)
    if (isMountedRef.current) {
      setShowUnlocking(false);
      alert('Your book is almost ready! We\'ll email you when it\'s complete.');
    }
  };

  const handleDownloadClick = () => {
    if (!book || integrityError) return;

    // Check if user is logged in or has chosen guest mode for premium downloads
    if (!isShopifyCustomerLoggedIn() && !hasChosenGuestMode()) {
      setPendingAction('download');
      setShowAuthModal(true);
      return;
    }

    performDownload();
  };

  const performDownload = async () => {
    if (!book || integrityError) return;
    setIsGeneratingPDF(true);
    try {
      if (book.paymentStatus === 'paid') {
        const downloadData = await api.getDownload(book.id);
        if (downloadData.status === 'ready' && downloadData.downloads?.pdf) {
          // Generate friendly filename from book data
          const childNameClean = book.childName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
          const themeName = (book.theme || 'Story')
            .replace('storygift_', '')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('_');
          const pdfFilename = `${childNameClean}_${themeName}_Storybook.pdf`;

          // Use invisible anchor tag to trigger download without navigating away
          const link = document.createElement('a');
          link.href = downloadData.downloads.pdf.url;
          link.download = pdfFilename;
          link.target = '_blank'; // Fallback for browsers that ignore download attribute
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else if (downloadData.status === 'generating') {
          alert('Your PDF is still being generated. Please try again in a few minutes.');
        } else {
          throw new Error('PDF download not available');
        }
      } else {
        alert('Please purchase to download the full PDF.');
      }
    } catch (e) {
      console.error(e);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePaymentClick = () => {
    if (!book || integrityError) return;

    // Check if user is logged in or has chosen guest mode
    if (!isShopifyCustomerLoggedIn() && !hasChosenGuestMode()) {
      setPendingAction('payment');
      setShowAuthModal(true);
      return;
    }

    performPayment();
  };

  /**
   * Handle payment via Shopify Cart + Checkout
   */
  const performPayment = async () => {
    if (!book || integrityError) return;
    setIsPaymentLoading(true);

    try {
      console.log('🛒 [Shopify] Adding to cart and redirecting to checkout...');
      await buyNowWithShopify(book.id);
      // Note: Page will redirect to Shopify checkout
      // After payment, user returns with ?checkout_success=true
    } catch (error) {
      console.error('❌ [Shopify] Failed to add to cart:', error);
      setIsPaymentLoading(false);
      alert('Failed to add to cart. Please try again.');
    }
  };

  // Loading state
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <p className="font-heading text-2xl text-slate-800 animate-pulse">Opening the Secret Library...</p>
      </div>
    </div>
  );

  // Error state
  if (!book || integrityError) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg text-center border border-red-50">
          <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-3xl font-heading text-slate-900 mb-4">A Magical Ripple!</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            This storybook was affected by a magical glitch during generation and is incomplete. Don't worry, you haven't been charged!
          </p>
          <div className="space-y-4">
            <Link to="/create" className="block w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-primary/20 transition-all">
              Re-cast the Spell
            </Link>
            <Link to="/my-creations" className="block w-full text-gray-400 font-bold py-2 hover:text-gray-600">
              Back to My Creations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const themeData = THEMES.find(t => t.id === book.theme);

  return (
    <>
      <PreviewResponsiveStyles />
      {/* Unlocking Overlay - shown after payment */}
      <UnlockingOverlay
        childName={book.childName}
        isVisible={showUnlocking}
        progress={unlockProgress}
        email={customerEmail}
        onEmailChange={setCustomerEmail}
      />

      <div className="min-h-screen bg-gray-50 pb-28">
        {/* Hero Header */}
        <div className="bg-white border-b border-gray-100 py-8 px-4 mb-8">
          <div className="max-w-7xl mx-auto relative">

            {/* Desktop Back Button - Absolute Top Left */}
            <div id="sg-desktop-back" className="absolute left-0 top-1">
              <Link to="/" className="inline-flex items-center text-gray-500 hover:text-primary transition-colors bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-primary/5 border border-transparent hover:border-primary/20">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span className="font-medium text-sm">Create Another Story</span>
              </Link>
            </div>

            {/* Mobile Back Button - Stacked */}
            <div id="sg-mobile-back" className="mb-6 flex justify-start">
              <Link to="/" className="inline-flex items-center text-gray-500 hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span className="font-medium text-sm">Create Another Story</span>
              </Link>
            </div>

            <div className="max-w-3xl mx-auto text-center">
              <div className="flex items-center justify-center space-x-2 text-primary mb-2">
                <Sparkles className="w-5 h-5 fill-current" />
                <span className="text-xs font-black uppercase tracking-widest">Your Story is Ready</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-heading text-slate-900 mb-2">
                {book.childName}'s <span className="text-primary">{themeData?.title || book.theme.replace('storygift_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span> Adventure
              </h1>
              <p className="text-gray-500">
                {/* Page count includes cover */}
                {book.coverUrl ? (book.pages.length + 1) : book.pages.length} magical pages • {themeData?.icon || '📚'} {themeData?.title || book.theme.replace('storygift_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            </div>
          </div>
        </div>


        {/* Vertical Page Cards Feed - Larger size for impactful preview */}
        <div className="w-full max-w-md mx-auto px-3 sm:px-4 space-y-5">
          {/* Cover Page - displayed first with title/starring overlays */}
          {book.coverUrl && (
            <CoverPageCard
              imageUrl={book.coverUrl}
              storyTitle={book.storyTitle || `${book.childName}'s Adventure`}
              childName={book.childName}
              isPaid={book.paymentStatus === 'paid'}
            />
          )}

          {/* Story Pages */}
          {book.pages.map((page, index) => (
            <div
              key={page.pageNumber}
              className="relative"
            >
              {/* Watermark overlay for unpaid */}
              {book.paymentStatus === 'pending' && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-black text-gray-200 opacity-30 rotate-[-15deg] select-none">
                      PREVIEW
                    </span>
                  </div>
                </div>
              )}

              {/* Page Card - 80% image, 20% text */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Image Section - wider ratio for 80% of card */}
                <div className="relative">
                  <OptimizedImage
                    src={page.imageUrl}
                    alt={`Page ${page.pageNumber} illustration`}
                    aspectRatio="5/4"
                  />
                  {/* Page number badge */}
                  <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full z-10">
                    {page.pageNumber}
                  </div>
                </div>

                {/* Text Section - Fixed height, 2 lines max with truncation */}
                <div className="px-4 py-3 bg-gradient-to-b from-white to-gray-50/50 border-t border-gray-100">
                  <p className="text-sm leading-relaxed text-gray-700 text-center line-clamp-2">
                    {page.text}
                  </p>
                  {page.text && page.text.length > 120 && (
                    <p className="text-xs text-gray-400 text-center mt-1 italic">...full story in your PDF</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* End of story indicator (only show if complete) */}
          {generationPhase === 'complete' && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✨</div>
              <p className="text-gray-400 font-heading text-xl">The End</p>
            </div>
          )}

          {/* LOCKED PAGES SECTION - Show when in preview phase */}
          {generationPhase === 'preview' && lockedPages.length > 0 && book.paymentStatus === 'pending' && (
            <LockedPagesSection
              lockedPages={lockedPages}
              onUnlock={handlePaymentClick}
              price={`${SHOPIFY_CONFIG.CURRENCY_SYMBOL}${SHOPIFY_CONFIG.PRODUCT_PRICE}`}
              isLoading={isPaymentLoading}
            />
          )}

          {/* Generating remaining pages - now uses UnlockingOverlay instead */}
          {/* Old inline message removed - UnlockingOverlay provides the UI */}
        </div>

        {/* Sticky Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Left - Message & Price */}
              <div className="text-center sm:text-left">
                {pollingPayment ? (
                  <div className="flex items-center space-x-2 text-purple-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-bold">Confirming payment...</span>
                  </div>
                ) : book.paymentStatus === 'pending' ? (
                  <>
                    <p className="text-gray-600 font-medium">
                      Love this story? Keep it forever.
                    </p>
                    <p className="text-2xl font-heading text-primary">
                      {SHOPIFY_CONFIG.CURRENCY_SYMBOL}{SHOPIFY_CONFIG.PRODUCT_PRICE}
                    </p>
                  </>
                ) : (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-bold">Payment Complete!</span>
                  </div>
                )}
              </div>

              {/* Right - Action Buttons */}
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                {pollingPayment ? (
                  /* Polling state - waiting for payment confirmation */
                  <button
                    disabled
                    className="flex-1 sm:flex-initial bg-gray-200 text-gray-500 px-6 py-3 rounded-xl font-bold flex items-center justify-center space-x-2"
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </button>
                ) : book.paymentStatus === 'pending' ? (
                  /* Buy Button - Shopify Checkout */
                  <button
                    onClick={handlePaymentClick}
                    disabled={isPaymentLoading}
                    className="flex-1 sm:flex-initial bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isPaymentLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-5 h-5" />
                    )}
                    <span>
                      {isPaymentLoading
                        ? 'Redirecting...'
                        : `Buy to Unlock High-Res PDF - ${SHOPIFY_CONFIG.CURRENCY_SYMBOL}${SHOPIFY_CONFIG.PRODUCT_PRICE}`
                      }
                    </span>
                  </button>
                ) : (
                  /* Paid - Download Button */
                  <button
                    onClick={handleDownloadClick}
                    disabled={isGeneratingPDF}
                    className="flex-1 sm:flex-initial bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2"
                  >
                    {isGeneratingPDF ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    <span>Download Your Book</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onGuestContinue={() => {
            setShowAuthModal(false);
            if (pendingAction === 'payment') {
              performPayment();
            } else if (pendingAction === 'download') {
              performDownload();
            }
            setPendingAction(null);
          }}
          context={pendingAction === 'download' ? 'download' : 'default'}
          returnPath={window.location.pathname}
        />
      </div >
    </>
  );
};

export default PreviewStory;

