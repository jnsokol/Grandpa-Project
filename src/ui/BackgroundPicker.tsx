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
        className="absolute top-[72px] right-4 w-72 max-w-[calc(100vw-2rem)] bg-[#111116] border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <p className="text-white text-sm font-semibold">Background</p>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 text-lg leading-none transition-colors">×</button>
        </div>

        <div className="p-4">
          {/* Presets */}
          <p className="text-zinc-600 text-[10px] font-semibold uppercase tracking-widest mb-2.5">Presets</p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => { setBg({ presetId: preset.id, imageUrl: '' }); onClose(); }}
                className={`relative h-14 rounded-xl overflow-hidden transition-all ${
                  bg.presetId === preset.id && bg.imageUrl === ''
                    ? 'ring-2 ring-white/60 ring-offset-1 ring-offset-[#111116]'
                    : 'ring-1 ring-white/[0.08] hover:ring-white/25'
                }`}
                style={{ backgroundColor: preset.bg }}
                title={preset.label}
              >
                {preset.gradient !== 'none' && (
                  <div className="absolute inset-0" style={{ backgroundImage: preset.gradient }} />
                )}
                <p className="absolute bottom-1 left-0 right-0 text-center text-[9px] text-white/50 font-medium">
                  {preset.label}
                </p>
              </button>
            ))}
          </div>

          {/* Custom image URL */}
          <p className="text-zinc-600 text-[10px] font-semibold uppercase tracking-widest mb-2">Custom image</p>
          <input
            ref={urlRef}
            defaultValue={bg.imageUrl}
            placeholder="https://…"
            className="w-full bg-white/[0.06] border border-white/[0.09] rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-700 outline-none focus:border-white/25 transition-colors mb-2"
          />
          <button
            onClick={() => {
              const url = urlRef.current?.value.trim() ?? '';
              setBg({ presetId: 'image', imageUrl: url });
              onClose();
            }}
            className="w-full py-2 bg-white/[0.08] hover:bg-white/[0.14] text-white rounded-xl text-sm font-medium transition-colors"
          >
            Apply image
          </button>
        </div>
      </div>
    </div>
  );
}
