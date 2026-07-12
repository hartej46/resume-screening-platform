import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  User, Mail, Calendar, Code2, Briefcase,
  FileText, CheckCircle, Copy, Plus,
  BadgeCheck, TrendingUp, Zap, Sparkles, Edit2, MapPin, Target,
  Trash2, Loader2, Cpu, AlertCircle,
  FilePlus, Archive, X, Check
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import './candidate.css';

import { API_BASE_URL } from '../../apiConfig';

const MAX_RESUMES = 4;
const API_BASE = `${API_BASE_URL}/api`;

/* ── Avatar ── */
const Avatar = ({ user, size = 96 }) => {
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  return user?.imageUrl ? (
    <img src={user.imageUrl} alt={user.fullName}
      className="cp-avatar-img"
      style={{ width: size, height: size }} />
  ) : (
    <div className="cp-avatar-placeholder"
      style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
};

/* ── Stat Card ── */
const StatCard = ({ icon, label, value, color = 'var(--primary)' }) => (
  <div className="cp-stat-card">
    <div className="cp-stat-icon-box" style={{ background: `${color}18` }}>
      {React.cloneElement(icon, { size: 22, color })}
    </div>
    <div>
      <div className="cp-stat-label">{label}</div>
      <div className="cp-stat-value">{value}</div>
    </div>
  </div>
);

/* ── Skill Pill ── */
const SkillPill = ({ label, onRemove }) => (
  <motion.span 
    whileHover={{ scale: 1.05, backgroundColor: 'hsla(217, 91%, 60%, 0.15)' }}
    whileTap={{ scale: 0.95 }}
    className="cp-skill-pill"
    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
  >
    {label}
    {onRemove && (
      <button onClick={(e) => { e.stopPropagation(); onRemove(label); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
        <X size={12} />
      </button>
    )}
  </motion.span>
);

/* ── Score Ring ── */
const ScoreRing = ({ score }) => {
  const r = 28, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div className="cp-score-ring-wrapper">
      <svg width={72} height={72} className="cp-score-ring">
        <circle cx={36} cy={36} r={r} fill="none" stroke="hsla(255,100%,100%,0.05)" strokeWidth={6} />
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease', transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
      </svg>
      <div className="cp-ring-text-overlay">{score}%</div>
    </div>
  );
};

/* ═══════════════════════════════════════════ */
const CandidateProfile = ({ user, myProfile, onRefresh, setActiveTab }) => {
  const [copied, setCopied] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [uploadState, setUploadState] = useState('idle');
  const [uploadMsg, setUploadMsg] = useState('');
  const fileInputRef = useRef(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress ?? '—';
  const fullName = user?.fullName ?? (`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Candidate');
  const joinedAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';
  const score = myProfile?.match ?? 0;
  
  // Interactive Custom Skills
  const [customSkills, setCustomSkills] = useState(() => {
    const saved = localStorage.getItem('cp_customSkills');
    return saved ? JSON.parse(saved) : [];
  });
  
  useEffect(() => {
    localStorage.setItem('cp_customSkills', JSON.stringify(customSkills));
  }, [customSkills]);
  const [newSkill, setNewSkill] = useState('');
  const baseSkillsFromProfile = myProfile?.skills ?? [];
  const baseSkillsFromResumes = resumes.flatMap(r => r.skills || []);
  const baseSkills = [...new Set([...baseSkillsFromProfile, ...baseSkillsFromResumes])];
  const allSkills = [...new Set([...baseSkills, ...customSkills])];

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !allSkills.includes(newSkill.trim())) {
      setCustomSkills([...customSkills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setCustomSkills(customSkills.filter(s => s !== skill));
  };

  // Bio Generator
  const [bio, setBio] = useState('');
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);

  useEffect(() => {
    if (myProfile?.bio) setBio(myProfile.bio);
  }, [myProfile]);

  const generateBio = async () => {
    if (!email || email === '—') return;
    setIsEditingBio(false);
    setIsGeneratingBio(true);
    
    try {
      const res = await fetch(`${API_BASE}/candidates/${email}/generate-bio`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      
      // Typing effect for the new bio
      setBio('');
      let i = 0;
      const interval = setInterval(() => {
        setBio(data.bio.slice(0, i));
        i++;
        if (i > data.bio.length) {
          clearInterval(interval);
          setIsGeneratingBio(false);
          if (onRefresh) onRefresh();
        }
      }, 20);
    } catch (err) {
      console.error(err);
      setIsGeneratingBio(false);
      // Fallback to local template if API fails
      const topSkills = allSkills.length > 0 ? allSkills.slice(0, 3).join(', ') : 'modern technologies';
      setBio(`High-impact professional specializing in ${topSkills}. Committed to solving complex technical challenges and delivering scalable enterprise solutions.`);
    }
  };

  const saveBio = async () => {
    setIsEditingBio(false);
    try {
      await fetch(`${API_BASE}/candidates/${email}/bio`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio })
      });
      if (onRefresh) onRefresh();
    } catch (err) { console.error("Failed to save bio:", err); }
  };

  // Interactive Career Preferences
  const [isEditingPrefs, setIsEditingPrefs] = useState(false);
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem('cp_prefs');
    return saved ? JSON.parse(saved) : {
      role: 'Software Engineer',
      location: 'Remote / US',
      availability: '2 Weeks Notice'
    };
  });

  useEffect(() => {
    localStorage.setItem('cp_prefs', JSON.stringify(prefs));
  }, [prefs]);

  const handlePrefChange = (field, value) => {
    setPrefs(prev => ({ ...prev, [field]: value }));
  };

  // 3D Tilt Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const rotateX = useTransform(y, [-150, 150], [8, -8]);
  const rotateY = useTransform(x, [-300, 300], [-8, 8]);

  const fetchResumes = async () => {
    if (!email || email === '—') return;
    try {
      const res = await fetch(`${API_BASE}/candidates/${email}/resumes`);
      if (res.ok) setResumes(await res.json());
    } catch (err) { console.error("Failed to fetch resumes:", err); }
  };

  useEffect(() => { fetchResumes(); }, [email]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    if (file.type !== 'application/pdf') {
      setUploadMsg('Only PDF files are supported.');
      setUploadState('error');
      setTimeout(() => setUploadState('idle'), 3000);
      return;
    }
    if (resumes.length >= MAX_RESUMES) {
      setUploadMsg(`You can store up to ${MAX_RESUMES} resumes. Delete one first.`);
      setUploadState('error');
      setTimeout(() => setUploadState('idle'), 3000);
      return;
    }
    setUploadState('uploading');
    setUploadMsg('');
    const formData = new FormData();
    formData.append('resumePdf', file);
    formData.append('email', email);
    formData.append('name', fullName || 'Candidate');
    formData.append('role', 'Software Engineer Applicant');
    formData.append('resumeTitle', file.name);
    try {
      const res = await fetch(`${API_BASE}/candidates`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      await res.json();
      await fetchResumes();
      if (onRefresh) onRefresh();
      setUploadState('idle');
    } catch (err) {
      console.error(err);
      setUploadMsg('Upload failed. Please try again.');
      setUploadState('error');
      setTimeout(() => setUploadState('idle'), 4000);
    }
  };

  const deleteResume = async (id) => {
    try {
      await fetch(`${API_BASE}/resumes/${id}`, { method: 'DELETE' });
      await fetchResumes();
    } catch (err) { console.error("Failed to delete resume:", err); }
  };

  const setActive = async (id) => {
    try {
      await fetch(`${API_BASE}/resumes/${id}/active`, { method: 'PUT' });
      await fetchResumes();
    } catch (err) { console.error("Failed to set active resume:", err); }
  };

  const activeResume = resumes.find(r => r.active);

  const copyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fadeIn cp-container">

      {/* ── Hero Banner ── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        style={{ rotateX, rotateY, transformPerspective: 1000, transformStyle: 'preserve-3d' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="glass-card cp-hero-banner"
      >
        <div className="cp-hero-glow" />
        <div className="cp-hero-content" style={{ transform: 'translateZ(30px)' }}>
          <motion.div style={{ transform: 'translateZ(40px)' }}>
            <Avatar user={user} size={100} />
          </motion.div>
          <div className="cp-hero-info">
            <div className="cp-hero-name-row">
              <h2 className="cp-hero-name">{fullName}</h2>
              <BadgeCheck size={22} color="var(--primary)" />
            </div>
            <div className="cp-hero-email-row">
              <Mail size={15} /><span>{email}</span>
              <button onClick={copyEmail} title="Copy email"
                className={`cp-copy-btn ${copied ? 'copied' : ''}`}>
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <div className="cp-hero-joined-row" style={{ marginBottom: bio || isGeneratingBio || isEditingBio ? '16px' : '0' }}>
              <Calendar size={13} /><span>Member since {joinedAt}</span>
            </div>
            
            {!bio && !isGeneratingBio && !isEditingBio ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateBio}
                  className="btn-action-pro btn-ghost"
                  style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                >
                  <Zap size={14} color="var(--warning)" /> Auto-Generate AI Bio
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsEditingBio(true)}
                  className="btn-action-pro btn-ghost"
                  style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                >
                  <Edit2 size={14} color="var(--primary)" /> Write Manually
                </motion.button>
              </div>
            ) : isEditingBio ? (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '16px', maxWidth: '480px' }}>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write your professional bio here..."
                  style={{ width: '100%', minHeight: '80px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--primary)', color: 'white', padding: '10px', borderRadius: '10px', fontSize: '0.9rem', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button onClick={saveBio} className="btn-action-pro btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}><Check size={12} /> Save Bio</button>
                  <button onClick={generateBio} className="btn-action-pro btn-ghost" style={{ padding: '6px 12px', fontSize: '0.75rem' }}><Zap size={12} color="var(--warning)" /> Regenerate with AI</button>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '16px', padding: '14px', background: 'hsla(0,0%,0%,0.25)', borderRadius: '14px', border: '1px solid var(--card-border)', fontSize: '0.92rem', color: 'var(--text-dim)', lineHeight: '1.6', position: 'relative', maxWidth: '480px' }}>
                 {isGeneratingBio && <Sparkles size={16} color="var(--warning)" style={{ position: 'absolute', top: '-8px', right: '-8px', filter: 'drop-shadow(0 0 8px var(--warning))' }} className="spin" />}
                 
                 {!isGeneratingBio && (
                   <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
                     <button onClick={() => setIsEditingBio(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }} title="Edit Bio"><Edit2 size={12} /></button>
                     <button onClick={generateBio} style={{ background: 'none', border: 'none', color: 'var(--warning)', cursor: 'pointer', padding: '4px' }} title="Regenerate Bio"><Zap size={12} /></button>
                   </div>
                 )}
                 <span style={{ fontStyle: 'italic', paddingRight: !isGeneratingBio ? '40px' : '0', display: 'block' }}>"{bio}{isGeneratingBio ? '|' : ''}"</span>
              </motion.div>
            )}
          </div>

        </div>
      </motion.div>


      {/* ── Main Grid ── */}
      <div className="cp-main-grid">

        {/* Left Column */}
        <div className="cp-column">

          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="glass-card">
            <h4 className="cp-section-title">
              <Code2 size={18} color="var(--accent)" /> Detected Skills
            </h4>
            {allSkills.length > 0 ? (
              <div className="cp-skills-container">
                <AnimatePresence>
                  {allSkills.map((s, i) => (
                    <motion.div key={s} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                      <SkillPill label={s} onRemove={customSkills.includes(s) ? handleRemoveSkill : undefined} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <p className="cp-skills-empty">
                No skills extracted yet. Upload a resume below to get AI-powered skill detection.
              </p>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="glass-card" style={{ borderTop: '3px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h4 className="cp-section-title" style={{ marginBottom: 0 }}>
                <Target size={18} color="#10b981" /> Career Preferences
              </h4>
              <button 
                onClick={() => setIsEditingPrefs(true)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}
              >
                <Edit2 size={14} /> Edit
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <motion.div whileHover={{ scale: 1.02, backgroundColor: 'hsla(0,0%,100%,0.05)' }} onClick={() => setIsEditingPrefs(true)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                <Briefcase size={16} color="var(--text-muted)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Target Role</div>
                  <div style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '500', marginTop: '2px' }}>{prefs.role}</div>
                </div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02, backgroundColor: 'hsla(0,0%,100%,0.05)' }} onClick={() => setIsEditingPrefs(true)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                <MapPin size={16} color="var(--text-muted)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Preferred Location</div>
                  <div style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '500', marginTop: '2px' }}>{prefs.location}</div>
                </div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02, backgroundColor: 'hsla(0,0%,100%,0.05)' }} onClick={() => setIsEditingPrefs(true)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }}>
                <Calendar size={16} color="var(--text-muted)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Availability</div>
                  <div style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: '500', marginTop: '2px' }}>{prefs.availability}</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="cp-column">
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="glass-card cp-vault-card">

            <div className="cp-vault-header">
              <div className="cp-vault-header-left">
                <div className="cp-vault-icon-wrapper">
                  <Archive size={22} color="var(--accent)" />
                </div>
                <div>
                  <h3 className="cp-vault-title">Resume Vault</h3>
                  <p className="cp-vault-subtitle">{resumes.length} of {MAX_RESUMES} slots used</p>
                </div>
              </div>
              <input 
                type="file" 
                accept="application/pdf" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileChange} 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={resumes.length >= MAX_RESUMES}
                className={`cp-btn-add-resume ${resumes.length >= MAX_RESUMES ? 'disabled' : 'enabled'}`}>
                <Plus size={15} /> Add Resume
              </button>
            </div>

            <AnimatePresence>
              {uploadState === 'error' && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="cp-error-banner">
                  <AlertCircle size={16} /> {uploadMsg}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {uploadState === 'uploading' && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="cp-upload-progress">
                  <Cpu size={18} color="var(--primary)" />
                  <div className="cp-upload-progress-info">
                    <div className="cp-progress-title">AI is analyzing your resume…</div>
                    <div className="cp-progress-subtitle">Parsing skills, experience, and fit score</div>
                  </div>
                  <Loader2 size={18} color="var(--primary)" className="cp-spin" />
                </motion.div>
              )}
            </AnimatePresence>

            {resumes.length === 0 ? (
              <div className="cp-vault-empty">
                <FilePlus size={36} color="hsla(260,80%,70%,0.4)" className="cp-vault-empty-icon" />
                <p className="cp-vault-empty-text">
                  No resumes yet.<br />
                  Click <strong className="cp-primary-text">Add Resume</strong> to upload your first PDF (max {MAX_RESUMES}).
                </p>
              </div>
            ) : (
              <div className="cp-resume-list">
                {resumes.map((r, idx) => (
                  <AnimatePresence key={r.id}>
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => !r.active && setActive(r.id)}
                      transition={{ delay: idx * 0.04 }}
                      style={{ cursor: r.active ? 'default' : 'pointer' }}
                      className={`cp-resume-item ${r.active ? 'active' : 'inactive'}`}>
                      <ScoreRing score={r.score} />
                      <div className="cp-resume-meta">
                        <div className="cp-resume-name-row">
                          <div className="cp-resume-name">{r.name}</div>
                          {r.active && <span className="cp-active-badge">ACTIVE</span>}
                        </div>
                        <div className="cp-resume-info-text">
                          Uploaded {r.date} · AI Score: <span className="cp-resume-score-highlight">{r.score}%</span>
                        </div>
                      </div>
                      <div className="cp-resume-actions">
                        {!r.active && (
                          <button onClick={(e) => { e.stopPropagation(); setActive(r.id); }} title="Set as active" className="cp-btn-set-active">
                            <CheckCircle size={12} /> Set Active
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); deleteResume(r.id); }} title="Delete resume" className="cp-btn-delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                ))}
                {resumes.length < MAX_RESUMES && (
                  <div className="cp-slots-indicator">
                    {Array.from({ length: MAX_RESUMES }).map((_, i) => (
                      <div key={i} className={`cp-slot-dot ${i < resumes.length ? 'filled' : ''}`} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeResume?.summary && (
              <motion.div 
                layout
                onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                className="cp-active-summary-box"
                style={{ cursor: 'pointer' }}
              >
                <div className="cp-summary-header">
                  <Zap size={12} /> ACTIVE RESUME · AI SUMMARY
                </div>
                <motion.p layout className="cp-summary-text">
                  {isSummaryExpanded ? activeResume.summary : `${activeResume.summary.slice(0, 280)}${activeResume.summary.length > 280 ? '… (Click to expand)' : ''}`}
                </motion.p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
      {/* ── Edit Preferences Modal ── */}
      <AnimatePresence>
        {isEditingPrefs && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="glass-card" style={{ width: '400px', border: '1px solid var(--primary)', background: 'var(--card-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><Target size={20} color="var(--primary)" /> Edit Preferences</h3>
                <button onClick={() => setIsEditingPrefs(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Target Role</label>
                  <input type="text" value={prefs.role} onChange={e => handlePrefChange('role', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Preferred Location</label>
                  <input type="text" value={prefs.location} onChange={e => handlePrefChange('location', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Availability</label>
                  <input type="text" value={prefs.availability} onChange={e => handlePrefChange('availability', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '0.95rem' }} />
                </div>
              </div>
              
              <button onClick={() => setIsEditingPrefs(false)} className="btn-action-pro btn-primary" style={{ width: '100%', padding: '10px', fontSize: '0.95rem', justifyContent: 'center' }}><Check size={16} /> Save Preferences</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CandidateProfile;
