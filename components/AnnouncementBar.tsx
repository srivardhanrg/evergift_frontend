import React, { useState, useEffect } from 'react';

const MESSAGES = [
  "🚚 Printed books delivered across the US, UK, Canada, UAE & 50+ countries",
  "⚡ Instant story preview starring your child",
  "🎁 A magical gift kids will remember for years",
  "🔒 Photos processed securely and never shared"
];

const AnnouncementBar: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (isPaused) return;

    const intervalId = setInterval(() => {
      // Start fade out
      setFade(false);

      // Wait for fade out to complete before changing text
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % MESSAGES.length);
        // Fade back in
        setFade(true);
      }, 500); // 500ms transition time matching CSS duration
      
    }, 10000); // Rotate every 10 seconds

    return () => clearInterval(intervalId);
  }, [isPaused]);

  return (
    <div 
      className="bg-primary text-white w-full min-h-[32px] md:min-h-[36px] flex items-center justify-center px-4 py-1.5 z-50 relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Announcements"
    >
      <div 
        className={`text-sm text-center transition-opacity duration-500 ease-in-out ${fade ? 'opacity-100' : 'opacity-0'}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {MESSAGES[currentIndex]}
      </div>
    </div>
  );
};

export default AnnouncementBar;
