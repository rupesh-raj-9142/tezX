import React, { useState, useEffect, useRef } from 'react';
import Pipeline from './components/Pipeline';
import Communication from './components/Communication';
import Scheduler from './components/Scheduler';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import Support from './components/Support';
import People from './components/People';
import Companies from './components/Companies';
import Projects from './components/Projects';
import { sb, supabase } from '../utils/supabase';

// Redesigned dashboard components
import Sidebar from './components/dashboard/Sidebar';
import Header from './components/dashboard/Header';
import HeroSection from './components/dashboard/HeroSection';
import SyncApps from './components/dashboard/SyncApps';
import StatsCards from './components/dashboard/StatsCards';
import TeamCard, { TEAM } from './components/dashboard/TeamCard';
import AnalyticsChart from './components/dashboard/AnalyticsChart';



function AdminPortal() {
  const [activeFeature, setActiveFeature] = useState('dashboard');
  const [activeLeadContext, setActiveLeadContext] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // States for Team Card quick actions
  const [activeVideoCall, setActiveVideoCall] = useState(null);
  const [activeChatMember, setActiveChatMember] = useState(null);
  const [activeHostContext, setActiveHostContext] = useState(null);

  // Shared meetings state with localStorage sync
  const [meetings, setMeetings] = useState(() => {
    try {
      const saved = localStorage.getItem('tezx_meetings');
      if (saved && saved !== 'undefined') return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse tezx_meetings:", e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('tezx_meetings', JSON.stringify(meetings));
  }, [meetings]);

  const handleNavigateWithContext = (feature, lead) => {
    setActiveLeadContext(lead || null);
    setActiveFeature(feature);
  };

  // Leads State with LocalStorage persistence (robust parsing)
  const [leads, setLeads] = useState(() => {
    try {
      const saved = localStorage.getItem('tezx_leads');
      if (saved && saved !== 'undefined') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse tezx_leads from localStorage:", e);
    }
    return [];
  });

  // Fetch live database lists from Supabase Postgres on mount with 5-second polling sync
  useEffect(() => {
    const syncDbWithSupabase = async () => {
      try {
        const liveLeads = await sb.leads.list();
        if (liveLeads) {
          setLeads(liveLeads.map(l => ({
            ...l,
            avatarType: l.avatar_type || l.avatarType || 'text',
            contactName: l.contact_name || l.contactName || '',
            contactEmail: l.contact_email || l.contactEmail || '',
            contactPhone: l.contact_phone || l.contactPhone || '',
            message: l.message || ''
          })));
        }
      } catch (e) {
        console.error("Leads polling sync failed:", e);
      }
      try {
        const livePeople = await sb.people.list();
        if (livePeople) {
          setPeople(livePeople);
        }
      } catch (e) {
        console.error("People sync failed:", e);
      }
      try {
        const liveCompanies = await sb.companies.list();
        if (liveCompanies) {
          setCompanies(liveCompanies);
        }
      } catch (e) {
        console.error("Companies sync failed:", e);
      }
      try {
        const liveProjects = await sb.projects.list();
        if (liveProjects) {
          setProjects(liveProjects);
        }
      } catch (e) {
        console.error("Projects sync failed:", e);
      }
    };

    syncDbWithSupabase();
    const interval = setInterval(syncDbWithSupabase, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync leads with localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('tezx_leads', JSON.stringify(leads));
    } catch (e) {
      console.error("Failed to save tezx_leads to localStorage:", e);
    }
  }, [leads]);

  // People State
  const [people, setPeople] = useState(() => {
    try {
      const saved = localStorage.getItem('tezx_people');
      if (saved && saved !== 'undefined') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse tezx_people:", e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('tezx_people', JSON.stringify(people));
  }, [people]);

  // Companies State
  const [companies, setCompanies] = useState(() => {
    try {
      const saved = localStorage.getItem('tezx_companies');
      if (saved && saved !== 'undefined') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse tezx_companies:", e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('tezx_companies', JSON.stringify(companies));
  }, [companies]);

  // Projects State
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('tezx_projects');
      if (saved && saved !== 'undefined') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse tezx_projects:", e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('tezx_projects', JSON.stringify(projects));
  }, [projects]);

  // Relational Supabase interceptors for state arrays
  const updatePeople = async (newVal) => {
    const nextVal = typeof newVal === 'function' ? newVal(people) : newVal;
    if (nextVal.length > people.length) {
      const added = nextVal.find(p => !people.some(old => old.id === p.id));
      if (added) {
        await sb.people.insert({
          id: added.id,
          name: added.name,
          email: added.email,
          phone: added.phone,
          company: added.company,
          role: added.role,
          status: added.status,
          avatar: added.avatar
        });
      }
    } else if (nextVal.length < people.length) {
      const deleted = people.find(old => !nextVal.some(p => p.id === old.id));
      if (deleted) await sb.people.delete(deleted.id);
    } else {
      const updated = nextVal.find(p => {
        const old = people.find(o => o.id === p.id);
        return old && JSON.stringify(old) !== JSON.stringify(p);
      });
      if (updated) {
        await sb.people.update(updated.id, {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          company: updated.company,
          role: updated.role,
          status: updated.status,
          avatar: updated.avatar
        });
      }
    }
    setPeople(nextVal);
  };

  const updateCompanies = async (newVal) => {
    const nextVal = typeof newVal === 'function' ? newVal(companies) : newVal;
    if (nextVal.length > companies.length) {
      const added = nextVal.find(c => !companies.some(old => old.id === c.id));
      if (added) {
        await sb.companies.insert({
          id: added.id,
          name: added.name,
          industry: added.industry,
          size: added.size,
          website: added.website,
          status: added.status,
          avatar: added.avatar
        });
      }
    } else if (nextVal.length < companies.length) {
      const deleted = companies.find(old => !nextVal.some(c => c.id === old.id));
      if (deleted) await sb.companies.delete(deleted.id);
    } else {
      const updated = nextVal.find(c => {
        const old = companies.find(o => o.id === c.id);
        return old && JSON.stringify(old) !== JSON.stringify(c);
      });
      if (updated) {
        await sb.companies.update(updated.id, {
          id: updated.id,
          name: updated.name,
          industry: updated.industry,
          size: updated.size,
          website: updated.website,
          status: updated.status,
          avatar: updated.avatar
        });
      }
    }
    setCompanies(nextVal);
  };

  const updateProjects = async (newVal) => {
    const nextVal = typeof newVal === 'function' ? newVal(projects) : newVal;
    if (nextVal.length > projects.length) {
      const added = nextVal.find(p => !projects.some(old => old.id === p.id));
      if (added) {
        await sb.projects.insert({
          id: added.id,
          name: added.name,
          company: added.company,
          budget: added.budget,
          deadline: added.deadline,
          owner: added.owner,
          status: added.status,
          description: added.description
        });
      }
    } else if (nextVal.length < projects.length) {
      const deleted = projects.find(old => !nextVal.some(p => p.id === old.id));
      if (deleted) await sb.projects.delete(deleted.id);
    } else {
      const updated = nextVal.find(p => {
        const old = projects.find(o => o.id === p.id);
        return old && JSON.stringify(old) !== JSON.stringify(p);
      });
      if (updated) {
        await sb.projects.update(updated.id, {
          id: updated.id,
          name: updated.name,
          company: updated.company,
          budget: updated.budget,
          deadline: updated.deadline,
          owner: updated.owner,
          status: updated.status,
          description: updated.description
        });
      }
    }
    setProjects(nextVal);
  };

  // Admin Profile State with LocalStorage persistence (robust parsing)
  const [adminProfile, setAdminProfile] = useState(() => {
    const defaultProfile = {
      name: 'TezX Admin',
      role: 'System Root',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjCZ-YqtXyQrqQws1STBvuNoDYIZ4aRj4tsrIuJ5N4IXV13Zn932IJ96h7pLbqhf9MeRsaYUi5JPIsFQQoVFzXL4YU_dCUXDlp3oBpK8YeerP9BCx5o92VRJHfpnIISqhpgL3FbzF26NO9FF-4Yj5-vOvF4PvFtXRmlpnUSsn_eNe-X3QiZknTeJgSeZwcDvNk2SzHmoz7vjT7PAdh3Clg7ak9bvidYWYhJHEypNyi6gSw0MfHuF0uym3zaVkb05GH7ajVGxPdvEo7',
    };
    try {
      const saved = localStorage.getItem('tezx_admin_profile');
      if (saved && saved !== 'undefined') {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse tezx_admin_profile from localStorage:", e);
    }
    return defaultProfile;
  });

  // Sync admin profile with localStorage
  useEffect(() => {
    localStorage.setItem('tezx_admin_profile', JSON.stringify(adminProfile));
  }, [adminProfile]);

  // Modal State for New Lead
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    company: '',
    project: '',
    category: 'Enterprise',
    stage: 'new',
    amount: '',
    urgent: false,
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    message: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Modal State for Admin Profile Settings
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    role: '',
    avatar: '',
  });
  const [avatarError, setAvatarError] = useState('');
  const fileInputRef = useRef(null);

  const handleOpenProfile = () => {
    setProfileForm({
      name: adminProfile.name,
      role: adminProfile.role,
      avatar: adminProfile.avatar || '',
    });
    setAvatarError('');
    setIsProfileModalOpen(true);
  };

  // Lead operation handlers
  const handleAddLead = (e) => {
    e.preventDefault();

    // Simple Validation
    const errors = {};
    if (!newLeadForm.company.trim()) errors.company = 'Company name is required';
    if (!newLeadForm.project.trim()) errors.project = 'Project/Deal title is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Generate Initials for Avatar
    const companyInitials = newLeadForm.company
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newlyCreated = {
      id: `lead-${Date.now()}`,
      company: newLeadForm.company.trim(),
      project: newLeadForm.project.trim(),
      category: newLeadForm.category,
      stage: newLeadForm.stage,
      urgent: newLeadForm.urgent,
      time: newLeadForm.stage === 'meeting-scheduled' ? 'Today @ 3:00 PM' : 'Just now',
      avatar: companyInitials || 'LD',
      avatarType: 'text',
      amount: newLeadForm.stage === 'success' ? (newLeadForm.amount.startsWith('$') ? newLeadForm.amount : `$${newLeadForm.amount}`) : (newLeadForm.amount ? `$${newLeadForm.amount}` : undefined),
      contactName: newLeadForm.contactName.trim(),
      contactEmail: newLeadForm.contactEmail.trim(),
      contactPhone: newLeadForm.contactPhone.trim(),
      message: newLeadForm.message.trim(),
    };

    // Insert live lead into remote database
    const insertLeadToDb = async () => {
      await sb.leads.insert({
        id: newlyCreated.id,
        company: newlyCreated.company,
        project: newlyCreated.project,
        category: newlyCreated.category,
        stage: newlyCreated.stage,
        time: newlyCreated.time,
        avatar: newlyCreated.avatar,
        avatar_type: newlyCreated.avatarType, // Postgres column
        amount: newlyCreated.amount,
        urgent: newlyCreated.urgent,
        contact_name: newlyCreated.contactName,
        contact_email: newlyCreated.contactEmail,
        contact_phone: newlyCreated.contactPhone,
        message: newlyCreated.message,
      });
    };
    insertLeadToDb();

    // Also insert manual lead contact to People directory if info was filled
    if (newlyCreated.contactName) {
      const insertPersonToDb = async () => {
        const initials = newlyCreated.contactName
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        const newPerson = {
          id: `person-${Date.now()}`,
          name: newlyCreated.contactName,
          email: newlyCreated.contactEmail || `${newlyCreated.contactName.toLowerCase().replace(/\s+/g, '')}@${newlyCreated.company.toLowerCase().replace(/\s+/g, '')}.com`,
          phone: newlyCreated.contactPhone || '',
          company: newlyCreated.company,
          role: 'Prospect',
          status: 'Active',
          avatar: initials || 'PP',
        };

        await sb.people.insert(newPerson);
        setPeople(prev => [newPerson, ...prev]);
      };
      insertPersonToDb();
    }

    setLeads(prev => [newlyCreated, ...prev]);
    setIsNewLeadModalOpen(false);

    // Reset Form
    setNewLeadForm({
      company: '',
      project: '',
      category: 'Enterprise',
      stage: 'new',
      amount: '',
      urgent: false,
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      message: '',
    });
    setFormErrors({});
  };

  const handleUpdateLead = async (updatedLead) => {
    console.log('[TezX Debug] handleUpdateLead called with:', updatedLead);

    // 1. Optimistically update the local state instantly for lightning fast visual transition
    setLeads(prev => {
      const nextLeads = prev.map(l => l.id === updatedLead.id ? updatedLead : l);
      console.log('[TezX Debug] handleUpdateLead optimistically set next leads list state:', nextLeads);
      return nextLeads;
    });

    // 2. Perform background database synchronization
    try {
      const res = await sb.leads.update(updatedLead.id, {
        id: updatedLead.id,
        company: updatedLead.company,
        project: updatedLead.project,
        category: updatedLead.category,
        stage: updatedLead.stage,
        time: updatedLead.time,
        avatar: updatedLead.avatar,
        avatar_type: updatedLead.avatarType || 'text',
        amount: updatedLead.amount,
        urgent: updatedLead.urgent,
        contact_name: updatedLead.contactName || updatedLead.contact_name || '',
        contact_email: updatedLead.contactEmail || updatedLead.contact_email || '',
        contact_phone: updatedLead.contactPhone || updatedLead.contact_phone || '',
        message: updatedLead.message || '',
      });
      console.log('[TezX Debug] sb.leads.update fetch resolved with:', res);
    } catch (e) {
      console.error('[TezX Debug] sb.leads.update failed:', e);
    }
  };

  const handleDeleteLead = async (leadId) => {
    console.log('[TezX Debug] handleDeleteLead called with ID:', leadId);
    // 1. Optimistically delete the lead from local state instantly
    setLeads(prev => prev.filter(l => l.id !== leadId));

    // 2. Perform background database synchronization
    try {
      await sb.leads.delete(leadId);
      console.log('[TezX Debug] sb.leads.delete successfully resolved');
    } catch (e) {
      console.error('[TezX Debug] sb.leads.delete failed:', e);
    }
  };

  // Profile Upload & Delete handlers
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limit base64 length to prevent localStorage bloating (>2MB check)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image must be less than 2MB');
      return;
    }

    setAvatarError('');
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setProfileForm(prev => ({
        ...prev,
        avatar: uploadEvent.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarDelete = () => {
    setProfileForm(prev => ({
      ...prev,
      avatar: '',
    }));
    setAvatarError('');
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.role.trim()) return;

    setAdminProfile({
      name: profileForm.name.trim(),
      role: profileForm.role.trim(),
      avatar: profileForm.avatar,
    });
    setIsProfileModalOpen(false);
  };

  return (
    <div className="bg-[#f3f3f5] font-body-md text-[#111111] w-screen h-screen flex items-center justify-center overflow-hidden selection:bg-brand-blue/10">
      {/* Centered Main Rounded Wrapper Container - Fullscreen on mobile, rounded on desktop */}
      <div className="w-full h-full md:w-[98vw] md:h-[98vh] bg-white md:rounded-[32px] shadow-none md:shadow-[0_10px_40px_rgba(0,0,0,0.06)] overflow-hidden flex border-none md:border md:border-[#ececec] relative">

        {/* Left Navigation Sidebar - Absolute overlay on mobile, static on desktop */}
        <div className={`fixed inset-y-0 left-0 z-50 transform lg:transform-none lg:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} transition-transform duration-300 ease-in-out`}>
          <Sidebar
            activeFeature={activeFeature}
            setActiveFeature={(f) => {
              setActiveFeature(f);
              setSearchTerm('');
              setIsSidebarOpen(false);
            }}
          />
        </div>

        {/* Backdrop for Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          />
        )}

        {/* Center Main Dashboard/Feature Pane */}
        <div className="flex-grow h-full flex flex-col min-w-0 bg-white">

          {/* Main Top Header Section - Accepts sidebar toggle callback */}
          <Header
            adminProfile={adminProfile}
            onOpenProfile={handleOpenProfile}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />

          {/* Feature Scrollable Body Container - Responsive Padding */}
          <div className="flex-grow overflow-y-auto p-4 md:p-10 bg-white">
            {activeFeature === 'dashboard' && (
              <div className="animate-in fade-in duration-300">
                <HeroSection onAddLead={() => setIsNewLeadModalOpen(true)} />
                <SyncApps />
                <StatsCards />
              </div>
            )}

            {activeFeature === 'pipeline' && (
              <div className="animate-in fade-in duration-300">
                <Pipeline
                  leads={leads}
                  onUpdateLead={handleUpdateLead}
                  onDeleteLead={handleDeleteLead}
                  onOpenNewLead={() => setIsNewLeadModalOpen(true)}
                  onNavigateTo={handleNavigateWithContext}
                />
              </div>
            )}

            {activeFeature === 'communication' && (
              <div className="animate-in fade-in duration-300">
                <Communication
                  leads={leads}
                  leadContext={activeLeadContext}
                  onUpdateLead={handleUpdateLead}
                />
              </div>
            )}
            {activeFeature === 'scheduler' && (
              <div className="animate-in fade-in duration-300">
                <Scheduler
                  leads={leads}
                  onUpdateLead={handleUpdateLead}
                  leadContext={activeLeadContext}
                  clearLeadContext={() => setActiveLeadContext(null)}
                  hostContext={activeHostContext}
                  clearHostContext={() => setActiveHostContext(null)}
                  meetings={meetings}
                  setMeetings={setMeetings}
                />
              </div>
            )}
            {activeFeature === 'analytics' && (
              <div className="animate-in fade-in duration-300">
                <Analytics
                  leads={leads}
                  projects={projects}
                />
              </div>
            )}
            {activeFeature === 'settings' && <div className="animate-in fade-in duration-300"><Settings /></div>}
            {activeFeature === 'support' && <div className="animate-in fade-in duration-300"><Support /></div>}

            {activeFeature === 'people' && (
              <div className="animate-in fade-in duration-300">
                <People
                  people={people}
                  setPeople={updatePeople}
                  companies={companies}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                />
              </div>
            )}

            {activeFeature === 'companies' && (
              <div className="animate-in fade-in duration-300">
                <Companies
                  companies={companies}
                  setCompanies={updateCompanies}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                />
              </div>
            )}

            {activeFeature === 'projects' && (
              <div className="animate-in fade-in duration-300">
                <Projects
                  projects={projects}
                  setProjects={updateProjects}
                  companies={companies}
                  people={people}
                  leadContext={activeLeadContext}
                  clearLeadContext={() => setActiveLeadContext(null)}
                  onUpdateLead={handleUpdateLead}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                />
              </div>
            )}

            {activeFeature === 'team' && (
              <div className="animate-in fade-in duration-300">
                <div className="max-w-screen-xl mx-auto text-left space-y-8">
                  {/* Header */}
                  <div>
                    <h2 className="text-[28px] font-black text-black tracking-tight">Your Team Roster</h2>
                    <p className="text-[14px] text-[#8f8f95] mt-1">Be aware of who is on your team and initiate instant collaborative actions.</p>
                  </div>

                  {/* Team Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {TEAM.map((member) => (
                      <div key={member.id} className="bg-white border border-[#ececec] rounded-[32px] p-6 shadow-sm hover:shadow-md hover:border-[#1769ff]/20 transition-all flex flex-col justify-between items-center text-center relative overflow-hidden group select-none h-[420px]">
                        {/* Gradient card background header */}
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-[#1769ff] to-[#3525cd]" />
                        <div className="absolute top-28 -right-10 w-28 h-28 rounded-full bg-[#1769ff]/5 blur-md pointer-events-none" />

                        {/* Avatar */}
                        <div className="w-28 h-28 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg relative z-10 mt-14 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center">
                          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover rounded-full" />
                        </div>

                        {/* Info */}
                        <div className="relative z-10 mt-4 flex flex-col items-center flex-grow">
                          <h4 className="text-[22px] font-extrabold text-slate-900 leading-tight">{member.name}</h4>
                          <p className="text-[13px] text-[#1769ff] font-extrabold uppercase tracking-wider mt-1">{member.role}</p>
                          <p className="text-[12px] text-[#8f8f95] mt-2 max-w-[200px] leading-relaxed">
                            {member.id === 'anna' && "Handles end-to-end client deliverable scopes and schedules."}
                            {member.id === 'marcus' && "Directs the system integrations and Supabase sync structures."}
                            {member.id === 'clara' && "Designs premium visual interfaces and glassmorphic UI systems."}
                          </p>
                        </div>

                        {/* Interactive Action Buttons */}
                        <div className="flex items-center gap-4 mt-6 z-10 w-full justify-center">
                          <button
                            onClick={() => {
                              setActiveHostContext(member);
                              setActiveFeature('scheduler');
                              setActiveChatMember(null);
                              setActiveVideoCall(null);
                            }}
                            className="w-12 h-12 rounded-2xl bg-[#f3f3f5] hover:bg-[#1769ff]/10 text-[#444] hover:text-[#1769ff] flex items-center justify-center transition-all cursor-pointer border-none active:scale-95 flex-shrink-0"
                            title="Schedule Session"
                          >
                            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveChatMember(member);
                              setActiveVideoCall(null);
                            }}
                            className="w-12 h-12 rounded-2xl bg-[#f3f3f5] hover:bg-[#1769ff]/10 text-[#444] hover:text-[#1769ff] flex items-center justify-center transition-all cursor-pointer border-none active:scale-95 flex-shrink-0"
                            title="Message Staff"
                          >
                            <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveVideoCall(member);
                              setActiveChatMember(null);
                            }}
                            className="w-12 h-12 rounded-2xl bg-[#f3f3f5] hover:bg-[#1769ff]/10 text-[#444] hover:text-[#1769ff] flex items-center justify-center transition-all cursor-pointer border-none active:scale-95 flex-shrink-0"
                            title="Video Call"
                          >
                            <span className="material-symbols-outlined text-[20px]">videocam</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Team Analytics & Performance Statistics */}
                  <div className="bg-white border border-[#ececec] rounded-[32px] p-8 shadow-sm">
                    <AnalyticsChart />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NEW LEAD CREATION MODAL */}
      {isNewLeadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-md">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsNewLeadModalOpen(false)}
          ></div>

          {/* Modal Container */}
          <div className="bg-white border border-[#ececec] rounded-2xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-lg py-md border-b border-[#ececec] flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-headline-md font-bold text-[#111111]">Add New Lead</h3>
                <p className="text-body-sm text-[#8f8f95]">Create a new opportunity in the pipeline</p>
              </div>
              <button
                onClick={() => setIsNewLeadModalOpen(false)}
                className="text-[#8f8f95] hover:text-error transition-colors p-xs rounded-full hover:bg-[#f5f5f6]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleAddLead} className="flex flex-col flex-grow min-h-0 overflow-hidden">
              {/* Scrollable Content */}
              <div className="p-lg space-y-md overflow-y-auto flex-grow text-left">
                {/* Company Input */}
                <div className="flex flex-col gap-xs">
                  <label className="text-label-sm font-bold text-[#8f8f95] uppercase">COMPANY / CLIENT NAME *</label>
                  <input
                    type="text"
                    value={newLeadForm.company}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, company: e.target.value })}
                    placeholder="e.g. Acme Corp"
                    className={`w-full h-11 px-md bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-body-sm ${formErrors.company ? 'border-error ring-1 ring-error' : 'border-[#ececec]'}`}
                  />
                  {formErrors.company && <span className="text-[12px] text-error font-bold">{formErrors.company}</span>}
                </div>

                {/* Project Title Input */}
                <div className="flex flex-col gap-xs">
                  <label className="text-label-sm font-bold text-[#8f8f95] uppercase">PROJECT / DEAL TITLE *</label>
                  <input
                    type="text"
                    value={newLeadForm.project}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, project: e.target.value })}
                    placeholder="e.g. Legacy Migration, Cloud Audit"
                    className={`w-full h-11 px-md bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-body-sm ${formErrors.project ? 'border-error ring-1 ring-error' : 'border-[#ececec]'}`}
                  />
                  {formErrors.project && <span className="text-[12px] text-error font-bold">{formErrors.project}</span>}
                </div>

                {/* Category selector (Pills) */}
                <div className="flex flex-col gap-xs">
                  <label className="text-label-sm font-bold text-[#8f8f95] uppercase">CATEGORY</label>
                  <div className="flex flex-wrap gap-xs">
                    {['Enterprise', 'SME', 'Consulting', 'Custom'].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewLeadForm({ ...newLeadForm, category: cat })}
                        className={`px-md py-[6px] rounded-lg text-label-md font-bold transition-all border ${newLeadForm.category === cat ? 'bg-[#e2dfff] text-[#3323cc] border-[#e2dfff]' : 'bg-white border-[#ececec] text-[#444] hover:bg-[#f5f5f6]'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stage and Urgency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  {/* Stage Stepper Progression */}
                  <div className="flex flex-col gap-xs">
                    <label className="text-label-sm font-bold text-[#8f8f95] uppercase">PIPELINE STAGE PROGRESSION</label>
                    <div className="grid grid-cols-4 gap-xs bg-[#f7f9fb] p-[4px] rounded-xl border border-[#ececec]">
                      {[
                        { id: 'new', label: 'New' },
                        { id: 'under-review', label: 'Review' },
                        { id: 'meeting-scheduled', label: 'Meeting' },
                        { id: 'success', label: 'Won' }
                      ].map(step => {
                        const isActive = newLeadForm.stage === step.id;
                        return (
                          <button
                            key={step.id}
                            type="button"
                            onClick={() => setNewLeadForm({ ...newLeadForm, stage: step.id })}
                            className={`py-[8px] px-xs rounded-lg text-[11px] font-bold transition-all text-center ${isActive
                              ? 'bg-[#3525cd] text-white shadow-sm'
                              : 'text-[#464555] hover:bg-[#eceef0]'
                              }`}
                          >
                            {step.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Deal Value Amount (Conditional or universal) */}
                  <div className="flex flex-col gap-xs">
                    <label className="text-label-sm font-bold text-[#8f8f95] uppercase">
                      DEAL VALUE ($) {newLeadForm.stage === 'success' && '*'}
                    </label>
                    <input
                      type="text"
                      value={newLeadForm.amount}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, amount: e.target.value })}
                      placeholder="e.g. 10,000"
                      className="w-full h-11 px-md bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-body-sm"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="border-t border-[#ececec]/60 pt-md space-y-md">
                  <label className="text-label-sm font-bold text-[#8f8f95] uppercase">CONTACT INFORMATION</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                    <div className="flex flex-col gap-xs">
                      <input
                        type="text"
                        value={newLeadForm.contactName}
                        onChange={(e) => setNewLeadForm({ ...newLeadForm, contactName: e.target.value })}
                        placeholder="Contact Name"
                        className="w-full h-11 px-md bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-body-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <input
                        type="email"
                        value={newLeadForm.contactEmail}
                        onChange={(e) => setNewLeadForm({ ...newLeadForm, contactEmail: e.target.value })}
                        placeholder="Contact Email"
                        className="w-full h-11 px-md bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-body-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-xs">
                      <input
                        type="text"
                        value={newLeadForm.contactPhone}
                        onChange={(e) => setNewLeadForm({ ...newLeadForm, contactPhone: e.target.value })}
                        placeholder="Contact Phone"
                        className="w-full h-11 px-md bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-body-sm"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-xs">
                    <textarea
                      value={newLeadForm.message}
                      onChange={(e) => setNewLeadForm({ ...newLeadForm, message: e.target.value })}
                      placeholder="Inquiry Description / Message"
                      rows="2"
                      className="w-full p-md bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-body-sm resize-none"
                    />
                  </div>
                </div>

                {/* Urgent Toggle Checkbox */}
                <div className="flex items-center gap-sm bg-white p-md rounded-xl border border-[#ececec]/60">
                  <input
                    type="checkbox"
                    id="urgent"
                    checked={newLeadForm.urgent}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, urgent: e.target.checked })}
                    className="w-5 h-5 rounded border-[#ececec] text-[#1769ff] focus:ring-[#1769ff]/20 cursor-pointer"
                  />
                  <label htmlFor="urgent" className="text-body-sm font-bold text-[#111111] select-none cursor-pointer flex flex-col">
                    <span>Mark as Urgent Opportunity</span>
                    <span className="text-[11px] text-[#8f8f95] font-normal">Adds a high-priority tag and alerts representatives.</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons (Sticky Footer) */}
              <div className="flex items-center justify-end gap-sm pt-md border-t border-[#ececec] flex-shrink-0 bg-white p-lg mt-auto">
                <button
                  type="button"
                  onClick={() => setIsNewLeadModalOpen(false)}
                  className="px-lg h-11 rounded-xl font-bold text-label-md text-[#8f8f95] hover:bg-[#f5f5f6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-lg h-11 rounded-xl bg-[#1769ff] hover:bg-[#0054e6] text-white font-bold text-label-md shadow-md active:scale-[0.98] transition-all"
                >
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN PROFILE SETTINGS MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-md">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsProfileModalOpen(false)}
          ></div>

          {/* Modal Container */}
          <div className="bg-white border border-[#ececec] rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-lg py-md border-b border-[#ececec] flex items-center justify-between">
              <div>
                <h3 className="text-headline-md font-bold text-[#111111]">Admin Profile Settings</h3>
                <p className="text-body-sm text-[#8f8f95]">Update credentials and system display parameters</p>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-[#8f8f95] hover:text-error transition-colors p-xs rounded-full hover:bg-[#f5f5f6]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveProfile} className="p-lg space-y-lg">

              {/* Avatar Manager */}
              <div className="flex flex-col items-center gap-md pb-md border-b border-[#ececec]/40">
                <div className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border-4 border-[#1769ff]/20 shadow-md transition-all hover:border-[#1769ff]/50">
                  {/* Current image or placeholder */}
                  {profileForm.avatar ? (
                    <img
                      src={profileForm.avatar}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#e2dfff] text-[#3323cc] flex items-center justify-center text-2xl font-black">
                      {profileForm.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || 'AD'}
                    </div>
                  )}

                  {/* Hover Camera Overlay */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity select-none"
                  >
                    <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider mt-xs">Upload</span>
                  </div>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* Avatar Actions */}
                <div className="flex gap-sm">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-md py-[6px] rounded-lg text-label-md font-bold bg-white border border-[#ececec] text-[#444] hover:bg-[#f5f5f6] transition-all flex items-center gap-xs"
                  >
                    <span className="material-symbols-outlined text-[18px]">upload</span>
                    Change Image
                  </button>

                  {profileForm.avatar && (
                    <button
                      type="button"
                      onClick={handleAvatarDelete}
                      className="px-md py-[6px] rounded-lg text-label-md font-bold bg-white border border-error/40 text-error hover:bg-error/10 transition-all flex items-center gap-xs"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      Remove
                    </button>
                  )}
                </div>
                {avatarError && <span className="text-[12px] text-error font-bold">{avatarError}</span>}
              </div>

              {/* Name Input */}
              <div className="flex flex-col gap-xs">
                <label className="text-label-sm font-bold text-[#8f8f95]">ADMIN NAME *</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="e.g. TezX Admin"
                  className="w-full h-11 px-md bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-body-sm"
                  required
                />
              </div>

              {/* Role Title Input */}
              <div className="flex flex-col gap-xs">
                <label className="text-label-sm font-bold text-[#8f8f95]">DESIGNATION / ROLE *</label>
                <input
                  type="text"
                  value={profileForm.role}
                  onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                  placeholder="e.g. System Root, Manager"
                  className="w-full h-11 px-md bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-body-sm"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-md border-t border-[#ececec]">
                <button
                  type="button"
                  onClick={async () => {
                    await supabase.auth.signOut();
                  }}
                  className="px-lg h-11 rounded-xl font-bold text-label-md text-red-500 hover:bg-red-50 transition-colors border border-red-200"
                >
                  Sign Out
                </button>
                <div className="flex items-center gap-sm">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(false)}
                    className="px-lg h-11 rounded-xl font-bold text-label-md text-[#8f8f95] hover:bg-[#f5f5f6] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-lg h-11 rounded-xl bg-[#1769ff] hover:bg-[#0054e6] text-white font-bold text-label-md shadow-md active:scale-[0.98] transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Interactive Team Action Overlays */}
      {activeVideoCall && (
        <VideoCallModal
          member={activeVideoCall}
          onClose={() => setActiveVideoCall(null)}
        />
      )}

      {activeChatMember && (
        <StaffChatDrawer
          member={activeChatMember}
          onClose={() => setActiveChatMember(null)}
        />
      )}
    </div>
  );
}

// SIMULATED VIDEO CALL OVERLAY MODAL
function VideoCallModal({ member, onClose }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState('dialing'); // 'dialing' | 'connected'
  const [timer, setTimer] = useState(0);

  // Dialing simulation
  useEffect(() => {
    const dialTimeout = setTimeout(() => {
      setCallStatus('connected');
    }, 1800);
    return () => clearTimeout(dialTimeout);
  }, []);

  // Call duration timer
  useEffect(() => {
    if (callStatus !== 'connected') return;
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md text-white select-none animate-in fade-in duration-300">
      <div className="w-full max-w-4xl h-[90vh] max-h-[680px] bg-slate-900 rounded-[32px] overflow-hidden flex flex-col justify-between relative border border-white/10 shadow-2xl p-8">

        {/* Dynamic Dialing UI */}
        {callStatus === 'dialing' ? (
          <div className="flex-grow flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#1769ff]/20 animate-ping" />
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#1769ff]/60 relative z-10 shadow-lg">
                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-[24px] font-black tracking-tight">{member.name}</h3>
              <p className="text-[#8f8f95] text-[13px] font-bold mt-1 uppercase tracking-wider">Dialing secure connection...</p>
            </div>
          </div>
        ) : (
          /* Connected Live Video Session */
          <div className="flex-grow flex flex-col min-h-0 relative rounded-2xl overflow-hidden bg-slate-950 border border-white/5">
            {/* Call Participant Overlay Info */}
            <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 border border-white/5 flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#107c41] animate-pulse" />
              <div>
                <span className="text-[12px] font-extrabold">{member.name}</span>
                <span className="text-[10px] text-white/60 block font-semibold">TezX Team ({member.role})</span>
              </div>
            </div>

            {/* Timer Overlay */}
            <div className="absolute top-4 right-4 z-20 bg-black/60 backdrop-blur-md rounded-xl px-3 py-2 border border-white/5 text-[12px] font-mono tracking-wider font-extrabold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-red-500 animate-pulse">fiber_manual_record</span>
              <span>{formatTime(timer)}</span>
            </div>

            {/* Main Video Stream Container */}
            <div className="flex-grow flex items-center justify-center relative overflow-hidden bg-slate-900">
              {isScreenSharing ? (
                /* Screen sharing mockup */
                <div className="absolute inset-0 bg-[#0f172a] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
                  <span className="material-symbols-outlined text-[72px] text-[#1769ff] animate-pulse">screen_share</span>
                  <h4 className="text-[20px] font-black mt-4">You are sharing your screen</h4>
                  <p className="text-white/60 text-[13px] max-w-sm mt-1">Presentation mode is active. Clara and other participants can see your desktop workspace.</p>
                </div>
              ) : (
                /* Participant Large Camera */
                <div className="w-full h-full flex flex-col items-center justify-center relative bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl relative mb-4">
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  </div>

                  {/* CSS Animated Audio Waveform */}
                  <div className="flex items-end gap-[4px] h-10 mt-2 select-none pointer-events-none">
                    <div className="w-1 bg-[#1769ff] rounded-full animate-wave-1 h-3" />
                    <div className="w-1 bg-[#1769ff] rounded-full animate-wave-2 h-6" />
                    <div className="w-1 bg-[#1769ff] rounded-full animate-wave-3 h-8" />
                    <div className="w-1 bg-[#1769ff] rounded-full animate-wave-4 h-4" />
                    <div className="w-1 bg-[#1769ff] rounded-full animate-wave-2 h-7" />
                    <div className="w-1 bg-[#1769ff] rounded-full animate-wave-3 h-5" />
                    <div className="w-1 bg-[#1769ff] rounded-full animate-wave-1 h-8" />
                  </div>
                </div>
              )}
            </div>

            {/* Local Camera Picture in Picture box (Bottom Right) */}
            {!isVideoOff && (
              <div className="absolute bottom-4 right-4 w-40 aspect-video rounded-xl overflow-hidden border border-white/20 bg-slate-950 shadow-2xl z-20 flex items-center justify-center animate-in slide-in-from-bottom-4 duration-300">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#3525cd]/40 to-[#1769ff]/20 z-0" />
                <div className="w-10 h-10 rounded-full bg-white/20 border border-white/20 flex items-center justify-center font-bold text-[12px] z-10 text-white">
                  You
                </div>
                <div className="absolute bottom-1.5 left-2 z-10 text-[9px] bg-black/60 px-1.5 py-0.5 rounded text-white/80 font-bold uppercase tracking-wider">Admin Cam</div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Call Controls Toolbar */}
        <div className="h-20 flex-shrink-0 flex items-center justify-center gap-6 mt-6">
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer border-none shadow-md ${isMuted
                ? 'bg-red-600 hover:bg-red-700 text-white ring-4 ring-red-600/30'
                : 'bg-white/10 hover:bg-white/20 text-white hover:scale-105'
              }`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            <span className="material-symbols-outlined text-[24px]">
              {isMuted ? 'mic_off' : 'mic'}
            </span>
          </button>

          {/* Toggle Camera Button */}
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer border-none shadow-md ${isVideoOff
                ? 'bg-red-600 hover:bg-red-700 text-white ring-4 ring-red-600/30'
                : 'bg-white/10 hover:bg-white/20 text-white hover:scale-105'
              }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            <span className="material-symbols-outlined text-[24px]">
              {isVideoOff ? 'videocam_off' : 'videocam'}
            </span>
          </button>

          {/* Screen Share Button */}
          <button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            disabled={callStatus !== 'connected'}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer border-none shadow-md disabled:opacity-40 disabled:pointer-events-none ${isScreenSharing
                ? 'bg-[#107c41] hover:bg-[#0e6b37] text-white ring-4 ring-[#107c41]/30'
                : 'bg-white/10 hover:bg-white/20 text-white hover:scale-105'
              }`}
            title={isScreenSharing ? 'Stop Presenting' : 'Present Screen'}
          >
            <span className="material-symbols-outlined text-[24px]">
              {isScreenSharing ? 'cancel_presentation' : 'present_to_all'}
            </span>
          </button>

          {/* End Call Button (Big Red) */}
          <button
            onClick={onClose}
            className="w-16 h-14 rounded-3xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all cursor-pointer border-none shadow-md shadow-red-900/30 hover:scale-105"
            title="End Video Call"
          >
            <span className="material-symbols-outlined text-[28px]">
              call_end
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// SIMULATED STAFF CHAT FLOATING DRAWER (BOTTOM-RIGHT)
function StaffChatDrawer({ member, onClose }) {
  const [replyText, setReplyText] = useState('');

  // Custom chat history based on member
  const getInitialChatHistory = () => {
    switch (member.id) {
      case 'anna':
        return [
          { id: 'c1', sender: 'anna', text: "Hey! Just wanted to check if the Discovery Sync with NexGen is all set for today?", time: "10:15 AM" },
          { id: 'c2', sender: 'admin', text: "Yes, we synced with Marcus Thorne and the slots are confirmed.", time: "10:18 AM" },
          { id: 'c3', sender: 'anna', text: "Brilliant! Make sure to lock it in the CRM so the client gets the auto-notification.", time: "10:20 AM" }
        ];
      case 'marcus':
        return [
          { id: 'c1', sender: 'marcus', text: "Hey there, the Supabase PostgreSQL migration is complete. Let me know if you run into any schema sync issues.", time: "Yesterday" },
          { id: 'c2', sender: 'admin', text: "Thanks Marcus, everything is syncing perfectly on my end.", time: "Yesterday" },
          { id: 'c3', sender: 'marcus', text: "Great. I'm monitoring the active sync lines. Let me know if you need me to adjust the polling interval.", time: "9:30 AM" }
        ];
      case 'clara':
        return [
          { id: 'c1', sender: 'clara', text: "Hi! I just finished the new glassmorphism mockups for the client portal. Let me know what you think!", time: "11:00 AM" },
          { id: 'c2', sender: 'admin', text: "They look amazing Clara, the rounded corners and smooth blur look very premium.", time: "11:15 AM" },
          { id: 'c3', sender: 'clara', text: "Thank you! I'll update the design system components in Figma based on this feedback.", time: "11:22 AM" }
        ];
      default:
        return [
          { id: 'c1', sender: 'member', text: `Hi, I am ready to collaborate! Let's get things done.`, time: "Just now" }
        ];
    }
  };

  const [messages, setMessages] = useState(getInitialChatHistory);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const userMsg = {
      id: `chat-${Date.now()}`,
      sender: 'admin',
      text: replyText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setReplyText('');

    // Simulate team member typing & response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);

      let replyVal = "Awesome! I am on it.";
      if (member.id === 'anna') {
        replyVal = "Got it! I will review the CRM logs. Let's make sure the client rep gets locked into the scope schedule.";
      } else if (member.id === 'marcus') {
        replyVal = "Perfect. I'm checking the live webhook loops. Let's touch base in the afternoon brief.";
      } else if (member.id === 'clara') {
        replyVal = "Wonderful! I'm preparing the visual walkthrough slides for the next stakeholder showcase.";
      }

      const memberMsg = {
        id: `chat-${Date.now() + 1}`,
        sender: member.id,
        text: replyVal,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, memberMsg]);
    }, 1800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[160] w-[360px] h-[480px] bg-white border border-[#ececec] rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-slate-800 text-white px-5 py-4 flex justify-between items-center select-none">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={member.avatar} alt={member.name} className="w-9 h-9 rounded-full object-cover border border-white/25" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-slate-900" />
          </div>
          <div className="text-left">
            <h4 className="text-[13px] font-extrabold leading-snug text-white">{member.name}</h4>
            <span className="text-[10px] text-white/60 block font-semibold">{member.role}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors bg-transparent border-none cursor-pointer flex items-center justify-center p-1 rounded-full hover:bg-white/10"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50 flex flex-col">
        {messages.map((m) => {
          const isAdmin = m.sender === 'admin';
          return (
            <div
              key={m.id}
              className={`flex flex-col max-w-[80%] ${isAdmin ? 'self-end items-end' : 'self-start items-start'}`}
            >
              <div className={`px-4 py-2.5 rounded-2xl text-[12px] leading-relaxed ${isAdmin
                  ? 'bg-[#1769ff] text-white rounded-tr-none'
                  : 'bg-white text-slate-800 border border-[#ececec] rounded-tl-none shadow-sm'
                }`}>
                {m.text}
              </div>
              <span className="text-[9px] text-[#8f8f95] mt-1 font-bold">{m.time}</span>
            </div>
          );
        })}

        {/* Simulated Typing Indicator */}
        {isTyping && (
          <div className="self-start flex items-center gap-1.5 bg-white border border-[#ececec] px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm">
            <div className="w-1.5 h-1.5 bg-[#8f8f95] rounded-full animate-bounce" />
            <div className="w-1.5 h-1.5 bg-[#8f8f95] rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 bg-[#8f8f95] rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
      </div>

      {/* Composer Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-[#ececec] bg-white flex items-center gap-2">
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder={`Type message to ${member.name.split(' ')[0]}...`}
          className="flex-grow h-10 px-3 border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all text-[12px] bg-slate-50"
        />
        <button
          type="submit"
          className="w-10 h-10 bg-[#1769ff] hover:bg-[#0054e6] text-white rounded-xl flex items-center justify-center transition-all cursor-pointer border-none shadow-sm active:scale-95 flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
        </button>
      </form>
    </div>
  );
}

export default AdminPortal;
