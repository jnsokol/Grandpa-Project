import type { ReactNode } from 'react';

type TileCardProps = {
  title: string;
  eyebrow: string;
  children: ReactNode;
};

export function TileCard({ title, eyebrow, children }: TileCardProps) {
  return (
    <article className="min-h-40 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">{title}</h2>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </article>
  );
}
