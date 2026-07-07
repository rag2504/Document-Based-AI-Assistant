import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, AlertCircle, FileText, Sparkles, Terminal, Network, ShieldCheck } from 'lucide-react';

/* ── Semantic concept keywords that fly out during scanning ── */
const WORDS_POOL = [
  'Retrieval', 'pgvector', 'Metadata', 'Semantics', 'Tokens',
  'Context', 'Efficacy', 'Analytics', 'Inference', 'Chronology',
  'Embeddings', 'Entities', 'Citations', 'Summary',
];

const PIPELINE_STAGES = [
  { label: 'Reading bytes',            desc: 'Loading document stream in-memory' },
  { label: 'Analysing structure',      desc: 'Parsing PDF elements and layout' },
  { label: 'Extracting semantic nodes', desc: 'Building local vector boundaries' },
  { label: 'Generating embeddings',    desc: 'Processing all-MiniLM-L6-v2 vectors' },
  { label: 'Indexing knowledge graph', desc: 'Injecting chunks into pgvector' },
];

const SUGGESTED_PROMPTS = [
  { icon: '✦', text: 'Summarize this document' },
  { icon: '🔑', text: 'What are the key findings?' },
  { icon: '📋', text: 'List the main topics' },
  { icon: '🎯', text: 'What are the conclusions?' },
  { icon: '💡', text: 'What insights can I draw?' },
];

const FEATURE_CARDS = [
  {
    color: 'var(--accent)',
    Icon: Terminal,
    title: 'Presentation Engine',
    desc: 'LLM answers compile into timelines, comparisons, and metrics automatically.',
  },
  {
    color: '#10b981',
    Icon: Network,
    title: 'Knowledge Graph',
    desc: 'Interactive 2D concept maps link chunks and extracted facts dynamically.',
  },
  {
    color: '#f59e0b',
    Icon: ShieldCheck,
    title: 'Offline Embeddings',
    desc: 'all-MiniLM-L6-v2 runs locally — private, rate-limit-free vector search.',
  },
];

export default function WelcomeScreen({
  onFileSelect,
  onSuggestedPrompt,
  uploadStatus,
  uploadProgress,
  uploadError,
  onRetry,
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [flyingWords, setFlyingWords] = useState([]);

  const isUploading = ['uploading', 'indexing', 'parsing', 'embedding', 'chunking'].includes(uploadStatus);

  const pipelineStage = (() => {
    if (uploadProgress < 20) return 0;
    if (uploadProgress < 40) return 1;
    if (uploadProgress < 65) return 2;
    if (uploadProgress < 85) return 3;
    return 4;
  })();

  /* Flying keyword animation during upload */
  useEffect(() => {
    if (!isUploading) return;
    const interval = setInterval(() => {
      const word = WORDS_POOL[Math.floor(Math.random() * WORDS_POOL.length)];
      const id = Math.random().toString(36).slice(2, 7);
      setFlyingWords(prev => [...prev, { id, word, left: `${20 + Math.random() * 60}%`, delay: Math.random() * 0.4 }]);
      setTimeout(() => setFlyingWords(prev => prev.filter(w => w.id !== id)), 3000);
    }, 380);
    return () => clearInterval(interval);
  }, [isUploading]);

  const validateAndSelect = (file) => {
    setFileError(null);
    if (!file) return;
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.pdf' && ext !== '.txt') {
      setFileError('Only PDF or TXT files are supported.');
      return;
    }
    onFileSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) validateAndSelect(e.dataTransfer.files[0]);
  };

  /* ── Shared max-width for all columns: 540px ── */
  const colStyle = { width: '100%', maxWidth: 540 };

  return (
    <div
      className="workspace glowing-grid"
      style={{ position: 'relative', overflowX: 'hidden' }}
    >
      {/* Ambient glow orbs */}
      <div aria-hidden style={{ position: 'absolute', top: '8%', left: '18%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(94,106,210,0.07) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', bottom: '12%', right: '12%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(192,132,252,0.04) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      {/* ── Hero headline (idle only) ── */}
      <AnimatePresence>
        {!isUploading && (
          <motion.div
            key="hero"
            style={{ ...colStyle, textAlign: 'center', marginBottom: 'var(--sp-8)' }}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--sp-4)' }}>
              <img src="/logo.jpeg" alt="Omnidoc" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', boxShadow: '0 2px 16px rgba(0,0,0,0.12)' }} />
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'var(--accent-subtle)', border: '1px solid var(--accent-light)',
              borderRadius: 'var(--r-full)', padding: '4px 12px',
              marginBottom: 'var(--sp-4)',
              fontSize: 'var(--text-2xs)', color: 'var(--accent)',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              <Sparkles size={11} />
              <span>Document Intelligence OS v3.5</span>
            </div>
            <h1 className="workspace-title">
              Explore the Depths of <br />
              <span className="text-gradient">Your Documents</span>
            </h1>
            <p className="workspace-subtitle" style={{ marginTop: 'var(--sp-3)' }}>
              Synthesize concepts, trace timelines, and query insights with a fully-offline semantic vector brain.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Upload / Scanner zone ── */}
      <div style={{ ...colStyle, position: 'relative', zIndex: 10, marginBottom: 'var(--sp-8)' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          onChange={e => { if (e.target.files?.[0]) validateAndSelect(e.target.files[0]); }}
          disabled={isUploading}
          style={{ display: 'none' }}
        />

        <AnimatePresence mode="wait">
          {/* Scanning state */}
          {isUploading ? (
            <motion.div
              key="scanning"
              className="visionos-glass"
              style={{
                borderRadius: 'var(--r-xl)', padding: 'var(--sp-8) var(--sp-6)',
                textAlign: 'center', position: 'relative', overflow: 'hidden',
                minHeight: 256, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-6)',
              }}
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            >
              {/* Laser sweep */}
              <div className="scanner-line" />

              {/* Floating concept keywords */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 12 }}>
                {flyingWords.map(w => (
                  <motion.div
                    key={w.id}
                    initial={{ y: 220, opacity: 0, scale: 0.8 }}
                    animate={{ y: 16, opacity: [0, 1, 1, 0], scale: [0.8, 1.05, 1.05, 0.8] }}
                    transition={{ duration: 2.2, ease: 'easeOut', delay: w.delay }}
                    style={{
                      position: 'absolute', left: w.left,
                      fontSize: 'var(--text-2xs)', fontWeight: 700,
                      fontFamily: 'var(--font-mono)', color: 'var(--accent)',
                      background: 'var(--accent-subtle)', border: '1px solid var(--accent-light)',
                      borderRadius: 'var(--r-full)', padding: '2px 8px', whiteSpace: 'nowrap',
                    }}
                  >
                    {w.word}
                  </motion.div>
                ))}
              </div>

              {/* Document icon */}
              <div style={{
                width: 72, height: 96, background: 'rgba(255,255,255,0.02)',
                border: '1.5px solid var(--border-strong)', borderRadius: 'var(--r-lg)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', boxShadow: 'var(--s-1)', zIndex: 15,
              }}>
                <FileText size={28} style={{ color: 'var(--accent)', opacity: 0.8 }} />
                <div style={{ width: '60%', height: 3, background: 'var(--border)', margin: '6px 0 3px', borderRadius: 2 }} />
                <div style={{ width: '45%', height: 3, background: 'var(--border)', borderRadius: 2 }} />
              </div>

              {/* Stage label + progress */}
              <div style={{ zIndex: 15, textAlign: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: 'var(--text-md)', color: 'var(--text-primary)', margin: '0 0 4px' }}>
                  {PIPELINE_STAGES[pipelineStage].label}…
                </p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '0 0 var(--sp-4)' }}>
                  {PIPELINE_STAGES[pipelineStage].desc}
                </p>
                <div className="progress-track" style={{ width: 200, margin: '0 auto' }}>
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            </motion.div>

          ) : uploadStatus === 'error' ? (
            /* Error state */
            <motion.div
              key="error"
              className="upload-error"
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            >
              <AlertCircle size={28} style={{ color: 'var(--error)', margin: '0 auto var(--sp-4)', display: 'block' }} />
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--sp-2)', fontSize: 'var(--text-md)' }}>
                Synthesizing halted
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--sp-5)', lineHeight: 'var(--leading-relaxed)' }}>
                {uploadError}
              </p>
              <button className="btn btn-primary" onClick={onRetry} style={{ margin: '0 auto' }}>
                Restart Scanner
              </button>
            </motion.div>

          ) : (
            /* Idle drop zone */
            <motion.div
              key="idle"
              className="upload-drop visionos-glass"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              whileHover={{ scale: 1.004 }}
              whileTap={{ scale: 0.997 }}
              style={{ borderRadius: 'var(--r-xl)', cursor: 'pointer' }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 'var(--r-lg)',
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto var(--sp-4)', color: 'var(--text-muted)',
              }}>
                <UploadCloud size={20} />
              </div>
              <p className="upload-title">Initialize Intelligence Asset</p>
              <p className="upload-sub">
                Drop PDF or TXT here, or <span className="upload-browse">browse files</span>
              </p>
              <div className="upload-badges">
                <span className="badge badge-accent">PDF</span>
                <span className="badge badge-default">TXT</span>
                <span className="badge badge-default">Max 10MB</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation error */}
        {fileError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 'var(--sp-2)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
              padding: 'var(--sp-2) var(--sp-3)', borderRadius: 'var(--r-md)',
              background: 'var(--error-subtle)', color: 'var(--error)', fontSize: 'var(--text-xs)',
            }}
          >
            <AlertCircle size={14} />
            {fileError}
          </motion.div>
        )}
      </div>

      {/* ── Prompt chips (idle only) ── */}
      {!isUploading && (
        <motion.div
          style={{ ...colStyle, marginBottom: 'var(--sp-8)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
        >
          <div className="prompt-chips">
            {SUGGESTED_PROMPTS.map(p => (
              <button key={p.text} className="prompt-chip" onClick={() => onSuggestedPrompt?.(p.text)}>
                <span style={{ fontSize: 11 }}>{p.icon}</span>
                {p.text}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Feature cards (idle only) — 3-column, equal gutters ── */}
      {!isUploading && (
        <motion.div
          style={colStyle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.18 }}
        >
          <div className="feature-grid">
            {FEATURE_CARDS.map(({ color, Icon, title, desc }) => (
              <div key={title} className="feature-card">
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  color, fontSize: 'var(--text-xs)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  marginBottom: 'var(--sp-2)',
                }}>
                  <Icon size={12} />
                  <span>{title}</span>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0, lineHeight: 'var(--leading-relaxed)' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
