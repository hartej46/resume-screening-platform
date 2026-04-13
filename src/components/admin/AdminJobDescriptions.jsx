import React, { useState } from 'react';
import { 
  Plus,
  MapPin, 
  Clock, 
  Users, 
  Briefcase, 
  DollarSign,
  ChevronRight,
  Sparkles,
  Trash2,
  Edit3,
  UploadCloud,
  FileText,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveKeywordStream from '../shared/LiveKeywordStream';

const inputStyle = {
  width: '100%',
  background: '#f9fafb',
  border: '1px solid #d1d5db',
  padding: '0.85rem 1rem',
  borderRadius: '10px',
  color: '#111827',
  fontSize: '0.9rem',
  fontFamily: 'Inter, sans-serif',
  outline: 'none'
};

const AdminJobDescriptions = ({ jobs: initialJobs = [], onRefresh }) => {
  const [jobs, setJobs] = useState(initialJobs);
  const [expandedId, setExpandedId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', department: '', location: '', type: 'Full-Time', description: '', skills: '' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const fileInputRef = React.useRef(null);

  const API_BASE_URL = "http://localhost:5001/api";

  React.useEffect(() => { setJobs(initialJobs); }, [initialJobs]);

  const handleDelete = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/jobs/${id}`, { method: 'DELETE' });
        if (response.ok && onRefresh) onRefresh();
    } catch (error) {
        console.error("Failed to delete job:", error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const response = await fetch(`${API_BASE_URL}/jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...newJob,
                skills: newJob.skills.split(',').map(s => s.trim()),
                status: 'Active'
            })
        });

        if (response.ok) {
            setNewJob({ title: '', department: '', location: '', type: 'Full-Time', description: '', skills: '' });
            setShowCreateForm(false);
            if (onRefresh) onRefresh();
        }
    } catch (error) {
        console.error("Failed to create job:", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif' }}>
            Job Descriptions
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', fontSize: '0.85rem' }}>
            {jobs.length} positions • {jobs.filter(j => j.status === 'Active').length} actively hiring
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary"
        >
          <Plus size={18} /> New Job Posting
        </button>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: '2rem' }}
          >
            <form onSubmit={handleCreate} className="card" style={{ padding: '2rem', borderRadius: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.75rem' }}>
                <Sparkles size={18} color="#3b82f6" />
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>Create New Position</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <input type="text" placeholder="Job Title (e.g. Senior React Developer)" value={newJob.title} onChange={e => setNewJob({ ...newJob, title: e.target.value })} required style={inputStyle} />
                <input type="text" placeholder="Department (e.g. Engineering)" value={newJob.department} onChange={e => setNewJob({ ...newJob, department: e.target.value })} required style={inputStyle} />
                <input type="text" placeholder="Location (e.g. Remote)" value={newJob.location} onChange={e => setNewJob({ ...newJob, location: e.target.value })} required style={inputStyle} />
                <input type="text" placeholder="Required Skills (comma separated)" value={newJob.skills} onChange={e => setNewJob({ ...newJob, skills: e.target.value })} style={inputStyle} />
              </div>
              <textarea
                placeholder="Write a compelling job description..."
                value={newJob.description}
                onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                required
                style={{ ...inputStyle, height: '110px', resize: 'vertical', marginBottom: '1rem' }}
              />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" disabled={isSubmitting} onClick={() => setShowCreateForm(false)} style={{ ...inputStyle, cursor: isSubmitting ? 'not-allowed' : 'pointer', width: 'auto', padding: '0.75rem 1.5rem', textAlign: 'center', color: '#6b7280' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ padding: '0.75rem 2rem', opacity: isSubmitting ? 0.7 : 1 }}>
                    {isSubmitting ? 'Publishing...' : 'Publish Job'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {jobs.map((job, i) => (
          <motion.div
            layout
            key={job.id}
            className="card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              padding: '1.75rem',
              cursor: 'pointer',
              transition: 'all 0.25s',
              border: expandedId === job.id ? '1px solid #bfdbfe' : '1px solid #e5e7eb',
              background: expandedId === job.id ? '#fafcff' : 'white'
            }}
            onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
          >
            {/* Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                  <span className="pill-capsule" style={{ background: job.status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: job.status === 'Active' ? '#10b981' : '#f59e0b', fontSize: '0.65rem' }}>
                    {job.status}
                  </span>
                  <span style={{ color: '#9ca3af', fontSize: '0.72rem' }}>{job.posted}</span>
                </div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '800', letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif' }}>{job.title}</h3>
              </div>
              <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                <button onClick={() => handleDelete(job.id)} style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)', padding: '6px 8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Trash2 size={14} />
                </button>
                <button style={{ background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb', padding: '6px 8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Edit3 size={14} />
                </button>
              </div>
            </div>

            {/* Meta Info */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.875rem', marginBottom: '1.25rem' }}>
              {[
                [Briefcase, job.department],
                [MapPin, job.location],
                [Clock, job.type],
                [DollarSign, job.salary]
              ].map(([Icon, label]) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6b7280', fontSize: '0.78rem' }}>
                  <Icon size={13} /> {label}
                </span>
              ))}
            </div>

            {/* Applicants */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '1rem' }}>
              <Users size={15} color="#3b82f6" />
              <span style={{ fontWeight: '700', color: '#111827', fontSize: '0.88rem' }}>{job.applicants}</span>
              <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>applicants</span>
            </div>

            {/* Skills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {job.skills.map(skill => (
                <span key={skill} style={{ padding: '4px 10px', background: '#eff6ff', color: '#3b82f6', borderRadius: '7px', fontSize: '0.7rem', fontWeight: '700', border: '1px solid #dbeafe' }}>
                  {skill}
                </span>
              ))}
            </div>

            {/* Expanded Description */}
            <AnimatePresence>
              {expandedId === job.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f3f4f6' }}>
                    <p style={{ color: '#374151', lineHeight: '1.7', fontSize: '0.88rem', marginBottom: '1.25rem' }}>{job.description}</p>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button className="btn-primary" style={{ padding: '7px 16px', fontSize: '0.82rem' }}>
                        View Applicants <ChevronRight size={14} style={{ marginLeft: '2px' }} />
                      </button>
                      <button className="btn-action-pro" style={{ padding: '7px 16px', background: 'white', color: '#6b7280', border: '1px solid #e5e7eb' }}>
                        Edit Description
                      </button>
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

export default AdminJobDescriptions;
