import { useEffect, useRef, useState } from 'react';
import { useTileStore } from '../lib/store/tile-store';

export function QuickNotePopover({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('');
  const pages = useTileStore((s) => s.pages);
  const currentPageId = useTileStore((s) => s.currentPageId);
  const addTile = useTileStore((s) => s.addTile);
  const updateTile = useTileStore((s) => s.updateTile);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function save() {
    if (!text.trim()) { onClose(); return; }
    const page = pages.find((p) => p.id === currentPageId);
    const existingNote = page?.tiles.find((t) => t.kind === 'notes');
    if (existingNote && existingNote.kind === 'notes') {
      updateTile({ ...existingNote, content: existingNote.content + (existingNote.content ? '\n\n' : '') + text.trim() });
    } else {
      addTile({ kind: 'notes', id: crypto.randomUUID(), title: 'Quick notes', content: text.trim() });
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute top-[96px] right-4 sm:right-28 w-72 bg-[#0d0d14]/98 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.8)] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wide mb-2">Quick note</p>
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save(); }}
          placeholder="Write something…"
          rows={4}
          className="w-full bg-white/[0.07] border border-white/[0.12] rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-amber-400/40 resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-zinc-700 text-[10px]">⌘↵ to save</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-zinc-500 hover:text-white text-xs transition-colors">Cancel</button>
            <button onClick={save} disabled={!text.trim()}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
