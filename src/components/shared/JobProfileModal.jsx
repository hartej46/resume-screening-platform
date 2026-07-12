import React from 'react';
import ReactDOM from 'react-dom';
import { 
  X, 
  Briefcase, 
  MapPin, 
  Target, 
  ShieldCheck, 
  TrendingUp, 
  Globe, 
  Brain, 
  Users 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const JobProfileModal = ({ isOpen, onClose, job, onSelectCandidate }) => {
  if (!job) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: '900px', 
              maxHeight: '85vh', 
              background: 'linear-gradient(135deg, hsla(240, 20%, 10%, 1) 0%, hsla(240, 15%, 8%, 1) 100%)',
              border: '1px solid var(--card-border)',
              borderRadius: '32px',
              overflow: 'hidden',
              boxShadow: '0 40px 100px rgba(0,0,0,0.5), 0 0 40px hsla(217, 91%, 60%, 0.1)'
            }}
          >
            {/* Header / Banner */}
            <div style={{ padding: '3rem', background: 'linear-gradient(to right, hsla(217, 91%, 60%, 0.08), transparent)', borderBottom: '1px solid var(--card-border)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '2rem', right: '2rem', display: 'flex', gap: '12px' }}>
                <button 
                  onClick={onClose}
                  style={{ background: 'hsla(0,0%,100%,0.05)', border: '1px solid var(--card-border)', color: 'white', padding: '10px', borderRadius: '14px', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ width: '100px', height: '100px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px var(--primary-glow)' }}>
                  <Briefcase size={48} color="white" />
                </div>
                <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h2 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px' }}>{job.title}</h2>
                        <span className="pill-capsule" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid hsla(217, 91%, 60%, 0.2)' }}>
                            {job.salary || 'Competitive'}
                        </span>
                    </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: 'var(--text-dim)', fontSize: '0.95rem', fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={18} color="var(--primary)" /> {job.department}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={18} /> {job.location}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Briefcase size={18} /> {job.type || 'Full-Time'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Body */}
            <div style={{ padding: '3rem', overflowY: 'auto', maxHeight: 'calc(85vh - 200px)' }} className="hide-scrollbar">
                {/* Executive Summary (AI Recommendation Style) */}
                <div className="ai-recommendation-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>
                        <Brain size={14} /> AI Strategic Summary
                    </div>
                    <p style={{ color: 'white', fontWeight: '600', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        "{job.description?.split('.').slice(0, 2).join('.')}. This role focuses on {job.department} excellence in {job.location}."
                    </p>
                </div>

                <div className="resume-section-container">
                    {/* Left Column */}
                    <div className="resume-style-section">
                        <section>
                            <div className="resume-section-header cyan"><Target size={18} /> Requisite Stack</div>
                            <div className="flex flex-wrap gap-1.5 mt-6">
                                {job.skills?.map(s => <span key={s} className="resume-pill-cyan">{s}</span>)}
                            </div>
                        </section>

                        {job.requirements && (
                            <section>
                                <div className="resume-section-header blue"><ShieldCheck size={18} /> Core Requirements</div>
                                <div className="mt-6">
                                    <div className="resume-style-item blue">
                                        <span className="resume-item-label blue">Qualifications</span>
                                        <span className="resume-item-value">{job.requirements}</span>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="resume-style-section">
                        {job.responsibilities && (
                            <section>
                                <div className="resume-section-header orange"><TrendingUp size={18} /> Experience Architecture</div>
                                <div className="mt-6">
                                    <div className="resume-style-item orange">
                                        <span className="resume-item-label orange">Key Responsibilities</span>
                                        <span className="resume-item-value">{job.responsibilities}</span>
                                    </div>
                                </div>
                            </section>
                        )}

                        {(job.interviewProcess || job.culture) && (
                            <section>
                                <div className="resume-section-header purple"><Globe size={18} /> Cultural Calibration</div>
                                <div className="mt-6">
                                    {job.interviewProcess && (
                                        <div className="resume-style-item purple">
                                            <span className="resume-item-label purple">Interview Process</span>
                                            <span className="resume-item-value">{job.interviewProcess}</span>
                                        </div>
                                    )}
                                    {job.culture && (
                                        <div className="resume-style-item purple">
                                            <span className="resume-item-label purple">Team & Culture</span>
                                            <span className="resume-item-value">{job.culture}</span>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                </div>

                {/* Active Applicants Panel */}
                <div style={{ marginTop: '3.5rem' }}>
                    {job.applications && job.applications.length > 0 && (
                        <div className="applicants-panel">
                            <div className="applicants-header">
                                <Users size={16} color="var(--primary)" /> Active Applicants
                            </div>
                            <div className="applicant-list">
                                {job.applications.map(app => (
                                    <div key={app.id} 
                                            onClick={(e) => { 
                                            e.stopPropagation(); 
                                            onSelectCandidate({
                                                ...app.candidate,
                                                match: app.resumeScore || app.candidate?.match,
                                                summary: app.resumeSummary || app.candidate?.summary,
                                                skills: app.resumeSkills?.length > 0 ? app.resumeSkills : app.candidate?.skills,
                                                appliedResumeTitle: app.resumeName || null
                                            }); 
                                            }}
                                            className="applicant-row"
                                    >
                                        <div className="applicant-info">
                                            <div className="applicant-name-row">
                                                <span className="applicant-name">{app.candidate?.name}</span>
                                                {app.resumeName && <span className="applicant-resume-badge">{app.resumeName}</span>}
                                            </div>
                                            <div className="applicant-email">{app.candidate?.email}</div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`applicant-match-badge ${(app.resumeScore || app.candidate?.match) > 80 ? 'match-high' : 'match-med'}`}>
                                                {app.resumeScore || app.candidate?.match}% Match
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default JobProfileModal;
