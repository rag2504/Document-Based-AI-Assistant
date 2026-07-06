import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Eye, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getSessionId() {
  return localStorage.getItem('docai_session') || '';
}

export default function DocumentReader({ filename, hoveredCitationId, activeId }) {
  const containerRef = useRef(null);
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chunkRefs = useRef({});

  // Fetch document chunks from the backend
  useEffect(() => {
    async function fetchChunks() {
      if (!filename) return;
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE}/document/chunks`, {
          params: { filename },
          headers: { 'x-session-id': getSessionId() }
        });
        
        if (response.data.success) {
          const formattedChunks = response.data.chunks.map(c => ({
            id: c.chunk_id,
            page: c.page_number,
            text: c.content
          }));
          setChunks(formattedChunks);
        }
      } catch (err) {
        console.error('Failed to load chunks', err);
        setError('Could not load document data');
      } finally {
        setLoading(false);
      }
    }
    fetchChunks();
  }, [filename]);

  // Handle auto-scroll when hoveredCitationId changes
  useEffect(() => {
    if (hoveredCitationId && chunkRefs.current[hoveredCitationId]) {
      chunkRefs.current[hoveredCitationId].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [hoveredCitationId]);

  // Fallback placeholder if no chunks are fetched
  const renderChunks = chunks.length > 0 ? chunks : [
    { id: 'chunk_1', page: 1, text: 'This document outline represents the primary structural nodes of your uploaded intelligence asset. RAG scans this information to construct grounded answers.' },
    { id: 'chunk_2', page: 1, text: 'Section 1: Conceptual Architecture. The system uses a bi-directional reference map connecting the document canvas on the left to the LLM workspace on the right.' },
    { id: 'chunk_3', page: 2, text: 'Section 2: High-Performance Vector Retrieval. Document passages are encoded into 384-dimensional vectors stored inside Supabase using the pgvector extension.' },
    { id: 'chunk_4', page: 3, text: 'Section 3: Generative Modeling. Groq Llama 3 models are called with contextual prompts to construct precise, cited answers.' }
  ];

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        background: 'var(--bg-2)',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--border)',
        padding: 'var(--sp-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-6)',
        position: 'relative',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)', paddingBottom: 'var(--sp-3)',
        marginBottom: 'var(--sp-1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <FileText size={14} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Document Reader
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
          <Eye size={11} />
          <span>Bi-directional</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <span className="spinner" style={{ width: 24, height: 24 }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
          {renderChunks.map((chunk, index) => {
            const isHovered = hoveredCitationId === chunk.id;
            return (
              <motion.div
                key={chunk.id || index}
                ref={el => chunkRefs.current[chunk.id] = el}
                animate={{
                  borderColor: isHovered ? 'var(--accent)' : 'var(--border)',
                  boxShadow: isHovered ? 'var(--s-3), 0 0 12px var(--accent-subtle)' : 'var(--s-1)',
                  scale: isHovered ? 1.01 : 1,
                }}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  padding: 'var(--sp-4) var(--sp-5)',
                  transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                  position: 'relative',
                }}
              >
                {/* Page ribbon — grid-aligned inset */}
                <div style={{
                  position: 'absolute',
                  top: 'var(--sp-2)',
                  right: 'var(--sp-2)',
                  fontSize: 'var(--text-2xs)',
                  color: 'var(--text-muted)',
                  fontWeight: 650,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-full)',
                  padding: '2px 8px',
                }}>
                  P. {chunk.page || 1}
                </div>

                <p style={{
                  fontSize: 'var(--text-sm)',
                  lineHeight: 'var(--leading-relaxed)',
                  color: isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                  margin: 0,
                }}>
                  {chunk.text}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
