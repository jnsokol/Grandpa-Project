import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the header with clock and Add tile button', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: 'Add tile' })).toBeInTheDocument();
  });

  it('opens tile menu and shows all tile options', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Add tile' }));
    expect(screen.getByRole('menuitem', { name: /Launcher/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Weather/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Calendar/ })).toBeInTheDocument();
  });
});
