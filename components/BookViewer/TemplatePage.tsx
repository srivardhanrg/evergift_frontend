import React from 'react';
import TextOverlay from './TextOverlay';
import WatermarkOverlay from './WatermarkOverlay';
import { getPlaceholderBackground } from '../../constants/bookViewer.constants';
import type { TextConfig } from '../../types/book.types';

interface TemplatePageProps {
  pageNumber: number;
  templateUrl?: string;
  storyText?: string;
  textConfig?: TextConfig;
  childName: string;
  showWatermark: boolean;
}

const TemplatePage: React.FC<TemplatePageProps> = ({
  pageNumber,
  templateUrl,
  storyText,
  textConfig,
  childName,
  showWatermark,
}) => {
  // Use placeholder background color if no template URL
  const backgroundColor = templateUrl ? 'transparent' : getPlaceholderBackground(pageNumber);

  return (
    <div
      className="template-page"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor,
      }}
    >
      {/* Background template image (if URL provided) */}
      {templateUrl && (
        <img
          src={templateUrl}
          alt={`Page ${pageNumber}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          loading={pageNumber <= 4 ? 'eager' : 'lazy'}
        />
      )}

      {/* Decorative pattern for placeholder pages */}
      {!templateUrl && pageNumber !== 22 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(251, 191, 36, 0.1) 0%, transparent 50%),
                             radial-gradient(circle at 80% 80%, rgba(124, 58, 237, 0.08) 0%, transparent 50%)`,
          }}
        />
      )}

      {/* Text overlay */}
      {storyText && textConfig && (
        <TextOverlay
          text={storyText}
          childName={childName}
          config={textConfig}
        />
      )}

      {/* Watermark overlay */}
      <WatermarkOverlay show={showWatermark} />

      {/* Page number - right side for odd pages */}
      <span
        className="page-number"
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '16px',
          fontSize: '12px',
          color: '#999',
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 500,
        }}
      >
        {pageNumber}
      </span>
    </div>
  );
};

export default TemplatePage;
