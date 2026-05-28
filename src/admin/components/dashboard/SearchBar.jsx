import React from 'react';
import { Search } from 'lucide-react';

function SearchBar() {
  return (
    <div className="relative w-full max-w-[480px] h-12">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8f8f95] w-5 h-5 pointer-events-none" />
      <input
        type="text"
        placeholder="Search"
        className="w-full h-full pl-12 pr-4 bg-[#f5f5f6] border-none rounded-full font-body-sm text-body-sm text-[#111111] placeholder-[#8f8f95] outline-none focus:bg-[#ebebed] focus:ring-2 focus:ring-[#1769ff]/15 transition-all duration-200"
      />
    </div>
  );
}

export default SearchBar;
