import React from 'react';
import { TrendingUp, AlertCircle, Cpu, Sparkles, CheckCircle, FileText, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const CandidateHome = ({ user, myProfile, recommendations = [] }) => {
  // Use the profile score as a primary fallback
  const displayScore = recommendations[0]?.matchPercent || myProfile?.match || 0;
  
  // Get AI content from profile
  const aiSummary = myProfile?.summary || "Analyzing your experience...";
  const aiReview = myProfile?.feedback || "Your AI evaluation and feedback will appear here shortly.";

  return (
    <div className="fadeIn" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '3rem' }}>
      {/* Left Column: Match Status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="glass-card" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-30px', left: '-30px', width: '180px', height: '180px', background: 'var(--primary-glow)', filter: 'blur(50px)', borderRadius: '50%', opacity: 0.4 }}></div>
            
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', marginBottom: '3.5rem', color: 'var(--text-dim)', position: 'relative', zIndex: 1 }}>
                <Cpu size={22} color="var(--primary)" /> NEURAL MATCH SCORE
            </h3>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ fontSize: '7.5rem', fontWeight: '900', letterSpacing: '-6px', color: 'white', marginBottom: '0.5rem', lineHeight: 1 }}
                >
                {displayScore}<span style={{ color: 'var(--primary)', fontSize: '3.5rem' }}>%</span>
                </motion.div>
                <p style={{ color: 'var(--text-muted)', fontWeight: '800', fontSize: '0.9rem', marginBottom: '3.5rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Unified Fit Index</p>
            </div>
            
            <div className="pro-progress-bg" style={{ height: '14px', marginBottom: '4rem', background: 'hsla(255, 255%, 255%, 0.05)' }}>
            <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${displayScore}%` }} 
                className="pro-progress-fill"
            ></motion.div>
            </div>
            
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '2.5rem', position: 'relative', zIndex: 1 }}>
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '800', marginBottom: '10px', color: 'var(--text-dim)' }}>
                <span>TECHNICAL DEPTH</span> <span>{Math.min(100, displayScore + 2)}%</span>
                </div>
                <div className="pro-progress-bg" style={{ height: '6px' }}>
                    <div className="pro-progress-fill" style={{ width: `${Math.min(100, displayScore + 2)}%` }}></div>
                </div>
            </div>
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '800', marginBottom: '10px', color: 'var(--text-dim)' }}>
                <span>CULTURAL SYNC</span> <span>{Math.min(100, displayScore + 5)}%</span>
                </div>
                <div className="pro-progress-bg" style={{ height: '6px' }}>
                    <div className="pro-progress-fill" style={{ width: `${Math.min(100, displayScore + 5)}%`, background: 'var(--accent)' }}></div>
                </div>
            </div>
            </div>
        </div>
      </div>

      {/* Right Column: AI Insights */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {/* Core AI Summary */}
        <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="glass-card" 
            style={{ borderLeft: '6px solid var(--primary)' }}
        >
          <h4 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            <Zap size={24} /> AI Cognitive Extract
          </h4>
          <p style={{ color: 'var(--text-main)', lineHeight: '1.8', fontSize: '1.05rem', opacity: 0.9 }}>
              {aiSummary}
          </p>
        </motion.div>

        {/* AI Recruiter Feedback */}
        <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.1 }}
            className="glass-card" 
            style={{ borderLeft: '6px solid var(--success)', background: 'linear-gradient(90deg, hsla(150, 80%, 45%, 0.05) 0%, transparent 100%)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.25rem' }}>
                <CheckCircle size={24} /> AI Recruiter Review
            </h4>
            <div style={{ padding: '4px 12px', background: 'hsla(150, 80%, 45%, 0.1)', color: 'var(--success)', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800' }}>
                VERIFIED EVALUATION
            </div>
          </div>
          <p style={{ color: 'var(--text-dim)', lineHeight: '1.8', fontSize: '1rem', fontStyle: 'italic' }}>
              <Sparkles size={16} color="var(--success)" style={{ display: 'inline', marginRight: '10px' }} />
              "{aiReview}"
          </p>
          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '2rem' }}>
              <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>VERDICT</div>
                  <div style={{ color: 'var(--success)', fontWeight: '900', fontSize: '1rem' }}>TOP 15% APPLICANT</div>
              </div>
              <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>NEXT STEP</div>
                  <div style={{ color: 'white', fontWeight: '900', fontSize: '1rem' }}>TECHNICAL INTERVIEW</div>
              </div>
          </div>
        </motion.div>

        {/* Actionable Tip */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.2 }}
            style={{ background: 'hsla(217, 91%, 60%, 0.08)', padding: '24px', borderRadius: '24px', border: '1px solid var(--primary-glow)', display: 'flex', gap: '16px', alignItems: 'center' }}
        >
            <div style={{ width: '48px', height: '48px', background: 'var(--primary)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={24} color="white" />
            </div>
            <div>
                <strong style={{ color: 'white', display: 'block', marginBottom: '4px', fontSize: '0.95rem' }}>AI Pre-Interview Tip:</strong>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Based on your extract, focus on explaining your backend architecture during the next round.</span>
            </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CandidateHome;
