import React from 'react';
import WatermarkOverlay from './WatermarkOverlay';

interface GeneratedPageProps {
  pageNumber: number;
  imageUrl: string;
  showWatermark: boolean;
}

const GeneratedPage: React.FC<GeneratedPageProps> = ({
  pageNumber,
  imageUrl,
  showWatermark,
}) => {
  return (
    <div
      className="generated-page"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#ffffff',
      }}
    >
      {/* Generated illustration */}
      <img
        src={imageUrl}
        alt={`Page ${pageNumber} illustration`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        loading={pageNumber <= 4 ? 'eager' : 'lazy'}
      />

      {/* Watermark overlay */}
      <WatermarkOverlay show={showWatermark} />

      {/* Page number - left side for even pages */}
      <span
        className="page-number"
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '16px',
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

export default GeneratedPage;
