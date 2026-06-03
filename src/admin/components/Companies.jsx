import React, { useState } from 'react';

function Companies({ companies = [], setCompanies, searchTerm: propSearchTerm, setSearchTerm: propSetSearchTerm }) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const searchTerm = propSearchTerm !== undefined ? propSearchTerm : localSearchTerm;
  const setSearchTerm = propSetSearchTerm !== undefined ? propSetSearchTerm : setLocalSearchTerm;
  
  // Modal States
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Form States
  const [form, setForm] = useState({
    name: '',
    industry: 'Technology',
    size: '10-50',
    website: '',
    status: 'Active Client',
  });
  const [formErrors, setFormErrors] = useState({});

  // Filter & Search Logic
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = 
      (company.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.industry || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (company.website || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || company.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setForm({
      name: '',
      industry: 'Technology',
      size: '10-50',
      website: '',
      status: 'Active Client',
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (company) => {
    setSelectedCompany(company);
    setForm({
      name: company.name,
      industry: company.industry,
      size: company.size || '10-50',
      website: company.website || '',
      status: company.status || 'Active Client',
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Company Name is required';
    if (!form.industry.trim()) errors.industry = 'Industry is required';
    if (!form.website.trim()) {
      errors.website = 'Website is required';
    } else if (!form.website.includes('.') || form.website.length < 4) {
      errors.website = 'Invalid website format';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const initials = form.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newCompany = {
      id: `company-${Date.now()}`,
      name: form.name.trim(),
      industry: form.industry.trim(),
      size: form.size,
      website: form.website.trim().toLowerCase(),
      status: form.status,
      avatar: initials || 'CO',
    };

    setCompanies(prev => [newCompany, ...prev]);
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const updatedCompanies = companies.map(c => {
      if (c.id === selectedCompany.id) {
        const initials = form.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
          
        return {
          ...c,
          name: form.name.trim(),
          industry: form.industry.trim(),
          size: form.size,
          website: form.website.trim().toLowerCase(),
          status: form.status,
          avatar: c.avatar && c.avatar.startsWith('http') ? c.avatar : (initials || 'CO')
        };
      }
      return c;
    });

    setCompanies(updatedCompanies);
    setSelectedCompany(null);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}? All associated project logs will retain their historical names but lose client references.`)) {
      setCompanies(prev => prev.filter(c => c.id !== id));
      if (selectedCompany?.id === id) {
        setSelectedCompany(null);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active Client':
        return 'bg-[#e2f9ee] text-[#107c41]';
      case 'Prospect':
        return 'bg-[#e2dfff] text-[#3323cc]';
      case 'Former Client':
        return 'bg-[#f3f3f5] text-[#8f8f95]';
      default:
        return 'bg-[#f3f3f5] text-[#111111]';
    }
  };

  const getIndustryColor = (industry) => {
    switch (industry.toLowerCase()) {
      case 'technology': return 'bg-[#1769ff]/10 text-[#1769ff]';
      case 'retail': return 'bg-[#ffb11a]/15 text-[#b27200]';
      case 'consulting': return 'bg-[#6d3df5]/10 text-[#6d3df5]';
      case 'finance': return 'bg-[#005338]/10 text-[#005338]';
      default: return 'bg-[#ececeef0] text-[#444]';
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      {/* Header section */}
      <header className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-[32px] text-[#111111] font-bold tracking-tight mb-1">Company Accounts</h2>
          <p className="font-body-md text-[14px] text-[#8f8f95]">
            Manage client businesses, active accounts, and institutional opportunities ({companies.length} total).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#f3f3f5] rounded-xl p-1 flex gap-1 border border-[#ececec]">
            <button 
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white shadow-sm text-[#1769ff]' 
                  : 'text-[#8f8f95] hover:bg-black/5'
              }`}
            >
              Card Grid
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-all ${
                viewMode === 'list' 
                  ? 'bg-white shadow-sm text-[#1769ff]' 
                  : 'text-[#8f8f95] hover:bg-black/5'
              }`}
            >
              Table View
            </button>
          </div>
          <button 
            onClick={handleOpenAddModal}
            className="bg-[#1769ff] text-white px-4 py-2.5 rounded-xl text-[14px] flex items-center gap-1.5 font-bold hover:bg-[#0054e6] active:scale-95 transition-all shadow-md shadow-[#1769ff]/10 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">domain_add</span>
            Add Company
          </button>
        </div>
      </header>

      {/* Filters bar */}
      <div className="bg-white border border-[#ececec]/60 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full md:flex-grow md:max-w-[480px] lg:max-w-[640px] transition-all duration-300">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[20px] text-[#8f8f95]">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by company name, industry..."
            className="w-full h-10 pl-10 pr-4 bg-[#f7f7f8] border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px]"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-2.5 text-[#8f8f95] hover:text-black"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Filters Select */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-[12px] font-bold text-[#8f8f95] uppercase whitespace-nowrap">Status:</label>
          <div className="flex gap-2 flex-wrap">
            {['All', 'Active Client', 'Prospect', 'Former Client'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-all ${
                  statusFilter === status 
                    ? 'bg-[#e2dfff] text-[#3323cc] border-[#e2dfff]' 
                    : 'bg-white border-[#ececec] text-[#444] hover:bg-[#f5f5f6]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredCompanies.length === 0 ? (
        <div className="border border-dashed border-[#ececec] rounded-3xl py-16 px-8 text-center text-[#8f8f95] bg-[#f7f7f8]/50 animate-in fade-in duration-200">
          <span className="text-4xl mb-3 block">🏢</span>
          <h4 className="text-[16px] font-extrabold text-[#111111] mb-1">No companies found</h4>
          <p className="text-[13px] max-w-[320px] mx-auto">Try adjusting your search criteria or click "Add Company" to create a new client.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {filteredCompanies.map((company) => (
            <div 
              key={company.id}
              className="bg-white border border-[#ececec]/60 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-[#1769ff]/30 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  {company.avatar && company.avatar.startsWith('http') ? (
                    <img 
                      src={company.avatar} 
                      alt={company.name} 
                      className="w-14 h-14 rounded-full object-cover border border-[#ececec] shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-black text-white text-[20px] flex items-center justify-center font-black shadow-md relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
                      <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-black" />
                      <span className="relative z-10">{company.avatar || 'CO'}</span>
                    </div>
                  )}
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${getStatusBadge(company.status)}`}>
                    {company.status}
                  </span>
                </div>

                <h4 className="text-[18px] font-extrabold text-[#111111] group-hover:text-[#1769ff] transition-colors mb-1 truncate">{company.name}</h4>
                
                <div className="flex flex-wrap gap-2 mt-3 mb-4">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${getIndustryColor(company.industry)}`}>
                    {company.industry}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#f3f3f5] text-[#111111] text-[11px] font-bold border border-[#ececec]">
                    👥 {company.size} employees
                  </span>
                </div>

                <div className="space-y-2 border-t border-[#ececec]/50 pt-4 text-[13px]">
                  <a 
                    href={`https://${company.website}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 text-[#1769ff] hover:underline font-bold transition-all truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="material-symbols-outlined text-[16px]">public</span>
                    {company.website}
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-[#ececec]/40">
                <button
                  onClick={() => handleOpenEditModal(company)}
                  className="px-3 py-1.5 bg-[#f3f3f5] hover:bg-[#e2dfff] hover:text-[#3323cc] text-[#444] font-bold text-[12px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(company.id, company.name)}
                  className="px-3 py-1.5 hover:bg-red-50 text-[#8f8f95] hover:text-[#ba1a1a] font-bold text-[12px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List Table View */
        <div className="bg-white border border-[#ececec]/60 rounded-3xl shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ececec] bg-[#f7f7f8]/40">
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8f8f95] uppercase">Company</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8f8f95] uppercase">Industry</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8f8f95] uppercase">Size</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8f8f95] uppercase">Website URL</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8f8f95] uppercase">Account Status</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8f8f95] uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]/50">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-[#f7f7f8]/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-black text-white text-[13px] flex items-center justify-center font-bold relative overflow-hidden flex-shrink-0 shadow-sm">
                          <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-black" />
                          <span className="relative z-10">{company.avatar || 'CO'}</span>
                        </div>
                        <div>
                          <div className="font-bold text-[#111111] group-hover:text-[#1769ff] transition-colors">{company.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${getIndustryColor(company.industry)}`}>
                        {company.industry}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-bold text-[#444]">
                      {company.size} employees
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={`https://${company.website}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[#1769ff] hover:underline font-bold text-[13px] flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="material-symbols-outlined text-[14px]">public</span>
                        {company.website}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${getStatusBadge(company.status)}`}>
                        {company.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(company)}
                          className="p-1 text-[#8f8f95] hover:text-[#1769ff] rounded-full hover:bg-black/5 active:scale-90 transition-all"
                          title="Edit Company"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(company.id, company.name)}
                          className="p-1 text-[#8f8f95] hover:text-[#ba1a1a] rounded-full hover:bg-red-50 active:scale-90 transition-all"
                          title="Delete Company"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD COMPANY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="bg-white border border-[#ececec] rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#ececec] flex items-center justify-between">
              <div>
                <h3 className="text-[18px] font-bold text-[#111111]">Register New Company</h3>
                <p className="text-[12px] text-[#8f8f95]">Create a new institution client profile</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#8f8f95] hover:text-[#ba1a1a] transition-colors p-1 rounded-full hover:bg-[#f5f5f6]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Company Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Acme Corporation"
                  className={`w-full h-10 px-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] ${formErrors.name ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]' : 'border-[#ececec]'}`}
                />
                {formErrors.name && <span className="text-[11px] text-[#ba1a1a] font-bold">{formErrors.name}</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Industry *</label>
                  <select
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px]"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Retail">Retail</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Company Size</label>
                  <select
                    value={form.size}
                    onChange={(e) => setForm({ ...form, size: e.target.value })}
                    className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px]"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="10-50">10-50 employees</option>
                    <option value="50-100">50-100 employees</option>
                    <option value="100-500">100-500 employees</option>
                    <option value="500-1000">500-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Website URL *</label>
                <input
                  type="text"
                  required
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="e.g. acme.com"
                  className={`w-full h-10 px-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] ${formErrors.website ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]' : 'border-[#ececec]'}`}
                />
                {formErrors.website && <span className="text-[11px] text-[#ba1a1a] font-bold">{formErrors.website}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Account Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px]"
                >
                  <option value="Active Client">Active Client</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Former Client">Former Client</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#ececec]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-[#8f8f95] hover:bg-[#f5f5f6] font-bold text-[13px] rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1769ff] hover:bg-[#0054e6] text-white font-bold text-[13px] rounded-xl transition-all shadow-md shadow-[#1769ff]/10"
                >
                  Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT COMPANY MODAL */}
      {selectedCompany && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedCompany(null)}></div>
          <div className="bg-white border border-[#ececec] rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#ececec] flex items-center justify-between">
              <div>
                <h3 className="text-[18px] font-bold text-[#111111]">Edit Company Profile</h3>
                <p className="text-[12px] text-[#8f8f95]">Modify details of corporate accounts</p>
              </div>
              <button onClick={() => setSelectedCompany(null)} className="text-[#8f8f95] hover:text-[#ba1a1a] transition-colors p-1 rounded-full hover:bg-[#f5f5f6]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Company Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Acme Corporation"
                  className={`w-full h-10 px-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] ${formErrors.name ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]' : 'border-[#ececec]'}`}
                />
                {formErrors.name && <span className="text-[11px] text-[#ba1a1a] font-bold">{formErrors.name}</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Industry *</label>
                  <select
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px]"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Retail">Retail</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Company Size</label>
                  <select
                    value={form.size}
                    onChange={(e) => setForm({ ...form, size: e.target.value })}
                    className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px]"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="10-50">10-50 employees</option>
                    <option value="50-100">50-100 employees</option>
                    <option value="100-500">100-500 employees</option>
                    <option value="500-1000">500-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Website URL *</label>
                <input
                  type="text"
                  required
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="e.g. acme.com"
                  className={`w-full h-10 px-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] ${formErrors.website ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]' : 'border-[#ececec]'}`}
                />
                {formErrors.website && <span className="text-[11px] text-[#ba1a1a] font-bold">{formErrors.website}</span>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Account Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px]"
                >
                  <option value="Active Client">Active Client</option>
                  <option value="Prospect">Prospect</option>
                  <option value="Former Client">Former Client</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#ececec]">
                <button
                  type="button"
                  onClick={() => setSelectedCompany(null)}
                  className="px-4 py-2 text-[#8f8f95] hover:bg-[#f5f5f6] font-bold text-[13px] rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1769ff] hover:bg-[#0054e6] text-white font-bold text-[13px] rounded-xl transition-all shadow-md shadow-[#1769ff]/10"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Companies;
