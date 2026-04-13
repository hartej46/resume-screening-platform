import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  FileText, 
  LayoutDashboard, 
  Database,
  Search, 
  Settings, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  Plus,
  ShieldCheck,
  HelpCircle,
  Cpu,
  Send,
  ExternalLink,
  ChevronRight,
  ClipboardList,
  Bot,
  Sparkles,
  Zap,
  CheckCircle2,
  ListRestart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SignedIn, 
  SignedOut, 
  SignInButton, 
  UserButton,
  useUser,
  useAuth
} from '@clerk/clerk-react';

import AdminDashboard from './components/admin/AdminDashboard';
import AdminResumeDatabase from './components/admin/AdminResumeDatabase';
import AdminJobDescriptions from './components/admin/AdminJobDescriptions';
import AIChatbotSidebar from './components/admin/AIChatbotSidebar';
import CandidateSubmit from './components/candidate/CandidateSubmit';
import CandidateJobBoard from './components/candidate/CandidateJobBoard';
import CandidatePrepHub from './components/candidate/CandidatePrepHub';
import CandidateSimulation from './components/candidate/CandidateSimulation';
import CandidateJobs from './components/candidate/CandidateJobs';

const ADMIN_EMAILS = [
  "himanshubansal1803@gmail.com", 
  "nikhiltelkar19@gmail.com", 
  "hartejsinghsandhu2806@gmail.com", 
  "vivekkrishna7985@gmail.com"
];

const API_BASE_URL = "http://localhost:5001/api";

const DashboardShell = ({ role, activeTab, setActiveTab, user, onOpenChat, candidates, jobs, onRefresh, recommendations }) => {
  const isAdmin = role === 'admin';

  return (
    <div className="app-container">
      {/* ── Sidebar (stays dark) ── */}
      <aside className="sidebar">
        <div className="brand" style={{ marginBottom: '3.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', background: '#3b82f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(59, 130, 246, 0.4)' }}>
            <Cpu size={24} color="white" />
          </div>
          <h2 className="brand-font" style={{ color: 'white', fontSize: '1.6rem', letterSpacing: '-0.04em' }}>HireAI</h2>
        </div>

        <nav style={{ flex: 1 }}>
          <div style={{ color: '#4b5563', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.12em', marginBottom: '1.25rem', textTransform: 'uppercase' }}>
            Platform Sections
          </div>
          {isAdmin ? (
            <>
              <button className={`nav-item-pro ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                <LayoutDashboard size={20} /> <span>Admin Overview</span>
              </button>
              <button className={`nav-item-pro ${activeTab === 'database' ? 'active' : ''}`} onClick={() => setActiveTab('database')}>
                <Database size={20} /> <span>Resume Database</span>
              </button>
              <button className={`nav-item-pro ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>
                <ClipboardList size={20} /> <span>Job Descriptions</span>
              </button>
              <button className={`nav-item-pro ${activeTab === 'ingestion' ? 'active' : ''}`} onClick={() => setActiveTab('ingestion')}>
                <FileText size={20} /> <span>Data Ingestion</span>
              </button>
              <button className="nav-item-pro" onClick={onOpenChat} style={{ marginTop: '1rem', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <Bot size={20} /> <span>AI Copilot</span>
              </button>
            </>
          ) : (
            <>
              <button className={`nav-item-pro ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                <LayoutDashboard size={20} /> <span>Evaluation Status</span>
              </button>
              <button className={`nav-item-pro ${activeTab === 'prephub' ? 'active' : ''}`} onClick={() => setActiveTab('prephub')}>
                <HelpCircle size={20} /> <span>Interview Prep Hub</span>
              </button>
              <button className={`nav-item-pro ${activeTab === 'mockbot' ? 'active' : ''}`} onClick={() => setActiveTab('mockbot')}>
                <MessageSquare size={20} /> <span>Simulation Arena</span>
              </button>
              <button className={`nav-item-pro ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>
                <ClipboardList size={20} /> <span>Available Jobs</span>
              </button>
              <button className={`nav-item-pro ${activeTab === 'submit' ? 'active' : ''}`} onClick={() => setActiveTab('submit')}>
                <FileText size={20} /> <span>Submission Portal</span>
              </button>
            </>
          )}
        </nav>

        {/* Ethical guardrail — rendered dark-on-dark inside sidebar */}
        <div style={{ background: 'rgba(255,241,242,0.05)', border: '1px solid rgba(254,202,202,0.15)', padding: '1.25rem', borderRadius: '16px', color: '#fca5a5', marginTop: 'auto', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <ShieldCheck size={26} style={{ flexShrink: 0, color: '#f87171', marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#f87171', display: 'block', marginBottom: '4px', fontSize: '0.75rem' }}>Ethical AI Guardrail:</strong>
              <span style={{ fontSize: '0.68rem', opacity: 0.8, lineHeight: 1.5 }}>Final hiring decisions are strictly made by the Admin team following human oversight.</span>
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '20px', display: 'flex', alignItems: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
          <UserButton showName appearance={{ 
            elements: { 
              userButtonBox: { flexDirection: 'row-reverse', gap: '10px' }, 
              userButtonOuterIdentifier: { color: 'white', fontSize: '0.9rem', fontWeight: '600' } 
            } 
          }} />
        </div>
      </aside>

      {/* ── Main Content (light) ── */}
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
          <div>
            {!isAdmin && (
              <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
                <div className="pill-capsule" style={{ background: '#eff6ff', color: '#3b82f6' }}>Candidate Dashboard</div>
                <div className="pill-capsule" style={{ background: '#dcfce7', color: '#166534' }}>Top 15% Applicant</div>
              </div>
            )}
            <h1 style={{ fontSize: '2.75rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.04em', fontFamily: 'Outfit, sans-serif' }}>
              {isAdmin ? 'Recruiter Hub' : `Hey ${user?.firstName}!`}
            </h1>
          </div>

          {/* AI Engine Live badge — white card style */}
          <div style={{ background: 'white', padding: '8px 18px', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 6px rgba(16,185,129,0.5)', animation: 'pulse-dot 2s ease-in-out infinite' }}></div>
            <span style={{ fontWeight: '700', fontSize: '0.75rem', color: '#111827', letterSpacing: '0.04em' }}>AI ENGINE LIVE</span>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {isAdmin ? (
               activeTab === 'dashboard' ? <AdminDashboard candidates={candidates} /> :
               activeTab === 'database' ? <AdminResumeDatabase candidates={candidates} onOpenChat={onOpenChat} /> :
               activeTab === 'jobs'     ? <AdminJobDescriptions jobs={jobs} onRefresh={onRefresh} /> :
                                          <AdminIngestionView onRefresh={onRefresh} />
            ) : (
               activeTab === 'dashboard' ? <CandidateHome user={user} candidates={candidates} /> :
               activeTab === 'jobs'      ? <CandidateJobs jobs={jobs} /> :
               activeTab === 'submit'    ? <CandidateSubmit setActiveTab={setActiveTab} /> :
               activeTab === 'prephub'   ? <CandidatePrepHub setActiveTab={setActiveTab} /> :
               activeTab === 'mockbot'   ? <CandidateSimulation setActiveTab={setActiveTab} /> :
                                           <Placeholder />
            )}
          </motion.div>
        </AnimatePresence>

        <style>{`
          @keyframes pulse-dot {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </main>
    </div>
  );
};

const AdminIngestionView = ({ onRefresh }) => {
    const [fileStatus, setFileStatus] = useState(null);
    const [extractedName, setExtractedName] = useState("");
    const fileInputRef = useRef(null);

    const handleFileChange = async (fileOrEvent) => {
      let file = null;
      if (fileOrEvent?.target?.files) file = fileOrEvent.target.files[0];
      else if (fileOrEvent instanceof File) file = fileOrEvent;
      else return;

      if (!file) return;

      setFileStatus('uploading');

      const formData = new FormData();
      formData.append('resumePdf', file);
      formData.append('name', 'Admin Upload');
      formData.append('email', `admin-upload-${Date.now()}@hireai.com`);
      formData.append('role', 'Any Role');

      try {
        const response = await fetch(`${API_BASE_URL}/candidates`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Server returned an error');
        }

        const data = await response.json();
        setExtractedName(data.name || 'Extracted Candidate');
        setFileStatus('extracted');
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error(error);
        setFileStatus('error');
      }
    };

    const handleZoneClick = () => {
      fileInputRef.current.click();
    };

    const [isDragActive, setIsDragActive] = useState(false);

    const handleDragOver = (e) => {
      e.preventDefault();
      setIsDragActive(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      setIsDragActive(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragActive(false);
      if (fileStatus === 'error' || fileStatus === null || fileStatus === 'extracted') {
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFileChange(e.dataTransfer.files[0]);
        }
      }
    };

    return (
        <div className="fadeIn">
          <div className="card" style={{ padding: '2.5rem', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h3 style={{ color: 'var(--text-primary)', fontSize: '1.6rem', fontWeight: '800', letterSpacing: '-0.02em' }}>AI Data Ingestion</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', fontSize: '0.9rem' }}>Upload resumes to extract insights and calculate match scores</p>
                </div>
                <div style={{ padding: '7px 18px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '800', border: '1px solid rgba(16,185,129,0.2)', letterSpacing: '0.05em' }}>
                    RAG-READY PIPELINE
                </div>
            </div>

            <form onSubmit={handleIngest} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '0.85rem' }}>Candidate Full Name</label>
                    <input 
                        type="text" 
                        placeholder="e.g. John Doe"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        required
                        className="input-light"
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '0.85rem' }}>Resume Document</label>
                    <div 
                        style={{ 
                            position: 'relative',
                            width: '100%', 
                            height: '180px', 
                            background: selectedFile ? 'rgba(59,130,246,0.04)' : '#fafafa', 
                            border: selectedFile ? '2px solid #3b82f6' : '2px dashed #d1d5db', 
                            borderRadius: '18px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '1rem',
                            transition: 'all 0.3s'
                        }}
                    >
                        <input 
                            type="file" 
                            onChange={(e) => setSelectedFile(e.target.files[0])}
                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                        />
                        <FileText size={44} color={selectedFile ? '#3b82f6' : '#9ca3af'} />
                        <span style={{ color: selectedFile ? '#111827' : '#9ca3af', fontWeight: '600', fontSize: '0.95rem' }}>
                            {selectedFile ? selectedFile.name : 'Click to select or drag resume file'}
                        </span>
                        {selectedFile && <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: '600' }}>File ready for AI extraction</span>}
                    </div>
                </div>
                <span style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem' }}>
                    {fileStatus === 'uploading' ? 'Analyzing Resume Content...' : 
                     fileStatus === 'extracted' ? 'Resume Processed Successfully!' : 'Drop Resume to Analyze'}
                </span>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Supports PDF format up to 10MB</p>
            </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                        type="submit"
                        disabled={isIngesting || !candidateName || !selectedFile}
                        className="btn-primary"
                        style={{ 
                            padding: '0.9rem 2.5rem',
                            background: success ? '#10b981' : (isIngesting || !candidateName || !selectedFile) ? '#93c5fd' : '#3b82f6',
                            cursor: (isIngesting || !candidateName || !selectedFile) ? 'not-allowed' : 'pointer',
                            boxShadow: (isIngesting || !candidateName || !selectedFile) ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)'
                        }}
                    >
                        {isIngesting ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Cpu size={18} /></motion.div> Analyzing...</> : 
                         success ? <><CheckCircle size={18} /> Success!</> : 
                         <><Plus size={18} /> Start AI Ingestion</>}
                    </button>
                </div>
            </form>

            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #f3f4f6' }}>
                <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.25rem' }}>Batch Processing</h4>
                <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '14px', border: '1px solid #e5e7eb' }}>
                    <textarea 
                        style={{ width: '100%', height: '110px', background: 'transparent', border: 'none', color: '#374151', fontSize: '0.95rem', outline: 'none', resize: 'none', fontFamily: 'Inter, sans-serif' }} 
                        placeholder="Paste bulk text or multiple LinkedIn profiles for deep background analysis..."
                    ></textarea>
                </div>
            </div>
          </div>
        </div>
    );
};

const CandidateHome = ({ user, candidates }) => {
  const candidate = candidates.find(c => c.name.includes(user?.firstName || "Alex")) || candidates[0];
  const matchScore = candidate?.match || 88;

  return (
    <div className="fadeIn" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem' }}>
      {/* AI Fit Analysis Card */}
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1.05rem', marginBottom: '2.25rem', color: 'var(--text-primary)', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>
          <Cpu size={20} color="#3b82f6" /> AI Fit Analysis
        </h3>

        <div style={{ fontSize: '6rem', fontWeight: '900', letterSpacing: '-4px', color: 'var(--text-primary)', marginBottom: '0.1rem', fontFamily: 'Outfit, sans-serif' }}>
          {matchScore}<span style={{ color: '#3b82f6', fontSize: '3.5rem' }}>%</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', marginBottom: '2.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Global Match Score</p>

        <div className="pro-progress-bg" style={{ height: '8px', marginBottom: '3rem' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${matchScore}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', borderRadius: '4px' }}
          />
        </div>

        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
              <span>Technical Stack</span> <span style={{ color: '#3b82f6' }}>94%</span>
            </div>
            <div className="pro-progress-bg">
              <motion.div initial={{ width: 0 }} animate={{ width: '94%' }} transition={{ duration: 1.5, delay: 0.2 }} style={{ height: '100%', background: '#3b82f6', borderRadius: '4px' }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
              <span>Domain relevance</span> <span style={{ color: '#06b6d4' }}>72%</span>
            </div>
            <div className="pro-progress-bg">
              <motion.div initial={{ width: 0 }} animate={{ width: '72%' }} transition={{ duration: 1.5, delay: 0.4 }} style={{ height: '100%', background: '#06b6d4', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Right column: Strengths + Gaps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <div className="card" style={{ borderLeft: '4px solid #10b981', padding: '2rem', borderRadius: '20px' }}>
          <h4 style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', fontSize: '1rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>
            <TrendingUp size={20} /> Core Strengths
          </h4>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.93rem' }}>
            {candidate?.summary || 'Your expertise in React & Scalable Systems matches 95% of our high-priority requirements. AI detected strong architectural reasoning in your "Project Alpha" summary.'}
          </p>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #f59e0b', padding: '2rem', borderRadius: '20px' }}>
          <h4 style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', fontSize: '1rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>
            <AlertCircle size={20} /> Skill Gaps Detected
          </h4>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.93rem' }}>
            Limited exposure to Cloud Infrastructure (Terraform/AWS) detected. Our AI has curated 5 specific prep modules in the Prep Hub to address this before your interview.
          </p>
        </div>
    </div>
  );
};

const Placeholder = () => (
    <div className="card fadeIn" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #e5e7eb' }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Module implementation in progress...</span>
    </div>
);

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatCandidate, setActiveChatCandidate] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const { user } = useUser();
  const isAdmin = ADMIN_EMAILS.includes(user?.primaryEmailAddress?.emailAddress);

  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const userId = user?.id;

  const fetchData = React.useCallback(async () => {
    try {
      const [candRes, jobsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/candidates`, { cache: 'no-store' }),
        fetch(`${API_BASE_URL}/jobs`, { cache: 'no-store' })
      ]);
      const candData = await candRes.json();
      const jobsData = await jobsRes.json();
      
      setCandidates(candData);
      setJobs(jobsData);

      // Compute the active candidate used by the dashboard
      const dashboardCandidate = candData.find(c => c.email && userEmail && c.email === userEmail) || candData[0];

      // Fetch AI recommendations for exact displayed candidate (including all=true for Job Board)
      if (!isAdmin && dashboardCandidate) {
        const urlParams = dashboardCandidate.email 
          ? `email=${dashboardCandidate.email}&id=${dashboardCandidate.id}&all=true` 
          : `id=${dashboardCandidate.id}&all=true`;
          
        const recRes = await fetch(`${API_BASE_URL}/candidates/recommendations?${urlParams}`);
        const recData = await recRes.json();
        if (Array.isArray(recData)) {
          setRecommendations(recData);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [isAdmin, userId, userEmail]);

  useEffect(() => {
    fetchData();
  }, [fetchData, activeTab]);

  return (
    <>
      <SignedOut>
        <div className="login-bg">
          <div className="login-blob" style={{ top: '-10%', left: '-10%' }}></div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="login-card">
            <div style={{ display: 'inline-flex', padding: '18px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '20px', marginBottom: '2rem' }}>
              <Cpu size={36} color="#3b82f6" />
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1rem', color: 'white' }}>HireAI Portal</h1>
            <p style={{ color: '#94a3b8', marginBottom: '3rem' }}>Next-gen AI recruitment screening and preparation platform.</p>
            <SignInButton mode="modal"><button className="login-btn">Enter Platform <ChevronRight size={20} /></button></SignInButton>
          </motion.div>
        </div>
      </SignedOut>

      <SignedIn>
        <DashboardShell 
          role={isAdmin ? 'admin' : 'candidate'} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          user={user} 
          candidates={candidates}
          jobs={jobs}
          onRefresh={fetchData}
          recommendations={recommendations}
          onOpenChat={(candidate) => {
            setActiveChatCandidate(candidate || null);
            setIsChatOpen(true);
          }} 
        />
        <AIChatbotSidebar 
          isOpen={isChatOpen} 
          onClose={() => {
            setIsChatOpen(false);
            setActiveChatCandidate(null);
          }} 
          candidates={candidates} 
          activeCandidate={activeChatCandidate}
        />
      </SignedIn>
    </>
  );
};

export default App;
