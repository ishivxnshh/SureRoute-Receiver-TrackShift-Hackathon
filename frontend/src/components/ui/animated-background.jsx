// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import { useMemo } from 'react'

// Pre-generate random values outside component for stable references
const generateParticles = () => {
  const particles = []
  for (let i = 0; i < 20; i++) {
    particles.push({
      left: (i * 47) % 100,  // Pseudo-random but deterministic
      top: (i * 73) % 100,
      duration: 3 + ((i * 31) % 40) / 10,
      delay: ((i * 19) % 20) / 10,
    })
  }
  return particles
}

export default function AnimatedBackground() {
  const particles = useMemo(() => generateParticles(), [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-slate-900 to-black" />
      
      {/* Animated orbs */}
      <motion.div
        className="absolute top-0 -left-4 w-96 h-96 bg-purple-600 rounded-full mix-blend-lighten filter blur-xl opacity-20"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute top-0 right-4 w-96 h-96 bg-blue-600 rounded-full mix-blend-lighten filter blur-xl opacity-20"
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-600 rounded-full mix-blend-lighten filter blur-xl opacity-20"
        animate={{
          x: [0, 50, 0],
          y: [0, -50, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Floating particles */}
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full opacity-40"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  )
}
