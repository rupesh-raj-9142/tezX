import React, { useState } from 'react';

function Support() {
  const [openFaq, setOpenFaq] = useState(null);
  const [messageSent, setMessageSent] = useState(false);
  const [formData, setFormData] = useState({ subject: '', message: '' });

  const toggleFaq = (index) => {
    if (openFaq === index) {
      setOpenFaq(null);
    } else {
      setOpenFaq(index);
    }
  };

  const handleSendMessage = () => {
    if (formData.subject && formData.message) {
      setMessageSent(true);
      setFormData({ subject: '', message: '' });
      setTimeout(() => setMessageSent(false), 5000);
    }
  };

  const faqs = [
    {
      q: "How do I add a new team member?",
      a: "Go to Settings > Integrations, and click on 'Team Management'. From there, click 'Add Member' and enter their email address. They will receive an invitation link."
    },
    {
      q: "Can I export my pipeline data?",
      a: "Yes! In the Pipeline view, click on the three dots (more options) in the top right corner and select 'Export as CSV'. Your download will begin immediately."
    },
    {
      q: "How to configure email integration?",
      a: "Navigate to Settings > Integrations. Click 'Connect' on the Google Workspace or Outlook option. You will be prompted to authenticate with your email provider to sync communications."
    }
  ];

  return (
    <div className="flex flex-col gap-lg max-w-4xl">
      <div className="mb-md">
        <h2 className="text-headline-lg font-headline-lg font-bold text-on-surface">Help & Support</h2>
        <p className="text-body-md text-on-surface-variant">Find answers or get in touch with our team</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        {/* Quick Help Cards */}
        <div className="bg-primary-container text-on-primary-container rounded-2xl p-lg flex flex-col gap-sm hover:-translate-y-1 transition-transform cursor-pointer">
          <span className="material-symbols-outlined text-[32px]">menu_book</span>
          <h3 className="text-headline-md font-headline-md font-bold mt-sm">Documentation</h3>
          <p className="text-body-sm opacity-90">Read detailed guides and API references for TezX CRM.</p>
        </div>

        <div className="bg-secondary-fixed text-on-secondary-fixed rounded-2xl p-lg flex flex-col gap-sm hover:-translate-y-1 transition-transform cursor-pointer">
          <span className="material-symbols-outlined text-[32px]">forum</span>
          <h3 className="text-headline-md font-headline-md font-bold mt-sm">Community Forum</h3>
          <p className="text-body-sm opacity-90">Connect with other users and share best practices.</p>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-xl shadow-sm flex flex-col gap-md">
        <div className="flex items-center gap-md border-b border-outline-variant pb-md mb-sm">
          <span className="material-symbols-outlined text-primary text-[28px]">quiz</span>
          <h3 className="text-headline-md font-headline-md font-bold text-on-surface">Frequently Asked Questions</h3>
        </div>

        <div className="flex flex-col gap-md">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`bg-surface-container-low rounded-xl border border-outline-variant cursor-pointer transition-colors overflow-hidden ${openFaq === index ? 'border-primary bg-primary-container/5' : 'hover:bg-surface-container'}`}
            >
              <div
                className="flex justify-between items-center p-md"
                onClick={() => toggleFaq(index)}
              >
                <h4 className={`font-bold ${openFaq === index ? 'text-primary' : 'text-on-surface'}`}>{faq.q}</h4>
                <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${openFaq === index ? 'rotate-180 text-primary' : ''}`}>expand_more</span>
              </div>
              {openFaq === index && (
                <div className="px-md pb-md pt-xs">
                  <p className="text-body-md text-on-surface-variant">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-xl shadow-sm flex flex-col gap-md relative overflow-hidden">
        <h3 className="text-headline-md font-headline-md font-bold text-on-surface">Still need help?</h3>
        <p className="text-body-sm text-on-surface-variant mb-sm">Send a message to our dedicated support team and we'll get back to you within 24 hours.</p>

        {messageSent ? (
          <div className="flex flex-col items-center justify-center p-xl gap-md bg-success-container text-on-success-container rounded-xl">
            <span className="material-symbols-outlined text-[48px]">check_circle</span>
            <h4 className="font-bold text-headline-md">Message Sent!</h4>
            <p className="text-body-md opacity-90 text-center">We've received your request and will contact you shortly.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Subject</label>
              <input
                type="text"
                placeholder="Briefly describe your issue"
                className="bg-surface-container-low border border-outline-variant rounded-xl px-md py-sm outline-none focus:border-primary transition-colors text-body-md w-full"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant">Message</label>
              <textarea
                placeholder="Provide more details here..."
                rows="4"
                className="bg-surface-container-low border border-outline-variant rounded-xl px-md py-sm outline-none focus:border-primary transition-colors text-body-md w-full resize-none"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              ></textarea>
            </div>
            <div className="flex justify-end mt-sm">
              <button
                className={`px-xl py-sm rounded-xl font-bold flex items-center gap-sm transition-colors ${formData.subject && formData.message ? 'bg-primary text-on-primary hover:brightness-110' : 'bg-surface-variant text-on-surface-variant opacity-50 cursor-not-allowed'}`}
                onClick={handleSendMessage}
                disabled={!formData.subject || !formData.message}
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
                Send Message
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default Support;
