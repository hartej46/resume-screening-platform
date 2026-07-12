import React, { useState, useRef } from 'react';
import { FileText, UploadCloud, CheckCircle, Cpu, Loader2, ArrowRight, AlertCircle, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import LiveKeywordStream from '../shared/LiveKeywordStream';
import './candidate.css';
import { API_BASE_URL } from '../../apiConfig';

const CandidateSubmit = ({ setActiveTab, onRefresh }) => {
  const [uploadState, setUploadState] = useState('idle');
  const [score, setScore] = useState(0);
  const [summary, setSummary] = useState("");
  const [extractedName, setExtractedName] = useState("");
  const [resumeTitle, setResumeTitle] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const { user } = useUser();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadFile(file);
  };

  const uploadFile = async (file) => {
    if (file.type !== 'application/pdf') { alert("Please upload a PDF file."); return; }
    const email = user?.primaryEmailAddress?.emailAddress;
    if (email) {
      try {
        const checkRes = await fetch(`${API_BASE_URL}/api/candidates/${email}/resumes`);
        const existing = await checkRes.json();
        if (existing.length >= 4) { alert("You can store up to 4 resumes. Please delete one from your profile first."); return; }
      } catch (err) { console.error("Failed to check resume limit:", err); }
    }
    setUploadState('uploading');
    setScore(0);
    setSummary("");
    const formData = new FormData();
    formData.append('resumePdf', file);
    formData.append('email', user?.primaryEmailAddress?.emailAddress);
    formData.append('name', user?.fullName || "Candidate");
    formData.append('role', "Software Engineer Applicant");
    formData.append('resumeTitle', resumeTitle.trim() !== '' ? resumeTitle.trim() : file.name);
    try {
      const response = await fetch(`${API_BASE_URL}/api/candidates`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setExtractedName(data.name);
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
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="fadeIn">
      <div className="cs-header">
        <h2 className="cs-portal-title">Submission Portal</h2>
        <p className="cs-portal-subtitle">Our AI analyzes your expertise in real-time to match you with top-tier opportunities.</p>
      </div>

      <input type="file" ref={fileInputRef} className="cs-hidden-input" accept="application/pdf" onChange={handleFileChange} />

      <div className="cs-form-group">
        <label className="cs-input-label">Resume Title (Optional)</label>
        <input
          type="text"
          value={resumeTitle}
          onChange={(e) => setResumeTitle(e.target.value)}
          placeholder="e.g. Frontend Developer Resume - 2024"
          disabled={uploadState === 'uploading'}
          className="cs-title-input"
        />
      </div>

      <div className="cs-upload-layout">
        {/* Upload Zone */}
        <motion.div
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          onClick={() => uploadState !== 'uploading' && fileInputRef.current?.click()}
          whileHover={uploadState === 'idle' ? { scale: 1.01 } : {}}
          className={`glass-card cs-upload-zone ${isDragActive ? 'drag-active' : 'idle'}`}
        >
          <AnimatePresence mode="wait">
            {uploadState === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="cs-idle-content">
                <div className="cs-upload-icon-wrapper"><UploadCloud size={56} color="var(--primary)" /></div>
                <h3 className="cs-upload-title">{isDragActive ? "Drop to Ingest" : "Upload your Resume"}</h3>
                <p className="cs-upload-subtitle">Drag & drop or click to browse (PDF only)</p>
              </motion.div>
            )}
            {uploadState === 'uploading' && (
              <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="cs-processing-content">
                <div className="cs-loader-container">
                  <Loader2 size={80} color="var(--primary)" className="cs-loader-spinner spin" />
                  <Cpu size={32} color="var(--primary)" className="cs-loader-cpu" />
                </div>
                <h3 className="cs-processing-title">AI Processing...</h3>
                <p className="cs-processing-subtitle">Parsing knowledge nodes and scoring match...</p>
                <div className="cs-stream-container"><LiveKeywordStream isAnalyzing={true} /></div>
              </motion.div>
            )}
            {uploadState === 'complete' && (
              <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="cs-complete-content">
                <div className="cs-success-icon-wrapper"><CheckCircle size={56} color="var(--success)" /></div>
                <h3 className="cs-processing-title">Ingestion Complete</h3>
                <p className="cs-complete-name">Confirmed: {extractedName}</p>
                <p className="cs-complete-hint">Click to upload another resume</p>
              </motion.div>
            )}
            {uploadState === 'error' && (
              <motion.div key="error" className="cs-error-content" onClick={(e) => { e.stopPropagation(); setUploadState('idle'); }}>
                <div className="cs-error-icon-wrapper"><AlertCircle size={56} color="var(--danger)" /></div>
                <h3 className="cs-processing-title">Processing Error</h3>
                <p className="cs-error-hint">Click to reset and try again</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Analytics Panel */}
        <div className="glass-card cs-analytics-card">
          <div className="cs-scoring-header">
            <h4 className="cs-analytics-label"><Cpu size={18} color="var(--primary)" /> LIVE SCORING ENGINE</h4>
            <div className="cs-score-display">{score}<span className="cs-score-unit">%</span></div>
            <p className="cs-score-caption">PROBABILISTIC TALENT MATCH</p>
          </div>

          <AnimatePresence>
            {uploadState === 'complete' && summary && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="cs-summary-container">
                <div className="cs-summary-inner">
                  <div className="cs-summary-header"><Brain size={14} /> AI Evaluation Profile</div>
                  {summary.split('\n\n').map((para, i) => (
                    <p key={i} className="cs-summary-para">{para}</p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="cs-analytics-footer">
            <button
              onClick={() => setActiveTab('dashboard')}
              disabled={uploadState !== 'complete'}
              className={`btn-action-pro btn-primary cs-btn-dashboard ${uploadState !== 'complete' ? 'cs-btn-disabled' : ''}`}
            >
              Access Dashboard <ArrowRight size={20} />
            </button>
            <div className="cs-calibration-box">
              <p className="cs-calibration-text">Neural analysis calibrated for technical seniority & skill velocity.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateSubmit;
