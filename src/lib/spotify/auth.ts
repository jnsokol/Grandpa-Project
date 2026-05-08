import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? '';
const SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing';

function getRedirectUri() {
  return window.location.origin + '/';
}

function generateVerifier(): string {
  const arr = new Uint8Array(64);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function generateChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export type SpotifyToken = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

type SpotifyAuthStore = {
  token: SpotifyToken | null;
  setToken: (token: SpotifyToken | null) => void;
};

export const useSpotifyStore = create<SpotifyAuthStore>()(
  persist(
    (set) => ({ token: null, setToken: (token) => set({ token }) }),
    { name: 'spotify-auth' }
  )
);

export function isSpotifyTokenValid(token: SpotifyToken | null): boolean {
  return !!token && Date.now() < token.expires_at;
}

function storeAndReturn(data: { access_token: string; refresh_token: string; expires_in: number }): SpotifyToken {
  const token: SpotifyToken = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000 - 60_000,
  };
  useSpotifyStore.getState().setToken(token);
  return token;
}

export async function startSpotifyAuth(): Promise<void> {
  if (!CLIENT_ID) throw new Error('VITE_SPOTIFY_CLIENT_ID is not configured');
  const verifier = generateVerifier();
  sessionStorage.setItem('spotify-pkce-verifier', verifier);
  const challenge = await generateChallenge(verifier);
  const url = new URL('https://accounts.spotify.com/authorize');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', getRedirectUri());
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('scope', SCOPES);
  window.location.href = url.toString();
}

export async function handleSpotifyCallback(code: string): Promise<void> {
  const verifier = sessionStorage.getItem('spotify-pkce-verifier');
  if (!verifier) return;
  sessionStorage.removeItem('spotify-pkce-verifier');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: getRedirectUri(),
      client_id: CLIENT_ID,
      code_verifier: verifier,
    }),
  });
  const data = await res.json() as { access_token: string; refresh_token: string; expires_in: number; error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Token exchange failed');
  storeAndReturn(data);
}

export async function refreshSpotifyToken(token: SpotifyToken): Promise<SpotifyToken> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token.refresh_token,
      client_id: CLIENT_ID,
    }),
  });
  const data = await res.json() as { access_token: string; refresh_token?: string; expires_in: number; error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Refresh failed');
  return storeAndReturn({ ...data, refresh_token: data.refresh_token ?? token.refresh_token });
}

export function signOutSpotify(): void {
  useSpotifyStore.getState().setToken(null);
}
