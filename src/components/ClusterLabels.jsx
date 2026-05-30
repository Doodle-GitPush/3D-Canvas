import React, { useRef, useEffect } from 'react';

/**
 * ClusterLabels — floating HTML labels for each cluster zone.
 * Uses direct DOM manipulation (not React state) for 60fps performance.
 */
export default function ClusterLabels({ clusterDataRef, onTeleport }) {
  const containerRef = useRef(null);
  const labelRefs = useRef({});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // The parent updates clusterDataRef.current each frame.
    // We poll via rAF to update DOM directly — no React re-renders.
    let rafId;

    const tick = () => {
      const data = clusterDataRef.current;
      if (!data) { rafId = requestAnimationFrame(tick); return; }

      for (const cluster of data) {
        let el = labelRefs.current[cluster.id];
        if (!el) continue;

        const op = cluster.opacity;
        const visible = op > 0.01;

        el.style.opacity = op.toFixed(3);
        el.style.display = visible ? 'flex' : 'none';

        if (visible) {
          el.style.transform = `translate(-50%, -50%) scale(${0.85 + op * 0.15})`;
          el.style.left = `${cluster.screenX}px`;
          el.style.top = `${cluster.screenY}px`;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [clusterDataRef]);

  // Initial cluster data from ref for rendering label elements
  const initialData = clusterDataRef.current || [];

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 z-30">
      {initialData.map(cluster => (
        <button
          key={cluster.id}
          ref={el => { labelRefs.current[cluster.id] = el; }}
          onClick={() => onTeleport(cluster.position)}
          className="pointer-events-auto absolute flex flex-col items-center gap-1.5 cursor-pointer group"
          style={{
            left: cluster.screenX,
            top: cluster.screenY,
            transform: 'translate(-50%, -50%)',
            opacity: 0,
            display: 'none',
          }}
        >
          {/* Cluster label pill */}
          <div
            className="px-3 py-1.5 rounded-full border shadow-sm flex items-center gap-2 text-[11px] font-title font-semibold tracking-widest uppercase backdrop-blur-sm transition-all group-hover:scale-105"
            style={{
              background: cluster.accent?.bg || '#f4f4f5',
              borderColor: cluster.accent?.badge + '40' || '#e4e4e7',
              color: cluster.accent?.badge || '#09090b',
            }}
          >
            <span>{cluster.accent?.emoji || '●'}</span>
            <span>{cluster.name}</span>
          </div>

          {/* Tool count badge */}
          <span className="text-[9px] font-title font-bold uppercase tracking-wider text-zinc-400">
            {cluster.toolCount} tools
          </span>

          {/* Connector dot */}
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: cluster.accent?.badge || '#09090b', opacity: 0.4 }}
          />
        </button>
      ))}
    </div>
  );
}
