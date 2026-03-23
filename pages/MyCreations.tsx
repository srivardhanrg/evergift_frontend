/**
 * MyCreations Page
 *
 * Dashboard showing all user's story creations with tabs:
 * - "All Stories" - Browse and preview creations
 * - "Ordered" - Track physical book orders and download digital purchases
 *
 * Works for both logged-in Shopify customers and guest sessions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, BookOpen, Loader2, RefreshCw, AlertCircle, Sparkles, Package } from 'lucide-react';
import { api, isShopifyCustomerLoggedIn, getPendingCheckout, clearPendingCheckout } from '../src/api/client';
import type { CreationItem, MyCreationsResponse } from '../src/api/client';
import CreationCard from '../components/CreationCard';
import OrdersList from '../components/OrdersList';
import { SkeletonGrid } from '../components/SkeletonCard';
import { getShopifyLoginUrl } from '../components/AuthModal';

type TabType = 'stories' | 'ordered';

const MyCreations: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [creations, setCreations] = useState<CreationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [canCreateMore, setCanCreateMore] = useState(true);
    const [total, setTotal] = useState(0);

    // Tab state - defaults to 'ordered' if ?tab=ordered in URL, else 'stories'
    const urlTab = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState<TabType>(urlTab === 'ordered' ? 'ordered' : 'stories');
    // Ordered tab refresh tracking
    const [orderedLastUpdated, setOrderedLastUpdated] = useState<Date | null>(null);
    const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
    const [orderedRefreshKey, setOrderedRefreshKey] = useState(0);

    const isLoggedIn = isShopifyCustomerLoggedIn();

    // Update URL when tab changes
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        if (tab === 'ordered') {
            setSearchParams({ tab: 'ordered' });
            // Auto-set lastUpdated when user first opens the tab
            if (!orderedLastUpdated) {
                setOrderedLastUpdated(new Date());
            }
        } else {
            setSearchParams({});
        }
    };

    // Refresh handler for the Ordered tab
    const handleRefreshOrders = useCallback(async () => {
        if (isRefreshingOrders) return;
        setIsRefreshingOrders(true);
        // Re-fetch the creations list so OrdersList gets fresh data
        try {
            const response: MyCreationsResponse = await api.getMyCreations();
            setCreations(response.creations);
        } catch {
            // Silently fail — existing data stays
        } finally {
            setOrderedLastUpdated(new Date());
            setOrderedRefreshKey(k => k + 1); // forces OrdersList to re-fetch print statuses
            setIsRefreshingOrders(false);
        }
    }, [isRefreshingOrders]);

    // Check for in-progress job that user may have navigated away from
    const [currentJob, setCurrentJob] = useState<{ jobId: string; childName: string } | null>(null);

    // Check for in-progress job on mount
    useEffect(() => {
        try {
            const storedJob = localStorage.getItem('magictales_current_job');
            if (storedJob) {
                const { jobId, childName, timestamp } = JSON.parse(storedJob);
                // Only show if less than 15 minutes old
                if (Date.now() - timestamp < 15 * 60 * 1000) {
                    setCurrentJob({ jobId, childName });
                } else {
                    localStorage.removeItem('magictales_current_job');
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
    }, []);

    // Check for pending checkout on mount (fallback for when Shopify ignores return_to)
    useEffect(() => {
        const pendingCheckout = getPendingCheckout();
        if (pendingCheckout) {
            console.log('[MyCreations] Found pending checkout, redirecting to preview:', pendingCheckout.previewId);
            // Clear the pending checkout before redirecting
            clearPendingCheckout();
            // Redirect to preview page with checkout_success flag
            navigate(`/preview/${pendingCheckout.previewId}?checkout_success=true`, { replace: true });
        }
    }, [navigate]);

    const fetchCreations = async () => {
        setLoading(true);
        setError(null);

        try {
            const response: MyCreationsResponse = await api.getMyCreations();
            setCreations(response.creations);
            setCanCreateMore(response.can_create_more);
            setTotal(response.total);
        } catch (err) {
            console.error('Failed to fetch creations:', err);
            setError('Failed to load your stories. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch if we're not redirecting due to pending checkout
        const pendingCheckout = getPendingCheckout();
        if (!pendingCheckout) {
            fetchCreations().then(() => {
                // If page loaded directly on the ordered tab (e.g. from "Track Order" button),
                // set the initial lastUpdated so the timestamp shows correctly
                if (urlTab === 'ordered') {
                    setOrderedLastUpdated(new Date());
                }
            });
        }
    }, []);

    const handleCreateNew = () => {
        if (!canCreateMore) {
            // Guest limit reached - redirect to login
            window.location.href = getShopifyLoginUrl('/my-creations');
            return;
        }
        navigate('/');
    };

    // Loading state - shows skeleton cards
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-softPink/30 to-white">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    {/* Header skeleton */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
                            <div className="h-4 w-32 bg-gray-100 rounded-lg animate-pulse" />
                        </div>
                        <div className="h-12 w-40 bg-gray-200 rounded-full animate-pulse" />
                    </div>

                    {/* Skeleton grid */}
                    <SkeletonGrid count={6} />
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-softPink/30 to-white flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-heading text-gray-900 mb-2">Oops! Something went wrong</h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={fetchCreations}
                        className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-bold hover:bg-opacity-90 transition"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Empty state
    if (creations.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-softPink/30 to-white">
                <div className="max-w-4xl mx-auto px-4 py-16">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BookOpen className="w-12 h-12 text-primary" />
                        </div>
                        <h1 className="text-3xl font-heading text-gray-900 mb-3">No stories yet!</h1>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            Create your first personalized storybook and watch the magic happen.
                        </p>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-opacity-90 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            <Plus className="w-5 h-5" />
                            Create Your First Story
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Main view with creations
    return (
        <div className="min-h-screen bg-gradient-to-b from-softPink/30 to-white">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-heading text-gray-900">My Creations</h1>
                        <p className="text-gray-500 mt-1">
                            {total} magical {total === 1 ? 'story' : 'stories'}
                        </p>
                    </div>

                    {canCreateMore ? (
                        <button
                            onClick={handleCreateNew}
                            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-bold hover:bg-opacity-90 transition shadow-md hover:shadow-lg"
                        >
                            <Plus className="w-5 h-5" />
                            Create New Story
                        </button>
                    ) : (
                        <div className="text-right">
                            <p className="text-sm text-gray-500 mb-2">You've created 3 stories</p>
                            <a
                                href={getShopifyLoginUrl('/my-creations')}
                                className="inline-flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-full font-bold hover:bg-opacity-90 transition"
                            >
                                Sign in for more
                            </a>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                        <button
                            onClick={() => handleTabChange('stories')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${activeTab === 'stories'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <BookOpen className="w-4 h-4" />
                            All Stories
                        </button>
                        <button
                            onClick={() => handleTabChange('ordered')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${activeTab === 'ordered'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Package className="w-4 h-4" />
                            Ordered
                        </button>
                    </div>

                    {/* Refresh button — only visible on Ordered tab */}
                    {activeTab === 'ordered' && (
                        <button
                            onClick={handleRefreshOrders}
                            disabled={isRefreshingOrders}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                            title="Refresh order status"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshingOrders ? 'animate-spin' : ''}`} />
                            {isRefreshingOrders ? 'Refreshing...' : 'Refresh'}
                        </button>
                    )}
                </div>

                {/* In-progress job recovery banner */}
                {currentJob && activeTab === 'stories' && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-6 flex items-center justify-between flex-wrap gap-4 border border-purple-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-2 rounded-full">
                                <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                            </div>
                            <div>
                                <p className="text-gray-900 font-bold">Story in Progress!</p>
                                <p className="text-gray-600 text-sm">{currentJob.childName}'s story is still being created</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setCurrentJob(null);
                                navigate(`/generating/${currentJob.jobId}`);
                            }}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold text-sm hover:opacity-90 transition flex items-center gap-2"
                        >
                            <Sparkles className="w-4 h-4" />
                            View Progress
                        </button>
                    </div>
                )}

                {/* Guest banner */}
                {!isLoggedIn && creations.length > 0 && activeTab === 'stories' && (
                    <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-4 mb-8 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">📚</span>
                            <p className="text-gray-700 font-medium">Love your story? Sign in to save it!</p>
                        </div>
                        <a
                            href={getShopifyLoginUrl('/my-creations')}
                            className="bg-white text-primary px-4 py-2 rounded-full font-bold text-sm border border-primary/20 hover:bg-primary hover:text-white transition"
                        >
                            Sign In
                        </a>
                    </div>
                )}

                {/* Tab Content */}
                {activeTab === 'stories' ? (
                    /* All Stories Tab - Creations Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {creations.map((creation) => (
                            <CreationCard key={creation.preview_id} creation={creation} />
                        ))}
                    </div>
                ) : (
                    /* Ordered Tab - Orders List */
                    <OrdersList
                        key={orderedRefreshKey}
                        creations={creations}
                        lastUpdated={orderedLastUpdated}
                    />
                )}
            </div>
        </div>
    );
};

export default MyCreations;
