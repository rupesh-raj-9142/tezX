import React, { useState, useEffect } from 'react';

function Projects({ projects = [], setProjects, companies = [], people = [], leadContext, clearLeadContext, onUpdateLead }) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modal States
  const [selectedProject, setSelectedProject] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Form States
  const [form, setForm] = useState({
    name: '',
    company: '',
    budget: '',
    deadline: '',
    owner: '',
    status: 'Planning',
    description: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Lead Conversion Hook
  useEffect(() => {
    if (leadContext) {
      setForm({
        name: leadContext.project || '',
        company: leadContext.company || '',
        budget: leadContext.amount ? leadContext.amount.replace('$', '').replace(/,/g, '') : '10000',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days default
        owner: people[0]?.name || leadContext.contactName || '',
        status: 'Planning',
        description: leadContext.message || `Scope converted from pipeline lead ref #${leadContext.id.slice(-6).toUpperCase()}.`,
      });
      setFormErrors({});
      setIsAddModalOpen(true);
    }
  }, [leadContext, people]);

  // Map status to progress percentage
  const getProgressPercentage = (status) => {
    switch (status) {
      case 'Planning': return 15;
      case 'In Progress': return 60;
      case 'On Hold': return 35;
      case 'Completed': return 100;
      default: return 0;
    }
  };

  // Filter & Search Logic
  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setForm({
      name: '',
      company: companies[0]?.name || '',
      budget: '',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days out default
      owner: people[0]?.name || '',
      status: 'Planning',
      description: '',
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (project) => {
    setSelectedProject(project);
    setForm({
      name: project.name,
      company: project.company || '',
      budget: project.budget ? project.budget.replace('$', '').replace(/,/g, '') : '',
      deadline: project.deadline || '',
      owner: project.owner || '',
      status: project.status || 'Planning',
      description: project.description || '',
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Project Title is required';
    if (!form.company.trim()) errors.company = 'Associated Company is required';
    if (!form.owner.trim()) errors.owner = 'Project Owner is required';
    if (!form.budget.trim() || isNaN(form.budget)) errors.budget = 'Valid numeric budget is required';
    if (!form.deadline.trim()) errors.deadline = 'Deadline is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '$0';
    return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newProject = {
      id: `project-${Date.now()}`,
      name: form.name.trim(),
      company: form.company,
      budget: formatCurrency(form.budget),
      deadline: form.deadline,
      owner: form.owner,
      status: form.status,
      description: form.description.trim(),
    };

    setProjects(prev => [newProject, ...prev]);
    setIsAddModalOpen(false);

    // Automation: if converted from lead context, mark lead as Closed Won and clear active context
    if (leadContext) {
      if (onUpdateLead) {
        onUpdateLead({
          ...leadContext,
          stage: 'success',
          amount: formatCurrency(form.budget)
        });
      }
      clearLeadContext();
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const updatedProjects = projects.map(p => {
      if (p.id === selectedProject.id) {
        return {
          ...p,
          name: form.name.trim(),
          company: form.company,
          budget: formatCurrency(form.budget),
          deadline: form.deadline,
          owner: form.owner,
          status: form.status,
          description: form.description.trim(),
        };
      }
      return p;
    });

    setProjects(updatedProjects);
    setSelectedProject(null);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete the project "${name}"?`)) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-[#e2f9ee] text-[#107c41]';
      case 'In Progress':
        return 'bg-[#1769ff]/10 text-[#1769ff]';
      case 'On Hold':
        return 'bg-[#ffb11a]/15 text-[#b27200]';
      case 'Planning':
        return 'bg-[#f3f3f5] text-[#8f8f95]';
      default:
        return 'bg-[#f3f3f5] text-[#111111]';
    }
  };

  const getProgressColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-[#107c41]';
      case 'In Progress': return 'bg-[#1769ff]';
      case 'On Hold': return 'bg-[#ffb11a]';
      default: return 'bg-[#8f8f95]';
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      {/* Header section */}
      <header className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-[32px] text-[#111111] font-bold tracking-tight mb-1">Projects & Deliverables</h2>
          <p className="font-body-md text-[14px] text-[#8f8f95]">
            Track budgets, owner representatives, schedules, and progression lists of active CRM projects ({projects.length} total).
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
            <span className="material-symbols-outlined text-[18px]">add_box</span>
            Add Project
          </button>
        </div>
      </header>

      {/* Filters bar */}
      <div className="bg-white border border-[#ececec]/60 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[20px] text-[#8f8f95]">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by project, client company..."
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
            {['All', 'Planning', 'In Progress', 'On Hold', 'Completed'].map((status) => (
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
      {filteredProjects.length === 0 ? (
        <div className="border border-dashed border-[#ececec] rounded-3xl py-16 px-8 text-center text-[#8f8f95] bg-[#f7f7f8]/50 animate-in fade-in duration-200">
          <span className="text-4xl mb-3 block">💼</span>
          <h4 className="text-[16px] font-extrabold text-[#111111] mb-1">No projects found</h4>
          <p className="text-[13px] max-w-[320px] mx-auto">Try adjusting your search criteria or click "Add Project" to launch a new deliverable tracker.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
          {filteredProjects.map((project) => {
            const pct = getProgressPercentage(project.status);
            return (
              <div 
                key={project.id}
                className="bg-white border border-[#ececec]/60 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-[#1769ff]/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-2.5 py-1 rounded-lg text-[12px] font-bold bg-[#f3f3f5] text-[#111111] border border-[#ececec]">
                      🏢 {project.company}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${getStatusBadge(project.status)}`}>
                      {project.status}
                    </span>
                  </div>

                  <h4 className="text-[18px] font-extrabold text-[#111111] group-hover:text-[#1769ff] transition-colors mb-2 truncate">{project.name}</h4>
                  {project.description && (
                    <p className="text-[13px] text-[#8f8f95] line-clamp-2 mb-4 leading-relaxed">{project.description}</p>
                  )}

                  {/* Dynamic Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-[12px] font-bold text-[#111111] mb-1.5">
                      <span>Progression</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#f3f3f5] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(project.status)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-[#ececec]/50 pt-4 text-[13px]">
                    <div>
                      <span className="text-[11px] font-bold text-[#8f8f95] uppercase block mb-0.5">Budget</span>
                      <span className="font-extrabold text-[#111111] text-[15px]">{project.budget}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-[#8f8f95] uppercase block mb-0.5">Deadline</span>
                      <span className="font-bold text-[#444] text-[13px]">{project.deadline}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#ececec]/40">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-[#8f8f95] uppercase">Owner:</span>
                    <span className="text-[12px] font-extrabold text-[#111111]">{project.owner}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(project)}
                      className="p-1.5 text-[#8f8f95] hover:text-[#1769ff] rounded-lg hover:bg-black/5 transition-colors"
                      title="Edit Project"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(project.id, project.name)}
                      className="p-1.5 text-[#8f8f95] hover:text-[#ba1a1a] rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete Project"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Table View */
        <div className="bg-white border border-[#ececec]/60 rounded-3xl shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ececec] bg-[#f7f7f8]/40">
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8f8f95] uppercase">Project Title</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8f8f95] uppercase">Client Company</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8f8f95] uppercase">Budget</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8f8f95] uppercase">Deadline</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8f8f95] uppercase">Progression</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8f8f95] uppercase">Owner representative</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8f8f95] uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ececec]/50">
                {filteredProjects.map((project) => {
                  const pct = getProgressPercentage(project.status);
                  return (
                    <tr key={project.id} className="hover:bg-[#f7f7f8]/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-[#111111] group-hover:text-[#1769ff] transition-colors">{project.name}</div>
                          {project.description && (
                            <div className="text-[12px] text-[#8f8f95] line-clamp-1 max-w-[200px]">{project.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-lg text-[12px] font-bold bg-[#f3f3f5] text-[#111111] border border-[#ececec]">
                          {project.company}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[14px] font-extrabold text-[#111111]">
                        {project.budget}
                      </td>
                      <td className="px-6 py-4 text-[13px] font-medium text-[#444]">
                        {project.deadline}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-2 bg-[#f3f3f5] rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${getProgressColor(project.status)}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[12px] font-extrabold text-[#111111]">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[13px] font-extrabold text-[#111111]">{project.owner}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(project)}
                            className="p-1 text-[#8f8f95] hover:text-[#1769ff] rounded-full hover:bg-black/5 active:scale-90 transition-all"
                            title="Edit Project"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(project.id, project.name)}
                            className="p-1 text-[#8f8f95] hover:text-[#ba1a1a] rounded-full hover:bg-red-50 active:scale-90 transition-all"
                            title="Delete Project"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD PROJECT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="bg-white border border-[#ececec] rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#ececec] flex items-center justify-between">
              <div>
                <h3 className="text-[18px] font-bold text-[#111111]">Register New Project</h3>
                <p className="text-[12px] text-[#8f8f95]">Track budget progression and milestone updates</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#8f8f95] hover:text-[#ba1a1a] transition-colors p-1 rounded-full hover:bg-[#f5f5f6]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Project / Deal Title *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Legacy Infrastructure Migration"
                  className={`w-full h-10 px-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] ${formErrors.name ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]' : 'border-[#ececec]'}`}
                />
                {formErrors.name && <span className="text-[11px] text-[#ba1a1a] font-bold">{formErrors.name}</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Client Company *</label>
                  {companies.length > 0 ? (
                    <select
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px]"
                    >
                      {companies.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                      <option value="Custom / Other">Custom / Other</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="e.g. Acme Corp"
                      className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px]"
                    />
                  )}
                  {form.company === 'Custom / Other' && (
                    <input
                      type="text"
                      placeholder="Type company..."
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] mt-2"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Project Owner *</label>
                  {people.length > 0 ? (
                    <select
                      value={form.owner}
                      onChange={(e) => setForm({ ...form, owner: e.target.value })}
                      className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px]"
                    >
                      {people.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                      <option value="Custom / Other">Custom / Other</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={form.owner}
                      onChange={(e) => setForm({ ...form, owner: e.target.value })}
                      placeholder="e.g. Alex Rivers"
                      className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px]"
                    />
                  )}
                  {form.owner === 'Custom / Other' && (
                    <input
                      type="text"
                      placeholder="Type owner name..."
                      onChange={(e) => setForm({ ...form, owner: e.target.value })}
                      className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Budget (USD) *</label>
                  <input
                    type="text"
                    required
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    placeholder="e.g. 15000"
                    className={`w-full h-10 px-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] ${formErrors.budget ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]' : 'border-[#ececec]'}`}
                  />
                  {formErrors.budget && <span className="text-[11px] text-[#ba1a1a] font-bold">{formErrors.budget}</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Deadline *</label>
                  <input
                    type="date"
                    required
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className={`w-full h-10 px-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] ${formErrors.deadline ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]' : 'border-[#ececec]'}`}
                  />
                  {formErrors.deadline && <span className="text-[11px] text-[#ba1a1a] font-bold">{formErrors.deadline}</span>}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Project Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px]"
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Summarize objectives, targets, and milestones..."
                  rows="2"
                  className="w-full p-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] resize-none"
                />
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
                  Launch Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROJECT MODAL */}
      {selectedProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedProject(null)}></div>
          <div className="bg-white border border-[#ececec] rounded-2xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#ececec] flex items-center justify-between">
              <div>
                <h3 className="text-[18px] font-bold text-[#111111]">Edit Project Scope</h3>
                <p className="text-[12px] text-[#8f8f95]">Modify deadlines, budgets, and milestone scopes</p>
              </div>
              <button onClick={() => setSelectedProject(null)} className="text-[#8f8f95] hover:text-[#ba1a1a] transition-colors p-1 rounded-full hover:bg-[#f5f5f6]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Project / Deal Title *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Legacy Infrastructure Migration"
                  className={`w-full h-10 px-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] ${formErrors.name ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]' : 'border-[#ececec]'}`}
                />
                {formErrors.name && <span className="text-[11px] text-[#ba1a1a] font-bold">{formErrors.name}</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Client Company *</label>
                  {companies.length > 0 ? (
                    <select
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px]"
                    >
                      {companies.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                      <option value="Custom / Other">Custom / Other</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="e.g. Acme Corp"
                      className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px]"
                    />
                  )}
                  {form.company === 'Custom / Other' && (
                    <input
                      type="text"
                      placeholder="Type company..."
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] mt-2"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Project Owner *</label>
                  {people.length > 0 ? (
                    <select
                      value={form.owner}
                      onChange={(e) => setForm({ ...form, owner: e.target.value })}
                      className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px]"
                    >
                      {people.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                      <option value="Custom / Other">Custom / Other</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={form.owner}
                      onChange={(e) => setForm({ ...form, owner: e.target.value })}
                      placeholder="e.g. Alex Rivers"
                      className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px]"
                    />
                  )}
                  {form.owner === 'Custom / Other' && (
                    <input
                      type="text"
                      placeholder="Type owner name..."
                      onChange={(e) => setForm({ ...form, owner: e.target.value })}
                      className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Budget (USD) *</label>
                  <input
                    type="text"
                    required
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    placeholder="e.g. 15000"
                    className={`w-full h-10 px-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] ${formErrors.budget ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]' : 'border-[#ececec]'}`}
                  />
                  {formErrors.budget && <span className="text-[11px] text-[#ba1a1a] font-bold">{formErrors.budget}</span>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Deadline *</label>
                  <input
                    type="date"
                    required
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className={`w-full h-10 px-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] ${formErrors.deadline ? 'border-[#ba1a1a] ring-1 ring-[#ba1a1a]' : 'border-[#ececec]'}`}
                  />
                  {formErrors.deadline && <span className="text-[11px] text-[#ba1a1a] font-bold">{formErrors.deadline}</span>}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Project Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full h-10 px-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px]"
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#8f8f95] uppercase">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Summarize objectives, targets, and milestones..."
                  rows="2"
                  className="w-full p-3 bg-white border border-[#ececec] rounded-xl outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-all font-body-sm text-[13px] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#ececec]">
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
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

export default Projects;
