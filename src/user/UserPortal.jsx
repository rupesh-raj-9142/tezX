import React, { useState, useEffect } from 'react';
import { sb, supabase } from '../utils/supabase';

function UserPortal() {
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'inquiry', or 'workspace'
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

  // Derived invoices dynamically from projects database
  const invoices = projects.map(p => {
    const amountVal = parseFloat(String(p.budget || '').replace(/[^0-9.]/g, '')) || 5000;
    const isPaid = (p.status || '').toLowerCase() === 'completed';

    // Format deadline
    let dueDateStr = 'June 15, 2026';
    if (p.deadline) {
      const date = new Date(p.deadline);
      if (!isNaN(date.getTime())) {
        dueDateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      } else {
        dueDateStr = p.deadline;
      }
    }

    return {
      id: p.id ? `inv-${String(p.id).replace('project-', '')}` : `inv-${Math.random().toString(36).substring(2, 6)}`,
      name: p.name,
      amount: amountVal,
      status: isPaid ? 'Paid' : 'Pending',
      dueDate: dueDateStr,
      company: p.company,
      paidDate: isPaid ? 'Recently' : undefined,
      projectId: p.id
    };
  });

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cardForm, setCardForm] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [cardErrors, setCardErrors] = useState({});
  const [invoiceSubTab, setInvoiceSubTab] = useState('all'); // 'all', 'pending', 'paid'
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [paymentStep, setPaymentStep] = useState(0); // 0 = idle, 1 = connecting, 2 = verifying, 3 = authorizing, 4 = complete
  const [showReceipt, setShowReceipt] = useState(false);
  const [authRef, setAuthRef] = useState('');
  const [paymentDate, setPaymentDate] = useState('');

  const getCardBrand = (number) => {
    const cleaned = number.replace(/\s+/g, '');
    if (cleaned.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(cleaned) || /^(222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[0-1]\d|2720)/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'discover';
    return 'generic';
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    // Validate card inputs
    const errors = {};
    if (!cardForm.name.trim()) errors.name = 'Cardholder Name is required';
    
    const sanitizedNumber = cardForm.number.replace(/\s+/g, '');
    if (!sanitizedNumber) {
      errors.number = 'Card Number is required';
    } else if (!/^\d{16}$/.test(sanitizedNumber)) {
      errors.number = 'Must be a 16-digit card number';
    }

    if (!cardForm.expiry.trim()) {
      errors.expiry = 'Expiry Date is required';
    } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardForm.expiry)) {
      errors.expiry = 'Use MM/YY format';
    }

    if (!cardForm.cvv.trim()) {
      errors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(cardForm.cvv)) {
      errors.cvv = 'Must be 3 or 4 digits';
    }

    if (Object.keys(errors).length > 0) {
      setCardErrors(errors);
      return;
    }

    setCardErrors({});
    setPaymentLoading(true);
    setPaymentStep(1);

    // Multi-step animated verification sequence
    setTimeout(() => {
      setPaymentStep(2); // Verifying
      setTimeout(() => {
        setPaymentStep(3); // Authorizing
        setTimeout(() => {
          setPaymentStep(4); // Finalizing
          setTimeout(() => {
            setPaymentLoading(false);
            setPaymentStep(0);
            setPaymentSuccess(true);
            setShowReceipt(true);
            setAuthRef(Math.random().toString(36).substring(2, 8).toUpperCase());
            setPaymentDate(new Date().toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            }));
            
            // 1. Optimistically update local project status to Completed (which updates derived invoice to Paid)
            setProjects(prev => prev.map(p => {
              if (p.id === selectedInvoice.projectId) {
                return { ...p, status: 'Completed' };
              }
              return p;
            }));

            // 2. Perform background database synchronization
            const updateProjectInDb = async () => {
              try {
                await sb.projects.update(selectedInvoice.projectId, {
                  status: 'Completed'
                });
              } catch (err) {
                console.error("Failed to update project status in Supabase:", err);
              }
            };
            updateProjectInDb();
          }, 800);
        }, 1000);
      }, 1000);
    }, 1000);
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
    <div className="bg-white font-body-md text-[#111111] w-screen h-screen flex flex-col overflow-hidden selection:bg-brand-blue/10">
      {/* Centered Main Wrapper Container - Fullscreen view */}
      <div className="w-full h-full bg-white overflow-hidden flex flex-col">

        {/* TopAppBar - Responsive Padding */}
        <header className="bg-white border-b border-[#ececec] h-20 flex-shrink-0 flex items-center">
          <div className="flex justify-between items-center w-full px-4 md:px-10 h-full">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center shadow-md relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-black" />
                <div className="w-3.5 h-3.5 bg-white absolute rotate-12 rounded-sm" />
              </div>
              <span className="text-[28px] sm:text-[32px] font-black tracking-tight font-poppins flex items-center select-none">
                <span className="text-black">Tez</span><span className="text-[#1769ff]">X</span>
              </span>
            </div>

            {/* Premium Center Segmented Navigation Tabs - Responsive text hiding */}
            <div className="bg-[#f3f3f5] rounded-xl p-1 flex gap-1 border border-[#ececec] mx-2 sm:mx-4 select-none">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-3 sm:px-5 py-2 rounded-lg text-[13px] sm:text-[14px] font-extrabold transition-all flex items-center gap-1.5 ${activeTab === 'home'
                  ? 'bg-white shadow-sm text-[#1769ff]'
                  : 'text-[#8f8f95] hover:bg-black/5 hover:text-black'
                  }`}
              >
                <span className="material-symbols-outlined text-[18px]">home</span>
                <span className="hidden sm:inline">Home Desk</span>
              </button>
              <button
                onClick={() => setActiveTab('inquiry')}
                className={`px-3 sm:px-5 py-2 rounded-lg text-[13px] sm:text-[14px] font-extrabold transition-all flex items-center gap-1.5 ${activeTab === 'inquiry'
                  ? 'bg-white shadow-sm text-[#1769ff]'
                  : 'text-[#8f8f95] hover:bg-black/5 hover:text-black'
                  }`}
              >
                <span className="material-symbols-outlined text-[18px]">rate_review</span>
                <span className="hidden sm:inline">Inquiry Desk</span>
              </button>
              <button
                onClick={() => setActiveTab('status')}
                className={`px-3 sm:px-5 py-2 rounded-lg text-[13px] sm:text-[14px] font-extrabold transition-all flex items-center gap-1.5 ${activeTab === 'status'
                  ? 'bg-white shadow-sm text-[#1769ff]'
                  : 'text-[#8f8f95] hover:bg-black/5 hover:text-black'
                  }`}
              >
                <span className="material-symbols-outlined text-[18px]">track_changes</span>
                <span className="hidden sm:inline">Project Status</span>
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-3 sm:px-5 py-2 rounded-lg text-[13px] sm:text-[14px] font-extrabold transition-all flex items-center gap-1.5 ${activeTab === 'payments'
                  ? 'bg-white shadow-sm text-[#1769ff]'
                  : 'text-[#8f8f95] hover:bg-black/5 hover:text-black'
                  }`}
              >
                <span className="material-symbols-outlined text-[18px]">payments</span>
                <span className="hidden sm:inline">Payments</span>
              </button>
            </div>

            {/* Action buttons - Icon only on mobile to save layout spacing */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              <button
                onClick={() => supabase.auth.signOut()}
                className="flex items-center gap-1.5 py-2 px-3 sm:px-4 rounded-full font-semibold text-[13px] sm:text-[14px] bg-[#ffebee] text-[#ba1a1a] hover:bg-[#ffcdd2] cursor-pointer transition-all duration-200 border-none"
                title="Logout"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Container - Responsive Padding */}
        <div className="flex-grow overflow-y-auto p-4 md:p-10 bg-white">

          {/* TAB 0: HOME DESK DASHBOARD */}
          {activeTab === 'home' && (
            <div className="animate-in fade-in duration-300 space-y-8 text-left max-w-screen-xl mx-auto mb-10">

              {/* Premium Welcome Banner */}
              <div className="bg-gradient-to-r from-[#1769ff] to-[#3525cd] text-white p-8 rounded-[32px] shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 select-none">
                <div className="absolute inset-0 bg-white/5 opacity-40 blur-xs pointer-events-none" />
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
                <div className="relative z-10">
                  <span className="text-[10px] font-black tracking-widest bg-white/20 px-3 py-1 rounded-full text-white uppercase">TezX Hub Active</span>
                  <h1 className="text-[32px] sm:text-[38px] font-black tracking-tight mt-3 leading-none text-white">Welcome to your Portal</h1>
                  <p className="text-white/80 text-[13px] sm:text-[14px] font-medium mt-2">Submit briefs and track your active inquiries in real-time.</p>
                </div>
                <div className="relative z-10 flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-white/70 block uppercase">Inquiries</span>
                    <span className="text-[18px] font-black text-white">{leads.length}</span>
                  </div>
                  <div className="text-center px-4 border-l border-white/10">
                    <span className="text-[10px] font-bold text-white/70 block uppercase font-black tracking-wider">Unpaid Invoices</span>
                    <span className="text-[18px] font-black text-white">{invoices.filter(i => i.status === 'Pending').length}</span>
                  </div>
                </div>
              </div>

              {/* Bento Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Inquiry card */}
                <div className="bg-white border border-[#ececec] rounded-[28px] p-6 shadow-sm hover:shadow-md hover:border-[#1769ff]/30 transition-all flex flex-col justify-between group h-[220px]">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-[#1769ff]/10 text-[#1769ff] flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                      <span className="material-symbols-outlined text-[24px]">rate_review</span>
                    </div>
                    <span className="text-[10px] font-black text-[#8f8f95] uppercase tracking-wider">inquiry desk</span>
                  </div>
                  <div>
                    <h4 className="text-[16px] sm:text-[18px] font-black text-black leading-tight">Submit Inquiry Form</h4>
                    <p className="text-[12px] text-[#8f8f95] mt-1 leading-snug">Launch service briefs directly into active CRM pipelines.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('inquiry')}
                    className="w-full py-2.5 bg-[#f3f3f5] hover:bg-[#1769ff] hover:text-white text-black hover:text-white font-extrabold text-[12px] rounded-xl transition-all cursor-pointer border-none"
                  >
                    Open Inquiry Desk
                  </button>
                </div>

                {/* Project Status card */}
                <div className="bg-white border border-[#ececec] rounded-[28px] p-6 shadow-sm hover:shadow-md hover:border-[#1769ff]/30 transition-all flex flex-col justify-between group h-[220px]">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                      <span className="material-symbols-outlined text-[24px]">track_changes</span>
                    </div>
                    <span className="text-[10px] font-black text-[#8f8f95] uppercase tracking-wider">status tracker</span>
                  </div>
                  <div>
                    <h4 className="text-[16px] sm:text-[18px] font-black text-black leading-tight">Track Progress & Status</h4>
                    <p className="text-[12px] text-[#8f8f95] mt-1 leading-snug">Monitor if your projects/inquiries are accepted, won, or solved, and view active milestone progress.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('status')}
                    className="w-full py-2.5 bg-[#f3f3f5] hover:bg-[#1769ff] hover:text-white text-black hover:text-white font-extrabold text-[12px] rounded-xl transition-all cursor-pointer border-none"
                  >
                    Check Project Status
                  </button>
                </div>

                {/* Payments card */}
                <div className="bg-white border border-[#ececec] rounded-[28px] p-6 shadow-sm hover:shadow-md hover:border-[#1769ff]/30 transition-all flex flex-col justify-between group h-[220px]">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                      <span className="material-symbols-outlined text-[24px]">payments</span>
                    </div>
                    <span className="text-[10px] font-black text-[#8f8f95] uppercase tracking-wider">billing center</span>
                  </div>
                  <div>
                    <h4 className="text-[16px] sm:text-[18px] font-black text-black leading-tight">Billing & Payments</h4>
                    <p className="text-[12px] text-[#8f8f95] mt-1 leading-snug">Review active invoices, check past payments, and complete secure checkout transactions.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="w-full py-2.5 bg-[#f3f3f5] hover:bg-[#1769ff] hover:text-white text-black hover:text-white font-extrabold text-[12px] rounded-xl transition-all cursor-pointer border-none"
                  >
                    Manage Payments
                  </button>
                </div>
              </div>

              {/* Real-time Activity View */}
              <div className="grid grid-cols-1 gap-8 pt-6">
                {/* Recent Inquiries preview (full-width) */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[15px] sm:text-[16px] font-extrabold text-[#111111] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#1769ff]">history</span>
                      Recent Inquiries
                    </h3>
                    <button
                      onClick={() => setActiveTab('inquiry')}
                      className="text-[11px] font-bold text-[#1769ff] hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Submit new inquiry
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                    {leads.length > 0 ? (
                      leads.map((lead) => (
                        <div key={lead.id} className="bg-white border border-[#ececec] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="text-[14px] font-extrabold text-black truncate">{lead.company}</h4>
                            <p className="text-[12px] text-[#8f8f95] font-semibold truncate mt-0.5">{lead.project}</p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] whitespace-nowrap ${lead.stage === 'success' ? 'bg-[#e2f9ee] text-[#107c41]' : 'bg-[#f3f3f5] text-[#444]'
                            }`}>
                            {getStageLabel(lead.stage)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white border border-dashed border-[#ececec] rounded-2xl p-8 text-center text-[#8f8f95] text-[12px] bg-slate-50/20">
                        No inquiries submitted yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {/* TAB 2: PROJECT & INQUIRY STATUS TRACKER */}
          {activeTab === 'status' && (
            <div className="animate-in fade-in duration-300 text-left max-w-screen-xl mx-auto mb-10">

              {/* Status Header */}
              <div className="mb-8 bg-gradient-to-r from-sky-900 via-slate-800 to-black text-white p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="absolute inset-0 bg-white/5 opacity-40 blur-sm pointer-events-none" />
                <div className="relative z-10">
                  <span className="text-[11px] font-extrabold tracking-wider uppercase bg-[#1769ff] px-2.5 py-1 rounded-full text-white">Live Status Desk</span>
                  <h2 className="text-[32px] font-black tracking-tight mt-2 leading-none">Tez<span className="text-[#1769ff]">X</span> Progress Hub</h2>
                  <p className="text-white/70 text-[13px] font-medium mt-1">Real-time status of your ticket approvals and deliverable progress.</p>
                </div>
                <div className="grid grid-cols-2 gap-6 relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
                  <div className="text-center">
                    <span className="text-[11px] font-bold text-white/60 block uppercase font-bold tracking-wider">Inquiry Tickets</span>
                    <span className="text-[20px] font-extrabold text-white">{leads.length}</span>
                  </div>
                  <div className="text-center px-4 border-l border-white/10">
                    <span className="text-[11px] font-bold text-white/60 block uppercase font-bold tracking-wider font-extrabold text-white">Active Projects</span>
                    <span className="text-[20px] font-extrabold text-[#6ffbbe]">{projects.length}</span>
                  </div>
                </div>
              </div>

              {/* Progress Tracking Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Main Progress Board Column (left) */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                  
                  {/* Section 1: Active Projects & Delivery Progress */}
                  <div className="space-y-4">
                    <h3 className="text-[18px] font-extrabold text-[#111111] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#1769ff]">run_circle</span>
                      Accepted Projects & Progress
                    </h3>
                    
                    {projects.length > 0 ? (
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
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                                    project.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
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
                                      className={`h-full rounded-full ${project.status === 'Completed' ? 'bg-[#107c41]' : project.status === 'In Progress' ? 'bg-[#1769ff]' : 'bg-[#ffb11a]'}`}
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
                    ) : (
                      <div className="bg-white border border-dashed border-[#ececec] rounded-3xl p-10 text-center text-[#8f8f95] text-[13px] bg-slate-50/20">
                        <span className="material-symbols-outlined text-[36px] mb-2 text-[#8f8f95]/60">pending_actions</span>
                        <p className="font-extrabold text-black mb-1">No Accepted Projects Yet</p>
                        <p className="max-w-xs mx-auto text-[#8f8f95]">Once our core desk approves your inquiry brief, it will spawn here as a development scope.</p>
                      </div>
                    )}
                  </div>

                  {/* Section 2: Submitted Inquiries Tickets */}
                  <div className="space-y-4 pt-4 border-t border-[#ececec]/60">
                    <h3 className="text-[18px] font-extrabold text-[#111111] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#1769ff]">assignment</span>
                      Inquiry Tickets & Approvals
                    </h3>

                    {leads.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {leads.map((lead) => {
                          const step = getStepperStatus(lead.stage);
                          return (
                            <div key={lead.id} className="bg-white border border-[#ececec] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <p className="text-[10px] font-extrabold text-[#8f8f95] uppercase tracking-wider">REF: #{lead.id.slice(-6).toUpperCase()}</p>
                                    <h4 className="text-[16px] font-extrabold text-[#111111] mt-1 truncate max-w-[200px]">{lead.company}</h4>
                                    <p className="text-[12px] text-[#8f8f95] font-semibold">{lead.project}</p>
                                  </div>
                                  <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] tracking-wide ${
                                    lead.stage === 'success' || lead.stage === 'won'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-[#f3f3f5] text-[#444]'
                                  }`}>
                                    {getStageLabel(lead.stage)}
                                  </span>
                                </div>

                                {/* Stepper Tracker */}
                                <div className="relative pt-6 pb-2">
                                  <div className="absolute top-0 left-0 w-full h-1 bg-[#f3f3f5] rounded-full">
                                    <div className="h-full bg-[#1769ff] rounded-full transition-all duration-500" style={{ width: `${step.percent}%` }} />
                                  </div>

                                  <div className="flex justify-between -mt-3.5 relative">
                                    <div className="flex flex-col items-center gap-1.5 w-1/3">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ring-4 ring-white shadow-sm transition-all duration-300 ${step.label1 === 'completed' || step.label1 === 'active' ? 'bg-[#1769ff]' : 'bg-[#f3f3f5] text-[#8f8f95]'}`}>
                                        <span className="material-symbols-outlined text-[13px]">check</span>
                                      </div>
                                      <span className={`text-[10px] font-extrabold ${step.label1 === 'active' ? 'text-[#1769ff]' : 'text-[#8f8f95]'}`}>Submitted</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1.5 w-1/3">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ring-4 ring-white shadow-sm transition-all duration-300 ${step.label2 === 'completed' || step.label2 === 'active' ? 'bg-[#1769ff]' : 'bg-[#f3f3f5] text-[#8f8f95]'}`}>
                                        {step.label2 === 'completed' ? (
                                          <span className="material-symbols-outlined text-[13px]">check</span>
                                        ) : (
                                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        )}
                                      </div>
                                      <span className={`text-[10px] font-extrabold ${step.label2 === 'active' ? 'text-[#1769ff]' : 'text-[#8f8f95]'}`}>Review</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1.5 w-1/3">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ring-4 ring-white shadow-sm transition-all duration-300 ${step.label3 === 'completed' || step.label3 === 'active' ? 'bg-[#1769ff]' : 'bg-[#f3f3f5] text-[#8f8f95]'}`}>
                                        {step.label3 === 'completed' ? (
                                          <span className="material-symbols-outlined text-[13px]">check</span>
                                        ) : (
                                          <div className="w-1.5 h-1.5 bg-current rounded-full opacity-30" />
                                        )}
                                      </div>
                                      <span className={`text-[10px] font-extrabold ${step.label3 === 'active' ? 'text-[#1769ff]' : 'text-[#8f8f95]'}`}>Meeting Setup</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-6 pt-4 border-t border-[#ececec]/60 flex justify-between items-center text-[12px]">
                                <span className="font-bold text-[#8f8f95]">{lead.time}</span>
                                <span className="font-extrabold text-[#1769ff]">Pipeline Sync</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-white border border-dashed border-[#ececec] rounded-3xl p-10 text-center text-[#8f8f95] text-[13px]">
                        No inquiry tickets found. Visit Inquiry Desk to create one.
                      </div>
                    )}
                  </div>

                </div>

                {/* Assigned Owner Contacts Column (right) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  <h3 className="text-[18px] font-extrabold text-[#111111] flex items-center gap-2">
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
          {/* TAB 3: BILLING & SECURE PAYMENTS */}
          {activeTab === 'payments' && (() => {
            const filteredInvoices = invoices.filter(inv => {
              if (invoiceSubTab === 'pending') return inv.status === 'Pending';
              if (invoiceSubTab === 'paid') return inv.status === 'Paid';
              return true; // 'all'
            });

            return (
              <div className="animate-in fade-in duration-300 text-left max-w-screen-xl mx-auto mb-10">
                
                {/* Billing Header */}
                <div className="mb-8 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="absolute inset-0 bg-white/5 opacity-30 blur-sm pointer-events-none" />
                  <div className="relative z-10">
                    <span className="text-[11px] font-extrabold tracking-wider uppercase bg-amber-500 px-2.5 py-1 rounded-full text-black">Secure Invoicing</span>
                    <h2 className="text-[32px] font-black tracking-tight mt-2 leading-none">Billing Desk</h2>
                    <p className="text-white/70 text-[13px] font-medium mt-1">Review active invoices and settle payments via our end-to-end encrypted terminal.</p>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-6 relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-white/60 block uppercase">Outstanding</span>
                      <span className="text-[18px] font-extrabold text-[#ffb11a]">
                        ${invoices.filter(i => i.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-center px-4 border-x border-white/10">
                      <span className="text-[10px] font-bold text-white/60 block uppercase">Settled</span>
                      <span className="text-[18px] font-extrabold text-[#6ffbbe]">
                        ${invoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-white/60 block uppercase">Tickets</span>
                      <span className="text-[18px] font-extrabold text-white">{invoices.length}</span>
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Side: Invoice List */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="bg-white border border-[#ececec] rounded-3xl p-6 shadow-sm flex flex-col gap-5">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#ececec]/60 pb-4 gap-4">
                        <h3 className="text-[16px] font-extrabold text-[#111111] flex items-center gap-2">
                          <span className="material-symbols-outlined text-indigo-600">receipt_long</span>
                          Invoice Ledger
                        </h3>
                        {/* Sub Tab buttons */}
                        <div className="flex bg-[#f3f3f5] p-1 rounded-xl gap-1">
                          <button
                            onClick={() => setInvoiceSubTab('all')}
                            className={`px-3 py-1.5 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer border-none ${invoiceSubTab === 'all' ? 'bg-white text-black shadow-sm' : 'text-[#8f8f95] hover:text-black bg-transparent'}`}
                          >
                            All
                          </button>
                          <button
                            onClick={() => setInvoiceSubTab('pending')}
                            className={`px-3 py-1.5 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer border-none flex items-center gap-1.5 ${invoiceSubTab === 'pending' ? 'bg-white text-[#b27200] shadow-sm' : 'text-[#8f8f95] hover:text-[#b27200] bg-transparent'}`}
                          >
                            <span>Outstanding</span>
                            <span className={`px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[9px] font-black`}>
                              {invoices.filter(i => i.status === 'Pending').length}
                            </span>
                          </button>
                          <button
                            onClick={() => setInvoiceSubTab('paid')}
                            className={`px-3 py-1.5 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer border-none flex items-center gap-1.5 ${invoiceSubTab === 'paid' ? 'bg-white text-emerald-700 shadow-sm' : 'text-[#8f8f95] hover:text-emerald-700 bg-transparent'}`}
                          >
                            <span>Paid</span>
                            <span className={`px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[9px] font-black`}>
                              {invoices.filter(i => i.status === 'Paid').length}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Invoice list based on sub-tab */}
                      <div className="space-y-4">
                        {filteredInvoices.length > 0 ? (
                          filteredInvoices.map(inv => (
                            <div key={inv.id} className="bg-white border border-[#ececec] hover:border-[#1769ff]/20 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="px-2 py-0.5 bg-[#f3f3f5] rounded text-[10px] font-extrabold text-[#8f8f95]">
                                    #{inv.id.toUpperCase()}
                                  </span>
                                  <span className="text-[12px] font-bold text-[#8f8f95]">
                                    {inv.status === 'Paid' ? `Settle Date: ${inv.paidDate || 'Recently'}` : `Due Date: ${inv.dueDate}`}
                                  </span>
                                  {inv.status === 'Paid' ? (
                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-black tracking-wide uppercase border border-emerald-200">
                                      Paid
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[9px] font-black tracking-wide uppercase border border-amber-200 animate-pulse">
                                      Pending
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-[14px] font-extrabold text-black leading-snug">{inv.name}</h4>
                                <p className="text-[11px] text-[#8f8f95] font-semibold mt-0.5">Brief Account: {inv.company}</p>
                              </div>
                              
                              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                <span className="text-[16px] font-black text-black">${inv.amount.toLocaleString()}.00</span>
                                
                                {inv.status === 'Pending' ? (
                                  <button
                                    onClick={() => {
                                      setSelectedInvoice(inv);
                                      setIsCardFlipped(false);
                                      setCardErrors({});
                                    }}
                                    className={`px-4 py-2 text-[12px] font-extrabold rounded-xl transition-all cursor-pointer border-none flex items-center gap-1 bg-black text-white hover:bg-black/90 active:scale-[0.98]`}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">credit_card</span>
                                    <span>Pay Now</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedInvoice(inv);
                                      setAuthRef(`TX-AUTH-${inv.id.replace('inv-', '').toUpperCase()}`);
                                      setPaymentDate(inv.paidDate || 'Recently');
                                      setShowReceipt(true);
                                    }}
                                    className={`px-4 py-2 text-[12px] font-extrabold rounded-xl transition-all cursor-pointer border border-[#ececec] hover:bg-neutral-50 flex items-center gap-1 bg-white text-black active:scale-[0.98]`}
                                  >
                                    <span className="material-symbols-outlined text-[16px] text-emerald-600">receipt_long</span>
                                    <span>Receipt</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="bg-[#fcfdfd] border border-dashed border-[#ececec] rounded-2xl p-10 text-center text-[#8f8f95] text-[13px] bg-slate-50/10">
                            <span className="material-symbols-outlined text-[32px] text-[#8f8f95]/50 mb-2">inbox</span>
                            <p className="font-extrabold text-black mb-0.5">No Invoices Found</p>
                            <p className="text-[12px] text-[#8f8f95]">There are no invoices matching the selected filter tab.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Side: Secure Checkout Terminal */}
                  <div className="lg:col-span-5">
                    <div className="bg-white border border-[#ececec] rounded-3xl p-6 shadow-sm flex flex-col gap-6 relative overflow-hidden">
                      
                      {/* Security Badge */}
                      <div className="flex justify-between items-center pb-4 border-b border-[#ececec]">
                        <h3 className="text-[15px] font-extrabold text-black flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[#1769ff] text-[20px]">lock</span>
                          Secure Terminal
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 font-mono tracking-widest uppercase">AES-256 Bit</span>
                      </div>

                      {selectedInvoice && selectedInvoice.status === 'Pending' ? (
                        <form onSubmit={handlePaymentSubmit} className="space-y-5">
                          
                          {/* Selected Invoice details */}
                          <div className="bg-[#f0f9ff] border border-[#e0f2fe] rounded-2xl p-4 text-[13px] text-[#0369a1] text-left">
                            <span className="text-[10px] font-black block uppercase text-[#0284c7] tracking-wider mb-1">Paying Ticket</span>
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-bold text-[#0369a1]">{selectedInvoice.name}</h5>
                                <p className="text-[11px] text-[#0284c7] font-semibold mt-0.5">Reference: #{selectedInvoice.id.toUpperCase()}</p>
                              </div>
                              <span className="font-black text-[15px] text-[#0369a1]">${selectedInvoice.amount.toLocaleString()}.00</span>
                            </div>
                          </div>

                          {/* HIGH FIDELITY 3D INTERACTIVE CARD VISUAL */}
                          <div className="w-full aspect-[1.586/1] perspective-1000 select-none">
                            <div className={`w-full h-full relative transition-transform duration-700 transform-style-3d ${isCardFlipped ? 'rotate-y-180' : ''}`}>
                              
                              {/* Card Front */}
                              <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 flex flex-col justify-between shadow-lg border border-white/10 backface-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                                <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
                                
                                {/* Top Row */}
                                <div className="flex justify-between items-start">
                                  <span className="text-[10px] font-extrabold tracking-wider text-white/50 uppercase">TezX CRM Secure</span>
                                  {/* Card brand logo detector */}
                                  <div className="h-6 flex items-center justify-end">
                                    {getCardBrand(cardForm.number) === 'visa' && (
                                      <span className="text-[15px] font-black italic tracking-wide text-white bg-blue-600/30 px-2 py-0.5 rounded border border-blue-500/30">VISA</span>
                                    )}
                                    {getCardBrand(cardForm.number) === 'mastercard' && (
                                      <div className="flex -space-x-1.5 bg-white/5 p-1 rounded border border-white/10">
                                        <div className="w-4 h-4 rounded-full bg-[#eb001b]" />
                                        <div className="w-4 h-4 rounded-full bg-[#f79e1b] opacity-90" />
                                      </div>
                                    )}
                                    {getCardBrand(cardForm.number) === 'amex' && (
                                      <span className="text-[10px] font-black bg-sky-500 text-white px-2 py-0.5 rounded border border-sky-400/30 tracking-wider">AMEX</span>
                                    )}
                                    {getCardBrand(cardForm.number) === 'discover' && (
                                      <span className="text-[10px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded border border-orange-400/30 tracking-wide">DISCOVER</span>
                                    )}
                                    {getCardBrand(cardForm.number) === 'generic' && (
                                      <span className="material-symbols-outlined text-[20px] text-white/40">credit_card</span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Chip and wireless */}
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-7 rounded-md bg-gradient-to-br from-[#ffe082] to-[#ffb300] border border-amber-300 relative overflow-hidden flex items-center justify-center shadow-inner">
                                    <div className="absolute inset-y-0 left-1/3 w-[1px] bg-amber-900/10" />
                                    <div className="absolute inset-y-0 right-1/3 w-[1px] bg-amber-900/10" />
                                    <div className="absolute inset-x-0 top-1/3 h-[1px] bg-amber-900/10" />
                                    <div className="absolute inset-x-0 bottom-1/3 h-[1px] bg-amber-900/10" />
                                  </div>
                                  <span className="material-symbols-outlined text-[18px] text-white/40 rotate-90 leading-none">wifi</span>
                                </div>
                                
                                {/* Number */}
                                <div className="text-[18px] sm:text-[20px] font-black tracking-[0.15em] font-mono text-center select-all text-white/95 leading-none">
                                  {cardForm.number ? cardForm.number : '•••• •••• •••• ••••'}
                                </div>
                                
                                {/* Bottom Row */}
                                <div className="flex justify-between items-end text-left">
                                  <div className="min-w-0 pr-4">
                                    <span className="text-[8px] font-bold text-white/40 block uppercase tracking-wider">Cardholder</span>
                                    <span className="text-[12px] font-black tracking-wide truncate block text-white/90 uppercase">
                                      {cardForm.name ? cardForm.name : 'Cardholder Name'}
                                    </span>
                                  </div>
                                  <div className="flex gap-4 flex-shrink-0">
                                    <div>
                                      <span className="text-[8px] font-bold text-white/40 block uppercase tracking-wider">Expires</span>
                                      <span className="text-[12px] font-bold tracking-wide block text-white/90">
                                        {cardForm.expiry ? cardForm.expiry : 'MM/YY'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Card Back */}
                              <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 text-white py-6 flex flex-col justify-between shadow-lg border border-white/5 backface-hidden rotate-y-180 text-left">
                                <div className="w-full h-10 bg-neutral-900 mt-1" />
                                
                                <div className="px-6 flex items-center gap-4 mt-2">
                                  <div className="flex-1 h-9 bg-neutral-700/30 rounded flex items-center px-3 text-[10px] text-white/30 italic border border-white/5">
                                    Signature Panel
                                  </div>
                                  <div className="w-14 h-8 bg-white text-black font-mono font-bold text-[13px] flex items-center justify-center rounded shadow-inner">
                                    {cardForm.cvv ? cardForm.cvv : '•••'}
                                  </div>
                                </div>
                                
                                <p className="px-6 text-[7px] text-white/35 leading-normal">
                                  This card is a simulated secure testing instrument. Do not submit actual credit card parameters. Demo transactions only.
                                </p>
                              </div>

                            </div>
                          </div>

                          {/* Input Fields */}
                          <div className="space-y-3 text-left">
                            
                            {/* Cardholder Name */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-[#8f8f95] uppercase">Cardholder Name</label>
                              <input
                                type="text"
                                placeholder="Alex Rivers"
                                value={cardForm.name}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                  setCardForm({ ...cardForm, name: val });
                                }}
                                className={`w-full h-10 px-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-[13px] ${cardErrors.name ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]' : 'border-[#ececec]'}`}
                              />
                              {cardErrors.name && <span className="text-[11px] text-[#ba1a1a] font-bold">{cardErrors.name}</span>}
                            </div>

                            {/* Card Number */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-[#8f8f95] uppercase">Card Number</label>
                              <input
                                type="text"
                                maxLength="19"
                                placeholder="4111 1111 1111 1111"
                                value={cardForm.number}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  const formatted = val.match(/.{1,4}/g)?.join(' ') || '';
                                  setCardForm({ ...cardForm, number: formatted });
                                }}
                                className={`w-full h-10 px-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-[13px] font-mono ${cardErrors.number ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]' : 'border-[#ececec]'}`}
                              />
                              {cardErrors.number && <span className="text-[11px] text-[#ba1a1a] font-bold">{cardErrors.number}</span>}
                            </div>

                            {/* Expiry & CVV */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#8f8f95] uppercase">Expiration Date</label>
                                <input
                                  type="text"
                                  maxLength="5"
                                  placeholder="MM/YY"
                                  value={cardForm.expiry}
                                  onChange={(e) => {
                                    let val = e.target.value.replace(/\D/g, '');
                                    if (val.length > 2) {
                                      val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                                    }
                                    setCardForm({ ...cardForm, expiry: val });
                                  }}
                                  className={`w-full h-10 px-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-[13px] ${cardErrors.expiry ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]' : 'border-[#ececec]'}`}
                                />
                                {cardErrors.expiry && <span className="text-[11px] text-[#ba1a1a] font-bold">{cardErrors.expiry}</span>}
                              </div>
                              
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[#8f8f95] uppercase">CVV / CVC</label>
                                <input
                                  type="text"
                                  maxLength="4"
                                  placeholder="123"
                                  value={cardForm.cvv}
                                  onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '') })}
                                  onFocus={() => setIsCardFlipped(true)}
                                  onBlur={() => setIsCardFlipped(false)}
                                  className={`w-full h-10 px-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-[13px] font-mono ${cardErrors.cvv ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]' : 'border-[#ececec]'}`}
                                />
                                {cardErrors.cvv && <span className="text-[11px] text-[#ba1a1a] font-bold">{cardErrors.cvv}</span>}
                              </div>
                            </div>
                          </div>

                          {/* Invoice Checkout Detail Breakdown */}
                          <div className="border-t border-[#ececec] pt-4 mt-2 text-[12px] space-y-1 text-left text-neutral-600">
                            <div className="flex justify-between">
                              <span>Service Settle Charge</span>
                              <span className="font-bold text-black">${selectedInvoice.amount.toLocaleString()}.00</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Gateway Processing Fee</span>
                              <span className="font-bold text-black">$0.00</span>
                            </div>
                            <div className="flex justify-between text-[14px] font-black text-black pt-2 border-t border-[#ececec]/50">
                              <span>Amount Due</span>
                              <span className="text-indigo-600">${selectedInvoice.amount.toLocaleString()}.00 USD</span>
                            </div>
                          </div>

                          {/* Pay Button */}
                          <button
                            type="submit"
                            disabled={paymentLoading}
                            className="w-full h-12 bg-black hover:bg-black/90 text-white font-extrabold text-[13px] rounded-xl transition-all shadow-md shadow-black/10 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer border-none active:scale-[0.99]"
                          >
                            {paymentLoading ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                                <span>Pay ${selectedInvoice.amount.toLocaleString()}.00 Securely</span>
                              </>
                            )}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(null)}
                            className="w-full text-center text-[12px] font-bold text-[#8f8f95] hover:text-black transition-colors bg-transparent border-none cursor-pointer p-0"
                          >
                            Cancel Checkout
                          </button>
                        </form>
                      ) : (
                        <div className="text-center py-16 text-[#8f8f95] flex flex-col items-center justify-center gap-2.5">
                          <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 text-indigo-500 rounded-2xl flex items-center justify-center shadow-sm">
                            <span className="material-symbols-outlined text-[28px]">payments</span>
                          </div>
                          <h4 className="font-extrabold text-black text-[15px] mt-2">Ready to Checkout</h4>
                          <p className="max-w-xs text-[12px] leading-relaxed text-[#8f8f95]">Select an unsettled invoice from the list on the left to initialize the secure payment gateway terminal.</p>
                        </div>
                      )}
                      
                      {/* Detailed Multi-Step Loading Overlay */}
                      {paymentLoading && (
                        <div className="absolute inset-0 bg-white/95 rounded-3xl flex flex-col items-center justify-center text-center p-6 z-30 transition-all duration-300">
                          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4" />
                          <h4 className="font-extrabold text-[15px] text-black">Processing Transaction</h4>
                          <p className="text-[12px] text-[#8f8f95] mt-1 h-5 animate-pulse">
                            {paymentStep === 1 && "Connecting to payment gateway..."}
                            {paymentStep === 2 && "Verifying card credentials..."}
                            {paymentStep === 3 && "Authorizing charge amount..."}
                            {paymentStep === 4 && "Finalizing database settlement..."}
                          </p>
                          
                          {/* Stepper Progress Bar */}
                          <div className="w-48 h-1.5 bg-[#f3f3f5] rounded-full overflow-hidden mt-4 border border-neutral-100">
                            <div 
                              className="h-full bg-black rounded-full transition-all duration-500" 
                              style={{ width: `${paymentStep * 25}%` }}
                            />
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                </div>

                {/* HIGH-FIDELITY PRINTABLE RECEIPT MODAL */}
                {showReceipt && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col p-8 text-black printable-receipt-modal border border-neutral-100">
                      
                      {/* Receipts Top branding */}
                      <div className="flex justify-between items-start border-b border-dashed border-[#ececec] pb-6 mb-6">
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[20px] font-black text-black">Tez<span className="text-[#1769ff]">X</span></span>
                            <span className="text-[10px] font-extrabold bg-[#e2f9ee] text-[#107c41] px-2 py-0.5 rounded-full border border-emerald-200">OFFICIAL RECEIPT</span>
                          </div>
                          <p className="text-[11px] text-[#8f8f95] mt-1">TezX CRM Solutions LLC</p>
                          <p className="text-[10px] text-[#8f8f95]">100 Pine Street, San Francisco, CA 94111</p>
                        </div>
                        <div className="text-right text-left-rtl">
                          <p className="text-[10px] font-extrabold text-[#8f8f95] uppercase tracking-wider">Receipt No</p>
                          <p className="text-[14px] font-extrabold text-black font-mono">#TX-{selectedInvoice?.id.replace('inv-', '').toUpperCase()}</p>
                          <p className="text-[10px] text-[#8f8f95] mt-1">{paymentDate}</p>
                        </div>
                      </div>

                      {/* Decorative Diagonal "PAID" stamp */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-[0.08] pointer-events-none select-none border-[10px] border-emerald-600 rounded-2xl p-4 flex flex-col items-center justify-center w-64 h-32">
                        <span className="text-[48px] font-black tracking-[0.2em] text-emerald-600 leading-none">PAID</span>
                        <span className="text-[12px] font-bold text-emerald-600 tracking-widest mt-1">SETTLED IN CRM</span>
                      </div>

                      {/* Settle Details */}
                      <div className="space-y-4 relative z-10 flex-1 text-left">
                        <div>
                          <h4 className="text-[11px] font-extrabold text-[#8f8f95] uppercase tracking-wider mb-2">Billing Information</h4>
                          <div className="bg-[#f8f9fa] rounded-2xl p-4 border border-[#ececec]/60 text-[12px] space-y-1">
                            <div className="flex justify-between"><span className="text-[#8f8f95] font-semibold">Client Representative:</span><span className="font-extrabold text-black">{cardForm.name || 'Client Representative'}</span></div>
                            <div className="flex justify-between"><span className="text-[#8f8f95] font-semibold">Company Account:</span><span className="font-extrabold text-black">{selectedInvoice?.company || 'N/A'}</span></div>
                            <div className="flex justify-between"><span className="text-[#8f8f95] font-semibold">Payment Method:</span><span className="font-extrabold text-black uppercase">{getCardBrand(cardForm.number)} Card (•••• {cardForm.number.slice(-4)})</span></div>
                            <div className="flex justify-between"><span className="text-[#8f8f95] font-semibold">Authorization Reference:</span><span className="font-extrabold text-black font-mono">{authRef}</span></div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[11px] font-extrabold text-[#8f8f95] uppercase tracking-wider mb-2">Itemized Transaction</h4>
                          <table className="w-full text-left text-[12px]">
                            <thead>
                              <tr className="border-b border-[#ececec] text-[#8f8f95] font-extrabold text-[10px] uppercase">
                                <th className="pb-2 font-bold">Item Description</th>
                                <th className="pb-2 text-right font-bold">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-[#ececec]/50">
                                <td className="py-3 pr-4">
                                  <p className="font-extrabold text-black">{selectedInvoice?.name}</p>
                                  <p className="text-[10px] text-[#8f8f95] mt-0.5">CRM Project Deliverable Settle</p>
                                </td>
                                <td className="py-3 text-right font-extrabold text-black">${selectedInvoice?.amount.toLocaleString()}.00</td>
                              </tr>
                              <tr>
                                <td className="pt-3 text-[#8f8f95] font-semibold">Subtotal</td>
                                <td className="pt-3 text-right font-extrabold text-black">${selectedInvoice?.amount.toLocaleString()}.00</td>
                              </tr>
                              <tr className="border-b border-[#ececec] pb-2">
                                <td className="py-2 text-[#8f8f95] font-semibold">Processing Fee (0%)</td>
                                <td className="py-2 text-right font-extrabold text-black">$0.00</td>
                              </tr>
                              <tr className="text-[14px]">
                                <td className="pt-4 font-black text-black">Total Settled</td>
                                <td className="pt-4 text-right font-black text-emerald-600">${selectedInvoice?.amount.toLocaleString()}.00 USD</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-8 pt-6 border-t border-[#ececec] flex gap-4 no-print relative z-10">
                        <button
                          onClick={() => window.print()}
                          className="flex-1 h-11 border border-[#ececec] hover:bg-neutral-50 text-black font-extrabold text-[13px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-white"
                        >
                          <span className="material-symbols-outlined text-[18px]">print</span>
                          <span>Print / Save PDF</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowReceipt(false);
                            setPaymentSuccess(false);
                            setSelectedInvoice(null);
                            setCardForm({ name: '', number: '', expiry: '', cvv: '' });
                          }}
                          className="flex-1 h-11 bg-black hover:bg-black/90 text-white font-extrabold text-[13px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                        >
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          <span>Done & Settle</span>
                        </button>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            );
          })()}        </div>

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
