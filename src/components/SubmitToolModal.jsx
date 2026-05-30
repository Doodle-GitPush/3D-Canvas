import React, { useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CATEGORIES } from '../data/seedTools';

const CATEGORY_OPTIONS = Object.values(CATEGORIES);

export default function SubmitToolModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    url: '',
    imageUrl: '',
    creator: '',
    category: CATEGORIES.AI.id,
    tags: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Tool name is required.');
    if (!form.tagline.trim()) return setError('Tagline is required.');
    if (!form.url.trim()) return setError('Tool URL is required.');
    if (!form.creator.trim()) return setError('Creator name is required.');

    setIsSubmitting(true);

    // Auto-generate logo URL from domain if imageUrl not provided
    let imageUrl = form.imageUrl.trim();
    if (!imageUrl && form.url.trim()) {
      try {
        const domain = new URL(form.url.trim()).hostname.replace('www.', '');
        imageUrl = `https://logo.clearbit.com/${domain}`;
      } catch (_) {}
    }

    const toolData = {
      ...form,
      imageUrl,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      url: form.url.trim(),
    };

    // Find accent for this category
    const accent = CATEGORY_OPTIONS.find(c => c.id === form.category);
    toolData.accent = accent || null;

    await new Promise(r => setTimeout(r, 300)); // slight delay for feel
    onSubmit(toolData);
    setIsSubmitting(false);
    setForm({ name: '', tagline: '', url: '', imageUrl: '', creator: '', category: CATEGORIES.AI.id, tags: '' });
    onClose();
  };

  const selectedAccent = CATEGORY_OPTIONS.find(c => c.id === form.category);

  return (
    <div className="react-overlay fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-zinc-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div>
            <h2 className="text-[13px] font-title font-bold text-zinc-950 tracking-tight">
              Submit Your Tool
            </h2>
            <p className="text-[10.5px] text-zinc-400 mt-0.5">
              It'll appear instantly in the right cluster
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {/* Name + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9.5px] font-title font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
                Tool Name *
              </label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. SuperTool"
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-950 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9.5px] font-title font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
                Category *
              </label>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:border-zinc-950 transition-colors"
                style={selectedAccent ? { color: selectedAccent.badge } : {}}
              >
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-[9.5px] font-title font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
              Tagline * <span className="normal-case font-normal">(max 80 chars)</span>
            </label>
            <input
              value={form.tagline}
              onChange={e => set('tagline', e.target.value.slice(0, 80))}
              placeholder="One-line description of what it does"
              className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-950 transition-colors"
            />
          </div>

          {/* URL + Creator */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9.5px] font-title font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
                Tool URL *
              </label>
              <input
                value={form.url}
                onChange={e => set('url', e.target.value)}
                placeholder="https://yourtool.com"
                type="url"
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-950 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9.5px] font-title font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
                Your Name *
              </label>
              <input
                value={form.creator}
                onChange={e => set('creator', e.target.value)}
                placeholder="Your name / handle"
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-950 transition-colors"
              />
            </div>
          </div>

          {/* Logo URL (optional) */}
          <div>
            <label className="block text-[9.5px] font-title font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
              Logo / Image URL <span className="normal-case font-normal">(optional — auto-detected from URL)</span>
            </label>
            <input
              value={form.imageUrl}
              onChange={e => set('imageUrl', e.target.value)}
              placeholder="https://yourtool.com/logo.png"
              type="url"
              className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-950 transition-colors"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[9.5px] font-title font-bold uppercase tracking-widest text-zinc-400 mb-1.5">
              Tags <span className="normal-case font-normal">(comma separated, optional)</span>
            </label>
            <input
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
              placeholder="AI, SaaS, Open source"
              className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-950 transition-colors"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Submit */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-zinc-950 text-white text-[10.5px] font-title font-bold tracking-widest uppercase hover:bg-zinc-800 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Launching…' : '🚀 Launch on Canvas'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-[10.5px] font-title font-bold tracking-widest uppercase text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
