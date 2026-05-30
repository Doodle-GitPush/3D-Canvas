import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SpaceScene } from './scene/SpaceScene';
import { DesignFeed } from './services/DesignFeed';
import { CLUSTERS } from './scene/ClusterConfig';
import Header from './components/Header';
import Inspector from './components/Inspector';
import AddInspirationModal from './components/AddInspirationModal';
import ApiKeySetup from './components/ApiKeySetup';
import { HelpCircle } from 'lucide-react';

export default function App() {
  const canvasRef = useRef(null);
  const spaceSceneRef = useRef(null);
  const designFeedRef = useRef(null);

  const [focusedCardData, setFocusedCardData] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [hud, setHud] = useState({ percent: '0.0%', depth: '0m' });

  // Cluster label DOM refs — updated directly by SpaceScene each frame (no React state)
  const clusterLabelRefs = useRef({});

  // Show setup screen if no keys found in localStorage
  const [showSetup, setShowSetup] = useState(() => {
    const u = localStorage.getItem('unsplash_key');
    const p = localStorage.getItem('pexels_key');
    return !u && !p;
  });

  // Stable callback — directly mutates DOM so 60fps updates don't trigger React re-renders
  const handleClusterUpdate = useCallback((clusters) => {
    for (const c of clusters) {
      const el = clusterLabelRefs.current[c.id];
      if (!el) continue;
      el.style.opacity = c.opacity;
      el.style.transform = `translate(${c.x}px, ${c.y}px) translate(-50%, -50%)`;
    }
  }, []);

  const initScene = (keys) => {
    if (!canvasRef.current) return;

    // Teardown any existing scene
    if (spaceSceneRef.current) {
      spaceSceneRef.current.destroy();
    }

    // Build DesignFeed with provided keys (may be empty strings if skipped)
    const feed = new DesignFeed({
      unsplashKey: keys.unsplashKey || '',
      pexelsKey: keys.pexelsKey || '',
    });
    designFeedRef.current = feed;

    const callbacks = {
      onCardFocus: (data) => {
        setFocusedCardData(data);
        setIsAddOpen(false);
      },
      onCardUnfocus: () => setFocusedCardData(null),
      onHUDUpdate: (hudData) => setHud(hudData),
      onClusterUpdate: handleClusterUpdate,
    };

    const space = new SpaceScene(canvasRef.current, callbacks, feed);
    spaceSceneRef.current = space;
  };

  // On mount: if keys already exist, boot the scene immediately
  useEffect(() => {
    if (!showSetup) {
      const u = localStorage.getItem('unsplash_key') || '';
      const p = localStorage.getItem('pexels_key') || '';
      initScene({ unsplashKey: u, pexelsKey: p });
    }

    return () => {
      if (spaceSceneRef.current) spaceSceneRef.current.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetupComplete = (keys) => {
    setShowSetup(false);
    initScene(keys);
  };

  const handleCloseInspector = () => {
    if (spaceSceneRef.current) spaceSceneRef.current.unfocusCard();
  };

  const handleTeleport = () => {
    if (spaceSceneRef.current && spaceSceneRef.current.focusedCard) {
      const card = spaceSceneRef.current.focusedCard;
      spaceSceneRef.current.unfocusCard();
      spaceSceneRef.current.targetCameraX = card.meshGroup.position.x;
      spaceSceneRef.current.targetCameraY = card.meshGroup.position.y;
      spaceSceneRef.current.targetCameraZ = card.meshGroup.position.z + 16.0;
    }
  };

  const handleAddSubmit = (itemData) => {
    if (spaceSceneRef.current) {
      const spawnedCard = spaceSceneRef.current.cardManager.addNewInspiration(
        itemData,
        spaceSceneRef.current.cameraX,
        spaceSceneRef.current.cameraY,
        spaceSceneRef.current.cameraZ
      );
      setTimeout(() => spaceSceneRef.current.focusOnCard(spawnedCard), 500);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#ffffff]">
      {/* API Key Setup overlay */}
      {showSetup && <ApiKeySetup onComplete={handleSetupComplete} />}

      {/* Three.js Canvas */}
      <canvas ref={canvasRef} />

      {!showSetup && (
        <>
          <Header
            onAddClick={() => setIsAddOpen(true)}
            depthText={hud.depth}
            scrollPercent={hud.percent}
          />

          <Inspector
            cardData={focusedCardData}
            onClose={handleCloseInspector}
            onTeleport={handleTeleport}
          />

          <AddInspirationModal
            isOpen={isAddOpen}
            onClose={() => setIsAddOpen(false)}
            onSubmit={handleAddSubmit}
          />

          {/* Cluster area labels — always mounted, positions driven by SpaceScene each frame */}
          {CLUSTERS.map(cluster => (
            <div
              key={cluster.id}
              ref={el => { clusterLabelRefs.current[cluster.id] = el; }}
              className="react-overlay fixed top-0 left-0 pointer-events-none select-none flex flex-col items-center gap-1"
              style={{ opacity: 0, transform: 'translate(-50%, -50%)', willChange: 'transform, opacity' }}
            >
              <div className="w-8 h-px bg-zinc-400 mb-0.5" />
              <span className="text-[9px] font-title font-bold uppercase tracking-[0.22em] text-zinc-950 whitespace-nowrap">
                {cluster.label}
              </span>
              <span className="text-[7.5px] font-title uppercase tracking-[0.18em] text-zinc-400 whitespace-nowrap">
                {cluster.sublabel}
              </span>
            </div>
          ))}

          {!focusedCardData && (
            <div className="react-overlay fixed bottom-4 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded bg-zinc-950 text-white border border-zinc-900 shadow-sm flex items-center gap-1.5 text-[9.5px] uppercase font-title tracking-widest pointer-events-none select-none">
              <HelpCircle className="w-3 h-3 text-zinc-400" />
              <span>Pinch to zoom · Drag to explore · Click card to focus · Zoom out to reveal clusters</span>
            </div>
          )}

          {/* Settings link to re-enter API keys */}
          <button
            onClick={() => {
              localStorage.removeItem('unsplash_key');
              localStorage.removeItem('pexels_key');
              setShowSetup(true);
            }}
            className="react-overlay fixed bottom-4 right-4 px-2 py-1.5 rounded text-[9px] font-title tracking-widest uppercase text-zinc-300 hover:text-zinc-600 transition-colors"
          >
            API Keys
          </button>
        </>
      )}
    </div>
  );
}
