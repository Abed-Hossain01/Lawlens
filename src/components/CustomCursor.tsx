'use client';

import { useEffect, useState, useRef, useSyncExternalStore } from 'react';

const subscribeMounted = () => () => {};
const getMountedSnapshot = () => true;
const getMountedServerSnapshot = () => false;

export function CustomCursor() {
  const mounted = useSyncExternalStore(subscribeMounted, getMountedSnapshot, getMountedServerSnapshot);
  const [visible, setVisible] = useState(false);
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  const [isClicking, setIsClicking] = useState(false);

  // Positions
  const mousePos = useRef({ x: -100, y: -100 });
  const trailPos = useRef({ x: -100, y: -100 });
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Only enable on fine pointer devices (desktop mouse, trackpad)
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isFinePointer || isReducedMotion) {
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);

      // Check hovered interactive elements
      const target = e.target as HTMLElement | null;
      if (target) {
        if (target.closest('button') || target.closest('a') || target.closest('[role="button"]') || target.closest('[role="tab"]')) {
          setHoveredType('button');
        } else if (target.closest('input') || target.closest('select') || target.closest('textarea')) {
          setHoveredType('input');
        } else if (target.closest('[data-flag-defect="true"]') || target.closest('.bg-vermillion\\/10')) {
          setHoveredType('defect');
        } else {
          setHoveredType(null);
        }
      }
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);

    const onMouseLeave = () => setVisible(false);
    const onMouseEnter = () => setVisible(true);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    // Smooth trailing physics loop
    const render = () => {
      // Lerp trailing ring
      const ease = 0.16;
      trailPos.current.x += (mousePos.current.x - trailPos.current.x) * ease;
      trailPos.current.y += (mousePos.current.y - trailPos.current.y) * ease;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0)`;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${trailPos.current.x}px, ${trailPos.current.y}px, 0)`;
      }

      rafId.current = requestAnimationFrame(render);
    };

    rafId.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [visible]);

  if (!mounted) return null;

  const isButton = hoveredType === 'button';
  const isDefect = hoveredType === 'defect';

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[99999] transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* 1. Precision Center Dot (Follows cursor instantly) */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 -ml-1 -mt-1 rounded-full bg-green-deep pointer-events-none shadow-xs transition-transform duration-0"
        style={{
          boxShadow: isDefect
            ? '0 0 8px #c0392b'
            : isButton
            ? '0 0 6px #2d6a4f'
            : '0 0 4px rgba(27,67,50,0.6)',
        }}
      />

      {/* 2. Responsive Trailing Lens / Reticle (Smooth damped trailing) */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 -ml-5 -mt-5 rounded-full pointer-events-none transition-[width,height,border-color,background-color] duration-150 ease-out flex items-center justify-center ${
          isClicking
            ? 'w-6 h-6 -ml-3 -mt-3 scale-90 border-2 bg-brass/30 border-brass'
            : isDefect
            ? 'w-14 h-14 -ml-7 -mt-7 border-2 border-vermillion bg-vermillion/15 animate-pulse'
            : isButton
            ? 'w-12 h-12 -ml-6 -mt-6 border-2 border-green-mid bg-green-deep/10 scale-110 shadow-sm'
            : 'w-10 h-10 -ml-5 -mt-5 border border-brass/60 bg-brass/5'
        }`}
      >
        {/* Reticle Fine Crosshairs when idle */}
        {!isButton && !isClicking && (
          <div className="relative w-full h-full flex items-center justify-center opacity-40">
            <div className="absolute w-2 h-[1px] bg-brass left-1" />
            <div className="absolute w-2 h-[1px] bg-brass right-1" />
            <div className="absolute h-2 w-[1px] bg-brass top-1" />
            <div className="absolute h-2 w-[1px] bg-brass bottom-1" />
          </div>
        )}

        {/* Hover Inspect badge */}
        {isButton && (
          <span className="text-[8px] font-mono font-bold tracking-widest uppercase text-green-deep opacity-80">
            VIEW
          </span>
        )}
      </div>
    </div>
  );
}
