import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

// Custom, Premium SVG Icons for Brand Authenticity & 100% Compiler Safety (With responsive class support)
const SlackIcon = ({ className = "w-7 h-7" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.062 12a1.735 1.735 0 0 1 1.732-1.731h1.73v1.731a1.735 1.735 0 0 1-1.73 1.731H5.062A1.735 1.735 0 0 1 5.062 12zm4.33 0V8.54a1.735 1.735 0 0 1 1.73-1.731h1.732a1.735 1.735 0 0 1 1.731 1.73V12a1.735 1.735 0 0 1-1.73 1.731H11.12A1.735 1.735 0 0 1 9.392 12z" fill="#E01E5A"/>
    <path d="M12 5.062a1.735 1.735 0 0 1 1.73-1.731h1.732a1.735 1.735 0 0 1 1.73 1.73v1.731a1.735 1.735 0 0 1-1.73 1.731h-1.732a1.735 1.735 0 0 1-1.73-1.73V5.062zm0 4.33V12a1.735 1.735 0 0 1-1.73 1.731H8.54A1.735 1.735 0 0 1 6.808 12V10.27a1.735 1.735 0 0 1 1.731-1.73H12a1.735 1.735 0 0 1 0 1.73z" fill="#36C5F0"/>
    <path d="M18.938 12a1.735 1.735 0 0 1-1.73 1.731h-1.732V12a1.735 1.735 0 0 1 1.732-1.731h1.73a1.735 1.735 0 0 1 1.73 1.731zm-4.33 0v3.462a1.735 1.735 0 0 1-1.732 1.73h-1.73a1.735 1.735 0 0 1-1.731-1.73V12a1.735 1.735 0 0 1 1.73-1.731h1.732a1.735 1.735 0 0 1 1.731 1.73z" fill="#2EB67D"/>
    <path d="M12 18.938a1.735 1.735 0 0 1-1.73 1.73h-1.732a1.735 1.735 0 0 1-1.73-1.73v-1.732a1.735 1.735 0 0 1 1.73-1.731h1.732a1.735 1.735 0 0 1 1.73 1.731v1.732zm0-4.33V12a1.735 1.735 0 0 1 1.73-1.731h3.462a1.735 1.735 0 0 1 1.73 1.731v1.73a1.735 1.735 0 0 1-1.73 1.73H12a1.735 1.735 0 0 1 0-1.73z" fill="#ECB22E"/>
  </svg>
);

const DriveIcon = ({ className = "w-7 h-7" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.5 4H15.5L22 15H15L8.5 4Z" fill="#FFB11A" />
    <path d="M15.5 15H3.5L5.5 11.5L8.5 15H15.5Z" fill="#34A853" />
    <path d="M8.5 4L2 15L5.5 20L12 9L8.5 4Z" fill="#4285F4" />
  </svg>
);

const ExcelIcon = ({ className = "w-7 h-7" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="4" fill="#107C41" />
    <path d="M8 8L16 16M16 8L8 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const GmailIcon = ({ className = "w-7 h-7" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" fill="#EA4335" opacity="0.1" />
    <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V7.5L12 13.5L22 7.5V6Z" fill="#EA4335" />
    <path d="M2 7.5V18C2 19.1 2.9 20 4 20H7V10.5L2 7.5Z" fill="#C5221F" />
    <path d="M22 7.5V18C22 19.1 21.1 20 20 20H17V10.5L22 7.5Z" fill="#C5221F" />
    <path d="M7 20H17V10.5L12 13.5L7 20Z" fill="#EA4335" />
  </svg>
);

const CalendarIcon = ({ className = "w-7 h-7" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="17" rx="3.5" fill="#4285F4" />
    <rect x="3" y="4" width="18" height="5" fill="#1A73E8" />
    <circle cx="7" cy="6.5" r="1" fill="white" />
    <circle cx="17" cy="6.5" r="1" fill="white" />
    <text x="12" y="17" fill="white" fontSize="8.5" fontWeight="900" textAnchor="middle">31</text>
  </svg>
);

const TeamsIcon = ({ className = "w-7 h-7" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 7C3 5.9 3.9 5 5 5H14C15.1 5 16 5.9 16 7V13C16 14.1 15.1 15 14 15H5C3.9 15 3 14.1 3 13V7Z" fill="#6264A7" />
    <path d="M8 10C8 8.9 8.9 8 10 8H19C20.1 8 21 8.9 21 10V16C21 17.1 20.1 18 19 18H10C8.9 18 8 17.1 8 16V10Z" fill="#4b4b88" opacity="0.9" />
    <text x="14.5" y="15" fill="white" fontSize="8" fontWeight="bold" textAnchor="middle">T</text>
  </svg>
);

function SyncApps() {
  const [isMobile, setIsMobile] = useState(false);

  // Responsiveness tracker
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scaled coordinates mapping for a wider grid (scaled down dynamically on mobile to fit the container width)
  const scale = isMobile ? 0.55 : 1;
  const apps = [
    { id: 'slack', name: 'Slack', icon: SlackIcon, x: -240 * scale, y: -90 * scale, delay: 0 },
    { id: 'drive', name: 'Drive', icon: DriveIcon, x: 240 * scale, y: -100 * scale, delay: 0.4 },
    { id: 'excel', name: 'Excel', icon: ExcelIcon, x: 260 * scale, y: 70 * scale, delay: 0.8 },
    { id: 'gmail', name: 'Gmail', icon: GmailIcon, x: -250 * scale, y: 80 * scale, delay: 1.2 },
    { id: 'calendar', name: 'Calendar', icon: CalendarIcon, x: 10 * scale, y: -140 * scale, delay: 1.6 },
    { id: 'teams', name: 'Teams', icon: TeamsIcon, x: -10 * scale, y: 145 * scale, delay: 2.0 },
  ];

  return (
    <div className="flex flex-col items-start w-full border-t border-[#ececec] pt-8 mb-10 text-left select-none">
      <h3 className="text-[18px] font-bold text-[#111111] mb-6">Sync your apps</h3>

      {/* Responsive Diagram Container - Dynamic height */}
      <div 
        className={`w-full ${isMobile ? 'h-[280px]' : 'h-[420px]'} relative bg-[#f7f7f8]/50 rounded-3xl border border-[#ececec]/50 flex items-center justify-center overflow-hidden mb-6 shadow-inner transition-all duration-300`}
        style={{
          backgroundImage: 'radial-gradient(#e5e5e7 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        }}
      >
        
        {/* Connection Dashed Lines & Concentric Orbits (SVG) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Responsive Orbital rings */}
          <circle cx="50%" cy="50%" r={isMobile ? 50 : 90} stroke="#1769ff" strokeWidth="1" strokeDasharray="6 8" opacity="0.08" fill="none" />
          <circle cx="50%" cy="50%" r={isMobile ? 100 : 180} stroke="#1769ff" strokeWidth="1" strokeDasharray="12 16" opacity="0.05" fill="none" />
          <circle cx="50%" cy="50%" r={isMobile ? 150 : 270} stroke="#1769ff" strokeWidth="1" strokeDasharray="18 24" opacity="0.03" fill="none" />

          {/* Connection Lines */}
          {apps.map(app => (
            <line
              key={app.id}
              x1="50%"
              y1="50%"
              x2={`calc(50% + ${app.x}px)`}
              y2={`calc(50% + ${app.y}px)`}
              stroke="#1769ff"
              strokeWidth="2"
              strokeDasharray="4 6"
              opacity="0.35"
            />
          ))}
        </svg>

        {/* Center Hub: Scaled for Mobile/Desktop with responsive halo */}
        <div className="relative z-20 flex items-center justify-center">
          {/* Pulsing glow rings */}
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.4, 0.15] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className={`absolute ${isMobile ? 'w-20 h-20' : 'w-36 h-36'} rounded-full bg-[#1769ff]/10`}
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
            className={`absolute ${isMobile ? 'w-16 h-16' : 'w-28 h-28'} rounded-full bg-[#1769ff]/15`}
          />

          {/* Core Central Box */}
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className={`${isMobile ? 'w-14 h-14 rounded-xl' : 'w-20 h-20 rounded-2xl'} bg-white shadow-xl border border-[#ececec] flex items-center justify-center relative group`}
          >
            <div className={`${isMobile ? 'w-8 h-8 rounded' : 'w-12 h-12 rounded-lg'} bg-black flex items-center justify-center relative overflow-hidden shadow-md`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 via-slate-950 to-black" />
              <div className={`${isMobile ? 'w-3.5 h-3.5' : 'w-5 h-5'} bg-white absolute rotate-12 rounded-sm shadow-sm`} />
            </div>
          </motion.div>
        </div>

        {/* Floating App Icons Grid with organic float patterns */}
        {apps.map(app => {
          const Icon = app.icon;
          return (
            <motion.div
              key={app.id}
              animate={{ 
                y: [0, -10, 0],
                x: [0, 4, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 4.5 + (app.delay * 0.5), 
                delay: app.delay, 
                ease: "easeInOut" 
              }}
              style={{
                position: 'absolute',
                left: `calc(50% + ${app.x}px - ${isMobile ? 24 : 32}px)`,
                top: `calc(50% + ${app.y}px - ${isMobile ? 24 : 32}px)`,
              }}
              className="z-10 cursor-pointer group"
            >
              {/* Scaled App Bubble Container */}
              <motion.div 
                whileHover={{ y: -6, scale: 1.12 }}
                className={`${isMobile ? 'w-12 h-12 rounded-xl border border-[#ececec]' : 'w-16 h-16 rounded-2xl border border-[#ececec]/75'} bg-white shadow-md flex items-center justify-center hover:shadow-xl hover:border-[#1769ff]/35 transition-all duration-350 relative`}
              >
                {/* Glow aura on hover */}
                <div className="absolute inset-0 rounded-2xl bg-[#1769ff]/0 group-hover:bg-[#1769ff]/2 transition-colors duration-300" />
                <Icon className={isMobile ? "w-5 h-5" : "w-7 h-7"} />
                
                {/* Visual tooltip label */}
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 scale-0 group-hover:scale-100 bg-slate-900 text-white text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded shadow-md pointer-events-none transition-transform duration-200 z-30">
                  {app.name}
                </span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Synced Applications Status Footer Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#107C41] animate-pulse" />
          <p className="text-[13px] text-[#444] font-medium">
            <span className="font-bold text-[#111111]">Synced Applications:</span> Slack added 144 contacts
          </p>
        </div>
        <a 
          onClick={() => alert("Redirecting to App Integrations...")}
          className="text-[13px] font-bold text-[#1769ff] hover:underline cursor-pointer flex items-center gap-0.5"
        >
          <span>Sync more apps</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

export default SyncApps;
