import React, { useState, useRef } from 'react';
import { FileText, UploadCloud, CheckCircle, Cpu, Loader2, ArrowRight, AlertCircle, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import LiveKeywordStream from '../shared/LiveKeywordStream';

const CandidateSubmit = ({ setActiveTab, onRefresh }) => {
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, complete, error
  const [score, setScore] = useState(0);
  const [summary, setSummary] = useState("");
  const [extractedName, setExtractedName] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const { user } = useUser();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadFile(file);
  };

  const uploadFile = async (file) => {
    if (file.type !== 'application/pdf') {
        alert("Please upload a PDF file.");
        return;
    }

    setUploadState('uploading');
    setScore(0);
    setSummary("");
    
    const formData = new FormData();
    formData.append('resumePdf', file);
    formData.append('email', user?.primaryEmailAddress?.emailAddress);
    formData.append('name', user?.fullName || "Candidate");
    formData.append('role', "Software Engineer Applicant");

    try {
      const response = await fetch('http://localhost:5001/api/candidates', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setExtractedName(data.name);
      
      // Animate score display
      let currentScore = 0;
      const targetScore = data.match || 0;
      const interval = setInterval(() => {
        currentScore += 1;
        setScore(currentScore);
        if (currentScore >= targetScore) {
          clearInterval(interval);
          setUploadState('complete');
          setSummary(data.summary || "");
          if (onRefresh) onRefresh();
        }
      }, 15);

    } catch (error) {
      console.error("Upload error:", error);
      setUploadState('error');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fadeIn">
      <div style={{ marginBottom: '3.5rem' }}>
        <h2 style={{ color: 'white', fontSize: '2.25rem', fontWeight: '800' }}>Submission Portal</h2>
        <p style={{ color: 'var(--text-dim)', marginTop: '0.75rem', fontSize: '1.1rem' }}>
            Our AI analyzes your expertise in real-time to match you with top-tier opportunities.
        </p>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="application/pdf" 
        onChange={handleFileChange}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '3rem', alignItems: 'start' }}>
        {/* Upload Zone */}
        <motion.div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => uploadState !== 'uploading' && fileInputRef.current?.click()}
            whileHover={uploadState === 'idle' ? { scale: 1.01 } : {}}
            className="glass-card"
            style={{ 
                border: isDragActive ? '2px solid var(--primary)' : '2px dashed var(--card-border)', 
                background: isDragActive ? 'hsla(217, 91%, 60%, 0.05)' : 'var(--card-bg)',
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: uploadState !== 'uploading' ? 'pointer' : 'default',
                minHeight: '400px',
                position: 'relative',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
          <AnimatePresence mode="wait">
            {uploadState === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ textAlign: 'center' }}>
                <div style={{ background: 'var(--primary-glow)', padding: '24px', borderRadius: '50%', display: 'inline-block', marginBottom: '2rem' }}>
                    <UploadCloud size={56} color="var(--primary)" />
                </div>
                <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.75rem' }}>
                    {isDragActive ? "Drop to Ingest" : "Upload your Resume"}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Drag & drop or click to browse (PDF only)</p>
              </motion.div>
            )}

            {uploadState === 'uploading' && (
              <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', width: '100%', position: 'relative' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 2rem' }}>
                    <Loader2 size={80} color="var(--primary)" className="spin" style={{ position: 'absolute', top: 0, left: 0 }} />
                    <Cpu size={32} color="var(--primary)" style={{ position: 'absolute', top: '24px', left: '24px' }} />
                </div>
                <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.75rem' }}>AI Processing...</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>Parsing knowledge nodes and scoring match...</p>
                
                {/* Dynamic Stream Overlay */}
                <div style={{ height: '40px', marginTop: '1.5rem', opacity: 0.6 }}>
                   <LiveKeywordStream isAnalyzing={true} />
                </div>
              </motion.div>
            )}

            {uploadState === 'complete' && (
              <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
                <div style={{ background: 'hsla(150, 80%, 45%, 0.1)', padding: '24px', borderRadius: '50%', display: 'inline-block', marginBottom: '2rem' }}>
                    <CheckCircle size={56} color="var(--success)" />
                </div>
                <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.75rem' }}>Ingestion Complete</h3>
                <p style={{ color: 'var(--success)', fontSize: '1rem', fontWeight: '700' }}>Confirmed: {extractedName}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>Click to upload another resume</p>
              </motion.div>
            )}

            {uploadState === 'error' && (
              <motion.div key="error" style={{ textAlign: 'center' }} onClick={(e) => { e.stopPropagation(); setUploadState('idle'); }}>
                 <div style={{ background: 'hsla(0, 85%, 60%, 0.1)', padding: '24px', borderRadius: '50%', display: 'inline-block', marginBottom: '2rem' }}>
                    <AlertCircle size={56} color="var(--danger)" />
                </div>
                <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.75rem' }}>Processing Error</h3>
                <p style={{ color: 'var(--danger)', fontSize: '0.95rem' }}>Click to reset and try again</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Analytics Summary */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-dim)', fontSize: '0.7rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <Cpu size={18} color="var(--primary)" /> LIVE SCORING ENGINE
            </h4>
            
            <div style={{ fontSize: '5rem', fontWeight: '900', color: 'white', letterSpacing: '-4px', lineHeight: 1, marginBottom: '0.5rem' }}>
              {score}<span style={{ color: 'var(--primary)', fontSize: '2.5rem' }}>%</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700' }}>PROBABILISTIC TALENT MATCH</p>
          </div>

          {/* AI Summary Section with 2 Paras */}
          <AnimatePresence>
            {uploadState === 'complete' && summary && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '2rem', flex: 1 }}
              >
                <div style={{ background: 'hsla(217, 91%, 60%, 0.05)', padding: '1.25rem', borderRadius: '16px', border: '1px solid hsla(217, 91%, 60%, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.08em' }}>
                        <Brain size={14} /> AI Evaluation Profile
                    </div>
                    {summary.split('\n\n').map((para, i) => (
                        <p key={i} style={{ color: 'var(--text-dim)', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: i === 0 ? '1rem' : 0 }}>
                            {para}
                        </p>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 'auto' }}>
            <button 
              onClick={() => setActiveTab('dashboard')}
              disabled={uploadState !== 'complete'}
              className="btn-action-pro btn-primary" 
              style={{ 
                width: '100%', 
                padding: '1.15rem',
                opacity: uploadState === 'complete' ? 1 : 0.4,
                cursor: uploadState === 'complete' ? 'pointer' : 'default'
              }}
            >
              Access Dashboard <ArrowRight size={20} />
            </button>
            <div style={{ background: 'hsla(255, 255%, 255%, 0.02)', padding: '12px', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textAlign: 'center', lineHeight: '1.5' }}>
                Neural analysis calibrated for technical seniority & skill velocity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateSubmit;
