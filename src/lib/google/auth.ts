import { create } from 'zustand';

// Minimal GIS type declarations — no external @types package needed
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: GisTokenClientConfig): GisTokenClient;
          revokeToken(token: string, callback: () => void): void;
        };
      };
    };
  }
}

type GisTokenResponse = {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
};

type GisTokenClient = {
  requestAccessToken(overrideConfig?: { prompt?: string }): void;
};

type GisTokenClientConfig = {
  client_id: string;
  scope: string;
  callback: (response: GisTokenResponse) => void;
  error_callback?: (error: { type: string }) => void;
};

export type TokenData = {
  access_token: string;
  scope: string;
  expires_at: number;
};

export type UserProfile = {
  name: string;
  email: string;
  picture: string;
};

export type AuthStore = {
  token: TokenData | null;
  profile: UserProfile | null;
  setToken: (token: TokenData) => void;
  setProfile: (profile: UserProfile) => void;
  clearToken: () => void;
};

const SESSION_KEY = 'gis-token';
const PROFILE_KEY = 'gis-profile';

function loadFromSession(): TokenData | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as TokenData;
    return Date.now() < t.expires_at ? t : null;
  } catch {
    return null;
  }
}

function loadProfile(): UserProfile | null {
  try {
    const raw = sessionStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthStore>()((set) => ({
  token: loadFromSession(),
  profile: loadProfile(),
  setToken: (token) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(token));
    set({ token });
  },
  setProfile: (profile) => {
    sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    set({ profile });
  },
  clearToken: () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(PROFILE_KEY);
    set({ token: null, profile: null });
  },
}));

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

async function fetchUserProfile(accessToken: string): Promise<UserProfile | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json() as { name?: string; email?: string; picture?: string };
    return {
      name: data.name ?? '',
      email: data.email ?? '',
      picture: data.picture ?? '',
    };
  } catch {
    return null;
  }
}

export function signIn(scope: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services not loaded. Refresh and try again.'));
      return;
    }
    const { setToken, setProfile } = useAuthStore.getState();
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description ?? response.error));
          return;
        }
        const tokenData: TokenData = {
          access_token: response.access_token,
          scope: response.scope,
          expires_at: Date.now() + response.expires_in * 1000,
        };
        setToken(tokenData);
        fetchUserProfile(response.access_token).then((profile) => {
          if (profile) setProfile(profile);
          resolve();
        });
      },
      error_callback: (err) => reject(new Error(err.type)),
    });
    client.requestAccessToken({ prompt: '' });
  });
}

export function requestToken(scope: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services not loaded. Refresh and try again.'));
      return;
    }
    const { setToken } = useAuthStore.getState();
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description ?? response.error));
          return;
        }
        setToken({
          access_token: response.access_token,
          scope: response.scope,
          expires_at: Date.now() + response.expires_in * 1000,
        });
        resolve();
      },
      error_callback: (err) => reject(new Error(err.type)),
    });
    client.requestAccessToken({ prompt: '' });
  });
}

export function signOut() {
  const { token, clearToken } = useAuthStore.getState();
  if (token?.access_token && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revokeToken(token.access_token, () => {});
  }
  clearToken();
}

export function isTokenValid(token: TokenData | null): boolean {
  return token !== null && Date.now() < token.expires_at;
}

export function tokenHasScope(token: TokenData | null, scope: string): boolean {
  return token?.scope.split(' ').includes(scope) ?? false;
}
