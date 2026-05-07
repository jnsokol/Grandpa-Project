import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the header with the project title and clock', () => {
    render(<App />);
    expect(screen.getByText('<Grandpa Project />')).toBeInTheDocument();
  });

  it('FAB opens tile menu and shows all tile options', () => {
    render(<App />);
    fireEvent.click(screen.getByLabelText('Add tile'));
    expect(screen.getByText('Weather')).toBeInTheDocument();
    expect(screen.getByText('Calculator')).toBeInTheDocument();
    expect(screen.getByText('Bookmarks')).toBeInTheDocument();
  });
});
