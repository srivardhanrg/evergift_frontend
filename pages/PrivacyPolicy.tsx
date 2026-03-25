import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

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
                    <p className="text-gray-500">Your privacy is our priority. This policy explains how we protect and handle your personal information at StoryGift.</p>
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
                    <p className="text-gray-600">
                        At StoryGift, your privacy matters to us. This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our platform.
                    </p>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">1. Information We Collect</h2>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Child's name, age, and gender
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Uploaded images of the child
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Parent or guardian's email address
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Order details including delivery and payment status (via Shopify)
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">2. How We Use Your Information</h2>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                To generate and personalize the storybook and illustrations
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                To process your order and provide delivery updates
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                To ensure secure payment and fraud prevention
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                To improve user experience, design, and performance
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                To comply with legal and regulatory requirements
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">3. Legal Basis for Processing</h2>
                        <p className="text-gray-600">
                            We process your personal data based on your consent, our legitimate interests in providing a seamless experience, and in some cases, to fulfill contractual obligations related to your order.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">4. Data Retention</h2>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                If you do not save your preview, all uploaded photos are automatically deleted within 48 hours
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                If you save a preview or place an order, images are securely stored for up to 30 days so you can access your book or request a reprint
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                After 30 days, all images are permanently deleted from our servers
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Order data may be retained longer for legal and accounting purposes
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">5. Sharing with Third Parties</h2>
                        <p className="text-gray-600 mb-3">
                            To provide our AI-powered storybook service, we use the following trusted third-party services:
                        </p>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <strong>Shopify:</strong> Payment processing and order management
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <strong>Fal.ai:</strong> AI image generation for story illustrations
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <strong>Segmind:</strong> Face transformation for cartoon-style illustrations
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <strong>Lulu:</strong> Print-on-demand partner for physical books
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <strong>Cloudflare R2:</strong> Secure cloud storage for generated PDFs and images
                            </li>
                        </ul>
                        <p className="text-gray-600 mt-3">
                            These services are bound by strict confidentiality and data security standards. We never sell or rent your data to third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">6. Your Rights</h2>
                        <p className="text-gray-600 mb-3">You have the following rights regarding your personal data:</p>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Access your personal data
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Request correction or deletion
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Withdraw consent at any time
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Raise concerns with a data protection authority
                            </li>
                        </ul>
                        <p className="text-gray-600 mt-3">
                            To exercise your rights or request immediate deletion of your photos and personal data, contact us at{' '}
                            <a href="mailto:hello@juvilabs.com" className="text-primary hover:underline">
                                hello@juvilabs.com
                            </a>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">7. Data Security</h2>
                        <p className="text-gray-600">
                            We implement strict security measures including encryption, secure file storage, and limited access to personal data. Your photos are used only to create your personalized book and are never shared with unauthorized third parties, never sold, and never used for advertising or AI training.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">8. Children's Privacy</h2>
                        <p className="text-gray-600 mb-3">
                            StoryGift is intended for parents and guardians. We do not knowingly collect personal data directly from children. All information must be submitted by a consenting adult who is the parent or legal guardian of the child.
                        </p>
                        <p className="text-gray-600">
                            We comply with applicable children's privacy laws, including COPPA (Children's Online Privacy Protection Act). Parents have the right to review, delete, or request information about their child's data at any time.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">9. International Data Transfers</h2>
                        <p className="text-gray-600">
                            If you are accessing StoryGift from outside India, please note that your data may be transferred to and processed in India or other countries where our infrastructure or partners are located. We ensure adequate safeguards are in place for international transfers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">10. Changes to This Policy</h2>
                        <p className="text-gray-600">
                            We may revise this Privacy Policy from time to time. Updates will be posted here with a revised 'Effective Date.' Please check back regularly.
                        </p>
                    </section>

                    <div className="pt-6 border-t border-gray-100">
                        <p className="text-sm text-gray-500 text-center">
                            <strong>Effective Date:</strong> March 2026
                        </p>
                        <p className="text-sm text-gray-500 text-center mt-2">
                            Operated by Juvilabs Pvt Limited
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
