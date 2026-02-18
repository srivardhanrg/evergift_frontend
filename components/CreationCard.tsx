/**
 * CreationCard Component
 * 
 * Displays a single story creation in the My Creations dashboard.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Loader2, CheckCircle, AlertCircle, Download, Eye } from 'lucide-react';
import type { CreationItem } from '../src/api/client';
import OptimizedImage from './OptimizedImage';

// Theme display names and colors
const THEME_CONFIG: Record<string, { name: string; icon: string; color: string }> = {
    'storygift_enchanted_forest': { name: 'Enchanted Forest', icon: '🌳', color: 'bg-green-100 text-green-700' },
    'storygift_magic_castle': { name: 'Magic Castle', icon: '🏰', color: 'bg-purple-100 text-purple-700' },
    'storygift_spy_mission': { name: 'Spy Mission', icon: '🕵️', color: 'bg-slate-100 text-slate-700' },
};

interface CreationCardProps {
    creation: CreationItem;
}

const CreationCard: React.FC<CreationCardProps> = ({ creation }) => {
    const navigate = useNavigate();

    const themeConfig = THEME_CONFIG[creation.theme] || {
        name: creation.theme.replace(/_/g, ' ').replace('storygift ', ''),
        icon: '📚',
        color: 'bg-gray-100 text-gray-700'
    };

    const isGenerating = creation.status === 'generating' || creation.status === 'pending';
    const isFailed = creation.status === 'failed';
    const isComplete = creation.status === 'complete' || creation.status === 'ready';
    const isPaid = creation.payment_status === 'paid';

    const handleClick = () => {
        if (isGenerating && creation.job_id) {
            navigate(`/generating/${creation.job_id}`);
        } else {
            navigate(`/preview/${creation.preview_id}`);
        }
    };

    // Format expiry display
    const getExpiryText = () => {
        if (isPaid) return null; // Paid books don't expire
        if (creation.days_remaining <= 0) return 'Expires today';
        if (creation.days_remaining === 1) return '1 day left';
        return `${creation.days_remaining} days left`;
    };

    return (
        <div
            onClick={handleClick}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer group hover:shadow-lg hover:border-primary/20 transition-all duration-300"
        >
            {/* Cover Image */}
            <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-50 relative overflow-hidden">
                {creation.cover_url ? (
                    <OptimizedImage
                        src={creation.cover_url}
                        alt={`${creation.child_name}'s story`}
                        aspectRatio="4/3"
                        className="group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl opacity-50">
                        {themeConfig.icon}
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                    {isPaid ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-500 text-white flex items-center gap-1 shadow-sm">
                            <CheckCircle className="w-3 h-3" />
                            PAID
                        </span>
                    ) : isGenerating ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-white flex items-center gap-1 shadow-sm">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Creating...
                        </span>
                    ) : isFailed ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500 text-white flex items-center gap-1 shadow-sm">
                            <AlertCircle className="w-3 h-3" />
                            Failed
                        </span>
                    ) : isComplete && !isPaid ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500 text-white flex items-center gap-1 shadow-sm">
                            <Eye className="w-3 h-3" />
                            Preview Ready
                        </span>
                    ) : null}
                </div>

                {/* Theme Badge */}
                <div className="absolute bottom-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${themeConfig.color} shadow-sm`}>
                        {themeConfig.icon} {themeConfig.name}
                    </span>
                </div>
            </div>

            {/* Card Content */}
            <div className="p-4">
                <h3 className="font-heading text-lg text-gray-900 truncate">
                    {creation.child_name}'s Adventure
                </h3>

                <div className="flex justify-between items-center mt-2">
                    {/* Expiry */}
                    {getExpiryText() && (
                        <div className="flex items-center text-gray-400 text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{getExpiryText()}</span>
                        </div>
                    )}

                    {isPaid && (
                        <div className="flex items-center text-green-600 text-xs font-medium">
                            <Download className="w-3 h-3 mr-1" />
                            <span>Ready to download</span>
                        </div>
                    )}
                </div>

                {/* Action hint */}
                <div className="mt-3 pt-3 border-t border-gray-50">
                    <span className="text-xs text-primary font-medium flex items-center justify-center gap-1 group-hover:gap-2 transition-all">
                        <Eye className="w-3.5 h-3.5" />
                        {isGenerating ? 'View Progress' : isPaid ? 'View & Download' : 'View Preview'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CreationCard;
