import React from 'react';
import { TrendingUp, AlertCircle, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

  return (
    <div className="fadeIn" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem' }}>
      {/* AI Fit Analysis Card */}
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1.05rem', marginBottom: '2.25rem', color: 'var(--text-primary)', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>
          <Cpu size={20} color="#3b82f6" /> AI Fit Analysis
        </h3>

        <div style={{ fontSize: '5.5rem', fontWeight: '900', letterSpacing: '-4px', color: 'var(--text-primary)', marginBottom: '0.2rem', fontFamily: 'Outfit, sans-serif' }}>
          88<span style={{ color: '#3b82f6', fontSize: '3rem' }}>%</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.82rem', marginBottom: '2.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Global Match Score</p>

        <div className="pro-progress-bg" style={{ height: '8px', marginBottom: '3rem' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '88%' }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', borderRadius: '4px' }}
          />
        </div>

        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
              <span>Technical Stack</span>
              <span style={{ color: '#3b82f6' }}>94%</span>
            </div>
            <div className="pro-progress-bg">
              <motion.div initial={{ width: 0 }} animate={{ width: '94%' }} transition={{ duration: 1.5, delay: 0.2 }} style={{ height: '100%', background: '#3b82f6', borderRadius: '4px' }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
              <span>Domain relevance</span>
              <span style={{ color: '#06b6d4' }}>72%</span>
            </div>
            <div className="pro-progress-bg">
              <motion.div initial={{ width: 0 }} animate={{ width: '72%' }} transition={{ duration: 1.5, delay: 0.4 }} style={{ height: '100%', background: '#06b6d4', borderRadius: '4px' }} />
            </div>
          </div>
        </div>

      {/* Right Column: Strengths + Gaps — matches screenshot exactly */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <div className="card" style={{ borderLeft: '4px solid #10b981', padding: '2rem', borderRadius: '20px' }}>
          <h4 style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', fontSize: '0.95rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>
            <TrendingUp size={18} /> Core Strengths
          </h4>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.92rem' }}>
            Your expertise in React &amp; Scalable Systems matches 95% of our high-priority requirements. AI detected strong architectural reasoning in your &quot;Project Alpha&quot; summary.
          </p>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #f59e0b', padding: '2rem', borderRadius: '20px' }}>
          <h4 style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', fontSize: '0.95rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>
            <AlertCircle size={18} /> Skill Gaps Detected
          </h4>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.92rem' }}>
            Limited exposure to Cloud Infrastructure (Terraform/AWS) detected. Our AI has curated 5 specific prep modules in the Prep Hub to address this before your interview.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CandidateHome;
