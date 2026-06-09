import React from 'react';
import { motion } from 'framer-motion';

function StatsCards({ leads = [], projects = [], people = [], companies = [] }) {
  // 1. Revenue Pipeline Calculations
  const totalRevenue = projects.reduce((sum, p) => {
    const val = parseFloat(p.budget.replace(/[^0-9.]/g, '')) || 0;
    return sum + val;
  }, 0);

  const successLeadsCount = leads.filter(l => l.stage === 'success' || l.stage === 'won').length;
  const conversionRate = leads.length > 0 ? Math.round((successLeadsCount / leads.length) * 100) : 0;

  // 2. Active Projects Calculations
  const activeProjectsCount = projects.filter(p => p.status === 'In Progress').length;
  const activeProjectsPct = projects.length > 0 ? Math.round((activeProjectsCount / projects.length) * 100) : 0;

  // 3. Total Leads Calculations
  const totalLeadsCount = leads.length;
  const newLeadsCount = leads.filter(l => l.stage === 'new').length;
  const newLeadsPct = leads.length > 0 ? Math.round((newLeadsCount / leads.length) * 100) : 0;

  // 4. Active Contacts Calculations
  const contactsCount = people.length;
  const activeContactsCount = people.filter(p => p.status === 'Active').length;
  const activeContactsPct = people.length > 0 ? Math.round((activeContactsCount / people.length) * 100) : 0;

  const cards = [
    {
      id: 'revenue',
      title: 'Revenue Pipeline',
      value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      comparison: 'Lead conversion rate',
      percentage: conversionRate,
      color: '#6d3df5', // Purple
      trackColor: '#f2ecff',
    },
    {
      id: 'projects',
      title: 'Active Projects',
      value: activeProjectsCount.toString(),
      comparison: `Total projects: ${projects.length}`,
      percentage: activeProjectsPct,
      color: '#1769ff', // Blue
      trackColor: '#e8f0fe',
    },
    {
      id: 'leads',
      title: 'Total Leads',
      value: totalLeadsCount.toString(),
      comparison: `${newLeadsCount} new opportunities`,
      percentage: newLeadsPct,
      color: '#ffb11a', // Orange
      trackColor: '#fff8eb',
    },
    {
      id: 'contacts',
      title: 'Contacts',
      value: contactsCount.toString(),
      comparison: `Across ${companies.length} companies`,
      percentage: activeContactsPct,
      color: '#107c41', // Green
      trackColor: '#e2f9ee',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full border-t border-[#ececec] pt-8 mb-6 text-left">
      {cards.map(card => {
        // SVG circle dimensions
        const radius = 22;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (card.percentage / 100) * circumference;

        return (
          <motion.div
            key={card.id}
            whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}
            className="bg-white border border-[#ececec]/60 rounded-[24px] p-6 flex items-center justify-between shadow-sm relative overflow-hidden transition-all duration-300"
          >
            {/* Card Content */}
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-semibold text-[#8f8f95] uppercase tracking-wider mb-2 truncate">
                {card.title}
              </span>
              <span className="text-[28px] font-black text-[#111111] leading-none mb-2 truncate">
                {card.value}
              </span>
              <span className="text-[12px] text-[#8f8f95] truncate">
                {card.comparison}
              </span>
            </div>

            {/* Circular Progress Ring */}
            <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke={card.trackColor}
                  strokeWidth="4.5"
                  fill="transparent"
                />
                {/* Progress Ring */}
                <motion.circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke={card.color}
                  strokeWidth="4.5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>

              {/* Text Inside Ring */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[11px] font-extrabold text-[#111111]">
                  +{card.percentage}%
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default StatsCards;
