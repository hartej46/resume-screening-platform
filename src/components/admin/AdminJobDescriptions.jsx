import React, { useState, useRef } from 'react';
import { 
  Plus,
  MapPin, 
  Briefcase, 
  Trash2,
  UploadCloud,
  Loader2,
  StickyNote,
  Gift,
  Zap,
  Globe,
  Brain,
  X,
  Sparkles,
  CheckCircle,
  FileText,
  Users,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  ArrowRight,
  Target,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveKeywordStream from '../shared/LiveKeywordStream';
import TalentProfileModal from '../shared/TalentProfileModal';
import { API_BASE_URL } from '../../apiConfig';
import JobProfileModal from '../shared/JobProfileModal';
import './Admin.css';

const formatTimeAgo = (dateString) => {
    if (!dateString) return 'recently';
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'm ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'min ago';
    return 'just now';
};

const AdminJobDescriptions = ({ jobs: initialJobs = [], onRefresh }) => {
  const [jobs, setJobs] = useState(initialJobs);
  const [selectedJobForModal, setSelectedJobForModal] = useState(null);
  const [selectedCandidateForProfile, setSelectedCandidateForProfile] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showSuccessPulse, setShowSuccessPulse] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newJob, setNewJob] = useState({ title: '', department: '', location: '', type: 'Full-Time', salary: '', description: '', skills: '', benefits: '', interviewProcess: '', culture: '', responsibilities: '', requirements: '', bonusPoints: '' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const fileInputRef = useRef(null);

  React.useEffect(() => { setJobs(initialJobs); }, [initialJobs]);

  const filteredJobs = jobs.filter(j => j.title?.toLowerCase().includes(searchQuery.toLowerCase()) || j.department?.toLowerCase().includes(searchQuery.toLowerCase()));

  const handlePdfUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') { alert("Please upload a PDF."); return; }
    setIsAnalyzing(true); setKeywords([]);
    const formData = new FormData();
    formData.append('jdPdf', file);
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) { alert(`Extraction failed: ${data.error}`); setIsAnalyzing(false); return; }
      setShowSuccessPulse(true);
      setTimeout(() => {
          setShowSuccessPulse(false); setIsAnalyzing(false); setKeywords(data.skills || []);
          const salaryMatch = (data.benefits || '').match(/(?:₹|\$|USD|INR|LPA|lpa)?\s*[\d,]+\s*(?:k|K|L|lakh|lakhs)?(?:\s*[-–]\s*(?:₹|\$)?\s*[\d,]+\s*(?:k|K|L|lakh|lakhs)?)?\s*(?:per year|per month|per annum|PA|CTC|p\.a\.)?/i);
          setNewJob({ title: data.title || '', department: data.department || '', location: data.location || '', type: data.type || 'Full-Time', salary: salaryMatch ? salaryMatch[0].trim() : '', description: data.description || '', skills: Array.isArray(data.skills) ? data.skills.join('\n') : '', benefits: data.benefits || '', interviewProcess: data.interviewProcess || '', culture: data.culture || '', responsibilities: data.responsibilities || '', requirements: data.requirements || '', bonusPoints: data.bonusPoints || '' });
          setShowCreateForm(true);
      }, 1200);
    } catch (err) { alert(`Network error: ${err.message}`); setIsAnalyzing(false); }
  };

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(e.type === "dragenter" || e.type === "dragover"); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); if (e.dataTransfer.files?.[0]) handlePdfUpload(e.dataTransfer.files[0]); };

  const handleCreate = async (e) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const payload = { ...newJob, skills: newJob.skills.split('\n').filter(s => s.trim() !== ''), salary: newJob.salary || 'Competitive' };
      const res = await fetch(`${API_BASE_URL}/api/jobs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { setShowCreateForm(false); if (onRefresh) onRefresh(); }
    } catch (err) { alert(`Error: ${err.message}`); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this job posting? This will also remove associated applications.")) return;
    try {
        const res = await fetch(`${API_BASE_URL}/api/jobs/${id}`, { method: 'DELETE' });
        if (res.ok) if (onRefresh) onRefresh();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="fadeIn admin-page-container">
      <div className="admin-header-layout">
        <div className="admin-header-info">
          <div className="pill-badge-primary self-start mb-4">
            <Sparkles size={14} /> AI EXTRACTION ENGINE v4.0
          </div>
          <h2 className="text-white text-3xl font-black mb-4">Hiring Index</h2>
          <p className="admin-desc-muted max-w-md">
            Index your hiring strategy with multi-dimensional neural extraction. 
            Upload job descriptions to auto-generate requirements and skills.
          </p>
          
          <div className="admin-header-actions mt-8">
             <button onClick={() => setShowCreateForm(true)} className="btn-action-pro btn-primary">
                <Plus size={18} /> New Manual Posting
             </button>
             <div className="sync-status-pill">
                <div className="pulse-dot"></div>
                <span>Cloud Sync Active</span>
             </div>
          </div>
        </div>

        <motion.div 
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            className={`admin-upload-zone ${isDragActive ? 'drag-active' : ''}`}
            whileHover={{ scale: 1.01 }}
        >
          <input type="file" ref={fileInputRef} onChange={(e) => handlePdfUpload(e.target.files[0])} className="hidden" accept="application/pdf" />
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="upload-state-container">
                <div className="loader-ring"></div>
                <div className="text-center mt-6">
                    <p className="neural-scan-text">Neural Scan In Progress</p>
                    <p className="admin-desc-muted text-xs">Gemini 1.5 mapping knowledge nodes...</p>
                </div>
                <LiveKeywordStream isAnalyzing={true} customKeywords={keywords} />
              </motion.div>
            ) : showSuccessPulse ? (
              <motion.div key="success" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="upload-state-container">
                 <div className="success-icon-box">
                    <CheckCircle size={32} color="var(--success)" />
                 </div>
                 <h4 className="text-success font-black text-lg">STRUCTURE EXTRACTED</h4>
              </motion.div>
            ) : (
              <motion.div key="idle" className="upload-state-container">
                <div className="upload-icon-circle">
                  <UploadCloud size={40} />
                </div>
                <h4 className="upload-title">{isDragActive ? "Inhale Strategy" : "Neural Extraction"}</h4>
                <p className="upload-subtitle">Drop PDF to auto-fill job details</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>


      <div className="flex justify-between items-center bg-white-02 p-4 rounded-2xl border border-white-05">
         <div className="admin-search-wrapper max-w-md">
            <Search className="search-icon-abs" size={18} />
            <input type="text" placeholder="Search index by title or team..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="admin-search-field" />
         </div>
         <div className="flex gap-1 items-center">
            <button className="btn-action-pro btn-ghost px-6 py-2.5 rounded-xl"><Filter size={16} /> Filters</button>
            <div className="v-line" style={{ height: '20px', margin: '0 10px' }}></div>
            <div className="text-muted-700 font-bold text-sm px-4">Displaying {filteredJobs.length} Positions</div>
         </div>
      </div>

      <div className="jobs-layout-grid">
        {filteredJobs.length > 0 ? filteredJobs.map(job => (
          <motion.div
            key={job.id} layout className="glass-card" onClick={() => setSelectedJobForModal(job)}
            style={{ 
                border: '1px solid var(--card-border)', 
                background: 'hsla(0,0%,100%,0.01)',
                padding: '2.5rem',
                cursor: 'pointer'
            }}
            whileHover={{ borderColor: 'var(--primary-glow)', backgroundColor: 'hsla(217, 91%, 60%, 0.03)' }}
          >
            <div className="flex justify-between items-start mb-6">
                <div className="flex gap-1">
                    <div className="kpi-icon-box text-primary w-12 h-12 rounded-xl flex items-center justify-center bg-primary-dim border border-primary-20"><Briefcase size={22} /></div>
                    <div>
                        <h3 className="text-white text-xl font-extrabold mb-1">{job.title}</h3>
                        <div className="flex gap-4 text-dim-600 font-bold text-xs uppercase tracking-tight">
                            <span className="flex items-center gap-1"><Users size={12} /> {job.department}</span>
                            <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                        </div>
                    </div>
                </div>
                <button onClick={(e) => handleDelete(e, job.id)} className="card-icon-button danger-ghost w-10 h-10 flex items-center justify-center"><Trash2 size={18} /></button>
            </div>

            <div className="flex gap-2 flex-wrap mb-5">
                <span className="badge-success-compact">{job.salary || 'Competitive'}</span>
                <span className="badge-primary-compact">{job.type || 'Full-Time'}</span>
                <span className="text-muted-700 text-xs font-bold ml-auto self-center">{formatTimeAgo(job.createdAt)}</span>
            </div>

            <p className={`card-summary-clamped text-base leading-relaxed mb-6`}>{job.description}</p>

            <div className="flex justify-between items-center pt-5 border-t border-white-05">
                <div className="flex items-center gap-2 text-white font-extrabold text-sm"><Users size={14} className="text-primary" /> {job.applications?.length || 0} Pipelines</div>
                <div onClick={(e) => { e.stopPropagation(); setSelectedJobForModal(job); }} className="text-primary font-black text-sm flex items-center gap-1 uppercase tracking-wider cursor-pointer hover:text-primary-glow transition-colors">
                    Inspect Details <ArrowRight size={16} />
                </div>
            </div>
          </motion.div>
        )) : (
            <div className="infra-msg-shell w-full" style={{ gridColumn: '1 / -1' }}>
                <Briefcase size={40} className="mb-4 opacity-50 mx-auto" color="var(--primary)" />
                <h3 className="text-white text-xl font-bold">No Positions Indexed</h3>
                <p className="admin-desc-muted mt-2">Upload a JD PDF or create a manual posting to begin extraction.</p>
            </div>
        )}
      </div>

      <AnimatePresence>
        {showCreateForm && (
          <div className="modal-overlay">
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card pro-modal-frame">
              <button onClick={() => setShowCreateForm(false)} className="modal-close-btn"><X size={18} /></button>
              <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary p-2 rounded-lg shadow-glow-primary"><Brain size={20} color="white" /></div>
                  <div><h3 className="text-white text-xl font-black">Neural Extraction Result</h3><p className="admin-desc-muted text-xs mt-0.5">Verify and finalize the AI-populated strategy.</p></div>
              </div>
              <form onSubmit={handleCreate}>
                 <div className="form-grid-3">
                    <div className="flex-col gap-05"><label className="label-pro">Title</label><input type="text" value={newJob.title} onChange={(e) => setNewJob({...newJob, title: e.target.value})} className="pro-input" required /></div>
                    <div className="flex-col gap-05"><label className="label-pro">Department</label><input type="text" value={newJob.department} onChange={(e) => setNewJob({...newJob, department: e.target.value})} className="pro-input" required /></div>
                    <div className="flex-col gap-05"><label className="label-pro">Location</label><input type="text" value={newJob.location} onChange={(e) => setNewJob({...newJob, location: e.target.value})} className="pro-input" required /></div>
                 </div>
                 <div className="form-grid-2">
                    <div className="flex-col gap-05"><label className="label-pro">Salary Range</label><input type="text" value={newJob.salary} onChange={(e) => setNewJob({...newJob, salary: e.target.value})} className="pro-input" /></div>
                    <div className="flex-col gap-05"><label className="label-pro">Job Type</label><select value={newJob.type} onChange={(e) => setNewJob({...newJob, type: e.target.value})} className="pro-input cursor-pointer"><option value="Full-Time">Full-Time</option><option value="Part-Time">Part-Time</option><option value="Internship">Internship</option><option value="Contract">Contract</option></select></div>
                 </div>
                 <div className="flex-col gap-05 mb-4"><label className="label-pro">Skill Requirements (One per line)</label><textarea value={newJob.skills} onChange={(e) => setNewJob({...newJob, skills: e.target.value})} className="pro-input h-20" /></div>
                 <div className="flex-col gap-05 mb-6"><label className="label-pro">Description & Summary</label><textarea value={newJob.description} onChange={(e) => setNewJob({...newJob, description: e.target.value})} className="pro-input h-28" required /></div>
                 <div className="flex justify-end gap-3 mt-4">
                    <button type="button" onClick={() => setShowCreateForm(false)} className="btn-action-pro btn-ghost px-6 py-2 rounded-lg border-none">Cancel</button>
                    <button type="submit" className="btn-action-pro btn-primary h-11 px-6 rounded-lg" disabled={isSubmitting}>{isSubmitting ? 'Syncing...' : 'Commit Strategy'}</button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <JobProfileModal 
        isOpen={!!selectedJobForModal} 
        onClose={() => setSelectedJobForModal(null)} 
        job={selectedJobForModal} 
        onSelectCandidate={setSelectedCandidateForProfile} 
      />
      <TalentProfileModal isOpen={!!selectedCandidateForProfile} onClose={() => setSelectedCandidateForProfile(null)} candidate={selectedCandidateForProfile} />
    </div>
  );
};

export default AdminJobDescriptions;