import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore, signIn, silentSignIn, isTokenValid } from '../lib/google/auth';
import { ALL_GOOGLE_SCOPES } from '../lib/google/scopes';

type Props = { children: ReactNode };

export function GoogleSignInGate({ children }: Props) {
  const token = useAuthStore((s) => s.token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [silentTried, setSilentTried] = useState(false);

  useEffect(() => {
    if (isTokenValid(token) || silentTried) return;
    setSilentTried(true);
    setLoading(true);
    silentSignIn(ALL_GOOGLE_SCOPES)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, silentTried]);

  if (isTokenValid(token)) return <>{children}</>;

  async function handleSignIn() {
    setLoading(true);
    setError('');
    try {
      await signIn(ALL_GOOGLE_SCOPES);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center gap-10 p-8" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 60%)' }}>

      {/* Title */}
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Grandpa Project
        </h1>
        <p className="text-zinc-500 text-sm tracking-wide">Personal family dashboard</p>
      </div>

      {/* Card */}
      <div className="bg-white/[0.04] backdrop-blur-2xl rounded-2xl border border-white/[0.08] p-8 flex flex-col items-center gap-6 w-full max-w-sm shadow-[0_24px_64px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)]">

        <div className="w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/[0.10] flex items-center justify-center text-3xl shadow-inner">
          👴
        </div>

        <div className="text-center">
          <p className="text-white font-semibold text-lg">Welcome back</p>
          <p className="text-zinc-500 text-sm mt-1">
            Sign in to access your dashboard
          </p>
        </div>

        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl font-semibold text-sm shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {loading ? (
            <span className="text-lg leading-none animate-spin inline-block">⟳</span>
          ) : (
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
          )}
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        <p className="text-zinc-600 text-xs text-center leading-relaxed">
          Connects Calendar, Tasks, Drive &amp; Gmail in one step
        </p>
      </div>
    </div>
  );
}
