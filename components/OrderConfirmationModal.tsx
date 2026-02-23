/**
 * OrderConfirmationModal Component
 *
 * Displays a success modal after payment confirming the order.
 * For physical book orders, provides a link to track the order in My Creations > Ordered tab.
 * For digital orders, shows download confirmation.
 */

import React from 'react';
import { X, CheckCircle, Package, Download, ArrowRight, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type OrderType = 'digital' | 'physical';

interface OrderConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderType: OrderType;
    childName?: string;
    orderId?: string;
}

const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
    isOpen,
    onClose,
    orderType,
    childName = 'Your child',
    orderId,
}) => {
    const navigate = useNavigate();

    // Handle Escape key to close modal
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleTrackOrder = () => {
        onClose();
        // Navigate to My Creations with Ordered tab active
        navigate('/my-creations?tab=ordered');
    };

    const handleContinueBrowsing = () => {
        onClose();
    };

    const isPhysical = orderType === 'physical';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Success Icon */}
                <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                        <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-heading text-center text-gray-800 mb-2">
                    Order Confirmed!
                </h2>

                {/* Subtitle */}
                <p className="text-gray-600 text-center mb-4">
                    {isPhysical ? (
                        <>
                            <strong>{childName}'s</strong> magical storybook is being prepared for printing and will be shipped to you soon!
                        </>
                    ) : (
                        <>
                            <strong>{childName}'s</strong> magical storybook is ready! Your high-resolution PDF is being generated.
                        </>
                    )}
                </p>

                {/* Order Info Box */}
                {isPhysical && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <Package className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">Physical Book Order</p>
                                {orderId && (
                                    <p className="text-sm text-gray-500">Order #{orderId.slice(-8)}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Truck className="w-4 h-4" />
                            <span>You'll receive tracking info via email once shipped</span>
                        </div>
                    </div>
                )}

                {!isPhysical && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <Download className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800">Digital Download</p>
                                <p className="text-sm text-gray-500">PDF will be ready shortly</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                    {isPhysical && (
                        <button
                            onClick={handleTrackOrder}
                            className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                            <Package className="w-5 h-5" />
                            Track Your Order
                            <ArrowRight className="w-4 h-4 ml-auto" />
                        </button>
                    )}

                    <button
                        onClick={handleContinueBrowsing}
                        className={`w-full py-3 px-4 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                            isPhysical
                                ? 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-primary/50'
                                : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30'
                        }`}
                    >
                        {isPhysical ? 'Continue Browsing' : 'Got it!'}
                    </button>
                </div>

                {/* Footer note */}
                <p className="text-center text-xs text-gray-400 mt-4">
                    {isPhysical
                        ? 'You can track your order anytime in My Creations > Ordered'
                        : 'Check your email for download link'}
                </p>
            </div>
        </div>
    );
};

export default OrderConfirmationModal;
