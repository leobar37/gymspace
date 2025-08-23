'use client'

import { motion } from 'framer-motion'
import React from 'react'

export const FloatingOrbs: React.FC = () => {
  const orbs = [
    { size: 300, x: '10%', y: '20%', duration: 20 },
    { size: 200, x: '70%', y: '60%', duration: 25 },
    { size: 150, x: '85%', y: '15%', duration: 30 },
    { size: 250, x: '20%', y: '80%', duration: 22 },
    { size: 180, x: '50%', y: '40%', duration: 28 },
  ]

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {orbs.map((orb, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full bg-gradient-to-br from-gymspace-orange/20 to-gymspace-orange-light/10 blur-3xl"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
          }}
          animate={{
            x: [0, 30, -30, 0],
            y: [0, -30, 30, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}