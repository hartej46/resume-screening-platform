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
  StickyNote,
  Save,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminResumeDatabase = ({ candidates = [], onOpenChat, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingNotes, setEditingNotes] = useState({}); // { candidateId: text }
  const [expandedNotes, setExpandedNotes] = useState({}); // { candidateId: boolean }
  const [isSaving, setIsSaving] = useState(null); // candidateId

  const filteredCandidates = candidates.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.role && c.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.skills && c.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleSaveNotes = async (id) => {
    const noteContent = editingNotes[id] !== undefined ? editingNotes[id] : (candidates.find(c => c.id === id)?.notes || "");
    
    setIsSaving(id);
    try {
        const response = await fetch(`http://localhost:5001/api/candidates/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes: noteContent })
        });
        if (response.ok) {
            // Success - update parent if possible
            if (onRefresh) onRefresh();
            setIsSaving(null);
        }
    } catch (err) {
        console.error("Save failed:", err);
        setIsSaving(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this candidate?")) return;
    try {
        const response = await fetch(`http://localhost:5001/api/candidates/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            // Ideally trigger onRefresh here, but for now we rely on the parent's refresh or state sync
            window.location.reload(); 
        }
    } catch (err) {
        console.error("Delete failed:", err);
    }
  };

  return (
    <div className="fadeIn">
      {/* Search + AI CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', gap: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '560px' }}>
          <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={18} />
          <input
            type="text"
            placeholder="Search by name, role, or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: 'white',
              border: '1px solid #e5e7eb',
              padding: '0.85rem 1rem 0.85rem 2.75rem',
              borderRadius: '14px',
              color: '#111827',
              fontSize: '0.9rem',
              outline: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
          />
        </div>

        <button
          onClick={() => onOpenChat()}
          className="btn-primary"
          style={{ padding: '0.85rem 1.75rem', whiteSpace: 'nowrap' }}
        >
          <Bot size={18} /> ASK HireAI Intelligence
        </button>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', background: 'rgba(59,130,246,0.1)', borderRadius: '10px' }}>
            <History size={18} color="#3b82f6" />
          </div>
          <div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.3rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>Candidate Repository</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>AI-Summarized talent pool index</p>
          </div>
          <span style={{ marginLeft: '8px', padding: '4px 12px', background: '#f3f4f6', borderRadius: '8px', fontSize: '0.72rem', color: '#6b7280', fontWeight: '700', border: '1px solid #e5e7eb' }}>
            {filteredCandidates.length} Candidates
          </span>
        </div>
        <button className="btn-action-pro" style={{ background: 'white', color: '#6b7280', border: '1px solid #e5e7eb' }}>
          <Filter size={16} /> Filters
        </button>
      </div>

      {/* Card Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
        <AnimatePresence>
          {filteredCandidates.map((c, i) => (
            <motion.div
              layout
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="card"
              style={{
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Score Badge */}
              <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', display: 'flex', alignItems: 'center', gap: '5px', background: c.match >= 85 ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', padding: '5px 11px', borderRadius: '10px', border: `1px solid ${c.match >= 85 ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}` }}>
                <BadgeCheck size={13} color={c.match >= 85 ? '#10b981' : '#3b82f6'} />
                <span style={{ fontSize: '0.82rem', fontWeight: '900', color: c.match >= 85 ? '#10b981' : '#3b82f6' }}>{c.match}%</span>
              </div>

              {/* Profile Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '1.1rem', fontFamily: 'Outfit, sans-serif', flexShrink: 0 }}>
                  {c.name[0]}
                </div>
                <div>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: '800', marginBottom: '3px', fontFamily: 'Outfit, sans-serif' }}>{c.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6b7280', fontSize: '0.78rem' }}>
                    <ArrowUpRight size={13} /> {c.role}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div style={{ background: '#f9fafb', padding: '0.875rem', borderRadius: '10px', border: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontSize: '0.67rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.06em' }}>
                  <FileText size={11} /> AI Abstract
                </div>
                <p style={{ color: '#374151', fontSize: '0.85rem', lineHeight: '1.6' }}>{c.summary}</p>
              </div>

              {/* Skills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {c.skills.map(skill => (
                  <span key={skill} style={{ padding: '4px 10px', background: '#eff6ff', color: '#3b82f6', borderRadius: '7px', fontSize: '0.72rem', fontWeight: '600', border: '1px solid #dbeafe' }}>
                    {skill}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#9ca3af', fontSize: '0.72rem' }}>
                  <Calendar size={12} /> Processed {c.applied}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onOpenChat(c)}
                    title="Chat with AI"
                    style={{ background: '#eff6ff', color: '#3b82f6', border: '1px solid #dbeafe', width: '36px', height: '36px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <MessageSquare size={16} />
                  </button>
                  <button
                    title="Download Resume"
                    style={{ background: '#f9fafb', color: '#6b7280', border: '1px solid #e5e7eb', width: '36px', height: '36px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Download size={16} />
                  </button>
                  <button
                    title="Remove Record"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.18)', width: '36px', height: '36px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredCandidates.length === 0 && (
        <div style={{ padding: '6rem 4rem', textAlign: 'center', color: '#9ca3af', background: 'white', borderRadius: '20px', border: '2px dashed #e5e7eb', marginTop: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ marginBottom: '1rem' }}>
            <Search size={44} style={{ opacity: 0.3, color: '#6b7280' }} />
          </div>
          <h4 style={{ color: '#374151', fontSize: '1.15rem', marginBottom: '0.5rem', fontWeight: '700' }}>No talent matches found</h4>
          <p style={{ fontSize: '0.9rem' }}>Try adjusting your search terms or filters to find candidates.</p>
        </div>
      )}
    </div>
  );
};

export default AdminResumeDatabase;
