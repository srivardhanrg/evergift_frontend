import React, { useState, useEffect } from 'react';
import { Sparkles, Gift, Loader2 } from 'lucide-react';

/**
 * UnlockingOverlay - Compact overlay shown after payment
 * 
 * Redesigned for:
 * - Consistent with app's light theme
 * - Compact size (no scroll needed)
 * - Semi-transparent blur backdrop
 * - Removed email capture (already have from Shopify)
 */

// Creative messages that rotate
const UNLOCKING_MESSAGES = [
    "Unlocking your exclusive story...",
    "Removing the magical seals...",
    "Preparing high-resolution pages...",
    "Unwrapping your personalized gift...",
    "Almost there! Magic in progress...",
    "Polishing every beautiful detail...",
];

interface UnlockingOverlayProps {
    childName: string;
    isVisible: boolean;
    progress: number; // 0-100
    email: string;
    onEmailChange: (email: string) => void;
    onComplete?: () => void;
}

const UnlockingOverlay: React.FC<UnlockingOverlayProps> = ({
    childName,
    isVisible,
    progress,
}) => {
    const [messageIndex, setMessageIndex] = useState(0);

    // Rotate messages every 3 seconds
    useEffect(() => {
        if (!isVisible) return;

        const interval = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % UNLOCKING_MESSAGES.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [isVisible]);

    if (!isVisible) return null;

    const currentMessage = UNLOCKING_MESSAGES[messageIndex];
    const isComplete = progress >= 100;

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            {/* Compact content card - matches app's white theme */}
            <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl animate-scale-in">
                {/* Success icon or spinner */}
                <div className="mb-4">
                    {isComplete ? (
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                            <Gift className="w-8 h-8 text-white" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                    )}
                </div>

                {/* Title */}
                <h2 className="text-xl font-heading text-gray-900 mb-1">
                    {isComplete ? 'Your Story is Ready!' : 'Preparing Your Story'}
                </h2>
                <p className="text-gray-500 text-sm mb-5">
                    {childName}'s magical adventure
                </p>

                {/* Progress bar */}
                <div className="mb-4">
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-pink-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-gray-400 text-xs mt-2">{Math.round(progress)}% complete</p>
                </div>

                {/* Current message */}
                <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>{currentMessage}</span>
                </div>

                {/* Bottom note */}
                <p className="text-gray-400 text-xs mt-5">
                    Please wait, this will only take a moment...
                </p>
            </div>
        </div>
    );
};

export default UnlockingOverlay;
