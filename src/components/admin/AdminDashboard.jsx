import React from 'react';
import { 
  TrendingUp, 
  Users,
  Settings,
  BarChart2,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminDashboard = ({ candidates }) => {
    const totalIngestion = candidates.length;
    const avgMatchRate = totalIngestion > 0 
        ? (candidates.reduce((acc, c) => acc + (c.match || 0), 0) / totalIngestion).toFixed(1) 
        : 0;
    const pendingReviews = candidates.filter(c => c.status === 'Initial Screen' || c.status === 'In Review').length;
    const topCandidates = candidates.filter(c => c.match >= 85).length;

    const stats = [
      {
        label: 'Total Candidates',
        value: totalIngestion,
        sub: 'Live DB sync',
        subColor: '#10b981',
        icon: <Users size={18} />,
        iconBg: 'rgba(59,130,246,0.1)',
        iconColor: '#3b82f6'
      },
      {
        label: 'Avg Match Rate',
        value: `${avgMatchRate}%`,
        sub: 'Model: HireAI-v4',
        subColor: '#6b7280',
        icon: <BarChart2 size={18} />,
        iconBg: 'rgba(139,92,246,0.1)',
        iconColor: '#8b5cf6'
      },
      {
        label: 'Pending Reviews',
        value: pendingReviews,
        sub: 'Prioritized',
        subColor: '#f59e0b',
        icon: <Activity size={18} />,
        iconBg: 'rgba(245,158,11,0.1)',
        iconColor: '#f59e0b'
      },
      {
        label: 'Top Matches (≥85%)',
        value: topCandidates,
        sub: 'High priority pool',
        subColor: '#10b981',
        icon: <TrendingUp size={18} />,
        iconBg: 'rgba(16,185,129,0.1)',
        iconColor: '#10b981'
      }
    ];

    return (
        <div className="fadeIn">
            <div className="dashboard-grid">
                {stats.map((s, i) => (
                    <motion.div
                        key={s.label}
                        className="card stat-card"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07, duration: 0.35 }}
                        style={{ cursor: 'default' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="stat-label">{s.label}</span>
                            <div style={{ background: s.iconBg, color: s.iconColor, padding: '8px', borderRadius: '10px' }}>
                                {s.icon}
                            </div>
                        </div>
                        <div className="stat-value" style={{ marginTop: '0.5rem' }}>{s.value}</div>
                        <span style={{ fontSize: '0.75rem', color: s.subColor, fontWeight: '700' }}>{s.sub}</span>
                    </motion.div>
                ))}
            </div>

            {/* Recent Activity */}
            {candidates.length > 0 && (
                <div className="card" style={{ marginTop: '2rem', padding: '2rem' }}>
                    <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>
                        Recent Candidate Submissions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {candidates.slice(0, 5).map((c, i) => (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + i * 0.05 }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '0.9rem', fontFamily: 'Outfit, sans-serif' }}>
                                        {c.name[0]}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{c.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.role}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '800', color: c.match >= 85 ? '#10b981' : c.match >= 70 ? '#3b82f6' : '#f59e0b', fontSize: '1rem' }}>{c.match}%</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>match</div>
                                    </div>
                                    <span className={c.match >= 85 ? 'badge-success' : c.match >= 70 ? 'badge-blue' : 'badge-warn'}>
                                        {c.match >= 85 ? 'Top Match' : c.match >= 70 ? 'Good Fit' : 'Review'}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
