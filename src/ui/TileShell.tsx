import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onRemove: () => void;
};

export function TileShell({ children, onRemove }: Props) {
  return (
    <div className="h-full rounded-2xl bg-white flex flex-col overflow-hidden transition-all duration-200 shadow-[0_6px_24px_rgba(0,0,0,0.18),0_1px_4px_rgba(0,0,0,0.10)] hover:shadow-[0_14px_40px_rgba(0,0,0,0.26),0_2px_8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 border-2 border-slate-300">
      {/* Tile header bar — dark, always visible */}
      <div className="drag-handle flex items-center justify-between px-3 py-2 bg-slate-700 cursor-grab active:cursor-grabbing select-none shrink-0">
        {/* Drag dots */}
        <div className="flex items-center gap-0.5" aria-hidden="true">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          ))}
        </div>
        {/* Close button */}
        <button
          onClick={onRemove}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-400 text-white font-bold text-sm leading-none transition-colors"
          aria-label="Remove tile"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3 min-h-0">{children}</div>
    </div>
  );
}
