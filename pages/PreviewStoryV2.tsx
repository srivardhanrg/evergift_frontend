import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { THEMES } from '../constants';
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
import BookViewerV2 from '../components/BookViewer/BookViewerV2';
import AuthModal from '../components/AuthModal';
import OrderConfirmationModal from '../components/OrderConfirmationModal';
import UnlockingOverlay from '../components/UnlockingOverlay';
import CoverSelectionModal from '../components/CoverSelectionModal';
import { usePreviewStateMachine } from '../hooks/usePreviewStateMachine';
import { usePaymentFlow } from '../hooks/usePaymentFlow';
import { usePdfDownload } from '../hooks/usePdfDownload';
import { convertBackendBookStructureToV2 } from '../src/utils/bookStructureConverter';
import type { BookStructureV2 } from '../types/book.types';

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

const PreviewStoryV2: React.FC = () => {
  const { id } = useParams();

  // Single state machine for all preview lifecycle
  const machine = usePreviewStateMachine(id);

  // Derive pollingPayment from machine state
  const pollingPayment = machine.machineState === 'confirming_payment';

  const pdf = usePdfDownload(
    machine.book,
    machine.integrityError,
    machine.generationPhase,
    machine.isPdfReady,
    () => {
      // When download needs auth, trigger payment flow's auth modal
    },
  );

  const payment = usePaymentFlow(
    machine.book,
    machine.integrityError,
    pdf.performDownload,
  );

  // Print order tracking state
  const [printOrder, setPrintOrder] = useState<PrintOrderStatus | null>(null);

  // Order confirmation modal state
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [localOrderType, setLocalOrderType] = useState<'digital' | 'physical'>('digital');
  const orderType = machine.orderType || localOrderType;
  const hasShownConfirmationRef = useRef(false);

  // Track if we came from checkout success
  const checkoutSuccessRef = useRef(false);
  useEffect(() => {
    const hashParts = window.location.hash.split('?');
    const hashQuery = hashParts.length > 1 ? hashParts[1] : '';
    const urlParams = new URLSearchParams(hashQuery);
    if (urlParams.get('checkout_success') === 'true' || urlParams.get('payment_success') === 'true') {
      checkoutSuccessRef.current = true;
    }
  }, []);

  // Sync print order status from state machine
  useEffect(() => {
    if (machine.printOrderStatus) {
      setPrintOrder(machine.printOrderStatus as PrintOrderStatus);
    }
  }, [machine.printOrderStatus]);

  // Fetch print order on initial load if already paid
  useEffect(() => {
    if (machine.book && machine.book.paymentStatus === 'paid') {
      getPrintOrderByPreview(machine.book.id).then((order) => {
        setPrintOrder(order);
        if (order) {
          setLocalOrderType('physical');
        }
      });
    }
  }, [machine.book?.id, machine.book?.paymentStatus]);

  // Show confirmation modal after unlock overlay completes
  useEffect(() => {
    const isPhysicalComplete = orderType === 'physical' && machine.overlayPhase === 'print_submitted';
    const isDigitalComplete = orderType !== 'physical' && machine.isPdfReady;

    if (
      checkoutSuccessRef.current &&
      !machine.showOverlay &&
      (isDigitalComplete || isPhysicalComplete) &&
      machine.book?.paymentStatus === 'paid' &&
      !hasShownConfirmationRef.current
    ) {
      const timer = setTimeout(() => {
        hasShownConfirmationRef.current = true;
        setShowOrderConfirmation(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [machine.showOverlay, machine.isPdfReady, machine.overlayPhase, machine.book?.paymentStatus, orderType]);

  // Physical book state and handler
  const [isPhysicalLoading, setIsPhysicalLoading] = useState(false);
  const [showPhysicalAuthModal, setShowPhysicalAuthModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);

  const handlePhysicalBookClick = async () => {
    if (!machine.book) return;

    if (!isShopifyCustomerLoggedIn()) {
      setShowPhysicalAuthModal(true);
      return;
    }

    // Open the cover selection modal
    setShowCoverModal(true);
  };

  const handleCoverSelection = async (coverType: 'softcover' | 'hardcover') => {
    if (!machine.book) return;

    setIsPhysicalLoading(true);
    setShowCoverModal(false);

    try {
      await buyPhysicalBook(machine.book.id, coverType);
    } catch (error) {
      console.error('[Physical Book] Failed:', error);
      alert('Could not add physical book to cart. Please try again.');
      setIsPhysicalLoading(false);
    }
  };

  // Convert backend book_structure to V2 format
  const bookStructure: BookStructureV2 | null = React.useMemo(() => {
    if (!machine.book) return null;

    try {
      return convertBackendBookStructureToV2(
        machine.book,
        machine.generationPhase || 'idle'
      );
    } catch (error) {
      console.error('[PreviewStoryV2] Failed to convert book structure:', error);
      return null;
    }
  }, [machine.book, machine.generationPhase]);

  // Early returns for loading/error/expired states
  if (machine.loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <p className="font-heading text-2xl text-slate-800 animate-pulse">Opening the Secret Library...</p>
      </div>
    </div>
  );

  if (machine.isExpired) {
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

  if (!machine.book || machine.integrityError || !bookStructure) {
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

  const book = machine.book;
  const themeData = THEMES.find(t => t.id === book.theme);

  return (
    <>
      <PreviewResponsiveStyles />

      {/* Unlocking Overlay - shown after payment */}
      <UnlockingOverlay
        childName={book.childName}
        isVisible={machine.showOverlay}
        progress={machine.overlayProgress}
        phase={machine.overlayPhase}
      />

      <div className="min-h-screen bg-gray-50 pb-28">
        {/* Hero Header - Reduced Spacing */}
        <div className="bg-white border-b border-gray-100 py-4 px-4 mb-4">
          <div className="max-w-7xl mx-auto relative">

            {/* Desktop Back Button - Absolute Top Left */}
            <div id="sg-desktop-back" className="absolute left-0 top-1">
              <Link to="/" className="inline-flex items-center text-gray-500 hover:text-primary transition-colors bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-primary/5 border border-transparent hover:border-primary/20">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span className="font-medium text-sm">Create Another Story</span>
              </Link>
            </div>

            {/* Mobile Back Button - Stacked */}
            <div id="sg-mobile-back" className="mb-3 flex justify-start">
              <Link to="/" className="inline-flex items-center text-gray-500 hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span className="font-medium text-sm">Create Another Story</span>
              </Link>
            </div>

            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-2xl md:text-3xl font-heading text-slate-900 mb-1">
                {book.childName}'s <span className="text-primary">{themeData?.title || book.theme.replace('storygift_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span> Adventure
              </h1>
              <p className="text-gray-500 text-sm">
                {/* V2: 24 magical pages (excluding front/back covers) */}
                24 magical pages • {themeData?.icon || '📚'} {themeData?.title || book.theme.replace('storygift_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            </div>
          </div>
        </div>

        {/* Book Viewer V2 - 26-page experience */}
        <div className="w-full mx-auto">
          <BookViewerV2
            previewId={book.id}
            childName={book.childName}
            theme={book.theme}
            style={book.style || 'photorealistic'}
            bookStructure={bookStructure}
            isPurchased={book.paymentStatus === 'paid'}
            generationPhase={machine.generationPhase || 'idle'}
            onPageChange={(page) => {
              console.log(`[V2] Viewing page ${page + 1}`);
            }}
            onPurchaseClick={payment.handlePaymentClick}
          />
        </div>

        {/* Sticky Action Bar - Reduced Padding */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
          <div className="max-w-3xl mx-auto px-4 py-3">
            {/* Pending payment: message above buttons */}
            {!pollingPayment && book.paymentStatus === 'pending' && (
              <p className="text-gray-700 font-semibold text-center mb-3 text-base">
                Purchase to unlock full storybook
              </p>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Left - Message (non-pending states only) */}
              <div className="text-center sm:text-left">
                {pollingPayment ? (
                  <div className="flex items-center space-x-2 text-purple-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-bold">Confirming payment...</span>
                  </div>
                ) : book.paymentStatus === 'pending' ? (
                  null
                ) : !machine.isPdfReady && machine.overlayPhase !== 'print_submitted' ? (
                  machine.pdfPreparationTimeout ? (
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
                        {orderType === 'physical' && machine.overlayPhase === 'preparing_print'
                          ? 'Preparing your book for print...'
                          : orderType === 'physical' && machine.overlayPhase === 'submitting_print'
                            ? 'Submitting to print facility...'
                            : machine.generationPhase === 'complete'
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
                {pollingPayment ? (
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
                  machine.pdfPreparationTimeout ? (
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
                        onClick={() => machine.retryPdfCheck()}
                        className="bg-gray-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2"
                      >
                        <Loader2 className="w-5 h-5" />
                        <span className="text-sm">Check Again</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 w-full sm:w-auto">
                      {/* Download button — only for digital orders */}
                      {orderType !== 'physical' && (
                        <button
                          onClick={pdf.handleDownloadClick}
                          disabled={pdf.isGeneratingPDF || !machine.isPdfReady}
                          className={`flex-1 sm:flex-initial text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center space-x-2 ${!machine.isPdfReady
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-xl hover:-translate-y-0.5'
                            }`}
                        >
                          {pdf.isGeneratingPDF || !machine.isPdfReady ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Download className="w-5 h-5" />
                          )}
                          <span>{!machine.isPdfReady ? 'Preparing Your Book...' : 'Download Your Book'}</span>
                        </button>
                      )}

                      {/* Track Order button — for physical orders */}
                      {orderType === 'physical' && (
                        <Link
                          to="/my-creations?tab=ordered"
                          className="flex-1 sm:flex-initial bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 sm:px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2"
                        >
                          <Package className="w-5 h-5" />
                          <span>Track Order</span>
                        </Link>
                      )}

                      {/* Track Order button (secondary) — for digital orders that also have physical */}
                      {orderType !== 'physical' && (machine.overlayPhase === 'print_submitted' || printOrder) && (
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

        {/* Auth Modal (digital) */}
        <AuthModal
          isOpen={payment.showAuthModal}
          onClose={payment.handleAuthModalClose}
          onGuestContinue={payment.handleGuestContinue}
          context={payment.pendingAction === 'download' ? 'download' : 'default'}
        />

        {/* Auth Modal (physical — login required) */}
        <AuthModal
          isOpen={showPhysicalAuthModal}
          onClose={() => setShowPhysicalAuthModal(false)}
          onGuestContinue={() => { }}
          hideGuestOption={true}
          context="default"
          title="📦 Sign In to Order Physical Book"
          subtitle="You'll need an account to track your order and receive shipping updates."
        />

        {/* Cover Selection Modal */}
        <CoverSelectionModal
          isOpen={showCoverModal}
          onClose={() => setShowCoverModal(false)}
          onSelectCover={handleCoverSelection}
          previewId={machine.book?.id || ''}
        />

        {/* Order Confirmation Modal */}
        <OrderConfirmationModal
          isOpen={showOrderConfirmation}
          onClose={() => setShowOrderConfirmation(false)}
          orderType={orderType}
          childName={book.childName}
          orderId={printOrder?.order_id}
        />
      </div>
    </>
  );
};

export default PreviewStoryV2;
