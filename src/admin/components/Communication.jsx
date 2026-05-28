import React, { useState, useEffect } from 'react';

function Communication({ leads = [], leadContext, onUpdateLead }) {
  const [selectedLeadId, setSelectedLeadId] = useState(leadContext?.id || '');
  const [replyText, setReplyText] = useState('');
  const [noteType, setNoteType] = useState('email'); // 'email' or 'note'

  // Load message logs from localStorage
  const [messagesMap, setMessagesMap] = useState(() => {
    try {
      const saved = localStorage.getItem('tezx_messages');
      if (saved && saved !== 'undefined') return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse tezx_messages:", e);
    }
    return {};
  });

  // Sync messages back to localStorage
  useEffect(() => {
    localStorage.setItem('tezx_messages', JSON.stringify(messagesMap));
  }, [messagesMap]);

  // Handle leadContext initial focus
  useEffect(() => {
    if (leadContext) {
      setSelectedLeadId(leadContext.id);
    } else if (leads.length > 0 && !selectedLeadId) {
      setSelectedLeadId(leads[0].id);
    }
  }, [leadContext, leads]);

  const activeLead = leads.find(l => l.id === selectedLeadId) || leads[0];

  // Retrieve message log for active lead, or pre-populate with default submission note
  const getActiveLeadLogs = () => {
    if (!activeLead) return [];
    
    const logs = messagesMap[activeLead.id];
    if (logs) return logs;

    // Fallback: create initial inquiry log
    const initialLog = [
      {
        id: `msg-init-${activeLead.id}`,
        title: 'Inquiry Submitted',
        content: activeLead.message || 'Interested in scale integrations and automation setup.',
        time: activeLead.time || 'A few hours ago',
        type: 'inquiry',
        icon: 'description',
        color: 'bg-tertiary-container text-on-tertiary-container'
      }
    ];
    return initialLog;
  };

  const activeLogs = getActiveLeadLogs();

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeLead) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      title: noteType === 'email' ? 'Reply Email Sent' : 'Internal System Note Added',
      content: replyText.trim(),
      time: 'Just now',
      type: noteType,
      icon: noteType === 'email' ? 'mail' : 'sticky_note_2',
      color: noteType === 'email' ? 'bg-[#1769ff] text-white' : 'bg-[#e2dfff] text-[#3323cc]'
    };

    setMessagesMap(prev => {
      const currentList = prev[activeLead.id] || getActiveLeadLogs();
      const updatedList = [newMsg, ...currentList];
      return {
        ...prev,
        [activeLead.id]: updatedList
      };
    });

    setReplyText('');
  };

  const getInitials = (company) => {
    return (company || 'LD')
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-screen-xl mx-auto text-left">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        
        {/* Left Side: CRM Leads Inbox Select Sidebar */}
        <aside className="lg:col-span-4 bg-white border border-[#ececec] rounded-3xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-[16px] font-black text-black">Inbound Communications</h3>
            <p className="text-[11px] text-[#8f8f95]">Select pipeline contact to open correspondence log</p>
          </div>

          <div className="flex flex-col gap-sm max-h-[480px] overflow-y-auto pr-1">
            {leads.length > 0 ? (
              leads.map((lead) => {
                const isSelected = selectedLeadId === lead.id || (!selectedLeadId && leads[0].id === lead.id);
                return (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-[#1769ff] bg-[#1769ff]/5 border-2 shadow-sm'
                        : 'border-[#ececec] bg-white hover:border-[#1769ff]/40 hover:bg-[#f7f7f8]/30'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#f3f3f5] border border-[#ececec] flex items-center justify-center font-extrabold text-[12px] text-black flex-shrink-0">
                      {getInitials(lead.company)}
                    </div>
                    <div className="truncate min-w-0">
                      <div className="font-extrabold text-[13px] text-black truncate">{lead.company}</div>
                      <div className="text-[11px] text-[#8f8f95] truncate">{lead.project}</div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-8 text-[#8f8f95] border border-dashed border-[#ececec] rounded-2xl">
                <p className="text-[12px]">No pipeline leads found.</p>
              </div>
            )}
          </div>
        </aside>

        {/* Right Side: Communication Timeline & Chat Composer */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          {activeLead ? (
            <>
              {/* Selected Lead Info Banner */}
              <div className="bg-white border border-[#ececec] rounded-3xl p-6 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-md">
                  <div className="w-14 h-14 rounded-2xl bg-[#e2dfff] flex items-center justify-center text-[#3323cc] font-black text-[18px]">
                    {getInitials(activeLead.company)}
                  </div>
                  <div>
                    <h2 className="text-[20px] font-black text-black leading-snug">{activeLead.company}</h2>
                    <div className="flex flex-wrap items-center gap-sm mt-1">
                      <span className="bg-[#1769ff]/10 text-[#1769ff] px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide uppercase">
                        {activeLead.stage.replace('-', ' ')}
                      </span>
                      <span className="text-[#8f8f95] text-[12px] flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[15px]">mail</span>
                        {activeLead.contactEmail || activeLead.contact_email || 'No email synced'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col text-right text-[12px]">
                  <span className="text-[#8f8f95] font-bold">Contact Name</span>
                  <span className="font-extrabold text-black mt-0.5">{activeLead.contactName || activeLead.contact_name || 'Prospect Representative'}</span>
                </div>
              </div>

              {/* Message Timeline */}
              <div className="bg-white border border-[#ececec] rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                <div>
                  <h3 className="text-[16px] font-black text-black">Interaction Timeline</h3>
                  <p className="text-[11px] text-[#8f8f95]">Collaborative log containing inquiries, reply emails, and system updates</p>
                </div>

                <div className="relative space-y-6 max-h-[360px] overflow-y-auto pr-1">
                  {/* Vertical center timeline line */}
                  <div className="absolute left-6 top-2 bottom-2 w-[1.5px] bg-[#ececec]" />

                  {activeLogs.map((log) => (
                    <div key={log.id} className="relative pl-14 animate-in fade-in duration-200">
                      <div className={`absolute left-3 w-6 h-6 rounded-full flex items-center justify-center z-10 border-4 border-white ${log.color || 'bg-slate-200 text-slate-800'}`}>
                        <span className="material-symbols-outlined text-[12px]">
                          {log.icon || 'chat'}
                        </span>
                      </div>
                      <div className="bg-[#f7f7f8]/50 rounded-2xl p-4 border border-[#ececec] text-left">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-extrabold text-black text-[13px]">{log.title}</h4>
                          <span className="text-[10px] text-[#8f8f95] font-bold">{log.time}</span>
                        </div>
                        <p className="text-[#444] text-[12px] leading-relaxed whitespace-pre-wrap">{log.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Composer Box */}
              <div className="bg-white border border-[#ececec] rounded-3xl p-6 shadow-sm">
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#ececec] pb-2">
                    <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Draft Message / System Comment</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNoteType('email')}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                          noteType === 'email' 
                            ? 'bg-[#1769ff]/10 text-[#1769ff] border-[#1769ff]/20' 
                            : 'bg-white border-[#ececec] text-[#8f8f95]'
                        }`}
                      >
                        Email Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => setNoteType('note')}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                          noteType === 'note' 
                            ? 'bg-[#3323cc]/10 text-[#3323cc] border-[#3323cc]/20' 
                            : 'bg-white border-[#ececec] text-[#8f8f95]'
                        }`}
                      >
                        Internal Note
                      </button>
                    </div>
                  </div>

                  <textarea
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={noteType === 'email' ? `Send official reply email to ${activeLead.contactEmail || 'client email'}...` : 'Add internal system note for other administrators...'}
                    rows="3"
                    className="w-full p-4 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all text-[13px] resize-none"
                  />

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-black hover:bg-black/90 text-white font-bold text-[13px] rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center gap-1.5 border-none"
                    >
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      <span>{noteType === 'email' ? 'Send Response' : 'Add Note'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-16 px-8 border border-dashed border-[#ececec] rounded-3xl bg-white h-80">
              <span className="text-4xl mb-2">✉️</span>
              <h4 className="font-extrabold text-[#111111] text-[15px]">Select Correspondence</h4>
              <p className="text-[12px] text-[#8f8f95] max-w-[280px] mx-auto mt-1">Select a prospect from the inbox sidebar to review the live timeline and log responses.</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default Communication;
