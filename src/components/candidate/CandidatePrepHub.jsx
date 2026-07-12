import React, { useState } from 'react';
import { HelpCircle, Video, Sparkles, MapPin, Target, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './candidate.css';

const CandidatePrepHub = ({ myProfile, setActiveTab, setActiveInterviewApp }) => {
  const applications = myProfile?.applications || [];

  return (
    <div className="fadeIn cph-container">
      <div className="cph-header">
        <div>
          <div className="cph-readiness-row">
            <Sparkles size={16} color="#3b82f6" />
            <span className="cph-readiness-badge">Simulation Readiness</span>
          </div>
          <h2 className="cph-title">Interview Hub</h2>
          <p className="cph-subtitle">Engage in full-stack AI-driven interviews mapped dynamically to your actual applications.</p>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="cph-empty-state">
          <div className="cph-empty-icon-wrapper">
            <Target size={40} color="var(--text-muted)" />
          </div>
          <h3 className="cph-empty-title">No Active Applications</h3>
          <p className="cph-empty-text">You have not submitted any job applications yet. Head over to the Job Board to apply and unlock their customized Interview Simulations here!</p>
        </div>
      ) : (
        <div className="cph-list">
          {applications.map((app, i) => {
            if (!app.job) return null;
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-card cph-card"
              >
                <div className="cph-card-content">
                  <div className="cph-job-info">
                    <div className="cph-job-header">
                      <span className="cph-job-dept-badge">{app.job.department}</span>
                      <h3 className="cph-job-title">{app.job.title}</h3>
                    </div>
                    <div className="cph-job-meta">
                      {app.resumeName && <span className="cph-job-meta-item">📄 Profile: {app.resumeName}</span>}
                      <span className="cph-job-meta-item"><MapPin size={14} /> {app.job.location}</span>
                      <span className="cph-job-meta-item primary"><Target size={14} /> {app.resumeScore || app.candidate?.match}% Match Context</span>
                    </div>
                  </div>
                  <div className="cph-action-box">
                    <button
                      onClick={() => { setActiveInterviewApp(app); setActiveTab('interview'); }}
                      className="btn-action-pro btn-primary cph-btn-interview"
                    >
                      <Video size={16} /> Enter Interview
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CandidatePrepHub;
