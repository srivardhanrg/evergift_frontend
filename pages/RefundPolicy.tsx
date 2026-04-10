import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';

const RefundPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-softPink/30 to-white py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Home</span>
                </Link>

                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                        <RotateCcw className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-heading text-gray-900 mb-2">Refund Policy</h1>
                    <p className="text-gray-500">Our commitment to making things right.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
                    <p className="text-gray-600">
                        Because every EverGift book is personalized using AI — with your child's name, photo, and unique story — each order is one-of-a-kind. We provide a full preview before purchase so you can see exactly what you're getting.
                    </p>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">Digital Books (PDF)</h2>
                        <p className="text-gray-600">
                            Digital books are delivered instantly after payment and are non-refundable once accessed. You receive a detailed 14-page preview before buying, so you can review the illustrations, story, and character resemblance before committing.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">Printed Books</h2>
                        <p className="text-gray-600 mb-3">
                            We do not offer refunds for printed books based on subjective preferences such as art style, since you approve the full preview before ordering. However, we stand behind our quality:
                        </p>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <strong>Damaged in shipping</strong> — free replacement, no questions asked
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <strong>Manufacturing defect</strong> — free replacement at no cost
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Please report any issues within <strong>7 days of delivery</strong> with photos
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">Cancellations</h2>
                        <p className="text-gray-600">
                            Our AI begins generating your book immediately after payment. Cancellation is only possible if the generation process hasn't started — typically within 60 seconds of placing the order. After that, the order cannot be cancelled.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">Contact Us</h2>
                        <p className="text-gray-600">
                            If you have any concerns about your order, please reach out — we'll do our best to make it right.
                        </p>
                        <p className="text-gray-600 mt-2">
                            Email:{' '}
                            <a href="mailto:hello@juvilabs.com" className="text-primary hover:underline font-medium">
                                hello@juvilabs.com
                            </a>
                        </p>
                    </section>

                    <div className="pt-6 border-t border-gray-100">
                        <p className="text-sm text-gray-500 text-center">
                            <strong>Last updated:</strong> March 2026
                        </p>
                        <p className="text-sm text-gray-500 text-center mt-2">
                            Operated by Juvi Labs LLC
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RefundPolicy;
