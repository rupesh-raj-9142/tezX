import React, { useState, useEffect, useRef } from 'react';
import { Bell, ChevronDown, Menu, Check, Trash2, Mail, Users, Calendar, ShieldCheck } from 'lucide-react';
import SearchBar from './SearchBar';

function Header({ adminProfile = {}, onOpenProfile, onToggleSidebar, searchTerm, setSearchTerm }) {
  const initials = adminProfile.name
    ? adminProfile.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AD';

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'lead',
      title: 'New Lead Opportunity',
      message: 'NexGen Automation scope is under review.',
      time: 'Just now',
      unread: true,
      icon: Users,
      color: 'bg-primary/10 text-primary'
    },
    {
      id: 2,
      type: 'email',
      title: 'Email Campaign Sync',
      message: 'Slack synced 144 contacts & processed inbound hooks.',
      time: '12 mins ago',
      unread: true,
      icon: Mail,
      color: 'bg-[#107c41]/10 text-[#107c41]'
    },
    {
      id: 3,
      type: 'meeting',
      title: 'Meeting Scheduled',
      message: 'Sync Discovery call set with Clara (CTO @ NexGen).',
      time: '1 hour ago',
      unread: false,
      icon: Calendar,
      color: 'bg-tertiary/10 text-tertiary'
    },
    {
      id: 4,
      type: 'system',
      title: 'Database Synchronized',
      message: 'Supabase Postgres connection fully optimized (0.8ms latency).',
      time: '4 hours ago',
      unread: false,
      icon: ShieldCheck,
      color: 'bg-secondary/10 text-secondary'
    }
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const toggleRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: !n.unread } : n));
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <header className="flex justify-between items-center w-full h-[88px] border-b border-[#ececec] px-4 md:px-10 bg-white">
      {/* Search Bar & Mobile Hamburger Toggle */}
      <div className="flex items-center gap-3 flex-grow w-full md:max-w-[720px]">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-full hover:bg-[#f5f5f6] text-[#444] hover:text-[#1769ff] transition-all cursor-pointer active:scale-95 mr-1"
          title="Toggle Sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
      </div>

      {/* Right top Actions */}
      <div className="flex items-center gap-6 relative" ref={dropdownRef}>
        {/* Notification Bell */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-2.5 rounded-full hover:bg-[#f5f5f6] transition-colors duration-200 border-none bg-transparent cursor-pointer ${isOpen ? 'bg-[#f5f5f6] text-[#1769ff]' : 'text-[#444] hover:text-[#1769ff]'}`}
        >
          <Bell className="w-[22px] h-[22px]" />
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#1769ff] rounded-full border-2 border-white animate-pulse" />
          )}
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute right-0 top-[60px] w-[380px] bg-white border border-[#ececec] rounded-[24px] shadow-2xl z-[150] overflow-hidden flex flex-col max-h-[500px] animate-in fade-in zoom-in-95 duration-150 text-left">
            {/* Dropdown Header */}
            <div className="px-5 py-4 border-b border-[#ececec] flex items-center justify-between bg-slate-50/50 select-none flex-shrink-0">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-[15px] text-black">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="bg-[#1769ff]/10 text-[#1769ff] text-[10px] font-black px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                {notifications.length > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[11px] font-bold text-[#1769ff] hover:underline border-none bg-transparent cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button 
                    onClick={clearAll}
                    className="text-[11px] font-bold text-red-500 hover:underline border-none bg-transparent cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-grow overflow-y-auto divide-y divide-[#ececec]/60 max-h-[380px]">
              {notifications.length > 0 ? (
                notifications.map(n => {
                  const IconComponent = n.icon;
                  return (
                    <div 
                      key={n.id}
                      onClick={() => toggleRead(n.id)}
                      className={`p-4 flex items-start gap-3.5 hover:bg-[#f7f7f8]/50 transition-colors cursor-pointer group ${n.unread ? 'bg-[#1769ff]/[0.01]' : ''}`}
                    >
                      {/* Left Icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${n.color}`}>
                        <IconComponent className="w-[18px] h-[18px]" />
                      </div>

                      {/* Content */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-[12px] font-extrabold text-black block leading-tight ${n.unread ? 'font-black text-[#1769ff]' : ''}`}>
                            {n.title}
                          </span>
                          <span className="text-[10px] text-[#8f8f95] font-semibold whitespace-nowrap flex-shrink-0 mt-0.5">
                            {n.time}
                          </span>
                        </div>
                        <p className={`text-[11px] text-[#444] leading-relaxed mt-1 block truncate max-w-[230px] ${n.unread ? 'font-bold text-slate-800' : ''}`}>
                          {n.message}
                        </p>
                      </div>

                      {/* Right actions */}
                      <div className="flex flex-col items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {n.unread && (
                          <span className="w-2 h-2 rounded-full bg-[#1769ff] flex-shrink-0" />
                        )}
                        <button 
                          onClick={() => removeNotification(n.id)}
                          className="text-[#8f8f95] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-md hover:bg-red-50 border-none bg-transparent cursor-pointer"
                          title="Remove notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center text-center py-12 px-6 select-none">
                  <span className="text-3xl mb-1">🔔</span>
                  <h5 className="font-extrabold text-[#111111] text-[13px]">All Caught Up!</h5>
                  <p className="text-[11px] text-[#8f8f95] max-w-[200px] mt-1 leading-snug">No active system alerts or pipeline notifications currently pending.</p>
                </div>
              )}
            </div>
          </div>
        )}

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
          
          <div className="hidden sm:flex flex-col text-left">
            <span className="font-label-md text-[14px] font-bold text-[#111111] group-hover:text-[#1769ff] transition-colors leading-tight">
              {adminProfile.name || 'Alex'}
            </span>
            <span className="text-[11px] text-[#8f8f95] font-normal tracking-wide">
              alex@gmail.com
            </span>
          </div>
          
          <ChevronDown className="hidden sm:block w-4 h-4 text-[#8f8f95] group-hover:text-[#111111] transition-colors duration-200 ml-1" />
        </div>
      </div>
    </header>
  );
}

export default Header;
