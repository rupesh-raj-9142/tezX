import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

function HeroSection({ onAddLead }) {
  return (
    <section className="flex flex-col items-start text-left mb-10">
      {/* Large Bold Heading */}
      <h1 className="text-[52px] xl:text-[64px] font-extrabold text-[#111111] leading-[1.08] tracking-[-0.03em] mb-4">
        All your business <br />
        <span className="text-[#1769ff]">on one platform.</span>
      </h1>

      {/* Subtitle */}
      <p className="text-[18px] xl:text-[20px] text-[#8f8f95] max-w-[600px] leading-relaxed mb-8">
        Simple, efficient, yet <span className="text-[#1769ff] font-bold">affordable!</span>
      </p>

      {/* Primary CTA Button */}
      <motion.button
        whileHover={{ scale: 1.03, backgroundColor: '#0054e6' }}
        whileTap={{ scale: 0.98 }}
        onClick={onAddLead}
        className="flex items-center gap-2 bg-[#1769ff] px-7 py-4 rounded-full font-semibold text-white text-[15px] shadow-lg shadow-[#1769ff]/15 transition-colors duration-200 cursor-pointer"
      >
        <Plus className="w-5 h-5" />
        <span>Add new project</span>
      </motion.button>
    </section>
  );
}

export default HeroSection;
