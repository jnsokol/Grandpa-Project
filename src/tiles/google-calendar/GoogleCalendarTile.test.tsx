import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GoogleCalendarTile } from './GoogleCalendarTile';
import * as auth from '../../lib/google/auth';

const tile = { kind: 'gcal' as const, id: 'gcal-test' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GoogleCalendarTile', () => {
  it('shows connect button when not authenticated', () => {
    vi.spyOn(auth, 'useAuthStore').mockImplementation((sel: (s: auth.AuthStore) => unknown) =>
      sel({ token: null, setToken: vi.fn(), clearToken: vi.fn(), profile: null, setProfile: vi.fn() }),
    );
    render(<GoogleCalendarTile tile={tile} />);
    expect(screen.getByText('Connect Google Calendar')).toBeInTheDocument();
  });

  it('shows loading state when authenticated and fetching', () => {
    const token: auth.TokenData = {
      access_token: 'tok',
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      expires_at: Date.now() + 3_600_000,
    };
    vi.spyOn(auth, 'useAuthStore').mockImplementation((sel: (s: auth.AuthStore) => unknown) =>
      sel({ token, setToken: vi.fn(), clearToken: vi.fn(), profile: null, setProfile: vi.fn() }),
    );
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    render(<GoogleCalendarTile tile={tile} />);
    expect(screen.getByText('Loading events…')).toBeInTheDocument();
  });

  it('shows no upcoming events when API returns empty list', async () => {
    const token: auth.TokenData = {
      access_token: 'tok',
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      expires_at: Date.now() + 3_600_000,
    };
    vi.spyOn(auth, 'useAuthStore').mockImplementation((sel: (s: auth.AuthStore) => unknown) =>
      sel({ token, setToken: vi.fn(), clearToken: vi.fn(), profile: null, setProfile: vi.fn() }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) })),
    );
    render(<GoogleCalendarTile tile={tile} />);
    expect(await screen.findByText('No upcoming events.')).toBeInTheDocument();
  });

  it('renders event titles from API response', async () => {
    const token: auth.TokenData = {
      access_token: 'tok',
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      expires_at: Date.now() + 3_600_000,
    };
    vi.spyOn(auth, 'useAuthStore').mockImplementation((sel: (s: auth.AuthStore) => unknown) =>
      sel({ token, setToken: vi.fn(), clearToken: vi.fn(), profile: null, setProfile: vi.fn() }),
    );
    const items = [
      { id: '1', summary: 'Team Standup', start: { dateTime: new Date(Date.now() + 3600_000).toISOString() } },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ items }) })),
    );
    render(<GoogleCalendarTile tile={tile} />);
    expect(await screen.findByText('Team Standup')).toBeInTheDocument();
  });
});
