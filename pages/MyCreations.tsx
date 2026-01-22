/**
 * MyCreations Page
 *
 * Dashboard showing all user's story creations.
 * Works for both logged-in Shopify customers and guest sessions.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { api, isShopifyCustomerLoggedIn, getPendingCheckout, clearPendingCheckout } from '../src/api/client';
import type { CreationItem, MyCreationsResponse } from '../src/api/client';
import CreationCard from '../components/CreationCard';
import { getShopifyLoginUrl } from '../components/AuthModal';

const MyCreations: React.FC = () => {
    const navigate = useNavigate();
    const [creations, setCreations] = useState<CreationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [canCreateMore, setCanCreateMore] = useState(true);
    const [total, setTotal] = useState(0);

    const isLoggedIn = isShopifyCustomerLoggedIn();

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
            fetchCreations();
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

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-softPink/30 to-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Loading your magical stories...</p>
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
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

                {/* Guest banner */}
                {!isLoggedIn && creations.length > 0 && (
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

                {/* Creations Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {creations.map((creation) => (
                        <CreationCard key={creation.preview_id} creation={creation} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MyCreations;
