import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, StickyNote, Loader2 } from 'lucide-react';

const NotesModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialValue = "", 
  title = "Internal Notes",
  isSaving = false 
}) => {
  const [value, setValue] = useState(initialValue);

  // Sync with initialValue when opened
  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          onClick={handleBackdropClick}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem'
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              width: '100%',
              maxWidth: '600px',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '32px',
              padding: '2.5rem',
              position: 'relative',
              boxShadow: '0 40px 100px -20px rgba(0,0,0,0.5)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: 'hsla(40, 95%, 55%, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                  <StickyNote size={20} />
                </div>
                <h3 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '800' }}>{title}</h3>
              </div>
              <button 
                onClick={onClose}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div style={{ marginBottom: '2rem' }}>
              <textarea
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Add internal calibration notes or context here..."
                style={{
                  width: '100%',
                  minHeight: '250px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid var(--card-border)',
                  borderRadius: '20px',
                  padding: '1.5rem',
                  color: 'white',
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  outline: 'none',
                  resize: 'vertical',
                  transition: 'border-color 0.2s'
                }}
              />
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Internal only. These notes are shared across the recruiter hub and are not visible to candidates.
              </p>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                onClick={onClose}
                className="btn-action-pro btn-ghost"
                style={{ padding: '0.8rem 2rem' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => onSave(value)}
                disabled={isSaving || value === initialValue}
                className="btn-action-pro btn-primary"
                style={{ padding: '0.8rem 2rem', opacity: (isSaving || value === initialValue) ? 0.6 : 1 }}
              >
                {isSaving ? (
                  <><Loader2 size={18} className="spin" /> Saving...</>
                ) : (
                  <><Save size={18} /> Update Notes</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NotesModal;
