import { useEffect, useState } from 'react';
import { useAuthStore, requestToken, isTokenValid, tokenHasScope } from '../../lib/google/auth';
import { googleScopes } from '../../lib/google/scopes';
import { fetchRecentFiles, mimeIcon, relativeTime, type DriveFile } from '../../lib/google/drive-api';

const SCOPE = googleScopes.driveReadonly;

export function GoogleDriveTile() {
  const token = useAuthStore((s) => s.token);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connected = isTokenValid(token) && tokenHasScope(token, SCOPE);

  useEffect(() => {
    if (!connected || !token) return;
    setLoading(true);
    setError(null);
    fetchRecentFiles(token.access_token)
      .then(setFiles)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load files'))
      .finally(() => setLoading(false));
  }, [connected, token]);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-slate-500">Connect your Google account to see recent files.</p>
        <button
          onClick={() => requestToken(SCOPE).catch(() => {})}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Connect Google Drive
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold text-slate-700">Recent files</span>
        <button
          onClick={() => {
            if (!token) return;
            setLoading(true);
            setError(null);
            fetchRecentFiles(token.access_token)
              .then(setFiles)
              .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load files'))
              .finally(() => setLoading(false));
          }}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Refresh"
        >
          ↻
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400 text-center mt-4">Loading files…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {!loading && !error && files.length === 0 && (
        <p className="text-sm text-slate-400 text-center mt-4">No recent files found.</p>
      )}

      {!loading && !error && files.length > 0 && (
        <ul className="flex flex-col gap-1 overflow-auto flex-1 min-h-0">
          {files.map((file) => (
            <li key={file.id}>
              <a
                href={file.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors group"
              >
                <span className="text-base shrink-0">{mimeIcon(file.mimeType)}</span>
                <span className="flex-1 text-sm text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                  {file.name}
                </span>
                <span className="text-xs text-slate-400 shrink-0">{relativeTime(file.modifiedTime)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
