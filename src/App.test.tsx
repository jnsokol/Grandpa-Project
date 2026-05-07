import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the header with Today heading and add tile buttons', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByText('+ Launcher')).toBeInTheDocument();
    expect(screen.getByText('+ Calculator')).toBeInTheDocument();
  });
});
