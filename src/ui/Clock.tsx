import { useEffect, useState } from 'react';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function Clock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = pad(now.getHours());
  const m = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  const date = now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="flex flex-col items-start leading-none gap-1">
      <div className="flex items-baseline gap-0.5 tabular-nums">
        <span className="text-2xl font-bold text-white tracking-tight">{h}:{m}</span>
        <span className="text-sm font-semibold text-zinc-500 ml-0.5">:{s}</span>
      </div>
      <span className="text-xs text-zinc-500 font-medium tracking-wide uppercase">{date}</span>
    </div>
  );
}
