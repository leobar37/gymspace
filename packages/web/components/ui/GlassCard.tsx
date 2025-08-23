'use client'

import { motion } from 'framer-motion'
import React from 'react'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  delay?: number
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hover = true,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      className={`glassmorphism rounded-2xl p-6 ${hover ? 'card-hover' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}