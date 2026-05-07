import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { NewsTile } from './NewsTile';

const tileNoUrl = { kind: 'rss' as const, id: 'rss-test', feedUrl: '', label: 'News' };
const tileWithUrl = { kind: 'rss' as const, id: 'rss-test-2', feedUrl: 'https://example.com/feed.xml', label: 'Tech' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('NewsTile', () => {
  it('shows config form when feedUrl is empty', () => {
    render(<NewsTile tile={tileNoUrl} />);
    expect(screen.getByPlaceholderText('https://example.com/feed.xml')).toBeInTheDocument();
  });

  it('shows proxy warning when VITE_RSS_PROXY_URL is not set', () => {
    render(<NewsTile tile={tileWithUrl} />);
    expect(screen.getByText(/VITE_RSS_PROXY_URL/)).toBeInTheDocument();
  });

  it('shows edit button when feed is configured', () => {
    render(<NewsTile tile={tileWithUrl} />);
    expect(screen.getByLabelText('Edit feed')).toBeInTheDocument();
  });

  it('opens edit form when edit button is clicked', () => {
    render(<NewsTile tile={tileWithUrl} />);
    fireEvent.click(screen.getByLabelText('Edit feed'));
    expect(screen.getByPlaceholderText('https://example.com/feed.xml')).toBeInTheDocument();
  });
});
