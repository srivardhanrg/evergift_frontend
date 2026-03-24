import React, { useState } from 'react';
import { Star, Send, CheckCircle, MessageCircle, Sparkles } from 'lucide-react';

const DIRECT_API_BASE = (() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    return backendUrl ? `${backendUrl}/api` : '/proxy/api';
})();

const Feedback: React.FC = () => {
    const [rating, setRating] = useState<number | null>(null);
    const [hoveredStar, setHoveredStar] = useState<number | null>(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [name, setName] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const canSubmit = rating !== null || feedbackText.trim().length > 0;

    const handleSubmit = async () => {
        if (!canSubmit || submitting) return;

        setSubmitting(true);
        setError('');

        try {
            const body: Record<string, any> = {};
            if (rating !== null) body.star_rating = rating;
            if (feedbackText.trim()) body.feedback_text = feedbackText.trim();
            if (name.trim()) body.name = name.trim();

            const response = await fetch(`${DIRECT_API_BASE}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                throw new Error('Failed to submit');
            }

            setSubmitted(true);
        } catch {
            setError('Oops! Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg text-center border border-green-50">
                    <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-heading text-slate-900 mb-4">You're a Star!</h2>
                    <p className="text-gray-500 mb-4 leading-relaxed">
                        Your feedback means the world to us. It helps us sprinkle even more magic into every storybook we create.
                    </p>
                    <div className="text-4xl mt-4">
                        {rating && '⭐'.repeat(rating)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 bg-gradient-to-b from-softPink/30 via-white to-white">
            <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 max-w-xl w-full border border-pink-50">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-pink-50 px-4 py-2 rounded-full text-sm font-semibold text-primary mb-4">
                        <Sparkles className="w-4 h-4" />
                        We'd love to hear from you!
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-heading text-slate-900 mb-3">
                        How Was the Magic?
                    </h1>
                    <p className="text-gray-500 leading-relaxed">
                        You just experienced something pretty special. Tell us what made you smile,
                        what felt different from other books, and any wishes you'd add to make it even more magical!
                    </p>
                </div>

                {/* Star Rating */}
                <div className="mb-8">
                    <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400" />
                        How many stars does your storybook deserve?
                    </label>
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredStar(star)}
                                onMouseLeave={() => setHoveredStar(null)}
                                className="transition-transform hover:scale-125 focus:outline-none"
                            >
                                <Star
                                    className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors ${
                                        (hoveredStar !== null ? star <= hoveredStar : star <= (rating || 0))
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-300'
                                    }`}
                                />
                            </button>
                        ))}
                    </div>
                    {rating && (
                        <p className="text-center text-sm text-gray-400 mt-2">
                            {rating === 5 && 'Absolutely magical! ✨'}
                            {rating === 4 && 'Pretty enchanting! 🌟'}
                            {rating === 3 && 'A good adventure! 📖'}
                            {rating === 2 && 'Room to grow! 🌱'}
                            {rating === 1 && 'We can do better! 💪'}
                        </p>
                    )}
                </div>

                {/* Feedback Text */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-primary" />
                        Spill the magic beans!
                    </label>
                    <p className="text-xs text-gray-400 mb-2">
                        What did you love? What made this different from other kids' books? Any secret ingredient we should add?
                    </p>
                    <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="My kid absolutely loved the part where..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all resize-none text-slate-700 placeholder-gray-300"
                        maxLength={2000}
                    />
                </div>

                {/* Name (optional) */}
                <div className="mb-8">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Your name <span className="font-normal text-gray-400">(optional — but we love putting a name to the magic)</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="The proud parent/gifter"
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all text-slate-700 placeholder-gray-300"
                        maxLength={100}
                    />
                </div>

                {/* Error */}
                {error && (
                    <p className="text-red-500 text-sm text-center mb-4">{error}</p>
                )}

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitting}
                    className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                        canSubmit && !submitting
                            ? 'bg-primary text-white shadow-lg hover:shadow-primary/20 hover:scale-[1.01] active:scale-[0.99]'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    {submitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            Send Your Magic Review
                        </>
                    )}
                </button>

                <p className="text-center text-xs text-gray-300 mt-4">
                    A star rating or a written thought — either one works!
                </p>
            </div>
        </div>
    );
};

export default Feedback;
