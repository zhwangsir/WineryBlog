import React, { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface WaterfallGridProps {
  children: ReactNode;
  gap?: number;
  minColumnWidth?: number;
  maxColumns?: number;
}

export const WaterfallGrid: React.FC<WaterfallGridProps> = ({ 
  children, 
  gap = 24,
  minColumnWidth = 320,
  maxColumns = 3
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(1);

  useEffect(() => {
    const updateColumns = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const columns = Math.max(1, Math.min(maxColumns, Math.floor((containerWidth + gap) / (minColumnWidth + gap))));
        setColumnCount(columns);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [gap, minColumnWidth, maxColumns]);

  const childrenArray = React.Children.toArray(children);

  return (
    <div 
      ref={containerRef}
      className="flex gap-6"
      style={{ 
        contain: 'layout paint'
      }}
    >
      {Array.from({ length: columnCount }).map((_, columnIndex) => (
        <div 
          key={columnIndex}
          className="flex-1 flex flex-col gap-6"
        >
          {childrenArray
            .filter((_, index) => index % columnCount === columnIndex)
            .map((child, index) => (
              <div key={index}>
                {child}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
};
