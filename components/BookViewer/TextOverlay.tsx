import React from 'react';
import type { TextConfig } from '../../types/book.types';

interface TextOverlayProps {
  text: string;
  childName: string;
  config: TextConfig;
}

const TextOverlay: React.FC<TextOverlayProps> = ({ text, childName, config }) => {
  // Replace placeholder with actual name
  const processedText = text.replace(/{child_name}/g, childName);

  // Split text to highlight child's name
  const renderStyledText = () => {
    const parts = processedText.split(new RegExp(`(${childName})`, 'gi'));

    return parts.map((part, index) => {
      // Highlight child's name
      if (part.toLowerCase() === childName.toLowerCase()) {
        return (
          <span
            key={index}
            className="child-name-highlight"
            style={{
              color: config.nameColor,
              fontWeight: 700,
              background: 'linear-gradient(to bottom, rgba(254, 243, 199, 0.5), transparent)',
              padding: '0 4px',
              borderRadius: '4px',
            }}
          >
            {part}
          </span>
        );
      }

      // Handle drop cap for first letter
      if (index === 0 && config.dropCap && part.length > 0) {
        return (
          <React.Fragment key={index}>
            <span
              className="drop-cap"
              style={{
                fontSize: `${config.fontSize * 2.5}px`,
                float: 'left',
                lineHeight: 0.8,
                marginRight: '8px',
                marginTop: '-4px',
                color: config.dropCapColor || config.color,
                fontWeight: 700,
                fontFamily: 'Fredoka, sans-serif',
                textShadow: '2px 2px 0 rgba(251, 191, 36, 0.3)',
              }}
            >
              {part[0]}
            </span>
            {part.slice(1)}
          </React.Fragment>
        );
      }

      return part;
    });
  };

  return (
    <div
      className="text-overlay"
      style={{
        position: 'absolute',
        left: `${config.x}px`,
        top: `${config.y}px`,
        width: `${config.width}px`,
        maxHeight: `${config.height}px`,
        fontFamily: `${config.font}, sans-serif`,
        fontSize: `${config.fontSize}px`,
        lineHeight: config.lineHeight,
        color: config.color,
        background: config.background,
        borderRadius: `${config.borderRadius || 0}px`,
        padding: `${config.padding || 0}px`,
        textAlign: config.textAlign || 'left',
        overflow: 'hidden',
        boxShadow: config.background !== 'transparent' && config.background !== 'rgba(0,0,0,0)'
          ? '0 4px 12px rgba(0,0,0,0.08)'
          : 'none',
      }}
    >
      <p style={{ margin: 0 }}>
        {renderStyledText()}
      </p>
    </div>
  );
};

export default TextOverlay;
