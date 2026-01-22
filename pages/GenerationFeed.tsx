import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, Clock, Flame } from 'lucide-react';
import { api, isShopifyCustomerLoggedIn } from '../src/api/client';
import { JobStatus, PageData } from '../src/types/api.types';
import BookPageCard from '../components/BookPageCard';
import CoverPageCard from '../components/CoverPageCard';
import AuthModal, { hasSavePromptBeenShown, markSavePromptShown } from '../components/AuthModal';

// Preview generates first 5 pages (remaining 5 after payment)
const TOTAL_PAGES = 5;

// Fun whimsical messages that rotate during generation - like chatbots!
const GENERATION_MESSAGES = [
    "Sprinkling fairy dust on your story... ✨",
    "Teaching the owl to deliver magical letters... 🦉",
    "Polishing the dragon's sparkly scales... 🐉",
    "Brewing a potion of adventure... 🧪",
    "Asking the stars for story ideas... ⭐",
    "Waking up the sleeping unicorns... 🦄",
    "Painting rainbows in the sky... 🌈",
    "Gathering courage from brave knights... ⚔️",
    "Baking cookies for the story characters... 🍪",
    "Training butterflies to carry dreams... 🦋",
    "Consulting the wise wizard... 🧙‍♂️",
    "Tuning the magical music box... 🎵",
    "Stitching clouds into soft pillows... ☁️",
    "Planting seeds of imagination... 🌱",
    "Whispering secrets to fireflies... ✨",
];

// Messages for each specific page
const PAGE_SPECIFIC_MESSAGES: Record<number, string[]> = {
    0: ["Designing your magical cover...", "Creating the perfect first impression...", "Making it special!"],
    1: ["Opening the enchanted storybook...", "Your hero is waking up!", "Chapter 1 is brewing..."],
    2: ["The adventure begins!", "Magic is in the air...", "Something wonderful is happening..."],
    3: ["Plot twist incoming!", "New friends appearing...", "The story thickens..."],
    4: ["Excitement building!", "Almost at the peak...", "Drama unfolds..."],
    5: ["Creating a magical ending!", "Wrapping up the adventure...", "The grand finale!"],
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

    // State
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState('Starting the magic...');
    const [completedPages, setCompletedPages] = useState<PageData[]>([]);
    const [coverData, setCoverData] = useState<{ url: string; childName: string; storyTitle: string } | null>(null);
    const [status, setStatus] = useState<JobStatus>(JobStatus.QUEUED);
    const [error, setError] = useState<string | null>(null);
    const [canRetry, setCanRetry] = useState(false);
    const [funMessage, setFunMessage] = useState(GENERATION_MESSAGES[0]);
    const [messageIndex, setMessageIndex] = useState(0);
    const [todayCount, setTodayCount] = useState(0);
    const [showAuthPrompt, setShowAuthPrompt] = useState(false);
    const [pendingPreviewId, setPendingPreviewId] = useState<string | null>(null);

    // Ref for auto-scrolling to active card
    const activeCardRef = useRef<HTMLDivElement>(null);
    const isUserScrollingRef = useRef(false);
    const lastScrollTimeRef = useRef(0);

    // Track if user is manually scrolling (to avoid hijacking their scroll)
    useEffect(() => {
        let scrollTimeout: NodeJS.Timeout;

        const handleScroll = () => {
            isUserScrollingRef.current = true;
            lastScrollTimeRef.current = Date.now();

            // Reset user scrolling flag after 2 seconds of no scroll
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isUserScrollingRef.current = false;
            }, 2000);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
        };
    }, []);

    // Rotate fun messages every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex(prev => {
                const next = (prev + 1) % GENERATION_MESSAGES.length;
                setFunMessage(GENERATION_MESSAGES[next]);
                return next;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll to the newly completed page - with delay and respecting user scroll
    useEffect(() => {
        // Skip if user is actively scrolling
        if (isUserScrollingRef.current) return;

        // Add delay before scrolling to let user see the completed page
        const timer = setTimeout(() => {
            if (activeCardRef.current && !isUserScrollingRef.current) {
                activeCardRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 800); // 800ms delay before auto-scroll

        return () => clearTimeout(timer);
    }, [completedPages.length, coverData]);

    // Poll for job status
    useEffect(() => {
        if (!jobId) return;

        let isActive = true;
        let previewId: string | null = null;

        const pollStatus = async () => {
            try {
                const statusResponse = await api.getJobStatus(jobId);

                if (!isActive) return;

                setProgress(statusResponse.progress);
                setStatus(statusResponse.status);

                if (statusResponse.current_step) {
                    setCurrentStep(statusResponse.current_step);
                }

                // Store preview_id when available
                if (statusResponse.preview_id) {
                    previewId = statusResponse.preview_id;
                }

                // Fetch preview data to get ACTUAL completed pages
                if (previewId && statusResponse.progress > 0) {
                    try {
                        const previewData = await api.getPreview(previewId);
                        if (previewData) {
                            // Extract cover page (page 0) if available
                            const coverPage = previewData.preview_pages?.find((p: any) => p.page_number === 0 || p.is_cover);
                            if (coverPage && previewData.child_name) {
                                setCoverData({
                                    url: coverPage.image_url,
                                    childName: previewData.child_name,
                                    storyTitle: previewData.story_title || `${previewData.child_name}'s Adventure`
                                });
                            }

                            // Filter out cover and set story pages (pages 1-5)
                            const storyPages = previewData.preview_pages?.filter(
                                (p: any) => p.page_number > 0 && !p.is_cover
                            ) || [];
                            setCompletedPages(storyPages);
                        }
                    } catch (previewErr) {
                        // Preview data might not be available yet, continue polling
                        console.log('Preview data not ready yet, continuing...');
                    }
                }

                // Handle completion - check if should show auth prompt for guests
                if (statusResponse.status === JobStatus.COMPLETED && statusResponse.preview_id) {
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
                    setError(statusResponse.error || 'Generation failed. Please try again.');
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
                if (isActive) {
                    setError(err.message || 'Failed to check generation status.');
                }
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

    // Generate page array for rendering
    const pages = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);

    // Determine if cover is still generating
    const isCoverGenerating = !coverData && progress > 0 && progress < 15;
    const isCoverCompleted = !!coverData;

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

    // Error state with retry option
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md text-center">
                    <div className="text-5xl mb-6">😢</div>
                    <h2 className="text-2xl font-heading text-gray-900 mb-4">
                        Oh no! A magical mishap
                    </h2>
                    <p className="text-gray-500 mb-8">{error}</p>

                    <div className="space-y-3">
                        {canRetry && (
                            <button
                                onClick={handleRetry}
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-bold hover:opacity-90 transition-all flex items-center justify-center space-x-2"
                            >
                                <span>✨</span>
                                <span>Retry Magic</span>
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/create')}
                            className={`w-full px-8 py-4 rounded-2xl font-bold transition-all ${canRetry
                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                : 'bg-primary text-white hover:bg-opacity-90'
                                }`}
                        >
                            {canRetry ? 'Start Fresh' : 'Create New Story'}
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
                    <div className="flex items-center justify-between mt-3">
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

            {/* Page Feed */}
            <div className="max-w-md mx-auto px-4 py-10 space-y-5">
                {/* COVER - Always first */}
                <div
                    ref={isCoverGenerating ? activeCardRef : null}
                    className={`transition-all duration-500 ${isCoverCompleted ? 'animate-in fade-in slide-in-from-bottom-4' : ''}`}
                >
                    {isCoverCompleted && coverData ? (
                        <>
                            <CoverPageCard
                                imageUrl={coverData.url}
                                storyTitle={coverData.storyTitle}
                                childName={coverData.childName}
                                isPaid={false}
                            />
                            <div className="mt-3 text-center animate-bounce">
                                <span className="inline-block bg-green-100 text-green-600 px-4 py-1 rounded-full text-sm font-bold">
                                    ✓ Cover created!
                                </span>
                            </div>
                        </>
                    ) : (
                        <BookPageCard
                            pageNumber={0}
                            state={isCoverGenerating ? 'generating' : 'pending'}
                            generatingMessage={PAGE_SPECIFIC_MESSAGES[0][messageIndex % PAGE_SPECIFIC_MESSAGES[0].length]}
                            isCover={true}
                        />
                    )}
                </div>

                {/* STORY PAGES 1-5 */}
                {pages.map((pageNum, index) => {
                    // Determine state by checking if page exists in completedPages
                    const completedPage = completedPages.find(p => p.page_number === pageNum);
                    const isCompleted = !!completedPage;

                    // The "generating" page is the next one after cover + all completed story pages
                    // Cover must be complete first
                    const coverDone = isCoverCompleted;
                    const nextGeneratingIndex = completedPages.length;
                    const isGenerating = coverDone && !isCompleted && index === nextGeneratingIndex;

                    let state: 'completed' | 'generating' | 'pending';
                    if (isCompleted) {
                        state = 'completed';
                    } else if (isGenerating) {
                        state = 'generating';
                    } else {
                        state = 'pending';
                    }

                    // Get page-specific message for generating state
                    const pageMessages = PAGE_SPECIFIC_MESSAGES[pageNum] || ["Creating magic..."];
                    const pageMessage = pageMessages[messageIndex % pageMessages.length];

                    return (
                        <div
                            key={pageNum}
                            ref={isGenerating ? activeCardRef : null}
                            className={`transition-all duration-500 ${isCompleted ? 'animate-in fade-in slide-in-from-bottom-4' : ''}`}
                        >
                            <BookPageCard
                                pageNumber={pageNum}
                                state={state}
                                imageUrl={completedPage?.image_url}
                                storyText={completedPage?.story_text}
                                generatingMessage={isGenerating ? pageMessage : undefined}
                            />

                            {/* Celebration when page completes */}
                            {isCompleted && index === completedPages.length - 1 && completedPages.length < TOTAL_PAGES && (
                                <div className="mt-3 text-center animate-bounce">
                                    <span className="inline-block bg-green-100 text-green-600 px-4 py-1 rounded-full text-sm font-bold">
                                        ✓ Page {pageNum} created!
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Completion Message */}
                {status === JobStatus.COMPLETED && (
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-8 text-center text-white animate-in fade-in zoom-in duration-500">
                        <div className="text-5xl mb-4">🎉</div>
                        <h2 className="text-2xl font-heading mb-2">Your Story is Ready!</h2>
                        <p className="opacity-90 mb-4">Redirecting to your magical creation...</p>
                        <button
                            onClick={() => navigate('/my-creations')}
                            className="mt-2 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium transition"
                        >
                            ← Back to My Creations
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Spacer for last card visibility */}
            <div className="h-20" />

            {/* Auth Modal for Guest Save Prompt */}
            <AuthModal
                isOpen={showAuthPrompt}
                onClose={handleAuthClose}
                onGuestContinue={handleGuestContinue}
                context="save"
                returnPath={pendingPreviewId ? `/preview/${pendingPreviewId}` : undefined}
            />
        </div>
    );
};

export default GenerationFeed;
