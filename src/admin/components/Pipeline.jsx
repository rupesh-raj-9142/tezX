import React, { useState, useEffect } from 'react';
import { sb } from '../../utils/supabase';

function Pipeline({ leads = [], onUpdateLead, onDeleteLead, onOpenNewLead, onNavigateTo }) {
  // State for View Mode ('kanban' or 'list')
  const [viewMode, setViewMode] = useState('kanban');

  // State for Quick View / Edit Modal
  const [selectedLead, setSelectedLead] = useState(null);
  const [editForm, setEditForm] = useState({
    company: '',
    project: '',
    category: '',
    stage: '',
    amount: '',
    urgent: false,
  });

  const [activeInlinePanel, setActiveInlinePanel] = useState(null); // null, 'schedule', 'message', 'convert'
  const [inlineDate, setInlineDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [inlineSlot, setInlineSlot] = useState('11:15 AM — 12:00 PM');
  const [inlineNotes, setInlineNotes] = useState('');
  const [inlineProjectOwner, setInlineProjectOwner] = useState('Alex Rivers');
  const [inlineProjectDeadline, setInlineProjectDeadline] = useState(() => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [successAnimation, setSuccessAnimation] = useState(null); // null, 'schedule', 'message', 'convert'

  const handleInlineSchedule = (e) => {
    e.preventDefault();
    if (!selectedLead) return;

    let meetings = [];
    try {
      const saved = localStorage.getItem('tezx_meetings');
      if (saved && saved !== 'undefined') meetings = JSON.parse(saved);
    } catch (err) {
      console.error(err);
    }

    const newMeeting = {
      id: `meet-${Date.now()}`,
      title: `Sync Discovery: ${selectedLead.project || 'General Inquiry'}`,
      leadCompany: selectedLead.company,
      leadId: selectedLead.id,
      contactName: selectedLead.contactName || selectedLead.contact_name || 'N/A',
      timeSlot: inlineSlot,
      date: inlineDate,
      description: inlineNotes.trim() || 'No description provided.',
    };

    meetings.unshift(newMeeting);
    localStorage.setItem('tezx_meetings', JSON.stringify(meetings));

    const updatedLead = {
      ...selectedLead,
      stage: 'meeting-scheduled',
      time: `Today @ ${inlineSlot.split(' ')[0]} ${inlineSlot.split(' ').pop()}`
    };

    onUpdateLead(updatedLead);
    setSelectedLead(updatedLead);
    setSuccessAnimation('schedule');
    setInlineNotes('');
    
    setTimeout(() => {
      setSuccessAnimation(null);
      setActiveInlinePanel(null);
    }, 2500);
  };

  const handleInlineSendMessage = (e) => {
    e.preventDefault();
    if (!inlineNotes.trim() || !selectedLead) return;

    let messagesMap = {};
    try {
      const saved = localStorage.getItem('tezx_messages');
      if (saved && saved !== 'undefined') messagesMap = JSON.parse(saved);
    } catch (err) {
      console.error(err);
    }

    const newMsg = {
      id: `msg-${Date.now()}`,
      title: 'Reply Email Sent',
      content: inlineNotes.trim(),
      time: 'Just now',
      type: 'email',
      icon: 'mail',
      color: 'bg-[#1769ff] text-white'
    };

    const currentLogs = messagesMap[selectedLead.id] || [
      {
        id: `msg-init-${selectedLead.id}`,
        title: 'Inquiry Submitted',
        content: selectedLead.message || 'Interested in scale integrations and automation setup.',
        time: selectedLead.time || 'A few hours ago',
        type: 'inquiry',
        icon: 'description',
        color: 'bg-tertiary-container text-on-tertiary-container'
      }
    ];

    messagesMap[selectedLead.id] = [newMsg, ...currentLogs];
    localStorage.setItem('tezx_messages', JSON.stringify(messagesMap));

    setSuccessAnimation('message');
    setInlineNotes('');

    setTimeout(() => {
      setSuccessAnimation(null);
      setActiveInlinePanel(null);
    }, 2000);
  };

  const handleInlineConvert = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;

    const newProject = {
      id: `project-${Date.now()}`,
      name: selectedLead.project || 'Legacy Infrastructure Migration',
      company: selectedLead.company,
      budget: selectedLead.amount || '$10,000',
      deadline: inlineProjectDeadline,
      owner: inlineProjectOwner.trim() || 'Alex Rivers',
      status: 'Planning',
      description: selectedLead.message || `Scope converted from pipeline lead ref #${selectedLead.id.slice(-6).toUpperCase()}.`,
    };

    try {
      await sb.projects.insert(newProject);
      
      let projectsBackup = [];
      try {
        const saved = localStorage.getItem('tezx_projects');
        if (saved && saved !== 'undefined') projectsBackup = JSON.parse(saved);
      } catch (err) {}
      projectsBackup.unshift(newProject);
      localStorage.setItem('tezx_projects', JSON.stringify(projectsBackup));
    } catch (err) {
      console.error(err);
    }

    const updatedLead = {
      ...selectedLead,
      stage: 'success',
      amount: selectedLead.amount || '$10,000'
    };

    onUpdateLead(updatedLead);
    setSelectedLead(updatedLead);
    setSuccessAnimation('convert');

    setTimeout(() => {
      setSuccessAnimation(null);
      setActiveInlinePanel(null);
    }, 2500);
  };

  // Keep the opened modal's selected lead and editForm perfectly in sync with the parent leads list prop
  useEffect(() => {
    if (selectedLead) {
      const currentLead = leads.find(l => l.id === selectedLead.id);
      if (currentLead) {
        // If the lead in the prop has different values (like stage or amount), sync it!
        if (
          currentLead.stage !== selectedLead.stage ||
          currentLead.company !== selectedLead.company ||
          currentLead.project !== selectedLead.project ||
          currentLead.category !== selectedLead.category ||
          currentLead.urgent !== selectedLead.urgent ||
          currentLead.amount !== selectedLead.amount ||
          (currentLead.contactName || currentLead.contact_name || '') !== (selectedLead.contactName || selectedLead.contact_name || '') ||
          (currentLead.contactEmail || currentLead.contact_email || '') !== (selectedLead.contactEmail || selectedLead.contact_email || '') ||
          (currentLead.contactPhone || currentLead.contact_phone || '') !== (selectedLead.contactPhone || selectedLead.contact_phone || '') ||
          currentLead.message !== selectedLead.message
        ) {
          console.log('[TezX Debug] Syncing opened modal with latest leads prop:', currentLead);
          setSelectedLead(currentLead);
          
          let normStage = currentLead.stage;
          if (currentLead.stage === 'review') normStage = 'under-review';
          if (currentLead.stage === 'meeting') normStage = 'meeting-scheduled';
          if (currentLead.stage === 'won') normStage = 'success';

          setEditForm({
            company: currentLead.company || '',
            project: currentLead.project || '',
            category: currentLead.category || 'Enterprise',
            stage: normStage || 'new',
            amount: currentLead.amount ? String(currentLead.amount).replace('$', '') : '',
            urgent: !!currentLead.urgent,
            contactName: currentLead.contactName || currentLead.contact_name || '',
            contactEmail: currentLead.contactEmail || currentLead.contact_email || '',
            contactPhone: currentLead.contactPhone || currentLead.contact_phone || '',
            message: currentLead.message || '',
          });
        }
      }
    }
  }, [leads, selectedLead]);

  // Filter leads by stage with full backward compatibility and case-insensitive protection
  const newLeads = leads.filter(l => (l.stage || '').toLowerCase() === 'new');
  const underReviewLeads = leads.filter(l => (l.stage || '').toLowerCase() === 'under-review' || (l.stage || '').toLowerCase() === 'review');
  const meetingScheduledLeads = leads.filter(l => (l.stage || '').toLowerCase() === 'meeting-scheduled' || (l.stage || '').toLowerCase() === 'meeting');
  const successLeads = leads.filter(l => (l.stage || '').toLowerCase() === 'success' || (l.stage || '').toLowerCase() === 'won');

  // Format numbers to 2-digit format
  const formatCount = (count) => String(count).padStart(2, '0');

  // Open Quick View Modal
  const handleOpenQuickView = (lead) => {
    setSelectedLead(lead);
    
    // Normalize stage names in case they are saved as simple forms 'review', 'meeting', 'won'
    let normStage = lead.stage;
    if (lead.stage === 'review') normStage = 'under-review';
    if (lead.stage === 'meeting') normStage = 'meeting-scheduled';
    if (lead.stage === 'won') normStage = 'success';
    
    setEditForm({
      company: lead.company || '',
      project: lead.project || '',
      category: lead.category || 'Enterprise',
      stage: normStage || 'new',
      amount: lead.amount ? String(lead.amount).replace('$', '') : '',
      urgent: !!lead.urgent,
      contactName: lead.contactName || lead.contact_name || '',
      contactEmail: lead.contactEmail || lead.contact_email || '',
      contactPhone: lead.contactPhone || lead.contact_phone || '',
      message: lead.message || '',
    });
  };

  // Handle Edit/Update Submit
  const handleSaveChanges = (e) => {
    e.preventDefault();
    if (!(editForm.company || '').trim() || !(editForm.project || '').trim()) return;

    let normStage = editForm.stage;
    if (editForm.stage === 'review') normStage = 'under-review';
    if (editForm.stage === 'meeting') normStage = 'meeting-scheduled';
    if (editForm.stage === 'won') normStage = 'success';

    const updatedLead = {
      ...selectedLead,
      company: (editForm.company || '').trim(),
      project: (editForm.project || '').trim(),
      category: editForm.category,
      stage: normStage,
      urgent: editForm.urgent,
      amount: String(editForm.amount || '').trim() ? (String(editForm.amount || '').startsWith('$') ? editForm.amount : `$${editForm.amount}`) : selectedLead.amount,
      contactName: (editForm.contactName || '').trim(),
      contactEmail: (editForm.contactEmail || '').trim(),
      contactPhone: (editForm.contactPhone || '').trim(),
      message: (editForm.message || '').trim(),
    };

    onUpdateLead(updatedLead);
    setSelectedLead(null);
  };

  // Handle Quick Stage Shift (directly inside modal or quick actions list)
  const handleStageShift = (newStage) => {
    console.log('[TezX Debug] handleStageShift clicked with stage:', newStage);
    
    // Normalize in case simple stages are passed
    let normStage = newStage;
    if (newStage === 'review') normStage = 'under-review';
    if (newStage === 'meeting') normStage = 'meeting-scheduled';
    if (newStage === 'won') normStage = 'success';

    const updatedLead = {
      ...selectedLead,
      company: (editForm.company || '').trim(),
      project: (editForm.project || '').trim(),
      category: editForm.category,
      stage: normStage,
      urgent: editForm.urgent,
      // If moving to success and amount is empty, pre-fill some value or leave empty
      amount: normStage === 'success' 
        ? (String(editForm.amount || '').trim() ? (String(editForm.amount || '').startsWith('$') ? editForm.amount : `$${editForm.amount}`) : (selectedLead.amount || '$10,000')) 
        : (String(editForm.amount || '').trim() ? (String(editForm.amount || '').startsWith('$') ? editForm.amount : `$${editForm.amount}`) : selectedLead.amount),
      contactName: (editForm.contactName || '').trim(),
      contactEmail: (editForm.contactEmail || '').trim(),
      contactPhone: (editForm.contactPhone || '').trim(),
      message: (editForm.message || '').trim(),
    };
    
    console.log('[TezX Debug] handleStageShift created updatedLead:', updatedLead);
    
    // Update active modal form as well
    setEditForm(prev => {
      const nextForm = {
        ...prev,
        stage: normStage,
        amount: normStage === 'success' ? (prev.amount || '10,000') : prev.amount
      };
      console.log('[TezX Debug] handleStageShift setting editForm to:', nextForm);
      return nextForm;
    });

    onUpdateLead(updatedLead);
    // Keep modal open so user can keep editing or seeing details
    setSelectedLead(updatedLead);
  };

  // Handle Delete
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to archive/delete the lead for ${selectedLead.company}?`)) {
      onDeleteLead(selectedLead.id);
      setSelectedLead(null);
    }
  };

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'Enterprise':
        return 'bg-secondary-container text-on-secondary-container';
      case 'SME':
        return 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
      case 'Consulting':
        return 'bg-primary-fixed text-on-primary-fixed-variant';
      case 'Closed Won':
      case 'Success':
        return 'bg-tertiary-container text-on-tertiary-container';
      default:
        return 'bg-surface-variant text-on-surface-variant';
    }
  };

  const getStageBadgeClass = (stage) => {
    switch (stage) {
      case 'new':
        return 'bg-primary/10 text-primary border border-primary/20';
      case 'under-review':
        return 'bg-secondary/10 text-secondary border border-secondary/20';
      case 'meeting-scheduled':
        return 'bg-tertiary/10 text-tertiary border border-tertiary/20';
      case 'success':
        return 'bg-tertiary-fixed-dim/20 text-tertiary border border-tertiary-fixed-dim/40';
      default:
        return 'bg-surface-variant text-on-surface-variant border border-outline-variant/30';
    }
  };

  const getStageLabel = (stage) => {
    switch (stage) {
      case 'new': return 'New';
      case 'under-review': return 'Under Review';
      case 'meeting-scheduled': return 'Meeting Scheduled';
      case 'success': return 'Won / Success';
      default: return stage;
    }
  };

  const renderLeadCard = (lead) => {
    const isSuccess = lead.stage === 'success';

    return (
      <div 
        key={lead.id}
        onClick={() => handleOpenQuickView(lead)}
        className={`bg-surface-container-lowest border rounded-2xl p-lg shadow-sm hover:shadow-md hover:border-primary/45 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
          isSuccess ? 'opacity-85 border-dashed border-outline-variant/60' : 'border-outline-variant/40'
        }`}
      >
        <div className="flex justify-between items-start mb-md">
          <div className="flex flex-wrap gap-xs">
            {lead.urgent && (
              <span className="bg-error-container text-on-error-container px-sm py-[2px] rounded-md text-[10px] font-bold uppercase tracking-wider">
                Urgent
              </span>
            )}
            <span className={`px-sm py-[2px] rounded-md text-[10px] font-bold uppercase tracking-wider ${getCategoryBadgeClass(lead.category)}`}>
              {lead.category}
            </span>
          </div>
          <span className="text-on-surface-variant text-[12px]">{lead.time}</span>
        </div>

        <h4 className="font-headline-md text-body-lg font-bold mb-xs tracking-tight text-on-surface">
          {lead.company}
        </h4>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-lg">
          {lead.project}
        </p>

        <div className="flex items-center justify-between pt-md border-t border-surface-variant">
          {/* Avatar representation */}
          <div className="flex -space-x-2">
            {lead.avatarType === 'image' || (typeof lead.avatar === 'string' && lead.avatar.startsWith('http')) ? (
              <img 
                alt="User" 
                className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-primary-fixed text-[10px] flex items-center justify-center object-cover" 
                src={lead.avatar} 
              />
            ) : (
              <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-surface-variant text-[10px] flex items-center justify-center font-bold text-on-surface-variant">
                {lead.avatar || 'LD'}
              </div>
            )}
          </div>

          {/* Conditional footer action or badge */}
          {lead.stage === 'meeting-scheduled' ? (
            <span className="text-[12px] font-bold text-tertiary flex items-center gap-xs">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              {lead.time}
            </span>
          ) : isSuccess ? (
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
              <span className="text-[12px] text-tertiary font-bold">{lead.amount || '$10,000'}</span>
            </div>
          ) : (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleOpenQuickView(lead);
              }}
              className="text-primary font-bold text-label-md hover:underline active:scale-95 transition-transform"
            >
              Quick View
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <header className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-lg">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">Sales Pipeline</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Managing {leads.length} active lead opportunities across the funnel.
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <div className="bg-surface-container-highest rounded-lg p-xs flex gap-xs">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`px-md py-sm rounded-lg text-label-md font-bold transition-all duration-200 ${
                viewMode === 'kanban' 
                  ? 'bg-surface-container-lowest shadow-sm text-primary' 
                  : 'text-on-surface-variant hover:bg-surface-variant/30'
              }`}
            >
              Kanban
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-md py-sm rounded-lg text-label-md font-bold transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-surface-container-lowest shadow-sm text-primary' 
                  : 'text-on-surface-variant hover:bg-surface-variant/30'
              }`}
            >
              List View
            </button>
          </div>
          <button 
            onClick={onOpenNewLead}
            className="bg-primary text-on-primary px-md py-[10px] rounded-lg text-label-md flex items-center gap-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Lead
          </button>
        </div>
      </header>

      {viewMode === 'kanban' ? (
        /* Kanban Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-gutter overflow-x-auto pb-lg animate-in fade-in duration-200">
          {/* Column: New */}
          <div className="flex flex-col gap-md">
            <div className="flex items-center justify-between px-xs border-b border-outline-variant/30 pb-sm">
              <div className="flex items-center gap-sm">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <h3 className="font-label-md text-label-md text-on-surface font-bold">New</h3>
                <span className="bg-surface-container-high px-sm py-[2px] rounded-full text-[10px] font-bold text-on-surface-variant">
                  {formatCount(newLeads.length)}
                </span>
              </div>
              <button className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined text-[20px]">more_horiz</span>
              </button>
            </div>
            <div className="flex flex-col gap-md" style={{ minHeight: 'calc(100vh - 250px)' }}>
              {newLeads.length > 0 ? (
                newLeads.map(renderLeadCard)
              ) : (
                <div className="border border-dashed border-outline-variant/20 rounded-2xl py-xl px-lg text-center text-on-surface-variant text-body-sm bg-surface-container-low/30">
                  No new opportunities
                </div>
              )}
            </div>
          </div>

          {/* Column: Under Review */}
          <div className="flex flex-col gap-md">
            <div className="flex items-center justify-between px-xs border-b border-outline-variant/30 pb-sm">
              <div className="flex items-center gap-sm">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <h3 className="font-label-md text-label-md text-on-surface font-bold">Under Review</h3>
                <span className="bg-surface-container-high px-sm py-[2px] rounded-full text-[10px] font-bold text-on-surface-variant">
                  {formatCount(underReviewLeads.length)}
                </span>
              </div>
              <button className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined text-[20px]">more_horiz</span>
              </button>
            </div>
            <div className="flex flex-col gap-md" style={{ minHeight: 'calc(100vh - 250px)' }}>
              {underReviewLeads.length > 0 ? (
                underReviewLeads.map(renderLeadCard)
              ) : (
                <div className="border border-dashed border-outline-variant/20 rounded-2xl py-xl px-lg text-center text-on-surface-variant text-body-sm bg-surface-container-low/30">
                  No leads under review
                </div>
              )}
            </div>
          </div>

          {/* Column: Meeting Scheduled */}
          <div className="flex flex-col gap-md">
            <div className="flex items-center justify-between px-xs border-b border-outline-variant/30 pb-sm">
              <div className="flex items-center gap-sm">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                <h3 className="font-label-md text-label-md text-on-surface font-bold">Meeting Scheduled</h3>
                <span className="bg-surface-container-high px-sm py-[2px] rounded-full text-[10px] font-bold text-on-surface-variant">
                  {formatCount(meetingScheduledLeads.length)}
                </span>
              </div>
              <button className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined text-[20px]">more_horiz</span>
              </button>
            </div>
            <div className="flex flex-col gap-md" style={{ minHeight: 'calc(100vh - 250px)' }}>
              {meetingScheduledLeads.length > 0 ? (
                meetingScheduledLeads.map(renderLeadCard)
              ) : (
                <div className="border border-dashed border-outline-variant/20 rounded-2xl py-xl px-lg text-center text-on-surface-variant text-body-sm bg-surface-container-low/30">
                  No meetings scheduled
                </div>
              )}
            </div>
          </div>

          {/* Column: Success */}
          <div className="flex flex-col gap-md">
            <div className="flex items-center justify-between px-xs border-b border-outline-variant/30 pb-sm">
              <div className="flex items-center gap-sm">
                <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
                <h3 className="font-label-md text-label-md text-on-surface font-bold">Success</h3>
                <span className="bg-surface-container-high px-sm py-[2px] rounded-full text-[10px] font-bold text-on-surface-variant">
                  {formatCount(successLeads.length)}
                </span>
              </div>
              <button className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined text-[20px]">more_horiz</span>
              </button>
            </div>
            <div className="flex flex-col gap-md" style={{ minHeight: 'calc(100vh - 250px)' }}>
              {successLeads.length > 0 ? (
                successLeads.map(renderLeadCard)
              ) : (
                <div className="border border-dashed border-outline-variant/20 rounded-2xl py-xl px-lg text-center text-on-surface-variant text-body-sm bg-surface-container-low/30">
                  No successful closings
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* List View Table */
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low/40">
                  <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant">CLIENT & OPPORTUNITY</th>
                  <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant">CATEGORY</th>
                  <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant">STAGE</th>
                  <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant">DEAL VALUE</th>
                  <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant">PRIORITY</th>
                  <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant">LAST ACTIVE</th>
                  <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {leads.map((lead) => {
                  const isSuccess = lead.stage === 'success';
                  return (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-surface-container-low/20 transition-colors cursor-pointer group"
                      onClick={() => handleOpenQuickView(lead)}
                    >
                      {/* Client Info */}
                      <td className="px-lg py-md">
                        <div className="flex items-center gap-md">
                          {lead.avatarType === 'image' || (typeof lead.avatar === 'string' && lead.avatar.startsWith('http')) ? (
                            <img 
                              alt={lead.company} 
                              className="w-10 h-10 rounded-full object-cover border border-outline-variant/20 shadow-sm" 
                              src={lead.avatar} 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-surface-variant text-body-sm flex items-center justify-center font-bold text-on-surface-variant border border-outline-variant/20 shadow-sm">
                              {lead.avatar || 'LD'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-on-surface text-body-md group-hover:text-primary transition-colors">
                              {lead.company}
                            </div>
                            <div className="text-on-surface-variant text-body-sm font-normal">
                              {lead.project}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-lg py-md">
                        <span className={`px-sm py-[4px] rounded-md text-[10px] font-bold uppercase tracking-wider ${getCategoryBadgeClass(lead.category)}`}>
                          {lead.category}
                        </span>
                      </td>

                      {/* Stage */}
                      <td className="px-lg py-md">
                        <span className={`px-sm py-[4px] rounded-full text-[11px] font-bold ${getStageBadgeClass(lead.stage)}`}>
                          {getStageLabel(lead.stage)}
                        </span>
                      </td>

                      {/* Deal Value */}
                      <td className="px-lg py-md">
                        <span className={`text-body-sm font-bold ${isSuccess ? 'text-tertiary' : 'text-on-surface'}`}>
                          {lead.amount || (isSuccess ? '$10,000' : '—')}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-lg py-md">
                        {lead.urgent ? (
                          <span className="bg-error-container text-on-error-container px-sm py-[2px] rounded-md text-[10px] font-bold uppercase tracking-wider border border-error/15">
                            Urgent
                          </span>
                        ) : (
                          <span className="text-on-surface-variant/60 text-[11px]">
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Last Active */}
                      <td className="px-lg py-md text-on-surface-variant text-body-sm">
                        {lead.time}
                      </td>

                      {/* Actions */}
                      <td className="px-lg py-md text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-sm">
                          <button
                            onClick={() => handleOpenQuickView(lead)}
                            className="p-xs text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-variant/40 active:scale-90"
                            title="Quick View / Edit"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          
                          {/* Fast stage transition */}
                          <div className="relative inline-block text-left group">
                            <button
                              className="p-xs text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-variant/40 active:scale-90"
                              title="Change Stage"
                            >
                              <span className="material-symbols-outlined text-[18px]">drive_file_move</span>
                            </button>
                            <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl z-50 py-xs min-w-[140px] text-left">
                              {[
                                { id: 'new', label: 'New' },
                                { id: 'under-review', label: 'Review' },
                                { id: 'meeting-scheduled', label: 'Meeting' },
                                { id: 'success', label: 'Won' }
                              ].map(step => (
                                <button
                                  key={step.id}
                                  onClick={() => {
                                    const updatedLead = {
                                      ...lead,
                                      stage: step.id,
                                      amount: step.id === 'success' ? (lead.amount || '$10,000') : lead.amount
                                    };
                                    onUpdateLead(updatedLead);
                                  }}
                                  className={`w-full px-md py-[6px] text-[12px] font-bold text-left hover:bg-surface-variant/40 transition-colors ${
                                    lead.stage === step.id || 
                                    (step.id === 'under-review' && lead.stage === 'review') ||
                                    (step.id === 'meeting-scheduled' && lead.stage === 'meeting') ||
                                    (step.id === 'success' && lead.stage === 'won')
                                      ? 'text-primary bg-primary/5' 
                                      : 'text-on-surface-variant'
                                  }`}
                                >
                                  {step.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to archive/delete the lead for ${lead.company}?`)) {
                                onDeleteLead(lead.id);
                              }
                            }}
                            className="p-xs text-on-surface-variant hover:text-error transition-colors rounded-full hover:bg-error-container/20 active:scale-90"
                            title="Delete Lead"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-xl text-on-surface-variant text-body-sm">
                      No opportunities currently in pipeline.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK VIEW / DETAIL MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-md">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedLead(null)}
          ></div>
          
          {/* Modal Container */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-lg py-md border-b border-outline-variant flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-headline-md font-bold text-on-surface">Lead Opportunity Profile</h3>
                <p className="text-body-sm text-on-surface-variant">Inspect, move, or modify opportunity details</p>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="text-on-surface-variant hover:text-error transition-colors p-xs rounded-full hover:bg-surface-variant/40"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveChanges} className="flex flex-col flex-grow min-h-0 overflow-hidden">
              {/* Scrollable Content */}
              <div className="p-lg space-y-md overflow-y-auto flex-grow text-left">
                {/* Lead Quick Actions Portal */}
                <div className="flex flex-col gap-xs pb-sm border-b border-outline-variant/30">
                  <div className="flex justify-between items-center">
                    <label className="text-label-sm font-bold text-on-surface-variant">LEAD QUICK ACTIONS PORTAL</label>
                    {activeInlinePanel && (
                      <button
                        type="button"
                        onClick={() => { setActiveInlinePanel(null); setSuccessAnimation(null); }}
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-xs cursor-pointer border-none bg-transparent"
                      >
                        <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                        Back to Actions
                      </button>
                    )}
                  </div>

                  {successAnimation ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center gap-2 animate-in zoom-in-95 duration-200">
                      <div className="w-10 h-10 bg-[#e2f9ee] text-[#107c41] rounded-full flex items-center justify-center animate-bounce">
                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      </div>
                      <h5 className="font-extrabold text-black text-[13px]">
                        {successAnimation === 'schedule' && 'Sync Meeting Scheduled!'}
                        {successAnimation === 'message' && 'Response Email Sent!'}
                        {successAnimation === 'convert' && 'Project Converted Successfully!'}
                      </h5>
                      <p className="text-[10px] text-[#8f8f95]">Lead details updated and synced across all desks.</p>
                    </div>
                  ) : activeInlinePanel === 'schedule' ? (
                    <div className="space-y-sm mt-xs p-md border border-[#ececec] rounded-2xl bg-[#f7f7f8]/20 text-left animate-in fade-in duration-200">
                      <h5 className="font-extrabold text-black text-[12px] mb-2 flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
                        Schedule Sync Meeting
                      </h5>
                      <div className="grid grid-cols-2 gap-sm">
                        <div className="flex flex-col gap-xs">
                          <label className="text-[9px] font-bold text-[#8f8f95] uppercase">Select Date</label>
                          <input
                            type="date"
                            value={inlineDate}
                            onChange={(e) => setInlineDate(e.target.value)}
                            className="h-8 px-2 bg-white border border-[#ececec] rounded-lg outline-none text-[11px]"
                          />
                        </div>
                        <div className="flex flex-col gap-xs">
                          <label className="text-[9px] font-bold text-[#8f8f95] uppercase">Choose Slot</label>
                          <select
                            value={inlineSlot}
                            onChange={(e) => setInlineSlot(e.target.value)}
                            className="h-8 px-2 bg-white border border-[#ececec] rounded-lg outline-none text-[11px]"
                          >
                            <option value="09:00 AM — 09:45 AM">09:00 AM — 09:45 AM</option>
                            <option value="11:15 AM — 12:00 PM">11:15 AM — 12:00 PM</option>
                            <option value="01:30 PM — 02:15 PM">01:30 PM — 02:15 PM</option>
                            <option value="03:30 PM — 04:15 PM">03:30 PM — 04:15 PM</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col gap-xs">
                        <label className="text-[9px] font-bold text-[#8f8f95] uppercase">Meeting Notes / Agenda</label>
                        <textarea
                          placeholder="Brief meeting notes..."
                          value={inlineNotes}
                          onChange={(e) => setInlineNotes(e.target.value)}
                          rows="2"
                          className="p-2 bg-white border border-[#ececec] rounded-lg outline-none text-[11px] resize-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleInlineSchedule}
                        className="w-full h-8 bg-primary text-white hover:brightness-110 font-bold text-[11px] rounded-lg shadow transition-all cursor-pointer border-none"
                      >
                        Confirm Booking & Sync Stage
                      </button>
                    </div>
                  ) : activeInlinePanel === 'message' ? (
                    <div className="space-y-sm mt-xs p-md border border-[#ececec] rounded-2xl bg-[#f7f7f8]/20 text-left animate-in fade-in duration-200">
                      <h5 className="font-extrabold text-black text-[12px] mb-2 flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[16px] text-primary">mail</span>
                        Compose Email Response
                      </h5>
                      <div className="p-sm bg-white border border-[#ececec] rounded-xl text-[10px] text-[#8f8f95] max-h-[80px] overflow-y-auto mb-2 italic">
                        Inquiry: "{selectedLead.message || 'Interested in automation scopes.'}"
                      </div>
                      <div className="flex flex-col gap-xs">
                        <label className="text-[9px] font-bold text-[#8f8f95] uppercase">Write Response Body *</label>
                        <textarea
                          required
                          placeholder="Type response details to client..."
                          value={inlineNotes}
                          onChange={(e) => setInlineNotes(e.target.value)}
                          rows="3"
                          className="p-2 bg-white border border-[#ececec] rounded-lg outline-none text-[11px] resize-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleInlineSendMessage}
                        className="w-full h-8 bg-primary text-white hover:brightness-110 font-bold text-[11px] rounded-lg shadow transition-all cursor-pointer border-none"
                      >
                        Send Email Reply
                      </button>
                    </div>
                  ) : activeInlinePanel === 'convert' ? (
                    <div className="space-y-sm mt-xs p-md border border-[#ececec] rounded-2xl bg-[#f7f7f8]/20 text-left animate-in fade-in duration-200">
                      <h5 className="font-extrabold text-black text-[12px] mb-2 flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[16px] text-primary">business_center</span>
                        Convert to Deliverable Project
                      </h5>
                      <div className="grid grid-cols-2 gap-sm">
                        <div className="flex flex-col gap-xs">
                          <label className="text-[9px] font-bold text-[#8f8f95] uppercase">Project Owner</label>
                          <input
                            type="text"
                            placeholder="e.g. Alex Rivers"
                            value={inlineProjectOwner}
                            onChange={(e) => setInlineProjectOwner(e.target.value)}
                            className="h-8 px-2 bg-white border border-[#ececec] rounded-lg outline-none text-[11px]"
                          />
                        </div>
                        <div className="flex flex-col gap-xs">
                          <label className="text-[9px] font-bold text-[#8f8f95] uppercase">Target Deadline</label>
                          <input
                            type="date"
                            value={inlineProjectDeadline}
                            onChange={(e) => setInlineProjectDeadline(e.target.value)}
                            className="h-8 px-2 bg-white border border-[#ececec] rounded-lg outline-none text-[11px]"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleInlineConvert}
                        className="w-full h-8 bg-[#b27200] text-white hover:brightness-110 font-bold text-[11px] rounded-lg shadow transition-all cursor-pointer border-none"
                      >
                        Confirm Conversion & Sync Stage
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-sm mt-xs animate-in fade-in duration-200">
                      <button
                        type="button"
                        onClick={() => setActiveInlinePanel('schedule')}
                        className="flex items-center gap-sm p-sm rounded-xl border border-outline-variant/40 bg-surface hover:bg-primary/5 hover:border-primary/30 transition-all text-left group border-solid"
                      >
                        <div className="w-8 h-8 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                          <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                        </div>
                        <div>
                          <span className="text-[12px] font-black text-on-surface block leading-tight">Schedule Meeting</span>
                          <span className="text-[10px] text-on-surface-variant leading-none">Inline Booking</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveInlinePanel('message')}
                        className="flex items-center gap-sm p-sm rounded-xl border border-outline-variant/40 bg-surface hover:bg-primary/5 hover:border-primary/30 transition-all text-left group border-solid"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                          <span className="material-symbols-outlined text-[18px]">mail</span>
                        </div>
                        <div>
                          <span className="text-[12px] font-black text-on-surface block leading-tight">Send Message</span>
                          <span className="text-[10px] text-on-surface-variant leading-none">Draft Response</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigateTo) onNavigateTo('analytics', selectedLead);
                          setSelectedLead(null);
                        }}
                        className="flex items-center gap-sm p-sm rounded-xl border border-outline-variant/40 bg-surface hover:bg-primary/5 hover:border-primary/30 transition-all text-left group border-solid"
                      >
                        <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                          <span className="material-symbols-outlined text-[18px]">trending_up</span>
                        </div>
                        <div>
                          <span className="text-[12px] font-black text-on-surface block leading-tight">View Analytics</span>
                          <span className="text-[10px] text-on-surface-variant leading-none">Metrics Deck</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveInlinePanel('convert')}
                        className="flex items-center gap-sm p-sm rounded-xl border border-outline-variant/40 bg-surface hover:bg-primary/5 hover:border-primary/30 transition-all text-left group border-solid"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#b27200]/10 text-[#b27200] flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                          <span className="material-symbols-outlined text-[18px]">business_center</span>
                        </div>
                        <div>
                          <span className="text-[12px] font-black text-on-surface block leading-tight">Convert Project</span>
                          <span className="text-[10px] text-on-surface-variant leading-none">Inline Scope</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Company Input */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div className="flex flex-col gap-xs">
                    <label className="text-label-sm font-bold text-on-surface-variant">CLIENT NAME</label>
                    <input 
                      type="text" 
                      value={editForm.company}
                      onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                      className="w-full h-11 px-md bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-sm text-body-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-xs">
                    <label className="text-label-sm font-bold text-on-surface-variant">PROJECT/DEAL</label>
                    <input 
                      type="text" 
                      value={editForm.project}
                      onChange={(e) => setEditForm({ ...editForm, project: e.target.value })}
                      className="w-full h-11 px-md bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-sm text-body-sm"
                    />
                  </div>
                </div>

                {/* Category and Deal Value */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  {/* Category selector */}
                  <div className="flex flex-col gap-xs">
                    <label className="text-label-sm font-bold text-on-surface-variant">CATEGORY</label>
                    <select 
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full h-11 px-md bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-sm text-body-sm"
                    >
                      <option value="Enterprise">Enterprise</option>
                      <option value="SME">SME</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Closed Won">Closed Won</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  {/* Deal Value Amount */}
                  <div className="flex flex-col gap-xs">
                    <label className="text-label-sm font-bold text-on-surface-variant">DEAL AMOUNT ($)</label>
                    <input 
                      type="text" 
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      placeholder="e.g. 15,000"
                      className="w-full h-11 px-md bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-sm text-body-sm"
                    />
                  </div>
                </div>

                {/* Contact Details & Inquiry Message */}
                <div className="border-t border-outline-variant/30 pt-md space-y-md">
                  <h4 className="text-label-sm font-extrabold text-primary uppercase tracking-wider">Inquirer & Contact Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                    <div className="flex flex-col gap-xs">
                      <label className="text-label-sm font-bold text-on-surface-variant">CONTACT NAME</label>
                      <input 
                        type="text" 
                        value={editForm.contactName}
                        onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                        placeholder="e.g. Marcus Thorne"
                        className="w-full h-11 px-md bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-sm text-body-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-xs">
                      <label className="text-label-sm font-bold text-on-surface-variant">EMAIL</label>
                      <input 
                        type="email" 
                        value={editForm.contactEmail}
                        onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                        placeholder="e.g. name@company.com"
                        className="w-full h-11 px-md bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-sm text-body-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-xs">
                      <label className="text-label-sm font-bold text-on-surface-variant">PHONE</label>
                      <input 
                        type="text" 
                        value={editForm.contactPhone}
                        onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                        placeholder="e.g. +1 (555) 0123"
                        className="w-full h-11 px-md bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-sm text-body-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-xs">
                    <label className="text-label-sm font-bold text-on-surface-variant">INQUIRY MESSAGE / PROJECT DETAILS</label>
                    <textarea 
                      value={editForm.message}
                      onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                      placeholder="No inquiry details provided."
                      rows="3"
                      className="w-full p-md bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-sm text-body-sm resize-none"
                    />
                  </div>
                </div>

                {/* Urgent Toggle */}
                <div className="flex items-center justify-between p-sm">
                  <div className="flex items-center gap-sm">
                    <input 
                      type="checkbox" 
                      id="edit-urgent"
                      checked={editForm.urgent}
                      onChange={(e) => setEditForm({ ...editForm, urgent: e.target.checked })}
                      className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 cursor-pointer"
                    />
                    <label htmlFor="edit-urgent" className="text-body-sm font-bold text-on-surface select-none cursor-pointer">
                      Mark as Urgent
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Sticky Footer) */}
              <div className="p-lg border-t border-outline-variant flex items-center justify-between flex-shrink-0 bg-surface-container-lowest mt-auto">
                {/* Delete/Archive button */}
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-xs px-md py-[10px] rounded-xl border border-error/50 hover:bg-error/10 text-error font-bold text-label-md transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Delete Lead
                </button>

                <div className="flex items-center gap-sm">
                  <button
                    type="button"
                    onClick={() => setSelectedLead(null)}
                    className="px-lg h-11 rounded-xl font-bold text-label-md text-on-surface-variant hover:bg-surface-variant/40 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-lg h-11 rounded-xl bg-primary hover:bg-primary/95 text-on-primary font-bold text-label-md shadow-md active:scale-[0.98] transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Pipeline;
