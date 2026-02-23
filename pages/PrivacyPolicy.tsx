import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Trash2, Eye, Mail } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
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
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                        <Shield className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-heading text-gray-900 mb-2">Privacy Policy</h1>
                    <p className="text-gray-500">Last updated: January 2025</p>
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-primary" />
                            Information We Collect
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            We collect the minimum information necessary to create your personalized storybook:
                        </p>
                        <ul className="mt-4 space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Child's name and age (for story personalization)
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Photo (for AI illustration generation)
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Email address (for order delivery)
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-primary" />
                            How We Protect Your Data
                        </h2>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Photos are processed securely and never stored permanently
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                All data is encrypted in transit and at rest
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                We never sell or share your data with third parties
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Previews are automatically deleted after 7 days
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4 flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-primary" />
                            Data Retention
                        </h2>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Uploaded photos: Deleted within 24 hours of processing
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Preview stories: Automatically expire after 7 days
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Purchased digital books: PDF available for 1 year after purchase
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-primary" />
                            Contact Us
                        </h2>
                        <p className="text-gray-600">
                            If you have any questions about our privacy practices, please contact us at{' '}
                            <a href="mailto:privacy@storygift.com" className="text-primary hover:underline">
                                privacy@storygift.com
                            </a>
                        </p>
                    </section>

                    <div className="pt-4 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500">
                            We follow industry best practices for data protection and children's privacy. Your child's safety is our top priority.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
