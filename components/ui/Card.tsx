import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`bg-card-light dark:bg-card-dark rounded-xl shadow-sm ${
        hover ? 'hover:shadow-lg transition-shadow' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
