import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, FileText, LayoutDashboard, Database, Search, 
  TrendingUp, CheckCircle, AlertCircle, MessageSquare, Plus,
  ShieldCheck, HelpCircle, Cpu, ChevronRight, ClipboardList, Bot, ArrowRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';

import AdminDashboard from './components/admin/AdminDashboard';
import AdminResumeDatabase from './components/admin/AdminResumeDatabase';
import AdminJobDescriptions from './components/admin/AdminJobDescriptions';
import AIChatbotSidebar from './components/admin/AIChatbotSidebar';
import CandidateSubmit from './components/candidate/CandidateSubmit';
import CandidateJobBoard from './components/candidate/CandidateJobBoard';
import CandidateHome from './components/candidate/CandidateHome';
import CandidatePrepHub from './components/candidate/CandidatePrepHub';

const ADMIN_EMAILS = [
  "himanshubansal1803@gmail.com", "nikhiltelkar19@gmail.com", 
  "hartejsinghsandhu2806@gmail.com", "vivekkrishna7985@gmail.com"
];

const API_BASE_URL = "http://localhost:5001/api";

const DashboardShell = ({ role, activeTab, setActiveTab, user, onOpenChat, candidates, jobs, onRefresh, recommendations }) => {
  const isAdmin = role === 'admin';
  
  // Robustly find the candidate profile for the logged-in user
  const myProfile = useMemo(() => {
    return candidates.find(c => c.email === user?.primaryEmailAddress?.emailAddress);
  }, [candidates, user]);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand" style={{ marginBottom: '3.5rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--primary)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px var(--primary-glow)' }}>
            <Cpu size={26} color="white" />
          </div>
          <h2 className="brand-font" style={{ color: 'white', fontSize: '1.8rem' }}>HireAI</h2>
        </div>

        <nav style={{ flex: 1 }}>
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
              
              <div style={{ margin: '1.5rem 0', borderTop: '1px solid var(--card-border)', opacity: 0.5 }}></div>
              
              <button 
                className="nav-item-pro" 
                onClick={() => onOpenChat()}
                style={{ 
                  background: 'linear-gradient(135deg, hsla(217, 91%, 60%, 0.1) 0%, transparent 100%)',
                  border: '1px solid hsla(217, 91%, 60%, 0.2)',
                  color: 'var(--primary)',
                  fontWeight: '800'
                }}
              >
                <Bot size={20} /> <span>Ask HireAI Bot</span>
              </button>
            </>
          ) : (
            <>
              <button className={`nav-item-pro ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                <LayoutDashboard size={20} /> <span>Evaluation Status</span>
              </button>
              <button className={`nav-item-pro ${activeTab === 'jobboard' ? 'active' : ''}`} onClick={() => setActiveTab('jobboard')}>
                <Search size={20} /> <span>Job Openings</span>
              </button>
              <button className={`nav-item-pro ${activeTab === 'submit' ? 'active' : ''}`} onClick={() => setActiveTab('submit')}>
                <FileText size={20} /> <span>Submission Portal</span>
              </button>
              <button className={`nav-item-pro ${activeTab === 'prephub' ? 'active' : ''}`} onClick={() => setActiveTab('prephub')}>
                <HelpCircle size={20} /> <span>Interview Prep Hub</span>
              </button>
            </>
          )}
        </nav>

        <div style={{ background: 'var(--card-bg)', padding: '14px', borderRadius: '20px', display: 'flex', alignItems: 'center', border: '1px solid var(--card-border)' }}>
          <UserButton showName appearance={{ elements: { userButtonOuterIdentifier: { color: 'white', fontWeight: '700' } } }} />
        </div>
      </aside>

      {/* ── Main Content (light) ── */}
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4rem', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '3.5rem' }}>{isAdmin ? 'Recruiter Hub' : `Hey ${user?.firstName}!`}</h1>
            <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                {isAdmin ? "Manage candidates and extraction pipelines" : "Your personal AI recruitment dashboard"}
            </p>
          </div>
          <div style={{ background: 'var(--card-bg)', padding: '10px 20px', borderRadius: '14px', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="pulse" style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }}></div>
            <span style={{ fontWeight: '800', fontSize: '0.75rem', color: 'white', letterSpacing: '0.05em' }}>STABLE MODE</span>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }} transition={{ duration: 0.2 }}>
            {isAdmin ? (
               activeTab === 'dashboard' ? <AdminDashboard candidates={candidates} onOpenChat={onOpenChat} /> : 
               activeTab === 'database' ? <AdminResumeDatabase candidates={candidates} onOpenChat={onOpenChat} onRefresh={onRefresh} /> :
               <AdminJobDescriptions jobs={jobs} onRefresh={onRefresh} />
            ) : (
               activeTab === 'dashboard' ? <CandidateHome user={user} candidates={candidates} myProfile={myProfile} recommendations={recommendations} /> : 
               activeTab === 'submit' ? <CandidateSubmit onRefresh={onRefresh} setActiveTab={setActiveTab} /> :
               activeTab === 'jobboard' ? <CandidateJobBoard user={user} allJobs={jobs} recommendations={recommendations} /> :
               <CandidatePrepHub />
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

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatCandidate, setActiveChatCandidate] = useState(null);
  const { user } = useUser();
  const isAdmin = useMemo(() => ADMIN_EMAILS.includes(user?.primaryEmailAddress?.emailAddress), [user]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [candRes, jobsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/candidates`),
        fetch(`${API_BASE_URL}/jobs`)
      ]);
      const candData = await candRes.json();
      const jobsData = await jobsRes.json();
      setCandidates(candData);
      setJobs(jobsData);

      // Fetch recommendations only for candidates
      if (!isAdmin) {
          const userEmail = user?.primaryEmailAddress?.emailAddress;
          const recRes = await fetch(`${API_BASE_URL}/candidates/recommendations?email=${userEmail}`);
          const recData = await recRes.json();
          if (Array.isArray(recData)) setRecommendations(recData);
      }
    } catch (error) {
      console.error("Critical Fetch Error:", error);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenChat = (candidate = null) => {
    setActiveChatCandidate(candidate);
    setIsChatOpen(true);
  };

  return (
    <>
      <SignedOut>
        <div className="login-bg">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="login-card"
          >
            <div style={{ width: '80px', height: '80px', background: 'var(--primary)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 3rem', boxShadow: '0 20px 40px var(--primary-glow)' }}>
               <Cpu size={42} color="white" />
            </div>
            
            <h1 style={{ color: 'white', fontSize: '4.5rem', marginBottom: '1rem', letterSpacing: '-0.06em', fontWeight: '900' }}>
              HireAI <span style={{ color: 'var(--primary)' }}>Portal</span>
            </h1>
            
            <p style={{ color: 'var(--text-dim)', marginBottom: '4rem', fontSize: '1.25rem', lineHeight: '1.6', maxWidth: '440px', margin: '0 auto 4rem' }}>
              The world's most advanced AI-driven candidate screening and interview readiness platform.
            </p>

            <SignInButton mode="modal">
              <button className="login-btn">
                Initialize Secure Session <ChevronRight size={20} />
              </button>
            </SignInButton>

            <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'center', gap: '2rem', opacity: 0.4 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '700', color: 'white' }}>
                 <CheckCircle size={14} color="var(--success)" /> Neural Extraction
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '700', color: 'white' }}>
                 <CheckCircle size={14} color="var(--success)" /> 0ms Latency
               </div>
            </div>
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
          recommendations={recommendations}
          onOpenChat={handleOpenChat}
          onRefresh={fetchData}
        />
        <AIChatbotSidebar 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          candidates={candidates}
          activeCandidate={activeChatCandidate}
        />
      </SignedIn>
    </>
  );
};

export default App;
