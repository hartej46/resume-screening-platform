import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, FileText, LayoutDashboard, Database, Search, 
  TrendingUp, CheckCircle, AlertCircle, MessageSquare, Plus,
  ShieldCheck, HelpCircle, Cpu, ChevronRight, ClipboardList, Bot, ArrowRight, User, Sun, Moon, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser, useClerk } from '@clerk/clerk-react';

import AdminDashboard from './components/admin/AdminDashboard';
import AdminResumeDatabase from './components/admin/AdminResumeDatabase';
import AdminJobDescriptions from './components/admin/AdminJobDescriptions';
import AIChatbotSidebar from './components/admin/AIChatbotSidebar';
import CandidateSubmit from './components/candidate/CandidateSubmit';
import CandidateJobBoard from './components/candidate/CandidateJobBoard';
import CandidateHome from './components/candidate/CandidateHome';
import CandidatePrepHub from './components/candidate/CandidatePrepHub';
import CandidateProfile from './components/candidate/CandidateProfile';
import CandidateSimulation from './components/candidate/CandidateSimulation';
import CandidateHistory from './components/candidate/CandidateHistory';
import { API_BASE_URL } from './apiConfig';

const ADMIN_EMAILS = [
  "himanshubansal1803@gmail.com", "nikhiltelkar19@gmail.com", 
  "hartejsinghsandhu2806@gmail.com", "vivekkrishna7985@gmail.com","yashvendra.singh@newtonschool.co"
];

const API_FULL_URL = `${API_BASE_URL}/api`;

const DashboardShell = ({ role, activeTab, setActiveTab, user, onOpenChat, candidates, jobs, onRefresh, recommendations, activeInterviewApp, setActiveInterviewApp, theme, onToggleTheme, isChatOpen, activeChatCandidate }) => {
  const isAdmin = role === 'admin';
  
  const myProfile = useMemo(() => {
    return candidates.find(c => c.email === user?.primaryEmailAddress?.emailAddress);
  }, [candidates, user]);

  const getHeaderContent = () => {
    if (isAdmin) {
      if (activeTab === 'dashboard') return { title: 'Recruiter Hub', subtitle: 'Orchestrate your multi-dimensional hiring pipeline.' };
      if (activeTab === 'database') return { title: 'Resume Database', subtitle: 'Search and filter candidate profiles.' };
      if (activeTab === 'jobs') return { title: 'Job Descriptions', subtitle: 'Manage and create new job postings.' };
    } else {
      if (activeTab === 'dashboard') return { title: `Hey ${user?.firstName}!`, subtitle: 'Track your strategic application roadmap.' };
      if (activeTab === 'submit') return { title: 'Submission Portal', subtitle: 'Submit your application and resumes for AI evaluation.' };
      if (activeTab === 'jobboard') return { title: 'Job Openings', subtitle: 'Discover AI-ranked career opportunities.' };
      if (activeTab === 'history') return { title: 'Interview History', subtitle: 'Review your past simulated and real interviews.' };
      if (activeTab === 'prephub') return { title: 'Interview Prep Hub', subtitle: 'Practice and prepare with AI-driven simulations.' };
      if (activeTab === 'interview') return { title: 'Simulated Interview', subtitle: 'Interact with AI to demonstrate your skills.' };
    }
    return { title: '', subtitle: '' };
  };

  const headerContent = getHeaderContent();

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Cpu size={24} color="white" />
          </div>
          <div>
            <h2 className="brand-name brand-font">HireAI</h2>
            <div className="brand-subtitle">ENTERPRISE</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {isAdmin ? (
            <>
              <button className={`nav-item-pro ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                <LayoutDashboard size={18} /> <span>Admin Overview</span>
              </button>
              <button className={`nav-item-pro ${activeTab === 'database' ? 'active' : ''}`} onClick={() => setActiveTab('database')}>
                <Database size={18} /> <span>Resume Database</span>
              </button>
              <button className={`nav-item-pro ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>
                <ClipboardList size={18} /> <span>Job Descriptions</span>
              </button>
              
              <div className="sidebar-separator"></div>
              <div className="sidebar-section-title">INTELLIGENCE</div>

              <button 
                className={`nav-item-pro btn-ask-ai ${isChatOpen && !activeChatCandidate ? 'active' : ''}`} 
                onClick={() => onOpenChat()}
              >
                <Bot size={18} /> <span>Ask HireAI Bot</span>
              </button>
              <div className="sidebar-separator"></div>
            </>
          ) : (
            <>
              <button className={`nav-item-pro ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                <LayoutDashboard size={18} /> <span>Evaluation Status</span>
              </button>
              <button className={`nav-item-pro ${activeTab === 'jobboard' ? 'active' : ''}`} onClick={() => setActiveTab('jobboard')}>
                <Search size={18} /> <span>Job Openings</span>
              </button>
              <button className={`nav-item-pro ${activeTab === 'submit' ? 'active' : ''}`} onClick={() => setActiveTab('submit')}>
                <FileText size={18} /> <span>Submission Portal</span>
              </button>
              <button className={`nav-item-pro ${activeTab === 'prephub' ? 'active' : ''}`} onClick={() => setActiveTab('prephub')}>
                <HelpCircle size={18} /> <span>Interview Hub</span>
              </button>
              <button className={`nav-item-pro ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                <History size={18} /> <span>Interview History</span>
              </button>
              <button className={`nav-item-pro ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                <User size={18} /> <span>My Profile</span>
              </button>
              <div className="sidebar-separator"></div>
            </>
          )}
        </nav>

        <div className="sidebar-user-footer">
          <UserButton showName appearance={{ elements: { userButtonOuterIdentifier: { color: 'var(--text-main)', fontWeight: '700', fontSize: '13px' } } }} />
        </div>
      </aside>

      <main className="main-content">
        {activeTab !== 'profile' && (
          <header className="main-header">
            <div>
              <h1 className="header-title">{headerContent.title}</h1>
              <p className="header-subtitle">{headerContent.subtitle}</p>
            </div>
            <div className="header-right">
              <button onClick={onToggleTheme} className="theme-header-toggle" title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <div className="status-item">
                 <ShieldCheck size={16} color="var(--primary)" /> SECURE SESSION
              </div>
              <div className="status-pill">
                  <div className="pulse-dot"></div>
                  <span className="status-pill-text">STABLE MODE</span>
              </div>
            </div>
          </header>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: "easeOut" }}>
            {isAdmin ? (
               activeTab === 'dashboard' ? <AdminDashboard candidates={candidates} onOpenChat={onOpenChat} /> : 
               activeTab === 'database' ? <AdminResumeDatabase candidates={candidates} onOpenChat={onOpenChat} onRefresh={onRefresh} /> :
               <AdminJobDescriptions jobs={jobs} onRefresh={onRefresh} />
            ) : (
               activeTab === 'dashboard' ? <CandidateHome user={user} candidates={candidates} myProfile={myProfile} recommendations={recommendations} /> : 
               activeTab === 'submit' ? <CandidateSubmit onRefresh={onRefresh} setActiveTab={setActiveTab} /> :
               activeTab === 'jobboard' ? <CandidateJobBoard user={user} allJobs={jobs} myProfile={myProfile} onRefresh={onRefresh} recommendations={recommendations} setActiveTab={setActiveTab} /> :
               activeTab === 'profile' ? <CandidateProfile user={user} myProfile={myProfile} onRefresh={onRefresh} setActiveTab={setActiveTab} /> :
               activeTab === 'interview' ? <CandidateSimulation myProfile={myProfile} activeInterviewApp={activeInterviewApp} setActiveTab={setActiveTab} /> :
               activeTab === 'history' ? <CandidateHistory user={user} myProfile={myProfile} /> :
               <CandidatePrepHub myProfile={myProfile} setActiveTab={setActiveTab} setActiveInterviewApp={setActiveInterviewApp} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};


const App = () => {
  const { openSignIn } = useClerk();
  const [activeTab, setActiveTab] = useState(
    () => sessionStorage.getItem('activeTab') || 'dashboard'
  );

  const handleSetActiveTab = (tab) => {
    sessionStorage.setItem('activeTab', tab);
    setActiveTab(tab);
  };

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatCandidate, setActiveChatCandidate] = useState(null);
  const [activeInterviewApp, setActiveInterviewApp] = useState(null);
  
  const [isInitializing, setIsInitializing] = useState(false);
  const [initStage, setInitStage] = useState('');

  const { user } = useUser();
  const isAdmin = useMemo(() => ADMIN_EMAILS.includes(user?.primaryEmailAddress?.emailAddress), [user]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [candRes, jobsRes] = await Promise.all([
        fetch(`${API_FULL_URL}/candidates`),
        fetch(`${API_FULL_URL}/jobs`)
      ]);
      const candData = await candRes.json();
      const jobsData = await jobsRes.json();
      setCandidates(Array.isArray(candData) ? candData : []);
      setJobs(Array.isArray(jobsData) ? jobsData : []);

      if (!isAdmin) {
          const userEmail = user?.primaryEmailAddress?.emailAddress;
          const recRes = await fetch(`${API_FULL_URL}/candidates/recommendations?email=${userEmail}`);
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
    if (isChatOpen && activeChatCandidate?.id === candidate?.id) {
      setIsChatOpen(false);
    } else {
      setActiveChatCandidate(candidate);
      setIsChatOpen(true);
    }
  };

  const handleInitialize = () => {
    setIsInitializing(true);
    setInitStage('Neural Link Established');
    
    setTimeout(() => setInitStage('Decrypting Credentials...'), 800);
    setTimeout(() => setInitStage('Accessing Secure Core...'), 1600);
    
    setTimeout(() => {
      openSignIn({ mode: 'modal' });
      setIsInitializing(false);
    }, 2400);
  };

  return (
    <>
      <SignedOut>
        <div className="login-bg">
          {/* Cinematic Background Elements */}
          <div className="login-visuals">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>
            <div className="data-stream"></div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="login-card"
          >
            <div className="scanning-line"></div>
            
            <AnimatePresence>
              {isInitializing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="init-overlay"
                >
                  <div className="init-text">{initStage}</div>
                  <div className="init-loader">
                    <div className="init-loader-fill"></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="login-logo-wrapper"
            >
               <Cpu size={42} color="white" style={{ position: 'relative', zIndex: 2 }} />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="login-title"
            >
              <span>HireAI</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 1 }}
              className="login-subtitle"
            >
              Experience the next generation of AI-driven talent orchestration and automated screening.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              <button 
                className={`login-btn ${isInitializing ? 'initializing' : ''}`}
                onClick={handleInitialize}
                disabled={isInitializing}
              >
                {isInitializing ? 'Connecting...' : 'Initialize Secure Session'}
                <ChevronRight size={20} />
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="login-footer"
            >
               <div className="login-footer-item">
                 <div className="pulse-dot-premium"></div>
                 <span>Neural Analysis</span>
               </div>
               <div className="login-footer-item">
                 <div className="pulse-dot-premium"></div>
                 <span>Zero Latency</span>
               </div>
            </motion.div>
          </motion.div>
        </div>
      </SignedOut>

      <SignedIn>
        <DashboardShell 
          role={isAdmin ? 'admin' : 'candidate'} 
          activeTab={activeTab} 
          setActiveTab={handleSetActiveTab} 
          user={user} 
          candidates={candidates}
          jobs={jobs}
          recommendations={recommendations}
          onOpenChat={handleOpenChat}
          onRefresh={fetchData}
          activeInterviewApp={activeInterviewApp}
          setActiveInterviewApp={setActiveInterviewApp}
          theme={theme}
          onToggleTheme={toggleTheme}
          isChatOpen={isChatOpen}
          activeChatCandidate={activeChatCandidate}
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
