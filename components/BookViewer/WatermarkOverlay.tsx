import React from 'react';

interface WatermarkOverlayProps {
  show: boolean;
}

const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div
      className="watermark-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <span
        className="watermark-text"
        style={{
          fontSize: '48px',
          fontWeight: 800,
          color: 'rgba(200, 200, 200, 0.3)',
          transform: 'rotate(-15deg)',
          userSelect: 'none',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
          animation: 'watermarkPulse 3s ease-in-out infinite',
        }}
      >
        PREVIEW
      </span>
      <style>{`
        @keyframes watermarkPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default WatermarkOverlay;
