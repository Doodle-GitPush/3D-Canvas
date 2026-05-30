import React, { useState } from 'react';
import { X, Heart, ArrowUpRight, ExternalLink, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Inspector({ cardData, onClose, onTeleport }) {
  const [upvotes, setUpvotes] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  React.useEffect(() => {
    if (cardData) {
      setUpvotes(cardData.upvotes || 0);
      setHasUpvoted(false);
    }
  }, [cardData]);

  if (!cardData) return null;

  const accent = cardData.accent;

  const handleUpvote = () => {
    if (!hasUpvoted) {
      setUpvotes(v => v + 1);
      setHasUpvoted(true);
    }
  };

  return (
    <aside className="react-overlay fixed top-[68px] bottom-3 right-3 z-40 w-[340px] rounded-2xl bg-white/90 backdrop-blur-md border border-zinc-200 shadow-lg flex flex-col overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          {accent && (
            <span
              className="text-[9px] font-title font-bold uppercase tracking-widest px-2 py-1 rounded-md"
              style={{ background: accent.bg, color: accent.badge }}
            >
              {accent.emoji} {accent.label}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Logo / Image area */}
        <div
          className="w-full h-40 flex items-center justify-center relative overflow-hidden"
          style={{ background: accent?.bg || '#f8f8f8' }}
        >
          {/* Dot grid */}
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle, ${accent?.badge || '#09090b'} 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />
          {cardData.imageUrl ? (
            <div className="relative z-10 w-20 h-20 rounded-2xl overflow-hidden shadow-lg bg-white flex items-center justify-center">
              <img
                src={cardData.imageUrl}
                alt={cardData.name}
                className="w-full h-full object-contain"
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
          ) : (
            <div
              className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: accent?.badge || '#09090b' }}
            >
              <span className="text-3xl">{accent?.emoji || '🛠'}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Name + tagline */}
          <div>
            <h2 className="text-[16px] font-title font-bold text-zinc-950 tracking-tight leading-tight">
              {cardData.name}
            </h2>
            <p className="text-[12.5px] text-zinc-500 mt-1 leading-relaxed">
              {cardData.tagline}
            </p>
          </div>

          {/* Meta */}
          <div className="flex flex-col gap-1.5 text-[11px] border-t border-b border-zinc-100 py-2.5">
            <div className="flex justify-between">
              <span className="text-zinc-400 font-title uppercase text-[9.5px] tracking-wider">Creator</span>
              <span className="text-zinc-950 font-semibold">{cardData.creator || '—'}</span>
            </div>
            {cardData.url && (
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 font-title uppercase text-[9.5px] tracking-wider">URL</span>
                <a
                  href={cardData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-600 hover:text-zinc-950 transition-colors flex items-center gap-1 font-mono text-[10px] max-w-[160px] truncate"
                >
                  {cardData.url.replace(/^https?:\/\/(www\.)?/, '')}
                  <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                </a>
              </div>
            )}
          </div>

          {/* Tags */}
          {cardData.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {cardData.tags.map(tag => (
                <span
                  key={tag}
                  className="text-[9px] font-title font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                  style={{
                    background: accent?.bg || '#f4f4f5',
                    color: accent?.badge || '#71717a',
                    borderColor: accent?.badge + '30' || '#e4e4e7',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-zinc-100 grid grid-cols-2 gap-2">
        <button
          onClick={handleUpvote}
          disabled={hasUpvoted}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-zinc-200 text-[10.5px] font-title font-bold uppercase tracking-wider transition-all hover:border-zinc-400 disabled:opacity-60"
          style={hasUpvoted ? { background: accent?.bg, borderColor: accent?.badge + '40', color: accent?.badge } : {}}
        >
          <Heart className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-current' : ''}`} />
          <span>{upvotes.toLocaleString()}</span>
        </button>

        <a
          href={cardData.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10.5px] font-title font-bold uppercase tracking-wider text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: accent?.badge || '#09090b' }}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Try Tool</span>
        </a>
      </div>
    </aside>
  );
}
