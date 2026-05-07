import type { ReactNode } from 'react';

type Props = { children: ReactNode };

export function TileShell({ children }: Props) {
  return (
    <div className="h-full rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.45),0_2px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.55),0_4px_12px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all duration-200 relative ring-1 ring-white/8">
      {/* Floating drag handle */}
      <div
        className="drag-handle absolute top-0 left-0 right-0 h-6 cursor-grab active:cursor-grabbing select-none z-10 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="flex items-center gap-[3px] bg-black/30 rounded-full px-2.5 py-1 backdrop-blur-sm">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="w-[3px] h-[3px] rounded-full bg-white/50" />
          ))}
        </div>
      </div>
      <div className="h-full overflow-auto">{children}</div>
    </div>
  );
}
