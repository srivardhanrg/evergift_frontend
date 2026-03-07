/**
 * OrdersList Component
 *
 * Displays purchased orders with tracking information.
 * Used in the "Ordered" tab of MyCreations page.
 *
 * Shows:
 * - Physical book orders with full status tracking (stepper, timeline, tracking)
 * - Digital purchases with download links
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Package,
    Download,
    Truck,
    CheckCircle,
    Clock,
    ExternalLink,
    BookOpen,
    AlertCircle,
    Loader2,
    Printer,
    Home,
    MapPin,
} from 'lucide-react';
import { getPrintOrderByPreview } from '../src/api/client';
import type { CreationItem, PrintOrderStatus } from '../src/api/client';
import OptimizedImage from './OptimizedImage';

interface OrdersListProps {
    creations: CreationItem[];
    /** Timestamp (Date) of last data fetch — shown as "Last updated X ago" */
    lastUpdated?: Date | null;
}

interface OrderWithPrintStatus extends CreationItem {
    printOrder: PrintOrderStatus | null;
    loadingPrintStatus: boolean;
}

const OrdersList: React.FC<OrdersListProps> = ({ creations, lastUpdated }) => {
    const [ordersWithStatus, setOrdersWithStatus] = useState<OrderWithPrintStatus[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter to only paid creations
    const paidCreations = creations.filter((c) => c.payment_status === 'paid');

    useEffect(() => {
        const loadPrintStatuses = async () => {
            setLoading(true);

            // Initialize with loading state
            const initialOrders: OrderWithPrintStatus[] = paidCreations.map((creation) => ({
                ...creation,
                printOrder: null,
                loadingPrintStatus: true,
            }));
            setOrdersWithStatus(initialOrders);

            // Fetch print order status for each paid creation
            const updatedOrders = await Promise.all(
                paidCreations.map(async (creation) => {
                    try {
                        const printOrder = await getPrintOrderByPreview(creation.preview_id);
                        return {
                            ...creation,
                            printOrder,
                            loadingPrintStatus: false,
                        };
                    } catch {
                        return {
                            ...creation,
                            printOrder: null,
                            loadingPrintStatus: false,
                        };
                    }
                })
            );

            setOrdersWithStatus(updatedOrders);
            setLoading(false);
        };

        if (paidCreations.length > 0) {
            loadPrintStatuses();
        } else {
            setLoading(false);
        }
    }, [creations]);

    // Empty state
    if (!loading && paidCreations.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-heading text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                    When you purchase a storybook, your orders will appear here with tracking information.
                </p>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
                        <div className="flex gap-4">
                            <div className="w-24 h-24 bg-gray-200 rounded-xl" />
                            <div className="flex-1 space-y-3">
                                <div className="h-5 bg-gray-200 rounded w-2/3" />
                                <div className="h-4 bg-gray-100 rounded w-1/2" />
                                <div className="h-8 bg-gray-100 rounded w-1/3" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const formatLastUpdated = () => {
        if (!lastUpdated) return null;
        const diffMs = Date.now() - lastUpdated.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        if (diffSec < 60) return 'Updated just now';
        const diffMin = Math.floor(diffSec / 60);
        return `Updated ${diffMin} min ago`;
    };

    return (
        <div className="space-y-4">
            {ordersWithStatus.map((order) => (
                <OrderCard key={order.preview_id} order={order} />
            ))}
            {lastUpdated && (
                <p className="text-center text-xs text-gray-400 pt-2">{formatLastUpdated()}</p>
            )}
        </div>
    );
};

interface OrderCardProps {
    order: OrderWithPrintStatus;
}

// ============================================================
// STATUS CONFIG — Per-status headline + sub-message
// ============================================================
const STATUS_MESSAGES: Record<string, { headline: string; subMessage: string }> = {
    pending: {
        headline: '🎉 Order confirmed! Your book is in the print queue.',
        subMessage: 'Printing typically begins within 1 hour',
    },
    submitted: {
        headline: '🎉 Order confirmed! Your book has been sent to print.',
        subMessage: 'Printing typically begins within a few hours',
    },
    accepted: {
        headline: '✅ Your book is accepted and ready for printing.',
        subMessage: "You'll be notified once printing starts",
    },
    in_production: {
        headline: '🖨️ Your book is being printed right now!',
        subMessage: 'This typically takes 2–3 business days',
    },
    shipped: {
        headline: '🚀 Your book is on its way!',
        subMessage: 'Check tracking below for the latest updates',
    },
    delivered: {
        headline: '🎁 Delivered!',
        subMessage: 'Thank you for choosing MagicTales ❤️',
    },
    failed: {
        headline: '⚠️ We hit a snag with your print order.',
        subMessage: "Our team is looking into it and will contact you shortly",
    },
    cancelled: {
        headline: 'Your order has been cancelled.',
        subMessage: 'Please contact support if you have questions',
    },
    rejected: {
        headline: '⚠️ There was an issue with your print order.',
        subMessage: "Our team is looking into it and will contact you shortly",
    },
};

// ============================================================
// STEPPER CONFIG — 4 logical steps shown to user
// ============================================================
const STEPPER_STEPS = [
    { label: 'Order Placed', icon: Package },
    { label: 'Printing', icon: Printer },
    { label: 'Shipped', icon: Truck },
    { label: 'Delivered', icon: Home },
];

/** Returns which step index (0-based) is currently active/complete */
const getActiveStep = (status: string): number => {
    if (status === 'delivered') return 3;
    if (status === 'shipped') return 2;
    if (status === 'in_production') return 1;
    // pending, submitted, accepted = step 0 done, step 1 next
    return 0;
};

/** Error statuses — hide stepper, show alert instead */
const ERROR_STATUSES = ['failed', 'cancelled', 'rejected'];

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
    const hasPhysicalOrder = order.printOrder !== null;
    const printStatus = order.printOrder?.lulu_status || 'pending';

    // Determine order type and status
    const isShipped = printStatus === 'shipped';
    const isDelivered = printStatus === 'delivered';
    const isInProduction = printStatus === 'in_production';
    const isFailed = ERROR_STATUSES.includes(printStatus);
    const isPreShip = ['pending', 'submitted', 'accepted', 'in_production'].includes(printStatus);

    // Get status messages and stepper info
    const messages = STATUS_MESSAGES[printStatus] || STATUS_MESSAGES.submitted;
    const activeStep = getActiveStep(printStatus);

    // Format date helper
    const formatDate = (dateStr: string | null | undefined): string => {
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

    const getStatusBadge = () => {
        if (!hasPhysicalOrder) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    <Download className="w-3.5 h-3.5" />
                    Digital
                </span>
            );
        }

        if (isDelivered) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Delivered
                </span>
            );
        }

        if (isShipped) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                    <Truck className="w-3.5 h-3.5" />
                    Shipped
                </span>
            );
        }

        if (isInProduction) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Printing
                </span>
            );
        }

        if (isFailed) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Issue
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
                <Clock className="w-3.5 h-3.5" />
                Processing
            </span>
        );
    };

    const getTrackingUrl = () => {
        if (order.printOrder?.tracking_url) {
            return order.printOrder.tracking_url;
        }
        if (order.printOrder?.tracking_number) {
            return `https://parcelsapp.com/en/tracking/${order.printOrder.tracking_number}`;
        }
        return null;
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            {/* Card Header - Book Info */}
            <div className="p-4 sm:p-5">
                <div className="flex gap-4">
                    {/* Book Cover Thumbnail */}
                    <Link to={`/preview/${order.preview_id}`} className="flex-shrink-0">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100">
                            {order.cover_url ? (
                                <OptimizedImage
                                    src={order.cover_url}
                                    alt={`${order.child_name}'s storybook`}
                                    aspectRatio="1/1"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen className="w-8 h-8 text-gray-300" />
                                </div>
                            )}
                        </div>
                    </Link>

                    {/* Order Details */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <Link
                                to={`/preview/${order.preview_id}`}
                                className="font-heading text-lg text-gray-900 hover:text-primary transition-colors truncate"
                            >
                                {order.child_name}'s Story
                            </Link>
                            {getStatusBadge()}
                        </div>

                        {/* Book spec for physical orders */}
                        {hasPhysicalOrder && (
                            <p className="text-xs text-gray-400 mb-2">8.5 × 8.5" Premium Glossy · 10 pages</p>
                        )}

                        <p className="text-sm text-gray-500 mb-3">
                            Ordered {formatDate(order.created_at)}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {/* View/Download button for all orders */}
                            <Link
                                to={`/preview/${order.preview_id}`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors"
                            >
                                <BookOpen className="w-4 h-4" />
                                View Story
                            </Link>

                            {/* Track button for shipped physical orders */}
                            {(isShipped || isDelivered) && order.printOrder?.tracking_url && (
                                <a
                                    href={getTrackingUrl() || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors"
                                >
                                    <Truck className="w-4 h-4" />
                                    Track Package
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Physical Order Details Section */}
            {hasPhysicalOrder && (
                <div className="border-t border-gray-100 px-4 sm:px-5 py-4 bg-gradient-to-b from-gray-50/50 to-white">
                    {/* Error state */}
                    {isFailed ? (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-700 text-sm">{messages.headline}</p>
                                <p className="text-xs text-red-600 mt-1">{messages.subMessage}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Email us at <span className="font-medium">support@storygift.in</span>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Status message */}
                            <div className="mb-4">
                                <p className="font-semibold text-gray-800 text-sm leading-snug">
                                    {isDelivered
                                        ? `🎁 Delivered! We hope ${order.child_name} loves every page.`
                                        : messages.headline}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{messages.subMessage}</p>
                            </div>

                            {/* 4-Step Visual Stepper */}
                            <div className="mb-4">
                                <div className="flex items-start justify-between relative">
                                    {/* Connecting line behind steps */}
                                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
                                    <div
                                        className="absolute top-4 left-0 h-0.5 bg-purple-500 z-0 transition-all duration-700"
                                        style={{ width: `${(activeStep / 3) * 100}%` }}
                                    />

                                    {STEPPER_STEPS.map((step, i) => {
                                        const Icon = step.icon;
                                        const isDone = i < activeStep;
                                        const isActive = i === activeStep;
                                        const isPending = i > activeStep;

                                        return (
                                            <div key={i} className="flex flex-col items-center relative z-10" style={{ width: '25%' }}>
                                                {/* Step circle */}
                                                <div className={`
                                                    w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                                    ${isDone ? 'bg-purple-500 border-purple-500' : ''}
                                                    ${isActive && printStatus === 'in_production'
                                                        ? 'bg-purple-500 border-purple-500 animate-pulse'
                                                        : isActive
                                                            ? 'bg-purple-500 border-purple-500'
                                                            : ''}
                                                    ${isPending ? 'bg-white border-gray-200' : ''}
                                                `}>
                                                    {isDone ? (
                                                        <CheckCircle className="w-4 h-4 text-white" />
                                                    ) : (
                                                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-300'}`} />
                                                    )}
                                                </div>

                                                {/* Step label */}
                                                <span className={`
                                                    text-xs mt-2 text-center leading-tight font-medium
                                                    ${isDone || isActive ? 'text-purple-700' : 'text-gray-400'}
                                                `}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Tracking CTA for shipped/delivered */}
                            {(isShipped || isDelivered) && (
                                <div className="space-y-3 mb-4">
                                    {order.printOrder?.tracking_url ? (
                                        <a
                                            href={order.printOrder.tracking_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md"
                                        >
                                            <Truck className="w-4 h-4" />
                                            <span>Track Your Package</span>
                                            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                                        </a>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-400 font-medium py-3 px-4 rounded-xl text-sm">
                                            <Clock className="w-4 h-4" />
                                            <span>Tracking info coming soon</span>
                                        </div>
                                    )}

                                    {/* Tracking number + carrier */}
                                    {order.printOrder?.tracking_number && (
                                        <div className="bg-gray-50 rounded-lg px-4 py-3 flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span>Tracking Number:
                                                    <span className="font-mono font-semibold text-gray-700 ml-1">
                                                        {order.printOrder.tracking_number}
                                                    </span>
                                                </span>
                                            </div>
                                            {order.printOrder.carrier && (
                                                <p className="text-xs text-gray-500 pl-5">
                                                    Carrier: <span className="font-medium text-gray-700">{order.printOrder.carrier}</span>
                                                </p>
                                            )}
                                            {order.printOrder.shipped_at && (
                                                <p className="text-xs text-gray-500 pl-5">
                                                    Shipped on <span className="font-medium text-gray-700">{formatDate(order.printOrder.shipped_at)}</span>
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* "Email coming" message — pre-ship */}
                            {isPreShip && !isInProduction && (
                                <div className="flex gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
                                    <Truck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-700 leading-relaxed">
                                        We'll email you a tracking link the moment your book ships.
                                    </p>
                                </div>
                            )}

                            {/* Timeline / Delivery info */}
                            {isDelivered && order.printOrder?.delivered_at ? (
                                <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Delivered on {formatDate(order.printOrder.delivered_at)}</span>
                                </div>
                            ) : isShipped && order.printOrder?.estimated_delivery ? (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span>Estimated delivery: <span className="font-semibold text-gray-800">{formatDate(order.printOrder.estimated_delivery)}</span></span>
                                </div>
                            ) : isPreShip ? (
                                <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">📅 Typical Timeline</p>
                                    <div className="space-y-1 text-xs text-gray-500">
                                        <div className="flex justify-between">
                                            <span>Printing</span>
                                            <span className="font-medium text-gray-700">2–3 business days</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Packing & dispatch</span>
                                            <span className="font-medium text-gray-700">1 business day</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Delivery after shipping</span>
                                            <span className="font-medium text-gray-700">5–7 business days</span>
                                        </div>
                                        <div className="border-t border-gray-200 pt-1.5 flex justify-between font-semibold text-gray-700">
                                            <span>Total</span>
                                            <span>~10–12 days from order</span>
                                        </div>
                                    </div>
                                    {order.printOrder?.created_at && (
                                        <p className="text-xs text-gray-400 pt-1">
                                            Order placed: {formatDate(order.printOrder.created_at)}
                                        </p>
                                    )}
                                </div>
                            ) : null}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default OrdersList;
