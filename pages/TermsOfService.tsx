import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, CreditCard, Package, AlertCircle, Mail } from 'lucide-react';

const TermsOfService: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-softPink/30 to-white py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Back Button */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Home</span>
                </Link>

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/10 rounded-2xl mb-4">
                        <FileText className="w-8 h-8 text-secondary" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-heading text-gray-900 mb-2">Terms of Service</h1>
                    <p className="text-gray-500">Last updated: January 2025</p>
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-secondary" />
                            Our Service
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            StoryGift creates personalized AI-generated storybooks featuring your child as the main character.
                            By using our service, you agree to these terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-secondary" />
                            Pricing & Payments
                        </h2>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-secondary">•</span>
                                Free preview: 5 illustrated pages to review before purchase
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-secondary">•</span>
                                Complete book: ₹599 for 10 illustrated pages + PDF download
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-secondary">•</span>
                                Payments processed securely through Shopify
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-secondary" />
                            Important Notes
                        </h2>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-secondary">•</span>
                                Preview storybooks expire after 7 days if not purchased
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-secondary">•</span>
                                AI-generated illustrations may vary slightly from preview
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-secondary">•</span>
                                You retain all rights to photos you upload
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-secondary">•</span>
                                We do not use facial recognition technology
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">Refund Policy</h2>
                        <p className="text-gray-600 leading-relaxed">
                            We offer a <strong>30-day money-back guarantee</strong>. If you're not satisfied with your
                            personalized storybook, contact us for a full refund. No questions asked.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-secondary" />
                            Contact
                        </h2>
                        <p className="text-gray-600">
                            For any questions about these terms, please contact us at{' '}
                            <a href="mailto:support@storygift.in" className="text-secondary hover:underline">
                                support@storygift.in
                            </a>
                        </p>
                    </section>

                    <div className="pt-4 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500">
                            By using StoryGift, you agree to these terms and our Privacy Policy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
