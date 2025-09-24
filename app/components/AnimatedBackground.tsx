'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
}

const AnimatedBackground = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generateParticles = () => {
      const colors = ['bg-green-500/20', 'bg-lime-400/20', 'bg-emerald-600/15', 'bg-yellow-400/15'];
      const newParticles: Particle[] = [];

      for (let i = 0; i < 25; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 150 + 80,
          color: colors[Math.floor(Math.random() * colors.length)],
          duration: Math.random() * 15 + 8,
        });
      }

      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Main Animated Gradient Background - Mimicking Dashboard Style */}
      <motion.div 
        key="animated-bg"
        className="absolute inset-0" 
        animate={{
          background: [
          ]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{ zIndex: -20 }}
      />

      {/* Floating Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${particle.color} blur-xl`}
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            x: [0, 150, -75, 0],
            y: [0, -120, 80, 0],
            scale: [1, 1.3, 0.7, 1],
            opacity: [0.4, 0.8, 0.5, 0.4],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Geometric Shapes */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 border-2 rounded-full"
        style={{ borderColor: '#293F2840' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className="absolute top-3/4 right-1/4 w-48 h-48 border-2 rounded-lg"
        style={{ borderColor: '#ADD90040' }}
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className="absolute top-1/2 left-3/4 w-32 h-32 rounded-full blur-lg"
        style={{
          background: 'radial-gradient(circle, #293F2830, #ADD90030)'
        }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
};

export default AnimatedBackground;