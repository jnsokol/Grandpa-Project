import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onRemove: () => void;
};

export function TileShell({ children, onRemove }: Props) {
  return (
    <div className="h-full rounded-xl border border-slate-300 bg-white shadow-md flex flex-col overflow-hidden">
      <div className="drag-handle flex items-center justify-between px-3 py-2 bg-slate-100 border-b border-slate-200 cursor-grab active:cursor-grabbing select-none shrink-0">
        <span className="text-slate-400 text-sm tracking-widest" aria-hidden="true">
          ⠿⠿
        </span>
        <button
          onClick={onRemove}
          className="text-slate-400 hover:text-red-500 transition-colors text-xl leading-none font-light"
          aria-label="Remove tile"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3 min-h-0">{children}</div>
    </div>
  );
}
