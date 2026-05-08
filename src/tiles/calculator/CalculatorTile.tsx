import { useState } from 'react';
import type { CalculatorTile as CalculatorTileType } from '../../lib/store/tiles';

type CalcState = {
  display: string;
  prev: number | null;
  op: string | null;
  fresh: boolean;
};

const INIT: CalcState = { display: '0', prev: null, op: null, fresh: false };

function compute(a: number, op: string, b: number): number {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b !== 0 ? a / b : NaN;
    default: return b;
  }
}

function fmt(n: number): string {
  if (!isFinite(n)) return 'Error';
  const rounded = parseFloat(n.toFixed(10));
  const s = rounded.toString();
  return s.length > 12 ? n.toExponential(6) : s;
}

export function CalculatorTile(_: { tile: CalculatorTileType }) {
  const [calc, setCalc] = useState<CalcState>(INIT);

  function handle(btn: string) {
    setCalc((s) => {
      if (btn === 'C') return INIT;

      if ('0123456789'.includes(btn)) {
        if (s.fresh || s.display === '0') return { ...s, display: btn, fresh: false };
        if (s.display.length >= 12) return s;
        return { ...s, display: s.display + btn, fresh: false };
      }

      if (btn === '.') {
        if (s.fresh) return { ...s, display: '0.', fresh: false };
        if (s.display.includes('.')) return s;
        return { ...s, display: s.display + '.', fresh: false };
      }

      if (btn === '%') {
        return { ...s, display: fmt(parseFloat(s.display) / 100), fresh: false };
      }

      if (btn === '±') {
        return { ...s, display: fmt(-parseFloat(s.display)), fresh: false };
      }

      if (['+', '−', '×', '÷'].includes(btn)) {
        const current = parseFloat(s.display);
        if (s.op !== null && !s.fresh) {
          const result = compute(s.prev ?? current, s.op, current);
          return { display: fmt(result), prev: result, op: btn, fresh: true };
        }
        return { ...s, prev: current, op: btn, fresh: true };
      }

      if (btn === '=') {
        if (s.op === null || s.prev === null) return s;
        const result = compute(s.prev, s.op, parseFloat(s.display));
        return { display: fmt(result), prev: null, op: null, fresh: true };
      }

      return s;
    });
  }

  function cls(btn: string) {
    if (['+', '−', '×', '÷'].includes(btn))
      return 'bg-orange-400 hover:bg-orange-300 text-white';
    if (btn === '=') return 'bg-blue-500 hover:bg-blue-400 text-white';
    if (['C', '±', '%'].includes(btn))
      return 'bg-white/[0.15] hover:bg-white/[0.22] text-white';
    return 'bg-white/[0.08] hover:bg-white/[0.14] text-white';
  }

  const topRows = ['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+'];

  return (
    <div className="flex flex-col gap-1.5 h-full rounded-xl p-3">
      <div className="rounded-xl bg-black/40 text-white px-4 py-3 min-h-[4rem] flex flex-col justify-end">
        {calc.op && (
          <span className="text-xs text-slate-400 truncate text-right">
            {calc.prev} {calc.op}
          </span>
        )}
        <span
          className="text-3xl font-semibold truncate text-right tabular-nums"
          role="status"
          aria-label="calculator display"
        >
          {calc.display}
        </span>
      </div>
      <div className="flex-1 grid grid-cols-4 gap-1.5 min-h-0">
        {topRows.map((btn) => (
          <button
            key={btn}
            onClick={() => handle(btn)}
            className={`rounded-xl text-base font-semibold transition-colors active:scale-95 ${cls(btn)}`}
          >
            {btn}
          </button>
        ))}
        <button
          onClick={() => handle('0')}
          className={`col-span-2 rounded-xl text-base font-semibold transition-colors active:scale-95 ${cls('0')}`}
        >
          0
        </button>
        <button
          onClick={() => handle('.')}
          className={`rounded-xl text-base font-semibold transition-colors active:scale-95 ${cls('.')}`}
        >
          .
        </button>
        <button
          onClick={() => handle('=')}
          className={`rounded-xl text-base font-semibold transition-colors active:scale-95 ${cls('=')}`}
        >
          =
        </button>
      </div>
    </div>
  );
}
