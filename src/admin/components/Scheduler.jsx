import React, { useState } from 'react';

function Scheduler({ leads = [], onUpdateLead, leadContext, clearLeadContext, hostContext, clearHostContext, meetings = [], setMeetings }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // Form State for Booking
  const [bookingForm, setBookingForm] = useState({
    title: '',
    leadId: '',
    description: '',
  });

  // Calculate dynamic stats
  const totalLeads = leads.length;
  const successLeads = leads.filter(l => l.stage === 'success' || l.stage === 'won');
  const conversionRate = totalLeads > 0 ? ((successLeads.length / totalLeads) * 100).toFixed(0) : 0;
  const activeMeetingsCount = meetings.length;

  const availableSlots = [
    { id: 'slot-1', time: '09:00 AM — 09:45 AM', label: 'Morning Briefing Window' },
    { id: 'slot-2', time: '10:30 AM — 11:15 AM', label: 'Tech Stack Review' },
    { id: 'slot-3', time: '11:15 AM — 12:00 PM', label: 'Discovery & Scope Call' },
    { id: 'slot-4', time: '01:30 PM — 02:15 PM', label: 'Afternoon Strategy Sync' },
    { id: 'slot-5', time: '03:30 PM — 04:15 PM', label: 'Closing & Proposal Q&A' },
  ];

  // Intercept leadContext and hostContext and pre-fill booking form
  React.useEffect(() => {
    let titleVal = '';
    let descVal = '';
    let leadIdVal = leads[0]?.id || '';

    if (leadContext) {
      titleVal = `Sync Discovery: ${leadContext.project || 'General Inquiry'}`;
      leadIdVal = leadContext.id;
      descVal = leadContext.message || `Discovery session with ${leadContext.contactName || 'client representative'}.`;
    }

    if (hostContext) {
      titleVal = titleVal || `Technical Sync with ${hostContext.name}`;
      descVal = (descVal ? `${descVal}\n\n` : '') + `Hosted by: ${hostContext.name} (${hostContext.role}).`;
    }

    setBookingForm({
      title: titleVal,
      leadId: leadIdVal,
      description: descVal,
    });

    if (leadContext || hostContext) {
      setSelectedSlot(availableSlots[2]); // pre-select slot 3
    } else {
      setSelectedSlot(null);
    }
  }, [leadContext, hostContext, leads]);

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    if (!bookingForm.leadId && leads.length > 0) {
      setBookingForm(prev => ({
        ...prev,
        leadId: leads[0].id,
      }));
    }
  };

  const handleBookMeeting = (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    const assocLead = leads.find(l => l.id === bookingForm.leadId);
    const leadName = assocLead ? assocLead.company : 'Custom Client';
    const contactName = assocLead ? (assocLead.contactName || assocLead.contact_name) : 'Representative';

    const newMeeting = {
      id: `meet-${Date.now()}`,
      title: bookingForm.title.trim() || `Sync Call - ${leadName}`,
      leadCompany: leadName,
      leadId: bookingForm.leadId,
      contactName: contactName || 'N/A',
      timeSlot: selectedSlot.time,
      date: selectedDate,
      description: bookingForm.description.trim() || 'No description provided.',
      hostName: hostContext ? hostContext.name : '',
      hostAvatar: hostContext ? hostContext.avatar : '',
    };

    // Update shared meetings state
    setMeetings(prev => [newMeeting, ...prev]);

    // Automatically advance lead's pipeline stage to meeting-scheduled
    if (assocLead && onUpdateLead) {
      onUpdateLead({
        ...assocLead,
        stage: 'meeting-scheduled',
        time: `Today @ ${selectedSlot.time.split(' ')[0]} ${selectedSlot.time.split(' ').pop()}`
      });
    }

    // Reset slot selection and clear contexts if active
    setSelectedSlot(null);
    if (leadContext) {
      clearLeadContext();
    }
    if (hostContext && clearHostContext) {
      clearHostContext();
    }
  };

  const handleCancelMeeting = (id) => {
    if (window.confirm('Are you sure you want to cancel and remove this scheduled meeting?')) {
      setMeetings(prev => prev.filter(m => m.id !== id));
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto space-y-lg text-left">
      
      {/* Bento Inspired KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        <div className="glass-card p-lg rounded-2xl flex flex-col justify-between hover:shadow-lg transition-shadow bg-white/70 backdrop-blur-md border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-label-sm text-label-sm text-[#8f8f95] uppercase tracking-wider">Total Leads</p>
              <h3 className="font-headline-lg text-[32px] text-[#111111] font-black mt-xs">{totalLeads}</h3>
            </div>
            <div className="bg-[#1769ff]/10 p-sm rounded-lg text-[#1769ff]">
              <span className="material-symbols-outlined">users</span>
            </div>
          </div>
          <div className="mt-md flex items-center gap-xs">
            <span className="text-[#107c41] font-extrabold text-[12px]">Sync Active</span>
            <span className="text-[#8f8f95] text-[12px]">from live CRM database</span>
          </div>
        </div>

        <div className="glass-card p-lg rounded-2xl flex flex-col justify-between hover:shadow-lg transition-shadow bg-white/70 backdrop-blur-md border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-label-sm text-label-sm text-[#8f8f95] uppercase tracking-wider">Lead Conversion Rate</p>
              <h3 className="font-headline-lg text-[32px] text-[#111111] font-black mt-xs">{conversionRate}%</h3>
            </div>
            <div className="bg-[#107c41]/10 p-sm rounded-lg text-[#107c41]">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
          </div>
          <div className="mt-md flex items-center">
            <div className="w-full h-8 flex items-end gap-[2px]">
              <div className="w-1/12 bg-[#107c41]/20 h-2 rounded-full"></div>
              <div className="w-1/12 bg-[#107c41]/40 h-4 rounded-full"></div>
              <div className="w-1/12 bg-[#107c41]/30 h-3 rounded-full"></div>
              <div className="w-1/12 bg-[#107c41]/60 h-6 rounded-full"></div>
              <div className="w-1/12 bg-[#107c41]/50 h-5 rounded-full"></div>
              <div className="w-1/12 bg-[#107c41] h-8 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="glass-card p-lg rounded-2xl flex flex-col justify-between hover:shadow-lg transition-shadow bg-white/70 backdrop-blur-md border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-label-sm text-label-sm text-[#8f8f95] uppercase tracking-wider">Active Meetings</p>
              <h3 className="font-headline-lg text-[32px] text-[#111111] font-black mt-xs">{activeMeetingsCount}</h3>
            </div>
            <div className="bg-secondary-fixed p-sm rounded-lg text-[#3323cc]">
              <span className="material-symbols-outlined">event_available</span>
            </div>
          </div>
          <div className="mt-md flex -space-x-2">
            {meetings.slice(0, 4).map((m, idx) => (
              <div 
                key={m.id} 
                className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 text-white font-black text-[10px] flex items-center justify-center"
                title={`${m.title} with ${m.leadCompany}`}
              >
                {m.leadCompany.slice(0, 2).toUpperCase()}
              </div>
            ))}
            {meetings.length > 4 && (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-[#ececec] flex items-center justify-center text-[10px] font-bold">
                +{meetings.length - 4}
              </div>
            )}
            {meetings.length === 0 && (
              <span className="text-[#8f8f95] text-[12px]">No upcoming syncs booked</span>
            )}
          </div>
        </div>
      </section>

      {/* Booking Context Banner */}
      {leadContext && (
        <section className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-6 rounded-3xl shadow-md border border-white/10 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="absolute top-0 right-0 w-32 h-full opacity-10 bg-radial-gradient" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center backdrop-blur-md">
              <span className="material-symbols-outlined text-[28px] animate-bounce">notifications_active</span>
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-[#1769ff] px-2 py-0.5 rounded-full text-white">Scheduling Workflow Triggered</span>
              <h3 className="text-[18px] font-bold mt-1">Book Meeting for {leadContext.company}</h3>
              <p className="text-white/80 text-[12px] mt-0.5">Contact: {leadContext.contactName || 'N/A'} • Project: {leadContext.project}</p>
            </div>
          </div>
          <button 
            onClick={clearLeadContext}
            className="px-4 py-2 border border-white/20 hover:bg-white/10 text-white font-bold text-[13px] rounded-xl transition-all cursor-pointer relative z-10"
          >
            Cancel Custom Flow
          </button>
        </section>
      )}

      {/* Booking Host Banner */}
      {hostContext && (
        <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white p-6 rounded-3xl shadow-md border border-white/10 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="absolute top-0 right-0 w-32 h-full opacity-10 bg-radial-gradient" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/20 flex items-center justify-center bg-white/10 backdrop-blur-md">
              <img src={hostContext.avatar} alt={hostContext.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-[#1769ff] px-2 py-0.5 rounded-full text-white">Representative Host Locked</span>
              <h3 className="text-[18px] font-bold mt-1">Host Associate: {hostContext.name}</h3>
              <p className="text-white/80 text-[12px] mt-0.5">{hostContext.role} • TezX Core Staff</p>
            </div>
          </div>
          <button 
            onClick={clearHostContext}
            className="px-4 py-2 border border-white/20 hover:bg-white/10 text-white font-bold text-[13px] rounded-xl transition-all cursor-pointer relative z-10"
          >
            Clear Host Context
          </button>
        </section>
      )}

      {/* Main Scheduler Board */}
      <section className="glass-card rounded-3xl overflow-hidden shadow-sm bg-white border border-[#ececec]">
        <div className="p-lg border-b border-[#ececec] flex justify-between items-center bg-[#f7f7f8]/30">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-[#1769ff]">edit_calendar</span>
            <h2 className="font-headline-md text-[18px] font-black text-black">Integrated Meeting Scheduler</h2>
          </div>
          <span className="bg-[#e2f9ee] text-[#107c41] px-3 py-1 rounded-full font-bold text-[11px] uppercase tracking-wide">
            Sync: Realtime CRM
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
          
          {/* Left Pane: Calendar Form & Time Slots Selection */}
          <div className="lg:col-span-7 p-6 border-r border-[#ececec] bg-[#f7f7f8]/20 flex flex-col gap-6">
            <div>
              <label className="text-[11px] font-bold text-[#8f8f95] uppercase tracking-wider block mb-2">1. Select Target Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#8f8f95] uppercase tracking-wider block mb-2">2. Choose Available Time Slot</label>
              <div className="space-y-3">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => handleSelectSlot(slot)}
                      className={`w-full group flex items-center justify-between p-4 border rounded-2xl transition-all cursor-pointer text-left ${
                        isSelected 
                          ? 'border-[#1769ff] bg-[#1769ff]/5 border-2 shadow-sm' 
                          : 'border-[#ececec] bg-white hover:border-[#1769ff]/60 hover:bg-[#f7f7f8]/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-[20px] transition-colors ${
                          isSelected ? 'text-[#1769ff]' : 'text-[#8f8f95] group-hover:text-[#1769ff]'
                        }`}>
                          {isSelected ? 'check_circle' : 'schedule'}
                        </span>
                        <div>
                          <p className="font-extrabold text-[14px] text-black">{slot.time}</p>
                          <p className="text-[11px] text-[#8f8f95]">{slot.label}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[#8f8f95] opacity-0 group-hover:opacity-100 transition-opacity text-[18px]">
                        arrow_forward
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Pane: Booking Details Form */}
          <div className="lg:col-span-5 p-6 bg-white flex flex-col justify-between">
            {selectedSlot ? (
              <form onSubmit={handleBookMeeting} className="flex flex-col h-full justify-between gap-6">
                <div className="space-y-4">
                  <div className="border-b border-[#ececec] pb-2">
                    <h4 className="font-extrabold text-[15px] text-black">Complete Booking Details</h4>
                    <p className="text-[12px] text-[#8f8f95]">Selected: {selectedDate} @ {selectedSlot.time}</p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Meeting Subject *</label>
                    <input
                      type="text"
                      required
                      value={bookingForm.title}
                      onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                      placeholder="e.g. Discovery Sync - Apollo Design"
                      className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all text-[13px]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Client Lead Association *</label>
                    {leadContext ? (
                      <input
                        type="text"
                        disabled
                        value={leadContext.company}
                        className="w-full h-10 px-3 bg-[#f3f3f5] border border-[#ececec] rounded-xl text-[13px] text-black font-extrabold"
                      />
                    ) : leads.length > 0 ? (
                      <select
                        value={bookingForm.leadId}
                        onChange={(e) => setBookingForm({ ...bookingForm, leadId: e.target.value })}
                        className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all text-[13px]"
                      >
                        {leads.map(l => (
                          <option key={l.id} value={l.id}>{l.company} ({l.contactName || l.contact_name || 'Prospect'})</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        value="No leads available in CRM"
                        className="w-full h-10 px-3 bg-[#f3f3f5] border border-[#ececec] rounded-xl text-[13px] text-[#ba1a1a]"
                      />
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Agenda Description</label>
                    <textarea
                      value={bookingForm.description}
                      onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                      placeholder="Detail initial goals, technical issues, or pricing details..."
                      rows="4"
                      className="w-full p-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all text-[13px] resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#ececec]">
                  <button
                    type="button"
                    onClick={() => setSelectedSlot(null)}
                    className="px-4 py-2 hover:bg-[#f5f5f6] text-[#8f8f95] font-bold text-[13px] rounded-xl transition-all"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={leads.length === 0 && !leadContext}
                    className="px-5 py-2 bg-[#1769ff] hover:bg-[#0054e6] disabled:bg-[#8f8f95] text-white font-bold text-[13px] rounded-xl transition-all shadow-md shadow-[#1769ff]/10"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-12 px-6 h-full border border-dashed border-[#ececec] rounded-3xl bg-[#f7f7f8]/10">
                <span className="text-3xl mb-2">📅</span>
                <h5 className="font-extrabold text-[#111111] text-[14px]">Configure New Meeting</h5>
                <p className="text-[12px] text-[#8f8f95] max-w-[240px] mx-auto mt-1">Select a calendar date and an open slot on the left to activate the booking desk.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Booked Meetings Roster */}
      <section className="glass-card rounded-3xl p-6 bg-white border border-[#ececec] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[16px] font-black text-black">Active Booked Meetings</h3>
            <p className="text-[12px] text-[#8f8f95]">Roster of booked sync sessions managed collaboratively by admin desk.</p>
          </div>
          <span className="text-[11px] font-extrabold text-[#1769ff] uppercase tracking-wider">
            Total Sessions: {meetings.length}
          </span>
        </div>

        {meetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meetings.map((meet) => (
              <div 
                key={meet.id} 
                className="bg-white border border-[#ececec] rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-0.5 bg-[#f3f3f5] rounded text-[11px] font-extrabold text-black">
                      🏢 {meet.leadCompany}
                    </span>
                    <span className="text-[#1769ff] text-[11px] font-extrabold flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {meet.date}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-[14px] text-black mb-1 leading-tight">{meet.title}</h4>
                  <p className="text-[12px] text-[#8f8f95] line-clamp-2 leading-relaxed mb-4">{meet.description}</p>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-[#ececec]/50 mt-2 text-[12px]">
                  <div>
                    <span className="text-[10px] text-[#8f8f95] uppercase block">Slot Time</span>
                    <span className="font-extrabold text-black">{meet.timeSlot}</span>
                  </div>
                  {meet.hostName && (
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-[#ececec] rounded-xl px-2 py-1" title={`Host: ${meet.hostName}`}>
                      <img src={meet.hostAvatar} alt={meet.hostName} className="w-5 h-5 rounded-full object-cover border border-[#ececec]" />
                      <span className="text-[10px] font-bold text-slate-800 truncate max-w-[80px]">{meet.hostName.split(' ')[0]}</span>
                    </div>
                  )}
                  <button 
                    onClick={() => handleCancelMeeting(meet.id)}
                    className="flex items-center gap-xs px-2.5 py-1.5 rounded-lg border border-[#ba1a1a]/30 hover:bg-[#ffebee] text-[#ba1a1a] font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px]">cancel</span>
                    Cancel Meeting
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-[#ececec] rounded-2xl text-[#8f8f95]">
            <span className="text-2xl mb-1 block">🏖️</span>
            <p className="text-[12px]">No upcoming sync sessions found on calendar. Launch booking desk above to schedule.</p>
          </div>
        )}
      </section>

    </div>
  );
}

export default Scheduler;
