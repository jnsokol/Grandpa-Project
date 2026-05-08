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
        className="absolute top-[72px] right-4 w-80 max-w-[calc(100vw-2rem)] bg-[#111116] border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <p className="text-white text-sm font-semibold">Quick note</p>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 text-lg leading-none transition-colors">×</button>
        </div>

        <div className="p-4">
          <textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save(); }}
            placeholder="Write something…"
            rows={4}
            className="w-full bg-white/[0.06] border border-white/[0.09] rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-700 outline-none focus:border-white/25 resize-none transition-colors"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-zinc-700 text-xs">⌘↵ to save</p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-zinc-500 hover:text-zinc-200 text-sm rounded-lg hover:bg-white/[0.06] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={!text.trim()}
                className="px-4 py-1.5 bg-white text-black rounded-lg text-sm font-semibold disabled:opacity-30 hover:bg-zinc-200 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
