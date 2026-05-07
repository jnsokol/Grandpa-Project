import { useState } from 'react';
import { useTileStore } from '../../lib/store/tile-store';
import type { BookmarksTile as BookmarksTileType, BookmarkLink } from '../../lib/store/tiles';

type Props = { tile: BookmarksTileType };

function getFavicon(url: string): string {
  try {
    const { origin } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=64`;
  } catch {
    return '';
  }
}

export function BookmarksTile({ tile }: Props) {
  const updateTile = useTileStore((s) => s.updateTile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<BookmarkLink[]>(tile.links);
  const [title, setTitle] = useState(tile.title);
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newIcon, setNewIcon] = useState('');

  function saveEdit() {
    updateTile({ ...tile, title, links: draft });
    setEditing(false);
  }

  function addLink() {
    if (!newLabel.trim() || !newUrl.trim()) return;
    setDraft((prev) => [...prev, { id: crypto.randomUUID(), label: newLabel.trim(), url: newUrl.trim(), icon: newIcon.trim() || undefined }]);
    setNewLabel(''); setNewUrl(''); setNewIcon('');
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3 h-full overflow-auto bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-xl p-3 text-white">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-white/50" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Links</span>
          {draft.map((link) => (
            <div key={link.id} className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1.5">
              <span className="text-base">{link.icon || '🔗'}</span>
              <span className="flex-1 text-sm text-white truncate">{link.label}</span>
              <button onClick={() => setDraft((p) => p.filter((l) => l.id !== link.id))}
                className="text-white/40 hover:text-red-400 text-lg leading-none transition-colors">×</button>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1 border-t border-white/10 pt-2">
          <span className="text-xs font-semibold text-slate-400">Add link</span>
          <div className="flex gap-1">
            <input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="🔗" maxLength={2}
              className="w-10 bg-white/10 border border-white/20 rounded-lg px-1 py-1 text-sm text-center outline-none focus:border-white/50 text-white" />
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label"
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm text-white placeholder-white/30 outline-none focus:border-white/50" />
          </div>
          <div className="flex gap-1">
            <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..."
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm text-white placeholder-white/30 outline-none focus:border-white/50"
              onKeyDown={(e) => { if (e.key === 'Enter') addLink(); }} />
            <button onClick={addLink} className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors">+</button>
          </div>
        </div>
        <div className="flex gap-2 mt-auto">
          <button onClick={saveEdit} className="flex-1 bg-white/20 hover:bg-white/30 text-white rounded-lg py-1.5 text-sm font-semibold transition-colors">Save</button>
          <button onClick={() => { setDraft(tile.links); setTitle(tile.title); setEditing(false); }}
            className="flex-1 border border-white/20 text-white/60 rounded-lg py-1.5 text-sm hover:bg-white/10 transition-colors">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-xl overflow-hidden text-white">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <p className="text-base font-bold">🔖 {tile.title}</p>
        <button onClick={() => setEditing(true)} className="text-slate-400 hover:text-white text-sm transition-colors" aria-label="Edit bookmarks">✎</button>
      </div>
      <div className="grid grid-cols-3 gap-2 px-3 pb-3 flex-1 content-start overflow-auto">
        {tile.links.map((link) => (
          <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all group">
            {link.icon ? (
              <span className="text-2xl leading-none">{link.icon}</span>
            ) : (
              <img src={getFavicon(link.url)} alt="" className="w-7 h-7 rounded-md"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            )}
            <span className="text-xs font-medium text-white/80 group-hover:text-white truncate w-full text-center transition-colors">
              {link.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
