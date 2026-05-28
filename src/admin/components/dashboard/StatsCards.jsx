import React from 'react';
import { motion } from 'framer-motion';

function StatsCards() {
  const cards = [
    {
      id: 'projects',
      title: 'New projects',
      value: '84',
      comparison: 'Last month: 65',
      percentage: 39,
      color: '#6d3df5', // Purple
      trackColor: '#f2ecff',
    },
    {
      id: 'tasks',
      title: 'New tasks',
      value: '262',
      comparison: 'Last month: 180',
      percentage: 48,
      color: '#ffb11a', // Orange
      trackColor: '#fff8eb',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full border-t border-[#ececec] pt-8 mb-6 text-left">
      {cards.map(card => {
        // SVG circle dimensions
        const radius = 22;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (card.percentage / 100) * circumference;

        return (
          <motion.div
            key={card.id}
            whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}
            className="bg-white border border-[#ececec]/60 rounded-[24px] p-8 flex items-center justify-between shadow-sm relative overflow-hidden transition-all duration-300"
          >
            {/* Card Content */}
            <div className="flex flex-col">
              <span className="text-[14px] font-semibold text-[#8f8f95] uppercase tracking-wider mb-2">
                {card.title}
              </span>
              <span className="text-[44px] font-black text-[#111111] leading-none mb-2">
                {card.value}
              </span>
              <span className="text-[13px] text-[#8f8f95]">
                {card.comparison}
              </span>
            </div>

            {/* Circular Progress Ring */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke={card.trackColor}
                  strokeWidth="4.5"
                  fill="transparent"
                />
                {/* Progress Ring */}
                <motion.circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke={card.color}
                  strokeWidth="4.5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>

              {/* Text Inside Ring */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-extrabold text-[#111111]">
                  +{card.percentage}%
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default StatsCards;
