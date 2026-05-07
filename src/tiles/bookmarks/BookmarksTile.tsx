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
    setDraft((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: newLabel.trim(), url: newUrl.trim(), icon: newIcon.trim() || undefined },
    ]);
    setNewLabel('');
    setNewUrl('');
    setNewIcon('');
  }

  function removeLink(id: string) {
    setDraft((prev) => prev.filter((l) => l.id !== id));
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3 h-full overflow-auto">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-blue-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Links</span>
          {draft.map((link) => (
            <div key={link.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-2 py-1.5">
              <span className="text-base">{link.icon || '🔗'}</span>
              <span className="flex-1 text-sm text-slate-700 truncate">{link.label}</span>
              <button
                onClick={() => removeLink(link.id)}
                className="text-slate-300 hover:text-red-500 transition-colors text-lg leading-none"
              >×</button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1 border-t border-slate-100 pt-2">
          <span className="text-xs font-semibold text-slate-400">Add link</span>
          <div className="flex gap-1">
            <input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="🔗" maxLength={2}
              className="w-10 border border-slate-300 rounded-lg px-1 py-1 text-sm text-center outline-none focus:border-blue-400" />
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label"
              className="flex-1 border border-slate-300 rounded-lg px-2 py-1 text-sm outline-none focus:border-blue-400" />
          </div>
          <div className="flex gap-1">
            <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..."
              className="flex-1 border border-slate-300 rounded-lg px-2 py-1 text-sm outline-none focus:border-blue-400"
              onKeyDown={(e) => { if (e.key === 'Enter') addLink(); }} />
            <button onClick={addLink} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-medium">+</button>
          </div>
        </div>

        <div className="flex gap-2 mt-auto">
          <button onClick={saveEdit} className="flex-1 bg-blue-600 text-white rounded-lg py-1.5 text-sm font-semibold hover:bg-blue-700 transition-colors">Save</button>
          <button onClick={() => { setDraft(tile.links); setTitle(tile.title); setEditing(false); }}
            className="flex-1 border border-slate-300 text-slate-600 rounded-lg py-1.5 text-sm hover:bg-slate-50 transition-colors">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold text-slate-700">{tile.title}</span>
        <button onClick={() => setEditing(true)} className="text-xs text-slate-400 hover:text-slate-600 transition-colors" aria-label="Edit bookmarks">✎</button>
      </div>

      <div className="grid grid-cols-3 gap-2 flex-1 content-start">
        {tile.links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-all group"
          >
            {link.icon ? (
              <span className="text-2xl leading-none">{link.icon}</span>
            ) : (
              <img
                src={getFavicon(link.url)}
                alt=""
                className="w-7 h-7 rounded-md"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <span className="text-xs font-medium text-slate-600 group-hover:text-blue-700 truncate w-full text-center transition-colors">
              {link.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
