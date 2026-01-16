/**
 * ParticleOrb Component
 *
 * Animated particle sphere that visualizes voice state.
 * Uses Canvas 2D for performance (no Three.js dependency).
 *
 * States:
 * - idle: Particles floating gently (Genesis Purple)
 * - listening: Particles expanding with audio (brighter purple)
 * - processing: Particles spinning/condensing (Stella Purple)
 * - speaking: Particles pulsing with audio (Wave Blue)
 */

import React, { useRef, useEffect, useCallback } from 'react';
import type { VoiceState } from '../../types/voice';
import { COLORS } from '../../constants';

interface ParticleOrbProps {
  state: VoiceState;
  audioLevel: number; // 0-1
  size?: 'small' | 'large';
}

interface Particle {
  x: number;
  y: number;
  z: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  vx: number;
  vy: number;
  vz: number;
}

// Color mapping for states
const STATE_COLORS: Record<VoiceState, string> = {
  idle: COLORS.voiceIdle,
  listening: COLORS.voiceListening,
  processing: COLORS.voiceProcessing,
  speaking: COLORS.voiceSpeaking,
};

// Animation parameters
const PARTICLE_COUNT = 400;
const BASE_RADIUS = 100;

export const ParticleOrb: React.FC<ParticleOrbProps> = ({
  state,
  audioLevel,
  size = 'large',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const rotationRef = useRef({ x: 0, y: 0 });
  const targetColorRef = useRef(STATE_COLORS.idle);
  const currentColorRef = useRef(STATE_COLORS.idle);

  // Canvas dimensions
  const canvasSize = size === 'large' ? 300 : 150;
  const radius = size === 'large' ? BASE_RADIUS : BASE_RADIUS * 0.5;

  // Initialize particles in spherical formation
  const initParticles = useCallback(() => {
    const particles: Particle[] = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / PARTICLE_COUNT);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      particles.push({
        x, y, z,
        baseX: x,
        baseY: y,
        baseZ: z,
        vx: 0,
        vy: 0,
        vz: 0,
      });
    }

    particlesRef.current = particles;
  }, [radius]);

  // Parse hex color to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [109, 0, 255]; // Default genesis purple
  };

  // Lerp between colors
  const lerpColor = (from: string, to: string, t: number): string => {
    const [r1, g1, b1] = hexToRgb(from);
    const [r2, g2, b2] = hexToRgb(to);

    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Main animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update target color based on state
    targetColorRef.current = STATE_COLORS[state];

    // Smooth color transition
    currentColorRef.current = lerpColor(
      currentColorRef.current,
      targetColorRef.current,
      0.05
    );

    // Update rotation based on state
    const rotationSpeed = state === 'processing' ? 0.02 : 0.002;
    rotationRef.current.y += rotationSpeed;
    rotationRef.current.x += rotationSpeed * 0.3;

    // Calculate expansion based on state and audio
    let expansion = 1;
    if (state === 'listening') {
      expansion = 1 + audioLevel * 0.4;
    } else if (state === 'speaking') {
      expansion = 1 + audioLevel * 0.3;
    } else if (state === 'processing') {
      expansion = 0.85 + Math.sin(Date.now() * 0.005) * 0.1;
    }

    // Update and render particles
    const particles = particlesRef.current;
    const sortedParticles: { particle: Particle; projectedZ: number }[] = [];

    for (const particle of particles) {
      // Apply gentle floating motion
      const time = Date.now() * 0.001;
      const floatX = Math.sin(time + particle.baseX * 0.01) * 2;
      const floatY = Math.cos(time + particle.baseY * 0.01) * 2;
      const floatZ = Math.sin(time + particle.baseZ * 0.01) * 2;

      // Audio reactivity - particles respond to audio level
      const audioOffset = state === 'listening' || state === 'speaking'
        ? audioLevel * 20 * (Math.random() - 0.5)
        : 0;

      // Calculate target position with expansion
      const targetX = (particle.baseX + floatX + audioOffset) * expansion;
      const targetY = (particle.baseY + floatY + audioOffset) * expansion;
      const targetZ = (particle.baseZ + floatZ + audioOffset) * expansion;

      // Smooth interpolation to target
      particle.x += (targetX - particle.x) * 0.1;
      particle.y += (targetY - particle.y) * 0.1;
      particle.z += (targetZ - particle.z) * 0.1;

      // Apply rotation
      const cosY = Math.cos(rotationRef.current.y);
      const sinY = Math.sin(rotationRef.current.y);
      const cosX = Math.cos(rotationRef.current.x);
      const sinX = Math.sin(rotationRef.current.x);

      // Rotate around Y axis
      const rotatedX = particle.x * cosY - particle.z * sinY;
      const rotatedZ = particle.x * sinY + particle.z * cosY;

      // Rotate around X axis
      const rotatedY = particle.y * cosX - rotatedZ * sinX;
      const finalZ = particle.y * sinX + rotatedZ * cosX;

      sortedParticles.push({
        particle: { ...particle, x: rotatedX, y: rotatedY, z: finalZ } as Particle,
        projectedZ: finalZ,
      });
    }

    // Sort by Z for depth (back to front)
    sortedParticles.sort((a, b) => a.projectedZ - b.projectedZ);

    // Draw particles
    for (const { particle, projectedZ } of sortedParticles) {
      const scale = (radius + projectedZ) / (radius * 2);
      const alpha = 0.3 + scale * 0.7;
      const particleSize = (size === 'large' ? 2 : 1) * (0.5 + scale * 0.5);

      ctx.beginPath();
      ctx.arc(
        centerX + particle.x,
        centerY + particle.y,
        particleSize,
        0,
        Math.PI * 2
      );

      // Set color with alpha
      const [r, g, b] = hexToRgb(currentColorRef.current);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fill();
    }

    // Add glow effect
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radius * expansion
    );
    const [r, g, b] = hexToRgb(currentColorRef.current);
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.1)`);
    gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.05)`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    animationRef.current = requestAnimationFrame(animate);
  }, [state, audioLevel, size, radius]);

  // Initialize and start animation
  useEffect(() => {
    initParticles();
    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initParticles, animate]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      className="mx-auto"
      style={{
        filter: `drop-shadow(0 0 ${size === 'large' ? 30 : 15}px ${currentColorRef.current})`,
      }}
    />
  );
};

export default ParticleOrb;
