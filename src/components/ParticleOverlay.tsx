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

  const colors = [
    '#3b82f6', // Monaco keywords / blue
    '#34d399', // JSON strings / emerald
    '#f59e0b', // Search highlight / amber
    '#fb7185', // JSON numbers / rose
    '#a78bfa', // JSON booleans / violet
  ];
  
  const characters = ['{', '}', '[', ']', ':', ',', '"', 'JSON', 'YAML', 'JS'];

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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // Gravity
      p.vx *= 0.98; // Friction
      p.vy *= 0.98;
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
      
      // Apply shadow glow for a satisfying neon look
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;

      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillText(p.char, -ctx.measureText(p.char).width / 2, p.size / 2);
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

    // Create 20 to 25 particles
    const particleCount = 20 + Math.floor(Math.random() * 8);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5, // Emphasize upward momentum
        char: characters[Math.floor(Math.random() * characters.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 10 + Math.floor(Math.random() * 12),
        alpha: 1.0,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
        decay: 0.015 + Math.random() * 0.015,
      });
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
