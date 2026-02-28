import React, { useState, useEffect } from 'react';
import { Sparkles, Gift, Loader2, CheckCircle, Truck, Package } from 'lucide-react';

/**
 * UnlockingOverlay - Compact overlay shown after payment
 *
 * Features:
 * - Multi-phase progress system for both digital and physical orders
 * - Digital: payment → generating → preparing_pdf → complete
 * - Physical: payment → generating → preparing_pdf → preparing_print → submitting_print → print_submitted
 * - Phase-specific messaging and icons
 * - Only shows "Ready!" when PDF is actually downloadable (digital) or print is submitted (physical)
 */

// Phase type for clear state management
// Includes both digital-only and physical-only phases
export type UnlockPhase =
    | 'payment'
    | 'generating'
    | 'preparing_pdf'
    | 'complete'           // Digital final state
    | 'preparing_print'    // Physical: preparing Lulu PDFs
    | 'submitting_print'   // Physical: calling Lulu API
    | 'print_submitted';   // Physical: Lulu accepted the job

// Phase-specific rotating messages
const PHASE_MESSAGES: Record<UnlockPhase, string[]> = {
    payment: [
        "Confirming your purchase...",
        "Securing your magical order...",
        "Payment received! Starting the magic...",
    ],
    generating: [
        "Painting magical illustrations...",
        "Weaving your child's adventure...",
        "Adding enchanted details...",
        "Crafting beautiful scenes...",
        "Bringing characters to life...",
    ],
    preparing_pdf: [
        "Preparing your print-ready PDF...",
        "Finalizing high-resolution pages...",
        "Polishing every beautiful detail...",
        "Almost ready for download...",
    ],
    complete: [
        "Your personalized story awaits!",
    ],
    // Physical order phases
    preparing_print: [
        "Preparing your book for print...",
        "Creating print-ready files...",
        "Formatting pages for printing...",
        "Adding finishing touches...",
    ],
    submitting_print: [
        "Sending to our print partner...",
        "Submitting your book order...",
        "Connecting with print facility...",
    ],
    print_submitted: [
        "Your book is being printed!",
        "Crafted with care just for you...",
    ],
};

// Phase-specific titles
const PHASE_TITLES: Record<UnlockPhase, string> = {
    payment: "Payment Confirmed!",
    generating: "Creating Your Story",
    preparing_pdf: "Almost There!",
    complete: "Your Story is Ready!",
    // Physical order titles
    preparing_print: "Preparing for Print",
    submitting_print: "Submitting Print Order",
    print_submitted: "Book Ordered!",
};

interface UnlockingOverlayProps {
    childName: string;
    isVisible: boolean;
    progress: number; // 0-100
    phase: UnlockPhase;
    email?: string;
    onEmailChange?: (email: string) => void;
    onComplete?: () => void;
}

const UnlockingOverlay: React.FC<UnlockingOverlayProps> = ({
    childName,
    isVisible,
    progress,
    phase,
}) => {
    const [messageIndex, setMessageIndex] = useState(0);

    // Reset message index when phase changes
    useEffect(() => {
        setMessageIndex(0);
    }, [phase]);

    // Rotate messages every 3 seconds
    useEffect(() => {
        if (!isVisible) return;

        const messages = PHASE_MESSAGES[phase];
        if (messages.length <= 1) return;

        const interval = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % messages.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [isVisible, phase]);

    if (!isVisible) return null;

    const messages = PHASE_MESSAGES[phase];
    const currentMessage = messages[messageIndex % messages.length];
    const title = phase === 'generating'
        ? `Creating ${childName}'s Story`
        : PHASE_TITLES[phase];
    const isComplete = phase === 'complete';

    // Check if this is a physical order "complete" state
    const isPhysicalComplete = phase === 'print_submitted';

    // Phase-specific icon and color
    const getPhaseIcon = () => {
        if (isComplete || isPhysicalComplete) {
            const IconComponent = isPhysicalComplete ? Truck : Gift;
            return (
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-subtle">
                    <IconComponent className="w-8 h-8 text-white" />
                </div>
            );
        }

        const bgColors: Record<UnlockPhase, string> = {
            payment: 'from-blue-500 to-indigo-600',
            generating: 'from-primary to-pink-500',
            preparing_pdf: 'from-amber-500 to-orange-500',
            complete: 'from-green-400 to-emerald-500',
            // Physical order phases
            preparing_print: 'from-purple-500 to-violet-600',
            submitting_print: 'from-cyan-500 to-blue-600',
            print_submitted: 'from-green-400 to-emerald-500',
        };

        // Use Package icon for physical print phases
        const IconComponent = (phase === 'preparing_print' || phase === 'submitting_print')
            ? Package
            : Loader2;

        return (
            <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${bgColors[phase]} rounded-full flex items-center justify-center shadow-lg`}>
                <IconComponent className="w-8 h-8 text-white animate-spin" />
            </div>
        );
    };

    // Phase-specific progress bar color
    const getProgressColor = () => {
        switch (phase) {
            case 'payment': return 'from-blue-500 to-indigo-600';
            case 'generating': return 'from-primary to-pink-500';
            case 'preparing_pdf': return 'from-amber-500 to-orange-500';
            case 'complete': return 'from-green-400 to-emerald-500';
            // Physical order phases
            case 'preparing_print': return 'from-purple-500 to-violet-600';
            case 'submitting_print': return 'from-cyan-500 to-blue-600';
            case 'print_submitted': return 'from-green-400 to-emerald-500';
            default: return 'from-primary to-pink-500';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            {/* Compact content card - matches app's white theme */}
            <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl animate-scale-in">
                {/* Phase icon */}
                <div className="mb-4">
                    {getPhaseIcon()}
                </div>

                {/* Title - personalized during generation */}
                <h2 className="text-xl font-heading text-gray-900 mb-1">
                    {title}
                </h2>
                <p className="text-gray-500 text-sm mb-5">
                    {childName}'s magical adventure
                </p>

                {/* Progress bar with phase-specific color */}
                <div className="mb-4">
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${getProgressColor()} rounded-full transition-all duration-500 ease-out`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-gray-400 text-xs mt-2">
                        {isComplete ? '✓ Complete!' : `${Math.round(progress)}% complete`}
                    </p>
                </div>

                {/* Current message with sparkles */}
                <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>{currentMessage}</span>
                </div>

                {/* Bottom note - phase specific */}
                <p className="text-gray-400 text-xs mt-5">
                    {isComplete
                        ? "Click the download button below to get your PDF!"
                        : isPhysicalComplete
                        ? "You'll receive tracking info via email soon!"
                        : "Please wait, this will only take a moment..."}
                </p>

                {/* Success checkmark animation for complete phase */}
                {(isComplete || isPhysicalComplete) && (
                    <div className="absolute -top-3 -right-3 bg-green-500 rounded-full p-2 shadow-lg animate-bounce">
                        <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default UnlockingOverlay;
