
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Building2,
  Briefcase,
  Calendar,
  Settings,
  Globe,
  ArrowRight,
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
            <div className="w-4 h-4 bg-white/20 absolute rotate-45 -top-1 -left-1" />
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
            className="flex items-center gap-4 py-2 px-3 rounded-xl font-medium text-[16px] cursor-pointer text-[#444] hover:bg-black/5 hover:text-black transition-all duration-200"
          >
            <Globe className="w-5 h-5 text-[#8f8f95]" />
            <span>User Portal</span>
          </a>
        </nav>
      </div>

      {/* Sidebar Bottom: Premium Sync Active Status Pill (Exact image styling) */}
      <div className="bg-white rounded-full py-3 px-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-[#ececec]/75 flex items-center justify-center gap-2.5 w-full select-none">
        <span className="w-2.5 h-2.5 rounded-full bg-[#107c41] flex-shrink-0" />
        <span className="text-[13px] font-black text-slate-800 tracking-tight">
          Tez<span className="text-[#1769ff]">X</span> CRM Sync Active
        </span>
      </div>

      {/* Subtle Copyright Line */}
      <div className="text-[12px] text-[#8f8f95] text-center w-full mt-2 font-bold select-none tracking-wide">
        © 2026 Tez<span className="text-[#1769ff]">X</span> CRM
      </div>
    </aside>
  );
}

export default Sidebar;
