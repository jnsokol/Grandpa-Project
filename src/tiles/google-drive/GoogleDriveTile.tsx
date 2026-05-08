import { useEffect, useState } from 'react';
import { useAuthStore, isTokenValid } from '../../lib/google/auth';
import { fetchRecentFiles, mimeIcon, relativeTime, type DriveFile } from '../../lib/google/drive-api';

export function GoogleDriveTile() {
  const token = useAuthStore((s) => s.token);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connected = isTokenValid(token);

  function loadFiles(accessToken: string) {
    setLoading(true);
    setError(null);
    fetchRecentFiles(accessToken)
      .then(setFiles)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (connected && token) loadFiles(token.access_token);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, token?.access_token]);

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden text-white">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <div>
          <p className="text-base font-bold">📁 Drive</p>
          <p className="text-zinc-400 text-xs">Recent files</p>
        </div>
        <button
          onClick={() => token && loadFiles(token.access_token)}
          className="text-zinc-400 hover:text-white text-base transition-colors"
          aria-label="Refresh"
        >↻</button>
      </div>

      {/* Files list */}
      <div className="flex-1 overflow-auto px-3 pb-3 min-h-0 flex flex-col gap-1">
        {loading && <p className="text-zinc-400 text-sm text-center mt-4">Loading…</p>}
        {error && <p className="text-red-300 text-xs text-center mt-2">{error}</p>}
        {!loading && !error && files.length === 0 && (
          <p className="text-zinc-400 text-sm text-center mt-4">No recent files found</p>
        )}
        {files.map((file) => (
          <a
            key={file.id}
            href={file.webViewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 transition-colors group"
          >
            <span className="text-lg shrink-0">{mimeIcon(file.mimeType)}</span>
            <span className="flex-1 text-sm text-white truncate">{file.name}</span>
            <span className="text-xs text-zinc-400 shrink-0">{relativeTime(file.modifiedTime)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
