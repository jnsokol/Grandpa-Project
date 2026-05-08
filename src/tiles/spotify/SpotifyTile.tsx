import { useCallback, useEffect, useState } from 'react';
import {
  useSpotifyStore,
  isSpotifyTokenValid,
  startSpotifyAuth,
  refreshSpotifyToken,
  signOutSpotify,
  type SpotifyToken,
} from '../../lib/spotify/auth';

type Track = {
  name: string;
  artist: string;
  albumArt: string;
  durationMs: number;
  progressMs: number;
  isPlaying: boolean;
};

type PlaybackState = {
  is_playing: boolean;
  progress_ms: number;
  item: {
    name: string;
    duration_ms: number;
    artists: { name: string }[];
    album: { images: { url: string }[] };
  } | null;
};

function fmt(ms: number) {
  return `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;
}

export function SpotifyTile() {
  const token = useSpotifyStore((s) => s.token);
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getToken = useCallback(async (): Promise<SpotifyToken | null> => {
    if (!token) return null;
    if (isSpotifyTokenValid(token)) return token;
    try { return await refreshSpotifyToken(token); }
    catch { signOutSpotify(); return null; }
  }, [token]);

  const fetchPlayback = useCallback(async () => {
    const t = await getToken();
    if (!t) return;
    try {
      // Try full player state first; fall back to currently-playing if no active device (204)
      let res = await fetch('https://api.spotify.com/v1/me/player?additional_types=track,episode', {
        headers: { Authorization: `Bearer ${t.access_token}` },
      });
      if (res.status === 204) {
        res = await fetch('https://api.spotify.com/v1/me/player/currently-playing?additional_types=track,episode', {
          headers: { Authorization: `Bearer ${t.access_token}` },
        });
      }
      if (res.status === 204) { setTrack(null); setError(''); return; }
      if (!res.ok) throw new Error(`Spotify API error ${res.status}`);
      const data = await res.json() as PlaybackState;
      if (!data.item) { setTrack(null); setError(''); return; }
      setTrack({
        name: data.item.name,
        artist: data.item.artists.map((a) => a.name).join(', '),
        albumArt: data.item.album.images[0]?.url ?? '',
        durationMs: data.item.duration_ms,
        progressMs: data.progress_ms,
        isPlaying: data.is_playing,
      });
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }, [getToken]);

  async function control(action: 'play' | 'pause' | 'next' | 'previous') {
    const t = await getToken();
    if (!t) return;
    const methods = { play: 'PUT', pause: 'PUT', next: 'POST', previous: 'POST' } as const;
    const paths = { play: '/me/player/play', pause: '/me/player/pause', next: '/me/player/next', previous: '/me/player/previous' };
    await fetch(`https://api.spotify.com/v1${paths[action]}`, {
      method: methods[action],
      headers: { Authorization: `Bearer ${t.access_token}` },
    });
    setTimeout(fetchPlayback, 400);
  }

  useEffect(() => {
    if (!isSpotifyTokenValid(token)) return;
    setLoading(true);
    fetchPlayback().finally(() => setLoading(false));
    const id = setInterval(fetchPlayback, 5000);
    return () => clearInterval(id);
  }, [token, fetchPlayback]);

  if (!isSpotifyTokenValid(token)) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-4 text-white text-center">
        <p className="text-4xl">🎵</p>
        <p className="text-sm font-semibold">Connect Spotify</p>
        <p className="text-xs text-zinc-500">See what's playing and control playback</p>
        <button
          onClick={() => startSpotifyAuth().catch((e: Error) => setError(e.message))}
          className="px-5 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-xl text-sm font-bold transition-colors"
        >
          Connect
        </button>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    );
  }

  if (loading && !track) {
    return <div className="flex items-center justify-center h-full text-zinc-500 text-sm">Loading…</div>;
  }

  if (!track) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-center relative">
        <button onClick={signOutSpotify} className="absolute top-2 right-2 text-zinc-700 hover:text-zinc-400 text-xs transition-colors" title="Disconnect">✕</button>
        <p className="text-3xl">🎵</p>
        <p className="text-zinc-500 text-sm">Nothing playing</p>
        <p className="text-zinc-700 text-xs leading-relaxed">Make sure Spotify is open<br/>and not in Private Session</p>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button onClick={fetchPlayback} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline">Refresh</button>
      </div>
    );
  }

  const progress = track.durationMs > 0 ? (track.progressMs / track.durationMs) * 100 : 0;

  return (
    <div className="flex flex-col h-full p-3 gap-2 text-white">
      <div className="flex gap-3 items-center flex-1 min-h-0">
        {track.albumArt && (
          <img src={track.albumArt} alt="Album" className="w-14 h-14 rounded-xl shrink-0 shadow-lg object-cover" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{track.name}</p>
          <p className="text-zinc-400 text-xs truncate mt-0.5">{track.artist}</p>
        </div>
        <button onClick={signOutSpotify} className="text-zinc-700 hover:text-zinc-400 text-xs shrink-0 transition-colors" title="Disconnect">✕</button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] text-zinc-600 tabular-nums w-7 text-right">{fmt(track.progressMs)}</span>
        <div className="flex-1 h-1 bg-white/[0.08] rounded-full overflow-hidden">
          <div className="h-full bg-[#1DB954] rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[10px] text-zinc-600 tabular-nums w-7">{fmt(track.durationMs)}</span>
      </div>

      <div className="flex items-center justify-center gap-5 shrink-0 pb-1">
        <button onClick={() => control('previous')} className="text-zinc-500 hover:text-white text-xl transition-colors leading-none">⏮</button>
        <button
          onClick={() => control(track.isPlaying ? 'pause' : 'play')}
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-transform shadow-lg text-sm"
        >
          {track.isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={() => control('next')} className="text-zinc-500 hover:text-white text-xl transition-colors leading-none">⏭</button>
      </div>
    </div>
  );
}
