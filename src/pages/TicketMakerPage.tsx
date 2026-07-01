import React, { useState } from 'react';
import { useJsonStore } from '../store/useJsonStore';
import { ArrowLeft, Check, Ticket, FileJson, Copy, Send } from 'lucide-react';

export const TicketMakerPage: React.FC = () => {
  const { setActivePage, setRawInput, formatJson } = useJsonStore();
  const [copied, setCopied] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    project: 'PSC: John - Bringit Application',
    tracker: 'Feature',
    subject: '',
    description: '',
    status: 'New',
    priority: 'Normal',
    assignee: '',
    category: '',
    parentTask: '',
    startDate: '',
    dueDate: '',
    estimatedTime: '',
    percentDone: '0 %',
    isPrivate: false,
    watchers: [] as string[]
  });

  const watchersList = [
    'Abhisek Seal', 'Braja Kishor Jana', 'Sougata Shil',
    'Anibrata Kule', 'John Hauser', 'Sourav Paria',
    'Aniket Das INT', 'Payel Sikdar', 'Suman Majumder',
    'Atanu Banerjee', 'Sajal Mahata'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'isPrivate') {
        setFormData(prev => ({ ...prev, isPrivate: checked }));
      } else {
        // Watchers
        setFormData(prev => {
          if (checked) return { ...prev, watchers: [...prev.watchers, name] };
          return { ...prev, watchers: prev.watchers.filter(w => w !== name) };
        });
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const generateTicketJson = () => {
    const ticketObj = {
      issue: {
        project: formData.project,
        tracker: formData.tracker,
        subject: formData.subject,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        assignee: formData.assignee || null,
        category: formData.category || null,
        parent_task: formData.parentTask || null,
        start_date: formData.startDate || null,
        due_date: formData.dueDate || null,
        estimated_hours: formData.estimatedTime ? parseFloat(formData.estimatedTime) : null,
        done_ratio: parseInt(formData.percentDone.replace(' %', '')),
        is_private: formData.isPrivate,
        watchers: formData.watchers
      },
      metadata: {
        generated_at: new Date().toISOString(),
        generator: 'JSON Viewer Ticket Maker'
      }
    };

    return JSON.stringify(ticketObj, null, 2);
  };

  const handleGenerate = () => {
    const json = generateTicketJson();
    setRawInput(json);
    formatJson();
    setActivePage('editor');
  };

  const handleCopy = () => {
    const json = generateTicketJson();
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Smart Parse Simulation for the sentence parsing feature
  const handleSmartParse = () => {
    if (!formData.description) return;
    
    // Very basic heuristic for demo:
    const lowerDesc = formData.description.toLowerCase();
    
    const updates: Partial<typeof formData> = {};
    if (lowerDesc.includes('bug') || lowerDesc.includes('fix') || lowerDesc.includes('error')) updates.tracker = 'Bug';
    if (lowerDesc.includes('urgent') || lowerDesc.includes('asap')) updates.priority = 'Urgent';
    else if (lowerDesc.includes('high')) updates.priority = 'High';
    
    if (lowerDesc.includes('ui') || lowerDesc.includes('design') || lowerDesc.includes('frontend')) updates.category = 'UI';
    else if (lowerDesc.includes('backend') || lowerDesc.includes('api') || lowerDesc.includes('database')) updates.category = 'Backend';
    
    if (lowerDesc.includes('today')) updates.dueDate = new Date().toISOString().split('T')[0];
    
    watchersList.forEach(name => {
      if (lowerDesc.includes(name.toLowerCase().split(' ')[0])) {
        updates.assignee = name;
      }
    });
    
    // auto-fill subject if empty
    if (!formData.subject) {
      updates.subject = formData.description.split('.')[0].slice(0, 50);
    }
    
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActivePage('editor')}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Ticket className="w-6 h-6 text-indigo-500" />
              Ticket Maker
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Fill out the form below to generate a new issue JSON payload
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied JSON' : 'Copy JSON'}
          </button>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-lg shadow-indigo-500/20"
          >
            <FileJson className="w-4 h-4" />
            Open in Editor
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full p-6 space-y-6 pb-20">
        
        <div className="glass-panel p-6 rounded-xl space-y-6 shadow-xl bg-white/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold border-b border-slate-200 dark:border-slate-800 pb-3">New issue</h2>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-y-6 gap-x-8">
            
            {/* Project */}
            <div className="col-span-12 md:col-span-6 flex items-center gap-3">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 w-24 text-right">Project <span className="text-red-500">*</span></label>
              <select 
                name="project" 
                value={formData.project} 
                onChange={handleInputChange}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="PSC: John - Bringit Application">PSC: John - Bringit Application</option>
                <option value="Other Project">Other Project</option>
              </select>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer ml-4">
                <input 
                  type="checkbox" 
                  name="isPrivate" 
                  checked={formData.isPrivate} 
                  onChange={handleInputChange}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500" 
                />
                Private
              </label>
            </div>
            <div className="col-span-12 md:col-span-6"></div>

            {/* Tracker */}
            <div className="col-span-12 md:col-span-6 flex items-center gap-3">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 w-24 text-right">Tracker <span className="text-red-500">*</span></label>
              <select 
                name="tracker" 
                value={formData.tracker} 
                onChange={handleInputChange}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="Feature">Feature</option>
                <option value="Bug">Bug</option>
                <option value="Task">Task</option>
              </select>
            </div>
            <div className="col-span-12 md:col-span-6"></div>

            {/* Subject */}
            <div className="col-span-12 flex items-center gap-3">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 w-24 text-right flex-shrink-0">Subject <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="subject" 
                value={formData.subject} 
                onChange={handleInputChange}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            {/* Description */}
            <div className="col-span-12 flex items-start gap-3">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 w-24 text-right flex-shrink-0 pt-2">Description</label>
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex-1 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="border-b border-slate-300 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 flex gap-2 overflow-x-auto">
                    <span className="text-xs font-semibold px-2 border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400">Edit</span>
                    <span className="text-xs px-2 text-slate-500 cursor-pointer">Preview</span>
                  </div>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange}
                    rows={8}
                    className="w-full bg-transparent border-none p-3 text-sm focus:ring-0 outline-none resize-y"
                    placeholder="Enter ticket description..."
                  ></textarea>
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={handleSmartParse}
                    className="text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-md hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                    title="Generate fields automatically from the sentence or description"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Auto-Fill from Description
                  </button>
                </div>
              </div>
            </div>

            {/* Left Column (Status, Priority, Assignee, Category) */}
            <div className="col-span-12 md:col-span-6 space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 w-24 text-right">Status <span className="text-red-500">*</span></label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleInputChange}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm outline-none"
                >
                  <option value="New">New</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 w-24 text-right">Priority <span className="text-red-500">*</span></label>
                <select 
                  name="priority" 
                  value={formData.priority} 
                  onChange={handleInputChange}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm outline-none"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 w-24 text-right">Assignee</label>
                <select 
                  name="assignee" 
                  value={formData.assignee} 
                  onChange={handleInputChange}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm outline-none"
                >
                  <option value=""></option>
                  {watchersList.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 w-24 text-right">Category</label>
                <select 
                  name="category" 
                  value={formData.category} 
                  onChange={handleInputChange}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm outline-none"
                >
                  <option value=""></option>
                  <option value="UI">UI</option>
                  <option value="Backend">Backend</option>
                </select>
              </div>
            </div>

            {/* Right Column (Parent task, Start date, Due date, Estimated time, % Done) */}
            <div className="col-span-12 md:col-span-6 space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 w-32 text-right flex-shrink-0">Parent task</label>
                <input 
                  type="text" 
                  name="parentTask" 
                  value={formData.parentTask} 
                  onChange={handleInputChange}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm outline-none max-w-[200px]"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 w-32 text-right flex-shrink-0">Start date</label>
                <input 
                  type="date" 
                  name="startDate" 
                  value={formData.startDate} 
                  onChange={handleInputChange}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm outline-none max-w-[200px]"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 w-32 text-right flex-shrink-0">Due date</label>
                <input 
                  type="date" 
                  name="dueDate" 
                  value={formData.dueDate} 
                  onChange={handleInputChange}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm outline-none max-w-[200px]"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 w-32 text-right flex-shrink-0">Estimated time</label>
                <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                  <input 
                    type="number" 
                    name="estimatedTime" 
                    value={formData.estimatedTime} 
                    onChange={handleInputChange}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm outline-none"
                  />
                  <span className="text-sm text-slate-500">Hours</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 w-32 text-right flex-shrink-0">% Done</label>
                <select 
                  name="percentDone" 
                  value={formData.percentDone} 
                  onChange={handleInputChange}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm outline-none max-w-[200px]"
                >
                  {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(val => (
                    <option key={val} value={`${val} %`}>{val} %</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Watchers */}
            <div className="col-span-12 flex items-start gap-3 mt-4 border-t border-slate-200 dark:border-slate-800 pt-4">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 w-24 text-right pt-1 flex-shrink-0">Watchers</label>
              <div className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {watchersList.map(watcher => (
                    <label key={watcher} className="flex items-center gap-2 text-sm cursor-pointer group">
                      <input 
                        type="checkbox" 
                        name={watcher} 
                        checked={formData.watchers.includes(watcher)} 
                        onChange={handleInputChange}
                        className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500" 
                      />
                      <span className="text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{watcher}</span>
                    </label>
                  ))}
                </div>
                <button className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-3 flex items-center gap-1 hover:underline">
                  <span className="text-lg leading-none">+</span> Search for watchers to add
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketMakerPage;
