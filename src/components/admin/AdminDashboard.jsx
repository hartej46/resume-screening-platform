import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users,
  Zap,
  Cpu,
  BadgeCheck,
  ChevronRight,
  FileText,
  Info,
  Activity,
  Bot,
  User,
  ArrowRight,
  Sparkles,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TalentProfileModal from '../shared/TalentProfileModal';
import JobNews from '../shared/JobNews';
import './Admin.css';

const AdminDashboard = ({ candidates = [] }) => {
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [activeKpiId, setActiveKpiId] = useState(null);

    const totalIngestion = candidates.length;
    const avgMatchRate = totalIngestion > 0 
        ? Math.round(candidates.reduce((acc, c) => acc + (c.match || 0), 0) / totalIngestion)
        : 0;
    const pendingReviews = candidates.filter(c => c.status === 'Initial Screen' || c.status === 'In Review' || c.status === 'Top Pick').length;
    const shortlistedCount = candidates.filter(c => (c.match || 0) >= 85).length;

    const topCandidates = [...candidates]
        .sort((a, b) => (b.match || 0) - (a.match || 0))
        .slice(0, 5);

    const stats = [
        { id: 'ingestion', label: "Total Ingestion", value: totalIngestion || "0", trend: "+12.5%", sublabel: "Active Data Sync", icon: <Activity size={20} />, statusColor: "hsl(217, 91%, 60%)" },
        { id: 'match', label: "Average Talent Fit", value: `${avgMatchRate}%`, trend: "Optimal", sublabel: "Core AI Confidence", icon: <Cpu size={20} />, statusColor: "hsl(190, 90%, 50%)" },
        { id: 'pipelines', label: "Priority Queue", value: pendingReviews || "0", trend: "Active", sublabel: "Manual Intervention", icon: <Zap size={20} />, statusColor: "hsl(40, 95%, 55%)" }
    ];

    return (
        <div className="fadeIn admin-page-container">
            <div className="admin-kpi-grid">
                {stats.map((stat, i) => (
                    <motion.div 
                        key={stat.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onMouseEnter={() => setActiveKpiId(stat.id)}
                        onMouseLeave={() => setActiveKpiId(null)}
                        className={`glass-card kpi-card ${activeKpiId === stat.id ? 'kpi-active' : ''}`}
                        style={{ borderLeft: `4px solid ${stat.statusColor}` }}
                    >
                        <div className="kpi-icon-box" style={{ color: stat.statusColor }}>{stat.icon}</div>
                        <div className="kpi-trend" style={{ color: stat.statusColor }}>{stat.trend}</div>
                        <div>
                            <div className="kpi-value">{stat.value}</div>
                            <div className="kpi-label">{stat.label}</div>
                            <div className="kpi-sublabel-row">
                                <div className="kpi-dot-small" style={{ background: stat.statusColor }}></div>
                                {stat.sublabel}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="news-banner-section fadeIn" style={{ marginBottom: '1.5rem', height: '280px' }}>
                <JobNews title="Global Market Pulse" />
            </div>

            <div className="dashboard-main-layout">
                <div className="dashboard-left-panel">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <div className="admin-section-header-icon"><Sparkles size={22} /></div>
                            <div>
                                <h3 className="admin-title-main">Top Predicted Fits</h3>
                                <p className="admin-desc-muted">Candidates with highest neural compatibility scores.</p>
                            </div>
                        </div>
                        <button className="btn-action-pro btn-ghost">View Database →</button>
                    </div>

                    <div className="admin-card-list">
                        {topCandidates.length > 0 ? topCandidates.map((candidate, i) => {
                            const latestApp = candidate.applications?.[0];
                            const displayRole = latestApp?.job?.title || candidate.role || "Software Engineer applicant";
                            const displaySummary = latestApp?.resumeSummary || candidate.summary;
                            
                            return (
                                <motion.div 
                                    key={candidate.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + (i * 0.05) }}
                                    onClick={() => setSelectedCandidate(candidate)}
                                    className="glass-card admin-item-card"
                                    whileHover={{ scale: 1.005 }}
                                >
                                    <div className="admin-avatar-box"><User size={22} color="white" /></div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="card-title-white">{candidate.name}</h4>
                                        <p className="card-role-text">{displayRole}</p>
                                    </div>
                                    <div className="flex-2 hidden-mobile">
                                        <p className="card-summary-clamped">{displaySummary}</p>
                                    </div>
                                    <div className="match-score-indicator">
                                        <div className="match-val-pro">{latestApp?.matchScore || candidate.match}%</div>
                                        <div className="match-label-pro">{latestApp ? 'JOB FIT' : 'AI MATCH'}</div>
                                    </div>
                                    <div className="card-icon-button"><ChevronRight size={18} /></div>
                                </motion.div>
                            );
                        }) : (
                            <div className="infra-msg-shell">
                                <Users size={40} className="mb-2 opacity-50 mx-auto" />
                                <p className="admin-desc-muted">Waiting for Ingestion Data</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-right-panel">
                    <div className="glass-card diagnostic-container">
                        <h4 className="diagnostic-title">
                            <Activity size={18} color="var(--primary)" /> Engine Diagnostics
                        </h4>
                        <div className="flex-col gap-1">
                            <div className="flex-col gap-05">
                                <div className="prog-item-row">
                                    <span>POOL SHORTLISTED (85%+)</span>
                                    <span>{shortlistedCount}</span>
                                </div>
                                <div className="pro-progress-bg">
                                    <motion.div initial={{ width: 0 }} animate={{ width: totalIngestion ? `${(shortlistedCount / totalIngestion) * 100}%` : '0%' }} className="pro-progress-fill"></motion.div>
                                </div>
                            </div>
                            <div className="flex-col gap-05">
                                <div className="prog-item-row">
                                    <span>MODEL CONFIDENCE</span>
                                    <span>98.2%</span>
                                </div>
                                <div className="pro-progress-bg">
                                    <motion.div initial={{ width: 0 }} animate={{ width: '98.2%' }} className="pro-progress-fill" style={{ background: 'var(--secondary)' }}></motion.div>
                                </div>
                            </div>
                        </div>

                        <div className="live-badge-monitor">
                            <div className="monitor-status-tag">
                                <BadgeCheck size={14} /> LIVE AI MONITORING ACTIVE
                            </div>
                            <p className="admin-desc-muted text-xs">Extraction nodes processing. Latency: 48ms.</p>
                        </div>
                    </div>

                    <div className="glass-card tip-card-gradient flex-col gap-1">
                        <h4 className="diagnostic-title">
                            <Bot size={18} color="var(--primary)" /> Intelligence Tip
                        </h4>
                        <p className="card-role-text text-white">Match quality up by {Math.round(avgMatchRate/4)}% this week. Adjust technical weights.</p>
                        <button className="btn-action-pro btn-primary w-full mt-2">Optimize Matrix</button>
                    </div>
                </div>
            </div>

            <TalentProfileModal isOpen={!!selectedCandidate} onClose={() => setSelectedCandidate(null)} candidate={selectedCandidate} />
            <div className="infra-msg-shell" style={{ opacity: 0.2, marginTop: '2rem' }}><p className="infra-text text-xs font-black tracking-widest uppercase">RECRUITMENT INFRASTRUCTURE : STANDBY</p></div>
        </div>
    );
};

export default AdminDashboard;
