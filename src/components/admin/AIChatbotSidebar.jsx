import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  X, 
  MessageSquare, 
  Sparkles,
  ChevronRight,
  Terminal,
  Loader2,
  AlertCircle,
  Brain,
  Cpu,
  Waves
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { queryAI, getSystemPrompt } from '../../services/hfService';
import './Admin.css';

const NeuralText = ({ children }) => {
  if (!children) return null;
  const lines = children.split('\n');
  return (
    <div className="flex-col gap-05">
      {lines.map((line, idx) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return <div key={idx} className="h-2" />;
        if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
          return (
            <div key={idx} className="flex gap-2 pl-2">
              <span className="text-primary font-black">•</span>
              <span className="flex-1">{formatBold(trimmedLine.slice(2))}</span>
            </div>
          );
        }
        const numberedMatch = trimmedLine.match(/^(\d+\.)\s+(.*)/);
        if (numberedMatch) {
          return (
            <div key={idx} className="flex gap-2 pl-2">
              <span className="text-primary font-black text-xs">{numberedMatch[1]}</span>
              <span className="flex-1">{formatBold(numberedMatch[2])}</span>
            </div>
          );
        }
        return <p key={idx} className="m-0 leading-relaxed">{formatBold(line)}</p>;
      })}
    </div>
  );
};

const formatBold = (text) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-black tracking-tight">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const NeuralThinkingBlock = ({ content }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="thinking-block-shell mb-4 p-4 rounded-xl relative overflow-hidden bg-primary-03 border-l-4 border-primary shadow-inset-primary">
    <motion.div animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.02, 1] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-0 bg-radial-primary-10 z-0" />
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-3">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}><Brain size={16} className="text-primary" /></motion.div>
        <span className="font-black text-[10px] uppercase tracking-widest text-primary">Neural Reasoning Engine</span>
      </div>
      <div className="text-slate-300 text-xs"><NeuralText>{content}</NeuralText></div>
    </div>
  </motion.div>
);

const AIChatbotSidebar = ({ isOpen, onClose, candidates, activeCandidate }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isLoading]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (activeCandidate) {
        setMessages([{ id: 1, role: 'bot', text: `I've loaded the context for **${activeCandidate.name}**. Their AI score is ${activeCandidate.match}%.\n\nSummary: "${activeCandidate.summary}"\n\nHow can I help you evaluate their potential?` }]);
      } else {
        setMessages([{ id: 1, role: 'bot', text: "Hello! I'm HireAI Intelligence. I can help you analyze candidates, compare skills, or generate interview plans. What's on your mind?" }]);
      }
    }
  }, [isOpen, activeCandidate]);

  const handleSend = async (e) => {
    e?.preventDefault(); if (!input.trim() || isLoading) return;
    const userMessage = { id: Date.now(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]); setInput(""); setIsLoading(true); setError(null);
    try {
        const history = [
            { role: "system", content: getSystemPrompt(activeCandidate, candidates) }, 
            ...messages.map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text })), 
            { role: "user", content: input }
        ];
        const aiResponse = await queryAI(history);
        if (aiResponse && (aiResponse.content || aiResponse.reasoning_content)) {
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'bot', text: aiResponse.content || "", reasoning: aiResponse.reasoning_content || null }]);
        } else { throw new Error("Invalid AI response."); }
    } catch (err) { setError(err.message || "Unexpected error."); } finally { setIsLoading(false); }
  };

  const PROMPTS = activeCandidate ? [`Analyze ${activeCandidate.name}'s gaps`, "Generate 3 interview questions", "How does this person fit a Lead role?"] : ["Compare top 3 React devs", "General hiring advice", "Summarize all candidates"];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black-60 backdrop-blur-sm z-1000" />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="ai-copilot-shell">
            <div className="sidebar-header-pro">
              <div className="flex items-center gap-6">
                <div className="bg-primary-15 p-3 rounded-2xl border border-primary-20 flex items-center justify-center">
                  <Sparkles className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="chat-title-brand text-xl">HireAI <span>Copilot</span></h3>
                  <div className="flex items-center gap-1.5 text-primary font-black text-[10px] uppercase tracking-tighter">
                    <div className="w-1 h-1 bg-primary rounded-full shadow-glow-primary"></div>
                    {activeCandidate ? `Context: ${activeCandidate.name}` : `Global Analysis`}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="btn-close-pro"><X size={20} /></button>
            </div>

            <div ref={scrollRef} className="chat-scroll-area">
               {messages.map(msg => (
                 <motion.div 
                   key={msg.id} 
                   initial={{ opacity: 0, y: 20, scale: 0.95 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                   className={`flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                 >
                   <span className="msg-meta">
                      {msg.role === 'user' ? 'AUTHORIZED RECRUITER' : 'HIREAI INTELLIGENCE'}
                   </span>
                   <div className={`msg-bubble-pro ${msg.role === 'user' ? 'msg-user' : 'msg-bot'}`}>
                     {msg.reasoning && <NeuralThinkingBlock content={msg.reasoning} />}
                     <NeuralText>{msg.text || (msg.reasoning ? "" : "No content.")}</NeuralText>
                   </div>
                 </motion.div>
               ))}

               {isLoading && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="self-start flex items-center gap-4 bg-primary-05 p-4 px-6 rounded-2xl border border-primary-10">
                    <div className="relative">
                        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute -inset-1 bg-primary-20 rounded-full blur-sm" />
                        <Brain size={20} className="text-primary" />
                    </div>
                    <div className="flex-col">
                        <span className="text-primary font-black text-[10px] uppercase tracking-widest">Neural Processing</span>
                        <div className="flex gap-1.5 mt-1.5">
                            {[0, 1, 2].map(i => <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full" />)}
                        </div>
                    </div>
                 </motion.div>
               )}

               {error && (
                 <div className="bg-danger-05 border border-danger-20 p-5 rounded-2xl flex items-start gap-3">
                    <AlertCircle size={20} className="text-danger flex-shrink-0" />
                    <p className="text-danger-light text-sm leading-relaxed font-bold">{error}</p>
                 </div>
               )}
            </div>

            <div className="input-area-shell">
                <div className="prompts-container mb-4">
                    {PROMPTS.map(p => (
                       <button key={p} onClick={() => setInput(p)} disabled={isLoading} className="prompt-pill text-[10px] px-3 py-1.5">
                         {p}
                       </button>
                    ))}
                </div>

                <form onSubmit={handleSend} className="chat-input-container">
                    <input 
                      type="text" 
                      value={input} 
                      onChange={(e) => setInput(e.target.value)} 
                      placeholder="Ask HireAI anything..." 
                      disabled={isLoading} 
                      className="chat-field-pro" 
                    />
                    <button 
                      type="submit" 
                      disabled={isLoading || !input.trim()} 
                      className="chat-send-btn"
                    >
                        {isLoading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
                    </button>
                </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default AIChatbotSidebar;
