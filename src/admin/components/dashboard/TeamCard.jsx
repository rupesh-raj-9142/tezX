import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  MessageSquare, 
  Video, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

export const TEAM = [];

function TeamCard({ onSchedule, onMessage, onVideoCall }) {
  const [index, setIndex] = useState(0);

  const handleNext = () => {
    if (TEAM.length === 0) return;
    setIndex(prev => (prev + 1) % TEAM.length);
  };

  const handlePrev = () => {
    if (TEAM.length === 0) return;
    setIndex(prev => (prev - 1 + TEAM.length) % TEAM.length);
  };

  const current = TEAM[index];

  if (!current) {
    return (
      <div className="flex flex-col items-start w-full text-left">
        <h3 className="text-[18px] font-bold text-[#111111] mb-1">Your team</h3>
        <p className="text-[13px] text-[#8f8f95]">No team members configured.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start w-full text-left">
      {/* Title */}
      <h3 className="text-[18px] font-bold text-[#111111] mb-1">Your team</h3>
      <p className="text-[13px] text-[#8f8f95] leading-relaxed mb-6">
        Be aware of who is on your team and how you can contact them.
      </p>
 
      {/* Team Member Card Carousel */}
      <div className="flex items-center justify-between w-full gap-4 relative">
        {/* Left Arrow Outside Card */}
        <button 
          onClick={handlePrev}
          className="w-10 h-10 rounded-full border border-[#ececec] bg-white text-[#444] hover:text-[#1769ff] flex items-center justify-center hover:shadow-sm active:scale-95 transition-all cursor-pointer flex-shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
 
        {/* Centered Blue Card */}
        <div className="flex-grow max-w-[280px] h-[340px] bg-gradient-to-br from-[#1769ff] to-[#0054e6] rounded-[28px] p-6 shadow-xl shadow-[#1769ff]/15 flex flex-col justify-between items-center text-center relative overflow-hidden group select-none">
          {/* Layered Floating Bottom Shapes */}
          <div className="absolute -bottom-10 -right-10 w-28 h-28 rounded-full bg-white/10 blur-sm pointer-events-none group-hover:scale-110 transition-transform duration-500" />
          <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-white/5 blur-sm pointer-events-none" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center flex-grow justify-between w-full h-full"
            >
              {/* 3D Memoji Avatar */}
              <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 border-4 border-white/30 shadow-lg relative group-hover:rotate-3 transition-transform duration-300 mt-4 flex items-center justify-center">
                <img 
                  src={current.avatar} 
                  alt={current.name} 
                  className="w-full h-full object-cover rounded-full" 
                />
              </div>
 
              {/* Identity info */}
              <div className="mt-4 flex flex-col items-center">
                <h4 className="text-[20px] font-extrabold text-white leading-tight">
                  {current.name}
                </h4>
                <p className="text-[12px] text-white/70 font-semibold mt-1">
                  {current.role}
                </p>
              </div>
 
              {/* Bottom Quick Action Icons */}
              <div className="flex items-center gap-3 mt-6 mb-2">
                <button 
                  onClick={() => onSchedule?.(current)}
                  className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Calendar Schedule"
                >
                  <Calendar className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onMessage?.(current)}
                  className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Chat Message"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onVideoCall?.(current)}
                  className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Video Call"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Arrow Outside Card */}
        <button 
          onClick={handleNext}
          className="w-10 h-10 rounded-full border border-[#ececec] bg-white text-[#444] hover:text-[#1769ff] flex items-center justify-center hover:shadow-sm active:scale-95 transition-all cursor-pointer flex-shrink-0"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default TeamCard;
