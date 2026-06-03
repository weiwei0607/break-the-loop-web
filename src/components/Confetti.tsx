import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  shape: 'rect' | 'circle' | 'triangle';
}

const COLORS = [
  '#a3e635', // brand-light
  '#fb923c', // orange
  '#4ade80', // green
  '#f9a8d4', // pink
  '#60a5fa', // blue
  '#fde68a', // yellow
  '#c084fc', // purple
];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 8,
    delay: Math.random() * 0.8,
    duration: 1.2 + Math.random() * 1.0,
    shape: (['rect', 'circle', 'triangle'] as const)[Math.floor(Math.random() * 3)],
  }));
}

interface Props {
  active: boolean;
  count?: number;
}

export const Confetti: React.FC<Props> = ({ active, count = 40 }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setParticles(generateParticles(count));
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [active, count]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 9999 }}
      aria-hidden="true"
    >
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute top-0"
          style={{
            left: `${p.x}%`,
            animationName: 'confettiFall',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            animationTimingFunction: 'ease-in',
            animationFillMode: 'forwards',
            opacity: 1,
          }}
        >
          {p.shape === 'rect' && (
            <div
              style={{
                width: p.size,
                height: p.size * 0.5,
                backgroundColor: p.color,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          )}
          {p.shape === 'circle' && (
            <div
              style={{
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                backgroundColor: p.color,
              }}
            />
          )}
          {p.shape === 'triangle' && (
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `${p.size / 2}px solid transparent`,
                borderRight: `${p.size / 2}px solid transparent`,
                borderBottom: `${p.size}px solid ${p.color}`,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};
