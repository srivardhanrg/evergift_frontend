import React from 'react';
import { Package, Truck, CheckCircle, Clock, ExternalLink, MapPin } from 'lucide-react';
import type { PrintOrderStatus } from '../src/api/client';

interface PrintOrderStatusCardProps {
    printOrder: PrintOrderStatus;
    childName: string;
}

// Map Lulu status to display info
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
    pending: {
        label: 'Preparing',
        color: 'text-amber-600 bg-amber-50',
        icon: <Clock className="w-5 h-5" />,
        description: 'Your book is being prepared for printing',
    },
    submitted: {
        label: 'Submitted',
        color: 'text-blue-600 bg-blue-50',
        icon: <Package className="w-5 h-5" />,
        description: 'Your order has been submitted to our print partner',
    },
    accepted: {
        label: 'Accepted',
        color: 'text-indigo-600 bg-indigo-50',
        icon: <Package className="w-5 h-5" />,
        description: 'Print order accepted and queued for production',
    },
    in_production: {
        label: 'Printing',
        color: 'text-purple-600 bg-purple-50',
        icon: <Package className="w-5 h-5" />,
        description: 'Your book is being printed right now!',
    },
    shipped: {
        label: 'Shipped',
        color: 'text-cyan-600 bg-cyan-50',
        icon: <Truck className="w-5 h-5" />,
        description: 'Your book is on its way to you!',
    },
    delivered: {
        label: 'Delivered',
        color: 'text-green-600 bg-green-50',
        icon: <CheckCircle className="w-5 h-5" />,
        description: 'Your book has been delivered!',
    },
    failed: {
        label: 'Issue',
        color: 'text-red-600 bg-red-50',
        icon: <Clock className="w-5 h-5" />,
        description: 'There was an issue with your print order. We\'re working on it.',
    },
};

const PrintOrderStatusCard: React.FC<PrintOrderStatusCardProps> = ({ printOrder, childName }) => {
    const status = printOrder.lulu_status || 'pending';
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

    // Format date for display
    const formatDate = (dateStr: string | null): string => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className={`px-4 py-3 ${config.color} flex items-center gap-3`}>
                {config.icon}
                <div>
                    <h3 className="font-semibold text-sm">Print Order: {config.label}</h3>
                    <p className="text-xs opacity-80">{childName}'s Printed Storybook</p>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Status description */}
                <p className="text-gray-600 text-sm">{config.description}</p>

                {/* Tracking info (when shipped) */}
                {(status === 'shipped' || status === 'delivered') && printOrder.tracking_number && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Tracking Number:</span>
                            <span className="font-mono font-medium">{printOrder.tracking_number}</span>
                        </div>

                        {printOrder.carrier && (
                            <div className="text-sm text-gray-600">
                                Carrier: <span className="font-medium">{printOrder.carrier}</span>
                            </div>
                        )}

                        {printOrder.tracking_url && (
                            <a
                                href={printOrder.tracking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                                Track Package
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>
                )}

                {/* Estimated delivery */}
                {printOrder.estimated_delivery && status !== 'delivered' && (
                    <div className="text-sm text-gray-600">
                        Estimated delivery: <span className="font-medium">{formatDate(printOrder.estimated_delivery)}</span>
                    </div>
                )}

                {/* Shipped date */}
                {printOrder.shipped_at && (
                    <div className="text-sm text-gray-500">
                        Shipped on {formatDate(printOrder.shipped_at)}
                    </div>
                )}

                {/* Delivered date */}
                {printOrder.delivered_at && (
                    <div className="text-sm text-green-600 font-medium">
                        Delivered on {formatDate(printOrder.delivered_at)}
                    </div>
                )}

                {/* Progress indicator for early stages */}
                {['pending', 'submitted', 'accepted', 'in_production'].includes(status) && (
                    <div className="pt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Order Progress</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-500"
                                style={{
                                    width: status === 'pending' ? '20%'
                                        : status === 'submitted' ? '40%'
                                        : status === 'accepted' ? '60%'
                                        : '80%'
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PrintOrderStatusCard;
