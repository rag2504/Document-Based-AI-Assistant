import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Network, HelpCircle } from 'lucide-react';

const DEFAULT_NODES = [
  { id: '1', label: 'Primary Topic', type: 'core', x: 220, y: 180 },
  { id: '2', label: 'Key Finding', type: 'concept', x: 100, y: 100 },
  { id: '3', label: 'Conclusion', type: 'concept', x: 340, y: 100 },
  { id: '4', label: 'Statistics', type: 'metric', x: 120, y: 260 },
  { id: '5', label: 'Timeline Event', type: 'entity', x: 320, y: 260 },
];

const DEFAULT_LINKS = [
  { source: '1', target: '2' },
  { source: '1', target: '3' },
  { source: '1', target: '4' },
  { source: '1', target: '5' },
  { source: '2', target: '4' },
  { source: '3', target: '5' },
];

export default function InteractiveGraph({ filename, chunksCount }) {
  const containerRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    // Generate nodes dynamically based on the uploaded document name
    const docWord = filename ? filename.split('.')[0].slice(0, 16) : 'Document';
    const dynamicNodes = [
      { id: 'doc', label: docWord, type: 'core', x: 250, y: 200 },
      { id: 'chunks', label: `${chunksCount || 12} Passages`, type: 'metric', x: 120, y: 110 },
      { id: 'overview', label: 'Summary Overview', type: 'concept', x: 380, y: 120 },
      { id: 'key_points', label: 'Key Objectives', type: 'concept', x: 130, y: 290 },
      { id: 'findings', label: 'Extracted Facts', type: 'entity', x: 360, y: 280 },
      { id: 'metadata', label: 'Structural Layout', type: 'entity', x: 250, y: 70 },
    ];

    const dynamicLinks = [
      { source: 'doc', target: 'chunks' },
      { source: 'doc', target: 'overview' },
      { source: 'doc', target: 'key_points' },
      { source: 'doc', target: 'findings' },
      { source: 'doc', target: 'metadata' },
      { source: 'chunks', target: 'key_points' },
      { source: 'overview', target: 'findings' },
    ];

    setNodes(dynamicNodes);
    setLinks(dynamicLinks);
  }, [filename, chunksCount]);

  const handleDrag = (id, event, info) => {
    // Update node positions dynamically so the link lines follow along
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

  const getLinkCoords = (link) => {
    const sourceNode = nodes.find((n) => n.id === link.source);
    const targetNode = nodes.find((n) => n.id === link.target);
    if (!sourceNode || !targetNode) return { x1: 0, y1: 0, x2: 0, y2: 0 };
    return {
      x1: sourceNode.x,
      y1: sourceNode.y,
      x2: targetNode.x,
      y2: targetNode.y,
    };
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 400,
        background: 'var(--bg-2)',
        borderRadius: 'var(--r-xl)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
      }}
    >
      {/* Background Grid Accent */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      />

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
        {links.map((link, idx) => {
          const coords = getLinkCoords(link);
          const isHighlighted = hoveredNode === link.source || hoveredNode === link.target;
          return (
            <motion.line
              key={idx}
              x1={coords.x1}
              y1={coords.y1}
              x2={coords.x2}
              y2={coords.y2}
              stroke={isHighlighted ? 'var(--accent)' : 'var(--border-strong)'}
              strokeWidth={isHighlighted ? 2 : 1}
              strokeDasharray={isHighlighted ? '0' : '4 4'}
              opacity={isHighlighted ? 0.8 : 0.4}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node) => {
        const isHovered = hoveredNode === node.id;
        const color =
          node.type === 'core'
            ? 'var(--accent)'
            : node.type === 'metric'
            ? '#10b981'
            : node.type === 'concept'
            ? '#f59e0b'
            : '#8b5cf6';

        return (
          <motion.div
            key={node.id}
            drag
            dragConstraints={containerRef}
            dragElastic={0.1}
            dragMomentum={false}
            onDrag={(e, info) => handleDrag(node.id, e, info)}
            onHoverStart={() => setHoveredNode(node.id)}
            onHoverEnd={() => setHoveredNode(null)}
            style={{
              position: 'absolute',
              left: node.x,
              top: node.y,
              transform: 'translate(-50%, -50%)',
              zIndex: isHovered ? 20 : 10,
              cursor: 'grab',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.96, cursor: 'grabbing' }}
          >
            {/* Holographic Glowing node circle */}
            <div
              style={{
                width: node.type === 'core' ? 28 : 20,
                height: node.type === 'core' ? 28 : 20,
                borderRadius: '50%',
                background: color,
                border: '3px solid var(--surface)',
                boxShadow: isHovered
                  ? `0 0 16px ${color}, var(--s-3)`
                  : `0 0 8px ${color}80, var(--s-1)`,
                transition: 'box-shadow 0.2s ease',
              }}
            />

            {/* Label box */}
            <div
              style={{
                marginTop: 6,
                padding: '3px 8px',
                borderRadius: 'var(--r-sm)',
                background: 'var(--surface-raised)',
                border: isHovered ? '1px solid var(--accent)' : '1px solid var(--border)',
                boxShadow: 'var(--s-1)',
                fontSize: 'var(--text-2xs)',
                fontWeight: 600,
                color: isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                userSelect: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {node.label}
            </div>
          </motion.div>
        );
      })}

      {/* Floating Mode Info */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-full)',
          padding: '4px 10px',
          fontSize: 'var(--text-2xs)',
          color: 'var(--text-muted)',
          zIndex: 30,
        }}
      >
        <Network size={10} />
        <span>Drag nodes to map connections</span>
      </div>
    </div>
  );
}
