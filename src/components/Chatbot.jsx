import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, RefreshCw, Sparkles, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const getSimulatedResponse = (text, isAdmin) => {
  const t = text.toLowerCase();
  
  if (t.includes('invoice') || t.includes('pay') || t.includes('billing')) {
    return `To manage billing and pay an invoice:
1. Navigate to the **Payments** tab in the top navigation bar.
2. Select any active invoice marked as **Pending** in the billing desk.
3. Fill in your payment details (Name, Card Number, Expiry, and CVV).
4. Click **Pay Invoice** to complete the payment.

The system will display a real-time checkout verification step and instantly update the project status to **Completed** in our Supabase core!`;
  }
  
  if (t.includes('submit') || t.includes('inquiry') || t.includes('brief')) {
    return `To submit a project brief or service inquiry:
1. Open the **Inquiry Desk** tab at the top.
2. Enter your Name, Email, Company, Service interest, and a brief description.
3. Click **Submit Inquiry**. 

Your brief will automatically synchronize with Supabase and immediately populate the administrator's sales pipeline!`;
  }
  
  if (t.includes('progress') || t.includes('stage') || t.includes('milestone')) {
    return `The TezX project workflow progresses through three distinct status stages:
- **New / Under Review**: Administrators are auditing scope, budget, and requirements.
- **Review Approved / Meeting Scheduled**: A discovery meeting has been planned to map out engineering requirements.
- **Active Account / Won**: Project development is underway or completed, and invoices are generated in the Payments tab.`;
  }
  
  if (t.includes('support') || t.includes('contact')) {
    return `You can contact support directly from your portal:
1. Scroll down to the footer and click the **Support** link.
2. Write a subject and enter your query in the support ticket form.
3. Click **Submit Support Ticket**. 

Our admins will receive the ticket on their central workspace and resolve it within 4 hours.`;
  }

  if (t.includes('pipeline') || t.includes('deal') || t.includes('leads')) {
    if (isAdmin) {
      return `To manage the sales pipeline:
1. Go to the **Admin Portal** ➔ **Deals Pipeline** view.
2. Drag-and-drop or click on lead cards to update their stage (e.g. from *New* to *Under Review* or *Won*).
3. Any stage transition instantly notifies the customer and updates their inquiry workspace.`;
    }
    return `The sales pipeline is managed by administrators. Once you submit an inquiry, an admin will review the brief, schedule discovery meetings, and promote the lead to a project. You can track progress under the **Project Status** tab.`;
  }

  if (t.includes('sync') || t.includes('external') || t.includes('integration')) {
    if (isAdmin) {
      return `To monitor integration sync status:
1. Go to the **Admin Portal** and look at the **Sync Applications** dashboard card.
2. You can view real-time sync histories for Google Calendar, Slack alerts, Jira tickets, and Database sync.
3. Click **Force Sync** on any app to trigger an immediate data reconciliation.`;
    }
    return `TezX CRM features a synchronized core that updates databases every 5 seconds. All lead requests, payment receipts, and project updates you submit are securely updated across both the user and administrator views instantly.`;
  }

  if (t.includes('schedule') || t.includes('meeting') || t.includes('calendar')) {
    if (isAdmin) {
      return `To schedule team meetings:
1. Scroll to the **Meeting Scheduler** widget in the Admin Portal.
2. Select an active lead, set the date and time, and input meeting notes.
3. Click **Schedule Meeting** to automatically block calendars and notify participants.`;
    }
    return `Discovery meetings are scheduled by our team after you submit an inquiry. Once scheduled, a "Meeting Scheduled" status will appear under your **Project Status** tab.`;
  }

  if (t.includes('member') || t.includes('team') || t.includes('add member')) {
    if (isAdmin) {
      return `To manage the active administration team:
1. Go to the **Admin Portal** ➔ **Active Team** roster.
2. Click the **Add Member** button, fill in their credentials, role, and choose an avatar.
3. The member card will instantly appear on the dashboard roster.`;
    }
    return `You can view the active TezX support team roster on the main landing desk of your portal, showing roles and availability status.`;
  }

  return `I am here to guide you through the TezX CRM! You can ask me about pipelines, payments, inquiries, meetings, or database sync logs. 

Feel free to try one of the quick suggestions below or type a custom question!`;
};

function Chatbot({ session, isAdmin }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const userEmail = session?.user?.email || 'User';
  const userName = session?.user?.user_metadata?.full_name || userEmail.split('@')[0];

  const clientSuggestions = [
    'How do I submit an inquiry?',
    'How do I pay an invoice?',
    'Check project progress stages',
    'Who do I contact for support?'
  ];

  const adminSuggestions = [
    'How to manage pipelines?',
    'Check sync status',
    'How to schedule team meetings?',
    'How to add team members?'
  ];

  const suggestions = isAdmin ? adminSuggestions : clientSuggestions;

  // Initialize welcome message
  useEffect(() => {
    const welcomeMsg = isAdmin
      ? `Hello Admin **${userName}**! I am the TezX AI engine. I can help you manage sales pipelines, schedule meetings, sync external apps, or inspect team rosters. What can I do for you today?`
      : `Hi **${userName}**! I am your TezX assistant. I can help you submit inquiries, track project milestones, check invoices, or make payments. What can I help you with today?`;

    setMessages([
      { id: 'welcome', sender: 'bot', text: welcomeMsg, timestamp: new Date() }
    ]);
  }, [isAdmin, userName]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = (text) => {
    if (!text.trim()) return;

    // Add User Message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate Bot typing and response
    setTimeout(() => {
      const botResponse = getSimulatedResponse(text, isAdmin);
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 800);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  const handleResetChat = () => {
    const welcomeMsg = isAdmin
      ? `Hello Admin **${userName}**! I am the TezX AI engine. I can help you manage sales pipelines, schedule meetings, sync external apps, or inspect team rosters. What can I do for you today?`
      : `Hi **${userName}**! I am your TezX assistant. I can help you submit inquiries, track project milestones, check invoices, or make payments. What can I help you with today?`;

    setMessages([
      { id: 'welcome', sender: 'bot', text: welcomeMsg, timestamp: new Date() }
    ]);
  };

  // Helper to format bot markdown-like syntax (**bold** and lists)
  const formatMessageText = (text) => {
    return text.split('\n').map((line, lineIdx) => {
      // Bold formatter
      let formattedLine = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-extrabold text-[#1769ff]">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      const content = parts.length > 0 ? parts : formattedLine;

      // Unordered list formatter
      if (line.trim().startsWith('- ')) {
        return (
          <li key={lineIdx} className="ml-4 list-disc mt-1 text-[13px]">
            {line.trim().substring(2)}
          </li>
        );
      }
      // Ordered list formatter
      const orderedMatch = line.trim().match(/^(\d+)\.\s(.*)/);
      if (orderedMatch) {
        return (
          <div key={lineIdx} className="ml-2 flex items-start gap-1 mt-1 text-[13px]">
            <span className="font-bold text-[#1769ff]">{orderedMatch[1]}.</span>
            <span>{orderedMatch[2]}</span>
          </div>
        );
      }

      return <p key={lineIdx} className="mt-1 min-h-[1em] text-[13px]">{content}</p>;
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-body-md select-none text-left">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-[360px] sm:w-[400px] h-[520px] sm:h-[580px] bg-white/90 backdrop-blur-xl border border-[#ececec] shadow-[0_12px_40px_rgba(0,0,0,0.12)] rounded-[32px] flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-black p-4 flex items-center justify-between text-white select-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center relative border border-white/10">
                  <Bot className="w-5 h-5 text-[#1769ff]" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-black animate-pulse" />
                </div>
                <div>
                  <h3 className="text-[14px] font-black tracking-tight flex items-center gap-1.5">
                    <span>TezX Assistant</span>
                    <Sparkles className="w-3.5 h-3.5 text-brand-purple animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">AI CRM engine online</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetChat}
                  className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center transition-all border-none bg-transparent cursor-pointer text-slate-300 hover:text-white"
                  title="Reset conversation"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl hover:bg-white/10 flex items-center justify-center transition-all border-none bg-transparent cursor-pointer text-slate-300 hover:text-white"
                  title="Minimize"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 max-w-[85%] ${
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${
                      msg.sender === 'user'
                        ? 'bg-slate-900'
                        : 'bg-[#1769ff]/10 text-[#1769ff]'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`p-3.5 rounded-3xl shadow-sm border text-[13px] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-tr from-[#1769ff] to-[#3525cd] text-white border-[#1769ff]/10 rounded-tr-sm'
                        : 'bg-white text-slate-800 border-[#ececec] rounded-tl-sm'
                    }`}
                  >
                    {msg.sender === 'user' ? msg.text : formatMessageText(msg.text)}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2 max-w-[85%]">
                  <div className="w-7 h-7 rounded-xl bg-[#1769ff]/10 text-[#1769ff] flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3.5 rounded-3xl rounded-tl-sm bg-white border border-[#ececec] shadow-sm flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            <div className="flex flex-wrap gap-1.5 p-3 bg-white border-t border-[#ececec]/60 max-h-[110px] overflow-y-auto scrollbar-none">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s)}
                  className="px-3.5 py-1.5 bg-[#f3f3f5] border border-[#ececec] rounded-full text-[11px] font-black text-[#1769ff] hover:bg-[#1769ff] hover:text-white hover:border-[#1769ff] transition-all shadow-sm cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input form */}
            <form
              onSubmit={handleFormSubmit}
              className="p-3.5 bg-white border-t border-[#ececec]/80 flex gap-2 items-center"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask a question..."
                className="flex-grow h-11 px-4 bg-[#f3f3f5]/60 border border-[#ececec] rounded-2xl outline-none text-[13px] focus:ring-2 focus:ring-[#1769ff]/15 focus:border-[#1769ff] focus:bg-white transition-all font-medium"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="w-11 h-11 bg-black hover:bg-black/90 text-white rounded-2xl flex items-center justify-center transition-all hover:scale-[1.03] active:scale-[0.97] border-none cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating launcher bubble */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-[#1769ff] via-[#3525cd] to-[#6d3df5] text-white rounded-[20px] flex items-center justify-center shadow-[0_6px_24px_rgba(23,105,255,0.35)] relative border-none cursor-pointer"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <MessageSquare className="w-6 h-6" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

export default Chatbot;
