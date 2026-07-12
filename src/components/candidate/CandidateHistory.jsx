import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  History, Calendar, Award, Target, MessageSquare,
  ChevronRight, Brain, Zap, Trophy,
  ArrowLeft, Star, FileText, CheckCircle2, ShieldCheck,
  TrendingUp, Sparkles, Cpu
} from 'lucide-react';
import { API_BASE_URL } from '../../apiConfig';

const CandidateHistory = ({ user, myProfile }) => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInterview, setSelectedInterview] = useState(null);

  const getRank = (score) => {
    if (score >= 90) return { label: 'PLATINUM', class: 'rank-platinum', icon: <Cpu size={14} /> };
    if (score >= 80) return { label: 'GOLD', class: 'rank-gold', icon: <Star size={14} /> };
    if (score >= 70) return { label: 'SILVER', class: 'rank-silver', icon: <Award size={14} /> };
    return { label: 'BRONZE', class: 'rank-bronze', icon: <TrendingUp size={14} /> };
  };

  useEffect(() => {
    fetchInterviews();
  }, [user]);

  const fetchInterviews = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/interviews/${user.primaryEmailAddress.emailAddress}`);
      const data = await res.json();
      setInterviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  const AnalysisModal = ({ interview, onClose }) => {
    const analysis = interview.analysis || {};

    // 3D Tilt Effect for Certificate
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const handleMouseMove = (event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      x.set(event.clientX - (rect.left + rect.width / 2));
      y.set(event.clientY - (rect.top + rect.height / 2));
    };
    const handleMouseLeave = () => { x.set(0); y.set(0); };
    const rotateX = useTransform(y, [-300, 300], [5, -5]);
    const rotateY = useTransform(x, [-300, 300], [-5, 5]);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="history-modal-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="history-modal-content"
          onClick={e => e.stopPropagation()}
        >
          <div className="analysis-certificate-container">
            {/* Canva-like Stylized Certificate Header */}
            <motion.div 
              className="certificate-design"
              style={{ rotateX, rotateY, transformPerspective: 1000 }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <div className="cert-top-accent" />
              <div className="cert-content" style={{ transform: 'translateZ(20px)' }}>
                <div className="cert-logo">
                  <Cpu size={32} color="var(--primary)" />
                  <span className="cert-brand">HIREAI NEURAL VERIFIED</span>
                </div>

                <h2 className="cert-title">Neural Performance Summary</h2>
                <div className="cert-divider" />
                
                <p className="cert-subtitle">Technical assessment details for</p>
                <h1 className="cert-name">{myProfile?.name || user?.fullName}</h1>
                <p className="cert-role">{interview.job?.title}</p>

                <div className="cert-metrics">
                  <div className="cert-metric-box">
                    <span className="cert-metric-val">{interview.overallScore}%</span>
                    <span className="cert-metric-label">NEURAL SCORE</span>
                  </div>
                  <div className="cert-metric-box rank-box">
                    <span className={`cert-rank-val ${getRank(interview.overallScore).class}`}>{getRank(interview.overallScore).label}</span>
                    <span className="cert-metric-label">ACHIEVED RANK</span>
                  </div>
                </div>

                <div className="cert-footer">
                  <div className="cert-date">Evaluated on {new Date(interview.createdAt).toLocaleDateString()}</div>
                  <div className="cert-sig">
                    <ShieldCheck size={20} />
                    <span>Neural Authentication Verified</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Detailed Analysis Section */}
            <div className="analysis-details-pane">
              <div className="pane-header">
                <h3>Neural Deep Dive</h3>
                <button onClick={onClose} className="pane-close-btn">&times;</button>
              </div>

              <div className="pane-stats">
                <motion.div whileHover={{ scale: 1.05 }} className="stat-card" style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                  <Brain size={20} color="var(--primary)" />
                  <div className="stat-info" style={{ zIndex: 1 }}>
                    <span className="stat-label">Technical Depth</span>
                    <span className="stat-value">{analysis.technicalDepth || 0}%</span>
                  </div>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${analysis.technicalDepth || 0}%` }} transition={{ duration: 1, delay: 0.5 }} style={{ position: 'absolute', bottom: 0, left: 0, height: '4px', background: 'var(--primary)', opacity: 0.5 }} />
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} className="stat-card" style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                  <Zap size={20} color="var(--warning)" />
                  <div className="stat-info" style={{ zIndex: 1 }}>
                    <span className="stat-label">Communication</span>
                    <span className="stat-value">{analysis.communicationSkills || 0}%</span>
                  </div>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${analysis.communicationSkills || 0}%` }} transition={{ duration: 1, delay: 0.7 }} style={{ position: 'absolute', bottom: 0, left: 0, height: '4px', background: 'var(--warning)', opacity: 0.5 }} />
                </motion.div>
              </div>

              <div className="analysis-sections">
                <div className="analysis-section">
                  <h4><Trophy size={16} color="var(--success)" /> Key Strengths</h4>
                  <ul>
                    {analysis.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                    {!analysis.strengths && <li>Performance metrics are within expected parameters.</li>}
                  </ul>
                </div>

                <div className="analysis-section">
                  <h4><TrendingUp size={16} color="var(--info)" /> Growth Areas</h4>
                  <ul>
                    {analysis.improvements?.map((s, i) => <li key={i}>{s}</li>)}
                    {!analysis.improvements && <li>Ready for immediate deployment.</li>}
                  </ul>
                </div>

                <div className="analysis-section full-width">
                  <h4><MessageSquare size={16} color="var(--primary)" /> AI Interviewer Feedback</h4>
                  <p>{interview.feedback || "Excellent technical performance demonstrated throughout the session."}</p>
                </div>
              </div>

              {/* Actions removed as requested */}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <div className="header-text-group">
          <History size={24} color="var(--primary)" />
          <div>
            <h2>Interview Roadmap</h2>
            <p>Your technical evolution and performance history.</p>
          </div>
        </div>
        <div className="history-stats-mini">
          <div className="mini-stat">
            <span className="val">{interviews.length}</span>
            <span className="lbl">Interviews</span>
          </div>
          <div className="mini-stat">
            <span className="val">{interviews.length > 0 ? Math.round(interviews.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / interviews.length) : 0}%</span>
            <span className="lbl">Avg Score</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="history-loading">
          <div className="neural-spinner" />
          <p>Retrieving your neural history...</p>
        </div>
      ) : interviews.length === 0 ? (
        <div className="history-empty">
          <div className="empty-icon"><Sparkles size={48} /></div>
          <h3>Your journey is just beginning</h3>
          <p>Take your first AI interview to begin tracking your technical growth.</p>
          <button className="btn-primary-pro" onClick={() => window.location.hash = '#jobboard'}>
            Browse Jobs <Zap size={16} />
          </button>
        </div>
      ) : (
        <div className="history-grid">
          {interviews.map((interview, index) => (
            <motion.div
              key={interview.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="history-card"
            >
              <div className="card-top">
                <div className="job-icon-box">
                  <FileText size={20} color="var(--primary)" />
                </div>
                <div className="job-info">
                  <h4>{interview.job?.title}</h4>
                  <div className="card-rank-row">
                    <span className={`rank-badge ${getRank(interview.overallScore).class}`}>
                      {getRank(interview.overallScore).icon} {getRank(interview.overallScore).label}
                    </span>
                    <span className="job-date">
                      <Calendar size={14} /> {new Date(interview.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="score-pill">
                  <Trophy size={14} />
                  {interview.overallScore}%
                </div>
              </div>

              <div className="card-preview">
                <p>"{interview.feedback?.slice(0, 80)}..."</p>
              </div>

              <div className="card-footer">
                <div className="footer-tags">
                  <span className="footer-tag"><Brain size={12} /> Technical</span>
                  <span className="footer-tag"><Zap size={12} /> AI Verified</span>
                </div>
                <button
                  className="btn-analysis"
                  onClick={() => setSelectedInterview(interview)}
                >
                  Deep Analysis <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedInterview && (
          <AnalysisModal
            interview={selectedInterview}
            onClose={() => setSelectedInterview(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CandidateHistory;
