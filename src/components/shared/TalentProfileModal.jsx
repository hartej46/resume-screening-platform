import React from 'react';
import { 
  X, 
  Cpu, 
  Briefcase, 
  MapPin, 
  Calendar, 
  BadgeCheck, 
  Target, 
  Zap,
  Globe,
  User,
  ShieldCheck,
  TrendingUp,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TalentProfileModal = ({ isOpen, onClose, candidate }) => {
  if (!candidate) return null;

  const analysis = candidate.detailedAnalysis || {
      technicalDeepDive: { "Knowledge Node": "Basic Profile - Detailed metrics pending AI re-crawl." },
      experienceArchitecture: { "History": "Standard experience verification complete." },
      culturalCalibration: { "Alignment": "Culture-fit assessment pending." }
  };

  return (
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
              <button 
                onClick={onClose}
                style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'hsla(0,0%,100%,0.05)', border: '1px solid var(--card-border)', color: 'white', padding: '10px', borderRadius: '14px', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ width: '100px', height: '100px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px var(--primary-glow)' }}>
                  <User size={48} color="white" />
                </div>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h2 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px' }}>{candidate.name}</h2>
                        <span className="pill-capsule" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid hsla(217, 91%, 60%, 0.2)' }}>
                            {candidate.match}% AI MATCH
                        </span>
                    </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: 'var(--text-dim)', fontSize: '0.95rem', fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Briefcase size={18} color="var(--primary)" /> {candidate.role}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={18} /> Remote / HQ</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={18} /> Processed {candidate.applied}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Body */}
            <div style={{ padding: '3rem', overflowY: 'auto', maxHeight: 'calc(85vh - 200px)' }} className="hide-scrollbar">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                
                {/* Left Column: Intelligence Base */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                  
                  {/* Technical Section */}
                  <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', fontWeight: '900', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.1em' }}>
                      <Cpu size={18} /> TECHNICAL DEEP DIVE
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {Object.entries(analysis.technicalDeepDive).map(([key, value]) => (
                        <div key={key} style={{ background: 'hsla(255, 255%, 255%, 0.03)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--card-border)' }}>
                          <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '800', marginBottom: '6px', textTransform: 'uppercase' }}>{key}</span>
                          <span style={{ color: 'white', fontSize: '1rem', fontWeight: '600', lineHeight: '1.4' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Skills Section */}
                  <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--secondary)', fontWeight: '900', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.1em' }}>
                      <Target size={18} /> PROFICIENCY NODES
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {(candidate.skills || []).map(skill => (
                        <span key={skill} style={{ background: 'hsla(190, 90%, 50%, 0.1)', color: 'var(--secondary)', border: '1px solid hsla(190, 90%, 50%, 0.2)', padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '800' }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Right Column: Experience and Culture */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                  
                  {/* Experience Section */}
                  <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--warning)', fontWeight: '900', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.1em' }}>
                      <TrendingUp size={18} /> EXPERIENCE ARCHITECTURE
                    </div>
                    <div style={{ spaceY: '1rem' }}>
                      {Object.entries(analysis.experienceArchitecture).map(([key, value]) => (
                        <div key={key} style={{ marginBottom: '1.5rem', borderLeft: '2px solid hsla(40, 95%, 55%, 0.2)', paddingLeft: '1.25rem' }}>
                          <span style={{ display: 'block', color: 'var(--warning)', fontSize: '0.7rem', fontWeight: '800', marginBottom: '4px' }}>{key}</span>
                          <span style={{ color: 'var(--text-dim)', fontSize: '1rem', lineHeight: '1.6' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Cultural Section */}
                  <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#a78bfa', fontWeight: '900', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '0.1em' }}>
                      <ShieldCheck size={18} /> CULTURAL CALIBRATION
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, hsla(260, 100%, 70%, 0.05) 0%, transparent 100%)', padding: '1.5rem', borderRadius: '24px', border: '1px solid hsla(260, 100%, 70%, 0.15)' }}>
                      {Object.entries(analysis.culturalCalibration).map(([key, value]) => (
                        <div key={key} style={{ marginBottom: '1rem' }}>
                          <span style={{ display: 'block', color: '#a78bfa', fontSize: '0.7rem', fontWeight: '800', marginBottom: '2px' }}>{key}</span>
                          <span style={{ color: 'white', fontSize: '0.95rem', lineHeight: '1.5' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Action Summary */}
                  <div style={{ marginTop: 'auto', background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--card-border)', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>
                        <Brain size={14} /> AI Recommendation
                    </div>
                    <p style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        "{candidate.feedback || "Strategic growth hire with high potential."}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TalentProfileModal;
