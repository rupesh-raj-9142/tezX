import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  MessageSquare, 
  Video, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

export const TEAM = [
  {
    id: 'anna',
    name: 'Anna Miller',
    role: 'Project Manager',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4jiBpvENPiPg3T7ITZSENAEK64IEngryxGUx1sLrg8zhLE2eOoOtRwOhvzTuMUy3zqR-6uNuBA5ZXuKxRSv8uppkqwmRORvq1N9tU132kBHqhlTJQf7LU7MhNh6wFoU9x_1grM2u5ORjvcerg9XfHcLlGHYUKdFZWsA7DIeQzN38ZFKveLgGAX5w688482GxxR3ID2zSjwx1s0ZNipPIOluHsU_zLi0XPlR1hzNvAhPeUTp-hRvFG2jT6j5pg1UdcZ1SCLDNKLmYm',
  },
  {
    id: 'marcus',
    name: 'Marcus Thorne',
    role: 'CTO @ NexGen',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnLxCc6nfziOngNuk9gHus68n-756YuA9HQNEliWVgIM9bDTabn3BqbSPt6Xk5IU9de-zp_kQcS0zuJUYe-sRLLJPpGDTZlVbkK7yQ_P_gzon5L2Es7cYkneWDMeMgsw6EGVqw3y6a3t8DLPiXH9JLjuFYoQ13JhFEH0LUMr_YOUdx71ZsbqdCT4_qgUppP-h_66--WKTKWxqvtlzbCMJyGjQ6pmg96THL4FvPf_FYjng8tN_l-nn0r-YxdiFO7fOQIaz7K39Vf1gt',
  },
  {
    id: 'clara',
    name: 'Clara Vance',
    role: 'Lead UX Designer',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfvJNAxrnO4-6Paj9VZlXxrzbqP58BqsssbIv4D6hIS4mGdVC8z8SXhB4WOqrWN6mTxoP0FXlUvKKj6NXtwKZCL_0kR2vflE_U8HFj1gB2NW5cPxryl8eqikPaBWjj1OIMdZ6V8dc74KPjqBAoF6Vazewp5qc1IGm0sl4ANBfJiOwejZWkPjdhNWPldO_FuD43QmXQ-WDwMavuBy8u3Ixm65WYmf3crvpdi_cTKJx5oiEvIjiLl9_L3INQtQtUGROgV0h9d0_g_M9P',
  },
];

function TeamCard({ onSchedule, onMessage, onVideoCall }) {
  const [index, setIndex] = useState(0);

  const handleNext = () => {
    setIndex(prev => (prev + 1) % TEAM.length);
  };

  const handlePrev = () => {
    setIndex(prev => (prev - 1 + TEAM.length) % TEAM.length);
  };

  const current = TEAM[index];

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
