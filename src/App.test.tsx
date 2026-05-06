import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the phase 0 dashboard foundation', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByText('Google Tasks')).toBeInTheDocument();
    expect(screen.queryByText('Gmail')).not.toBeInTheDocument();
  });
});
