import React from 'react';
import { Compass, Plus, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header({ onAddClick, depthText, scrollPercent }) {
  return (
    <header className="react-overlay fixed top-3 left-3 right-3 z-50 flex items-center justify-between px-3 py-2 rounded-2xl bg-white/70 backdrop-blur-md border border-border shadow-sm transition-all duration-300 hover:bg-white/85 hover:border-zinc-300">
      {/* Dense minimal Logo */}
      <div className="flex items-center gap-2">
        <Compass className="w-3.5 h-3.5 text-zinc-950 animate-spin-slow" style={{ animationDuration: '12s' }} />
        <span className="font-title font-bold text-xs uppercase tracking-widest text-foreground">
          Aetherius
        </span>
        <span className="h-3 w-[1px] bg-border hidden sm:inline-block"></span>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:inline-block">
          Index-100 // Grid Density
        </span>
      </div>

      {/* Center Status Indicators */}
      <div className="flex items-center gap-4 text-[10px] font-title font-medium text-muted-foreground uppercase tracking-widest">
        <div className="flex items-center gap-1.5">
          <Circle className="w-1.5 h-1.5 fill-foreground text-foreground animate-pulse" />
          <span>Canvas: {depthText}</span>
        </div>
        <span className="h-2 w-[1px] bg-border"></span>
        <span>HUD: {scrollPercent}</span>
      </div>

      {/* Dense shadcn button (Rhea style) */}
      <div className="flex items-center gap-1.5">
        <Button
          onClick={onAddClick}
          variant="default"
          size="sm"
          className="flex items-center gap-1 font-title font-semibold text-[10px] uppercase tracking-wider h-7 px-2.5 rounded-xl border border-transparent shadow-sm hover:scale-[1.02] transition-transform"
          title="Insert Spatial Node"
        >
          <Plus className="w-3 h-3" />
          <span>Insert</span>
        </Button>
      </div>
    </header>
  );
}
