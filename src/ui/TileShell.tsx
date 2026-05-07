import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onRemove: () => void;
};

export function TileShell({ children, onRemove }: Props) {
  return (
    <div className="h-full rounded-2xl bg-white flex flex-col overflow-hidden transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.10)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] border border-white/80 ring-1 ring-slate-900/5">
      <div className="drag-handle flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-100 cursor-grab active:cursor-grabbing select-none shrink-0">
        <span className="text-slate-300 text-sm tracking-widest" aria-hidden="true">⠿⠿</span>
        <button
          onClick={onRemove}
          className="w-5 h-5 flex items-center justify-center rounded-full text-slate-300 hover:bg-red-100 hover:text-red-500 transition-colors text-base leading-none"
          aria-label="Remove tile"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3 min-h-0">{children}</div>
    </div>
  );
}
