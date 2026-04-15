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
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveKeywordStream from '../shared/LiveKeywordStream';
import NotesModal from '../shared/NotesModal';

const AdminJobDescriptions = ({ jobs: initialJobs = [], onRefresh }) => {
  const [jobs, setJobs] = useState(initialJobs);
  const [expandedId, setExpandedId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showSuccessPulse, setShowSuccessPulse] = useState(false);
  const [newJob, setNewJob] = useState({ 
    title: '', 
    department: '', 
    location: '', 
    type: 'Full-Time', 
    description: '', 
    skills: '',
    benefits: '',
    interviewProcess: '',
    culture: '',
    responsibilities: '',
    requirements: '',
    bonusPoints: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  const handlePdfUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') {
        alert("Please upload a PDF job description.");
        return;
    }

    setIsAnalyzing(true);
    setKeywords([]);
    const formData = new FormData();
    formData.append('jdPdf', file);

    try {
      const res = await fetch('http://localhost:5001/api/jobs/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (!res.ok) {
        console.error("[Upload] Server rejected:", data);
        alert(`Extraction failed: ${data.error || 'Unknown error'}`);
        setIsAnalyzing(false);
        return;
      }

      console.log("[Upload] Gemini extracted:", data);
      setShowSuccessPulse(true);
      
      setTimeout(() => {
          setShowSuccessPulse(false);
          setIsAnalyzing(false);
          setKeywords(data.skills || []);
          setNewJob({
              title: data.title || '',
              department: data.department || '',
              location: data.location || '',
              type: data.type || 'Full-Time',
              description: data.description || '',
              skills: Array.isArray(data.skills) ? data.skills.join('\n') : '',
              benefits: data.benefits || '',
              interviewProcess: data.interviewProcess || '',
              culture: data.culture || '',
              responsibilities: data.responsibilities || '',
              requirements: data.requirements || '',
              bonusPoints: data.bonusPoints || ''
          });
          setShowCreateForm(true);
      }, 1200);

    } catch (err) {
      console.error("JD Extraction failed:", err);
      alert(`Network error: ${err.message}`);
      setIsAnalyzing(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePdfUpload(e.dataTransfer.files[0]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...newJob,
        skills: newJob.skills.split('\n').filter(s => s.trim() !== ''),
        salary: "$120k - $180k",
      };
      const res = await fetch('http://localhost:5001/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setShowCreateForm(false);
        setNewJob({ title: '', department: '', location: '', type: 'Full-Time', description: '', skills: '', benefits: '', interviewProcess: '', culture: '' });
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error("Create failed:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this position definitely?")) return;
    try {
      const res = await fetch(`http://localhost:5001/api/jobs/${id}`, { method: 'DELETE' });
      if (res.ok) if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="fadeIn">
      {/* Header & Upload Zone */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '3rem', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '3rem', fontWeight: '900', letterSpacing: '-1.5px' }}>Job Descriptions</h2>
          <p style={{ color: 'var(--text-dim)', marginTop: '0.75rem', fontSize: '1.25rem' }}>
            Multi-dimensional neural extraction for high-velocity hiring.
          </p>
          <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1.5rem' }}>
             <button onClick={() => setShowCreateForm(true)} className="btn-action-pro btn-primary" style={{ padding: '1rem 3rem', fontSize: '1rem' }}>
                <Plus size={20} /> New Manual Posting
             </button>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Sparkles size={16} color="var(--primary)" /> Smart Upload Active
             </div>
          </div>
        </div>

        {/* DRAG AND DROP ZONE */}
        <motion.div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            whileHover={{ scale: 1.01 }}
            className="glass-card"
            style={{ 
                border: isDragActive ? '2px solid var(--primary)' : '2px dashed var(--card-border)', 
                background: isDragActive ? 'hsla(217, 91%, 60%, 0.05)' : 'var(--card-bg)',
                cursor: 'pointer',
                textAlign: 'center',
                padding: '3rem',
                minHeight: '220px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
            }}
        >
          <input type="file" ref={fileInputRef} onChange={(e) => handlePdfUpload(e.target.files[0])} style={{ display: 'none' }} accept="application/pdf" />
          
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <Loader2 size={56} color="var(--primary)" className="spin" />
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'white', fontWeight: '900', fontSize: '1.1rem', letterSpacing: '0.05em' }}>PARSING KNOWLEDGE NODES...</p>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '4px' }}>Gemini 1.5 is scanning for structural details.</p>
                </div>
                <LiveKeywordStream isAnalyzing={true} customKeywords={keywords} />
              </motion.div>
            ) : showSuccessPulse ? (
              <motion.div key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center' }}>
                 <div style={{ background: 'hsla(150, 80%, 45%, 0.1)', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <CheckCircle size={40} color="var(--success)" />
                 </div>
                 <h4 style={{ color: 'var(--success)', fontWeight: '900', fontSize: '1.25rem' }}>EXTRACTION SUCCESSFUL</h4>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ background: 'var(--primary-glow)', padding: '20px', borderRadius: '50%', display: 'inline-block', marginBottom: '1.5rem' }}>
                    <UploadCloud size={48} color="var(--primary)" />
                </div>
                <h4 style={{ color: 'white', fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>
                    {isDragActive ? "Drop JD to Start Neural Scan" : "Neural Job Extraction"}
                </h4>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>Drag & Drop PDF to auto-fill Job Descriptions.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Creation Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay">
            <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} className="glass-card" style={{ width: '960px', padding: '4rem', position: 'relative', border: '1px solid var(--primary-glow)' }}>
              <button onClick={() => setShowCreateForm(false)} style={{ position: 'absolute', top: '2.5rem', right: '2.5rem', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={28} /></button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '3.5rem' }}>
                  <div style={{ background: 'var(--primary)', padding: '12px', borderRadius: '16px' }}><Brain size={36} color="white" /></div>
                  <div>
                    <h3 style={{ color: 'white', fontSize: '2.25rem', fontWeight: '900', letterSpacing: '-1px' }}>Verify Neural Intelligence</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>Correct any fields populated by the LLM extraction loop.</p>
                  </div>
              </div>

              <form onSubmit={handleCreate}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="input-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label className="label-pro">Job Title</label>
                            <span className="pill-capsule" style={{ fontSize: '0.6rem', padding: '2px 8px', background: 'hsla(217, 91%, 60%, 0.1)', color: 'var(--primary)' }}>AI SUGGESTED</span>
                        </div>
                        <input type="text" value={newJob.title} onChange={(e) => setNewJob({...newJob, title: e.target.value})} style={inputStyle} required />
                    </div>
                    <div className="input-group">
                        <label className="label-pro">Department</label>
                        <input type="text" value={newJob.department} onChange={(e) => setNewJob({...newJob, department: e.target.value})} style={inputStyle} required />
                    </div>
                    <div className="input-group">
                        <label className="label-pro">Location</label>
                        <input type="text" value={newJob.location} onChange={(e) => setNewJob({...newJob, location: e.target.value})} style={inputStyle} required />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="input-group">
                        <label className="label-pro">Extracted Requirements (One per line)</label>
                        <textarea value={newJob.skills} onChange={(e) => setNewJob({...newJob, skills: e.target.value})} style={{...inputStyle, height: '180px', resize: 'none'}} />
                    </div>
                    <div className="input-group">
                        <label className="label-pro">Neural Summary</label>
                        <textarea value={newJob.description} onChange={(e) => setNewJob({...newJob, description: e.target.value})} style={{...inputStyle, height: '180px'}} required />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3.5rem' }}>
                    <div className="input-group">
                        <label className="label-pro" style={{ color: 'var(--primary)' }}><Gift size={15} style={{ marginRight: '6px' }} /> Perks & Benefits</label>
                        <textarea value={newJob.benefits} onChange={(e) => setNewJob({...newJob, benefits: e.target.value})} style={{...inputStyle, height: '120px', border: '1px solid hsla(217, 91%, 60%, 0.2)'}} />
                    </div>
                    <div className="input-group">
                        <label className="label-pro" style={{ color: 'var(--warning)' }}><Zap size={15} style={{ marginRight: '6px' }} /> Hiring Loop</label>
                        <textarea value={newJob.interviewProcess} onChange={(e) => setNewJob({...newJob, interviewProcess: e.target.value})} style={{...inputStyle, height: '120px', border: '1px solid hsla(45, 100%, 50%, 0.2)'}} />
                    </div>
                    <div className="input-group">
                        <label className="label-pro" style={{ color: '#a78bfa' }}><Globe size={15} style={{ marginRight: '6px' }} /> Team Culture</label>
                        <textarea value={newJob.culture} onChange={(e) => setNewJob({...newJob, culture: e.target.value})} style={{...inputStyle, height: '120px', border: '1px solid hsla(255, 90%, 75%, 0.2)'}} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setShowCreateForm(false)} className="btn-action-pro" style={{ padding: '1.15rem 3.5rem' }}>Cancel</button>
                    <button type="submit" className="btn-action-pro btn-primary" style={{ padding: '1.15rem 5rem', fontSize: '1.1rem' }}>Commit Strategy</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of Jobs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: '2.5rem' }}>
        {jobs.map(job => (
          <motion.div
            key={job.id}
            layout
            className="glass-card"
            style={{
                padding: '2.5rem',
                borderRadius: '32px',
                border: expandedId === job.id ? '1px solid var(--primary)' : '1px solid var(--card-border)',
                background: expandedId === job.id ? 'linear-gradient(145deg, hsla(217, 91%, 60%, 0.05) 0%, transparent 100%)' : 'var(--card-bg)',
                cursor: 'pointer'
            }}
            onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
          >
            {/* Title Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                    <div style={{ background: 'var(--primary-glow)', width: '52px', height: '52px', borderRadius: '16px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Briefcase size={24} color="var(--primary)" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ color: 'white', fontSize: '1.45rem', fontWeight: '900', letterSpacing: '-0.5px', marginBottom: '8px' }}>{job.title}</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: '700' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Users size={13} /> {job.department}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={13} /> {job.location}</span>
                        </div>
                    </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(job.id); }} className="btn-action-pro" style={{ color: 'var(--danger)', padding: '8px', background: 'hsla(0, 85%, 60%, 0.05)', borderRadius: '12px', flexShrink: 0 }}>
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Metadata Badges */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {job.salary && (
                    <span style={{ background: 'hsla(150, 80%, 45%, 0.08)', color: 'var(--success)', border: '1px solid hsla(150, 80%, 45%, 0.2)', padding: '5px 14px', borderRadius: '30px', fontSize: '0.8rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <DollarSign size={13} /> {job.salary}
                    </span>
                )}
                <span style={{ background: 'hsla(217, 91%, 60%, 0.08)', color: 'var(--primary)', border: '1px solid hsla(217, 91%, 60%, 0.2)', padding: '5px 14px', borderRadius: '30px', fontSize: '0.8rem', fontWeight: '800' }}>
                    {job.type || 'Full-Time'}
                </span>
                <span style={{ background: 'hsla(255,255%,255%,0.03)', color: 'var(--text-dim)', border: '1px solid var(--card-border)', padding: '5px 14px', borderRadius: '30px', fontSize: '0.8rem', fontWeight: '700' }}>
                    Posted {job.posted}
                </span>
                <span style={{ background: 'hsla(255,255%,255%,0.03)', color: expandedId === job.id ? 'var(--primary)' : 'var(--text-dim)', border: '1px solid var(--card-border)', padding: '5px 14px', borderRadius: '30px', fontSize: '0.8rem', fontWeight: '700', transition: 'all 0.3s' }}>
                    {expandedId === job.id ? '▲ Collapse' : '▼ View Details'}
                </span>
            </div>

            {/* Description Preview */}
            <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '1.5rem' }}>
                {expandedId === job.id ? job.description : (job.description || '').substring(0, 200) + '...'}
            </p>

            {/* Skills Chips — Always Visible */}
            {(job.skills || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1rem' }}>
                    {(job.skills || []).map(skill => (
                        <span key={skill} style={{ background: 'hsla(0,0%,100%,0.03)', color: 'var(--text-dim)', padding: '5px 14px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '700', border: '1px solid var(--card-border)' }}>{skill}</span>
                    ))}
                </div>
            )}

            {/* Expanded Details */}
            <AnimatePresence>
                {expandedId === job.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ marginTop: '2.5rem', paddingTop: '2.5rem', borderTop: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            
                            {/* Top row: responsibilities + requirements */}
                            {(job.responsibilities || job.requirements) && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    {job.responsibilities && (
                                        <div style={{ background: 'hsla(217, 91%, 60%, 0.05)', padding: '1.75rem', borderRadius: '22px', border: '1px solid hsla(217, 91%, 60%, 0.12)' }}>
                                            <div style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>⚙ Key Responsibilities</div>
                                            <p style={{ color: 'white', fontSize: '0.88rem', lineHeight: '1.75', whiteSpace: 'pre-line' }}>{job.responsibilities}</p>
                                        </div>
                                    )}
                                    {job.requirements && (
                                        <div style={{ background: 'hsla(150, 80%, 45%, 0.04)', padding: '1.75rem', borderRadius: '22px', border: '1px solid hsla(150, 80%, 45%, 0.1)' }}>
                                            <div style={{ color: 'var(--success)', fontWeight: '900', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>✓ Requirements</div>
                                            <p style={{ color: 'white', fontSize: '0.88rem', lineHeight: '1.75', whiteSpace: 'pre-line' }}>{job.requirements}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Bonus Points */}
                            {job.bonusPoints && (
                                <div style={{ background: 'hsla(45, 100%, 50%, 0.04)', padding: '1.75rem', borderRadius: '22px', border: '1px solid hsla(45, 100%, 50%, 0.1)' }}>
                                    <div style={{ color: 'var(--warning)', fontWeight: '900', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>★ Bonus Points</div>
                                    <p style={{ color: 'white', fontSize: '0.88rem', lineHeight: '1.75', whiteSpace: 'pre-line' }}>{job.bonusPoints}</p>
                                </div>
                            )}

                            {/* Bottom row: Perks / Process / Culture */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                                <div style={{ background: 'hsla(217, 91%, 60%, 0.05)', padding: '1.5rem', borderRadius: '20px', border: '1px solid hsla(217, 91%, 60%, 0.12)' }}>
                                    <div style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '0.7rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Gift size={15} /> Perks</div>
                                    <p style={{ color: 'white', fontSize: '0.9rem', lineHeight: '1.6' }}>{job.benefits || 'Premium reward stack.'}</p>
                                </div>
                                <div style={{ background: 'hsla(45, 100%, 50%, 0.05)', padding: '1.5rem', borderRadius: '20px', border: '1px solid hsla(45, 100%, 50%, 0.12)' }}>
                                    <div style={{ color: 'var(--warning)', fontWeight: '900', fontSize: '0.7rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Zap size={15} /> Process</div>
                                    <p style={{ color: 'white', fontSize: '0.9rem', lineHeight: '1.6' }}>{job.interviewProcess || 'Streamlined loop.'}</p>
                                </div>
                                <div style={{ background: 'hsla(255, 90%, 75%, 0.05)', padding: '1.5rem', borderRadius: '20px', border: '1px solid hsla(255, 90%, 75%, 0.12)' }}>
                                    <div style={{ color: '#a78bfa', fontWeight: '900', fontSize: '0.7rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Globe size={15} /> Culture</div>
                                    <p style={{ color: 'white', fontSize: '0.9rem', lineHeight: '1.6' }}>{job.culture || 'High-velocity DNA.'}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {jobs.length === 0 && (
        <div style={{ padding: '6rem', textAlign: 'center', background: 'white', borderRadius: '20px', border: '2px dashed #e5e7eb' }}>
          <Briefcase size={48} style={{ color: '#d1d5db', marginBottom: '1.5rem' }} />
          <h4 style={{ color: '#374151', fontWeight: '700', marginBottom: '0.5rem' }}>No job postings yet</h4>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Click "New Job Posting" to get started.</p>
        </div>
      )}
    </div>
  );
};

const inputStyle = { width: '100%', background: 'hsla(255, 255%, 255%, 0.03)', border: '1px solid var(--card-border)', padding: '1.25rem', borderRadius: '18px', color: 'white', fontSize: '1.05rem', outline: 'none' };

export default AdminJobDescriptions;
