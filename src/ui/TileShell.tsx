import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onRemove: () => void;
};

export function TileShell({ children, onRemove }: Props) {
  return (
    <div className="h-full rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden">
      <div className="drag-handle flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-100 cursor-grab active:cursor-grabbing select-none shrink-0">
        <span className="text-slate-300 text-xs tracking-widest" aria-hidden="true">
          ⠿⠿
        </span>
        <button
          onClick={onRemove}
          className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
          aria-label="Remove tile"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3 min-h-0">{children}</div>
    </div>
  );
}
