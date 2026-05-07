import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CalculatorTile } from './CalculatorTile';

const tile = { kind: 'calculator' as const, id: 'calc-test' };

function display() {
  return screen.getByRole('status', { name: 'calculator display' });
}

describe('CalculatorTile', () => {
  it('shows 0 on mount', () => {
    render(<CalculatorTile tile={tile} />);
    expect(display()).toHaveTextContent('0');
  });

  it('adds two numbers', () => {
    render(<CalculatorTile tile={tile} />);
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: '+' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    fireEvent.click(screen.getByRole('button', { name: '=' }));
    expect(display()).toHaveTextContent('5');
  });

  it('multiplies two numbers', () => {
    render(<CalculatorTile tile={tile} />);
    fireEvent.click(screen.getByRole('button', { name: '6' }));
    fireEvent.click(screen.getByRole('button', { name: '×' }));
    fireEvent.click(screen.getByRole('button', { name: '7' }));
    fireEvent.click(screen.getByRole('button', { name: '=' }));
    expect(display()).toHaveTextContent('42');
  });

  it('subtracts two numbers', () => {
    render(<CalculatorTile tile={tile} />);
    fireEvent.click(screen.getByRole('button', { name: '9' }));
    fireEvent.click(screen.getByRole('button', { name: '−' }));
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    fireEvent.click(screen.getByRole('button', { name: '=' }));
    expect(display()).toHaveTextContent('5');
  });

  it('clears with C', () => {
    render(<CalculatorTile tile={tile} />);
    fireEvent.click(screen.getByRole('button', { name: '9' }));
    fireEvent.click(screen.getByRole('button', { name: 'C' }));
    expect(display()).toHaveTextContent('0');
  });

  it('shows Error on division by zero', () => {
    render(<CalculatorTile tile={tile} />);
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    fireEvent.click(screen.getByRole('button', { name: '÷' }));
    fireEvent.click(screen.getByRole('button', { name: '0' }));
    fireEvent.click(screen.getByRole('button', { name: '=' }));
    expect(display()).toHaveTextContent('Error');
  });

  it('handles decimal input', () => {
    render(<CalculatorTile tile={tile} />);
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '.' }));
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    expect(display()).toHaveTextContent('1.5');
  });
});
