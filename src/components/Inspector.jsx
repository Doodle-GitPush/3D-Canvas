import React, { useState } from 'react';
import { X, Heart, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Inspector({ cardData, onClose, onTeleport }) {
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // Sync likes when cardData changes
  React.useEffect(() => {
    if (cardData) {
      setLikes(cardData.likes || 0);
      setIsLiked(false);
    }
  }, [cardData]);

  if (!cardData) return null;

  const handleLike = () => {
    if (!isLiked) {
      setLikes(prev => prev + 1);
      cardData.likes = (cardData.likes || 0) + 1;
      setIsLiked(true);
    }
  };

  return (
    <aside className="react-overlay fixed top-[68px] bottom-3 right-3 z-40 w-[340px] rounded-2xl bg-white/80 backdrop-blur-md border border-border shadow-sm flex flex-col p-4 transition-all duration-500 ease-out anim-pulse-border">
      {/* Top Drawer Controls */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-3">
        <span className="text-[10px] font-title font-bold text-muted-foreground uppercase tracking-widest">
          Catalog Inspector
        </span>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground hover:text-foreground rounded-lg h-6 w-6"
          aria-label="Close Inspector"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3">
        {/* Dynamic Media Container */}
        <div className="w-full aspect-[16/11] rounded-xl border border-zinc-100 overflow-hidden bg-zinc-50 flex items-center justify-center relative">
          {(cardData.type === 'image' || cardData.type === 'api-image') ? (
            <img
              src={cardData.imageUrl || cardData.url}
              alt={cardData.title}
              className="w-full h-full object-cover hover:scale-[1.02] transition-all duration-500"
            />
          ) : (
            <div className="p-4 text-center font-sans italic text-xs leading-relaxed text-zinc-950 font-light border-l-2 border-zinc-950 bg-white shadow-sm max-w-[85%]">
              “{cardData.text}”
              <span className="block not-italic text-[9.5px] font-title font-bold uppercase tracking-wider text-zinc-400 mt-2">
                — {cardData.author}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <div>
            {cardData.source ? (
              <span
                className="inline-block text-[9.5px] font-title font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border"
                style={{
                  background: cardData.source === 'unsplash' ? '#f4f4f5' : '#e6faf6',
                  color: cardData.source === 'unsplash' ? '#09090b' : '#05A081',
                  borderColor: cardData.source === 'unsplash' ? '#e4e4e7' : '#a7f3e0',
                }}
              >
                {cardData.source === 'unsplash' ? 'Unsplash' : 'Pexels'}
              </span>
            ) : (
              <span className="inline-block text-[9.5px] font-title font-bold text-zinc-500 uppercase tracking-wider bg-zinc-100/80 px-2 py-0.5 rounded-lg border border-zinc-200/50">
                {cardData.category || 'Inspiration'}
              </span>
            )}
            <h2 className="text-[13px] font-bold text-zinc-950 mt-1.5 tracking-tight font-title">
              {cardData.title || cardData.query || 'Design'}
            </h2>
          </div>

          <p className="text-[11.5px] leading-relaxed text-zinc-500 font-light">
            {cardData.description || cardData.query || ''}
          </p>

          {/* Metadata rows */}
          <div className="border-t border-b border-zinc-100 py-2 my-1 flex flex-col gap-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-400 font-light font-title uppercase text-[9.5px] tracking-wider">Photographer</span>
              <span className="text-zinc-950 font-medium">{cardData.author || '—'}</span>
            </div>
            {cardData.source && (
              <div className="flex justify-between">
                <span className="text-zinc-400 font-light font-title uppercase text-[9.5px] tracking-wider">Source</span>
                <span className="text-zinc-950 font-medium capitalize">{cardData.source}</span>
              </div>
            )}
            {!cardData.source && (
              <div className="flex justify-between">
                <span className="text-zinc-400 font-light font-title uppercase text-[9.5px] tracking-wider">Coordinates</span>
                <span className="text-zinc-950 font-medium font-title text-[10.5px]">{cardData.date}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 border-t border-zinc-100 pt-3">
        <Button
          onClick={handleLike}
          variant={isLiked ? "ghost" : "outline"}
          size="sm"
          disabled={isLiked}
          className="flex items-center justify-center gap-1 font-title font-bold text-[10px] uppercase tracking-wider h-8 rounded-xl border border-border"
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-muted-foreground text-muted-foreground' : 'text-zinc-950'}`} />
          <span>{likes} Likes</span>
        </Button>

        {cardData.sourceUrl ? (
          <a
            href={cardData.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 font-title font-bold text-[10px] uppercase tracking-wider h-8 rounded-xl border border-transparent bg-zinc-950 text-white shadow-sm hover:bg-zinc-800 transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>View Original</span>
          </a>
        ) : (
          <Button
            onClick={onTeleport}
            variant="default"
            size="sm"
            className="flex items-center justify-center gap-1 font-title font-bold text-[10px] uppercase tracking-wider h-8 rounded-xl border border-transparent shadow-sm hover:scale-[1.02] transition-transform"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Teleport</span>
          </Button>
        )}
      </div>
    </aside>
  );
}
