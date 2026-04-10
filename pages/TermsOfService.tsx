import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

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
                    <p className="text-gray-500">Please read these terms carefully before using our personalized storybook creation service.</p>
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
                    <p className="text-gray-600">
                        Welcome to EverGift! These Terms of Service govern your access to and use of our platform, where you can create personalized storybooks featuring your child.
                    </p>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">1. Acceptance of Terms</h2>
                        <p className="text-gray-600">
                            By using our platform, you agree to comply with these Terms. If you do not agree, please do not use EverGift. You must be at least 18 years old and the parent or legal guardian of the child featured in the storybook.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">2. Storybook Creation</h2>
                        <p className="text-gray-600 mb-3">
                            You are responsible for providing accurate details (e.g., name, age, gender, images) when creating a personalized storybook. Content is generated using AI and may be subject to minor variations.
                        </p>
                        <p className="text-gray-600">
                            By uploading a child's photo, you confirm that you are the parent or legal guardian and consent to the processing of the image for storybook creation.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">3. Order & Payment</h2>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Orders are processed through our secure checkout system
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Prices are listed in your local currency where applicable
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Payment is securely handled by Stripe and other trusted providers. We never store your card details.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                All prices include applicable taxes unless otherwise stated
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">4. Delivery</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-gray-600 font-semibold mb-1">Digital Books (PDF):</p>
                                <ul className="space-y-1 text-gray-600">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        Delivered via email within 2–3 minutes after payment
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        Available for re-download for 30 days
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <p className="text-gray-600 font-semibold mb-1">Printed Books:</p>
                                <ul className="space-y-1 text-gray-600">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        Printed by our professional printing partner
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        3–5 days printing + 5–10 business days shipping (varies by location)
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        Tracking information provided via email
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">5. Cancellation & Refund Policy</h2>
                        <div className="space-y-4">
                            <p className="text-gray-600 font-medium">
                                Due to the personalized nature of our products, orders cannot be canceled once production begins. However, if you experience any issues, we’re here to help and will work with you to make it right.
                            </p>
                            
                            <div>
                                <p className="text-gray-600 font-semibold mb-1">Custom Digital Products:</p>
                                <p className="text-gray-600">
                                    Digital books are personalized specifically for your child using AI technology. By purchasing, you agree that your personalized digital product will be delivered immediately and is non-returnable once accessed.
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-600 font-semibold mb-1">Printed Books:</p>
                                <p className="text-gray-600">
                                    Physical books are custom-printed through our professional partner. While we do not offer refunds for subjective preferences, we will provide a replacement at no cost if your book arrives with significant manufacturing defects or shipping damage. To report a defect, please email us within 7 days of delivery.
                                </p>
                            </div>

                            <p className="text-gray-600 italic">
                                If you have any concerns, please contact us first at{' '}
                                <a href="mailto:hello@juvilabs.com" className="text-primary hover:underline">
                                    hello@juvilabs.com
                                </a>{' '}
                                so we can resolve the issue promptly.
                            </p>
                        </div>
                    </section>


                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">7. Intellectual Property</h2>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                You retain all rights to photos you upload
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                The illustrations and story content remain the intellectual property of Juvi Labs LLC
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                You may not resell, redistribute, or use the content for commercial purposes
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">8. User Conduct</h2>
                        <p className="text-gray-600 mb-3">You agree not to:</p>
                        <ul className="space-y-2 text-gray-600">
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Upload photos without parental consent
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Use the service for any unlawful or harmful activity
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Upload offensive, inappropriate, or infringing content
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                Attempt to reverse-engineer or copy our AI technology
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">9. Limitation of Liability</h2>
                        <p className="text-gray-600">
                            To the maximum extent permitted by law, Juvi Labs LLC is not liable for any indirect, incidental, or consequential damages arising from use of our service. Our total liability for any claim is limited to the amount you paid for the specific storybook in question.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-heading text-gray-900 mb-4">10. Contact Us</h2>
                        <p className="text-gray-600">
                            If you have any questions about these Terms, email us at{' '}
                            <a href="mailto:hello@juvilabs.com" className="text-primary hover:underline">
                                hello@juvilabs.com
                            </a>
                        </p>
                    </section>

                    <div className="pt-6 border-t border-gray-100 space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-2">Key Points</h3>
                            <ul className="space-y-1 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    <strong>Refunds:</strong> See our <Link to="/refund-policy" className="text-primary hover:underline">Refund Policy</Link> for full details
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    <strong>Content Rights:</strong> AI-generated content is licensed for personal use only
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    <strong>Parental Consent:</strong> You must be 18+ and parent/guardian of the child
                                </li>
                            </ul>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-500">
                                <strong>Last updated:</strong> March 2026
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Operated by Juvi Labs LLC
                            </p>
                        </div>

                        <div className="text-center pt-4">
                            <p className="text-sm text-gray-600">
                                By using EverGift's services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
