import { useEffect, useState, useCallback } from 'react';
import { useAuthStore, isTokenValid, requestToken, tokenHasScope } from '../../lib/google/auth';

const SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';
const BASE = 'https://www.googleapis.com/youtube/v3';

type Video = {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  publishedAt: string;
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 24) return h <= 1 ? '1h' : `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  return `${Math.floor(d / 30)}mo`;
}

export function YouTubeTile() {
  const token = useAuthStore((s) => s.token);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasScope = tokenHasScope(token, SCOPE);

  const fetchVideos = useCallback(async () => {
    if (!token || !isTokenValid(token)) return;
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token.access_token}` };

      // Step 1: get top subscribed channels
      const subRes = await fetch(
        `${BASE}/subscriptions?part=snippet&mine=true&maxResults=8&order=relevance`,
        { headers },
      );
      if (!subRes.ok) throw new Error(`Subscriptions ${subRes.status}`);
      const subData = await subRes.json() as {
        items: { snippet: { resourceId: { channelId: string }; title: string } }[];
      };
      const channels = subData.items.map((i) => ({
        id: i.snippet.resourceId.channelId,
        name: i.snippet.title,
      }));
      if (channels.length === 0) { setVideos([]); return; }

      // Step 2: get uploads playlist IDs for all channels in one call
      const ids = channels.map((c) => c.id).join(',');
      const chRes = await fetch(
        `${BASE}/channels?part=contentDetails&id=${ids}`,
        { headers },
      );
      if (!chRes.ok) throw new Error(`Channels ${chRes.status}`);
      const chData = await chRes.json() as {
        items: { id: string; contentDetails: { relatedPlaylists: { uploads: string } } }[];
      };
      const uploadsMap: Record<string, string> = {};
      for (const item of chData.items) {
        uploadsMap[item.id] = item.contentDetails.relatedPlaylists.uploads;
      }

      // Step 3: fetch latest video from each uploads playlist in parallel
      const results = await Promise.allSettled(
        channels.map(async (ch) => {
          const playlistId = uploadsMap[ch.id];
          if (!playlistId) return null;
          const r = await fetch(
            `${BASE}/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=1`,
            { headers },
          );
          if (!r.ok) return null;
          const d = await r.json() as {
            items: {
              snippet: {
                title: string;
                publishedAt: string;
                resourceId: { videoId: string };
                thumbnails: { medium?: { url: string }; default?: { url: string } };
              };
            }[];
          };
          const item = d.items[0];
          if (!item) return null;
          return {
            videoId: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            channel: ch.name,
            thumbnail: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? '',
            publishedAt: item.snippet.publishedAt,
          } satisfies Video;
        }),
      );

      const valid = results
        .map((r) => (r.status === 'fulfilled' ? r.value : null))
        .filter((v): v is Video => v !== null)
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      setVideos(valid);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (hasScope && isTokenValid(token)) fetchVideos();
  }, [hasScope, token, fetchVideos]);

  if (!isTokenValid(token) || !hasScope) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-4 text-white text-center">
        <p className="text-4xl">▶️</p>
        <p className="text-sm font-semibold">YouTube Subscriptions</p>
        <p className="text-xs text-zinc-500">See the latest videos from your subscriptions</p>
        <button
          onClick={() => requestToken(SCOPE).catch((e: Error) => setError(e.message))}
          className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-colors"
        >
          Connect YouTube
        </button>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    );
  }

  if (loading && videos.length === 0) {
    return <div className="flex items-center justify-center h-full text-zinc-500 text-sm">Loading…</div>;
  }

  if (!loading && videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-4">
        <p className="text-3xl">▶️</p>
        <p className="text-zinc-500 text-sm">No recent videos</p>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button onClick={fetchVideos} className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors underline">Refresh</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5 shrink-0">
        <span className="text-xs font-semibold text-zinc-400">Subscriptions</span>
        <button onClick={fetchVideos} className="text-[10px] text-zinc-700 hover:text-zinc-400 transition-colors">↺</button>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 px-2 pb-2 space-y-1">
        {videos.map((v) => (
          <a
            key={v.videoId}
            href={`https://www.youtube.com/watch?v=${v.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-2 items-start p-1.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
          >
            {v.thumbnail && (
              <img
                src={v.thumbnail}
                alt=""
                className="w-16 h-9 rounded-lg object-cover shrink-0 bg-zinc-800"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium leading-snug line-clamp-2 group-hover:text-red-400 transition-colors">
                {v.title}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-zinc-600 text-[10px] truncate">{v.channel}</p>
                <span className="text-zinc-700 text-[10px]">·</span>
                <p className="text-zinc-700 text-[10px] shrink-0">{relativeTime(v.publishedAt)}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
