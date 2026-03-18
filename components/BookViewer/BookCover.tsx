import React from 'react';
import { Sparkles } from 'lucide-react';

interface BookCoverProps {
  coverUrl: string;
  childName: string;
  themeTitle: string;
  onOpen: () => void;
}

const BookCover: React.FC<BookCoverProps> = ({
  coverUrl,
  childName,
  themeTitle,
  onOpen,
}) => {
  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <div
        className="relative cursor-pointer transition-all duration-300 hover:scale-105"
        onClick={onOpen}
        style={{
          perspective: '1000px',
        }}
      >
        {/* Book cover with 3D effect */}
        <div
          className="relative rounded-2xl shadow-2xl overflow-hidden"
          style={{
            width: '350px',
            height: '450px',
            transform: 'rotateY(-5deg)',
            transition: 'transform 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'rotateY(0deg) scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'rotateY(-5deg) scale(1)';
          }}
        >
          {/* Cover image */}
          <img
            src={coverUrl}
            alt={`${childName}'s ${themeTitle} Adventure`}
            className="w-full h-full object-cover"
          />

          {/* Overlay gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

          {/* Title overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-between p-8">
            {/* Top section - Theme title */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg mb-2">
                <Sparkles className="w-4 h-4 text-amber-500 fill-current" />
                <span className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  {themeTitle}
                </span>
              </div>
            </div>

            {/* Bottom section - Child's name and CTA */}
            <div className="text-center">
              <h2 className="text-4xl font-heading text-white mb-2 drop-shadow-lg">
                {childName}'s
              </h2>
              <h3 className="text-2xl font-heading text-white/90 mb-6 drop-shadow-md">
                Adventure
              </h3>

              {/* Tap to open indicator */}
              <div className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-full shadow-xl animate-bounce">
                <span className="text-sm font-bold">Tap to Open</span>
                <span className="text-lg">📖</span>
              </div>
            </div>
          </div>

          {/* Page edge effect */}
          <div
            className="absolute top-0 right-0 h-full w-2 bg-gradient-to-r from-transparent to-black/20"
          />
        </div>

        {/* Shadow beneath book */}
        <div
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-8 bg-black/10 rounded-full blur-xl"
        />
      </div>
    </div>
  );
};

export default BookCover;
