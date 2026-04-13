import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Sparkles, Filter, ChevronRight, CheckCircle2, Search, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CandidateJobBoard = ({ user, allJobs, recommendations = [] }) => {
  const [rankedJobs, setRankedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const departments = ['All', ...new Set(allJobs.map(j => j.department))];

  useEffect(() => {
    // Synchronize ranked jobs whenever recommendations or allJobs changes
    const merged = allJobs.map(job => {
      const ranking = recommendations.find(r => r.id === job.id);
      return {
        ...job,
        matchPercent: ranking?.matchPercent || 0,
        reason: ranking?.reason || 'AI analysis pending profile update.'
      };
    }).sort((a, b) => b.matchPercent - a.matchPercent);

    setRankedJobs(merged);
    if (recommendations.length > 0 || allJobs.length > 0) {
      setLoading(false);
    }
  }, [recommendations, allJobs]);

  const filteredJobs = rankedJobs.filter(job => {
    const matchesFilter = filter === 'All' || job.department === filter;
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="fadeIn">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>AI-Ranked Career Openings</h2>
          <p style={{ color: '#94a3b8' }}>Discover roles tailored to your unique background and skills.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search roles..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 12px 10px 40px', color: 'white', width: '250px', outline: 'none' }}
            />
          </div>
          
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 16px', color: 'white', outline: 'none', cursor: 'pointer' }}
          >
            {departments.map(d => <option key={d} value={d} style={{ background: '#0f172a' }}>{d}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '5rem', textAlign: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} style={{ display: 'inline-block' }}>
            <Sparkles size={48} color="#3b82f6" />
          </motion.div>
          <h3 style={{ color: 'white', marginTop: '1.5rem', fontWeight: '600' }}>AI is ranking opportunities for you...</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <AnimatePresence>
            {filteredJobs.map((job, index) => (
              <motion.div 
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card job-card-hover"
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 300px', 
                  gap: '2rem', 
                  padding: '2rem',
                  border: job.matchPercent > 80 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                  background: job.matchPercent > 80 ? 'linear-gradient(145deg, rgba(16, 185, 129, 0.03) 0%, rgba(255,255,255,0.01) 100%)' : 'rgba(255,255,255,0.01)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                    <h3 style={{ color: 'white', fontSize: '1.4rem', fontWeight: '800' }}>{job.title}</h3>
                    {job.matchPercent > 85 && (
                      <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '900', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Zap size={12} fill="#10b981" /> HIGH ALIGNMENT
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1.5rem', color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={16} /> {job.department}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> {job.location}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={16} /> {job.salary}</span>
                  </div>

                  <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                    {job.description}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {job.skills.map(skill => (
                      <span key={skill} style={{ background: 'rgba(255,255,255,0.04)', color: '#94a3b8', padding: '4px 12px', borderRadius: '8px', fontSize: '0.8rem' }}>{skill}</span>
                    ))}
                  </div>
                </div>

                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '3.5rem', fontWeight: '900', color: 'white', letterSpacing: '-2px', marginBottom: '0.2rem' }}>
                      {job.matchPercent}<span style={{ color: '#3b82f6', fontSize: '2rem' }}>%</span>
                    </div>
                    <p style={{ color: '#3b82f6', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase' }}>AI Analysis Score</p>
                  </div>

                  <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.1)', marginBottom: '2rem', fontStyle: 'italic', fontSize: '0.85rem', color: '#cbd5e1', position: 'relative' }}>
                    <Sparkles size={14} color="#3b82f6" style={{ position: 'absolute', right: '10px', top: '10px' }} />
                    "{job.reason}"
                  </div>

                  <button className="btn-action-pro" style={{ width: '100%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    Quick Apply <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default CandidateJobBoard;
