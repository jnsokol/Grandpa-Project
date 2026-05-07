import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LauncherTile } from './LauncherTile';

const tile = {
  kind: 'launcher' as const,
  id: 'launcher-test',
  label: 'Google',
  url: 'https://google.com',
  icon: '🔍',
};

describe('LauncherTile', () => {
  it('renders the label and link', () => {
    render(<LauncherTile tile={tile} />);
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://google.com');
  });

  it('renders the icon', () => {
    render(<LauncherTile tile={tile} />);
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });

  it('opens in a new tab', () => {
    render(<LauncherTile tile={tile} />);
    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
  });

  it('shows edit form when Edit is clicked', () => {
    render(<LauncherTile tile={tile} />);
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByLabelText(/label/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/icon/i)).toBeInTheDocument();
  });

  it('starts in edit mode when url is empty', () => {
    render(<LauncherTile tile={{ ...tile, url: '' }} />);
    expect(screen.getByLabelText(/label/i)).toBeInTheDocument();
  });

  it('shows first letter of label when no icon is set', () => {
    render(<LauncherTile tile={{ ...tile, icon: undefined }} />);
    expect(screen.getByText('G')).toBeInTheDocument();
  });
});
