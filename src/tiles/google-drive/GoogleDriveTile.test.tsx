import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GoogleDriveTile } from './GoogleDriveTile';
import * as auth from '../../lib/google/auth';
import * as driveApi from '../../lib/google/drive-api';

const validToken: auth.TokenData = {
  access_token: 'tok',
  scope: 'https://www.googleapis.com/auth/drive.readonly',
  expires_at: Date.now() + 3_600_000,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GoogleDriveTile', () => {
  it('shows connect button when not authenticated', () => {
    vi.spyOn(auth, 'useAuthStore').mockImplementation((sel: (s: auth.AuthStore) => unknown) =>
      sel({ token: null, setToken: vi.fn(), clearToken: vi.fn(), profile: null, setProfile: vi.fn() }),
    );
    render(<GoogleDriveTile />);
    expect(screen.getByText('Connect Google Drive')).toBeInTheDocument();
  });

  it('shows loading state while fetching', () => {
    vi.spyOn(auth, 'useAuthStore').mockImplementation((sel: (s: auth.AuthStore) => unknown) =>
      sel({ token: validToken, setToken: vi.fn(), clearToken: vi.fn(), profile: null, setProfile: vi.fn() }),
    );
    vi.spyOn(driveApi, 'fetchRecentFiles').mockReturnValue(new Promise(() => {}));
    render(<GoogleDriveTile />);
    expect(screen.getByText('Loading files…')).toBeInTheDocument();
  });

  it('renders file names', async () => {
    vi.spyOn(auth, 'useAuthStore').mockImplementation((sel: (s: auth.AuthStore) => unknown) =>
      sel({ token: validToken, setToken: vi.fn(), clearToken: vi.fn(), profile: null, setProfile: vi.fn() }),
    );
    vi.spyOn(driveApi, 'fetchRecentFiles').mockResolvedValue([
      {
        id: 'f1',
        name: 'Budget 2026',
        mimeType: 'application/vnd.google-apps.spreadsheet',
        modifiedTime: new Date(Date.now() - 3_600_000).toISOString(),
        webViewLink: 'https://docs.google.com/spreadsheets/d/f1',
      },
    ]);
    render(<GoogleDriveTile />);
    expect(await screen.findByText('Budget 2026')).toBeInTheDocument();
  });

  it('shows empty message when no files returned', async () => {
    vi.spyOn(auth, 'useAuthStore').mockImplementation((sel: (s: auth.AuthStore) => unknown) =>
      sel({ token: validToken, setToken: vi.fn(), clearToken: vi.fn(), profile: null, setProfile: vi.fn() }),
    );
    vi.spyOn(driveApi, 'fetchRecentFiles').mockResolvedValue([]);
    render(<GoogleDriveTile />);
    expect(await screen.findByText('No recent files found.')).toBeInTheDocument();
  });
});
