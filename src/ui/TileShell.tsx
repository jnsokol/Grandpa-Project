import type { ReactNode } from 'react';

type Props = { children: ReactNode; locked?: boolean; onSettings?: () => void };

export function TileShell({ children, locked, onSettings }: Props) {
  return (
    <div className="group h-full rounded-2xl overflow-hidden relative
      bg-white/[0.04] backdrop-blur-2xl
      border border-white/[0.08]
      shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]
      hover:bg-white/[0.06] hover:border-white/[0.12]
      hover:shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)]
      hover:-translate-y-0.5 transition-all duration-200">

      {!locked && (
        <div
          className="drag-handle absolute top-0 left-0 right-0 h-6 cursor-grab active:cursor-grabbing select-none z-10 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="flex items-center gap-[3px] bg-white/[0.08] rounded-full px-2.5 py-1">
            {[...Array(6)].map((_, i) => (
              <span key={i} className="w-[3px] h-[3px] rounded-full bg-white/30" />
            ))}
          </div>
        </div>
      )}

      {onSettings && !locked && (
        <button
          onClick={(e) => { e.stopPropagation(); onSettings(); }}
          className="absolute bottom-2 left-2 z-20 w-6 h-6 rounded-lg bg-white/[0.06] hover:bg-white/[0.15] text-zinc-500 hover:text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all"
          aria-label="Tile settings"
          title="Settings"
        >
          ⚙
        </button>
      )}

      <div className="tile-scroll h-full overflow-auto">{children}</div>
    </div>
  );
}
