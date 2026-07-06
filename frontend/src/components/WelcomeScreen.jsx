import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, AlertCircle, Sparkles, Zap, Search, BookOpen } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  { icon: '🔍', text: 'Summarize this document.' },
  { icon: '💼', text: 'What are the key skills mentioned?' },
  { icon: '📋', text: 'What projects are described?' },
  { icon: '🎯', text: 'What are the main conclusions?' },
];

const FEATURES = [
  {
    icon: <UploadCloud size={22} />,
    title: 'Upload Documents',
    desc: 'Drop your PDF or TXT files. Instant indexing with ChromaDB.',
    color: '#2563EB',
  },
  {
    icon: <Zap size={22} />,
    title: 'Ask Anything',
    desc: 'Natural language questions. Answers grounded in your content.',
    color: '#8B5CF6',
  },
  {
    icon: <Search size={22} />,
    title: 'Cited Sources',
    desc: 'Every answer includes references to exact document passages.',
    color: '#059669',
  },
];

export default function WelcomeScreen({ onFileSelect, onSuggestedPrompt, uploadStatus, uploadProgress, uploadError, onRetry }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState(null);

  const isUploading = uploadStatus === 'uploading' || uploadStatus === 'indexing';

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
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) validateAndSelect(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) validateAndSelect(e.target.files[0]);
  };

  return (
    <div style={{
      flex: 1, overflowY: 'auto', display: 'flex',
      flexDirection: 'column', alignItems: 'center',
      padding: '40px 20px 100px',
      background: 'var(--bg)',
    }}>
      {/* ── Hero ── */}
      <div className="animate-fade-slide-in" style={{ textAlign: 'center', marginBottom: '48px' }}>
        {/* Orb */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <div className="hero-orb" style={{ position: 'relative' }}>
            <BookOpen
              size={40}
              color="white"
              style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))',
              }}
            />
          </div>
        </div>

        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          color: 'var(--text-primary)',
          margin: '0 0 14px',
        }}>
          Document{' '}
          <span className="gradient-text">AI Assistant</span>
        </h1>
        <p style={{
          fontSize: '16px', color: 'var(--text-secondary)',
          maxWidth: '480px', margin: '0 auto', lineHeight: 1.7,
        }}>
          Upload documents and ask questions grounded in your files using{' '}
          <strong style={{ color: 'var(--primary)' }}>Retrieval-Augmented Generation</strong>.
        </p>
      </div>

      {/* ── Upload Zone ── */}
      <div className="animate-fade-slide-in delay-100" style={{ width: '100%', maxWidth: '560px', marginBottom: '28px' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          onChange={handleFileChange}
          disabled={isUploading}
          style={{ display: 'none' }}
        />

        {uploadStatus === 'error' ? (
          <div style={{
            border: '1.5px solid #FCA5A5', borderRadius: '20px',
            padding: '28px', background: '#FEF2F2', textAlign: 'center',
          }} className="animate-scale-in">
            <AlertCircle size={28} style={{ color: '#EF4444', margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 600, color: '#991B1B', marginBottom: '6px' }}>Upload Failed</p>
            <p style={{ fontSize: '13.5px', color: '#B91C1C', marginBottom: '16px' }}>{uploadError}</p>
            <button onClick={onRetry} className="btn btn-primary" style={{ margin: '0 auto' }}>
              Try Again
            </button>
          </div>
        ) : isUploading ? (
          <div style={{
            border: '1.5px solid var(--primary)', borderRadius: '20px',
            padding: '36px 28px', background: 'var(--surface)', textAlign: 'center',
          }} className="animate-scale-in">
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563EB, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              animation: 'spin 1.5s linear infinite',
            }}>
              <UploadCloud size={24} color="white" />
            </div>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              {uploadStatus === 'indexing' ? 'Indexing document…' : 'Uploading…'}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {uploadStatus === 'indexing'
                ? 'Generating embeddings and building vector index'
                : 'Transferring your file to the server'}
            </p>
            <div className="progress-bar" style={{ maxWidth: '320px', margin: '0 auto' }}>
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '8px', fontWeight: 600 }}>
              {uploadProgress}%
            </p>
          </div>
        ) : (
          <div
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{
              width: '60px', height: '60px', borderRadius: '16px',
              background: isDragging
                ? 'linear-gradient(135deg, #2563EB, #8B5CF6)'
                : 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid var(--border)',
              transition: 'all 0.25s ease',
              boxShadow: isDragging ? '0 8px 24px rgba(37,99,235,0.3)' : 'none',
            }}>
              <UploadCloud size={26} color={isDragging ? 'white' : 'var(--primary)'} />
            </div>

            <p style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              {isDragging ? 'Drop your file here' : 'Drag & drop your document'}
            </p>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '0 0 20px' }}>
              or{' '}
              <span style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>
                click to browse
              </span>
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <span className="badge badge-blue">PDF</span>
              <span className="badge badge-gray">TXT</span>
              <span className="badge badge-gray">Max 25MB</span>
            </div>
          </div>
        )}

        {(fileError || (uploadStatus === 'idle' && fileError)) && (
          <div className="animate-fade-in" style={{
            marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 14px', borderRadius: '10px',
            background: '#FEF2F2', border: '1px solid #FCA5A5',
            color: '#991B1B', fontSize: '13px',
          }}>
            <AlertCircle size={15} />
            {fileError}
          </div>
        )}
      </div>

      {/* ── Suggested prompts ── */}
      <div className="animate-fade-slide-in delay-200" style={{ width: '100%', maxWidth: '560px', marginBottom: '40px' }}>
        <p style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', textAlign: 'center' }}>
          Try asking
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p.text}
              onClick={() => onSuggestedPrompt?.(p.text)}
              className="prompt-chip"
            >
              <span>{p.icon}</span>
              {p.text}
            </button>
          ))}
        </div>
      </div>

      {/* ── Feature cards ── */}
      <div className="animate-fade-slide-in delay-300" style={{ width: '100%', maxWidth: '720px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
        }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: `${f.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px', color: f.color,
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                {f.title}
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
