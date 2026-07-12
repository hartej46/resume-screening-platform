import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  Briefcase, 
  DollarSign, 
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './candidate.css';

const CandidateJobs = ({ jobs = [] }) => {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="fadeIn">
      <div className="cj-header">
        <h2 className="cj-title">Explore Open Roles</h2>
        <p className="cj-subtitle">Discover positions that match your profile and take the next step in your career.</p>
      </div>

      {jobs.length === 0 ? (
        <div className="cj-empty">
          <Briefcase size={48} className="cj-empty-icon" />
          <h4 className="cj-empty-title">No open roles at the moment</h4>
          <p className="cj-empty-subtitle">Check back soon for new opportunities.</p>
        </div>
      ) : (
        <div className="cj-jobs-list">
          {jobs.map((job, i) => {
            const isExpanded = expandedId === job.id;
            return (
              <motion.div
                layout
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`card cj-card ${isExpanded ? 'cj-card-expanded' : ''}`}
                onClick={() => setExpandedId(isExpanded ? null : job.id)}
              >
                <div className="cj-card-header">
                  <div className="cj-card-content">
                    <div className="cj-badges-wrapper">
                      <span className="cj-dept-badge">{job.department}</span>
                      <span className="cj-time-posted">Posted {job.posted}</span>
                    </div>
                    <h3 className="cj-job-title">{job.title}</h3>
                    
                    <div className="cj-job-meta">
                      <div className="cj-meta-item"><MapPin size={16} /> {job.location}</div>
                      <div className="cj-meta-item"><Clock size={16} /> {job.type}</div>
                      <div className="cj-meta-item"><DollarSign size={16} /> {job.salary}</div>
                    </div>

                    <div className="cj-skills-container">
                      {job.skills.map(skill => (
                        <span key={skill} className="cj-skill-item">{skill}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className={`cj-expand-icon-wrapper ${isExpanded ? 'cj-expand-icon-active' : ''}`}>
                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}>
                      <ChevronRight size={20} />
                    </motion.div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="cj-expanded-root"
                    >
                      <div className="cj-expanded-container">
                        <h4 className="cj-about-title">
                          <Sparkles size={16} color="#3b82f6" /> About the Role
                        </h4>
                        <p className="cj-about-desc">
                          {job.description}
                        </p>
                        
                        <button className="btn-primary cj-apply-btn">
                          Apply for this position <ArrowRight size={18} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CandidateJobs;
