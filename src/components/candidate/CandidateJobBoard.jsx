import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Sparkles, ChevronRight, CheckCircle2, Search, Zap, Send, Users, Globe, Gift, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './candidate.css';
import { API_BASE_URL } from '../../apiConfig';

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'recently';
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' mins ago';
  return 'just now';
};

const CandidateJobBoard = ({ user, allJobs, recommendations = [], myProfile, onRefresh, setActiveTab }) => {
  const [rankedJobs, setRankedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);

  useEffect(() => {
    const fetchResumes = async () => {
      if (!myProfile?.email) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/candidates/${myProfile.email}/resumes`);
        if (res.ok) {
          const data = await res.json();
          setResumes(data);
          if (data.length > 0) setSelectedResumeId(data[0].id);
        }
      } catch (err) { console.error("Failed to fetch resumes:", err); }
    };
    fetchResumes();
  }, [myProfile?.email]);

  const safeAllJobs = Array.isArray(allJobs) ? allJobs : [];
  const departments = ['All', ...new Set(safeAllJobs.map(j => j.department))];

  useEffect(() => {
    const merged = safeAllJobs.map(job => {
      const ranking = recommendations.find(r => r.id === job.id);
      return { ...job, matchPercent: ranking?.matchPercent || 0, reason: ranking?.reason || 'AI analysis pending profile update.' };
    }).sort((a, b) => b.matchPercent - a.matchPercent);
    setRankedJobs(merged);
    if (recommendations.length > 0 || safeAllJobs.length > 0) setLoading(false);
  }, [recommendations, allJobs]);

  const filteredJobs = rankedJobs.filter(job => {
    const matchesFilter = filter === 'All' || job.department === filter;
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleApply = async (e, jobId, isApplied) => {
    e.stopPropagation();
    if (!myProfile?.email) { alert("Profile context missing, please try signing in again."); return; }
    if (isApplied) {
      if (!window.confirm("Are you sure you want to cancel your application?")) return;
      setProcessingId(jobId);
      try {
        const res = await fetch(`${API_BASE_URL}/api/applications/${myProfile.email}/${jobId}`, { method: 'DELETE' });
        if (res.ok && onRefresh) await onRefresh();
      } catch(e) { console.error("Cancellation failed", e); }
      finally { setProcessingId(null); }
      return;
    }
    if (resumes.length === 0) { alert("Please upload at least one resume to apply for jobs."); if (setActiveTab) setActiveTab('submit'); return; }
    setApplyingJobId(jobId);
  };

  const submitApplication = async () => {
    const selectedResume = resumes.find(r => r.id === selectedResumeId);
    if (!selectedResume) return;
    setProcessingId(applyingJobId);
    try {
      const payload = { candidateEmail: myProfile.email, jobId: applyingJobId, resumeName: selectedResume.name, resumeScore: selectedResume.score, resumeSummary: selectedResume.summary, resumeSkills: myProfile.skills || [] };
      const res = await fetch(`${API_BASE_URL}/api/applications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok && onRefresh) await onRefresh();
    } catch(err) { console.error("Apply failed", err); }
    finally { setProcessingId(null); setApplyingJobId(null); }
  };

  return (
    <div className="fadeIn">
      <div className="cjb-header-row">
        <div>
          <h2 className="cjb-main-title">AI-Ranked Career Openings</h2>
          <p className="cjb-main-subtitle">Discover roles tailored to your unique background and skills.</p>
        </div>
        <div className="cjb-controls">
          <div className="cjb-search-wrapper">
            <Search size={18} color="#64748b" className="cjb-search-icon" />
            <input type="text" placeholder="Search roles..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} className="cjb-search-input" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="cjb-filter-select">
            {departments.map(d => <option key={d} value={d} className="cjb-filter-option">{d}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="cjb-loading">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="cjb-loading-icon">
            <Sparkles size={48} color="#3b82f6" />
          </motion.div>
          <h3 className="cjb-loading-text">AI is ranking opportunities for you...</h3>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="cjb-empty">
          <Briefcase size={48} color="#334155" className="cjb-empty-icon" />
          <h3 className="cjb-empty-title">No openings match your search.</h3>
        </div>
      ) : (
        <div className="cjb-jobs-grid">
          <AnimatePresence>
            {filteredJobs.map((job, index) => {
              const isApplied = myProfile?.applications?.some(a => a.jobId === job.id) || false;
              const isExpanded = expandedId === job.id;
              return (
                <motion.div
                  key={job.id} layout
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`glass-card cjb-job-card ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => setExpandedId(isExpanded ? null : job.id)}
                >
                  {job.matchPercent > 85 && <div className="cjb-high-match-bar" />}

                  <div className="cjb-card-title-row">
                    <div className="cjb-card-left">
                      <div className="cjb-company-icon"><Briefcase size={24} color="var(--primary)" /></div>
                      <div className="cjb-job-title-col">
                        <h3 className="cjb-job-title">
                          {job.title}
                          {job.matchPercent > 85 && (
                            <span className="cjb-best-match-badge"><Zap size={10} fill="#10b981" /> BEST MATCH</span>
                          )}
                        </h3>
                        <div className="cjb-job-meta-row">
                          <span className="cjb-meta-item"><Users size={13} /> {job.department}</span>
                          <span className="cjb-meta-item"><MapPin size={13} /> {job.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="cjb-match-score">
                      <div className={`cjb-match-score-value ${job.matchPercent > 80 ? 'high' : ''}`}>
                        {job.matchPercent}<span className="cjb-match-score-unit">%</span>
                      </div>
                      <p className="cjb-match-score-label">Match</p>
                    </div>
                  </div>

                  <div className="cjb-badges-row">
                    {job.salary && (
                      <span className="cjb-badge cjb-label-success"><DollarSign size={13} /> {job.salary}</span>
                    )}
                    <span className="cjb-badge cjb-label-primary">{job.type || 'Full-Time'}</span>
                    <span className="cjb-badge">Posted {formatTimeAgo(job.createdAt)}</span>
                    <span className={`cjb-badge cjb-badge-toggle ${isExpanded ? 'expanded' : ''}`}>
                      {isExpanded ? '▲ Collapse' : '▼ View Details'}
                    </span>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="cjb-job-description" style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
                        {job.description}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {(job.skills || []).length > 0 && (
                    <div className="cjb-skills-row">
                      {(job.skills || []).map(skill => (<span key={skill} className="cjb-skill-chip">{skill}</span>))}
                    </div>
                  )}

                  {!isExpanded && (
                    <div className="cjb-collapsed-footer">
                      <div className="cjb-ai-reason">
                        <Sparkles size={12} color="#3b82f6" className="cjb-ai-reason-spacer" />
                        "{job.reason}"
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}
                        onClick={(e) => handleApply(e, job.id, isApplied)}
                        disabled={processingId === job.id}
                        className={`btn-action-pro cjb-apply-btn ${isApplied ? 'cjb-btn-applied' : 'btn-primary'} ${processingId === job.id ? 'cjb-btn-processing' : ''}`}
                      >
                        {processingId === job.id ? 'Processing...' : isApplied ? <><CheckCircle2 size={16} /> Applied</> : <>Apply <Send size={14} /></>}
                      </motion.button>
                    </div>
                  )}

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="cjb-expanded-section">
                        <div className="cjb-expanded-inner">
                          <div className="cjb-ai-reason-expanded">
                            <Sparkles size={14} color="#3b82f6" className="cjb-sparkle-abs" />
                            <span className="cjb-label-primary cjb-ai-insight-label">AI INSIGHT:</span>
                            "{job.reason}"
                          </div>

                          {/* Neural Breakdown for Candidate View */}
                          {job.matchBreakdown && (
                            <div className="cjb-breakdown-section">
                              <h4 className="cjb-breakdown-title"><TrendingUp size={16} /> NEURAL FIT BREAKDOWN</h4>
                              <div className="cjb-breakdown-grid">
                                {Object.entries(job.matchBreakdown).map(([key, data]) => (
                                  <div key={key} className="cjb-breakdown-item">
                                    <div className="cjb-breakdown-info">
                                      <span className="cjb-breakdown-key">{key.toUpperCase()}</span>
                                      <span className="cjb-breakdown-val">{data.score} / {data.max}</span>
                                    </div>
                                    <div className="cjb-breakdown-progress-bg">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(data.score / (data.max || 1)) * 100}%` }}
                                        transition={{ duration: 1.2, ease: "easeOut" }}
                                        className="cjb-breakdown-progress-fill"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {(job.responsibilities || job.requirements) && (
                            <div className="cjb-two-col">
                              {job.responsibilities && (
                                <div className="cjb-detail-box cjb-detail-primary">
                                  <div className="cjb-detail-heading cjb-label-primary">⚙ Key Responsibilities</div>
                                  <p className="cjb-detail-text">{job.responsibilities}</p>
                                </div>
                              )}
                              {job.requirements && (
                                <div className="cjb-detail-box cjb-detail-success">
                                  <div className="cjb-detail-heading cjb-label-success">✓ Requirements</div>
                                  <p className="cjb-detail-text">{job.requirements}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {job.bonusPoints && (
                            <div className="cjb-detail-box cjb-detail-warning">
                              <div className="cjb-detail-heading cjb-label-warning">★ Bonus Points</div>
                              <p className="cjb-detail-text">{job.bonusPoints}</p>
                            </div>
                          )}

                          <div className="cjb-three-col">
                            <div className="cjb-detail-box cjb-detail-primary">
                              <div className="cjb-detail-heading cjb-label-primary"><Gift size={15} /> Perks</div>
                              <p className="cjb-detail-text">{job.benefits || 'Premium reward stack.'}</p>
                            </div>
                            <div className="cjb-detail-box cjb-detail-warning">
                              <div className="cjb-detail-heading cjb-label-warning"><Zap size={15} /> Process</div>
                              <p className="cjb-detail-text">{job.interviewProcess || 'Streamlined loop.'}</p>
                            </div>
                            <div className="cjb-detail-box cjb-detail-accent">
                              <div className="cjb-detail-heading cjb-label-accent"><Globe size={15} /> Culture</div>
                              <p className="cjb-detail-text">{job.culture || 'High-velocity DNA.'}</p>
                            </div>
                          </div>

                          <div className="cjb-modal-actions">
                            <motion.button
                              whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}
                              onClick={(e) => handleApply(e, job.id, isApplied)}
                              disabled={processingId === job.id}
                              className={`btn-action-pro cjb-apply-btn-full ${isApplied ? 'cjb-btn-applied' : 'btn-primary'} ${processingId === job.id ? 'cjb-btn-processing' : ''}`}
                            >
                              {processingId === job.id ? 'Processing...' : isApplied ? <><CheckCircle2 size={20} /> Application Submitted! (Click to cancel)</> : <>Quick Apply with AI Profile <Send size={18} /></>}
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Resume Selection Modal */}
      <AnimatePresence>
        {applyingJobId && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card cjb-modal">
              <button onClick={() => setApplyingJobId(null)} className="cjb-modal-close"><X size={24} /></button>
              <h3 className="cjb-modal-title">Select Resume</h3>
              <p className="cjb-modal-subtitle">Choose which resume profile to send to the recruiter for this application.</p>
              <div className="cjb-resume-list">
                {resumes.map(r => (
                  <div key={r.id} onClick={() => setSelectedResumeId(r.id)}
                    className={`cjb-resume-item ${selectedResumeId === r.id ? 'selected' : ''}`}>
                    <div>
                      <div className="cjb-resume-name">{r.name}</div>
                      <div className="cjb-resume-date">Added: {r.date}</div>
                    </div>
                    <div className="cjb-resume-score">{r.score}% Match</div>
                  </div>
                ))}
              </div>
              <div className="cjb-modal-actions">
                <button onClick={() => setApplyingJobId(null)} className="btn-action-pro cjb-btn-cancel">Cancel</button>
                <button onClick={submitApplication} className="btn-action-pro btn-primary cjb-btn-submit" disabled={processingId === applyingJobId}>
                  {processingId === applyingJobId ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CandidateJobBoard;
