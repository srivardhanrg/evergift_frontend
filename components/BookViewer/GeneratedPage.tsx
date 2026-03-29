import React, { useState, useRef, useEffect } from 'react';
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
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Handle cached images: onLoad won't fire if browser already has the image
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  return (
    <div
      className="generated-page"
      style={{
        position: 'relative',
        width: '100%',
        background: '#ffffff',
      }}
    >
      {/* Skeleton placeholder while image loads */}
      {!loaded && (
        <div
          style={{ position: 'absolute', inset: 0 }}
          className="animate-pulse bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50"
        />
      )}

      {/* Generated illustration */}
      <img
        ref={imgRef}
        src={imageUrl}
        alt={`Page ${pageNumber} illustration`}
        style={{
          display: 'block',
          width: '100%',
          transition: 'opacity 0.25s ease-out',
          opacity: loaded ? 1 : 0,
        }}
        loading={pageNumber <= 4 ? 'eager' : 'lazy'}
        // @ts-ignore
        fetchpriority={pageNumber <= 2 ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
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
