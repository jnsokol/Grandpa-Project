export type BgConfig = { presetId: string; imageUrl: string };

export type Preset = {
  id: string;
  label: string;
  bg: string;
  gradient: string;
};

export const PRESETS: Preset[] = [
  { id: 'indigo',   label: 'Indigo',   bg: '#080810', gradient: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.10) 0%, transparent 60%)' },
  { id: 'midnight', label: 'Midnight', bg: '#02020f', gradient: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.13) 0%, transparent 60%)' },
  { id: 'forest',   label: 'Forest',   bg: '#020f06', gradient: 'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.10) 0%, transparent 60%)' },
  { id: 'rose',     label: 'Rose',     bg: '#0f0205', gradient: 'radial-gradient(ellipse at 50% 0%, rgba(244,63,94,0.10) 0%, transparent 60%)' },
  { id: 'black',    label: 'Black',    bg: '#000000', gradient: 'none' },
  { id: 'ocean',    label: 'Ocean',    bg: '#010c14', gradient: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.11) 0%, transparent 60%)' },
];

export function getPreset(id: string): Preset {
  return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}

export function bgStyle(config: BgConfig): React.CSSProperties {
  if (config.presetId === 'image' && config.imageUrl) {
    return { backgroundImage: `url(${config.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' };
  }
  const preset = getPreset(config.presetId);
  return { backgroundColor: preset.bg, backgroundImage: preset.gradient === 'none' ? undefined : preset.gradient };
}
