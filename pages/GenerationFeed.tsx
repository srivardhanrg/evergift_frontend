import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, Clock, Flame, RefreshCw, PlusCircle } from 'lucide-react';
import { api, isShopifyCustomerLoggedIn } from '../src/api/client';
import { JobStatus } from '../src/types/api.types';
import BookViewerV2 from '../components/BookViewer/BookViewerV2';
import type { BookStructureV2, GenerationPhase } from '../types/book.types';
import { convertBackendBookStructureToV2 } from '../src/utils/bookStructureConverter';
import AuthModal, { hasSavePromptBeenShown, markSavePromptShown } from '../components/AuthModal';
// DISABLED: Email capture popup feature temporarily disabled
// import EmailCapturePopup from '../components/EmailCapturePopup';
import { getFriendlyError } from '../src/utils/errorMessages';
import {
    trackPreviewGenerationProgress,
    trackPreviewGenerationCompleted,
    trackPreviewGenerationFailed,
    trackFunnelStep,
} from '../src/services/analytics';

// V2: Preview generates 6 AI pages (cover + 5 story pages) out of 26 total pages
const TOTAL_AI_PAGES = 6;  // Cover(0) + Story pages at indices 4,6,8,10,12
const TOTAL_PREVIEW_PAGES = 13;  // Pages 0-12 visible in preview

// Fun whimsical messages that rotate during generation - delightful UX!
const GENERATION_MESSAGES = [
    "✨ Sprinkling pixie dust on every page...",
    "🎨 Painting magical worlds just for you...",
    "🌟 Your adventure is coming to life...",
    "🪄 Weaving story magic, one page at a time...",
    "🎭 Creating unforgettable memories...",
    "🌈 Adding rainbows and wonder...",
    "📖 Writing your name in the stars...",
    "🦄 Summoning unicorns and dreams...",
    "🎪 Setting the stage for adventure...",
    "🌙 Moonlight magic in progress...",
    "⭐ Each page more magical than the last...",
    "🎨 Crafting your personalized masterpiece...",
    "🌺 Growing a garden of imagination...",
    "🎵 Composing a symphony of stories...",
    "💫 Almost ready for your grand adventure...",
];

// DISABLED: Email capture popup feature temporarily disabled
// ==================
// Email Popup State Management (per preview)
// ==================
// const EMAIL_POPUP_PREFIX = 'magictales_email_popup_';
//
// /** Get email popup state for a specific preview */
// const getEmailPopupState = (previewId: string): 'none' | 'shown' | 'submitted' | 'dismissed' => {
//     if (typeof localStorage === 'undefined' || !previewId) return 'none';
//     const state = localStorage.getItem(`${EMAIL_POPUP_PREFIX}${previewId}`);
//     return (state as 'shown' | 'submitted' | 'dismissed') || 'none';
// };
//
// /** Set email popup state for a specific preview */
// const setEmailPopupState = (previewId: string, state: 'shown' | 'submitted' | 'dismissed'): void => {
//     if (typeof localStorage === 'undefined' || !previewId) return;
//     localStorage.setItem(`${EMAIL_POPUP_PREFIX}${previewId}`, state);
// };

/**
 * RotatingGenerationMessage - Cycles through whimsical messages every 5 seconds
 * Replaces static "Watch as each page magically appears..." text
 */
const RotatingGenerationMessage: React.FC<{ status: JobStatus }> = ({ status }) => {
    const [messageIndex, setMessageIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Only rotate messages while generating
        if (status !== JobStatus.PROCESSING && status !== JobStatus.QUEUED) {
            return;
        }

        const interval = setInterval(() => {
            // Fade out
            setIsVisible(false);

            // Wait for fade, then change message and fade in
            setTimeout(() => {
                setMessageIndex((prev) => (prev + 1) % GENERATION_MESSAGES.length);
                setIsVisible(true);
            }, 300); // 300ms fade duration
        }, 5000); // Change every 5 seconds

        return () => clearInterval(interval);
    }, [status]);

    // Don't show anything if generation is complete
    if (status === JobStatus.COMPLETED) {
        return null;
    }

    return (
        <div className="mb-4 text-center">
            <p
                className={`text-gray-600 text-sm transition-opacity duration-300 ${
                    isVisible ? 'opacity-100' : 'opacity-0'
                }`}
            >
                {GENERATION_MESSAGES[messageIndex]}
            </p>
        </div>
    );
};

/**
 * GenerationFeed - Live "stream" view of book generation.
 * Shows real-time progress as each page is created, with auto-scroll to active page.
 *
 * ORDER: Cover (page 0) → Page 1 → Page 2 → Page 3 → Page 4 → Page 5
 */
const GenerationFeed: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();

    // CRITICAL: Scroll to top on mount (most reliable fix for mobile)
    // This fires AFTER the lazy-loaded component is fully mounted in the DOM,
    // catching cases where App.tsx's ScrollToTop was too early.
    useEffect(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, []); // Empty deps = run once on mount

    // State
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState('Starting the magic...');
    const [status, setStatus] = useState<JobStatus>(JobStatus.QUEUED);
    const [error, setError] = useState<{ title: string; message: string; suggestion?: string; icon: string } | null>(null);
    const [canRetry, setCanRetry] = useState(false);
    const [funMessage, setFunMessage] = useState(GENERATION_MESSAGES[0]);
    const [messageIndex, setMessageIndex] = useState(0);
    const [todayCount, setTodayCount] = useState(0);
    const [showAuthPrompt, setShowAuthPrompt] = useState(false);
    const [pendingPreviewId, setPendingPreviewId] = useState<string | null>(null);
    // DISABLED: Email capture popup feature temporarily disabled
    // const [showEmailPopup, setShowEmailPopup] = useState(false);
    // const [emailSubmitted, setEmailSubmitted] = useState(false);
    const [childName, setChildName] = useState<string>('');
    // const [currentPreviewId, setCurrentPreviewId] = useState<string | null>(null);

    // V2: Book structure for BookViewerV2 (unified mobile + desktop)
    const [bookStructure, setBookStructure] = useState<BookStructureV2 | null>(null);
    const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('preview');
    const [theme, setTheme] = useState<string>('');
    // V1: Style state removed - hardcoded to photorealistic
    // const [style, setStyle] = useState<BookStyle>('photorealistic');
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

    // Detect desktop vs mobile
    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Network retry tracking
    const networkRetryCountRef = useRef(0);
    const MAX_NETWORK_RETRIES = 3;

    // Rotate fun messages every 7 seconds for better readability
    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex(prev => {
                const next = (prev + 1) % GENERATION_MESSAGES.length;
                setFunMessage(GENERATION_MESSAGES[next]);
                return next;
            });
        }, 7000);
        return () => clearInterval(interval);
    }, []);

    // DISABLED: Email capture popup feature temporarily disabled
    // Show email popup after 30 seconds if still generating
    // Only show ONCE per preview - check localStorage for state
    // useEffect(() => {
    //     // Need preview_id to track popup state per preview
    //     if (!currentPreviewId) return;
    //
    //     // Check if popup was already shown/dismissed/submitted for this preview
    //     const popupState = getEmailPopupState(currentPreviewId);
    //     if (popupState !== 'none') {
    //         // Already shown for this preview - restore emailSubmitted if needed
    //         if (popupState === 'submitted') {
    //             setEmailSubmitted(true);
    //         }
    //         return; // Don't show again
    //     }
    //
    //     // Only show if still processing and popup not currently open
    //     if (status === JobStatus.PROCESSING && !showEmailPopup) {
    //         const timer = setTimeout(() => {
    //             // Double-check status hasn't changed
    //             if (status === JobStatus.PROCESSING) {
    //                 setShowEmailPopup(true);
    //                 setEmailPopupState(currentPreviewId, 'shown');
    //             }
    //         }, 30000); // 30 seconds
    //
    //         return () => clearTimeout(timer);
    //     }
    // }, [status, currentPreviewId, showEmailPopup]);

    // Auto-scroll removed - BookViewerV2 handles page navigation internally

    // Store job ID for recovery if user navigates away
    useEffect(() => {
        if (jobId && status !== JobStatus.COMPLETED && status !== JobStatus.FAILED) {
            localStorage.setItem('magictales_current_job', JSON.stringify({
                jobId,
                childName: childName || 'Your child',
                timestamp: Date.now()
            }));
        }

        // Clear on completion or failure
        if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
            localStorage.removeItem('magictales_current_job');
        }
    }, [jobId, status, childName]);

    // Poll for job status
    useEffect(() => {
        if (!jobId) return;

        let isActive = true;
        let previewId: string | null = null;

        const pollStatus = async () => {
            try {
                const statusResponse = await api.getJobStatus(jobId);

                if (!isActive) return;

                // Reset network retry counter on success
                networkRetryCountRef.current = 0;

                setProgress(statusResponse.progress);
                setStatus(statusResponse.status);

                if (statusResponse.current_step) {
                    setCurrentStep(statusResponse.current_step);
                }

                // Store preview_id when available
                if (statusResponse.preview_id) {
                    previewId = statusResponse.preview_id;
                    // DISABLED: Email capture popup feature temporarily disabled
                    // setCurrentPreviewId(statusResponse.preview_id);
                }

                // Fetch preview data to get ACTUAL completed pages (V2 API)
                if (previewId && statusResponse.progress > 0) {
                    try {
                        const previewData = await api.getPreviewV2(previewId);
                        if (previewData) {
                            // Capture child name and theme (V1: style removed)
                            if (previewData.child_name) {
                                setChildName(previewData.child_name);
                            }
                            if (previewData.theme) {
                                setTheme(previewData.theme);
                            }
                            // V1: Style capture removed - always photorealistic
                            // if (previewData.style) {
                            //     setStyle(previewData.style as BookStyle);
                            // }

                            // V2: Convert backend snake_case response to frontend camelCase types
                            // The backend returns snake_case fields (image_url, is_generating, etc.)
                            // but BookViewerV2 expects camelCase (imageUrl, isGenerating, etc.)
                            if (previewData.book_structure) {
                                // Build a minimal book object for the converter
                                // The converter expects a Storybook-like structure
                                const bookDataForConverter = {
                                    bookStructure: previewData.book_structure,
                                    paymentStatus: 'pending' as const,
                                    storyTexts: {} as Record<string, string>,
                                    fillerPagesProcessed: {} as Record<string, boolean>,
                                };

                                const currentPhase: GenerationPhase =
                                    (previewData.generation_phase as GenerationPhase) || 'preview';

                                setGenerationPhase(currentPhase);

                                const convertedStructure = convertBackendBookStructureToV2(
                                    bookDataForConverter,
                                    currentPhase
                                );

                                // Set the properly converted structure for BookViewerV2
                                setBookStructure(convertedStructure);

                                // Update progress from converted structure (camelCase)
                                if (convertedStructure.generationProgress > 0) {
                                    setProgress(convertedStructure.generationProgress);
                                }
                            }
                        }
                    } catch (previewErr) {
                        // Preview data might not be available yet, continue polling
                        console.log('Preview data not ready yet, continuing...');
                    }
                }

                // Handle completion - check if should show auth prompt for guests
                if (statusResponse.status === JobStatus.COMPLETED && statusResponse.preview_id) {
                    // Track generation completed
                    const generationDuration = Date.now() - (window as any).__generationStartTime || 0;
                    const totalAiPages = TOTAL_AI_PAGES - 1; // 5 story pages (excluding cover)
                    trackPreviewGenerationCompleted(
                        generationDuration,
                        totalAiPages,
                        theme || 'unknown'
                    );
                    trackFunnelStep('preview_ready', {
                        preview_id: statusResponse.preview_id,
                        pages_count: totalAiPages,
                        duration_ms: generationDuration,
                    });

                    const isGuest = !isShopifyCustomerLoggedIn();
                    const hasSeenPrompt = hasSavePromptBeenShown();

                    if (isGuest && !hasSeenPrompt) {
                        // Show auth prompt for first-time guest
                        setPendingPreviewId(statusResponse.preview_id);
                        setShowAuthPrompt(true);
                        markSavePromptShown();
                    } else {
                        // Redirect directly
                        setTimeout(() => {
                            navigate(`/preview/${statusResponse.preview_id}`);
                        }, 1500);
                    }
                    return;
                }

                // Handle failure
                if (statusResponse.status === JobStatus.FAILED) {
                    // Track generation failed
                    const completedPagesCount = bookStructure?.pages.filter(p => p.isGenerated).length || 0;
                    trackPreviewGenerationFailed(
                        'JOB_FAILED',
                        statusResponse.error || 'Unknown error',
                        completedPagesCount
                    );

                    const friendlyError = getFriendlyError('JOB_FAILED', statusResponse.error);
                    setError(friendlyError);
                    setCanRetry(statusResponse.can_retry ?? false);
                    return;
                }

                // Continue polling if still processing
                if (statusResponse.status === JobStatus.QUEUED ||
                    statusResponse.status === JobStatus.PROCESSING) {
                    setTimeout(pollStatus, 1500);  // Poll every 1.5s for faster page updates
                }
            } catch (err: any) {
                console.error('Status poll error:', err);

                if (!isActive) return;

                // Handle job not found (404) - don't retry, show specific error
                if (err.code === 'NOT_FOUND' || err.message?.toLowerCase().includes('not found') || err.status === 404) {
                    setError({
                        title: 'Story Not Found',
                        message: 'This story generation could not be found. It may have expired or the link is incorrect.',
                        suggestion: 'Check My Creations for your existing stories.',
                        icon: '🔍'
                    });
                    return; // Stop polling
                }

                // Auto-retry on network errors (up to 3 times with exponential backoff)
                if (networkRetryCountRef.current < MAX_NETWORK_RETRIES) {
                    networkRetryCountRef.current += 1;
                    const retryDelay = Math.pow(2, networkRetryCountRef.current) * 1000; // 2s, 4s, 8s
                    console.log(`Network error, retrying in ${retryDelay}ms (attempt ${networkRetryCountRef.current}/${MAX_NETWORK_RETRIES})`);
                    setTimeout(pollStatus, retryDelay);
                    return;
                }

                // All retries exhausted - show error
                const friendlyError = getFriendlyError(err.code || 'NETWORK_ERROR', err.message);
                setError(friendlyError);
            }
        };

        pollStatus();

        return () => {
            isActive = false;
        };
    }, [jobId, navigate]);

    // Generate a mock "today count" (in production, fetch from API)
    useEffect(() => {
        // Simulate realistic count: 15-50 stories created today
        const baseCount = 15 + Math.floor(Math.random() * 35);
        setTodayCount(baseCount);
    }, []);

    // Retry handler
    const handleRetry = async () => {
        if (!jobId) return;

        setError(null);
        setStatus(JobStatus.QUEUED);
        setProgress(0);
        setCurrentStep('Retrying generation...');

        try {
            const retryResponse = await api.retryJob(jobId);
            navigate(`/generating/${retryResponse.job_id}`, { replace: true });
        } catch (err: any) {
            console.error('Retry failed:', err);
            setError(err.message || 'Retry failed. Please create a new story.');
            setCanRetry(false);
        }
    };

    // Auth modal handlers
    const handleAuthClose = () => {
        setShowAuthPrompt(false);
        // Still redirect to preview after closing
        if (pendingPreviewId) {
            navigate(`/preview/${pendingPreviewId}`);
        }
    };

    const handleGuestContinue = () => {
        setShowAuthPrompt(false);
        if (pendingPreviewId) {
            navigate(`/preview/${pendingPreviewId}`);
        }
    };

    // DISABLED: Email capture popup feature temporarily disabled
    // Handle email submission for notification
    // const handleEmailSubmit = async (email: string): Promise<boolean> => {
    //     const previewId = currentPreviewId;
    //     if (!previewId) {
    //         console.error('No preview_id available for email notification');
    //         return false;
    //     }
    //
    //     try {
    //         const result = await api.saveNotificationEmail(previewId, email);
    //         if (result.success) {
    //             setEmailSubmitted(true);
    //             setEmailPopupState(previewId, 'submitted');
    //             return true;
    //         }
    //         return false;
    //     } catch (err) {
    //         console.error('Failed to save notification email:', err);
    //         return false;
    //     }
    // };

    // Error state with retry option
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center">
                    <div className="text-5xl mb-6">{error.icon}</div>
                    <h2 className="text-2xl font-heading text-gray-900 mb-3">
                        {error.title}
                    </h2>
                    <p className="text-gray-600 mb-2">{error.message}</p>
                    {error.suggestion && (
                        <p className="text-gray-400 text-sm mb-8 flex items-center justify-center">
                            <span className="mr-1">💡</span>
                            {error.suggestion}
                        </p>
                    )}
                    {!error.suggestion && <div className="mb-8" />}

                    <div className="space-y-3">
                        {canRetry && (
                            <button
                                onClick={handleRetry}
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-bold hover:opacity-90 transition-all flex items-center justify-center space-x-2"
                            >
                                <RefreshCw className="w-5 h-5" />
                                <span>Try Again</span>
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/create')}
                            className={`w-full px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2 ${canRetry
                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                : 'bg-primary text-white hover:bg-opacity-90'
                                }`}
                        >
                            <PlusCircle className="w-5 h-5" />
                            <span>{canRetry ? 'Start Fresh' : 'Create New Story'}</span>
                        </button>
                    </div>

                    {canRetry && (
                        <p className="text-xs text-gray-400 mt-4">
                            Retry will continue from where we left off
                        </p>
                    )}
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sticky Header */}
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    {/* Title and Progress */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                            <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" />
                            <h1 className="text-lg font-heading text-gray-900">
                                Creating Your Magic Story
                            </h1>
                        </div>
                        <span className="text-lg font-black text-purple-600">
                            {Math.round(progress)}%
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                            style={{ width: `${progress}%` }}
                        >
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                        </div>
                    </div>

                    {/* FOMO Elements Row */}
                    <div className="flex flex-wrap items-center justify-between mt-3 gap-2">
                        {/* Fun rotating message */}
                        <p className="text-sm text-purple-600 font-medium flex items-center space-x-2 animate-fade-in">
                            <span>{funMessage}</span>
                        </p>

                        {/* Stats */}
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>7 days to preview</span>
                            </span>
                            <span className="flex items-center space-x-1 text-orange-500 font-bold">
                                <Flame className="w-3 h-3" />
                                <span>{todayCount} today</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop: BookViewerV2 with live generation */}
            {isDesktop && bookStructure && childName && (
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <RotatingGenerationMessage status={status} />
                        <BookViewerV2
                            previewId={pendingPreviewId || ''}
                            bookStructure={bookStructure}
                            childName={childName}
                            theme={theme}
                            style="photorealistic" // Hardcoded - no user selection
                            isPurchased={false}
                            generationPhase={generationPhase}
                            onPageChange={(pageIndex) => {
                                console.log(`[Desktop Generation] Viewing page ${pageIndex + 1}`);
                            }}
                            onPurchaseClick={() => {
                                // Show purchase modal or navigate to checkout
                                console.log('Purchase clicked during generation');
                            }}
                        />
                        {/* Show completion message below book on desktop */}
                        {status === JobStatus.COMPLETED && (
                            <div className="mt-8 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-3xl p-8 text-center text-white animate-in fade-in zoom-in duration-700 shadow-2xl">
                                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                                <h2 className="text-3xl font-heading mb-2">Your Story is Ready!</h2>
                                <p className="opacity-90 mb-1">All pages created successfully</p>
                                <p className="opacity-70 text-sm mb-4">You can now purchase your complete storybook</p>
                                <div className="flex justify-center gap-2 mt-4 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-2 h-2 bg-white rounded-full animate-bounce"
                                            style={{ animationDelay: `${i * 0.1}s` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile: BookViewerV2 with horizontal swipe - Premium UX */}
            {!isDesktop && bookStructure && childName && (
                <div className="max-w-md mx-auto px-4 py-8">
                    <div className="bg-white rounded-2xl shadow-lg p-4">
                        <RotatingGenerationMessage status={status} />
                        <BookViewerV2
                            previewId={pendingPreviewId || ''}
                            bookStructure={bookStructure}
                            childName={childName}
                            theme={theme}
                            style="photorealistic" // Hardcoded - no user selection
                            isPurchased={false}
                            generationPhase={generationPhase}
                            onPageChange={(pageIndex) => {
                                console.log(`[Mobile Generation] Viewing page ${pageIndex + 1}`);
                            }}
                            onPurchaseClick={() => {
                                console.log('Purchase clicked during generation');
                            }}
                        />
                        {/* Completion message for mobile */}
                        {status === JobStatus.COMPLETED && (
                            <div className="mt-6 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-3xl p-6 text-center text-white animate-in fade-in zoom-in duration-700 shadow-2xl">
                                <div className="text-5xl mb-3 animate-bounce">🎉</div>
                                <h2 className="text-2xl font-heading mb-2">Your Story is Ready!</h2>
                                <p className="opacity-90 text-sm mb-1">All pages created successfully</p>
                                <p className="opacity-70 text-xs mb-3">Redirecting to your magical creation...</p>
                                <div className="flex justify-center gap-1.5 mt-3">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                                            style={{ animationDelay: `${i * 0.1}s` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Bottom Spacer — accounts for iOS home indicator */}
                    <div style={{ height: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }} />
                </div>
            )}

            {/* Bottom Spacer for desktop — accounts for iOS home indicator */}
            {isDesktop && <div style={{ height: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }} />}

            {/* Auth Modal for Guest Save Prompt */}
            <AuthModal
                isOpen={showAuthPrompt}
                onClose={handleAuthClose}
                onGuestContinue={handleGuestContinue}
                context="save"
                returnPath={pendingPreviewId ? `/preview/${pendingPreviewId}` : undefined}
            />

            {/* DISABLED: Email capture popup feature temporarily disabled */}
            {/* <EmailCapturePopup
                isOpen={showEmailPopup}
                onClose={() => {
                    setShowEmailPopup(false);
                    // Persist dismissed state per preview in localStorage
                    if (currentPreviewId) {
                        setEmailPopupState(currentPreviewId, 'dismissed');
                    }
                }}
                onSubmit={handleEmailSubmit}
                childName={childName || 'your child'}
            /> */}
        </div>
    );
};

export default GenerationFeed;
