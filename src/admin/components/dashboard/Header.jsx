import React from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import SearchBar from './SearchBar';

function Header({ adminProfile = {}, onOpenProfile }) {
  const initials = adminProfile.name
    ? adminProfile.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AD';

  return (
    <header className="flex justify-between items-center w-full h-[88px] border-b border-[#ececec] px-10 bg-white">
      {/* Search Bar */}
      <SearchBar />

      {/* Right top Actions */}
      <div className="flex items-center gap-6">
        {/* Notification Bell */}
        <button className="relative p-2.5 rounded-full hover:bg-[#f5f5f6] text-[#444] hover:text-[#1769ff] transition-colors duration-200">
          <Bell className="w-[22px] h-[22px]" />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#1769ff] rounded-full border-2 border-white" />
        </button>

        {/* Profile Section */}
        <div 
          onClick={onOpenProfile}
          className="flex items-center gap-3.5 pl-4 border-l border-[#ececec] cursor-pointer group"
        >
          {adminProfile.avatar ? (
            <img
              src={adminProfile.avatar}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover border border-[#ececec] group-hover:brightness-95 transition-all"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#e2dfff] text-[#3323cc] flex items-center justify-center font-bold text-[12px] group-hover:brightness-95 transition-all">
              {initials}
            </div>
          )}
          
          <div className="flex flex-col text-left">
            <span className="font-label-md text-[14px] font-bold text-[#111111] group-hover:text-[#1769ff] transition-colors leading-tight">
              {adminProfile.name || 'Alex'}
            </span>
            <span className="text-[11px] text-[#8f8f95] font-normal tracking-wide">
              alex@gmail.com
            </span>
          </div>
          
          <ChevronDown className="w-4 h-4 text-[#8f8f95] group-hover:text-[#111111] transition-colors duration-200 ml-1" />
        </div>
      </div>
    </header>
  );
}

export default Header;
