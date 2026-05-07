import { useEffect, useState } from 'react';

export function HologramTitle() {
  const [pos, setPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    function onMove(e: MouseEvent) {
      setPos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    }
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <h1
      className="absolute left-1/2 -translate-x-1/2 text-3xl select-none whitespace-nowrap tracking-tight transition-none"
      style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 900,
        background: `
          radial-gradient(ellipse at ${pos.x}% ${pos.y}%,
            #ffffff 0%,
            #a0f0ff 10%,
            #7c3aff 25%,
            #f000ff 40%,
            #ff6a00 55%,
            #00ffb3 70%,
            #0062ff 85%,
            #ffffff 100%
          )
        `,
        backgroundSize: '200% 200%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: 'drop-shadow(0 0 12px rgba(120, 80, 255, 0.5))',
      }}
    >
      Grandpa Project
    </h1>
  );
}
