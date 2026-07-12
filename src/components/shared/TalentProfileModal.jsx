import React from 'react';
import ReactDOM from 'react-dom';
import { 
  X, 
  Cpu, 
  Briefcase, 
  MapPin, 
  Calendar, 
  Target, 
  User, 
  ShieldCheck, 
  TrendingUp, 
  Brain, 
  Download,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TalentProfileModal = ({ isOpen, onClose, candidate }) => {
  if (!candidate) return null;

  const analysis = candidate.detailedAnalysis || {
      technicalDeepDive: { "Knowledge Node": "Basic Profile - Detailed metrics pending AI re-crawl." },
      experienceArchitecture: { "History": "Standard experience verification complete." },
      culturalCalibration: { "Alignment": "Culture-fit assessment pending." }
  };

  const handleDownload = () => {
    if (candidate.file) {
        window.open(candidate.file, '_blank');
    } else {
        alert("No original resume file found in database for this candidate.");
    }
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay">
          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 15 }}
            className="talent-modal-frame"
          >
            {/* Header */}
            <div className="talent-modal-header">
              <div className="modal-header-actions">
                <button 
                  onClick={handleDownload}
                  className="btn-pdf-pro"
                >
                  <Download size={16} /> PDF
                </button>
                <button 
                  onClick={onClose}
                  className="btn-close-pro-modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-profile-info">
                <div className="modal-avatar-box">
                  <User size={40} color="white" />
                </div>
                <div className="modal-details-box">
                    <div className="modal-name-row">
                        <h2 className="modal-name">{candidate.name}</h2>
                        <span className="talent-score-badge">
                            {candidate.applications?.[0]?.matchScore || candidate.match}% {candidate.applications?.[0] ? 'JOB FIT' : 'AI MATCH'}
                        </span>
                        {candidate.appliedResumeTitle && (
                            <span className="pill-badge-primary">
                                <Sparkles size={12} /> {candidate.appliedResumeTitle}
                            </span>
                        )}
                    </div>
                  <div className="modal-stats-row">
                    <div className="stat-item"><Briefcase size={16} /> {candidate.role}</div>
                    <div className="stat-item"><MapPin size={16} /> HQ / Global Node</div>
                    <div className="stat-item"><Calendar size={16} /> Synced {candidate.applied}</div>
                  </div>
                </div>
              </div>
            </div>


            {/* Scrollable Body */}
            <div className="talent-modal-body hide-scrollbar">
              <div className="talent-grid">
                
                {/* Left Column */}
                <div className="modal-column">
                  <section>
                    <div className="modal-section-label label-primary">
                      <Cpu size={20} />
                      <span className="label-text">TECHNICAL DEEP DIVE</span>
                    </div>
                    <div className="modal-card-list">
                      {Object.entries(analysis.technicalDeepDive).map(([key, value], idx) => (
                        <motion.div 
                          key={key} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + idx * 0.1 }}
                          className="talent-section-card"
                        >
                          <span className="card-key text-primary">{key}</span>
                          <span className="card-value">{value}</span>
                        </motion.div>
                      ))}
                    </div>
                  </section>

                  <section className="modal-section-spacing">
                    <div className="modal-section-label label-secondary">
                      <Target size={20} />
                      <span className="label-text">PROFICIENCY NODES</span>
                    </div>
                    <div className="modal-skill-grid">
                      {(candidate.skills || []).map((skill, idx) => (
                        <motion.span 
                          key={skill}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + idx * 0.05 }}
                          className="badge-primary-compact skill-pill"
                        >
                          {skill}
                        </motion.span>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right Column */}
                <div className="modal-column">
                  {/* New Match Breakdown Section */}
                  {candidate.applications?.[0]?.matchBreakdown && (
                    <section style={{ marginBottom: '2rem' }}>
                      <div className="modal-section-label label-primary">
                        <TrendingUp size={20} />
                        <span className="label-text">NEURAL MATCH ARCHITECTURE</span>
                      </div>
                      <div className="glass-card match-breakdown-card">
                        {Object.entries(candidate.applications[0].matchBreakdown).map(([key, data]) => (
                          <div key={key} className="breakdown-item">
                            <div className="breakdown-info">
                              <span className="breakdown-key">{key.toUpperCase()}</span>
                              <span className="breakdown-val">{data.score} / {data.max}</span>
                            </div>
                            <div className="breakdown-progress-bg">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(data.score / (data.max || 1)) * 100}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="breakdown-progress-fill"
                                style={{ background: `linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <section>
                    <div className="modal-section-label label-warning">
                      <TrendingUp size={20} />
                      <span className="label-text">EXPERIENCE ARCHITECTURE</span>
                    </div>
                    <div className="modal-timeline-list">
                      {Object.entries(analysis.experienceArchitecture).map(([key, value], idx) => (
                        <motion.div 
                          key={key} 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + idx * 0.1 }}
                          className="timeline-item"
                        >
                          <span className="timeline-key text-warning">{key}</span>
                          <span className="timeline-value">{value}</span>
                        </motion.div>
                      ))}
                    </div>
                  </section>

                  <section className="modal-section-spacing">
                    <div className="modal-section-label label-purple">
                      <ShieldCheck size={20} />
                      <span className="label-text">CULTURAL CALIBRATION</span>
                    </div>
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="culture-card"
                    >
                      {Object.entries(analysis.culturalCalibration).map(([key, value]) => (
                        <div key={key} className="culture-item">
                          <span className="culture-key text-purple">{key}</span>
                          <span className="culture-value">{value}</span>
                        </div>
                      ))}
                    </motion.div>
                  </section>

                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="ai-verdict-card"
                  >
                    <div className="verdict-header text-primary">
                        <Brain size={16} /> <span>AI RECOMMENDATION</span>
                    </div>
                    <p className="verdict-text">
                        "{candidate.feedback || "Strategic growth hire with high potential."}"
                    </p>
                  </motion.div>
                </div>


              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default TalentProfileModal;
