import React, { useEffect, useRef } from 'react';

interface TrailParticle {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  decay: number;
  rotation: number;
  rotationSpeed: number;
  char?: string;
  type: 'halo' | 'ribbon' | 'spark' | 'glyph';
  life: number;
  maxLife: number;
  turbulence: number;
}

// Professional easing functions
const easing = {
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
};

export const CursorTrail: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<TrailParticle[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0, magnitude: 0 });
  const moveTimeoutRef = useRef<number | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const colors = [
    { main: '#3b82f6', light: '#60a5fa', dark: '#1e40af' },
    { main: '#06b6d4', light: '#22d3ee', dark: '#0369a1' },
    { main: '#34d399', light: '#6ee7b7', dark: '#059669' },
    { main: '#8b5cf6', light: '#a78bfa', dark: '#5b21b6' },
    { main: '#ec4899', light: '#f472b6', dark: '#be185d' },
    { main: '#f59e0b', light: '#fbbf24', dark: '#92400e' },
  ];

  const glyphs = ['◆', '✦', '✧', '▪', '●', '▯', '⬢', '⬡'];

  // Setup canvas
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

  // Advanced animation loop with professional rendering
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    timeRef.current += 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';

    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.px = p.x;
      p.py = p.y;

      const damping = 0.94;
      p.vx *= damping;
      p.vy *= damping;
      
      p.vy += 0.035;
      p.vx += Math.sin(timeRef.current * 0.01 + p.turbulence) * 0.01;

      p.x += p.vx;
      p.y += p.vy;

      p.life += 1;
      const lifeProgress = p.life / p.maxLife;
      
      p.opacity = Math.max(0, (1 - lifeProgress) * (1 - lifeProgress));
      p.rotation += p.rotationSpeed;

      if (p.opacity <= 0.01) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();

      if (p.type === 'halo') {
        renderHalo(ctx, p, lifeProgress);
      } else if (p.type === 'ribbon') {
        renderRibbon(ctx, p);
      } else if (p.type === 'spark') {
        renderSpark(ctx, p);
      } else if (p.type === 'glyph') {
        renderGlyph(ctx, p, lifeProgress);
      }

      ctx.restore();
    }

    if (particles.length > 0) {
      animationFrameIdRef.current = requestAnimationFrame(animate);
    } else {
      animationFrameIdRef.current = null;
    }
  };

  const renderHalo = (ctx: CanvasRenderingContext2D, p: TrailParticle, progress: number) => {
    const eased = easing.easeOutCubic(progress);
    
    ctx.globalAlpha = p.opacity * 0.25 * eased;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();

    ctx.globalAlpha = p.opacity * 0.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();

    ctx.globalAlpha = p.opacity * 0.9;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  };

  const renderRibbon = (ctx: CanvasRenderingContext2D, p: TrailParticle) => {
    ctx.globalAlpha = p.opacity * 0.5;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(p.px, p.py);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();

    ctx.globalAlpha = p.opacity * 0.8;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = p.size * 0.3;
    ctx.beginPath();
    ctx.moveTo(p.px, p.py);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const renderSpark = (ctx: CanvasRenderingContext2D, p: TrailParticle) => {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.size * 0.7;
    ctx.lineCap = 'round';
    ctx.globalAlpha = p.opacity * 0.7;
    ctx.beginPath();
    ctx.moveTo(p.px, p.py);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();

    ctx.globalAlpha = p.opacity * 0.9;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  };

  const renderGlyph = (ctx: CanvasRenderingContext2D, p: TrailParticle, progress: number) => {
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    
    const eased = easing.easeInOutQuad(progress);
    const scale = 1 - eased * 0.3;
    ctx.scale(scale, scale);

    ctx.globalAlpha = p.opacity * 0.8;
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${p.size}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.char || '◆', 0, 0);
  };

  // Handle mouse move with intelligent particle generation
  const handleMouseMove = (e: MouseEvent) => {
    const { clientX, clientY } = e;
    const { x: lastX, y: lastY } = lastPositionRef.current;

    const dx = clientX - lastX;
    const dy = clientY - lastY;
    const dist = Math.hypot(dx, dy);

    velocityRef.current = {
      x: dx * 0.85,
      y: dy * 0.85,
      magnitude: dist,
    };

    if (dist > 3) {
      const particleCount = Math.min(3, Math.max(1, Math.floor(dist / 8)));
      const typeRatio = Math.min(1, dist / 40);

      for (let i = 0; i < particleCount; i++) {
        const rand = Math.random();
        let type: 'halo' | 'ribbon' | 'spark' | 'glyph';

        if (rand > typeRatio + 0.3) {
          type = 'halo';
        } else if (rand > typeRatio + 0.1) {
          type = 'ribbon';
        } else if (rand > typeRatio) {
          type = 'spark';
        } else {
          type = 'glyph';
        }

        const colorPalette = colors[Math.floor(Math.random() * colors.length)];
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.6 + Math.random() * 2;
        const turbulence = Math.random() * 8;
        const maxLife = 35 + Math.random() * 25;

        particlesRef.current.push({
          x: clientX + (Math.random() - 0.5) * 8,
          y: clientY + (Math.random() - 0.5) * 8,
          px: clientX,
          py: clientY,
          vx: Math.cos(angle) * speed + velocityRef.current.x * 0.3,
          vy: Math.sin(angle) * speed + velocityRef.current.y * 0.3,
          size: type === 'glyph' ? 8 + Math.random() * 4 : 3 + Math.random() * 3,
          opacity: 0.9 + Math.random() * 0.1,
          color: colorPalette.main,
          decay: 0.01,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.15,
          type,
          char: type === 'glyph' ? glyphs[Math.floor(Math.random() * glyphs.length)] : undefined,
          life: 0,
          maxLife,
          turbulence,
        });
      }

      if (particlesRef.current.length > 80) {
        particlesRef.current.splice(0, particlesRef.current.length - 80);
      }

      lastPositionRef.current = { x: clientX, y: clientY };

      if (animationFrameIdRef.current === null) {
        animate();
      }

      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
      }

      moveTimeoutRef.current = setTimeout(() => {
        // Particles fade naturally
      }, 150);
    }
  };

  // Handle clicks with burst effect
  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      target.closest('button, a, input, textarea, select, label, [role="button"]')
    ) {
      return;
    }

    const { clientX, clientY } = e;
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;
    lastClickTimeRef.current = now;

    let burstCount = 10 + Math.floor(Math.random() * 6);
    if (timeSinceLastClick < 250) {
      burstCount = 5 + Math.floor(Math.random() * 3);
    }

    const colorPalette = colors[Math.floor(Math.random() * colors.length)];

    for (let i = 0; i < burstCount; i++) {
      const angle = (i / burstCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const speed = 2.5 + Math.random() * 3;
      const rand = Math.random();
      const type: 'halo' | 'spark' = rand > 0.4 ? 'spark' : 'halo';
      const maxLife = 50 + Math.random() * 30;

      particlesRef.current.push({
        x: clientX,
        y: clientY,
        px: clientX,
        py: clientY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: type === 'halo' ? 4 + Math.random() * 3 : 3 + Math.random() * 2.5,
        opacity: 0.95,
        color: colorPalette.main,
        decay: 0.008,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        type,
        life: 0,
        maxLife,
        turbulence: Math.random() * 5,
      });
    }

    if (particlesRef.current.length > 60) {
      particlesRef.current.splice(0, particlesRef.current.length - 60);
    }

    if (animationFrameIdRef.current === null) {
      animate();
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
      }
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9998]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default CursorTrail;

