import React, { useEffect, useRef } from 'react';
import { useJsonStore } from '../store/useJsonStore';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  color: string;
  size: number;
  width: number;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  decay: number;
}

export const ParticleOverlay: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const burstTrigger = useJsonStore((state) => state.burstTrigger);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastBurstTimeRef = useRef<number>(0);

  const colors = [
    '#3b82f6', // blue
    '#06b6d4', // cyan
    '#34d399', // emerald
    '#f59e0b', // amber
    '#fb7185', // rose
    '#a78bfa', // violet
    '#ec4899', // pink
    '#10b981', // green
    '#ef4444', // red
  ];
  
  const characters = ['{', '}', '[', ']', ':', ',', '"', 'JSON', 'YAML', 'JS', '✨', '⚡', '💎', '★'];

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Particle Simulation Loop
  const updateParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Additive blending so particles shine brightly over dark backgrounds
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';

    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // Gentle Gravity
      p.vx *= 0.97; // Smooth Friction
      p.vy *= 0.97;
      p.rotation += p.rotationSpeed;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.font = `bold ${p.size}px monospace`;

      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(Math.max(0.6, p.alpha), Math.max(0.6, p.alpha)); // Smooth shrinking effect
      ctx.shadowBlur = Math.max(8, p.size * 1.6);
      ctx.shadowColor = p.color;
      // Render text using precalculated width
      ctx.fillText(p.char, -p.width / 2, p.size / 2);
      
      ctx.restore();
    }

    if (particles.length > 0) {
      animationFrameIdRef.current = requestAnimationFrame(updateParticles);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animationFrameIdRef.current = null;
    }
  };

  // Trigger burst
  useEffect(() => {
    if (!burstTrigger) return;
    const { x, y } = burstTrigger;

    const now = Date.now();
    const timeSinceLastBurst = now - lastBurstTimeRef.current;
    lastBurstTimeRef.current = now;

    // Dynamically scale down particle counts if clicked rapidly, but keep it high for single clicks
    let particleCount = 20 + Math.floor(Math.random() * 12);
    if (timeSinceLastBurst < 250) {
      particleCount = 8 + Math.floor(Math.random() * 4);
    }

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 5.5;
      const char = characters[Math.floor(Math.random() * characters.length)];
      const size = 12 + Math.floor(Math.random() * 12);
      
      // Precompute monospace text width (roughly 60% of size times character length)
      const width = char.length * size * 0.6;

      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5, // Emphasize upward momentum
        char,
        color: colors[Math.floor(Math.random() * colors.length)],
        size,
        width,
        alpha: 0.96 + Math.random() * 0.08,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        decay: 0.012 + Math.random() * 0.01,
      });
    }

    // Cap total active particles to prevent lag under rapid clicks
    if (particlesRef.current.length > 120) {
      particlesRef.current.splice(0, particlesRef.current.length - 120);
    }

    if (animationFrameIdRef.current === null) {
      updateParticles();
    }
  }, [burstTrigger]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default ParticleOverlay;
