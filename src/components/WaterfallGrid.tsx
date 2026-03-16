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
  minColumnWidth = 280,
  maxColumns = 3
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(1);

  useEffect(() => {
    const updateColumns = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // Calculate how many columns can fit
        const columns = Math.max(1, Math.min(maxColumns, Math.floor((containerWidth + gap) / (minColumnWidth + gap))));
        setColumnCount(columns);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [gap, minColumnWidth, maxColumns]);

  const childrenArray = React.Children.toArray(children);
  
  // Distribute items to columns in round-robin fashion for masonry effect
  const columns: ReactNode[][] = Array.from({ length: columnCount }, () => []);
  childrenArray.forEach((child, index) => {
    const columnIndex = index % columnCount;
    columns[columnIndex].push(child);
  });

  return (
    <div 
      ref={containerRef}
      className="flex gap-6"
      style={{ contain: 'layout paint' }}
    >
      {columns.map((columnItems, columnIndex) => (
        <div 
          key={columnIndex}
          className="flex-1 flex flex-col gap-6"
        >
          {columnItems.map((child, itemIndex) => (
            <div key={itemIndex}>
              {child}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
