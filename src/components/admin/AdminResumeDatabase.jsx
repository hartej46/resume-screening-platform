import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Download, 
  Bot, 
  History, 
  Filter,
  ArrowUpRight,
  MessageSquare,
  User,
  Calendar,
  FileText,
  BadgeCheck,
  Save,
  StickyNote,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotesModal from '../shared/NotesModal';
import TalentProfileModal from '../shared/TalentProfileModal';

const AdminResumeDatabase = ({ candidates, onOpenChat, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [selectedCandidateForNotes, setSelectedCandidateForNotes] = useState(null);
  const [selectedCandidateForProfile, setSelectedCandidateForProfile] = useState(null);

  const filteredCandidates = (Array.isArray(candidates) ? candidates : []).filter(c => {
    const name = c?.name || "";
    const role = c?.role || "";
    const skills = Array.isArray(c?.skills) ? c.skills : [];
    
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           role.toLowerCase().includes(searchTerm.toLowerCase()) ||
           skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const handleSaveNotes = async (notes) => {
    if (!selectedCandidateForNotes) return;
    const id = selectedCandidateForNotes.id;
    setSavingId(id);
    try {
        const res = await fetch(`http://localhost:5001/api/candidates/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes })
        });
        if (res.ok) {
            if (onRefresh) onRefresh();
            setSelectedCandidateForNotes(null);
        }
    } catch (error) {
        console.error("Error saving notes:", error);
    } finally {
        setSavingId(null);
    }
  };

  const handleDownload = (e, candidate) => {
    e.stopPropagation();
    if (candidate.file) {
        window.open(candidate.file, '_blank');
    } else {
        alert("No resume file available for this record.");
    }
  };

  return (
    <div className="fadeIn">
      {/* Search Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', gap: '2rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '600px' }}>
          <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
          <input 
            type="text" 
            placeholder="Search by name, role, or skill..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              background: 'var(--card-bg)', 
              border: '1px solid var(--card-border)', 
              padding: '1.25rem 1.25rem 1.25rem 3.5rem', 
              borderRadius: '16px', 
              color: 'white',
              fontSize: '1rem',
              outline: 'none'
            }} 
          />
        </div>

        <button onClick={() => onOpenChat()} className="btn-action-pro btn-primary" style={{ padding: '1.25rem 2.5rem' }}>
            <Bot size={20} /> ASK HireAI Intelligence
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '10px', background: 'hsla(217, 91%, 60%, 0.1)', borderRadius: '12px', color: 'var(--primary)' }}><History size={20} /></div>
            <div>
                <h3 style={{ color: 'white', fontSize: '1.75rem', fontWeight: '800', marginBottom: '2px' }}>Candidate Repository</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Comprehensive AI talent database</p>
            </div>
            <span className="pill-capsule" style={{ marginLeft: '12px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                {filteredCandidates.length} Profiles
            </span>
        </div>
      </div>

      {/* Repository Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2.5rem' }}>
        <AnimatePresence mode="popLayout">
            {filteredCandidates.map(c => (
              <motion.div 
                layout
                key={c.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card"
                onClick={() => setSelectedCandidateForProfile(c)}
                style={{ 
                    padding: '1.75rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    position: 'relative'
                }}
              >
                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', background: 'hsla(217, 91%, 60%, 0.1)', padding: '6px 12px', borderRadius: '12px', border: '1px solid hsla(217, 91%, 60% , 0.2)' }}>
                    <BadgeCheck size={14} color="var(--primary)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--primary)' }}>{c.match}%</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={28} color="white" />
                    </div>
                    <div>
                        <h4 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '800', marginBottom: '2px' }}>{c.name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: '600' }}>
                            <ArrowUpRight size={14} /> {c.role}
                        </div>
                    </div>
                </div>

                {/* Always-visible punchy summary */}
                <div style={{ background: 'hsla(255, 255%, 255%, 0.02)', padding: '1rem', borderRadius: '14px', border: '1px solid var(--card-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.08em' }}>
                        <FileText size={14} /> AI SNAPSHOT
                    </div>
                    <p style={{ 
                        color: 'var(--text-dim)', 
                        fontSize: '0.9rem', 
                        lineHeight: '1.5',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {c.summary}
                    </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--card-border)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600' }}>{c.applied}</div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedCandidateForNotes(c); }} className="btn-action-pro btn-ghost" style={{ width: '38px', height: '38px', padding: 0, position: 'relative' }}>
                            <StickyNote size={18} />
                            {c.notes && c.notes.trim() !== "" && (
                                <span className="pulse" style={{ position: 'absolute', top: '7px', right: '7px', width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%' }}></span>
                            )}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onOpenChat(c); }} className="btn-action-pro btn-ghost" style={{ width: '38px', height: '38px', padding: 0 }}>
                            <MessageSquare size={18} />
                        </button>
                        <button onClick={(e) => handleDownload(e, c)} className="btn-action-pro btn-ghost" style={{ width: '38px', height: '38px', padding: 0 }}>
                            <Download size={18} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); }} className="btn-action-pro" style={{ width: '38px', height: '38px', padding: 0, background: 'hsla(0, 85%, 60%, 0.1)', color: 'var(--danger)', border: '1px solid hsla(0, 85%, 60%, 0.1)' }}><Trash2 size={18} /></button>
                    </div>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* Global Modals */}
      <NotesModal 
        isOpen={!!selectedCandidateForNotes}
        onClose={() => setSelectedCandidateForNotes(null)}
        onSave={handleSaveNotes}
        initialValue={selectedCandidateForNotes?.notes || ""}
        title={`Notes for ${selectedCandidateForNotes?.name}`}
        isSaving={savingId === selectedCandidateForNotes?.id}
      />

      <TalentProfileModal 
        isOpen={!!selectedCandidateForProfile}
        onClose={() => setSelectedCandidateForProfile(null)}
        candidate={selectedCandidateForProfile}
      />
    </div>
  );
};

export default AdminResumeDatabase;
