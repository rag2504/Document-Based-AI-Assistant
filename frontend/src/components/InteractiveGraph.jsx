import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, FileText, Target, BarChart3, Fingerprint } from 'lucide-react';

const NODE_TYPES = {
  core: { color: 'var(--accent)', icon: FileText, size: 48 },
  metric: { color: '#10b981', icon: BarChart3, size: 36 },
  concept: { color: '#f59e0b', icon: Target, size: 36 },
  entity: { color: '#8b5cf6', icon: Fingerprint, size: 36 },
};

export default function InteractiveGraph({ filename, chunksCount }) {
  const containerRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [draggingNode, setDraggingNode] = useState(null);

  useEffect(() => {
    const docWord = filename ? filename.split('.')[0].slice(0, 15) : 'Document';
    const cx = 144; // Center X for ~288px panel
    const cy = 160; // Center Y

    // Orbital layout
    const dynamicNodes = [
      { id: 'doc', label: docWord, type: 'core', x: cx, y: cy },
      { id: 'chunks', label: `${chunksCount || 12} Chunks`, type: 'metric', x: cx - 75, y: cy - 75 },
      { id: 'overview', label: 'Summary', type: 'concept', x: cx + 75, y: cy - 75 },
      { id: 'key_points', label: 'Objectives', type: 'concept', x: cx - 75, y: cy + 75 },
      { id: 'findings', label: 'Entities', type: 'entity', x: cx + 75, y: cy + 75 },
    ];

    const dynamicLinks = [
      { source: 'doc', target: 'chunks' },
      { source: 'doc', target: 'overview' },
      { source: 'doc', target: 'key_points' },
      { source: 'doc', target: 'findings' },
      { source: 'chunks', target: 'key_points' },
      { source: 'overview', target: 'findings' },
    ];

    setNodes(dynamicNodes);
    setLinks(dynamicLinks);
  }, [filename, chunksCount]);

  const handlePan = (id, info) => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            x: node.x + info.delta.x,
            y: node.y + info.delta.y,
          };
        }
        return node;
      })
    );
  };

  const getLinkPath = (link) => {
    const sourceNode = nodes.find((n) => n.id === link.source);
    const targetNode = nodes.find((n) => n.id === link.target);
    if (!sourceNode || !targetNode) return '';
    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    // Elegant organic bezier curve
    return `M ${sourceNode.x} ${sourceNode.y} C ${sourceNode.x + dx / 2} ${sourceNode.y}, ${sourceNode.x + dx / 2} ${targetNode.y}, ${targetNode.x} ${targetNode.y}`;
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 320,
        background: 'linear-gradient(145deg, var(--bg-2) 0%, var(--bg) 100%)',
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)',
      }}
    >
      {/* Dynamic Grid Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(var(--border-strong) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.4,
          pointerEvents: 'none',
        }}
      />
      
      {/* Subtle Glows */}
      <div style={{ position: 'absolute', top: -50, left: -50, width: 150, height: 150, background: 'var(--accent)', opacity: 0.1, filter: 'blur(40px)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -50, right: -50, width: 150, height: 150, background: '#10b981', opacity: 0.08, filter: 'blur(40px)', borderRadius: '50%', pointerEvents: 'none' }} />

      {/* Connection Links (SVG) */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        <defs>
          <linearGradient id="link-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--text-muted)" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {links.map((link, idx) => {
          const isHighlighted = hoveredNode === link.source || hoveredNode === link.target;
          return (
            <motion.path
              key={idx}
              d={getLinkPath(link)}
              fill="none"
              stroke={isHighlighted ? 'url(#link-grad)' : 'var(--border-strong)'}
              strokeWidth={isHighlighted ? 2.5 : 1.5}
              strokeLinecap="round"
              opacity={isHighlighted ? 1 : 0.4}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: isHighlighted ? 1 : 0.4 }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: idx * 0.1 }}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      <AnimatePresence>
        {nodes.map((node, idx) => {
          const isHovered = hoveredNode === node.id || draggingNode === node.id;
          const nodeConf = NODE_TYPES[node.type] || NODE_TYPES.concept;
          const Icon = nodeConf.icon;
          
          return (
            <motion.div
              key={node.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                scale: { type: 'spring', delay: idx * 0.1 },
                opacity: { delay: idx * 0.1 }
              }}
              onPan={(e, info) => handlePan(node.id, info)}
              onPanStart={() => setDraggingNode(node.id)}
              onPanEnd={() => setDraggingNode(null)}
              onHoverStart={() => setHoveredNode(node.id)}
              onHoverEnd={() => setHoveredNode(null)}
              style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
                transform: 'translate(-50%, -50%)',
                zIndex: isHovered ? 20 : 10,
                cursor: draggingNode === node.id ? 'grabbing' : 'grab',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'none'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Node Icon Container */}
              <div
                style={{
                  width: nodeConf.size,
                  height: nodeConf.size,
                  borderRadius: '50%',
                  background: node.type === 'core' ? `linear-gradient(135deg, ${nodeConf.color}, #a78bfa)` : 'var(--surface)',
                  border: node.type === 'core' ? 'none' : `1.5px solid ${nodeConf.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isHovered
                    ? `0 8px 24px ${nodeConf.color}60, inset 0 2px 4px rgba(255,255,255,0.3)`
                    : `0 4px 12px ${nodeConf.color}30, inset 0 2px 4px rgba(255,255,255,0.1)`,
                  color: node.type === 'core' ? '#fff' : nodeConf.color,
                  position: 'relative',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.3s ease',
                }}
              >
                <Icon size={node.type === 'core' ? 22 : 16} strokeWidth={2.5} />
                
                {/* Ping animation for core node */}
                {node.type === 'core' && (
                  <motion.div
                    animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      background: nodeConf.color,
                      zIndex: -1,
                    }}
                  />
                )}
              </div>

              {/* Label */}
              <div
                style={{
                  position: 'absolute',
                  top: nodeConf.size / 2 + 8,
                  padding: '4px 10px',
                  borderRadius: 'var(--r-full)',
                  background: isHovered ? 'var(--surface)' : 'var(--surface-2)',
                  border: `1px solid ${isHovered ? nodeConf.color : 'var(--border)'}`,
                  boxShadow: isHovered ? 'var(--s-2)' : 'var(--s-1)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(8px)',
                  letterSpacing: '0.02em',
                }}
              >
                {node.label}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Floating Mode Info */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-full)',
          padding: '6px 12px',
          fontSize: '10px',
          fontWeight: 600,
          color: 'var(--text-muted)',
          zIndex: 30,
          boxShadow: 'var(--s-1)',
          backdropFilter: 'blur(12px)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        <Network size={12} />
        <span>Interactive Map</span>
      </div>
    </div>
  );
}
