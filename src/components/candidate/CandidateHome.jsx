import React, { useState } from 'react';
import { TrendingUp, Cpu, Sparkles, CheckCircle, Zap, Lightbulb, Target, ArrowUpRight, Star, AlertTriangle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import JobNews from '../shared/JobNews';
import './candidate.css';

// Generate AI resume tips from real profile data
function generateTipsFallback(myProfile) {
  const tips = [];
  const skills = myProfile?.skills || [];
  const score = myProfile?.match || 0;
  const summary = myProfile?.summary || '';

  if (score < 60) {
    tips.push({ type: 'critical', icon: AlertTriangle, color: '#f59e0b', bg: 'hsla(45,100%,50%,0.06)', border: 'hsla(45,100%,50%,0.15)', title: 'Boost your match score', body: 'Your current match is below 60%. Add more quantifiable achievements and project outcomes to your resume.' });
  }
  if (skills.length < 5) {
    tips.push({ type: 'warning', icon: Target, color: '#3b82f6', bg: 'hsla(217,91%,60%,0.06)', border: 'hsla(217,91%,60%,0.15)', title: 'Expand your skill keywords', body: `Only ${skills.length} skills detected. Add specific tools, languages, and frameworks — recruiters scan for these first.` });
  }
  if (summary && summary.toLowerCase().includes('formatting')) {
    tips.push({ type: 'warning', icon: AlertTriangle, color: '#f59e0b', bg: 'hsla(45,100%,50%,0.06)', border: 'hsla(45,100%,50%,0.15)', title: 'Fix formatting issues', body: 'The AI flagged formatting inconsistencies. Use consistent date formats (e.g. Jan 2023 – Mar 2024) throughout.' });
  }
  if (score >= 70) {
    tips.push({ type: 'success', icon: Star, color: '#10b981', bg: 'hsla(150,80%,45%,0.06)', border: 'hsla(150,80%,45%,0.15)', title: 'Strong technical profile', body: 'Your score is in the top tier. Make sure your GitHub / portfolio links are active and prominently listed.' });
  }
  tips.push({ type: 'tip', icon: Lightbulb, color: '#a78bfa', bg: 'hsla(255,90%,75%,0.06)', border: 'hsla(255,90%,75%,0.15)', title: 'Add a concise summary section', body: 'Recruiters spend 6 seconds on a resume. A tight 2-sentence professional summary at the top significantly improves visibility.' });
  tips.push({ type: 'tip', icon: ArrowUpRight, color: '#3b82f6', bg: 'hsla(217,91%,60%,0.06)', border: 'hsla(217,91%,60%,0.15)', title: 'Quantify your impact', body: 'Replace vague phrases ("worked on", "helped with") with metrics: "Reduced build time by 40%", "Led a team of 5".' });

  return tips.slice(0, 4);
}

function generateTips(myProfile, recommendations = []) {
  const tips = [];
  
  // Find the highest recommended job or the one they applied to
  const bestJob = recommendations.sort((a, b) => b.matchPercent - a.matchPercent)[0];
  const breakdown = bestJob?.matchBreakdown;

  if (breakdown) {
    // 1. Skill Specific Tip
    if (breakdown.skills.score < 20) {
      tips.push({ 
        type: 'critical', icon: Target, color: '#f59e0b', bg: 'hsla(45,100%,50%,0.06)', border: 'hsla(45,100%,50%,0.15)',
        title: 'Technical Skill Gap', 
        body: `Your skill match is low for ${bestJob.id}. The system detected only partial alignment with required stack. Highlight core technologies mentioned in the JD.` 
      });
    }

    // 2. Experience Specific Tip
    if (breakdown.experience.score < 15) {
      tips.push({ 
        type: 'warning', icon: TrendingUp, color: '#3b82f6', bg: 'hsla(217,91%,60%,0.06)', border: 'hsla(217,91%,60%,0.15)',
        title: 'Seniority Alignment', 
        body: 'The AI flagged a potential experience mismatch. Use specific metrics (e.g. "managed 5 people", "30% faster") to demonstrate your level of seniority.' 
      });
    }

    // 3. Education Tip
    if (breakdown.education.score < 5) {
      tips.push({ 
        type: 'warning', icon: Star, color: '#a78bfa', bg: 'hsla(255,90%,75%,0.06)', border: 'hsla(255,90%,75%,0.15)',
        title: 'Degree Verification', 
        body: 'Your education score is low. Ensure your graduation status and degree type are explicitly mentioned in your resume header.' 
      });
    }
  }

  // Fallback to general AI tips if we don't have enough specific ones
  let analysis = myProfile?.detailedAnalysis;
  if (typeof analysis === 'string') {
    try { analysis = JSON.parse(analysis); } catch (e) { }
  }
  
  const aiTips = (analysis?.tips || []).map(t => {
    let icon = Lightbulb;
    let color = '#a78bfa'; let bg = 'hsla(255,90%,75%,0.06)'; let border = 'hsla(255,90%,75%,0.15)';
    if (t.type === 'critical') { icon = AlertTriangle; color = '#f59e0b'; bg = 'hsla(45,100%,50%,0.06)'; border = 'hsla(45,100%,50%,0.15)'; }
    else if (t.type === 'warning') { icon = Target; color = '#3b82f6'; bg = 'hsla(217,91%,60%,0.06)'; border = 'hsla(217,91%,60%,0.15)'; }
    else if (t.type === 'success') { icon = Star; color = '#10b981'; bg = 'hsla(150,80%,45%,0.06)'; border = 'hsla(150,80%,45%,0.15)'; }
    return { ...t, icon, color, bg, border };
  });

  const combinedTips = [...tips, ...aiTips];
  return combinedTips.length > 0 ? combinedTips.slice(0, 4) : generateTipsFallback(myProfile);
}

const CandidateHome = ({ user, myProfile, recommendations = [] }) => {
  const [tipExpanded, setTipExpanded] = useState(null);
  const displayScore = myProfile?.match || 0;
  const aiSummary = myProfile?.summary || "Analyzing your experience...";
  const aiReview = myProfile?.feedback || "Your AI evaluation and feedback will appear here shortly.";
  const tips = generateTips(myProfile, recommendations);

  return (
    <div className="fadeIn ch-container">
      {/* Top Row: Score + Summary */}
      <div className="ch-top-row">
        {/* Left Column: Match Status */}
        <div className="ch-left-column">
          <div className="glass-card ch-score-card">
            <div className="ch-score-glow" />
            <h3 className="ch-score-header">
              <Cpu size={22} color="var(--primary)" /> NEURAL MATCH SCORE
            </h3>
            <div className="ch-score-value-container">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="ch-score-value">
                {displayScore}<span className="ch-score-percentage">%</span>
              </motion.div>
              <p className="ch-score-subtitle">Unified Fit Index</p>
            </div>
            <div className="pro-progress-bg ch-main-progress">
              <motion.div initial={{ width: 0 }} animate={{ width: `${displayScore}%` }} className="pro-progress-fill" />
            </div>
            <div className="ch-score-details">
              <div className="ch-detail-item">
                <div className="ch-detail-label-row">
                  <span>TECHNICAL DEPTH</span><span>{Math.min(100, displayScore + 2)}%</span>
                </div>
                <div className="pro-progress-bg ch-detail-progress">
                  <div className="pro-progress-fill" style={{ width: `${Math.min(100, displayScore + 2)}%` }} />
                </div>
              </div>
              <div className="ch-detail-item">
                <div className="ch-detail-label-row">
                  <span>CULTURAL SYNC</span><span>{Math.min(100, displayScore + 5)}%</span>
                </div>
                <div className="pro-progress-bg ch-detail-progress">
                  <div className="pro-progress-fill ch-detail-progress-fill accent" style={{ width: `${Math.min(100, displayScore + 5)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights */}
        <div className="ch-insights-column">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card ch-insight-card">
            <h4 className="ch-insight-title"><Zap size={24} /> AI Cognitive Extract</h4>
            <p className="ch-insight-text">{aiSummary}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card ch-recruiter-card">
            <div className="ch-recruiter-header">
              <h4 className="ch-recruiter-title"><CheckCircle size={24} /> AI Recruiter Review</h4>
              <div className="ch-recruiter-badge">VERIFIED EVALUATION</div>
            </div>
            <p className="ch-recruiter-review">
              <Sparkles size={16} color="var(--success)" className="ch-recruiter-sparkle" />
              "{aiReview}"
            </p>
            <div className="ch-recruiter-footer">
              <div>
                <div className="ch-footer-stat-label">VERDICT</div>
                <div className="ch-footer-stat-value success-text">TOP 15% APPLICANT</div>
              </div>
              <div>
                <div className="ch-footer-stat-label">NEXT STEP</div>
                <div className="ch-footer-stat-value white-text">TECHNICAL INTERVIEW</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* AI Resume Recommendation Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="glass-card ch-coach-card">
          <div className="ch-coach-header">
            <div className="ch-coach-intro">
              <div className="ch-coach-icon"><Sparkles size={24} color="white" /></div>
              <div className="ch-coach-title-text">
                <h3>AI Resume Coach</h3>
                <p>Personalized improvement tips based on your profile analysis</p>
              </div>
            </div>
            <div className="ch-coach-badge">{tips.length} ACTIVE TIPS</div>
          </div>

          <div className="ch-tips-grid">
            {tips.map((tip, i) => {
              const Icon = tip.icon;
              const isOpen = tipExpanded === i;
              return (
                <motion.div
                  key={i}
                  onClick={() => setTipExpanded(isOpen ? null : i)}
                  whileHover={{ scale: 1.01 }}
                  className="ch-tip-item"
                  style={{ background: tip.bg, border: `1px solid ${tip.border}` }}
                >
                  <div className="ch-tip-content-wrapper">
                    <div className="ch-tip-icon-box" style={{ background: `${tip.color}22` }}>
                      <Icon size={20} color={tip.color} />
                    </div>
                    <div className="ch-tip-main">
                      <div className="ch-tip-header-row">
                        <strong className="ch-tip-title">{tip.title}</strong>
                        <ChevronRight size={16} color="var(--text-muted)" className={`ch-tip-chevron ${isOpen ? 'open' : ''}`} />
                      </div>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="ch-tip-body">
                            {tip.body}
                          </motion.p>
                        )}
                      </AnimatePresence>
                      {!isOpen && <p className="ch-tip-footer-hint">Click to expand</p>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="ch-coach-footer">
            <TrendingUp size={20} color="var(--primary)" />
            <p className="ch-coach-footer-text">
              Apply these improvements and re-upload to see your score jump. Each fix can add <strong>5–15 points</strong>.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Related Job News Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ marginTop: '1.5rem', height: '500px' }}>
        <JobNews 
          candidateId={myProfile?.id} 
          title="Personalized Market Insights" 
        />
      </motion.div>
    </div>
  );
};

export default CandidateHome;
