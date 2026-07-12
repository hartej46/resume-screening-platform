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
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotesModal from '../shared/NotesModal';
import TalentProfileModal from '../shared/TalentProfileModal';
import { API_BASE_URL } from '../../apiConfig';
import './Admin.css';

const AdminResumeDatabase = ({ candidates, onOpenChat, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [matchFilter, setMatchFilter] = useState(0); 
  const [viewMode, setViewMode] = useState('grid'); 
  const [savingId, setSavingId] = useState(null);
  const [selectedCandidateForNotes, setSelectedCandidateForNotes] = useState(null);
  const [selectedCandidateForProfile, setSelectedCandidateForProfile] = useState(null);

  const filteredCandidates = (Array.isArray(candidates) ? candidates : []).filter(c => {
    const name = c?.name || "";
    const role = c?.role || "";
    const skills = Array.isArray(c?.skills) ? c.skills : [];
    const match = c?.match || 0;
    
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMatch = match >= matchFilter;
    
    return matchesSearch && matchesMatch;
  });

  const handleSaveNotes = async (notes) => {
    if (!selectedCandidateForNotes) return;
    const id = selectedCandidateForNotes.id;
    setSavingId(id);
    try {
        const res = await fetch(`${API_BASE_URL}/api/candidates/${id}`, {
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

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this candidate profile?")) return;
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/candidates/${id}`, { method: 'DELETE' });
        if (res.ok) {
            if (onRefresh) onRefresh();
        }
    } catch (error) {
        console.error("Error deleting candidate:", error);
    }
  };

  return (
    <div className="fadeIn admin-page-container">
      
      <div className="flex justify-between items-center bg-white-02 p-4 rounded-2xl border border-white-05">
        <div className="admin-search-wrapper max-w-xl">
          <Search className="search-icon-abs" size={18} />
          <input 
            type="text" 
            placeholder="Index search: Name, role, or technical keywords..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-search-field"
          />
        </div>

        <button onClick={() => onOpenChat()} className="btn-action-pro btn-primary h-12 px-8 rounded-xl">
            <Bot size={18} /> ASK HireAI
        </button>
      </div>

      <div className="filter-bar-shell flex justify-between items-center">
        <div className="flex items-center gap-1">
            <div className="flex items-center gap-1.5">
                <SlidersHorizontal size={14} color="var(--primary)" />
                <span className="text-muted-700 text-xs font-black uppercase tracking-widest">Filters</span>
            </div>
            <div className="v-line" style={{ height: '20px', margin: '0 1.5rem' }}></div>
            <div className="flex gap-05 items-center">
                <span className="text-muted-700 text-xs font-bold uppercase mr-2">Min Fit:</span>
                {[0, 70, 85, 95].map(m => (
                    <button 
                        key={m} 
                        onClick={() => setMatchFilter(m)}
                        className={`pill-btn-pro ${matchFilter === m ? 'active' : ''}`}
                    >
                        {m === 0 ? 'Any' : `${m}%+`}
                    </button>
                ))}
            </div>
            <div className="v-line" style={{ height: '20px', margin: '0 1.5rem' }}></div>
            <div className="admin-desc-muted text-sm font-bold">
                <span className="text-white">{filteredCandidates.length}</span> Profiles Indexed
            </div>
        </div>

        <div className="flex gap-05">
            <button 
                onClick={() => setViewMode('grid')}
                className={`card-icon-button ${viewMode === 'grid' ? 'active' : ''} w-10 h-10 flex items-center justify-center`}
            >
                <LayoutGrid size={18} />
            </button>
            <button 
                onClick={() => setViewMode('list')}
                className={`card-icon-button ${viewMode === 'list' ? 'active' : ''} w-10 h-10 flex items-center justify-center`}
            >
                <List size={18} />
            </button>
        </div>
      </div>

      <div className={viewMode === 'grid' ? 'jobs-layout-grid' : 'flex flex-col gap-1'}>
        <AnimatePresence mode="popLayout">
            {filteredCandidates.map((c, i) => (
              <motion.div 
                layout
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card admin-item-card relative"
                onClick={() => setSelectedCandidateForProfile(c)}
                style={{ 
                    flexDirection: viewMode === 'grid' ? 'column' : 'row',
                    alignItems: viewMode === 'grid' ? 'stretch' : 'center',
                    padding: viewMode === 'grid' ? '2.5rem' : '1.25rem 2.5rem'
                }}
              >
                
                <div className={`match-score-indicator ${viewMode === 'grid' ? 'grid-position' : ''}`}>
                    <div className="match-val-pro">{c.match}%</div>
                    <div className="match-label-pro">FIT</div>
                </div>

                <div className="flex items-center gap-1 flex-1">
                    <div className="admin-avatar-box"><User size={24} color="white" /></div>
                    <div className="min-w-0" style={{ paddingRight: viewMode === 'grid' ? '4rem' : '0' }}>
                        <h4 className="card-title-white no-margin truncate">{c.name}</h4>
                        <div className="card-role-text truncate">
                            <ArrowUpRight size={14} color="var(--primary)" /> {c.role || "Knowledge Node"}
                        </div>
                    </div>
                </div>

                {viewMode === 'grid' && (
                    <div className="flex-col gap-05 mt-6 p-5 rounded-2xl bg-white-02 border border-white-05">
                        <div className="pro-section-label"><Sparkles size={14} /> AI ANALYSIS</div>
                        <p className="card-summary-clamped line-clamp-3">{c.summary}</p>
                    </div>
                )}

                <div className={`flex justify-between items-center ${viewMode === 'grid' ? 'mt-auto pt-5 border-t border-white-05' : 'min-w-[190px] ml-auto'}`}>
                    {viewMode === 'grid' && <div className="admin-desc-muted text-xs font-bold">{c.applied}</div>}
                    <div className="flex gap-05">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedCandidateForNotes(c); }} className="card-icon-button relative w-9 h-9 flex items-center justify-center">
                            <StickyNote size={16} />
                            {c.notes && c.notes.trim() !== "" && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full shadow-glow"></span>}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onOpenChat(c); }} className="card-icon-button w-9 h-9 flex items-center justify-center"><Bot size={16} /></button>
                        <button onClick={(e) => handleDownload(e, c)} className="card-icon-button w-9 h-9 flex items-center justify-center"><Download size={16} /></button>
                        <button onClick={(e) => handleDelete(e, c.id)} className="card-icon-button danger-ghost w-9 h-9 flex items-center justify-center"><Trash2 size={16} /></button>
                    </div>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      <NotesModal isOpen={!!selectedCandidateForNotes} onClose={() => setSelectedCandidateForNotes(null)} onSave={handleSaveNotes} initialValue={selectedCandidateForNotes?.notes || ""} title={`Notes for ${selectedCandidateForNotes?.name}`} isSaving={savingId === selectedCandidateForNotes?.id} />
      <TalentProfileModal isOpen={!!selectedCandidateForProfile} onClose={() => setSelectedCandidateForProfile(null)} candidate={selectedCandidateForProfile} />
    </div>
  );
};

export default AdminResumeDatabase;
