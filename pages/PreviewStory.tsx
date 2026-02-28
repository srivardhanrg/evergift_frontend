import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { STORYBOOK_PRICE, THEMES } from '../constants';
import {
  Sparkles,
  CheckCircle,
  Download,
  Loader2,
  AlertTriangle,
  ShoppingCart,
  ArrowLeft,
  Package
} from 'lucide-react';
import { SHOPIFY_CONFIG, buyPhysicalBook, getPrintOrderByPreview, isShopifyCustomerLoggedIn } from '../src/api/client';
import type { PrintOrderStatus } from '../src/api/client';
import CoverPageCard from '../components/CoverPageCard';
import OptimizedImage from '../components/OptimizedImage';
import AuthModal from '../components/AuthModal';
import OrderConfirmationModal from '../components/OrderConfirmationModal';
import { LockedPagesSection } from '../components/LockedPageCard';
import UnlockingOverlay from '../components/UnlockingOverlay';
import PrintOrderStatusCard from '../components/PrintOrderStatusCard';
import {
  trackPreviewPageViewed,
  trackLockedPageClicked,
} from '../src/services/analytics';
import { usePreviewLoader } from '../hooks/usePreviewLoader';
import { useGenerationPolling } from '../hooks/useGenerationPolling';
import { usePaymentFlow } from '../hooks/usePaymentFlow';
import { usePdfDownload } from '../hooks/usePdfDownload';

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

  // --- Hook composition ---
  const preview = usePreviewLoader(id);

  const generation = useGenerationPolling(
    id,
    preview.book,
    preview.setBook,
    preview.setLockedPages,
    preview.setGenerationPhase,
    preview.initialPhaseState,
  );

  // Auth modal trigger for download
  const handleAuthRequiredForDownload = useCallback(() => {
    // This is handled by the payment flow's auth modal
    payment.handlePaymentClick(); // Will show auth modal with pendingAction='download'
  }, []);

  const pdf = usePdfDownload(
    preview.book,
    preview.integrityError,
    preview.generationPhase,
    generation.isPdfReady,
    () => {
      // When download needs auth, trigger payment flow's auth modal
      // The payment hook handles this via pendingAction
    },
  );

  const payment = usePaymentFlow(
    preview.book,
    preview.integrityError,
    pdf.performDownload,
  );

  // --- Early returns for loading/error/expired states ---

  // Print order tracking state (use polling hook's state for real-time updates)
  const [printOrder, setPrintOrder] = useState<PrintOrderStatus | null>(null);

  // Order confirmation modal state
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  // Use polling hook's orderType if available, fallback to local state
  const [localOrderType, setLocalOrderType] = useState<'digital' | 'physical'>('digital');
  const orderType = generation.orderType || localOrderType;
  const hasShownConfirmationRef = useRef(false);

  // Sync print order status from polling hook (real-time during generation)
  useEffect(() => {
    if (generation.printOrderStatus) {
      setPrintOrder(generation.printOrderStatus as PrintOrderStatus);
    }
  }, [generation.printOrderStatus]);

  // Track if we came from checkout success and detect order type from URL
  // NOTE: With HashRouter, query params appear after the # (e.g., /#/preview/id?checkout_success=true)
  // so we must parse from hash, not window.location.search
  const checkoutSuccessRef = useRef(false);
  useEffect(() => {
    const hashParts = window.location.hash.split('?');
    const hashQuery = hashParts.length > 1 ? hashParts[1] : '';
    const urlParams = new URLSearchParams(hashQuery);
    if (urlParams.get('checkout_success') === 'true' || urlParams.get('payment_success') === 'true') {
      checkoutSuccessRef.current = true;

      // Detect order type from URL param (set by buyPhysicalBook redirect)
      if (urlParams.get('order_type') === 'physical') {
        setLocalOrderType('physical');
      }
    }
  }, []);

  useEffect(() => {
    if (preview.book && preview.book.paymentStatus === 'paid') {
      getPrintOrderByPreview(preview.book.id).then((order) => {
        setPrintOrder(order);
        // If there's a print order, this was a physical order
        if (order) {
          setLocalOrderType('physical');
        }
      });
    }
  }, [preview.book?.id, preview.book?.paymentStatus]);

  // Show confirmation modal after unlock overlay completes (only on checkout success)
  // For digital: when PDF is ready
  // For physical: when print is submitted (unlockPhase === 'print_submitted')
  useEffect(() => {
    const isPhysicalComplete = orderType === 'physical' && generation.unlockPhase === 'print_submitted';
    const isDigitalComplete = orderType !== 'physical' && generation.isPdfReady;

    if (
      checkoutSuccessRef.current &&
      !generation.showUnlocking &&
      (isDigitalComplete || isPhysicalComplete) &&
      preview.book?.paymentStatus === 'paid' &&
      !hasShownConfirmationRef.current
    ) {
      // Small delay to ensure smooth transition from overlay
      const timer = setTimeout(() => {
        hasShownConfirmationRef.current = true;
        setShowOrderConfirmation(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [generation.showUnlocking, generation.isPdfReady, generation.unlockPhase, preview.book?.paymentStatus, orderType]);

  // Physical book state and handler
  const [isPhysicalLoading, setIsPhysicalLoading] = useState(false);
  const [showPhysicalAuthModal, setShowPhysicalAuthModal] = useState(false);

  const handlePhysicalBookClick = async () => {
    if (!preview.book) return;

    // Physical orders REQUIRE login — user needs an account to track
    // shipping updates and access order history
    if (!isShopifyCustomerLoggedIn()) {
      setShowPhysicalAuthModal(true);
      return;
    }

    setIsPhysicalLoading(true);
    try {
      await buyPhysicalBook(preview.book.id);
    } catch (error) {
      console.error('[Physical Book] Failed:', error);
      alert('Could not add physical book to cart. Please try again.');
    } finally {
      setIsPhysicalLoading(false);
    }
  };

  if (preview.loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <p className="font-heading text-2xl text-slate-800 animate-pulse">Opening the Secret Library...</p>
      </div>
    </div>
  );

  if (preview.isExpired) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg text-center border border-amber-100">
          <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⏰</span>
          </div>
          <h2 className="text-3xl font-heading text-slate-900 mb-4">Preview Expired</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            This story preview has expired after 7 days. Don't worry - you can create a new magical adventure anytime!
          </p>
          <div className="space-y-4">
            <Link to="/" className="block w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-primary/20 transition-all">
              Create New Story
            </Link>
            <Link to="/my-creations" className="block w-full text-gray-400 font-bold py-2 hover:text-gray-600">
              Back to My Creations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!preview.book || preview.integrityError) {
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

  const book = preview.book;
  const themeData = THEMES.find(t => t.id === book.theme);

  return (
    <>
      <PreviewResponsiveStyles />
      {/* Unlocking Overlay - shown after payment */}
      <UnlockingOverlay
        childName={book.childName}
        isVisible={generation.showUnlocking}
        progress={generation.unlockProgress}
        phase={generation.unlockPhase}
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
                    <p className="text-xs text-gray-400 text-center mt-1 italic">...full story in your book</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* End of story indicator (only show if complete) */}
          {preview.generationPhase === 'complete' && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">✨</div>
              <p className="text-gray-400 font-heading text-xl">The End</p>
            </div>
          )}

          {/* Print Order Tracking Card - uses new component */}
          {printOrder && printOrder.lulu_status && (
            <PrintOrderStatusCard
              printOrder={printOrder}
              childName={book.childName}
            />
          )}

          {/* LOCKED PAGES SECTION - Show when in preview phase */}
          {preview.generationPhase === 'preview' && preview.lockedPages.length > 0 && book.paymentStatus === 'pending' && (
            <LockedPagesSection
              lockedPages={preview.lockedPages}
              childName={book.childName}
              onUnlock={payment.handlePaymentClick}
              price={`${SHOPIFY_CONFIG.CURRENCY_SYMBOL}${SHOPIFY_CONFIG.PRODUCT_PRICE}`}
              isLoading={payment.isPaymentLoading}
            />
          )}

          {/* Generating remaining pages - now uses UnlockingOverlay instead */}
          {/* Old inline message removed - UnlockingOverlay provides the UI */}
        </div>

        {/* Sticky Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
          <div className="max-w-3xl mx-auto px-4 py-4">
            {/* Pending payment: message above buttons */}
            {!generation.pollingPayment && book.paymentStatus === 'pending' && (
              <p className="text-gray-600 font-medium text-center mb-3">
                Love this story? Keep it forever.
              </p>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Left - Message (non-pending states only) */}
              <div className="text-center sm:text-left">
                {generation.pollingPayment ? (
                  <div className="flex items-center space-x-2 text-purple-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-bold">Confirming payment...</span>
                  </div>
                ) : book.paymentStatus === 'pending' ? (
                  null
                ) : !generation.isPdfReady && generation.unlockPhase !== 'print_submitted' ? (
                  generation.pdfPreparationTimeout ? (
                    <div className="flex flex-col items-center sm:items-start space-y-1">
                      <div className="flex items-center space-x-2 text-amber-600">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-bold text-sm">Book taking longer than usual</span>
                      </div>
                      <p className="text-xs text-gray-500">High-quality images need extra time</p>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-purple-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="font-bold">
                        {orderType === 'physical' && generation.unlockPhase === 'preparing_print'
                          ? 'Preparing your book for print...'
                          : orderType === 'physical' && generation.unlockPhase === 'submitting_print'
                          ? 'Submitting to print facility...'
                          : preview.generationPhase === 'complete'
                          ? 'Preparing your download...'
                          : 'Creating your book...'}
                      </span>
                    </div>
                  )
                ) : (
                  orderType === 'physical' ? (
                    <div className="flex flex-col items-center sm:items-start">
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold">Book ready! Print order submitted 📦</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">We'll email you when it ships</p>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-bold">Your book is ready!</span>
                    </div>
                  )
                )}
              </div>

              {/* Right - Action Buttons */}
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                {generation.pollingPayment ? (
                  /* Polling state - waiting for payment confirmation */
                  <button
                    disabled
                    className="flex-1 sm:flex-initial bg-gray-200 text-gray-500 px-6 py-3 rounded-xl font-bold flex items-center justify-center space-x-2"
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </button>
                ) : book.paymentStatus === 'pending' ? (
                  /* Buy Buttons - Digital PDF + Physical Book */
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    {/* Digital PDF button */}
                    <button
                      onClick={payment.handlePaymentClick}
                      disabled={payment.isPaymentLoading || isPhysicalLoading}
                      className="flex-1 sm:flex-initial bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 sm:px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {payment.isPaymentLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <ShoppingCart className="w-5 h-5" />
                      )}
                      <span>
                        {payment.isPaymentLoading
                          ? 'Redirecting...'
                          : <>
                            <span className="sm:hidden">Digital Book - {SHOPIFY_CONFIG.CURRENCY_SYMBOL}{SHOPIFY_CONFIG.PRODUCT_PRICE}</span>
                            <span className="hidden sm:inline">Digital Book (PDF) - {SHOPIFY_CONFIG.CURRENCY_SYMBOL}{SHOPIFY_CONFIG.PRODUCT_PRICE}</span>
                          </>
                        }
                      </span>
                    </button>

                    {/* Physical Book button */}
                    <button
                      onClick={handlePhysicalBookClick}
                      disabled={isPhysicalLoading || payment.isPaymentLoading}
                      className="flex-1 sm:flex-initial bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 sm:px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                      title="We'll print and ship a beautiful hardcopy to your door"
                    >
                      {isPhysicalLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <span className="text-lg">📦</span>
                      )}
                      <span>
                        {isPhysicalLoading
                          ? 'Redirecting...'
                          : <>
                            <span className="sm:hidden">Physical Book - {SHOPIFY_CONFIG.CURRENCY_SYMBOL}{SHOPIFY_CONFIG.PHYSICAL_PRICE}</span>
                            <span className="hidden sm:inline">Order Physical Book - {SHOPIFY_CONFIG.CURRENCY_SYMBOL}{SHOPIFY_CONFIG.PHYSICAL_PRICE}</span>
                          </>
                        }
                      </span>
                    </button>
                  </div>
                ) : (
                  /* Paid - Download Button or Retry Button */
                  generation.pdfPreparationTimeout ? (
                    <div className="flex-1 sm:flex-initial flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => pdf.handleRegeneratePdf()}
                        disabled={pdf.isGeneratingPDF}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        {pdf.isGeneratingPDF ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <AlertTriangle className="w-5 h-5" />
                        )}
                        <span className="text-sm">{pdf.isGeneratingPDF ? 'Regenerating...' : 'Retry PDF'}</span>
                      </button>
                      <button
                        onClick={() => generation.handleRetryPdfCheck(book.id)}
                        className="bg-gray-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2"
                      >
                        <Loader2 className="w-5 h-5" />
                        <span className="text-sm">Check Again</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={pdf.handleDownloadClick}
                        disabled={pdf.isGeneratingPDF || !generation.isPdfReady}
                        className={`flex-1 sm:flex-initial text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center space-x-2 ${!generation.isPdfReady
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-xl hover:-translate-y-0.5'
                          }`}
                      >
                        {pdf.isGeneratingPDF || !generation.isPdfReady ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Download className="w-5 h-5" />
                        )}
                        <span>{!generation.isPdfReady ? 'Preparing Your Book...' : 'Download Your Book'}</span>
                      </button>

                      {/* Track Order button — only for physical orders after PDF is ready */}
                      {orderType === 'physical' && generation.isPdfReady && (
                        <Link
                          to="/my-creations?tab=ordered"
                          className="flex-shrink-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 sm:px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2"
                        >
                          <Package className="w-5 h-5" />
                          <span className="hidden sm:inline">Track Order</span>
                        </Link>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Auth Modal (digital — allows guest) */}
        <AuthModal
          isOpen={payment.showAuthModal}
          onClose={payment.handleAuthModalClose}
          onGuestContinue={payment.handleGuestContinue}
          context={payment.pendingAction === 'download' ? 'download' : 'default'}
          returnPath={window.location.pathname}
        />

        {/* Auth Modal (physical — login required, no guest option) */}
        <AuthModal
          isOpen={showPhysicalAuthModal}
          onClose={() => setShowPhysicalAuthModal(false)}
          onGuestContinue={() => { }} // never called — guest option is hidden
          hideGuestOption={true}
          context="default"
          title="📦 Sign In to Order Physical Book"
          subtitle="You'll need an account to track your order and receive shipping updates."
          returnPath={window.location.pathname}
        />

        {/* Order Confirmation Modal - shown after successful checkout */}
        <OrderConfirmationModal
          isOpen={showOrderConfirmation}
          onClose={() => setShowOrderConfirmation(false)}
          orderType={orderType}
          childName={book.childName}
          orderId={printOrder?.order_id}
        />
      </div >
    </>
  );
};

export default PreviewStory;
