'use client'

import { motion } from 'framer-motion'
import React from 'react'

interface GlowButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  href?: string
}

export const GlowButton: React.FC<GlowButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  href,
}) => {
  const baseClasses = 'relative inline-flex items-center justify-center font-medium transition-all duration-300 rounded-lg overflow-hidden group'
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  const variantClasses = {
    primary: 'bg-gradient-to-r from-gymspace-orange to-gymspace-orange-light text-white hover:from-gymspace-orange-dark hover:to-gymspace-orange',
    secondary: 'bg-gymspace-dark text-white hover:bg-gymspace-dark-light',
    outline: 'border-2 border-gymspace-orange text-gymspace-orange hover:bg-gymspace-orange hover:text-white',
  }

  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`

  const content = (
    <>
      <span className="relative z-10">{children}</span>
      {variant === 'primary' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-gymspace-orange-light to-gymspace-orange opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={false}
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          }}
        />
      )}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 glow-orange blur-xl" />
    </>
  )

  if (href) {
    return (
      <a href={href} className={combinedClasses}>
        {content}
      </a>
    )
  }

  return (
    <button onClick={onClick} className={combinedClasses}>
      {content}
    </button>
  )
}