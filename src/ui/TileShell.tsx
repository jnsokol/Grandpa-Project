import type { ReactNode } from 'react';

type Props = { children: ReactNode; locked?: boolean; onSettings?: () => void };

export function TileShell({ children, locked, onSettings }: Props) {
  return (
    <div className="group h-full rounded-2xl overflow-hidden relative
      bg-[rgba(255,255,255,0.03)]
      backdrop-blur-2xl
      border border-[rgba(255,255,255,0.07)]
      shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_-1px_0_rgba(0,0,0,0.3)_inset,0_8px_40px_rgba(0,0,0,0.55),0_2px_8px_rgba(0,0,0,0.35)]
      hover:bg-[rgba(255,255,255,0.045)]
      hover:border-[rgba(99,102,241,0.18)]
      hover:shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_-1px_0_rgba(0,0,0,0.3)_inset,0_12px_48px_rgba(0,0,0,0.65),0_4px_16px_rgba(99,102,241,0.08)]
      hover:-translate-y-0.5
      transition-all duration-300 ease-out">

      {/* top-edge glass highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-10" />

      {!locked && (
        <div
          className="drag-handle absolute top-0 left-0 right-0 h-7 cursor-grab active:cursor-grabbing select-none z-10 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="flex items-center gap-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {[...Array(6)].map((_, i) => (
              <span key={i} className="w-[3px] h-[3px] rounded-full bg-white/25" />
            ))}
          </div>
        </div>
      )}

      {onSettings && !locked && (
        <button
          onClick={(e) => { e.stopPropagation(); onSettings(); }}
          className="absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-lg
            bg-white/[0.06] hover:bg-indigo-500/20
            border border-white/[0.06] hover:border-indigo-400/30
            text-zinc-600 hover:text-indigo-300
            flex items-center justify-center text-xs
            opacity-0 group-hover:opacity-100
            transition-all duration-150"
          aria-label="Tile settings"
          title="Settings"
        >
          ⚙
        </button>
      )}

      <div className="h-full overflow-auto">{children}</div>
    </div>
  );
}
