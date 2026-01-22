/**
 * AuthModal Component
 * 
 * Displays a modal prompting users to login, signup, or continue as guest.
 * Uses Shopify's customer account system for authentication.
 * Supports different contexts: 'save' (after preview), 'download' (after payment)
 */

import React from 'react';
import { X, User, UserPlus, ArrowRight, AlertCircle, Download, BookOpen, ShoppingBag } from 'lucide-react';

// Modal context types for different scenarios
export type AuthModalContext = 'save' | 'download' | 'default';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGuestContinue: () => void;
    context?: AuthModalContext;
    title?: string;
    subtitle?: string;
    returnPath?: string;
    showGuestWarning?: boolean;
    guestButtonText?: string;
    hideGuestOption?: boolean;
}

/**
 * Get Shopify login URL with return path
 */
export const getShopifyLoginUrl = (returnPath?: string): string => {
    const currentPath = returnPath || window.location.pathname + window.location.search;
    return `/account/login?return_url=${encodeURIComponent(currentPath)}`;
};

/**
 * Get Shopify signup URL with return path
 */
export const getShopifySignupUrl = (returnPath?: string): string => {
    const currentPath = returnPath || window.location.pathname + window.location.search;
    return `/account/register?return_url=${encodeURIComponent(currentPath)}`;
};

/**
 * Check if user has chosen guest mode previously
 */
export const hasChosenGuestMode = (): boolean => {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem('magictales_guest_mode') === 'true';
};

/**
 * Set guest mode preference
 */
export const setGuestMode = (value: boolean): void => {
    if (typeof localStorage !== 'undefined') {
        if (value) {
            localStorage.setItem('magictales_guest_mode', 'true');
        } else {
            localStorage.removeItem('magictales_guest_mode');
        }
    }
};

/**
 * Check if save prompt has been shown
 */
export const hasSavePromptBeenShown = (): boolean => {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem('magictales_auth_prompt_seen') === 'true';
};

/**
 * Mark save prompt as shown
 */
export const markSavePromptShown = (): void => {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('magictales_auth_prompt_seen', 'true');
    }
};

// Import getOrCreateSessionId from client.ts to avoid duplication
// The function is used internally in the modal's guest continue handler
import { getOrCreateSessionId } from '../src/api/client';

// Context-specific content configurations
const contextContent: Record<AuthModalContext, {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    guestButtonText: string;
    guestWarning: string;
}> = {
    save: {
        icon: <BookOpen className="w-8 h-8 text-white" />,
        title: "📚 Save Your Magical Creations!",
        subtitle: "Sign in with your store account to keep your stories safe and access them anytime.",
        guestButtonText: "Continue as Guest",
        guestWarning: "Guest creations expire in 7 days and may be lost if you clear browser data."
    },
    download: {
        icon: <Download className="w-8 h-8 text-white" />,
        title: "🎉 Your Storybook is Ready!",
        subtitle: "Sign in to access your download anytime from your order history.",
        guestButtonText: "Download as Guest",
        guestWarning: "Guest download links expire in 7 days. Sign in to access forever."
    },
    default: {
        icon: <User className="w-8 h-8 text-white" />,
        title: "Sign in to continue",
        subtitle: "Your magical stories will be saved to your account.",
        guestButtonText: "Continue as Guest",
        guestWarning: "Guest creations won't appear in your dashboard and can't be recovered if you clear your browser data."
    }
};

const AuthModal: React.FC<AuthModalProps> = ({
    isOpen,
    onClose,
    onGuestContinue,
    context = 'default',
    title,
    subtitle,
    returnPath,
    showGuestWarning = true,
    guestButtonText,
    hideGuestOption = false,
}) => {
    // Handle Escape key to close modal
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Get context-specific content or use overrides
    const content = contextContent[context];
    const displayTitle = title || content.title;
    const displaySubtitle = subtitle || content.subtitle;
    const displayGuestButton = guestButtonText || content.guestButtonText;
    const displayGuestWarning = content.guestWarning;

    const handleLogin = () => {
        window.location.href = getShopifyLoginUrl(returnPath);
    };

    const handleSignup = () => {
        window.location.href = getShopifySignupUrl(returnPath);
    };

    const handleGuestContinue = () => {
        setGuestMode(true);
        getOrCreateSessionId(); // Ensure session ID exists
        if (context === 'save') {
            markSavePromptShown(); // Don't show again
        }
        onGuestContinue();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-pink-400 rounded-full flex items-center justify-center">
                        {content.icon}
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-heading text-center text-gray-800 mb-2">
                    {displayTitle}
                </h2>

                {/* Subtitle */}
                <p className="text-gray-600 text-center mb-4">
                    {displaySubtitle}
                </p>

                {/* Shopify Badge */}
                <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-500">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Powered by Shopify secure login</span>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                    {/* Login Button */}
                    <button
                        onClick={handleLogin}
                        className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                        <User className="w-5 h-5" />
                        Sign In with Store Account
                        <ArrowRight className="w-4 h-4 ml-auto" />
                    </button>

                    {/* Signup Button */}
                    <button
                        onClick={handleSignup}
                        className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                        <UserPlus className="w-5 h-5" />
                        Create Store Account
                        <ArrowRight className="w-4 h-4 ml-auto" />
                    </button>

                    {/* Divider and Guest Continue - only show if guest option is allowed */}
                    {!hideGuestOption && (
                        <>
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-400">or</span>
                                </div>
                            </div>

                            <button
                                onClick={handleGuestContinue}
                                className="w-full py-2 text-gray-500 hover:text-primary font-medium transition-colors"
                            >
                                {displayGuestButton}
                            </button>
                        </>
                    )}
                </div>

                {/* Guest Warning */}
                {showGuestWarning && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-700">
                            {displayGuestWarning}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthModal;
