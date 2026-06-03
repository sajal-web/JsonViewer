import React, { useEffect, useRef } from 'react';

interface TrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  decay: number;
  rotation: number;
  rotationSpeed: number;
  char?: string;
  type: 'glow' | 'star' | 'char';
  distFromOrigin: number;
}

export const CursorTrail: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<TrailParticle[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const moveTimeoutRef = useRef<number | null>(null);
  const lastClickTimeRef = useRef<number>(0);

  const colors = [
    '#3b82f6', // blue
    '#06b6d4', // cyan
    '#34d399', // emerald
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f59e0b', // amber
    '#ef4444', // red
    '#10b981', // green
  ];

  const chars = ['✨', '⚡', '💎', '🎯', '✓', '→', '◆', '★', '♦'];

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

  // Advanced animation loop
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use an additive blend to make colors pop against the background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';

    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      
      // Physics: apply velocity and gravity for swirling effect
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.vy += 0.05; // slight gravity
      
      p.x += p.vx;
      p.y += p.vy;
      p.opacity -= p.decay;
      p.rotation += p.rotationSpeed;
      p.distFromOrigin += 0.5;

      if (p.opacity <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.opacity;

      if (p.type === 'glow') {
        // High-performance double-circle neon glow
        ctx.save();
        ctx.shadowBlur = Math.max(6, p.size * 2);
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.min(1, p.opacity * 0.35);
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = Math.min(1, p.opacity * 0.95);
        ctx.fill();
      } else if (p.type === 'star') {
        // Draw a rotating star
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.font = `bold ${p.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', 0, 0);
      } else if (p.type === 'char' && p.char) {
        // Draw emoji/char
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.font = `${p.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.char, 0, 0);
      }

      ctx.restore();
    }

    if (particles.length > 0) {
      animationFrameIdRef.current = requestAnimationFrame(animate);
    } else {
      animationFrameIdRef.current = null;
    }
  };

  // Handle mouse move
  const handleMouseMove = (e: MouseEvent) => {
    const { clientX, clientY } = e;
    const { x: lastX, y: lastY } = lastPositionRef.current;

    // Calculate distance and velocity
    const dx = clientX - lastX;
    const dy = clientY - lastY;
    const dist = Math.hypot(dx, dy);

    // Update velocity for particles to inherit movement
    velocityRef.current = {
      x: dx * 0.8,
      y: dy * 0.8,
    };

    // Only create particles if moved more than threshold
    if (dist > 4) {
      const particleCount = Math.min(6, Math.ceil(dist / 6));
      
      for (let i = 0; i < particleCount; i++) {
        const randomType = Math.random();
        let type: 'glow' | 'star' | 'char' = 'glow';
        let char: string | undefined;

        if (randomType > 0.85) {
          type = 'char';
          char = chars[Math.floor(Math.random() * chars.length)];
        } else if (randomType > 0.65) {
          type = 'star';
        }

        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2;

        particlesRef.current.push({
          x: clientX + (Math.random() - 0.5) * 10,
          y: clientY + (Math.random() - 0.5) * 10,
          vx: Math.cos(angle) * speed + velocityRef.current.x * 0.5,
          vy: Math.sin(angle) * speed + velocityRef.current.y * 0.5,
          size: type === 'char' ? 14 + Math.random() * 6 : 6 + Math.random() * 5,
          opacity: 0.88 + Math.random() * 0.22,
          color: colors[Math.floor(Math.random() * colors.length)],
          decay: 0.01 + Math.random() * 0.012,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          char,
          type,
          distFromOrigin: 0,
        });
      }

      // Cap total active particles for smooth trail
      if (particlesRef.current.length > 140) {
        particlesRef.current.splice(0, particlesRef.current.length - 140);
      }

      lastPositionRef.current = { x: clientX, y: clientY };

      // Start animation if not running
      if (animationFrameIdRef.current === null) {
        animate();
      }

      // Clear existing timeout
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
      }

      // Set timeout to stop adding particles after movement stops
      moveTimeoutRef.current = setTimeout(() => {
        // Keep existing particles to fade out naturally
      }, 200);
    }
  };

  // Handle clicks for burst effect
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

    // Rich burst count scaled down dynamically if clicked extremely fast
    let burstCount = 12 + Math.floor(Math.random() * 8);
    if (timeSinceLastClick < 250) {
      burstCount = 6 + Math.floor(Math.random() * 4);
    }

    for (let i = 0; i < burstCount; i++) {
      const angle = (i / burstCount) * Math.PI * 2;
      const speed = 3.5 + Math.random() * 4;
      const randomType = Math.random() > 0.5 ? 'star' : 'char';

      particlesRef.current.push({
        x: clientX,
        y: clientY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: randomType === 'char' ? 14 + Math.random() * 6 : 7 + Math.random() * 5,
        opacity: 0.92 + Math.random() * 0.08,
        color: colors[Math.floor(Math.random() * colors.length)],
        decay: 0.012 + Math.random() * 0.01,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        char: randomType === 'char' ? chars[Math.floor(Math.random() * chars.length)] : undefined,
        type: randomType as 'star' | 'char',
        distFromOrigin: 0,
      });
    }

    // Cap total active particles
    if (particlesRef.current.length > 80) {
      particlesRef.current.splice(0, particlesRef.current.length - 80);
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
