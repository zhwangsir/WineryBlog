import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Get first day of month and total days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Get days from previous month
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();
  
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  // Generate calendar days
  const days = [];
  
  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      isToday: false
    });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      isToday: isCurrentMonth && i === todayDate
    });
  }
  
  // Next month days to fill grid
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      day: i,
      isCurrentMonth: false,
      isToday: false
    });
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-bg-card rounded-xl p-5 border border-border/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-bg-base transition-colors text-text-secondary hover:text-text-primary"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-bold text-text-primary">
          {year}年 {monthNames[month]}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-bg-base transition-colors text-text-secondary hover:text-text-primary"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-text-muted py-1"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((dayInfo, index) => (
          <div
            key={index}
            className={`
              aspect-square flex items-center justify-center text-sm rounded-lg transition-colors
              ${dayInfo.isCurrentMonth 
                ? 'text-text-primary hover:bg-bg-base cursor-pointer' 
                : 'text-text-muted/50'
              }
              ${dayInfo.isToday 
                ? 'bg-accent text-white hover:bg-accent-hover' 
                : ''
              }
            `}
          >
            {dayInfo.day}
          </div>
        ))}
      </div>
    </motion.div>
  );
};
