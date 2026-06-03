import React from 'react';
import { Search, X } from 'lucide-react';

function SearchBar({ value = '', onChange }) {
  return (
    <div className="relative w-full max-w-[720px] h-12">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8f8f95] w-5 h-5 pointer-events-none" />
      <input
        type="text"
        placeholder="Search..."
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="w-full h-full pl-12 pr-12 bg-[#f5f5f6] border-none rounded-full font-body-sm text-body-sm text-[#111111] placeholder-[#8f8f95] outline-none focus:bg-[#ebebed] focus:ring-2 focus:ring-[#1769ff]/15 transition-all duration-200"
      />
      {value && onChange && (
        <button
          onClick={() => onChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#8f8f95] hover:bg-black/5 hover:text-black transition-all cursor-pointer active:scale-90 flex items-center justify-center"
          title="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
