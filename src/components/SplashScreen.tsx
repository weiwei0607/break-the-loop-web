import { useEffect, useRef } from 'react';

interface Props {
  onDone: () => void;
}

export function SplashScreen({ onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const cx = W / 2, cy = H / 2;

    // ── Particles ──────────────────────────────────────
    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      life: number; maxLife: number;
      size: number; color: string;
      trail: { x: number; y: number }[];
    };

    const colors = ['#a3e635', '#84cc16', '#ffffff', '#d9f99d', '#65a30d'];
    const particles: Particle[] = [];

    function spawnRing(t: number) {
      const count = 80;
      const radius = 2 + t * 120;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + t * 0.5;
        const speed = 1.5 + Math.random() * 3;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        particles.push({
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
          vx, vy,
          life: 1,
          maxLife: 0.6 + Math.random() * 0.6,
          size: 1.5 + Math.random() * 2.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          trail: [],
        });
      }
    }

    // Periodic sparks
    function spawnSparks() {
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 20 + Math.random() * 80;
        particles.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 1, maxLife: 0.3 + Math.random() * 0.4,
          size: 1 + Math.random() * 1.5,
          color: '#a3e635',
          trail: [],
        });
      }
    }

    let frame = 0;
    let startTime = performance.now();
    let ringPhase = 0;
    const DURATION = 2000; // ms total

    let raf: number;
    function draw(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / DURATION, 1);

      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = '#09090B';
      ctx.fillRect(0, 0, W, H);

      // Ambient center glow
      const glowR = 80 + Math.sin(frame * 0.06) * 20;
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR * (1 + t));
      grd.addColorStop(0, `rgba(163,230,53,${0.18 * (1 - t * 0.5)})`);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      // Spawn rings at intervals
      if (frame % 18 === 0 && t < 0.75) {
        spawnRing(ringPhase);
        ringPhase += 0.08;
      }
      if (frame % 6 === 0 && t < 0.8) spawnSparks();

      // Update & draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 6) p.trail.shift();

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.life -= 0.016 / p.maxLife;

        if (p.life <= 0) { particles.splice(i, 1); continue; }

        // Trail
        for (let j = 0; j < p.trail.length - 1; j++) {
          const alpha = (j / p.trail.length) * p.life * 0.6;
          ctx.beginPath();
          ctx.moveTo(p.trail[j].x, p.trail[j].y);
          ctx.lineTo(p.trail[j + 1].x, p.trail[j + 1].y);
          ctx.strokeStyle = p.color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
          ctx.lineWidth = p.size * 0.5;
          ctx.stroke();
        }

        // Particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        const hex = p.color;
        ctx.fillStyle = hex;
        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Ring circles (expanding)
      for (let r = 0; r < 3; r++) {
        const phase = ((frame * 0.015) + r * 0.33) % 1;
        const ringRadius = phase * Math.max(W, H) * 0.8;
        const alpha = (1 - phase) * 0.15;
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(163,230,53,${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Center symbol: broken ring
      const ringSize = 40 + Math.sin(frame * 0.08) * 5;
      ctx.beginPath();
      ctx.arc(cx, cy, ringSize, 0.3, Math.PI * 2 - 0.3);
      ctx.strokeStyle = `rgba(163,230,53,${0.8 - t * 0.5})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text fade in
      if (t > 0.3) {
        const textAlpha = Math.min((t - 0.3) / 0.35, 1);
        ctx.save();
        ctx.globalAlpha = textAlpha;
        ctx.font = `bold ${Math.round(W * 0.07)}px Inter, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('BreakTheLoop', cx, cy - 8);
        ctx.font = `${Math.round(W * 0.035)}px Inter, sans-serif`;
        ctx.fillStyle = '#a3e635';
        ctx.fillText('打破你的舒適圈', cx, cy + 28);
        ctx.restore();
      }

      // Fade out at end
      if (t > 0.75) {
        const fadeAlpha = (t - 0.75) / 0.25;
        ctx.fillStyle = `rgba(9,9,11,${fadeAlpha})`;
        ctx.fillRect(0, 0, W, H);
      }

      frame++;

      if (t < 1) {
        raf = requestAnimationFrame(draw);
      } else {
        onDone();
      }
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] cursor-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
