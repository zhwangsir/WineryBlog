import React from 'react';

interface WaveProps {
  className?: string;
  flip?: boolean;
}

export const Wave: React.FC<WaveProps> = ({ className = '', flip = false }) => {
  return (
    <div className={`absolute left-0 right-0 ${flip ? 'bottom-0' : 'top-0'} ${className}`}>
      <svg
        viewBox="0 0 1440 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-[60px] md:h-[80px] ${flip ? 'rotate-180' : ''}`}
        preserveAspectRatio="none"
      >
        <path
          d="M0 120C240 120 240 0 480 0C720 0 720 120 960 120C1200 120 1200 0 1440 0V120H0Z"
          fill="currentColor"
          className="text-bg-base"
        />
      </svg>
      <svg
        viewBox="0 0 1440 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-[60px] md:h-[80px] -mt-[1px] ${flip ? 'rotate-180' : ''}`}
        preserveAspectRatio="none"
      >
        <path
          d="M0 120C240 120 240 80 480 80C720 80 720 120 960 120C1200 120 1200 80 1440 80V120H0Z"
          fill="currentColor"
          className="text-bg-base/80"
        />
      </svg>
    </div>
  );
};
