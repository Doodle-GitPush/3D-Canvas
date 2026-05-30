import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function AddInspirationModal({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('image');
  const [url, setUrl] = useState('https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600&auto=format&fit=crop');
  const [text, setText] = useState('');
  const [category, setCategory] = useState('Philosophy');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const itemData = {
      title: title.trim(),
      type,
      category,
      accentColor: '#18181b', // Fixed minimal dark grey border
      description: `A customized user-submitted node spawned dynamically in the clean 3D white void canvas.`,
      likes: 0
    };

    if (type === 'text') {
      itemData.text = text.trim();
    } else {
      itemData.url = url.trim();
    }

    onSubmit(itemData);
    
    // Clear inputs
    setTitle('');
    setText('');
    onClose();
  };

  const handleTypeChange = (e) => {
    const val = e.target.value;
    setType(val);
    if (val === 'image') {
      setUrl('https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600&auto=format&fit=crop');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[350px] p-5 gap-4 rounded-2xl bg-white border border-border shadow-lg anim-pulse-border outline-none">
        <DialogHeader className="border-b border-zinc-100 pb-2 flex flex-col gap-1.5">
          <DialogTitle className="text-xs font-title font-bold text-zinc-950 flex items-center gap-1.5 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
            <span>Insert 3D Node</span>
          </DialogTitle>
          <DialogDescription className="text-[10px] text-muted-foreground font-light leading-normal">
            Spawn a minimal visual node or philosophical prompt into the flat centered Cartesian 3D void.
          </DialogDescription>
        </DialogHeader>

        {/* Dense Form (Rhea high density inputs) */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-[11px]">
          <div className="flex flex-col gap-1.5">
            <label className="font-title font-bold text-[9.5px] uppercase tracking-wider text-muted-foreground">Node Title</label>
            <input
              type="text"
              required
              maxLength={40}
              placeholder="e.g., Brutalist Pillar Study"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-border rounded-xl outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 font-sans text-xs bg-zinc-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-title font-bold text-[9.5px] uppercase tracking-wider text-muted-foreground">Node Format</label>
            <select
              value={type}
              onChange={handleTypeChange}
              className="w-full px-2 py-1.5 border border-border rounded-xl outline-none focus:border-zinc-950 font-sans text-xs bg-zinc-50"
            >
              <option value="image">Crisp Image URL</option>
              <option value="text">Philosophical Quote Text</option>
            </select>
          </div>

          {type === 'image' ? (
            <div className="flex flex-col gap-1.5">
              <label className="font-title font-bold text-[9.5px] uppercase tracking-wider text-muted-foreground">Source Image Link</label>
              <input
                type="url"
                required
                placeholder="https://images.unsplash.com/photo-..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-border rounded-xl outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 font-mono text-[10.5px] bg-zinc-50"
              />
              <span className="text-[9.5px] text-muted-foreground leading-normal">Provide a clean, high-resolution visual image URL.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="font-title font-bold text-[9.5px] uppercase tracking-wider text-muted-foreground">Quote Content</label>
              <textarea
                required
                rows={3}
                maxLength={140}
                placeholder="Enter spatial prompt, poem, or structural quote here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-border rounded-xl outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 font-sans text-xs bg-zinc-50 resize-none"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="font-title font-bold text-[9.5px] uppercase tracking-wider text-muted-foreground">Catalog Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2 py-1.5 border border-border rounded-xl outline-none focus:border-zinc-950 font-sans text-xs bg-zinc-50"
            >
              <option value="Philosophy">Philosophy & Space</option>
              <option value="Architecture">Brutalist & Form</option>
              <option value="Minimalism">Minimalism Theory</option>
              <option value="Grids">Grid Densities</option>
              <option value="Visuals">Aesthetic Catalog</option>
            </select>
          </div>

          <Button
            type="submit"
            variant="default"
            size="sm"
            className="w-full mt-2 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-title font-bold text-[10.5px] uppercase tracking-wider transition-all shadow-sm active:scale-98"
          >
            Spawn in Void Space
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
