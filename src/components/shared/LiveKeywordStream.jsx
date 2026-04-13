import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Activity } from 'lucide-react';

const STATIC_KEYWORDS = [
  "Mapping Architecture", "Analyzing Skills", "Detecting Logic", 
  "Extraction Phase", "Clustering Entities", "Semantic Search",
  "Ranking Identity", "Validating Content", "Gemini Ingesting"
];

const LiveKeywordStream = ({ customKeywords = [], isAnalyzing = false }) => {
  const [activeWords, setActiveWords] = useState([]);
  const keywords = customKeywords.length > 0 ? customKeywords : STATIC_KEYWORDS;

  useEffect(() => {
    if (!isAnalyzing) {
      setActiveWords([]);
      return;
    }

    const interval = setInterval(() => {
      const newWord = {
        id: Math.random(),
        text: keywords[Math.floor(Math.random() * keywords.length)],
        left: Math.random() * 80 + 10 + '%',
        top: Math.random() * 80 + 10 + '%'
      };

      setActiveWords(prev => [...prev.slice(-8), newWord]);
    }, 600);

    return () => clearInterval(interval);
  }, [isAnalyzing, keywords]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
      <AnimatePresence>
        {isAnalyzing && activeWords.map((word) => (
          <motion.div
            key={word.id}
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 0.8, scale: 1, y: -20 }}
            exit={{ opacity: 0, scale: 1.2, y: -40 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              position: 'absolute',
              left: word.left,
              top: word.top,
              color: '#3b82f6',
              fontSize: '0.85rem',
              fontWeight: '700',
              textShadow: '0 0 10px rgba(59, 130, 246, 0.4)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <Sparkles size={12} fill="#3b82f6" />
            {word.text}
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.75rem', fontWeight: '800' }}
          >
            <Activity size={14} className="pulse" />
            AI NEURAL EXTRACTION IN PROGRESS
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveKeywordStream;
