import React, { useState, useEffect } from 'react';
import { sb } from '../../utils/supabase';

function Pipeline({ leads = [], onUpdateLead, onDeleteLead, onOpenNewLead }) {
  // State for View Mode ('kanban' or 'list')
  const [viewMode, setViewMode] = useState('kanban');

  // State for Quick View / Edit Modal
  const [selectedLead, setSelectedLead] = useState(null);
  const [editForm, setEditForm] = useState({
    company: '',
    project: '',
    stage: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    message: '',
  });



  // Sync opened modal form state with latest leads prop changes
  useEffect(() => {
    if (selectedLead) {
      const currentLead = leads.find(l => l.id === selectedLead.id);
      if (currentLead) {
        if (
          currentLead.stage !== selectedLead.stage ||
          currentLead.company !== selectedLead.company ||
          currentLead.project !== selectedLead.project ||
          (currentLead.contactName || currentLead.contact_name || '') !== (selectedLead.contactName || selectedLead.contact_name || '') ||
          (currentLead.contactEmail || currentLead.contact_email || '') !== (selectedLead.contactEmail || selectedLead.contact_email || '') ||
          (currentLead.contactPhone || currentLead.contact_phone || '') !== (selectedLead.contactPhone || selectedLead.contact_phone || '') ||
          currentLead.message !== selectedLead.message
        ) {
          setSelectedLead(currentLead);

          let normStage = currentLead.stage;
          if (currentLead.stage === 'review') normStage = 'under-review';
          if (currentLead.stage === 'meeting') normStage = 'meeting-scheduled';
          if (currentLead.stage === 'won') normStage = 'success';

          setEditForm({
            company: currentLead.company || '',
            project: currentLead.project || '',
            stage: normStage || 'new',
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

    let normStage = lead.stage;
    if (lead.stage === 'review') normStage = 'under-review';
    if (lead.stage === 'meeting') normStage = 'meeting-scheduled';
    if (lead.stage === 'won') normStage = 'success';

    setEditForm({
      company: lead.company || '',
      project: lead.project || '',
      stage: normStage || 'new',
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
      category: 'Custom',
      stage: normStage,
      urgent: false,
      amount: '',
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
    let normStage = newStage;
    if (newStage === 'review') normStage = 'under-review';
    if (newStage === 'meeting') normStage = 'meeting-scheduled';
    if (newStage === 'won') normStage = 'success';

    const updatedLead = {
      ...selectedLead,
      company: (editForm.company || '').trim(),
      project: (editForm.project || '').trim(),
      category: 'Custom',
      stage: normStage,
      urgent: false,
      amount: '',
      contactName: (editForm.contactName || '').trim(),
      contactEmail: (editForm.contactEmail || '').trim(),
      contactPhone: (editForm.contactPhone || '').trim(),
      message: (editForm.message || '').trim(),
    };

    setEditForm(prev => ({
      ...prev,
      stage: normStage,
    }));

    onUpdateLead(updatedLead);
    setSelectedLead(updatedLead);
  };

  // Handle Delete
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the inquiry from ${selectedLead.company}?`)) {
      onDeleteLead(selectedLead.id);
      setSelectedLead(null);
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
    const contactName = lead.contactName || lead.contact_name || '';
    const email = lead.contactEmail || lead.contact_email || '';
    const phone = lead.contactPhone || lead.contact_phone || '';
    const message = lead.message || '';

    return (
      <div
        key={lead.id}
        onClick={() => handleOpenQuickView(lead)}
        className={`bg-white border rounded-[22px] p-5 shadow-sm hover:shadow-md hover:border-[#1769ff]/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer text-left flex flex-col gap-3.5 ${isSuccess ? 'opacity-85 border-dashed border-gray-300' : 'border-[#ececec]'}`}
      >
        {/* Header: Company and Time */}
        <div className="flex justify-between items-start">
          <h4 className="font-extrabold text-[16px] text-black tracking-tight leading-tight truncate max-w-[170px]">
            {lead.company}
          </h4>
          <span className="text-[11px] text-[#8f8f95] font-semibold whitespace-nowrap">{lead.time}</span>
        </div>

        {/* Project Interest */}
        <div className="bg-[#f7f7f8] rounded-xl px-3.5 py-2">
          <span className="text-[10px] font-bold text-[#8f8f95] uppercase tracking-wider block">Service Requested</span>
          <span className="text-[13px] font-bold text-[#111111] leading-tight mt-0.5 block">{lead.project}</span>
        </div>

        {/* Contact Info (if available) */}
        {(contactName || email || phone) && (
          <div className="text-[12px] space-y-1 text-slate-700 border-t border-dashed border-[#ececec]/60 pt-3">
            {contactName && (
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <span className="material-symbols-outlined text-[15px] text-[#8f8f95]">person</span>
                <span className="truncate">{contactName}</span>
              </div>
            )}
            {email && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#8f8f95] font-medium">
                <span className="material-symbols-outlined text-[15px]">mail</span>
                <span className="truncate">{email}</span>
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#8f8f95] font-medium">
                <span className="material-symbols-outlined text-[15px]">phone</span>
                <span className="truncate">{phone}</span>
              </div>
            )}
          </div>
        )}

        {/* Message Snippet (if available) */}
        {message && (
          <div className="text-[11px] text-[#555] leading-relaxed italic bg-slate-50/50 rounded-lg p-2.5 border border-[#ececec]/40 mt-1">
            "{message.length > 75 ? message.slice(0, 75) + '...' : message}"
          </div>
        )}

        {/* Card Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#ececec]/60 mt-1">
          <div className="flex -space-x-2">
            {lead.avatarType === 'image' || (typeof lead.avatar === 'string' && lead.avatar.startsWith('http')) ? (
              <img
                alt="User"
                className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 text-[10px] flex items-center justify-center object-cover shadow-sm"
                src={lead.avatar}
              />
            ) : (
              <div className="w-7 h-7 rounded-full border-2 border-white bg-[#e2dfff] text-[#3323cc] text-[9px] flex items-center justify-center font-bold shadow-sm">
                {lead.avatar || 'LD'}
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenQuickView(lead);
            }}
            className="text-[#1769ff] font-extrabold text-[12px] hover:underline active:scale-95 transition-transform"
          >
            Review Brief
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <header className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-lg">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">Inquiries Pipeline</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Managing {leads.length} active client inquiries across the review pipeline.
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <div className="bg-surface-container-highest rounded-lg p-xs flex gap-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-md py-sm rounded-lg text-label-md font-bold transition-all duration-200 ${viewMode === 'kanban'
                  ? 'bg-surface-container-lowest shadow-sm text-primary'
                  : 'text-on-surface-variant hover:bg-surface-variant/30'
                }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-md py-sm rounded-lg text-label-md font-bold transition-all duration-200 ${viewMode === 'list'
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
            Add Inquiry
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
                <h3 className="font-label-md text-label-md text-on-surface font-bold">New Inquiries</h3>
                <span className="bg-surface-container-high px-sm py-[2px] rounded-full text-[10px] font-bold text-on-surface-variant">
                  {formatCount(newLeads.length)}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-md" style={{ minHeight: 'calc(100vh - 250px)' }}>
              {newLeads.length > 0 ? (
                newLeads.map(renderLeadCard)
              ) : (
                <div className="border border-dashed border-outline-variant/20 rounded-2xl py-xl px-lg text-center text-on-surface-variant text-body-sm bg-surface-container-low/30">
                  No new inquiries
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
            </div>
            <div className="flex flex-col gap-md" style={{ minHeight: 'calc(100vh - 250px)' }}>
              {underReviewLeads.length > 0 ? (
                underReviewLeads.map(renderLeadCard)
              ) : (
                <div className="border border-dashed border-outline-variant/20 rounded-2xl py-xl px-lg text-center text-on-surface-variant text-body-sm bg-surface-container-low/30">
                  No tickets under review
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
                <h3 className="font-label-md text-label-md text-on-surface font-bold">Success / Won</h3>
                <span className="bg-surface-container-high px-sm py-[2px] rounded-full text-[10px] font-bold text-on-surface-variant">
                  {formatCount(successLeads.length)}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-md" style={{ minHeight: 'calc(100vh - 250px)' }}>
              {successLeads.length > 0 ? (
                successLeads.map(renderLeadCard)
              ) : (
                <div className="border border-dashed border-outline-variant/20 rounded-2xl py-xl px-lg text-center text-on-surface-variant text-body-sm bg-surface-container-low/30">
                  No won accounts
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
                  <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant">CLIENT & SERVICE</th>
                  <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant">CONTACT PERSON</th>
                  <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant">EMAIL ADDRESS</th>
                  <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant">PHONE NUMBER</th>
                  <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant">BRIEF / MESSAGE</th>
                  <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant">STAGE</th>
                  <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant">SUBMISSION TIME</th>
                  <th className="px-lg py-md text-label-sm font-bold text-on-surface-variant text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {leads.map((lead) => {
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
                            <div className="w-10 h-10 rounded-full bg-[#e2dfff] text-[#3323cc] text-body-sm flex items-center justify-center font-bold border border-outline-variant/20 shadow-sm">
                              {lead.avatar || 'LD'}
                            </div>
                          )}
                          <div>
                            <div className="font-extrabold text-black text-[14px] group-hover:text-primary transition-colors">
                              {lead.company}
                            </div>
                            <div className="text-on-surface-variant text-body-sm font-semibold mt-0.5">
                              {lead.project}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Person */}
                      <td className="px-lg py-md text-[13px] font-bold text-black">
                        {lead.contactName || lead.contact_name || '—'}
                      </td>

                      {/* Email Address */}
                      <td className="px-lg py-md text-[12px] font-medium text-[#444]">
                        {lead.contactEmail || lead.contact_email || '—'}
                      </td>

                      {/* Phone Number */}
                      <td className="px-lg py-md text-[12px] font-medium text-[#444]">
                        {lead.contactPhone || lead.contact_phone || '—'}
                      </td>

                      {/* Brief Message */}
                      <td className="px-lg py-md text-[12px] text-[#8f8f95] max-w-[200px] truncate italic">
                        {lead.message ? `"${lead.message}"` : '—'}
                      </td>

                      {/* Stage */}
                      <td className="px-lg py-md">
                        <span className={`px-sm py-[4px] rounded-full text-[11px] font-bold ${getStageBadgeClass(lead.stage)}`}>
                          {getStageLabel(lead.stage)}
                        </span>
                      </td>

                      {/* Last Active Time */}
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
                                    };
                                    onUpdateLead(updatedLead);
                                  }}
                                  className={`w-full px-md py-[6px] text-[12px] font-bold text-left hover:bg-surface-variant/40 transition-colors ${lead.stage === step.id ||
                                      (step.id === 'under-review' && lead.stage === 'review') ||
                                      (step.id === 'meeting-scheduled' && lead.stage === 'meeting') ||
                                      (step.id === 'success' && lead.stage === 'won' || lead.stage === 'success')
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
                              if (window.confirm(`Are you sure you want to delete the inquiry from ${lead.company}?`)) {
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
                    <td colSpan="8" className="text-center py-xl text-on-surface-variant text-body-sm">
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
                <h3 className="text-headline-md font-bold text-on-surface">Client Inquiry Details</h3>
                <p className="text-body-sm text-on-surface-variant">Review client briefs, change status, or reply</p>
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


                {/* Company & Service */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div className="flex flex-col gap-xs">
                    <label className="text-label-sm font-bold text-on-surface-variant">COMPANY / CLIENT NAME</label>
                    <input
                      type="text"
                      value={editForm.company}
                      onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                      className="w-full h-11 px-md bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-sm text-body-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-xs">
                    <label className="text-label-sm font-bold text-on-surface-variant">SERVICE INTERESTED</label>
                    <input
                      type="text"
                      value={editForm.project}
                      onChange={(e) => setEditForm({ ...editForm, project: e.target.value })}
                      className="w-full h-11 px-md bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-sm text-body-sm"
                    />
                  </div>
                </div>

                {/* Contact Details */}
                <div className="border-t border-outline-variant/30 pt-md space-y-md">
                  <h4 className="text-label-sm font-extrabold text-primary uppercase tracking-wider">Inquirer Details</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                    <div className="flex flex-col gap-xs">
                      <label className="text-label-sm font-bold text-on-surface-variant">CONTACT NAME</label>
                      <input
                        type="text"
                        value={editForm.contactName}
                        onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
                        placeholder="Name"
                        className="w-full h-11 px-md bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-sm text-body-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-xs">
                      <label className="text-label-sm font-bold text-on-surface-variant">EMAIL</label>
                      <input
                        type="email"
                        value={editForm.contactEmail}
                        onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                        placeholder="Email Address"
                        className="w-full h-11 px-md bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-sm text-body-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-xs">
                      <label className="text-label-sm font-bold text-on-surface-variant">PHONE</label>
                      <input
                        type="text"
                        value={editForm.contactPhone}
                        onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                        placeholder="Phone Number"
                        className="w-full h-11 px-md bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-sm text-body-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-xs">
                    <label className="text-label-sm font-bold text-on-surface-variant">INQUIRY BRIEF / PROJECT DETAILS</label>
                    <textarea
                      value={editForm.message}
                      onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                      placeholder="No inquiry details provided."
                      rows="4"
                      className="w-full p-md bg-surface border border-outline-variant rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-sm text-body-sm resize-none"
                    />
                  </div>
                </div>

                {/* Stage Progression Stepper */}
                <div className="border-t border-outline-variant/30 pt-md space-y-md">
                  <label className="text-label-sm font-bold text-on-surface-variant uppercase">MOVE STAGE</label>
                  <div className="grid grid-cols-4 gap-xs bg-surface-container p-[4px] rounded-xl border border-outline-variant/30">
                    {[
                      { id: 'new', label: 'New' },
                      { id: 'under-review', label: 'Review' },
                      { id: 'meeting-scheduled', label: 'Meeting' },
                      { id: 'success', label: 'Won' }
                    ].map(step => {
                      const isActive = editForm.stage === step.id || 
                        (step.id === 'under-review' && editForm.stage === 'review') ||
                        (step.id === 'meeting-scheduled' && editForm.stage === 'meeting') ||
                        (step.id === 'success' && editForm.stage === 'won');
                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => handleStageShift(step.id)}
                          className={`py-2 px-1 rounded-lg text-[11px] font-bold transition-all text-center ${isActive
                            ? 'bg-[#3525cd] text-white shadow-sm'
                            : 'text-[#464555] hover:bg-surface-variant/40'
                            }`}
                        >
                          {step.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons (Sticky Footer) */}
              <div className="p-lg border-t border-outline-variant flex items-center justify-between flex-shrink-0 bg-surface-container-lowest mt-auto">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-xs px-md py-[10px] rounded-xl border border-error/50 hover:bg-error/10 text-error font-bold text-label-md transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Delete Inquiry
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
