import { useState, useCallback } from 'react';
import { Storybook } from '../types';
import {
    buyNowWithShopify,
    SHOPIFY_CONFIG,
    isShopifyCustomerLoggedIn,
} from '../src/api/client';
import { hasChosenGuestMode } from '../components/AuthModal';
import {
    trackPurchaseInitiated,
    trackPurchaseFailed,
    trackFunnelStep,
} from '../src/services/analytics';

interface UsePaymentFlowReturn {
    isPaymentLoading: boolean;
    showAuthModal: boolean;
    pendingAction: 'download' | 'payment' | null;
    /** Initiate payment — triggers auth modal if needed, else starts Shopify checkout */
    handlePaymentClick: () => void;
    /** Handle auth modal close (user dismissed) */
    handleAuthModalClose: () => void;
    /** Handle guest continue from auth modal — executes the pending action */
    handleGuestContinue: () => void;
}

/**
 * Hook for the payment initiation flow:
 * - Auth modal gating (guest vs logged-in)
 * - Shopify cart add + checkout redirect
 * - Analytics tracking
 *
 * Note: This does NOT handle payment polling (that's in useGenerationPolling).
 * This hook only handles the user-initiated payment action.
 */
export function usePaymentFlow(
    book: Storybook | null,
    integrityError: boolean,
    onDownload: () => void,
): UsePaymentFlowReturn {
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<'download' | 'payment' | null>(null);

    const performPayment = useCallback(async () => {
        if (!book || integrityError) return;
        setIsPaymentLoading(true);

        trackPurchaseInitiated(
            SHOPIFY_CONFIG.PRODUCT_PRICE,
            SHOPIFY_CONFIG.CURRENCY,
            book.theme || 'unknown',
            book.id
        );
        trackFunnelStep('purchase_started', {
            price: SHOPIFY_CONFIG.PRODUCT_PRICE,
            currency: SHOPIFY_CONFIG.CURRENCY,
            theme: book.theme,
        });

        try {
            console.log('🛒 [Shopify] Adding to cart and redirecting to checkout...');
            await buyNowWithShopify(book.id, book.theme);
            // Page will redirect to Shopify checkout
        } catch (error: any) {
            console.error('❌ [Shopify] Failed to add to cart:', error);
            trackPurchaseFailed('cart_error', error.message || 'Failed to add to cart');
            setIsPaymentLoading(false);
            alert('Failed to add to cart. Please try again.');
        }
    }, [book, integrityError]);

    const handlePaymentClick = useCallback(() => {
        if (!book || integrityError) return;

        if (!isShopifyCustomerLoggedIn() && !hasChosenGuestMode()) {
            setPendingAction('payment');
            setShowAuthModal(true);
            return;
        }

        performPayment();
    }, [book, integrityError, performPayment]);

    const handleAuthModalClose = useCallback(() => {
        setShowAuthModal(false);
    }, []);

    const handleGuestContinue = useCallback(() => {
        setShowAuthModal(false);
        if (pendingAction === 'payment') {
            performPayment();
        } else if (pendingAction === 'download') {
            onDownload();
        }
        setPendingAction(null);
    }, [pendingAction, performPayment, onDownload]);

    return {
        isPaymentLoading,
        showAuthModal,
        pendingAction,
        handlePaymentClick,
        handleAuthModalClose,
        handleGuestContinue,
    };
}
