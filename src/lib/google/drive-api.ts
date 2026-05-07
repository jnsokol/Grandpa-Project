export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink: string;
  iconLink?: string;
};

const BASE = 'https://www.googleapis.com/drive/v3';
const FIELDS = 'files(id,name,mimeType,modifiedTime,webViewLink,iconLink)';

export async function fetchRecentFiles(token: string, maxResults = 8): Promise<DriveFile[]> {
  const params = new URLSearchParams({
    pageSize: String(maxResults),
    orderBy: 'modifiedTime desc',
    fields: FIELDS,
    q: 'trashed=false',
  });
  const r = await fetch(`${BASE}/files?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`Drive API ${r.status}`);
  const data = await r.json() as { files?: DriveFile[] };
  return data.files ?? [];
}

const MIME_ICONS: Record<string, string> = {
  'application/vnd.google-apps.document': '📄',
  'application/vnd.google-apps.spreadsheet': '📊',
  'application/vnd.google-apps.presentation': '📽️',
  'application/vnd.google-apps.form': '📋',
  'application/vnd.google-apps.folder': '📁',
  'application/pdf': '📕',
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
};

export function mimeIcon(mimeType: string): string {
  return MIME_ICONS[mimeType] ?? '📎';
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
