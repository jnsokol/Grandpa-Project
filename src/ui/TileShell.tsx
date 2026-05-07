import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export function TileShell({ children }: Props) {
  return (
    <div className="h-full rounded-2xl overflow-hidden shadow-[0_6px_24px_rgba(0,0,0,0.22),0_1px_4px_rgba(0,0,0,0.12)] hover:shadow-[0_14px_40px_rgba(0,0,0,0.30),0_2px_8px_rgba(0,0,0,0.14)] hover:-translate-y-0.5 transition-all duration-200 relative">
      {/* Floating drag handle — overlays the tile top, doesn't add a bar */}
      <div
        className="drag-handle absolute top-0 left-0 right-0 h-7 cursor-grab active:cursor-grabbing select-none z-10 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="flex items-center gap-0.5 bg-black/20 rounded-full px-2 py-0.5 backdrop-blur-sm">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="w-1 h-1 rounded-full bg-white/70" />
          ))}
        </div>
      </div>
      <div className="h-full overflow-auto">{children}</div>
    </div>
  );
}
