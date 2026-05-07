import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the header with the project title', () => {
    render(<App />);
    expect(screen.getByText('<Grandpa Project />')).toBeInTheDocument();
  });

  it('Add tile button opens menu with all tile options', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Add tile' }));
    expect(screen.getByRole('menuitem', { name: /Weather/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Bookmarks/ })).toBeInTheDocument();
  });
});
