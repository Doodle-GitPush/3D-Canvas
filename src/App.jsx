import React, { useEffect, useRef, useState } from 'react';
import { SpaceScene } from './scene/SpaceScene';
import { clusters } from './scene/clusters';
import Inspector from './components/Inspector';
import ClusterLabels from './components/ClusterLabels';
import SubmitToolModal from './components/SubmitToolModal';
import { Compass, Plus, Minus } from 'lucide-react';

export default function App() {
  const canvasRef = useRef(null);
  const spaceSceneRef = useRef(null);

  // Use a ref (not state) for cluster data — updated at 60fps via direct DOM
  const clusterDataRef = useRef(clusters.map(c => ({
    id: c.id,
    name: c.name,
    accent: c.accent,
    screenX: window.innerWidth / 2,
    screenY: window.innerHeight / 2,
    opacity: 0,
    toolCount: 0,
    position: c.position,
  })));

  const [focusedCardData, setFocusedCardData] = useState(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [currentCluster, setCurrentCluster] = useState('AI Tools');

  useEffect(() => {
    if (!canvasRef.current) return;

    const callbacks = {
      onCardFocus: (data) => {
        setFocusedCardData(data);
        setIsSubmitOpen(false);
      },
      onCardUnfocus: () => setFocusedCardData(null),

      // Called every frame — update ref directly, no React state
      onClusterUpdate: (data) => {
        clusterDataRef.current = data;

        // Find nearest cluster for header indicator (cheap enough to setState)
        const nearest = data.reduce((a, b) => a.dist < b.dist ? a : b, data[0]);
        if (nearest && nearest.dist < 200) {
          setCurrentCluster(nearest.name);
        }
      },
    };

    const space = new SpaceScene(canvasRef.current, callbacks);
    spaceSceneRef.current = space;

    return () => space.destroy();
  }, []);

  const handleTeleportToCluster = (position) => {
    const scene = spaceSceneRef.current;
    if (!scene) return;
    scene.unfocusCard?.();
    scene.targetCameraX = position.x;
    scene.targetCameraY = position.y;
    scene.targetCameraZ = position.z + 80; // Approach from in front
  };

  const handleCloseInspector = () => {
    spaceSceneRef.current?.unfocusCard();
  };

  const handleTeleportToCard = () => {
    const scene = spaceSceneRef.current;
    if (!scene?.focusedCard) return;
    const pos = scene.focusedCard.meshGroup.position;
    scene.unfocusCard();
    scene.targetCameraX = pos.x;
    scene.targetCameraY = pos.y;
    scene.targetCameraZ = pos.z + 16;
  };

  const handleZoomIn = () => {
    spaceSceneRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    spaceSceneRef.current?.zoomOut();
  };

  const handleSubmitTool = (toolData) => {
    const scene = spaceSceneRef.current;
    if (!scene) return;

    const spawnedCard = scene.clusterManager.addUserTool(
      toolData,
      scene.cameraX,
      scene.cameraY,
      scene.cameraZ
    );

    // Focus on the newly spawned card
    setTimeout(() => {
      scene.focusOnCard?.(spawnedCard);
    }, 600);
  };

  return (
    <div className="relative w-screen h-screen bg-white overflow-hidden">
      {/* Three.js canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="react-overlay fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-3 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Wordmark */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-zinc-950 rounded-sm flex items-center justify-center">
              <Compass className="w-3 h-3 text-white" />
            </div>
            <span className="text-[13px] font-title font-bold text-zinc-950 tracking-tight">
              Toolscape
            </span>
          </div>

          {/* Current cluster indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-200">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
            <span className="text-[9.5px] font-title font-semibold uppercase tracking-widest text-zinc-500">
              {currentCluster}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-[9.5px] font-title uppercase tracking-widest text-zinc-400">
            Zoom out to explore clusters
          </span>
          <button
            onClick={() => setIsSubmitOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-950 text-white text-[10.5px] font-title font-bold uppercase tracking-widest hover:bg-zinc-800 active:scale-[0.98] transition-all"
          >
            <Plus className="w-3 h-3" />
            Submit Tool
          </button>
        </div>
      </header>

      {/* ── Cluster Labels (60fps DOM-managed overlay) ──────────────────────── */}
      <ClusterLabels
        clusterDataRef={clusterDataRef}
        onTeleport={handleTeleportToCluster}
      />

      {/* ── Inspector ───────────────────────────────────────────────────────── */}
      <Inspector
        cardData={focusedCardData}
        onClose={handleCloseInspector}
        onTeleport={handleTeleportToCard}
      />

      {/* ── Submit Tool Modal ────────────────────────────────────────────────── */}
      <SubmitToolModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSubmit={handleSubmitTool}
      />

      {/* ── Bottom hint ─────────────────────────────────────────────────────── */}
      {!focusedCardData && (
        <div className="react-overlay fixed bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-zinc-950/90 text-white border border-zinc-800 shadow-sm flex items-center gap-2 text-[9px] font-title uppercase tracking-widest pointer-events-none select-none backdrop-blur-sm">
          <span>Pinch to zoom</span>
          <span className="text-zinc-600">·</span>
          <span>Drag to explore</span>
          <span className="text-zinc-600">·</span>
          <span>Click card to inspect</span>
        </div>
      )}

      {/* ── Zoom Controls ───────────────────────────────────────────────────── */}
      <div className="react-overlay fixed bottom-4 right-4 z-40 flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-md bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 active:scale-95 transition-all cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-md bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 active:scale-95 transition-all cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
