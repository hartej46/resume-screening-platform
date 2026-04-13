import React, { useState } from 'react';
import { FileText, UploadCloud, CheckCircle, Cpu, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import LiveKeywordStream from '../shared/LiveKeywordStream';

const CandidateSubmit = ({ setActiveTab, onRefresh }) => {
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, complete, error
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState([]);
  const [reasoning, setReasoning] = useState('');
  const [filename, setFilename] = useState('');
  const fileInputRef = useRef(null);
  const { user } = useUser();

  const handleFileChange = async (fileOrEvent) => {
    let file = null;
    if (fileOrEvent?.target?.files) file = fileOrEvent.target.files[0];
    else if (fileOrEvent instanceof File) file = fileOrEvent;
    else return;

    if (!file) return;

    setFilename(file.name);
    setUploadState('uploading');
    setTimeout(() => {
      setUploadState('analyzing');
      let currentScore = 0;
      const interval = setInterval(() => {
        currentScore += 2;
        setScore(currentScore);
        if (currentScore >= 88) {
          clearInterval(interval);
          setUploadState('complete');
        }
      }, 40);
    }, 2000);
  };

  return (
    <div className="fadeIn">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.6rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>Submit Application</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.4rem', fontSize: '0.9rem' }}>Upload your resume below. Our AI will automatically parse your experience.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '1.75rem' }}>
        {/* Upload Zone */}
        <div
          onClick={uploadState === 'idle' ? handleUpload : undefined}
          className="card"
          style={{
            background: uploadState === 'idle' ? 'white' : 'white',
            border: uploadState !== 'idle' ? '2px solid #bfdbfe' : '2px dashed #93c5fd',
            cursor: uploadState === 'idle' ? 'pointer' : 'default',
            transition: 'all 0.3s',
            minHeight: '340px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem 2rem'
          }}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            accept="application/pdf"
          />
          <LiveKeywordStream isAnalyzing={uploadState === 'uploading' || uploadState === 'analyzing'} />
          <AnimatePresence mode="wait">
            {uploadState === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center' }}>
                <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '50%', display: 'inline-block', marginBottom: '1.5rem' }}>
                  <UploadCloud size={44} color="#3b82f6" />
                </div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '800', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>Drag &amp; Drop Resume</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Supports PDF, DOCX (Max 5MB)</p>
                <div style={{ marginTop: '1.5rem', padding: '0.6rem 1.5rem', background: '#3b82f6', color: 'white', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', display: 'inline-block' }}>
                  Browse File
                </div>
              </motion.div>
            )}

            {uploadState === 'uploading' && (
              <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'inline-block', marginBottom: '1.5rem' }}
                >
                  <Cpu size={44} color="#3b82f6" />
                </motion.div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: '800', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>Uploading Resume...</h3>
                <div style={{ width: '200px', height: '4px', background: '#e5e7eb', borderRadius: '2px', margin: '0 auto', overflow: 'hidden' }}>
                  <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 2 }} style={{ height: '100%', background: '#3b82f6' }} />
                </div>
              </motion.div>
            )}

            {uploadState === 'analyzing' && (
              <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.75rem' }}>
                  <Cpu size={44} color="#10b981" />
                  <motion.div
                    initial={{ top: '-10px' }} animate={{ top: '55px' }}
                    transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse' }}
                    style={{ position: 'absolute', width: '100%', height: '2px', background: '#10b981', left: 0, borderRadius: '1px' }}
                  />
                </div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: '800', fontFamily: 'Outfit, sans-serif' }}>AI Parsing Identity &amp; Skills...</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.85rem' }}>Extracting experience, skills &amp; match data</p>
              </motion.div>
            )}

            {uploadState === 'complete' && (
              <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
                <div style={{ background: '#dcfce7', padding: '20px', borderRadius: '50%', display: 'inline-block', marginBottom: '1.5rem' }}>
                  <CheckCircle size={44} color="#10b981" />
                </div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '800', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>Upload Successful</h3>
                <p style={{ color: '#10b981', fontSize: '0.88rem', fontWeight: '600' }}>Nikhil_Telkar_Resume.pdf processed</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '2rem' }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '800', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Outfit, sans-serif' }}>
            <Cpu size={18} color="#3b82f6" /> Real-time Analysis
          </h3>

          {uploadState === 'idle' || uploadState === 'uploading' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
              <div style={{ width: '64px', height: '64px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={28} color="#9ca3af" />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>Upload a file to see AI match insights</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '4.5rem', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-3px', fontFamily: 'Outfit, sans-serif' }}>
                  {score}<span style={{ color: '#3b82f6', fontSize: '2.5rem' }}>%</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Match score for target role</p>
              </div>

              {uploadState === 'complete' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 'auto' }}>
                  <div style={{ padding: '0.875rem 1rem', background: '#dcfce7', borderRadius: '10px', color: '#166534', fontSize: '0.88rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                    <CheckCircle size={16} /> Shortlisting criteria met.
                  </div>
                  <button
                    onClick={() => setActiveTab('prephub')}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
                  >
                    Continue to Prep Hub <ArrowRight size={18} />
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateSubmit;
