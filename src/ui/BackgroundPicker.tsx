import { useRef } from 'react';
import { useTileStore } from '../lib/store/tile-store';
import { PRESETS } from '../lib/background';

export function BackgroundPicker({ onClose }: { onClose: () => void }) {
  const bg = useTileStore((s) => s.bg);
  const setBg = useTileStore((s) => s.setBg);
  const urlRef = useRef<HTMLInputElement>(null);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute top-[96px] right-4 sm:right-52 w-64 bg-[#0d0d14]/98 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.8)] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wide mb-3">Background</p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => { setBg({ presetId: preset.id, imageUrl: '' }); onClose(); }}
              className={`relative h-12 rounded-xl overflow-hidden border-2 transition-all ${
                bg.presetId === preset.id && bg.imageUrl === ''
                  ? 'border-indigo-400 scale-105'
                  : 'border-white/[0.08] hover:border-white/[0.25]'
              }`}
              style={{ backgroundColor: preset.bg }}
              title={preset.label}
            >
              {preset.gradient !== 'none' && (
                <div className="absolute inset-0" style={{ backgroundImage: preset.gradient }} />
              )}
              <p className="absolute bottom-0.5 left-0 right-0 text-center text-[9px] text-white/50">{preset.label}</p>
            </button>
          ))}
        </div>

        <p className="text-zinc-600 text-[10px] uppercase tracking-wide mb-1.5">Custom image URL</p>
        <div className="flex gap-1.5">
          <input
            ref={urlRef}
            defaultValue={bg.imageUrl}
            placeholder="https://…"
            className="flex-1 bg-white/[0.07] border border-white/[0.10] rounded-lg px-2 py-1.5 text-xs text-white placeholder-white/20 outline-none focus:border-indigo-400/50"
          />
          <button
            onClick={() => {
              const url = urlRef.current?.value.trim() ?? '';
              setBg({ presetId: 'image', imageUrl: url });
              onClose();
            }}
            className="px-2.5 py-1.5 bg-white/[0.08] hover:bg-white/[0.15] text-white rounded-lg text-xs transition-colors shrink-0"
          >
            Set
          </button>
        </div>
      </div>
    </div>
  );
}
