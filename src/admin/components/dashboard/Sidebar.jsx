
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Building2,
  Briefcase,
  Calendar,
  Settings,
  Globe,
  Contact
} from 'lucide-react';

function Sidebar({ activeFeature, setActiveFeature }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pipeline', label: 'Leads', icon: Users },
    { id: 'people', label: 'People', icon: UserPlus },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'scheduler', label: 'Schedule', icon: Calendar },
    { id: 'team', label: 'Team', icon: Contact },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-[280px] h-full bg-[#f7f7f8] border-r border-[#ececec] p-5 pb-6 flex flex-col justify-between flex-shrink-0">
      <div className="flex flex-col gap-5">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          {/* Black geometric cube-like logo */}
          <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center shadow-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-black" />
            <div className="w-3.5 h-3.5 bg-white absolute rotate-12 rounded-sm" />
          </div>
          <span className="text-[36px] font-black tracking-tight font-poppins flex items-center select-none">
            <span className="text-black">Tez</span><span className="text-[#1769ff]">X</span>
          </span>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex flex-col gap-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeFeature === item.id;

            return (
              <a
                key={item.id}
                onClick={() => setActiveFeature(item.id)}
                className={`flex items-center gap-4 py-2 px-3 rounded-xl font-medium text-[16px] cursor-pointer transition-all duration-200 ${isActive
                  ? 'bg-white text-black shadow-sm font-bold scale-[1.01]'
                  : 'text-[#444] hover:bg-black/5 hover:text-black'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#1769ff]' : 'text-[#8f8f95]'}`} />
                <span>{item.label}</span>
              </a>
            );
          })}

          {/* Switch to User Portal */}
          <a
            onClick={() => {
              window.history.pushState({}, '', '/');
              window.dispatchEvent(new Event('popstate'));
            }}
            className="flex items-center gap-4 py-2 px-3 rounded-xl font-medium text-[16px] cursor-pointer text-[#444] hover:bg-black/5 hover:text-black transition-all duration-200 mt-1 border-t border-[#ececec]/60 pt-2"
          >
            <Globe className="w-5 h-5 text-[#8f8f95]" />
            <span>User Portal</span>
          </a>
        </nav>
      </div>

      {/* Sidebar Bottom: Minimalist Sync Active Status */}
      <div className="bg-white rounded-[18px] py-3 px-4 shadow-sm border border-[#ececec]/60 flex items-center justify-center gap-2 w-full select-none group hover:shadow-md transition-all duration-300">
        {/* Pulsing indicator */}
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#107c41] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#107c41]"></span>
        </span>
        <span className="text-[12px] font-extrabold text-[#111111] tracking-wide">Tez<span className="text-[#1769ff]">X</span> CRM Sync Active</span>
      </div>

      {/* Subtle Copyright Line */}
      <div className="text-[11px] text-[#8f8f95] text-center w-full mt-3 font-bold select-none tracking-wide">
        © 2026 Tez<span className="text-[#1769ff]">X</span> CRM
      </div>
    </aside>
  );
}

export default Sidebar;
