/**
 * OrdersList Component
 *
 * Displays purchased orders with tracking information.
 * Used in the "Ordered" tab of MyCreations page.
 *
 * Shows:
 * - Physical book orders with shipping status and tracking
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
} from 'lucide-react';
import { getPrintOrderByPreview } from '../src/api/client';
import type { CreationItem, PrintOrderStatus } from '../src/api/client';
import OptimizedImage from './OptimizedImage';

interface OrdersListProps {
    creations: CreationItem[];
}

interface OrderWithPrintStatus extends CreationItem {
    printOrder: PrintOrderStatus | null;
    loadingPrintStatus: boolean;
}

const OrdersList: React.FC<OrdersListProps> = ({ creations }) => {
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

    return (
        <div className="space-y-4">
            {ordersWithStatus.map((order) => (
                <OrderCard key={order.preview_id} order={order} />
            ))}
        </div>
    );
};

interface OrderCardProps {
    order: OrderWithPrintStatus;
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
    const hasPhysicalOrder = order.printOrder !== null;
    const printStatus = order.printOrder?.lulu_status;

    // Determine order type and status
    const isShipped = printStatus === 'shipped';
    const isDelivered = printStatus === 'delivered';
    const isInProduction = printStatus === 'in_production';
    const isFailed = printStatus === 'failed' || printStatus === 'rejected' || printStatus === 'cancelled';

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
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <Link
                                to={`/preview/${order.preview_id}`}
                                className="font-heading text-lg text-gray-900 hover:text-primary transition-colors truncate"
                            >
                                {order.child_name}'s Story
                            </Link>
                            {getStatusBadge()}
                        </div>

                        <p className="text-sm text-gray-500 mb-3">
                            Ordered {new Date(order.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
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
                            {isShipped && order.printOrder?.tracking_number && (
                                <a
                                    href={getTrackingUrl() || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors"
                                >
                                    <Truck className="w-4 h-4" />
                                    Track Package
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>

                        {/* Tracking Details for shipped orders */}
                        {isShipped && order.printOrder && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                                    {order.printOrder.carrier && (
                                        <span className="text-gray-600">
                                            <span className="text-gray-400">Carrier:</span> {order.printOrder.carrier}
                                        </span>
                                    )}
                                    {order.printOrder.tracking_number && (
                                        <span className="text-gray-600">
                                            <span className="text-gray-400">Tracking:</span> {order.printOrder.tracking_number}
                                        </span>
                                    )}
                                    {order.printOrder.estimated_delivery && (
                                        <span className="text-gray-600">
                                            <span className="text-gray-400">Est. delivery:</span>{' '}
                                            {new Date(order.printOrder.estimated_delivery).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Error message for failed orders */}
                        {isFailed && (
                            <div className="mt-3 p-3 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-700">
                                    There was an issue with your print order. Please contact{' '}
                                    <a href="mailto:support@storygift.in" className="underline font-medium">
                                        support@storygift.in
                                    </a>{' '}
                                    for assistance.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrdersList;
