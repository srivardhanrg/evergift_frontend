import React from 'react';
import {
    Package, Truck, CheckCircle, Clock, ExternalLink,
    MapPin, AlertTriangle, Printer, Home
} from 'lucide-react';
import type { PrintOrderStatus } from '../src/api/client';

interface PrintOrderStatusCardProps {
    printOrder: PrintOrderStatus;
    childName: string;
}

// ============================================================
// STATUS CONFIG — Per-status headline + sub-message
// No third-party branding in user-facing text
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
        subMessage: 'Thank you for choosing EverGift ❤️',
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
// Maps multiple Lulu statuses to a single visual step
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

const PrintOrderStatusCard: React.FC<PrintOrderStatusCardProps> = ({ printOrder, childName }) => {
    const status = printOrder.lulu_status || 'pending';
    const isError = ERROR_STATUSES.includes(status);
    const activeStep = getActiveStep(status);
    const messages = STATUS_MESSAGES[status] || STATUS_MESSAGES.submitted;

    const hasTracking = !!(printOrder.tracking_url || printOrder.tracking_number);
    const isShippedOrDelivered = status === 'shipped' || status === 'delivered';
    const isPreShip = ['pending', 'submitted', 'accepted', 'in_production'].includes(status);

    // Format date for display
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

    return (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">

            {/* ── Header ── */}
            <div className="px-5 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm">{childName}'s Printed Storybook</h3>
                        <p className="text-xs text-gray-500">8.5 × 8.5" Premium Glossy · 10 pages</p>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-5">

                {/* ── Error state ── */}
                {isError ? (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-red-700 text-sm">{messages.headline}</p>
                            <p className="text-xs text-red-600 mt-1">{messages.subMessage}</p>
                            <p className="text-xs text-gray-500 mt-2">
                                Email us at <span className="font-medium">support@evergift.in</span>
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ── Status message ── */}
                        <div>
                            <p className="font-semibold text-gray-800 text-sm leading-snug">
                                {status === 'delivered'
                                    ? `🎁 Delivered! We hope ${childName} loves every page.`
                                    : messages.headline}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{messages.subMessage}</p>
                        </div>

                        {/* ── 4-Step Visual Stepper ── */}
                        <div className="pt-1">
                            <div className="flex items-start justify-between relative">
                                {/* Connecting line behind steps */}
                                <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100 z-0" />
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
                                                ${isActive && status === 'in_production'
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

                        {/* ── Tracking CTA ── */}
                        {isShippedOrDelivered && (
                            <div className="space-y-3">
                                {printOrder.tracking_url ? (
                                    <a
                                        href={printOrder.tracking_url}
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
                                {printOrder.tracking_number && (
                                    <div className="bg-gray-50 rounded-lg px-4 py-3 flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span>Tracking Number:
                                                <span className="font-mono font-semibold text-gray-700 ml-1">
                                                    {printOrder.tracking_number}
                                                </span>
                                            </span>
                                        </div>
                                        {printOrder.carrier && (
                                            <p className="text-xs text-gray-500 pl-5">
                                                Carrier: <span className="font-medium text-gray-700">{printOrder.carrier}</span>
                                            </p>
                                        )}
                                        {printOrder.shipped_at && (
                                            <p className="text-xs text-gray-500 pl-5">
                                                Shipped on <span className="font-medium text-gray-700">{formatDate(printOrder.shipped_at)}</span>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── "Email coming" message — pre-ship ── */}
                        {isPreShip && (
                            <div className="flex gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                <Truck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    We'll email you a tracking link the moment your book ships.
                                </p>
                            </div>
                        )}

                        {/* ── Timeline / Delivery info ── */}
                        {status === 'delivered' && printOrder.delivered_at ? (
                            <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                                <CheckCircle className="w-4 h-4" />
                                <span>Delivered on {formatDate(printOrder.delivered_at)}</span>
                            </div>
                        ) : status === 'shipped' && printOrder.estimated_delivery ? (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span>Estimated delivery: <span className="font-semibold text-gray-800">{formatDate(printOrder.estimated_delivery)}</span></span>
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
                                {printOrder.created_at && (
                                    <p className="text-xs text-gray-400 pt-1">
                                        Order placed: {formatDate(printOrder.created_at)}
                                    </p>
                                )}
                            </div>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
};

export default PrintOrderStatusCard;
