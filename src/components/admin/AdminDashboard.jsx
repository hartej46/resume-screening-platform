import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users,
  Settings,
  Zap,
  ShieldCheck,
  Cpu,
  Bot,
  User,
  ArrowUpRight,
  BadgeCheck,
  ChevronRight,
  FileText,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TalentProfileModal from '../shared/TalentProfileModal';

const AdminDashboard = ({ candidates = [] }) => {
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [activeKpiId, setActiveKpiId] = useState(null);

    // Dynamic stats calculation
    const totalIngestion = candidates.length;
    const avgMatchRate = totalIngestion > 0 
        ? (candidates.reduce((acc, c) => acc + (c.match || 0), 0) / totalIngestion).toFixed(1) 
        : 0;
    const pendingReviews = candidates.filter(c => c.status === 'Initial Screen' || c.status === 'In Review' || c.status === 'Top Pick').length;

    // Get top 6 candidates by match score
    const topCandidates = [...candidates]
        .sort((a, b) => (b.match || 0) - (a.match || 0))
        .slice(0, 6);

    const stats = [
        { 
            id: 'ingestion',
            label: "Total Ingestion", 
            value: totalIngestion, 
            sublabel: "Live DB sync", 
            description: "The cumulative count of unique candidate profiles successfully parsed and indexed by HireAI.",
            icon: <TrendingUp size={18} />, 
            color: "var(--primary)",
            gradient: "linear-gradient(135deg, hsla(217, 91%, 60%, 0.1) 0%, transparent 100%)"
        },
        { 
            id: 'match',
            label: "Avg Match Rate", 
            value: `${avgMatchRate}%`, 
            sublabel: "Model: HireAI-v4", 
            description: "The mean compatibility score across your talent pool, indicating global candidacy health.",
            icon: <Cpu size={18} />, 
            color: "var(--secondary)",
            gradient: "linear-gradient(135deg, hsla(190, 90%, 50%, 0.1) 0%, transparent 100%)"
        },
        { 
            id: 'pipelines',
            label: "Active Pipelines", 
            value: pendingReviews, 
            sublabel: "Prioritized", 
            description: "Candidates currently undergoing active review, interview phases, or final selection.",
            icon: <Zap size={18} />, 
            color: "var(--warning)",
            gradient: "linear-gradient(135deg, hsla(40, 95%, 55%, 0.1) 0%, transparent 100%)"
        }
    ];

    return (
        <div className="fadeIn">
            {/* KPI Section */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                {stats.map((stat, i) => (
                    <motion.div 
                        key={stat.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card stat-card"
                        onClick={() => setActiveKpiId(activeKpiId === stat.id ? null : stat.id)}
                        style={{ 
                            padding: '1.25rem 1.5rem', 
                            background: stat.gradient,
                            borderLeft: `3px solid ${stat.color}`,
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            minHeight: '130px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}
                    >
                        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '100px', height: '100px', background: stat.color, filter: 'blur(50px)', opacity: 0.1, zIndex: 0 }}></div>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <AnimatePresence mode="wait">
                                {activeKpiId === stat.id ? (
                                    <motion.div key="desc" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} style={{ color: 'var(--text-dim)', fontSize: '0.8rem', lineHeight: '1.4', fontWeight: '500' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: stat.color, marginBottom: '4px', fontWeight: '800' }}>
                                            <Info size={14} /> KPI INSIGHT
                                        </div>
                                        {stat.description}
                                    </motion.div>
                                ) : (
                                    <motion.div key="value" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontWeight: '800', fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
                                            <span style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1.5px' }}>{stat.value}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '5px', height: '5px', background: stat.color, borderRadius: '50%' }}></div><span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{stat.sublabel}</span></div>
                                        </div>
                                        <div style={{ color: stat.color, background: `${stat.color}15`, padding: '8px', borderRadius: '12px', border: `1px solid ${stat.color}30` }}>{stat.icon}</div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Top Talent Section */}
            <div style={{ marginTop: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', background: 'hsla(217, 91%, 60%, 0.1)', borderRadius: '10px', color: 'var(--primary)' }}><BadgeCheck size={20} /></div>
                        <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '800' }}>Recent High Matches</h3>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {topCandidates.map((candidate, i) => (
                        <motion.div 
                            key={candidate.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + (i * 0.05) }}
                            className="glass-card"
                            onClick={() => setSelectedCandidate(candidate)}
                            style={{ 
                                padding: '1.25rem 2rem', 
                                display: 'grid', 
                                gridTemplateColumns: 'auto 1fr 1.5fr 1fr auto',
                                alignItems: 'center',
                                gap: '2.5rem',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                        >
                            <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={20} color="white" />
                            </div>

                                    <div style={{ position: 'relative' }}>
                                        <h4 style={{ color: 'white', fontWeight: '800', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {candidate.name}
                                            {candidate.notes && candidate.notes.trim() !== "" && (
                                                <span className="pulse" style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%', boxShadow: '0 0 8px var(--primary)' }}></span>
                                            )}
                                        </h4>
                                        <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{candidate.role}</p>
                                    </div>

                            {/* Persistent Compact Summary on Card */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <FileText size={14} color="var(--primary)" style={{ marginTop: '3px', flexShrink: 0 }} />
                                <p style={{ 
                                    color: 'var(--text-dim)', 
                                    fontSize: '0.85rem', 
                                    fontWeight: '500', 
                                    lineHeight: '1.4',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    {candidate.summary}
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '0.9rem' }}>{candidate.match}% Match</span>
                                <div style={{ width: '100%', height: '4px', background: 'hsla(255, 255%, 255%, 0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ width: `${candidate.match}%`, height: '100%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary-glow)' }}></div>
                                </div>
                            </div>

                            <ChevronRight size={18} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Immersive Profile Modal */}
            <TalentProfileModal 
                isOpen={!!selectedCandidate}
                onClose={() => setSelectedCandidate(null)}
                candidate={selectedCandidate}
            />

            <div style={{ marginTop: '3.5rem', padding: '1.5rem', border: '1px dashed var(--card-border)', borderRadius: '24px', textAlign: 'center', opacity: 0.3 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600' }}>RECRUITMENT INFRASTRUCTURE : NOMINAL</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
