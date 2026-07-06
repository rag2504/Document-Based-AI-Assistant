import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, XCircle, TrendingUp, HelpCircle, ArrowRight } from 'lucide-react';

export default function PresentationEngine({ content, remarkPlugins = [remarkGfm], components = {} }) {
  if (!content) return null;

  // ── 1. Detect Pros & Cons / Advantages & Disadvantages ─────────────────────
  const hasProsCons = content.includes('**Pros:**') || content.includes('**Cons:**') ||
                      content.includes('Advantages:') || content.includes('Disadvantages:');
  if (hasProsCons) {
    const pros = [];
    const cons = [];
    const lines = content.split('\n');
    let capturing = null; // 'pro' | 'con'

    lines.forEach(line => {
      const lower = line.toLowerCase();
      if (lower.includes('pro') || lower.includes('advantage')) capturing = 'pro';
      else if (lower.includes('con') || lower.includes('disadvantage')) capturing = 'con';
      else if (line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim().match(/^\d+\./)) {
        const text = line.replace(/^[-*\d.]+\s*/, '').trim();
        if (capturing === 'pro') pros.push(text);
        if (capturing === 'con') cons.push(text);
      }
    });

    if (pros.length > 0 || cons.length > 0) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--sp-4)', margin: 'var(--sp-4) 0' }}>
          {pros.length > 0 && (
            <motion.div
              style={{
                background: 'rgba(22, 163, 74, 0.03)', border: '1px solid rgba(22, 163, 74, 0.15)',
                borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)', boxShadow: 'var(--s-1)',
              }}
              whileHover={{ y: -2, boxShadow: 'var(--s-2)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <CheckCircle2 size={14} />
                <span>Advantages & Pros</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pros.map((p, i) => (
                  <li key={i} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
          {cons.length > 0 && (
            <motion.div
              style={{
                background: 'rgba(220, 38, 38, 0.03)', border: '1px solid rgba(220, 38, 38, 0.15)',
                borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)', boxShadow: 'var(--s-1)',
              }}
              whileHover={{ y: -2, boxShadow: 'var(--s-2)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontWeight: 700, fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <XCircle size={14} />
                <span>Risks & Cons</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cons.map((c, i) => (
                  <li key={i} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      );
    }
  }

  // ── 2. Detect Statistics / Numbers / Percentages ────────────────────────────
  const statsMatches = [...content.matchAll(/(\d+(?:\.\d+)?%|\b\d+(?:\.\d+)?\s*(?:million|billion|kb|mb|gb|percent)\b)/gi)];
  if (statsMatches.length >= 2) {
    const stats = [];
    const lines = content.split('\n');
    lines.forEach(line => {
      const match = line.match(/(-|\*|\d+\.)\s*(\b[^-*:]+\b)\s*:\s*(\b\d+(?:\.\d+)?%|\b\d+.*?)\b/i) ||
                    line.match(/(-|\*|\d+\.)\s*(\b\d+(?:\.\d+)?%|\b\d+.*?)\s*:\s*(\b[^-*:]+\b)/i);
      if (match) {
        const label = match[1] === ':' ? match[3] : match[2];
        const val = match[1] === ':' ? match[2] : match[3];
        if (label && val) {
          stats.push({ label: label.trim(), value: val.trim() });
        }
      }
    });

    if (stats.length > 0) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--sp-3)', margin: 'var(--sp-4) 0' }}>
          {stats.map((s, idx) => (
            <motion.div
              key={idx}
              style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)', textAlign: 'center',
                boxShadow: 'var(--s-1)',
              }}
              whileHover={{ y: -2, borderColor: 'var(--accent)' }}
            >
              <div style={{ color: 'var(--accent)', fontSize: 'var(--text-xl)', fontWeight: 800, marginBottom: 4 }}>
                {s.value}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      );
    }
  }

  // ── 3. Detect Chronology / Timeline ─────────────────────────────────────────
  const lines = content.split('\n');
  const timelineEvents = [];
  lines.forEach(line => {
    // Matches patterns like "- 1999: Description" or "- In 2004, description"
    const match = line.match(/^[-*\d.]+\s*(?:in\s+)?(\b\d{4}\b)\s*[:-]\s*(.+)$/i) ||
                  line.match(/^[-*\d.]+\s*(?:in\s+)?(\b\d{4}\b)\s+(.+)$/i);
    if (match) {
      timelineEvents.push({ year: match[1].trim(), desc: match[2].trim() });
    }
  });

  if (timelineEvents.length >= 2) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', margin: 'var(--sp-4) 0', paddingLeft: 12, borderLeft: '2px solid var(--accent-light)' }}>
        {timelineEvents.map((ev, i) => (
          <div key={i} style={{ position: 'relative', display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
            <div style={{
              position: 'absolute', left: -18, top: 4, width: 10, height: 10,
              borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--surface)',
            }} />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--accent)', minWidth: 44 }}>
              {ev.year}
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-snug)' }}>
              {ev.desc}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // ── 4. Fallback to standard react-markdown if no presentation patterns match ─
  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
