import React, { useState } from 'react';

export default function ApiKeySetup({ onComplete }) {
  const [unsplashKey, setUnsplashKey] = useState('');
  const [pexelsKey, setPexelsKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!unsplashKey.trim() && !pexelsKey.trim()) {
      setError('Please enter at least one API key to continue.');
      return;
    }
    // Persist to localStorage
    if (unsplashKey.trim()) localStorage.setItem('unsplash_key', unsplashKey.trim());
    if (pexelsKey.trim()) localStorage.setItem('pexels_key', pexelsKey.trim());
    onComplete({ unsplashKey: unsplashKey.trim(), pexelsKey: pexelsKey.trim() });
  };

  const handleSkip = () => {
    onComplete({ unsplashKey: '', pexelsKey: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(#09090b 1px, transparent 1px),
            linear-gradient(90deg, #09090b 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md mx-6">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-5 h-5 bg-zinc-950 rounded-sm" />
            <span className="text-[11px] font-title tracking-[0.2em] uppercase text-zinc-400">
              Infinite Canvas
            </span>
          </div>
          <h1 className="text-3xl font-title font-semibold text-zinc-950 tracking-tight leading-tight mb-2">
            Connect your design feeds
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Add API keys to populate the canvas with live design inspiration from Unsplash and Pexels.
            Both are free — no credit card required.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Unsplash */}
          <div className="group">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-title font-semibold tracking-widest uppercase text-zinc-950">
                Unsplash Access Key
              </label>
              <a
                href="https://unsplash.com/developers"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-zinc-400 hover:text-zinc-700 transition-colors tracking-wide"
              >
                Get free key →
              </a>
            </div>
            <input
              type="text"
              value={unsplashKey}
              onChange={(e) => { setUnsplashKey(e.target.value); setError(''); }}
              placeholder="AbCdEfGh1234…"
              className="w-full px-3.5 py-2.5 text-sm font-mono bg-zinc-50 border border-zinc-200 rounded text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-950 transition-colors"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* Pexels */}
          <div className="group">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-title font-semibold tracking-widest uppercase text-zinc-950">
                Pexels API Key
              </label>
              <a
                href="https://www.pexels.com/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-zinc-400 hover:text-zinc-700 transition-colors tracking-wide"
              >
                Get free key →
              </a>
            </div>
            <input
              type="text"
              value={pexelsKey}
              onChange={(e) => { setPexelsKey(e.target.value); setError(''); }}
              placeholder="563492ad6f917…"
              className="w-full px-3.5 py-2.5 text-sm font-mono bg-zinc-50 border border-zinc-200 rounded text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-950 transition-colors"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 tracking-wide">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-zinc-950 text-white text-[11px] font-title font-semibold tracking-widest uppercase rounded hover:bg-zinc-800 active:bg-zinc-900 transition-colors"
            >
              Start Exploring
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2.5 text-[11px] font-title font-semibold tracking-widest uppercase text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              Skip
            </button>
          </div>
        </form>

        {/* Footer note */}
        <p className="mt-8 text-[10px] text-zinc-300 tracking-wide">
          Keys are stored locally in your browser. They are never sent to any server.
        </p>
      </div>
    </div>
  );
}
