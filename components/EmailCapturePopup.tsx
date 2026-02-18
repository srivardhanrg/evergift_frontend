import React, { useState } from 'react';
import { Mail, X, Bell, Loader2, CheckCircle } from 'lucide-react';

interface EmailCapturePopupProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (email: string) => Promise<boolean>;
    childName?: string;
}

/**
 * Popup to capture email during story generation.
 * Shown after ~30 seconds of waiting to let user leave and get notified.
 */
const EmailCapturePopup: React.FC<EmailCapturePopupProps> = ({
    isOpen,
    onClose,
    onSubmit,
    childName = 'your child'
}) => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const validateEmail = (email: string): boolean => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Please enter your email');
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);

        try {
            const success = await onSubmit(email);
            if (success) {
                setIsSuccess(true);
                // Auto close after showing success
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                setError('Failed to save email. Please try again.');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Success state
    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-heading text-gray-900 mb-2">You're all set!</h3>
                    <p className="text-gray-500 text-sm">
                        We'll email you at <strong className="text-gray-700">{email}</strong> when {childName}'s story is ready.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Don't want to wait?</h3>
                            <p className="text-white/80 text-sm">We'll notify you when it's ready!</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    <p className="text-gray-600 text-sm mb-4">
                        Enter your email and we'll send you a link to {childName}'s magical story as soon as it's ready. No need to keep this page open!
                    </p>

                    {/* Email input */}
                    <div className="relative mb-4">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setError('');
                            }}
                            placeholder="your@email.com"
                            className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition ${error ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-purple-400'
                                }`}
                            disabled={isSubmitting}
                            autoFocus
                        />
                    </div>

                    {/* Error message */}
                    {error && (
                        <p className="text-red-500 text-sm mb-4 flex items-center">
                            <span className="mr-1">!</span>
                            {error}
                        </p>
                    )}

                    {/* Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition"
                            disabled={isSubmitting}
                        >
                            I'll wait
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Mail className="w-4 h-4" />
                                    <span>Notify Me</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Privacy note */}
                    <p className="text-center text-gray-400 text-xs mt-4">
                        We'll only use this to send your story. No spam, ever.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default EmailCapturePopup;
