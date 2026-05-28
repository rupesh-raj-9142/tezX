import React, { useState, useEffect } from 'react';
import { sb } from '../utils/supabase';

function UserPortal() {
  const [activeTab, setActiveTab] = useState('inquiry'); // 'inquiry' or 'workspace'
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  // Shared database states synced with localStorage
  const [leads, setLeads] = useState(() => {
    try {
      const saved = localStorage.getItem('tezx_leads');
      if (saved && saved !== 'undefined') return JSON.parse(saved);
    } catch (e) {
      console.error("Failed parsing leads:", e);
    }
    return [];
  });

  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('tezx_projects');
      if (saved && saved !== 'undefined') return JSON.parse(saved);
    } catch (e) {
      console.error("Failed parsing projects:", e);
    }
    return [];
  });

  const [people, setPeople] = useState(() => {
    try {
      const saved = localStorage.getItem('tezx_people');
      if (saved && saved !== 'undefined') return JSON.parse(saved);
    } catch (e) {
      console.error("Failed parsing people:", e);
    }
    return [];
  });

  // Fetch live CRM data from Supabase on mount with 5-second polling sync
  useEffect(() => {
    const syncWithSupabase = async () => {
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
        console.error("User leads polling sync failed:", e);
      }
      try {
        const liveProjects = await sb.projects.list();
        if (liveProjects) {
          setProjects(liveProjects);
        }
      } catch (e) {
        console.error("User projects sync failed:", e);
      }
      try {
        const livePeople = await sb.people.list();
        if (livePeople) {
          setPeople(livePeople);
        }
      } catch (e) {
        console.error("User people sync failed:", e);
      }
    };

    syncWithSupabase();
    const interval = setInterval(syncWithSupabase, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync state back to localStorage as quick local cache fallback
  useEffect(() => {
    localStorage.setItem('tezx_leads', JSON.stringify(leads));
  }, [leads]);

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: 'Pipeline Automation',
    message: '',
  });

  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Footer Modals State
  const [footerModal, setFooterModal] = useState(null); // null, 'privacy', 'terms', 'support'
  const [supportForm, setSupportForm] = useState({ subject: '', message: '' });
  const [supportSuccess, setSupportSuccess] = useState(false);

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!supportForm.subject.trim() || !supportForm.message.trim()) return;
    setSupportSuccess(true);
    setSupportForm({ subject: '', message: '' });
    setTimeout(() => {
      setSupportSuccess(false);
      setFooterModal(null);
    }, 3000);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Validations
    const errors = {};
    if (!form.name.trim()) errors.name = 'Full Name is required';
    if (!form.company.trim()) errors.company = 'Company name is required';
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errors.email = 'Invalid email address';
    }
    if (!form.message.trim()) errors.message = 'Please type a project description';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const companyInitials = form.company
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const serviceTitle = form.service === 'Other' ? (form.customService || 'Custom Service') : form.service;

    // Create a new Lead object (which maps to inquiries)
    const newLead = {
      id: `lead-${Date.now()}`,
      company: form.company.trim(),
      project: serviceTitle.toLowerCase().includes('integration') || serviceTitle.toLowerCase().includes('consulting') || serviceTitle.toLowerCase().includes('automation') || serviceTitle.toLowerCase().includes('migration') ? serviceTitle : `${serviceTitle} Integration`,
      category: 'Custom',
      stage: 'new',
      time: 'Just now',
      avatar: companyInitials || 'LD',
      avatarType: 'text',
      amount: '$10,000',
      contactName: form.name.trim(),
      contactEmail: form.email.trim(),
      contactPhone: form.phone.trim(),
      message: form.message.trim()
    };

    // Insert live lead into remote Supabase database
    const insertLeadToDb = async () => {
      await sb.leads.insert({
        id: newLead.id,
        company: newLead.company,
        project: newLead.project,
        category: newLead.category,
        stage: newLead.stage,
        time: newLead.time,
        avatar: newLead.avatar,
        avatar_type: newLead.avatarType, // Maps to snake_case column
        amount: newLead.amount,
        urgent: false,
        contact_name: newLead.contactName,
        contact_email: newLead.contactEmail,
        contact_phone: newLead.contactPhone,
        message: newLead.message
      });
    };
    insertLeadToDb();

    // Also insert contact as a person in the database for relational synchronicity
    const insertPersonToDb = async () => {
      const personInitials = form.name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      const newPerson = {
        id: `person-${Date.now()}`,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        role: 'Prospect',
        status: 'Active',
        avatar: personInitials || 'PS'
      };

      await sb.people.insert(newPerson);
      setPeople(prev => [newPerson, ...prev]);
    };
    insertPersonToDb();

    setLeads(prev => [newLead, ...prev]);
    setSubmitSuccess(true);
    setFormErrors({});

    // Reset Form
    setForm({
      name: '',
      email: '',
      phone: '',
      company: '',
      service: 'Pipeline Automation',
      message: '',
    });

    // Alert dismissal
    setTimeout(() => {
      setSubmitSuccess(false);
    }, 4500);
  };

  // Convert pipeline stage to progress bar steps (case-insensitive protection)
  const getStepperStatus = (stage) => {
    const s = (stage || '').toLowerCase();
    switch (s) {
      case 'new':
        return { percent: 33, label1: 'active', label2: 'pending', label3: 'pending' };
      case 'under-review':
      case 'review':
        return { percent: 66, label1: 'completed', label2: 'active', label3: 'pending' };
      case 'meeting-scheduled':
      case 'meeting':
        return { percent: 100, label1: 'completed', label2: 'completed', label3: 'active' };
      case 'success':
      case 'won':
        return { percent: 100, label1: 'completed', label2: 'completed', label3: 'completed' };
      default:
        return { percent: 0, label1: 'pending', label2: 'pending', label3: 'pending' };
    }
  };

  const getStageLabel = (stage) => {
    const s = (stage || '').toLowerCase();
    switch (s) {
      case 'new': return 'Under Review';
      case 'under-review':
      case 'review':
        return 'Review Approved';
      case 'meeting-scheduled':
      case 'meeting':
        return 'Meeting Scheduled';
      case 'success':
      case 'won':
        return 'Active Account';
      default: return stage;
    }
  };

  // Calculate budget statistics for Client Workspace
  const totalBudgetVal = projects.reduce((acc, p) => {
    const val = parseFloat(p.budget.replace(/[^0-9.]/g, '')) || 0;
    return acc + val;
  }, 0);

  const getProgressPercentage = (status) => {
    switch (status) {
      case 'Planning': return 15;
      case 'In Progress': return 60;
      case 'On Hold': return 35;
      case 'Completed': return 100;
      default: return 0;
    }
  };

  if (isLoggedOut) {
    return (
      <div className="bg-[#f3f3f5] font-body-md text-[#111111] w-screen h-screen flex items-center justify-center overflow-hidden selection:bg-brand-blue/10">
        <div className="w-[98vw] h-[98vh] bg-white rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-[#ececec] flex items-center justify-center relative overflow-hidden">
          {/* Decorative background grid and gradients */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ececec 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          <div className="absolute -top-[30%] -right-[20%] w-[600px] h-[600px] rounded-full bg-[#1769ff]/5 blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-[30%] -left-[20%] w-[600px] h-[600px] rounded-full bg-[#3525cd]/5 blur-[120px] pointer-events-none" />

          {/* Secure Logged Out Container */}
          <div className="max-w-md w-full px-8 py-10 rounded-[32px] border border-[#ececec] bg-white/60 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.02)] text-center animate-in zoom-in-95 duration-300">
            {/* Lock/Security Icon */}
            <div className="w-16 h-16 bg-[#ffebee] text-[#ba1a1a] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm ring-4 ring-[#ffebee]/40">
              <span className="material-symbols-outlined text-[32px]">lock</span>
            </div>

            <h2 className="text-[24px] font-black text-[#111111] tracking-tight mb-2">Securely Logged Out</h2>
            <p className="text-[14px] text-[#8f8f95] leading-relaxed mb-8">
              You have successfully signed out of your TezX Client Workspace. Your session has been closed securely.
            </p>

            <button
              onClick={() => setIsLoggedOut(false)}
              className="w-full py-3 px-6 bg-black text-white hover:bg-black/90 font-extrabold text-[14px] rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer border-none"
            >
              Log Back In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f3f3f5] font-body-md text-[#111111] w-screen h-screen flex items-center justify-center overflow-hidden selection:bg-brand-blue/10">
      <div className="w-[98vw] h-[98vh] bg-white rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col border border-[#ececec]">

        {/* TopAppBar */}
        <header className="bg-white border-b border-[#ececec] h-20 flex-shrink-0 flex items-center">
          <div className="flex justify-between items-center w-full px-10 h-full">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center shadow-md relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-black" />
                <div className="w-4 h-4 bg-white/20 absolute rotate-45 -top-1 -left-1" />
                <div className="w-3.5 h-3.5 bg-white absolute rotate-12 rounded-sm" />
              </div>
              <span className="text-[32px] font-black tracking-tight font-poppins flex items-center select-none">
                <span className="text-black">Tez</span><span className="text-[#1769ff]">X</span>
              </span>
            </div>

            {/* Premium Center Segmented Navigation Tabs */}
            <div className="bg-[#f3f3f5] rounded-xl p-1 flex gap-1 border border-[#ececec] ml-4 select-none">
              <button
                onClick={() => setActiveTab('inquiry')}
                className={`px-5 py-2 rounded-lg text-[14px] font-extrabold transition-all flex items-center gap-2 ${activeTab === 'inquiry'
                  ? 'bg-white shadow-sm text-[#1769ff]'
                  : 'text-[#8f8f95] hover:bg-black/5 hover:text-black'
                  }`}
              >
                <span className="material-symbols-outlined text-[18px]">rate_review</span>
                Inquiry Desk
              </button>
              <button
                onClick={() => setActiveTab('workspace')}
                className={`px-5 py-2 rounded-lg text-[14px] font-extrabold transition-all flex items-center gap-2 ${activeTab === 'workspace'
                  ? 'bg-white shadow-sm text-[#1769ff]'
                  : 'text-[#8f8f95] hover:bg-black/5 hover:text-black'
                  }`}
              >
                <span className="material-symbols-outlined text-[18px]">business_center</span>
                Client Workspace
              </button>
            </div>

            <div className="flex items-center gap-3">
              <a
                onClick={() => {
                  window.history.pushState({}, '', '#/admin');
                  window.dispatchEvent(new Event('popstate'));
                }}
                className="flex items-center gap-2 py-2 px-4 rounded-full font-semibold text-[14px] bg-[#f3f3f5] text-black hover:bg-black/10 cursor-pointer transition-all duration-200"
              >
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                <span>Admin Portal</span>
              </a>

              <button
                onClick={() => setIsLoggedOut(true)}
                className="flex items-center gap-2 py-2 px-4 rounded-full font-semibold text-[14px] bg-[#ffebee] text-[#ba1a1a] hover:bg-[#ffcdd2] cursor-pointer transition-all duration-200 border-none"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Container */}
        <div className="flex-grow overflow-y-auto p-10 bg-white">

          {/* TAB 1: INQUIRY DESK VIEW */}
          {activeTab === 'inquiry' && (
            <div className="animate-in fade-in duration-300">
              <main className="max-w-screen-xl mx-auto py-4">

                {/* Floating Submit Success Notification */}
                {submitSuccess && (
                  <div className="fixed bottom-6 right-6 z-50 bg-[#107c41] text-white py-4 px-6 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
                    <span className="material-symbols-outlined text-[24px]">verified</span>
                    <div>
                      <h5 className="font-bold text-[14px]">Inquiry Received Successfully!</h5>
                      <p className="text-[12px] text-white/80">Synchronized directly into the TezX CRM active pipeline.</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Smart Inquiry Form Section */}
                  <section className="lg:col-span-7">
                    <div className="bg-white border border-[#ececec] rounded-3xl p-8 shadow-sm text-left">
                      <div className="mb-6">
                        <h1 className="font-headline-lg text-[28px] text-[#111111] font-bold tracking-tight mb-1">Submit New Inquiry</h1>
                        <p className="font-body-md text-[14px] text-[#8f8f95]">Fill out the details below to start your journey with TezX.</p>
                      </div>
                      <form className="space-y-4" onSubmit={handleFormSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-label-sm text-[11px] font-bold text-[#8f8f95] uppercase">Full Name *</label>
                            <input
                              className={`w-full h-11 px-3 bg-white border rounded-xl focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] outline-none ${formErrors.name ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]' : 'border-[#ececec]'}`}
                              placeholder="e.g. Alex Rivers"
                              type="text"
                              value={form.name}
                              onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                            {formErrors.name && <span className="text-[11px] text-[#ba1a1a] font-bold">{formErrors.name}</span>}
                          </div>

                          <div className="space-y-1">
                            <label className="font-label-sm text-[11px] font-bold text-[#8f8f95] uppercase">Email Address *</label>
                            <input
                              className={`w-full h-11 px-3 bg-white border rounded-xl focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] outline-none ${formErrors.email ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]' : 'border-[#ececec]'}`}
                              placeholder="alex@company.com"
                              type="email"
                              value={form.email}
                              onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                            {formErrors.email && <span className="text-[11px] text-[#ba1a1a] font-bold">{formErrors.email}</span>}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-label-sm text-[11px] font-bold text-[#8f8f95] uppercase">Company Name *</label>
                            <input
                              className={`w-full h-11 px-3 bg-white border rounded-xl focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] outline-none ${formErrors.company ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]' : 'border-[#ececec]'}`}
                              placeholder="e.g. Acme Corp"
                              type="text"
                              value={form.company}
                              onChange={(e) => setForm({ ...form, company: e.target.value })}
                            />
                            {formErrors.company && <span className="text-[11px] text-[#ba1a1a] font-bold">{formErrors.company}</span>}
                          </div>

                          <div className="space-y-1">
                            <label className="font-label-sm text-[11px] font-bold text-[#8f8f95] uppercase">Service Interest</label>
                            <div className="relative">
                              <select
                                value={form.service}
                                onChange={(e) => setForm({ ...form, service: e.target.value })}
                                className="w-full h-11 px-3 bg-white border border-[#ececec] rounded-xl focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] outline-none appearance-none"
                              >
                                <option value="Pipeline Automation">Pipeline Automation</option>
                                <option value="Strategic Consulting">Strategic Consulting</option>
                                <option value="Data Migration">Data Migration</option>
                                <option value="Enterprise Integration">Enterprise Integration</option>
                                <option value="Other">Other</option>
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-[#8f8f95]">
                                <span className="material-symbols-outlined">arrow_drop_down</span>
                              </div>
                            </div>
                            {form.service === 'Other' && (
                              <input
                                type="text"
                                required
                                placeholder="Please specify your service interest..."
                                value={form.customService || ''}
                                onChange={(e) => setForm({ ...form, customService: e.target.value })}
                                className="w-full h-11 px-3 bg-white border border-[#ececec] rounded-xl focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] outline-none mt-2"
                              />
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="font-label-sm text-[11px] font-bold text-[#8f8f95] uppercase">Phone Number</label>
                            <input
                              className="w-full h-11 px-3 bg-white border border-[#ececec] rounded-xl focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] outline-none"
                              placeholder="+1 (555) 000-0000"
                              type="tel"
                              value={form.phone}
                              onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="font-label-sm text-[11px] font-bold text-[#8f8f95] uppercase">Message / Project Brief *</label>
                          <textarea
                            className={`w-full p-3 bg-white border rounded-xl focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] outline-none resize-none ${formErrors.message ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]' : 'border-[#ececec]'}`}
                            placeholder="Tell us about your project or goals..."
                            rows="4"
                            value={form.message}
                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                          />
                          {formErrors.message && <span className="text-[11px] text-[#ba1a1a] font-bold">{formErrors.message}</span>}
                        </div>
                        <button className="w-full h-12 bg-[#1769ff] hover:bg-[#0054e6] text-white font-bold text-[14px] rounded-xl transition-all active:scale-[0.98] mt-4 shadow-md shadow-[#1769ff]/10" type="submit">
                          Submit Inquiry
                        </button>
                      </form>
                    </div>
                  </section>

                  {/* Sidebar Info/Assets */}
                  <aside className="lg:col-span-5 space-y-6 text-left">
                    <div className="relative rounded-3xl overflow-hidden aspect-video group shadow-sm">
                      <img className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" alt="A clean, minimalist high-tech office workspace" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-2KatANIN_BUgiTLawk3PKRYrutggzaaWfyfJ-cfwxsF9lbg492Ct3WUTq84AE0TRxLUzbU6UGUoIFd5kzb9NIgVZbyxzSV4jDczmZNfCtxHTfF0Qw7CTvLhFPCnZ6Lp_zxzqymSJhj2uVn8lf3GrNjckt84vOX5WZaTcnRCwyZ8G6SwMTfzhwjhDUjyDn4zcnTDW85Ev497laRxBsFO7JJgTInDvx8AiBliLKgwyUVBt4ufcR3bKdP3mlcEJyu7PVpS-6o-Coa6n" />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent flex flex-col justify-end p-6">
                        <p className="text-white font-headline-md text-[20px] font-black">Fast-Track Your Growth</p>
                        <p className="text-white/80 font-body-sm text-[12px] font-medium">Typical response time: Under 4 hours</p>
                      </div>
                    </div>

                    <div className="bg-[#f3f3f5] border border-[#ececec]/50 p-6 rounded-3xl text-black">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-[#1769ff]/10 text-[#1769ff] rounded-xl flex items-center justify-center">
                          <span className="material-symbols-outlined">support_agent</span>
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-black leading-snug">Personalized Support</p>
                          <p className="text-[12px] text-[#8f8f95]">We're here to help you scale.</p>
                        </div>
                      </div>
                      <p className="text-[13px] italic text-[#444] leading-relaxed">"TezX has completely transformed how we handle our inbound lead strategy. The automation is flawless."</p>
                      <div className="flex items-center gap-2 mt-4">
                        <div className="w-8 h-8 rounded-full bg-[#1769ff]/10 border border-[#1769ff]/20 flex items-center justify-center overflow-hidden">
                          <img alt="Customer" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnLxCc6nfziOngNuk9gHus68n-756YuA9HQNEliWVgIM9bDTabn3BqbSPt6Xk5IU9de-zp_kQcS0zuJUYe-sRLLJPpGDTZlVbkK7yQ_P_gzon5L2Es7cYkneWDMeMgsw6EGVqw3y6a3t8DLPiXH9JLjuFYoQ13JhFEH0LUMr_YOUdx71ZsbqdCT4_qgUppP-h_66--WKTKWxqvtlzbCMJyGjQ6pmg96THL4FvPf_FYjng8tN_l-nn0r-YxdiFO7fOQIaz7K39Vf1gt" />
                        </div>
                        <span className="text-[12px] font-bold text-black">Marcus Thorne, CTO @ NexGen</span>
                      </div>
                    </div>
                  </aside>
                </div>
              </main>

              {/* Inquiry Status Dashboard */}
              <section className="mt-12 text-left max-w-screen-xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-headline-md text-[22px] font-bold text-black tracking-tight">Recent Inquiries</h2>
                    <p className="text-[13px] text-[#8f8f95]">Monitor progression stages of submitted client tickets.</p>
                  </div>
                  <div className="flex items-center gap-1 text-[#1769ff] cursor-pointer hover:underline font-bold text-[13px]">
                    <span className="material-symbols-outlined text-[18px]">history</span>
                    <span>Live Tracking</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {leads.slice(0, 4).map((lead) => {
                    const step = getStepperStatus(lead.stage);
                    return (
                      <div key={lead.id} className="bg-white border border-[#ececec] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <p className="text-[10px] font-extrabold text-[#8f8f95] uppercase tracking-wider mb-1">REF: #{lead.id.slice(-6).toUpperCase()}</p>
                            <h3 className="text-[16px] font-extrabold text-[#111111] truncate max-w-[260px]">{lead.company}</h3>
                            <p className="text-[12px] text-[#8f8f95] font-semibold">{lead.project}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] tracking-wide ${lead.stage === 'success'
                            ? 'bg-[#e2f9ee] text-[#107c41]'
                            : 'bg-[#f3f3f5] text-[#444]'
                            }`}>
                            {getStageLabel(lead.stage)}
                          </span>
                        </div>

                        {/* Responsive Stepper Tracker */}
                        <div className="relative pt-6 pb-2">
                          {/* Stepper bar background */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-[#f3f3f5] rounded-full">
                            <div className="h-full bg-[#1769ff] rounded-full transition-all duration-500" style={{ width: `${step.percent}%` }} />
                          </div>

                          <div className="flex justify-between -mt-3.5 relative">
                            {/* Step 1 */}
                            <div className="flex flex-col items-center gap-1.5 w-1/3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ring-4 ring-white shadow-sm transition-all duration-300 ${step.label1 === 'completed' || step.label1 === 'active' ? 'bg-[#1769ff]' : 'bg-[#f3f3f5] text-[#8f8f95]'
                                }`}>
                                <span className="material-symbols-outlined text-[13px]">check</span>
                              </div>
                              <span className={`text-[10px] font-extrabold ${step.label1 === 'active' ? 'text-[#1769ff]' : 'text-[#8f8f95]'
                                }`}>Submitted</span>
                            </div>
                            {/* Step 2 */}
                            <div className="flex flex-col items-center gap-1.5 w-1/3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ring-4 ring-white shadow-sm transition-all duration-300 ${step.label2 === 'completed' || step.label2 === 'active' ? 'bg-[#1769ff]' : 'bg-[#f3f3f5] text-[#8f8f95]'
                                }`}>
                                {step.label2 === 'completed' ? (
                                  <span className="material-symbols-outlined text-[13px]">check</span>
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                )}
                              </div>
                              <span className={`text-[10px] font-extrabold ${step.label2 === 'active' ? 'text-[#1769ff]' : 'text-[#8f8f95]'
                                }`}>Review Stage</span>
                            </div>
                            {/* Step 3 */}
                            <div className="flex flex-col items-center gap-1.5 w-1/3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ring-4 ring-white shadow-sm transition-all duration-300 ${step.label3 === 'completed' || step.label3 === 'active' ? 'bg-[#1769ff]' : 'bg-[#f3f3f5] text-[#8f8f95]'
                                }`}>
                                {step.label3 === 'completed' ? (
                                  <span className="material-symbols-outlined text-[13px]">check</span>
                                ) : (
                                  <div className="w-1.5 h-1.5 bg-current rounded-full opacity-30" />
                                )}
                              </div>
                              <span className={`text-[10px] font-extrabold ${step.label3 === 'active' ? 'text-[#1769ff]' : 'text-[#8f8f95]'
                                }`}>Meeting Setup</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-[#ececec]/60 flex justify-between items-center">
                          <div className="flex items-center gap-1 text-[#8f8f95] text-[12px] font-bold">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                            <span>{lead.time}</span>
                          </div>
                          <span className="text-[12px] font-extrabold text-[#1769ff]">Sync: Live</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: CLIENT WORKSPACE VIEW */}
          {activeTab === 'workspace' && (
            <div className="animate-in fade-in duration-300 text-left max-w-screen-xl mx-auto">

              {/* Workspace Dashboard Header */}
              <div className="mb-8 bg-gradient-to-r from-gray-900 via-slate-800 to-black text-white p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute inset-0 bg-white/5 opacity-40 blur-sm pointer-events-none" />
                <div className="relative z-10">
                  <span className="text-[11px] font-extrabold tracking-wider uppercase bg-[#1769ff] px-2.5 py-1 rounded-full text-white">Client Portal active</span>
                  <h2 className="text-[32px] font-black tracking-tight mt-2 leading-none">Tez<span className="text-[#1769ff]">X</span> CRM Workspace</h2>
                  <p className="text-white/70 text-[13px] font-medium mt-1">Real-time synchronized records representing active deployments.</p>
                </div>
                <div className="grid grid-cols-3 gap-6 relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
                  <div className="text-center">
                    <span className="text-[11px] font-bold text-white/60 block uppercase">Projects</span>
                    <span className="text-[20px] font-extrabold text-white">{projects.length}</span>
                  </div>
                  <div className="text-center px-4 border-x border-white/10">
                    <span className="text-[11px] font-bold text-white/60 block uppercase">Budget Monitored</span>
                    <span className="text-[20px] font-extrabold text-white">${totalBudgetVal.toLocaleString()}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-bold text-white/60 block uppercase">Completed</span>
                    <span className="text-[20px] font-extrabold text-[#6ffbbe]">{projects.filter(p => p.status === 'Completed').length}</span>
                  </div>
                </div>
              </div>

              {/* Workspace Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Active Deliverable Projects Column */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  <h3 className="text-[18px] font-extrabold text-[#111111] flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-[#1769ff]">running_with_errors</span>
                    Active Deployments & Scopes
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projects.map((project) => {
                      const pct = getProgressPercentage(project.status);
                      return (
                        <div key={project.id} className="bg-white border border-[#ececec] rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-[#1769ff]/20 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <span className="px-2 py-0.5 bg-[#f3f3f5] rounded text-[11px] font-extrabold text-[#111111]">
                                🏢 {project.company}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${project.status === 'Completed' ? 'bg-[#e2f9ee] text-[#107c41]' :
                                project.status === 'In Progress' ? 'bg-[#1769ff]/10 text-[#1769ff]' : 'bg-[#ffb11a]/15 text-[#b27200]'
                                }`}>
                                {project.status}
                              </span>
                            </div>

                            <h4 className="text-[16px] font-extrabold text-[#111111] mb-2">{project.name}</h4>
                            {project.description && (
                              <p className="text-[12px] text-[#8f8f95] leading-relaxed mb-4 line-clamp-2">{project.description}</p>
                            )}

                            {/* Progression Bar */}
                            <div className="mb-4">
                              <div className="flex justify-between text-[11px] font-bold text-black mb-1">
                                <span>Milestone Progress</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-[#f3f3f5] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${project.status === 'Completed' ? 'bg-[#107c41]' :
                                    project.status === 'In Progress' ? 'bg-[#1769ff]' : 'bg-[#ffb11a]'
                                    }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 border-t border-[#ececec]/50 pt-4 mt-2 text-[12px]">
                            <div>
                              <span className="text-[10px] font-bold text-[#8f8f95] block uppercase">Deal Budget</span>
                              <span className="font-extrabold text-[#111111] text-[14px]">{project.budget}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-[#8f8f95] block uppercase">Target Date</span>
                              <span className="font-semibold text-black">{project.deadline}</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#ececec]/40 flex justify-between items-center text-[12px]">
                            <span className="font-bold text-[#8f8f95]">Owner Representative:</span>
                            <span className="font-extrabold text-black">{project.owner}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Assigned Owner Contacts Column */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <h3 className="text-[18px] font-extrabold text-[#111111] flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-[#1769ff]">engineering</span>
                    Your Tez<span className="text-[#1769ff]">X</span> Roster
                  </h3>

                  <div className="bg-[#f3f3f5]/50 border border-[#ececec] rounded-3xl p-6 flex flex-col gap-4">
                    {people.length > 0 ? (
                      people.slice(0, 4).map(person => (
                        <div key={person.id} className="bg-white border border-[#ececec] rounded-2xl p-4 shadow-sm flex items-center gap-3">
                          {person.avatar && person.avatar.startsWith('http') ? (
                            <img src={person.avatar} alt={person.name} className="w-10 h-10 rounded-full object-cover border border-[#ececec]" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#e2dfff] text-[#3323cc] text-[12px] flex items-center justify-center font-bold border border-[#e2dfff]">
                              {person.avatar || 'PP'}
                            </div>
                          )}
                          <div>
                            <h5 className="text-[13px] font-bold text-black leading-snug">{person.name}</h5>
                            <p className="text-[11px] text-[#8f8f95]">{person.role} ({person.company})</p>
                            <a href={`mailto:${person.email}`} className="text-[11px] text-[#1769ff] font-bold hover:underline">{person.email}</a>
                          </div>
                        </div>
                      ))
                    ) : (
                      /* Roster Empty fallback */
                      <div className="text-center py-8 text-[#8f8f95]">
                        <span className="text-2xl mb-2 block">💼</span>
                        <p className="text-[12px]">No team representatives currently synced. Staff updates show here.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <footer className="border-t border-[#ececec] mt-auto py-6 flex-shrink-0 bg-white">
          <div className="max-w-screen-xl mx-auto px-10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-[#8f8f95] font-body-sm text-[13px]">© 2026 Tez<span className="text-[#1769ff]">X</span>. All rights reserved.</div>
            <div className="flex gap-6">
              <button onClick={() => setFooterModal('privacy')} className="font-label-sm text-[12px] font-bold text-[#8f8f95] hover:text-[#1769ff] transition-colors cursor-pointer outline-none">Privacy Policy</button>
              <button onClick={() => setFooterModal('terms')} className="font-label-sm text-[12px] font-bold text-[#8f8f95] hover:text-[#1769ff] transition-colors cursor-pointer outline-none">Terms of Service</button>
              <button onClick={() => setFooterModal('support')} className="font-label-sm text-[12px] font-bold text-[#8f8f95] hover:text-[#1769ff] transition-colors cursor-pointer outline-none">Contact Support</button>
            </div>
          </div>
        </footer>

      </div>

      {/* FOOTER DIALOG MODALS */}
      {footerModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setFooterModal(null)}></div>
          <div className="bg-white border border-[#ececec] rounded-2xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="px-6 py-4 border-b border-[#ececec] flex items-center justify-between">
              <div>
                <h3 className="text-[18px] font-bold text-[#111111] capitalize">
                  {footerModal === 'privacy' && 'Privacy Policy'}
                  {footerModal === 'terms' && 'Terms of Service'}
                  {footerModal === 'support' && 'Contact Support Desk'}
                </h3>
                <p className="text-[12px] text-[#8f8f95]">
                  {footerModal === 'privacy' && 'Learn how we manage and secure client database assets'}
                  {footerModal === 'terms' && 'Guidelines and terms of using TezX CRM frameworks'}
                  {footerModal === 'support' && 'Reach out directly to the TezX core desk'}
                </p>
              </div>
              <button onClick={() => setFooterModal(null)} className="text-[#8f8f95] hover:text-[#ba1a1a] transition-colors p-1 rounded-full hover:bg-[#f5f5f6]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto font-body-sm text-[13px] text-[#444] space-y-4 leading-relaxed">
              {footerModal === 'privacy' && (
                <>
                  <h4 className="font-extrabold text-[#111111] text-[14px]">1. Data Governance & Syncing</h4>
                  <p>TezX operates a localized browser-based sandbox using browser-managed <code>localStorage</code> database engines. All lead, contact, company, and project listings remain locally controlled and are not transferred to outer systems without explicit REST integrations.</p>
                  <h4 className="font-extrabold text-[#111111] text-[14px]">2. Encryption & Client Isolation</h4>
                  <p>Client records submitted through inquiry desks are isolated to the active machine environment. If you connect Google Workspace or MS Outlook in the settings pane, email exchanges undergo SSL encryption before syncing with leads.</p>
                  <h4 className="font-extrabold text-[#111111] text-[14px]">3. Your Controls</h4>
                  <p>You can erase your synchronized databases at any time by wiping browser caches, or utilizing the 'Reset Engine' parameters within the admin configuration panel.</p>
                </>
              )}

              {footerModal === 'terms' && (
                <>
                  <h4 className="font-extrabold text-[#111111] text-[14px]">1. SaaS Agreement & Scope</h4>
                  <p>By launching project deliverable trackers on the TezX platform, client institutions agree to comply with our local service scopes. All milestones are calculated at local engine latency levels (averaging 0.8ms under standard V8 engines).</p>
                  <h4 className="font-extrabold text-[#111111] text-[14px]">2. Acceptable Implementations</h4>
                  <p>Users must not upload base64 images exceeding 2MB under avatar settings, to avoid memory footprint issues or localStorage quota boundaries.</p>
                  <h4 className="font-extrabold text-[#111111] text-[14px]">3. Liability Disclaimer</h4>
                  <p>TezX CRM local sandbox is built as a pairing framework. Final project milestones, budgets, and invoices undergo standard validation procedures outside this local application scope.</p>
                </>
              )}

              {footerModal === 'support' && (
                <>
                  {supportSuccess ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-3 text-center animate-in fade-in duration-300">
                      <span className="material-symbols-outlined text-[48px] text-[#107c41]">check_circle</span>
                      <h4 className="font-bold text-[16px] text-black">Support Ticket Registered!</h4>
                      <p className="text-[12px] text-[#8f8f95] max-w-[280px]">Your ticket has been placed into the admin inbox. Typical response: under 4 hours.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSupportSubmit} className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Subject *</label>
                        <input
                          type="text"
                          required
                          value={supportForm.subject}
                          onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                          placeholder="e.g. Question about pipeline integrations"
                          className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all text-[13px]"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Message Details *</label>
                        <textarea
                          required
                          rows="4"
                          value={supportForm.message}
                          onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                          placeholder="Explain what help you need..."
                          className="w-full p-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all text-[13px] resize-none"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setFooterModal(null)}
                          className="px-4 py-2 text-[#8f8f95] hover:bg-[#f5f5f6] font-bold text-[13px] rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[#1769ff] hover:bg-[#0054e6] text-white font-bold text-[13px] rounded-xl transition-all shadow-md shadow-[#1769ff]/10"
                        >
                          Submit Ticket
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserPortal;
